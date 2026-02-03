import type { APIRoute } from 'astro';
import { PhotoDB } from '../../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const photoId = params.id;
  
  if (!photoId) {
    return new Response('Photo ID is required', { status: 400 });
  }

  // Check if runtime environment is available
  if (!locals.runtime?.env?.DB || !locals.runtime?.env?.PHOTOS) {
    console.error('Runtime environment not available:', {
      hasRuntime: !!locals.runtime,
      hasEnv: !!locals.runtime?.env,
      hasDB: !!locals.runtime?.env?.DB,
      hasPHOTOS: !!locals.runtime?.env?.PHOTOS,
    });
    return new Response('Server configuration error', { status: 500 });
  }

  const db = new PhotoDB(
    locals.runtime.env.DB,
    locals.runtime.env.PHOTOS
  );

  try {
    // Get photo metadata from database
    const photo = await db.getPhotoById(photoId);
    
    if (!photo) {
      console.error(`Photo not found in database: ${photoId}`);
      return new Response('Photo not found', { status: 404 });
    }

    // Try to get thumbnail first, fall back to original
    const key = photo.thumbnail_key || photo.r2_key;
    console.log(`[THUMB API] Looking for photo ${photoId} with key: ${key}`);
    console.log(`[THUMB API] Photo data:`, { thumbnail_key: photo.thumbnail_key, r2_key: photo.r2_key });
    
    const object = await locals.runtime.env.PHOTOS.get(key);
    
    if (!object) {
      console.error(`[THUMB API] Photo file not found in R2 storage: ${key}`);
      // Try fallback to original if thumbnail doesn't exist
      if (photo.thumbnail_key && photo.r2_key) {
        console.log(`[THUMB API] Trying fallback to original: ${photo.r2_key}`);
        const fallbackObject = await locals.runtime.env.PHOTOS.get(photo.r2_key);
        if (fallbackObject) {
          console.log(`[THUMB API] Using original photo as fallback`);
          const photoBuffer = await fallbackObject.arrayBuffer();
          const extension = photo.r2_key.split('.').pop()?.toLowerCase();
          const contentTypes: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'heic': 'image/heic',
            'heif': 'image/heif',
          };
          const contentType = contentTypes[extension || ''] || 'application/octet-stream';
          return new Response(photoBuffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
            },
          });
        }
      }
      return new Response('Photo file not found in storage', { status: 404 });
    }

    // Get the file as an ArrayBuffer
    const photoBuffer = await object.arrayBuffer();
    
    // Determine content type based on file extension
    const extension = key.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
    };
    
    const contentType = contentTypes[extension || ''] || 'application/octet-stream';

    // Return the image with appropriate headers
    return new Response(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching photo thumbnail:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
