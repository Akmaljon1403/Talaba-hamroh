import { query } from '../pool.js';

export async function getCalendarByCourse(course) {
  const sql = `
    SELECT * FROM academic_calendars
    WHERE course = $1
    ORDER BY direction_name ASC;
  `;
  const res = await query(sql, [course]);
  return res.rows;
}

export async function getCalendarByDirection(directionTerm) {
  const term = `%${directionTerm.trim()}%`;
  const sql = `
    SELECT * FROM academic_calendars
    WHERE direction_name ILIKE $1
    ORDER BY course ASC;
  `;
  const res = await query(sql, [term]);
  return res.rows;
}

export async function getAllCourses() {
  const sql = `
    SELECT DISTINCT course FROM academic_calendars ORDER BY course ASC;
  `;
  const res = await query(sql);
  return res.rows.map(r => r.course);
}
