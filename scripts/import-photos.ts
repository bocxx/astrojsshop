import fs from 'fs';
import { spawn } from 'child_process';

// Execute wrangler command
async function execWrangler(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('npx', ['wrangler', ...args], {
      stdio: 'inherit'
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with code ${code}`));
      } else {
        resolve();
      }
    });
  });
}

async function main() {
  // Read the JSON data
  const data = JSON.parse(fs.readFileSync('./temp_photos.json', 'utf-8'));
  const photos = data[0].results;
  
  console.log(`Importing ${photos.length} photos...`);
  
  let imported = 0;
  
  // Insert photos one by one (slower but more reliable)
  for (const photo of photos) {
    const name = photo.name.replace(/'/g, "''");
    const desc = (photo.description || '').replace(/'/g, "''");
    const r2_key = photo.r2_key;
    const thumb_key = photo.thumbnail_key || '';
    
    const sql = `INSERT INTO photos (id, name, description, r2_key, thumbnail_key, available, created_at) VALUES ('${photo.id}', '${name}', '${desc}', '${r2_key}', '${thumb_key}', ${photo.available}, ${photo.created_at});`;
    
    try {
      await execWrangler([
        'd1', 'execute', 'foto_db', '--local',
        '--command', sql
      ]);
      imported++;
      if (imported % 20 === 0) {
        console.log(`  Imported ${imported}/${photos.length}...`);
      }
    } catch (error) {
      console.error(`Failed to import photo ${photo.id}:`, error);
    }
  }
  
  console.log(`✅ Imported ${imported} photos`);
}

main().catch(console.error);
