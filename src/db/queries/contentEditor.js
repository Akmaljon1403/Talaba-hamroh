import { getPool } from '../pool.js';

const ENTITIES = {
  dept: {
    table: 'departments',
    title: 'Kafedra',
    labelField: 'name',
    fields: [
      { key: 'name', label: 'Nomi', type: 'text', required: true },
      { key: 'head_name', label: 'Mudir F.I.Sh.', type: 'text', nullable: true },
      { key: 'contact_phone', label: 'Telefon', type: 'text', nullable: true },
      { key: 'location_notes', label: 'Joylashuv', type: 'text', nullable: true },
      { key: 'level', label: 'Ta’lim bosqichi', type: 'enum', options: ['bakalavriat', 'magistratura'], required: true }
    ],
    listSql: `SELECT id, name AS label, level AS extra FROM departments ORDER BY name ASC`
  },
  subject: {
    table: 'subjects',
    title: 'Fan',
    labelField: 'name',
    fields: [
      { key: 'name', label: 'Fan nomi', type: 'text', required: true },
      { key: 'courses', label: 'Kurslar', type: 'text', nullable: true },
      { key: 'semesters', label: 'Semestrlar', type: 'text', nullable: true },
      { key: 'level', label: 'Ta’lim bosqichi', type: 'enum', options: ['bakalavriat', 'magistratura'], required: true }
    ],
    listSql: `SELECT s.id, s.name AS label, d.name AS extra
      FROM subjects s JOIN departments d ON d.id = s.department_id
      ORDER BY s.name ASC`
  },
  teacher: {
    table: 'teachers',
    title: 'O‘qituvchi / mudir',
    labelField: 'full_name',
    fields: [
      { key: 'full_name', label: 'F.I.Sh.', type: 'text', required: true },
      { key: 'position', label: 'Lavozim', type: 'text', nullable: true },
      { key: 'official_contact', label: 'Rasmiy telefon / aloqa', type: 'text', nullable: true },
      { key: 'source', label: 'Manba', type: 'text', nullable: true }
    ],
    listSql: `SELECT t.id, t.full_name AS label, COALESCE(d.name, t.position, '') AS extra
      FROM teachers t LEFT JOIN departments d ON d.id = t.department_id
      ORDER BY t.full_name ASC`
  },
  base: {
    table: 'clinical_bases',
    title: 'Klinik baza',
    labelField: 'name',
    fields: [
      { key: 'name', label: 'Muassasa nomi', type: 'text', required: true },
      { key: 'department_name', label: 'Biriktirilgan kafedra', type: 'text', nullable: true },
      { key: 'head_name', label: 'Mas’ul / mudir', type: 'text', nullable: true },
      { key: 'contact_phone', label: 'Telefon', type: 'text', nullable: true },
      { key: 'address', label: 'Manzil', type: 'text', nullable: true },
      { key: 'map_link', label: 'Xarita havolasi', type: 'url', nullable: true },
      { key: 'total_rooms', label: 'Xonalar soni', type: 'number', min: 0, max: 100000, required: true },
      { key: 'total_capacity', label: 'Umumiy sig‘im', type: 'number', min: 0, max: 1000000, required: true }
    ],
    listSql: `SELECT id, name AS label, department_name AS extra FROM clinical_bases ORDER BY name ASC`
  },
  room: {
    table: 'rooms',
    title: 'Auditoriya / xona',
    labelField: 'room_number',
    fields: [
      { key: 'room_number', label: 'Xona raqami', type: 'text', required: true },
      { key: 'room_type', label: 'Xona turi', type: 'text', required: true },
      { key: 'capacity', label: 'Sig‘im', type: 'number', min: 0, max: 100000, required: true },
      { key: 'department_name', label: 'Biriktirilgan kafedra', type: 'text', nullable: true },
      { key: 'notes', label: 'Izoh', type: 'text', nullable: true }
    ],
    listSql: `SELECT r.id, r.room_number AS label, COALESCE(b.name, '') AS extra
      FROM rooms r LEFT JOIN clinical_bases b ON b.id = r.clinical_base_id
      ORDER BY b.name ASC, r.room_number ASC`
  },
  book: {
    table: 'books',
    title: 'Elektron kitob',
    labelField: 'title',
    fields: [
      { key: 'title', label: 'Kitob nomi', type: 'text', required: true },
      { key: 'author', label: 'Muallif', type: 'text', nullable: true },
      { key: 'subject_name', label: 'Fan', type: 'text', nullable: true },
      { key: 'course', label: 'Kurs (1–6)', type: 'number', min: 1, max: 6, nullable: true },
      { key: 'file_url', label: 'Elektron havola', type: 'url', required: true },
      { key: 'source', label: 'Manba', type: 'text', nullable: true }
    ],
    listSql: `SELECT id, title AS label, COALESCE(author, '') AS extra FROM books ORDER BY title ASC`
  },
  calendar: {
    table: 'academic_calendars',
    title: 'O‘quv jadvali yozuvi',
    labelField: 'direction_name',
    fields: [
      { key: 'course', label: 'Kurs (1–6)', type: 'number', min: 1, max: 6, required: true },
      { key: 'direction_name', label: 'Ta’lim yo‘nalishi', type: 'text', required: true },
      { key: 'academic_year', label: 'O‘quv yili', type: 'text', required: true },
      { key: 'theory_weeks', label: 'Nazariy ta’lim haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'internship_weeks', label: 'Amaliyot haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'attestation_weeks', label: 'Attestatsiya haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'credit_intro_weeks', label: 'Kredit-modul haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'vacation_weeks', label: 'Ta’til haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'state_exam_weeks', label: 'Davlat imtihoni haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'gpa_weeks', label: 'GPA haftalari', type: 'number', min: 0, max: 52, required: true },
      { key: 'total_weeks', label: 'Jami haftalar', type: 'number', min: 1, max: 52, required: true },
      { key: 'source', label: 'Manba', type: 'text', nullable: true }
    ],
    listSql: `SELECT id, direction_name AS label, course::text || '-kurs' AS extra
      FROM academic_calendars ORDER BY course ASC, direction_name ASC`
  },
  faculty: {
    table: 'faculties',
    title: 'Fakultet',
    labelField: 'name',
    fields: [
      { key: 'name', label: 'Fakultet nomi', type: 'text', required: true },
      { key: 'dean_name', label: 'Dekan F.I.Sh.', type: 'text', nullable: true },
      { key: 'description', label: 'Yo‘nalishlar / tavsif', type: 'text', nullable: true },
      { key: 'code', label: 'Kod', type: 'text', nullable: true }
    ],
    listSql: `SELECT id, name AS label, COALESCE(dean_name, '') AS extra FROM faculties ORDER BY id ASC`
  },
  service: {
    table: 'student_services',
    title: 'Talaba xizmati',
    labelField: 'title',
    fields: [
      { key: 'title', label: 'Xizmat nomi', type: 'text', required: true },
      { key: 'short_description', label: 'Qisqa tavsif', type: 'text', nullable: true },
      { key: 'content', label: 'Asosiy yo‘riqnoma matni', type: 'text', required: true },
      { key: 'source_url', label: 'Rasmiy havola', type: 'url', nullable: true }
    ],
    listSql: `SELECT id, title AS label, category AS extra FROM student_services ORDER BY id ASC`
  }
};

