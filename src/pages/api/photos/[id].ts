import type { APIRoute } from 'astro';
import { PhotoDB } from '../../../lib/db';

export const GET: APIRoute = async ({ params, locals }) => {
  const photoId = params.id;
  
  if (!photoId) {
    return new Response('Photo ID is required', { status: 400 });
  }

  const db = new PhotoDB(
    locals.runtime.env.DB,
    locals.runtime.env.PHOTOS
  );

  try {
    // Get photo metadata from database
    const photo = await db.getPhotoById(photoId);
    
    if (!photo) {
      return new Response('Photo not found', { status: 404 });
    }

    // Fetch the photo from R2 bucket
    const object = await locals.runtime.env.PHOTOS.get(photo.r2_key);
    
    if (!object) {
      return new Response('Photo file not found in storage', { status: 404 });
    }

    // Get the file as an ArrayBuffer
    const photoBuffer = await object.arrayBuffer();
    
    // Determine content type based on file extension
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

    // Return the image with appropriate headers
    return new Response(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    return new Response('Internal server error', { status: 500 });
  }
};
