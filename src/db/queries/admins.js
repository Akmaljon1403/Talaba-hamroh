import { query } from '../pool.js';

export async function getAdminRoles() {
  const res = await query(
    `SELECT a.telegram_id::text AS telegram_id,
            COALESCE(a.full_name, u.first_name, u.username, 'Nomi kiritilmagan') AS full_name,
            a.role,
            a.created_at
     FROM admins a
     LEFT JOIN users u ON u.id = a.telegram_id
     ORDER BY CASE WHEN a.role = 'superadmin' THEN 0 ELSE 1 END, a.created_at ASC;`
  );
  return res.rows;
}

export async function getAdminByTelegramId(telegramId) {
  const res = await query(
    `SELECT telegram_id::text AS telegram_id, full_name, role, created_at
     FROM admins
     WHERE telegram_id = $1
     LIMIT 1;`,
    [telegramId]
  );
  return res.rows[0] || null;
}

export async function createAdmin(telegramId, fullName = null) {
  const res = await query(
    `INSERT INTO admins (telegram_id, full_name, role)
     VALUES ($1, $2, 'admin')
     ON CONFLICT (telegram_id) DO NOTHING
     RETURNING telegram_id::text AS telegram_id, full_name, role, created_at;`,
    [telegramId, fullName]
  );

  if (res.rowCount > 0) {
    return { created: true, admin: res.rows[0] };
  }

  return {
    created: false,
    admin: await getAdminByTelegramId(telegramId)
  };
}
