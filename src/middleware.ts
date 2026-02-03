import { defineMiddleware } from 'astro:middleware';
import { PhotoDB } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  // Access Cloudflare bindings - works in both local and production
  const runtime = context.locals.runtime;
  const db = runtime?.env?.DB;
  const photos = runtime?.env?.PHOTOS;

  // Check for user session
  const userId = context.cookies.get('user_id')?.value;

  if (userId && db && photos) {
    try {
      const photoDb = new PhotoDB(db, photos);
      const user = await photoDb.getUserById(userId);

      if (user) {
        context.locals.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin || false,
        };
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Clear invalid session
      context.cookies.delete('user_id', { path: '/' });
    }
  }

  return next();
});
