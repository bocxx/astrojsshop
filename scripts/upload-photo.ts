/**
 * Photo Upload Script
 * 
 * Uploads a photo to R2 and creates a database entry
 * 
 * Usage:
 *   npx tsx scripts/upload-photo.ts <photo-path> <photo-name> [description]
 * 
 * Example:
 *   npx tsx scripts/upload-photo.ts ./photos/sunset.jpg "Beautiful Sunset" "Sunset over the mountains"
 */

import { readFileSync } from 'fs';
import { basename } from 'path';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: npx tsx scripts/upload-photo.ts <photo-path> <photo-name> [description]');
  process.exit(1);
}

const [photoPath, photoName, description] = args;

async function uploadPhoto() {
  console.log('This script requires Wrangler to interact with R2 and D1.');
  console.log('');
  console.log('Steps to upload a photo:');
  console.log('');
  console.log('1. Upload to R2 using wrangler:');
  console.log(`   npx wrangler r2 object put foto-bucket/${basename(photoPath)} --file="${photoPath}"`);
  console.log('');
  console.log('2. Add to database using wrangler:');
  console.log(`   npx wrangler d1 execute foto_db --local --command="`);
  console.log(`   INSERT INTO photos (id, name, description, r2_key, available)`);
  console.log(`   VALUES ('$(uuidgen)', '${photoName}', '${description || ''}', '${basename(photoPath)}', 1);"`);
  console.log('');
  console.log('For production (remove --local):');
  console.log(`   npx wrangler r2 object put foto-bucket/${basename(photoPath)} --file="${photoPath}"`);
  console.log(`   npx wrangler d1 execute foto_db --command="...same SQL as above..."`);
}

uploadPhoto();
