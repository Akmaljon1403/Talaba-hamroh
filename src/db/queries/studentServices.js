import { query } from '../pool.js';

export async function getAllServices() {
  const sql = `
    SELECT category, title, short_description, updated_at
    FROM student_services
    ORDER BY id ASC;
  `;
  const res = await query(sql);
  return res.rows;
}

export async function getServiceByCategory(category) {
  const sql = `
    SELECT * FROM student_services
    WHERE category = $1
    LIMIT 1;
  `;
  const res = await query(sql, [category]);
  return res.rows[0] || null;
}
