import { query } from '../pool.js';

export async function createAnnouncement({ title, content, targetAudience, createdBy }) {
  const sql = `
    INSERT INTO announcements (title, content, target_audience, created_by)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const res = await query(sql, [
    title.trim(),
    content.trim(),
    targetAudience || 'all',
    createdBy || null
  ]);
  return res.rows[0];
}

export async function getActiveAnnouncements(limit = 10) {
  const sql = `
    SELECT * FROM announcements
    WHERE is_active = TRUE
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await query(sql, [limit]);
  return res.rows;
}
