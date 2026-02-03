import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

// Configuration
const PHOTO_DIR = './uploads/fotos';
const THUMB_DIR = './uploads/thumbnails';
const WATERMARK_TEXT = '© Samen voor Krimpen';
const THUMB_WIDTH = 800; // Thumbnail width in pixels
const THUMB_QUALITY = 80; // JPEG quality

interface Photo {
  filename: string;
  id: string;
}

// Execute wrangler command and return output
async function execWrangler(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['wrangler', ...args], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

// Get all photos from database
async function getPhotosFromDB(isRemote: boolean): Promise<Photo[]> {
  console.log(`📋 Fetching photos from ${isRemote ? 'remote' : 'local'} database...`);
  
  const flag = isRemote ? '--remote' : '--local';
  const output = await execWrangler([
    'd1', 'execute', 'foto_db', flag,
    '--json',
    '--command', 'SELECT id, r2_key FROM photos;'
  ]);
  
  // Parse JSON output
  const data = JSON.parse(output);
  const photos: Photo[] = [];
  
  // The output is an array with one element containing results
  if (data && data.length > 0 && data[0].results) {
    for (const row of data[0].results) {
      if (row.id && row.r2_key) {
        photos.push({
          id: row.id,
          filename: row.r2_key
        });
      }
    }
  }
  
  console.log(`✅ Found ${photos.length} photos in database`);
  return photos;
}

// Create watermarked thumbnail
async function createWatermarkedThumbnail(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // Create SVG watermark
  const watermarkSVG = Buffer.from(`
    <svg width="800" height="100">
      <style>
        .watermark { 
          fill: white; 
          font-size: 24px; 
          font-family: Arial, sans-serif; 
          font-weight: bold;
          opacity: 0.7;
        }
      </style>
      <text x="50%" y="50%" text-anchor="middle" class="watermark">${WATERMARK_TEXT}</text>
    </svg>
  `);
  
  await sharp(inputPath)
    .resize(THUMB_WIDTH, null, {
      withoutEnlargement: true,
      fit: 'inside'
    })
    .composite([{
      input: watermarkSVG,
      gravity: 'south',
      blend: 'over'
    }])
    .jpeg({ quality: THUMB_QUALITY })
    .toFile(outputPath);
}

// Upload thumbnail to R2
async function uploadToR2(
  filePath: string,
  r2Key: string,
  isRemote: boolean
): Promise<void> {
  const flag = isRemote ? '' : '--local';
  const args = [
    'r2', 'object', 'put',
    `foto-bucket/${r2Key}`,
    '--file', filePath
  ];
  
  if (flag) {
    args.push(flag);
  }
  
  await execWrangler(args);
}

// Update database with thumbnail key
async function updateDatabaseWithThumbnail(
  photoId: string,
  thumbnailKey: string,
  isRemote: boolean
): Promise<void> {
  const flag = isRemote ? '--remote' : '--local';
  await execWrangler([
    'd1', 'execute', 'foto_db', flag,
    '--command',
    `UPDATE photos SET thumbnail_key = '${thumbnailKey}' WHERE id = '${photoId}';`
  ]);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const isRemote = args.includes('--remote');
  
  console.log(`\n🎨 Generating watermarked thumbnails...`);
  console.log(`📍 Mode: ${isRemote ? 'REMOTE (production)' : 'LOCAL (development)'}\n`);
  
  // Create thumbnails directory
  await fs.mkdir(THUMB_DIR, { recursive: true });
  
  // Get photos from database
  const photos = await getPhotosFromDB(isRemote);
  
  if (photos.length === 0) {
    console.log('❌ No photos found in database');
    return;
  }
  
  let processed = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const photo of photos) {
    try {
      const inputPath = path.join(PHOTO_DIR, photo.filename);
      const thumbFilename = `thumb_${photo.filename}`;
      const outputPath = path.join(THUMB_DIR, thumbFilename);
      
      // Check if source file exists
      try {
        await fs.access(inputPath);
      } catch {
        console.log(`⏭️  Skipping ${photo.filename} - file not found in uploads`);
        skipped++;
        continue;
      }
      
      console.log(`\n📸 Processing: ${photo.filename}`);
      
      // Generate thumbnail
      console.log(`   🎨 Creating watermarked thumbnail...`);
      await createWatermarkedThumbnail(inputPath, outputPath);
      
      // Upload to R2
      console.log(`   📤 Uploading to R2...`);
      await uploadToR2(outputPath, thumbFilename, isRemote);
      
      // Update database
      console.log(`   💾 Updating database...`);
      await updateDatabaseWithThumbnail(photo.id, thumbFilename, isRemote);
      
      console.log(`   ✅ Done!`);
      processed++;
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error}`);
      failed++;
    }
  }
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 Summary:`);
  console.log(`   ✅ Processed: ${processed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  console.log(`✨ Thumbnail generation complete!`);
}

main().catch(console.error);
