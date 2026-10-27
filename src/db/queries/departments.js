import { query } from '../pool.js';

export async function getAllDepartments(level = 'bakalavriat') {
  const res = await query(
    `SELECT d.*, 
            COUNT(s.id) as subjects_count
     FROM departments d
     LEFT JOIN subjects s ON s.department_id = d.id
     WHERE d.level = $1
     GROUP BY d.id
     ORDER BY d.name ASC`,
    [level]
  );
  return res.rows;
}

export async function getDepartmentById(id) {
  const deptRes = await query('SELECT * FROM departments WHERE id = $1', [id]);
  if (deptRes.rowCount === 0) return null;
  const dept = deptRes.rows[0];

  const subjectsRes = await query(
    'SELECT * FROM subjects WHERE department_id = $1 ORDER BY name ASC',
    [id]
  );
  dept.subjects = subjectsRes.rows;

  const teachersRes = await query(
    'SELECT * FROM teachers WHERE department_id = $1 ORDER BY full_name ASC',
    [id]
  );
  dept.teachers = teachersRes.rows;

  return dept;
}

export async function searchDepartments(searchTerm) {
  const term = `%${searchTerm.trim()}%`;
  const res = await query(
    `SELECT d.*, COUNT(s.id) as subjects_count
     FROM departments d
     LEFT JOIN subjects s ON s.department_id = d.id
     WHERE d.name ILIKE $1 OR d.head_name ILIKE $1
     GROUP BY d.id
     ORDER BY d.name ASC
     LIMIT 20`,
    [term]
  );
  return res.rows;
}
