import { query } from '../pool.js';

export async function searchTeachers(searchTerm) {
  const term = `%${searchTerm.trim()}%`;
  const sql = `
    SELECT t.*, d.name as department_name
    FROM teachers t
    LEFT JOIN departments d ON d.id = t.department_id
    WHERE t.full_name ILIKE $1 
       OR d.name ILIKE $1 
       OR t.position ILIKE $1
    ORDER BY t.full_name ASC
    LIMIT 20;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}

export async function getAllTeachers() {
  const sql = `
    SELECT t.*, d.name as department_name
    FROM teachers t
    LEFT JOIN departments d ON d.id = t.department_id
    ORDER BY t.full_name ASC;
  `;
  const res = await query(sql);
  return res.rows;
}

export async function addTeacher({ fullName, departmentId, position, contact, source }) {
  const sql = `
    INSERT INTO teachers (full_name, department_id, position, official_contact, source)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const res = await query(sql, [
    fullName.trim(),
    departmentId || null,
    position || 'O\'qituvchi',
    contact || null,
    source || 'Admin tomonidan kiritilgan'
  ]);
  return res.rows[0];
}

export async function deleteTeacher(id) {
  const res = await query('DELETE FROM teachers WHERE id = $1 RETURNING *;', [id]);
  return res.rows[0] || null;
}
