-- Sample data for testing
-- Run with: npx wrangler d1 execute foto_db --local --file=./scripts/seed-sample-data.sql

-- Insert sample photos (update r2_key to match your uploaded files)
INSERT INTO photos (id, name, description, r2_key, available) VALUES
  ('photo-1', 'Mountain Sunset', 'Beautiful sunset over the mountains', 'mountain-sunset.jpg', 1),
  ('photo-2', 'Ocean Waves', 'Crashing waves at the beach', 'ocean-waves.jpg', 1),
  ('photo-3', 'Forest Path', 'A peaceful path through the forest', 'forest-path.jpg', 1),
  ('photo-4', 'City Lights', 'Urban nightscape with city lights', 'city-lights.jpg', 1),
  ('photo-5', 'Desert Landscape', 'Vast desert under blue sky', 'desert.jpg', 1);

-- Note: You'll still need to upload the actual image files to R2:
-- npx wrangler r2 object put foto-bucket/mountain-sunset.jpg --file=path/to/your/image.jpg --local
-- npx wrangler r2 object put foto-bucket/ocean-waves.jpg --file=path/to/your/image.jpg --local
-- etc.
