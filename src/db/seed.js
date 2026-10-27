import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './pool.js';
import { runMigrations } from './migrate.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function seedIdentityKey(entityType, identityParts) {
  return `${entityType}:${JSON.stringify(identityParts)}`;
}

async function rememberSeedEntity(client, seedKey, entityType, entityId) {
  await client.query(
    `INSERT INTO seed_entity_identity (seed_key, entity_type, entity_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (seed_key) DO UPDATE SET
       entity_type = EXCLUDED.entity_type,
       entity_id = EXCLUDED.entity_id;`,
    [seedKey, entityType, entityId]
  );
}

async function findSeedEntityId(client, seedKey, entityType, tableName, legacySql, legacyParams = []) {
  const mapped = await client.query(
    'SELECT entity_id FROM seed_entity_identity WHERE seed_key = $1 AND entity_type = $2;',
    [seedKey, entityType]
  );

  if (mapped.rowCount > 0) {
    const existingById = await client.query(
      `SELECT id FROM ${tableName} WHERE id = $1 LIMIT 1;`,
      [mapped.rows[0].entity_id]
    );
    if (existingById.rowCount > 0) return existingById.rows[0].id;
  }

  if (legacySql) {
    const legacy = await client.query(legacySql, legacyParams);
    if (legacy.rowCount > 0) {
      const id = legacy.rows[0].id;
      await rememberSeedEntity(client, seedKey, entityType, id);
      return id;
    }
  }

  return null;
}


