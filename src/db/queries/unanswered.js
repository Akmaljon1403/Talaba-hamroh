import { query } from '../pool.js';

export async function logUnansweredQuestion(userId, queryText) {
  const sql = `
    INSERT INTO unanswered_questions (user_id, query_text)
    VALUES ($1, $2)
    RETURNING *;
  `;
  const res = await query(sql, [userId, queryText.trim()]);
  return res.rows[0];
}

export async function getUnansweredQuestions(limit = 30) {
  const sql = `
    SELECT uq.*, u.first_name, u.username
    FROM unanswered_questions uq
    LEFT JOIN users u ON u.id = uq.user_id
    WHERE uq.status = 'pending'
    ORDER BY uq.created_at DESC
    LIMIT $1;
  `;
  const res = await query(sql, [limit]);
  return res.rows;
}

export async function resolveUnansweredQuestion(id) {
  const res = await query(
    'UPDATE unanswered_questions SET status = \'resolved\' WHERE id = $1 RETURNING *;',
    [id]
  );
  return res.rows[0] || null;
}
