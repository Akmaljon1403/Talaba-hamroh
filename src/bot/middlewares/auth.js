import { upsertUser } from '../../db/queries/users.js';
import { isAdmin } from '../../config/env.js';

export async function authMiddleware(ctx, next) {
  if (ctx.from) {
    ctx.isAdmin = isAdmin(ctx.from.id);
    
    // Background user upsert (non-blocking)
    upsertUser(ctx.from).catch((err) => {
      console.error('[AUTH MIDDLEWARE] User update error:', err.message);
    });
  } else {
    ctx.isAdmin = false;
  }

  await next();
}