export async function seedDatabase() {
  console.log('[SEED] Baza ma\'lumotlarini kiritish (seed) boshlandi...');
  
  // 1. Ensure migrations are applied
  await runMigrations();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Seed Faculties
    const instituteData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_institute.json'), 'utf-8')
    );

    const facultyMap = new Map();
    for (const fac of instituteData.faculties) {
      const key = seedIdentityKey('faculty', [fac.name]);
      let facultyId = await findSeedEntityId(
        client, key, 'faculty', 'faculties',
        'SELECT id FROM faculties WHERE name = $1 LIMIT 1;',
        [fac.name]
      );

      if (!facultyId) {
        const ins = await client.query(
          `INSERT INTO faculties (name, dean_name, description)
           VALUES ($1, $2, $3)
           RETURNING id;`,
          [fac.name, fac.dean, `Yo'nalishlar: ${fac.directions.join(', ')}`]
        );
        facultyId = ins.rows[0].id;
        await rememberSeedEntity(client, key, 'faculty', facultyId);
      }
      facultyMap.set(fac.name, facultyId);
    }
    console.log(`[SEED] ${facultyMap.size} ta fakultet kiritildi/tekshirildi.`);

    // 3. Seed Departments & Subjects
    const deptsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_departments.json'), 'utf-8')
    );

    let insertedSubjectsCount = 0;
    const deptMap = new Map();

    for (const d of deptsData) {
      const departmentKey = seedIdentityKey('department', [d.name, d.level]);
      let deptId = await findSeedEntityId(
        client, departmentKey, 'department', 'departments',
        'SELECT id FROM departments WHERE name = $1 AND level = $2 LIMIT 1;',
        [d.name, d.level]
      );

      if (!deptId) {
        const ins = await client.query(
          `INSERT INTO departments (name, level, head_name, contact_phone)
           VALUES ($1, $2, $3, $4)
           RETURNING id;`,
          [d.name, d.level, d.headName || null, d.contactPhone || null]
        );
        deptId = ins.rows[0].id;
        await rememberSeedEntity(client, departmentKey, 'department', deptId);
      }
      // Existing records are intentionally not overwritten: admins may have edited them.
      deptMap.set(`${d.name}_${d.level}`, deptId);

      // Seed the original head as a stable identity so editing their name won't duplicate them.
      if (d.headName) {
        const teacherKey = seedIdentityKey('department_head_teacher', [d.name, d.level]);
        let teacherId = await findSeedEntityId(
          client, teacherKey, 'teacher', 'teachers',
          'SELECT id FROM teachers WHERE full_name = $1 AND department_id = $2 LIMIT 1;',
          [d.headName, deptId]
        );
        if (!teacherId) {
          const teacherIns = await client.query(
            `INSERT INTO teachers (full_name, department_id, position, official_contact, source)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id;`,
            [d.headName, deptId, 'Kafedra mudiri', d.contactPhone, "O'quv auditoriyalar fondi buyrug'i"]
          );
          teacherId = teacherIns.rows[0].id;
          await rememberSeedEntity(client, teacherKey, 'teacher', teacherId);
        }
      }

      // Seed subjects. Seed identity survives a display-name edit.
      for (const s of d.subjects) {
        const subjectKey = seedIdentityKey('subject', [d.name, d.level, s.name, s.courses, s.semesters]);
        let subjectId = await findSeedEntityId(
          client, subjectKey, 'subject', 'subjects',
          'SELECT id FROM subjects WHERE department_id = $1 AND name = $2 AND courses = $3 AND semesters = $4 LIMIT 1;',
          [deptId, s.name, s.courses, s.semesters]
        );
        if (!subjectId) {
          const ins = await client.query(
            `INSERT INTO subjects (department_id, name, courses, semesters, level)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id;`,
            [deptId, s.name, s.courses, s.semesters, s.level]
          );
          subjectId = ins.rows[0].id;
          insertedSubjectsCount++;
          await rememberSeedEntity(client, subjectKey, 'subject', subjectId);
        }
      }
    }
    console.log(`[SEED] ${deptMap.size} ta kafedra bo'limi va ${insertedSubjectsCount} ta yangi fanlar bazaga kiritildi.`);

    // 4. Seed Clinical Bases & Rooms
    const roomsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_rooms.json'), 'utf-8')
    );

    let insertedBasesCount = 0;
    let insertedRoomsCount = 0;

    for (const base of roomsData) {
      const baseKey = seedIdentityKey('clinical_base', [base.name]);
      let baseId = await findSeedEntityId(
        client, baseKey, 'clinical_base', 'clinical_bases',
        'SELECT id FROM clinical_bases WHERE name = $1 LIMIT 1;',
        [base.name]
      );

      if (!baseId) {
        const ins = await client.query(
          `INSERT INTO clinical_bases (name, department_name, head_name, contact_phone, total_rooms, total_capacity)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id;`,
          [base.name, base.department, base.head, base.phone, base.totalRooms, base.totalCapacity]
        );
        baseId = ins.rows[0].id;
        insertedBasesCount++;
        await rememberSeedEntity(client, baseKey, 'clinical_base', baseId);
      }

      for (const r of base.rooms) {
        const roomKey = seedIdentityKey('room', [base.name, r.roomNumber, r.type]);
        let roomId = await findSeedEntityId(
          client, roomKey, 'room', 'rooms',
          'SELECT id FROM rooms WHERE clinical_base_id = $1 AND room_number = $2 AND room_type = $3 LIMIT 1;',
          [baseId, r.roomNumber, r.type]
        );
        if (!roomId) {
          const roomIns = await client.query(
            `INSERT INTO rooms (clinical_base_id, room_number, room_type, capacity, department_name)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id;`,
            [baseId, r.roomNumber, r.type, r.capacity, r.department || base.department]
          );
          roomId = roomIns.rows[0].id;
          insertedRoomsCount++;
          await rememberSeedEntity(client, roomKey, 'room', roomId);
        }
      }
    }
    console.log(`[SEED] ${roomsData.length} ta klinik baza va ${insertedRoomsCount} ta auditoriya kiritildi.`);

    // 5. Seed Academic Calendars
    const calendarData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_calendar.json'), 'utf-8')
    );

    let insertedCalendarsCount = 0;
    for (const group of calendarData) {
      const course = group.course;
      for (const dir of group.directions) {
        const calendarKey = seedIdentityKey('academic_calendar', [course, dir.name]);
        let calendarId = await findSeedEntityId(
          client, calendarKey, 'academic_calendar', 'academic_calendars',
          'SELECT id FROM academic_calendars WHERE course = $1 AND direction_name = $2 LIMIT 1;',
          [course, dir.name]
        );
        if (!calendarId) {
          const ins = await client.query(
            `INSERT INTO academic_calendars
             (course, direction_name, theory_weeks, internship_weeks, attestation_weeks, credit_intro_weeks, vacation_weeks, state_exam_weeks, gpa_weeks, total_weeks, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING id;`,
            [
              course,
              dir.name,
              dir.theoryWeeks,
              dir.internshipWeeks,
              dir.attestationWeeks,
              dir.creditIntroWeeks,
              dir.vacationWeeks,
              dir.stateExamWeeks,
              dir.gpaWeeks,
              dir.totalWeeks,
              "O'quv ishlari bo'yicha prorektor U.A. Boltaboyev tasdiqlagan 2026/2027 o'quv jarayoni jadvali"
            ]
          );
          calendarId = ins.rows[0].id;
          insertedCalendarsCount++;
          await rememberSeedEntity(client, calendarKey, 'academic_calendar', calendarId);
        }
      }
    }
    console.log(`[SEED] ${insertedCalendarsCount} ta o'quv jarayoni grafigi yozuvlari kiritildi.`);

    // 6. Seed Student Services
    const servicesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_services.json'), 'utf-8')
    );

    for (const s of servicesData) {
      await client.query(
        `INSERT INTO student_services (category, title, short_description, content, source_url)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (category) DO NOTHING;`,
        [s.category, s.title, s.shortDescription, s.content, s.sourceUrl]
      );
    }
    console.log(`[SEED] ${servicesData.length} ta talaba xizmatlari yo'riqnomasi kiritildi.`);

    // 7. Seed Initial Books / Library Resources (official ARM links)
    const initialBooks = [
      {
        title: "Odam anatomiyasi (Atlas va darslik)",
        author: "B.X. Xamidov, R.E. Xudoyberdiyev",
        subjectName: "Odam anatomiyasi",
        course: 1,
        fileUrl: "https://library.fjsti.uz/book/anatomiya-1",
        source: "FJSTI Axborot-resurs markazi (ARM)"
      },
      {
        title: "Gistologiya, sitologiya va embriologiya",
        author: "Q.R. To'xtayev",
        subjectName: "Gistologiya, sitologiya, embriologiya",
        course: 1,
        fileUrl: "https://library.fjsti.uz/book/gistologiya-1",
        source: "FJSTI Axborot-resurs markazi (ARM)"
      },
      {
        title: "Ichki kasalliklar propedevtikasi",
        author: "A.L. Grebenev (O'zbekcha tarjima)",
        subjectName: "Ichki kasalliklar propedevtikasi",
        course: 3,
        fileUrl: "https://library.fjsti.uz/book/propedevtika-3",
        source: "FJSTI Axborot-resurs markazi (ARM)"
      },
      {
        title: "Farmakologiya",
        author: "S.S. Azizova",
        subjectName: "Farmakologiya",
        course: 3,
        fileUrl: "https://library.fjsti.uz/book/farmakologiya-3",
        source: "FJSTI Axborot-resurs markazi (ARM)"
      },
      {
        title: "Umumiy xirurgiya asoslari",
        author: "Sh.I. Karimov",
        subjectName: "Umumiy xirurgiya",
        course: 3,
        fileUrl: "https://library.fjsti.uz/book/xirurgiya-3",
        source: "FJSTI Axborot-resurs markazi (ARM)"
      }
    ];

    for (const b of initialBooks) {
      const bookKey = seedIdentityKey('initial_book', [b.fileUrl]);
      let bookId = await findSeedEntityId(
        client, bookKey, 'book', 'books',
        'SELECT id FROM books WHERE title = $1 AND file_url IS NOT DISTINCT FROM $2 LIMIT 1;',
        [b.title, b.fileUrl]
      );
      if (!bookId) {
        const ins = await client.query(
          `INSERT INTO books (title, author, subject_name, course, file_url, source)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id;`,
          [b.title, b.author, b.subjectName, b.course, b.fileUrl, b.source]
        );
        bookId = ins.rows[0].id;
        await rememberSeedEntity(client, bookKey, 'book', bookId);
      }
    }
    console.log(`[SEED] Boshlang'ich ARM kutubxona kitoblari kiritildi.`);

    // 8. Seed Admins from config
    for (const adminId of config.adminIds) {
      await client.query(
        `INSERT INTO admins (telegram_id, full_name, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (telegram_id) DO NOTHING;`,
        [adminId, 'Super Admin', 'superadmin']
      );
    }
    if (config.adminIds.length > 0) {
      console.log(`[SEED] ${config.adminIds.length} ta admin ro'yxatga olindi.`);
    }

    await client.query('COMMIT');
    console.log('[SEED] Ma\'lumotlar bazasi muvaffaqiyatli to\'ldirildi (100% verified seed complete)!');
    return { success: true };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[SEED ERROR]:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// CLI runner
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedDatabase()
    .then(async () => {
      await closePool();
      process.exit(0);
    })
    .catch(async (err) => {
      await closePool();
      console.error(err);
      process.exit(1);
    });
}
