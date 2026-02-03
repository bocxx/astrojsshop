import type { APIRoute } from 'astro';
import { PhotoDB } from '../../lib/db';

export const GET: APIRoute = async ({ url, locals }) => {
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const db = new PhotoDB(
    locals.runtime.env.DB,
    locals.runtime.env.PHOTOS
  );

  try {
    const [photos, total] = await Promise.all([
      db.getAvailablePhotos(limit, offset),
      db.getAvailablePhotosCount()
    ]);

    return new Response(
      JSON.stringify({
        photos,
        total,
        limit,
        offset,
        hasMore: offset + photos.length < total
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching photos:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch photos' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
};