export function getEditableEntityConfig(entityType) {
  return ENTITIES[entityType] || null;
}

export function getEditableField(entityType, fieldKey) {
  return ENTITIES[entityType]?.fields.find((field) => field.key === fieldKey) || null;
}

export async function listEditableEntities(entityType, limit = 8, offset = 0) {
  const config = ENTITIES[entityType];
  if (!config) throw new Error('Tahrirlash uchun noma’lum ma’lumot turi.');
  const safeLimit = Math.max(1, Math.min(Number(limit) || 8, 20));
  const safeOffset = Math.max(0, Number(offset) || 0);
  const res = await query(
    `SELECT * FROM (${config.listSql}) AS editable_entities ORDER BY label ASC LIMIT $1 OFFSET $2;`,
    [safeLimit, safeOffset]
  );
  return res.rows;
}

export async function getEditableEntity(entityType, entityId) {
  const config = ENTITIES[entityType];
  const id = Number(entityId);
  if (!config || !Number.isSafeInteger(id) || id <= 0) return null;
  const res = await query(`SELECT * FROM ${config.table} WHERE id = $1 LIMIT 1;`, [id]);
  return res.rows[0] || null;
}

export function validateEditableValue(entityType, fieldKey, rawValue) {
  const field = getEditableField(entityType, fieldKey);
  if (!field) return { ok: false, error: 'Bu maydonni tahrirlashga ruxsat berilmagan.' };

  const raw = String(rawValue ?? '').trim();
  if ((raw === '' || raw === '—') && field.nullable) return { ok: true, value: null };
  if (raw === '') return { ok: false, error: 'Bu maydon bo‘sh qolishi mumkin emas.' };
  if (raw.length > 3500) return { ok: false, error: 'Matn juda uzun. 3500 belgidan qisqaroq qiymat kiriting.' };

  if (field.type === 'number') {
    if (!/^\d+$/.test(raw)) return { ok: false, error: 'Bu maydon uchun butun son kiriting.' };
    const value = Number(raw);
    if (!Number.isSafeInteger(value) || value < (field.min ?? 0) || value > (field.max ?? Number.MAX_SAFE_INTEGER)) {
      return { ok: false, error: `Qiymat ${field.min ?? 0}–${field.max ?? 'katta son'} oralig‘ida bo‘lishi kerak.` };
    }
    return { ok: true, value };
  }

  if (field.type === 'enum') {
    if (!field.options?.includes(raw)) {
      return { ok: false, error: `Qiymat quyidagilardan biri bo‘lishi kerak: ${field.options?.join(', ') || 'ruxsat etilgan ro‘yxat'}.` };
    }
    return { ok: true, value: raw };
  }

  if (field.type === 'url') {
    try {
      const url = new URL(raw);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid protocol');
      return { ok: true, value: url.toString() };
    } catch {
      return { ok: false, error: 'Havola to‘liq URL bo‘lsin va http:// yoki https:// bilan boshlansin.' };
    }
  }

  return { ok: true, value: raw };
}

