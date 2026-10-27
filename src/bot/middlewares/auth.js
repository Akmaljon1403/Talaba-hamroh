import { upsertUser } from '../../db/queries/users.js';
import { isAdmin as isConfiguredAdmin } from '../../config/env.js';
import { getAdminByTelegramId } from '../../db/queries/admins.js';
import { touchAdminEditMode } from '../utils/adminEditMode.js';

export async function authMiddleware(ctx, next) {
  if (ctx.from) {
    const telegramId = ctx.from.id;
    let adminRecord = null;

    try {
      adminRecord = await getAdminByTelegramId(telegramId);
    } catch (err) {
      // Keep configured bootstrap admins accessible during a temporary lookup failure.
      console.error('[AUTH MIDDLEWARE] Admin lookup failed:', err.message);
    }

    const configuredSuperAdmin = isConfiguredAdmin(telegramId);
    ctx.isAdmin = Boolean(adminRecord || configuredSuperAdmin);
    ctx.adminRole = adminRecord?.role || (configuredSuperAdmin ? 'superadmin' : null);
    ctx.isSuperAdmin = ctx.adminRole === 'superadmin' || configuredSuperAdmin;

    if (ctx.isAdmin) touchAdminEditMode(telegramId);

    // User activity tracking must not block message handling.
    upsertUser(ctx.from).catch((err) => {
      console.error('[AUTH MIDDLEWARE] User update error:', err.message);
    });
  } else {
    ctx.isAdmin = false;
    ctx.isSuperAdmin = false;
    ctx.adminRole = null;
  }

  await next();
}
