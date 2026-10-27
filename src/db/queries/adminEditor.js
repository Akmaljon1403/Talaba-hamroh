import { getPool } from './pool.js';
import { getEditableEntitySchema, getEditableField, validateEditableValue } from '../../bot/utils/adminEditorPolicy.js';

export async function getEditableEntity(entityType, entityId) {
  const schema = getEditableEntitySchema(entityType);
  if (!schema) return null;
  const id = Number(entityId);
  if (!Number.isSafeInteger(id) || id <= 0) return null;

  const pool = getPool();
  const res = await pool.query(`SELECT * FROM ${schema.table} WHERE id = $1 LIMIT 1;`, [id]);
  return res.rows[0] || null;
}

export async function updateEditableEntityField({ entityType, entityId, fieldKey, inputValue, actorTelegramId }) {
  const schema = getEditableEntitySchema(entityType);
  const field = getEditableField(entityType, fieldKey);
  const id = Number(entityId);
  if (!schema || !field) throw new Error('Tanlangan obyekt yoki maydon tahrirlash uchun ruxsat etilmagan.');
  if (!Number.isSafeInteger(id) || id <= 0) throw new Error('Obyekt identifikatori noto‘g‘ri.');

  const value = validateEditableValue(entityType, fieldKey, inputValue);
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const currentRes = await client.query(
      `SELECT * FROM ${schema.table} WHERE id = $1 FOR UPDATE;`,
      [id]
    );
    if (currentRes.rowCount === 0) throw new Error('Ma’lumot topilmadi. Qidiruvni yangilab ko‘ring.');

    const current = currentRes.rows[0];
    const oldValue = current[fieldKey] ?? null;
    if (String(oldValue ?? '') === String(value ?? '')) {
      await client.query('COMMIT');
      return { changed: false, entityType, entityId: id, fieldKey, oldValue, newValue: value, entity: current };
    }

    if (entityType === 'department' && fieldKey === 'name') {
      const duplicate = await client.query(
        'SELECT 1 FROM departments WHERE id <> $1 AND level = $2 AND LOWER(TRIM(name)) = LOWER(TRIM($3)) LIMIT 1;',
        [id, current.level, value]
      );
      if (duplicate.rowCount) throw new Error('Shu darajadagi kafedrada bu nom allaqachon mavjud.');
    }
    if (entityType === 'subject' && fieldKey === 'name') {
      const duplicate = await client.query(
        'SELECT 1 FROM subjects WHERE id <> $1 AND department_id IS NOT DISTINCT FROM $2 AND LOWER(TRIM(name)) = LOWER(TRIM($3)) LIMIT 1;',
        [id, current.department_id, value]
      );
      if (duplicate.rowCount) throw new Error('Bu kafedrada shu nomli fan allaqachon mavjud.');
    }
    if (entityType === 'base' && fieldKey === 'name') {
      const duplicate = await client.query(
        'SELECT 1 FROM clinical_bases WHERE id <> $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2)) LIMIT 1;',
        [id, value]
      );
      if (duplicate.rowCount) throw new Error('Bunday nomdagi klinik baza allaqachon mavjud.');
    }
    if (entityType === 'room' && fieldKey === 'room_number') {
      const duplicate = await client.query(
        'SELECT 1 FROM rooms WHERE id <> $1 AND clinical_base_id IS NOT DISTINCT FROM $2 AND room_type = $3 AND LOWER(TRIM(room_number)) = LOWER(TRIM($4)) LIMIT 1;',
        [id, current.clinical_base_id, current.room_type, value]
      );
      if (duplicate.rowCount) throw new Error('Bu klinik bazada shu turdagi xona raqami allaqachon mavjud.');
    }
    if (entityType === 'book' && fieldKey === 'title') {
      const duplicate = await client.query(
        'SELECT 1 FROM books WHERE id <> $1 AND LOWER(TRIM(title)) = LOWER(TRIM($2)) LIMIT 1;',
        [id, value]
      );
      if (duplicate.rowCount) throw new Error('Bunday nomdagi kitob allaqachon mavjud.');
    }

    const updatedRes = await client.query(
      `UPDATE ${schema.table} SET ${fieldKey} = $1${entityType === 'service' ? ', updated_at = CURRENT_TIMESTAMP' : ''} WHERE id = $2 RETURNING *;`,
      [value, id]
    );

    // Keep free-text department references in sync with the canonical department record.
    if (entityType === 'department' && fieldKey === 'name') {
      await client.query(
        `UPDATE clinical_bases SET department_name = $1
         WHERE LOWER(TRIM(department_name)) = LOWER(TRIM($2));`,
        [value, oldValue]
      );
      await client.query(
        `UPDATE rooms SET department_name = $1
         WHERE LOWER(TRIM(department_name)) = LOWER(TRIM($2));`,
        [value, oldValue]
      );
    }

    // The department detail and search results derive the department head from the same record.
    // Keep the linked teachers table in sync when a department's head name/contact is edited.
    if (entityType === 'department' && fieldKey === 'head_name') {
      const teachers = await client.query(
        `UPDATE teachers SET full_name = $1
         WHERE department_id = $2 AND position ILIKE '%kafedra mudiri%'
         RETURNING id;`,
        [value, id]
      );
      if (teachers.rowCount === 0 && value) {
        await client.query(
          `INSERT INTO teachers (full_name, department_id, position, official_contact, source)
           VALUES ($1, $2, 'Kafedra mudiri', $3, 'Admin tomonidan tahrirlandi');`,
          [value, id, current.contact_phone || null]
        );
      }
    }
    if (entityType === 'department' && fieldKey === 'contact_phone') {
      await client.query(
        `UPDATE teachers SET official_contact = $1
         WHERE department_id = $2 AND position ILIKE '%kafedra mudiri%';`,
        [value, id]
      );
    }

    // If the teacher row represents the department head, synchronize the canonical department field.
    if (entityType === 'teacher' && fieldKey === 'full_name' &&
        String(current.position || '').toLowerCase().includes('kafedra mudiri') && current.department_id) {
      await client.query(
        'UPDATE departments SET head_name = $1 WHERE id = $2 AND head_name IS NOT DISTINCT FROM $3;',
        [value, current.department_id, oldValue]
      );
    }
    if (entityType === 'teacher' && fieldKey === 'official_contact' &&
        String(current.position || '').toLowerCase().includes('kafedra mudiri') && current.department_id) {
      await client.query(
        'UPDATE departments SET contact_phone = $1 WHERE id = $2;',
        [value, current.department_id]
      );
    }

    // Book subject labels are stored as text, so keep them synchronized when a subject is renamed.
    if (entityType === 'subject' && fieldKey === 'name') {
      await client.query(
        'UPDATE books SET subject_name = $1 WHERE LOWER(TRIM(subject_name)) = LOWER(TRIM($2));',
        [value, oldValue]
      );
    }

    await client.query(
      `INSERT INTO admin_edit_logs
       (actor_telegram_id, entity_type, entity_id, field_name, old_value, new_value)
       VALUES ($1, $2, $3, $4, $5, $6);`,
      [String(actorTelegramId), entityType, id, fieldKey, oldValue === null ? null : String(oldValue), value === null ? null : String(value)]
    );

    await client.query('COMMIT');
    return { changed: true, entityType, entityId: id, fieldKey, oldValue, newValue: value, entity: updatedRes.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
