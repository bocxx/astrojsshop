import { defineMiddleware } from 'astro:middleware';
import { PhotoDB } from './lib/db';

export const onRequest = defineMiddleware(async (context, next) => {
  const db = context.locals.runtime.env.DB;
  const photos = context.locals.runtime.env.PHOTOS;

  // Check for user session
  const userId = context.cookies.get('user_id')?.value;

  if (userId && db && photos) {
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
  }

  return next();
});
