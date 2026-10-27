import { query } from '../pool.js';

export async function saveFeedback({ userId, userName, message }) {
  const sql = `
    INSERT INTO feedback (user_id, user_name, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const res = await query(sql, [userId, userName || null, message.trim()]);
  return res.rows[0];
}

export async function getRecentFeedback(limit = 20) {
  const sql = `
    SELECT * FROM feedback
    ORDER BY created_at DESC
    LIMIT $1;
  `;
  const res = await query(sql, [limit]);
  return res.rows;
}

export async function markFeedbackReviewed(id) {
  const res = await query(
    'UPDATE feedback SET status = \'reviewed\' WHERE id = $1 RETURNING *;',
    [id]
  );
  return res.rows[0] || null;
}
