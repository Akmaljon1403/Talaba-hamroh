import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool, closePool } from './pool.js';
import { runMigrations } from './migrate.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedDatabase() {
  console.log('[SEED] Baza ma\'lumotlarini kiritish (seed) boshlandi...');
  
  // 1. Ensure migrations are applied
  await runMigrations();

  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Keep environment-configured bootstrap administrators as superadmins on every start.
    for (const adminId of config.adminIds) {
      await client.query(
        `INSERT INTO admins (telegram_id, full_name, role)
         VALUES ($1, 'Super Admin', 'superadmin')
         ON CONFLICT (telegram_id) DO UPDATE SET role = 'superadmin';`,
        [String(adminId)]
      );
    }

    // Apply the official seed only once. This protects later canonical admin edits
    // from being overwritten or duplicated on a restart/redeploy.
    const seedVersion = '001_verified_official_dataset';
    const seedAlreadyApplied = await client.query(
      'SELECT version FROM seed_versions WHERE version = $1 LIMIT 1;',
      [seedVersion]
    );
    if (seedAlreadyApplied.rowCount > 0) {
      await client.query('COMMIT');
      console.log('[SEED] Rasmiy boshlang‘ich ma’lumotlar oldin yuklangan; admin tahrirlari saqlandi.');
      return { success: true, skipped: true };
    }


    // 2. Seed Faculties
    const instituteData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_institute.json'), 'utf-8')
    );

    const facultyMap = new Map();
    for (const fac of instituteData.faculties) {
      const res = await client.query(
        `INSERT INTO faculties (name, dean_name, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (name) DO UPDATE SET
           dean_name = EXCLUDED.dean_name,
           description = EXCLUDED.description
         RETURNING id, name;`,
        [fac.name, fac.dean, `Yo'nalishlar: ${fac.directions.join(', ')}`]
      );
      facultyMap.set(fac.name, res.rows[0].id);
    }
    console.log(`[SEED] ${facultyMap.size} ta fakultet kiritildi/yangilandi.`);

    // 3. Seed Departments & Subjects
    const deptsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/verified_departments.json'), 'utf-8')
    );

    let insertedSubjectsCount = 0;
    const deptMap = new Map();

    for (const d of deptsData) {
      // Check if department exists
      let deptRes = await client.query(
        `SELECT id FROM departments WHERE name = $1 AND level = $2 LIMIT 1;`,
        [d.name, d.level]
      );

      let deptId;
      if (deptRes.rowCount === 0) {
        const ins = await client.query(
          `INSERT INTO departments (name, level, head_name, contact_phone)
           VALUES ($1, $2, $3, $4)
           RETURNING id;`,
          [d.name, d.level, d.headName || null, d.contactPhone || null]
        );
        deptId = ins.rows[0].id;
      } else {
        deptId = deptRes.rows[0].id;
        if (d.headName || d.contactPhone) {
          await client.query(
            `UPDATE departments SET head_name = COALESCE($1, head_name), contact_phone = COALESCE($2, contact_phone) WHERE id = $3;`,
            [d.headName, d.contactPhone, deptId]
          );
        }
      }
      deptMap.set(`${d.name}_${d.level}`, deptId);

      // Seed teachers if headName exists
      if (d.headName) {
        const teacherRes = await client.query(
          `SELECT id FROM teachers WHERE full_name = $1 AND department_id = $2;`,
          [d.headName, deptId]
        );
        if (teacherRes.rowCount === 0) {
          await client.query(
            `INSERT INTO teachers (full_name, department_id, position, official_contact, source)
             VALUES ($1, $2, $3, $4, $5);`,
            [d.headName, deptId, 'Kafedra mudiri', d.contactPhone, "O'quv auditoriyalar fondi buyrug'i"]
          );
        }
      }

      // Seed subjects
      for (const s of d.subjects) {
        const subjRes = await client.query(
          `SELECT id FROM subjects WHERE department_id = $1 AND name = $2 AND courses = $3 AND semesters = $4;`,
          [deptId, s.name, s.courses, s.semesters]
        );
        if (subjRes.rowCount === 0) {
          await client.query(
            `INSERT INTO subjects (department_id, name, courses, semesters, level)
             VALUES ($1, $2, $3, $4, $5);`,
            [deptId, s.name, s.courses, s.semesters, s.level]
          );
          insertedSubjectsCount++;
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
      let baseRes = await client.query(
        `SELECT id FROM clinical_bases WHERE name = $1 LIMIT 1;`,
        [base.name]
      );

      let baseId;
      if (baseRes.rowCount === 0) {
        const ins = await client.query(
          `INSERT INTO clinical_bases (name, department_name, head_name, contact_phone, total_rooms, total_capacity)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id;`,
          [base.name, base.department, base.head, base.phone, base.totalRooms, base.totalCapacity]
        );
        baseId = ins.rows[0].id;
        insertedBasesCount++;
      } else {
        baseId = baseRes.rows[0].id;
      }

      for (const r of base.rooms) {
        const roomRes = await client.query(
          `SELECT id FROM rooms WHERE clinical_base_id = $1 AND room_number = $2 AND room_type = $3 LIMIT 1;`,
          [baseId, r.roomNumber, r.type]
        );
        if (roomRes.rowCount === 0) {
          await client.query(
            `INSERT INTO rooms (clinical_base_id, room_number, room_type, capacity, department_name)
             VALUES ($1, $2, $3, $4, $5);`,
            [baseId, r.roomNumber, r.type, r.capacity, r.department || base.department]
          );
          insertedRoomsCount++;
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
        const calRes = await client.query(
          `SELECT id FROM academic_calendars WHERE course = $1 AND direction_name = $2 LIMIT 1;`,
          [course, dir.name]
        );
        if (calRes.rowCount === 0) {
          await client.query(
            `INSERT INTO academic_calendars 
             (course, direction_name, theory_weeks, internship_weeks, attestation_weeks, credit_intro_weeks, vacation_weeks, state_exam_weeks, gpa_weeks, total_weeks, source)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
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
          insertedCalendarsCount++;
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
         ON CONFLICT (category) DO UPDATE SET
           title = EXCLUDED.title,
           short_description = EXCLUDED.short_description,
           content = EXCLUDED.content,
           source_url = EXCLUDED.source_url,
           updated_at = CURRENT_TIMESTAMP;`,
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
      const bookRes = await client.query(
        `SELECT id FROM books WHERE title = $1 LIMIT 1;`,
        [b.title]
      );
      if (bookRes.rowCount === 0) {
        await client.query(
          `INSERT INTO books (title, author, subject_name, course, file_url, source)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [b.title, b.author, b.subjectName, b.course, b.fileUrl, b.source]
        );
      }
    }
    console.log(`[SEED] Boshlang'ich ARM kutubxona kitoblari kiritildi.`);

    // Environment-configured bootstrap admins were synchronized before seed execution.

    await client.query(
      'INSERT INTO seed_versions (version) VALUES ($1) ON CONFLICT (version) DO NOTHING;',
      ['001_verified_official_dataset']
    );
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
