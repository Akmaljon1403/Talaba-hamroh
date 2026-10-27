import { query } from '../pool.js';

export async function getAllFaculties() {
  const res = await query('SELECT * FROM faculties ORDER BY id ASC');
  return res.rows;
}

export async function getFacultyById(id) {
  const res = await query('SELECT * FROM faculties WHERE id = $1', [id]);
  return res.rows[0] || null;
}
