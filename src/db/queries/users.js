import { query } from '../pool.js';

export async function upsertUser(user) {
  const sql = `
    INSERT INTO users (id, first_name, last_name, username, last_active_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    ON CONFLICT (id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      username = EXCLUDED.username,
      last_active_at = CURRENT_TIMESTAMP
    RETURNING *;
  `;
  const res = await query(sql, [user.id, user.first_name || null, user.last_name || null, user.username || null]);
  return res.rows[0];
}

export async function getUserById(id) {
  const res = await query('SELECT * FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function getAllUserIds() {
  const res = await query('SELECT id FROM users ORDER BY created_at DESC');
  return res.rows.map(r => r.id);
}

export async function getUsersCount() {
  const res = await query('SELECT COUNT(*) as count FROM users');
  return parseInt(res.rows[0].count, 10);
}
