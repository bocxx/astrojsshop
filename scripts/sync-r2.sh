#!/bin/bash

# Script to sync photos to R2 (for when DB entries exist but R2 files don't)
# Usage: ./scripts/sync-r2.sh [--remote]

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check mode
REMOTE_FLAG=""
if [[ "$1" == "--remote" ]]; then
  REMOTE_FLAG=""
  echo -e "${YELLOW}⚠️  Running in REMOTE mode${NC}"
else
  REMOTE_FLAG="--local"
  echo -e "${BLUE}📍 Running in LOCAL mode${NC}"
fi

PHOTO_DIR="./uploads/fotos"

if [ ! -d "$PHOTO_DIR" ]; then
  echo -e "${RED}❌ Error: Directory '$PHOTO_DIR' not found${NC}"
  exit 1
fi

echo -e "${GREEN}📤 Uploading photos to R2...${NC}"
echo ""

UPLOAD_COUNT=0

for file in "$PHOTO_DIR"/*; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  filename=$(basename "$file")
  
  # Skip hidden files
  if [[ "$filename" == .* ]]; then
    continue
  fi
  
  # Check image extension
  if [[ ! "$filename" =~ \.(jpg|jpeg|png|gif|webp|heic|heif|JPG|JPEG|PNG|GIF|WEBP|HEIC|HEIF)$ ]]; then
    continue
  fi
  
  echo -e "${BLUE}📤 Uploading: $filename${NC}"
  
  if npx wrangler r2 object put foto-bucket/"$filename" --file="$file" $REMOTE_FLAG 2>&1 | grep -v "^$"; then
    echo -e "${GREEN}✅ Uploaded: $filename${NC}"
    ((UPLOAD_COUNT++))
  else
    echo -e "${RED}❌ Failed: $filename${NC}"
  fi
done

echo ""
echo -e "${GREEN}✨ Sync complete! Uploaded $UPLOAD_COUNT photos to R2${NC}"
