import { query } from '../pool.js';

export async function searchSubjects(searchTerm) {
  const term = `%${searchTerm.trim()}%`;
  const sql = `
    SELECT s.*, d.name as department_name, d.head_name, d.contact_phone
    FROM subjects s
    JOIN departments d ON d.id = s.department_id
    WHERE s.name ILIKE $1
    ORDER BY s.name ASC
    LIMIT 20;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}

export async function getSubjectsByDepartment(departmentId) {
  const res = await query(
    `SELECT * FROM subjects WHERE department_id = $1 ORDER BY courses, name ASC`,
    [departmentId]
  );
  return res.rows;
}

export async function getSubjectsByCourse(course, level = 'bakalavriat') {
  const courseStr = `%${course}%`;
  const res = await query(
    `SELECT s.*, d.name as department_name
     FROM subjects s
     JOIN departments d ON d.id = s.department_id
     WHERE s.level = $1 AND s.courses LIKE $2
     ORDER BY s.name ASC`,
    [level, courseStr]
  );
  return res.rows;
}
