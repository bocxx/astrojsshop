#!/bin/bash

# Script to upload photos to R2 and add them to the database
# Usage: ./scripts/upload-photos.sh [--remote]

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in remote mode
REMOTE_FLAG=""
if [[ "$1" == "--remote" ]]; then
  REMOTE_FLAG="--remote"
  echo -e "${YELLOW}⚠️  Running in REMOTE mode (production)${NC}"
else
  REMOTE_FLAG="--local"
  echo -e "${BLUE}📍 Running in LOCAL mode (development)${NC}"
fi

# Source directory for photos
PHOTO_DIR="./uploads/fotos"

# Check if directory exists
if [ ! -d "$PHOTO_DIR" ]; then
  echo -e "${RED}❌ Error: Directory '$PHOTO_DIR' does not exist${NC}"
  echo -e "${BLUE}💡 Create it with: mkdir -p $PHOTO_DIR${NC}"
  exit 1
fi

# Check if directory is empty
if [ -z "$(ls -A $PHOTO_DIR)" ]; then
  echo -e "${YELLOW}⚠️  No photos found in $PHOTO_DIR${NC}"
  echo -e "${BLUE}💡 Add photos to this directory first${NC}"
  exit 0
fi

echo -e "${GREEN}📸 Found photos to upload:${NC}"
ls -1 "$PHOTO_DIR"
echo ""

# Counter for uploaded photos
UPLOAD_COUNT=0

# Loop through all image files in the directory
for file in "$PHOTO_DIR"/*; do
  # Check if file exists (handles empty directory case)
  if [ ! -f "$file" ]; then
    continue
  fi
  
  # Get filename without path
  filename=$(basename "$file")
  
  # Skip hidden files
  if [[ "$filename" == .* ]]; then
    continue
  fi
  
  # Check if it's an image file
  if [[ ! "$filename" =~ \.(jpg|jpeg|png|gif|webp|heic|heif|JPG|JPEG|PNG|GIF|WEBP|HEIC|HEIF)$ ]]; then
    echo -e "${YELLOW}⏭️  Skipping non-image file: $filename${NC}"
    continue
  fi
  
  echo -e "${BLUE}📤 Uploading: $filename${NC}"
  
  # Upload to R2
  if npx wrangler r2 object put foto-bucket/"$filename" --file="$file" $REMOTE_FLAG 2>&1; then
    echo -e "${GREEN}✅ Uploaded to R2: $filename${NC}"
    
    # Generate UUID for database
    UUID=$(uuidgen)
    
    # Remove file extension for display name
    DISPLAY_NAME="${filename%.*}"
    # Replace underscores and hyphens with spaces
    DISPLAY_NAME="${DISPLAY_NAME//_/ }"
    DISPLAY_NAME="${DISPLAY_NAME//-/ }"
    
    # Add to database
    SQL="INSERT INTO photos (id, name, description, r2_key, available, created_at) VALUES ('$UUID', '$DISPLAY_NAME', 'Uploaded via script', '$filename', 1, unixepoch());"
    
    if npx wrangler d1 execute foto_db $REMOTE_FLAG --command="$SQL" 2>&1; then
      echo -e "${GREEN}✅ Added to database: $DISPLAY_NAME${NC}"
      ((UPLOAD_COUNT++))
      
      # Optionally move processed file to archive
      # mkdir -p "$PHOTO_DIR/processed"
      # mv "$file" "$PHOTO_DIR/processed/"
      
    else
      echo -e "${RED}❌ Failed to add to database: $filename${NC}"
    fi
  else
    echo -e "${RED}❌ Failed to upload: $filename${NC}"
  fi
  
  echo ""
done

echo -e "${GREEN}✨ Upload complete! Total photos uploaded: $UPLOAD_COUNT${NC}"

if [ $UPLOAD_COUNT -gt 0 ]; then
  echo -e "${BLUE}💡 You can now view the photos in your gallery${NC}"
  if [[ "$REMOTE_FLAG" == "--local" ]]; then
    echo -e "${BLUE}🌐 Visit: http://localhost:4321${NC}"
  fi
fi