export async function updateEditableField(entityType, entityId, fieldKey, value, expectedOldValue, actorTelegramId) {
  const config = ENTITIES[entityType];
  const field = getEditableField(entityType, fieldKey);
  const id = Number(entityId);
  if (!config || !field || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Tahrirlash so‘rovi noto‘g‘ri.');
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT * FROM ${config.table} WHERE id = $1 FOR UPDATE;`,
      [id]
    );
    if (currentRes.rowCount === 0) throw new Error('Tahrirlanadigan yozuv topilmadi.');
    const current = currentRes.rows[0];
    const oldValue = current[fieldKey];

    if (arguments.length >= 5 && !Object.is(oldValue, expectedOldValue)) {
      const conflict = new Error('Bu maydon boshqa administrator tomonidan o‘zgartirildi.');
      conflict.code = 'EDIT_CONFLICT';
      throw conflict;
    }

    const duplicateCheckRequired =
      (entityType === 'dept' && ['name', 'level'].includes(fieldKey)) ||
      (entityType === 'subject' && ['name', 'courses', 'semesters'].includes(fieldKey)) ||
      (entityType === 'teacher' && fieldKey === 'full_name') ||
      (entityType === 'base' && fieldKey === 'name') ||
      (entityType === 'room' && ['room_number', 'room_type'].includes(fieldKey)) ||
      (entityType === 'calendar' && ['course', 'direction_name'].includes(fieldKey)) ||
      (entityType === 'faculty' && fieldKey === 'name');

    let duplicate = null;
    if (duplicateCheckRequired && value !== null) {
      switch (entityType) {
        case 'dept': {
          const candidateName = fieldKey === 'name' ? value : current.name;
          const candidateLevel = fieldKey === 'level' ? value : current.level;
          duplicate = await client.query(
            'SELECT id FROM departments WHERE name = $1 AND level IS NOT DISTINCT FROM $2 AND id <> $3 LIMIT 1;',
            [candidateName, candidateLevel, id]
          );
          break;
        }
        case 'subject': {
          const candidateName = fieldKey === 'name' ? value : current.name;
          const candidateCourses = fieldKey === 'courses' ? value : current.courses;
          const candidateSemesters = fieldKey === 'semesters' ? value : current.semesters;
          duplicate = await client.query(
            `SELECT id FROM subjects
             WHERE department_id IS NOT DISTINCT FROM $1
               AND name = $2
               AND courses IS NOT DISTINCT FROM $3
               AND semesters IS NOT DISTINCT FROM $4
               AND id <> $5
             LIMIT 1;`,
            [current.department_id, candidateName, candidateCourses, candidateSemesters, id]
          );
          break;
        }
        case 'teacher':
          duplicate = await client.query(
            'SELECT id FROM teachers WHERE full_name = $1 AND department_id IS NOT DISTINCT FROM $2 AND id <> $3 LIMIT 1;',
            [value, current.department_id, id]
          );
          break;
        case 'base':
          duplicate = await client.query(
            'SELECT id FROM clinical_bases WHERE name = $1 AND id <> $2 LIMIT 1;',
            [value, id]
          );
          break;
        case 'room': {
          const candidateNumber = fieldKey === 'room_number' ? value : current.room_number;
          const candidateType = fieldKey === 'room_type' ? value : current.room_type;
          duplicate = await client.query(
            `SELECT id FROM rooms
             WHERE clinical_base_id IS NOT DISTINCT FROM $1
               AND room_number = $2
               AND room_type IS NOT DISTINCT FROM $3
               AND id <> $4
             LIMIT 1;`,
            [current.clinical_base_id, candidateNumber, candidateType, id]
          );
          break;
        }
        case 'calendar': {
          const course = fieldKey === 'course' ? value : current.course;
          const direction = fieldKey === 'direction_name' ? value : current.direction_name;
          duplicate = await client.query(
            'SELECT id FROM academic_calendars WHERE course = $1 AND direction_name = $2 AND id <> $3 LIMIT 1;',
            [course, direction, id]
          );
          break;
        }
        case 'faculty':
          duplicate = await client.query(
            'SELECT id FROM faculties WHERE name = $1 AND id <> $2 LIMIT 1;',
            [value, id]
          );
          break;
        default:
          break;
      }
    }
    if (duplicate?.rowCount > 0) {
      throw new Error('Bunday nom yoki qiymat shu toifadagi boshqa yozuvda allaqachon mavjud.');
    }

    const setUpdatedAt = entityType === 'service' ? ', updated_at = CURRENT_TIMESTAMP' : '';
    const updatedRes = await client.query(
      `UPDATE ${config.table} SET ${fieldKey} = $1${setUpdatedAt} WHERE id = $2 RETURNING *;`,
      [value, id]
    );
    const updated = updatedRes.rows[0];

    // Academic year is a schedule-wide setting; keep all records from the old year consistent.
    if (entityType === 'calendar' && fieldKey === 'academic_year' && oldValue !== value) {
      await client.query(
        'UPDATE academic_calendars SET academic_year = $1 WHERE academic_year IS NOT DISTINCT FROM $2 AND id <> $3;',
        [value, oldValue, id]
      );
    }

    if (entityType === 'subject' && fieldKey === 'name' && oldValue !== value) {
      await client.query(
        'UPDATE books SET subject_name = $1 WHERE subject_name IS NOT DISTINCT FROM $2;',
        [value, oldValue]
      );
    }

    // Keep denormalized display fields synchronized with the canonical linked record.
    if (entityType === 'dept') {
      if (fieldKey === 'level' && oldValue !== value) {
        await client.query(
          'UPDATE subjects SET level = $1 WHERE department_id = $2 AND level IS NOT DISTINCT FROM $3;',
          [value, id, oldValue]
        );
      }
      if (fieldKey === 'name' && oldValue !== value) {
        await client.query('UPDATE clinical_bases SET department_name = $1 WHERE department_name = $2;', [value, oldValue]);
        await client.query('UPDATE rooms SET department_name = $1 WHERE department_name = $2;', [value, oldValue]);
      }
      if (fieldKey === 'head_name' && oldValue !== value) {
        await client.query(
          `UPDATE teachers SET full_name = $1
           WHERE department_id = $2 AND position = 'Kafedra mudiri'
             AND full_name IS NOT DISTINCT FROM $3;`,
          [value, id, oldValue]
        );
        await client.query(
          'UPDATE clinical_bases SET head_name = $1 WHERE department_name = $2 AND head_name IS NOT DISTINCT FROM $3;',
          [value, current.name, oldValue]
        );
      }
      if (fieldKey === 'contact_phone' && oldValue !== value) {
        await client.query(
          `UPDATE teachers SET official_contact = $1
           WHERE department_id = $2 AND position = 'Kafedra mudiri'
             AND official_contact IS NOT DISTINCT FROM $3;`,
          [value, id, oldValue]
        );
        await client.query(
          'UPDATE clinical_bases SET contact_phone = $1 WHERE department_name = $2 AND contact_phone IS NOT DISTINCT FROM $3;',
          [value, current.name, oldValue]
        );
      }
    }

    if (entityType === 'teacher' && current.department_id) {
      if (fieldKey === 'full_name' && oldValue !== value && current.position === 'Kafedra mudiri') {
        await client.query(
          'UPDATE departments SET head_name = $1 WHERE id = $2 AND head_name IS NOT DISTINCT FROM $3;',
          [value, current.department_id, oldValue]
        );
        const deptRes = await client.query('SELECT name FROM departments WHERE id = $1;', [current.department_id]);
        if (deptRes.rowCount) {
          await client.query(
            'UPDATE clinical_bases SET head_name = $1 WHERE department_name = $2 AND head_name IS NOT DISTINCT FROM $3;',
            [value, deptRes.rows[0].name, oldValue]
          );
        }
      }
      if (fieldKey === 'official_contact' && oldValue !== value && current.position === 'Kafedra mudiri') {
        await client.query(
          'UPDATE departments SET contact_phone = $1 WHERE id = $2 AND contact_phone IS NOT DISTINCT FROM $3;',
          [value, current.department_id, oldValue]
        );
        const deptRes = await client.query('SELECT name FROM departments WHERE id = $1;', [current.department_id]);
        if (deptRes.rowCount) {
          await client.query(
            'UPDATE clinical_bases SET contact_phone = $1 WHERE department_name = $2 AND contact_phone IS NOT DISTINCT FROM $3;',
            [value, deptRes.rows[0].name, oldValue]
          );
        }
      }
    }

    if (entityType === 'base' && fieldKey === 'department_name' && oldValue !== value) {
      await client.query(
        'UPDATE rooms SET department_name = $1 WHERE clinical_base_id = $2 AND department_name IS NOT DISTINCT FROM $3;',
        [value, id, oldValue]
      );
    }

    if (entityType === 'room' && fieldKey === 'capacity' && oldValue !== value && current.clinical_base_id) {
      const capacityDelta = Number(value) - Number(oldValue ?? 0);
      await client.query(
        'UPDATE clinical_bases SET total_capacity = GREATEST(COALESCE(total_capacity, 0) + $1, 0) WHERE id = $2;',
        [capacityDelta, current.clinical_base_id]
      );
    }

    if (oldValue !== value) {
      await client.query(
        `INSERT INTO admin_edit_logs
          (actor_telegram_id, entity_type, entity_id, field_name, old_value, new_value)
         VALUES ($1, $2, $3, $4, $5, $6);`,
        [
          String(actorTelegramId),
          entityType,
          id,
          fieldKey,
          oldValue == null ? null : String(oldValue),
          value == null ? null : String(value)
        ]
      );
    }

    await client.query('COMMIT');
    return updated;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function getRecentContentEdits(limit = 12) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 12, 30));
  const pool = getPool();
  const res = await pool.query(
    `SELECT actor_telegram_id, entity_type, entity_id, field_name, old_value, new_value, created_at
     FROM admin_edit_logs
     ORDER BY created_at DESC
     LIMIT $1;`,
    [safeLimit]
  );
  return res.rows;
}
