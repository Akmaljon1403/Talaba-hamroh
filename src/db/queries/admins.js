import { query } from '../pool.js';

export async function getAdminByTelegramId(telegramId) {
  const res = await query(
    'SELECT telegram_id, full_name, role, created_at FROM admins WHERE telegram_id = $1 LIMIT 1;',
    [String(telegramId)]
  );
  return res.rows[0] || null;
}

export async function getAllAdmins() {
  const res = await query(
    'SELECT telegram_id, full_name, role, created_at FROM admins ORDER BY CASE WHEN role = \'superadmin\' THEN 0 ELSE 1 END, created_at ASC;'
  );
  return res.rows;
}

export async function createAdmin({ telegramId, fullName, createdBy }) {
  const res = await query(
    `INSERT INTO admins (telegram_id, full_name, role, created_by)
     VALUES ($1, $2, 'admin', $3)
     ON CONFLICT (telegram_id) DO NOTHING
     RETURNING telegram_id, full_name, role, created_at;`,
    [String(telegramId), fullName || null, String(createdBy)]
  );
  return res.rows[0] || null;
}

export async function deleteAdmin(telegramId) {
  const res = await query(
    `DELETE FROM admins
     WHERE telegram_id = $1 AND role <> 'superadmin'
     RETURNING telegram_id, full_name, role;`,
    [String(telegramId)]
  );
  return res.rows[0] || null;
}

export async function countSuperAdmins() {
  const res = await query("SELECT COUNT(*)::int AS count FROM admins WHERE role = 'superadmin';");
  return res.rows[0]?.count || 0;
}

export async function logAdminChange({ actorTelegramId, targetTelegramId, action }) {
  await query(
    `INSERT INTO admin_edit_logs (actor_telegram_id, entity_type, entity_id, field_name, old_value, new_value)
     VALUES ($1, 'admin', $2, 'role', $3, $4);`,
    [String(actorTelegramId), String(targetTelegramId), action === 'add' ? 'none' : 'admin', action === 'add' ? 'admin' : 'removed']
  );
}
