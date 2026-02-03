#!/bin/bash

# Script to rename all Samen voor Krimpen photos to SVK-2026-XXX format
# Usage: ./scripts/rename-photos.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PHOTO_DIR="./uploads/fotos"

if [ ! -d "$PHOTO_DIR" ]; then
  echo -e "${RED}❌ Error: Directory '$PHOTO_DIR' not found${NC}"
  exit 1
fi

echo -e "${BLUE}🔄 Renaming photos to SVK-2026-XXX format...${NC}"
echo ""

# Create a temporary directory for renamed files
TEMP_DIR="./uploads/fotos_renamed"
mkdir -p "$TEMP_DIR"

# Counter
counter=1

# Sort files to ensure consistent ordering
for file in "$PHOTO_DIR"/*.jpg "$PHOTO_DIR"/*.JPG; do
  if [ ! -f "$file" ]; then
    continue
  fi
  
  filename=$(basename "$file")
  
  # Skip hidden files
  if [[ "$filename" == .* ]]; then
    continue
  fi
  
  # Create new filename with zero-padded number
  new_filename=$(printf "SVK-2026-%03d.jpg" $counter)
  
  echo -e "${BLUE}$counter. $filename${NC} → ${GREEN}$new_filename${NC}"
  
  # Copy to temp directory with new name
  cp "$file" "$TEMP_DIR/$new_filename"
  
  ((counter++))
done

total_renamed=$((counter - 1))

echo ""
echo -e "${YELLOW}⚠️  Review the renamed files in $TEMP_DIR${NC}"
echo -e "${YELLOW}If everything looks good, run:${NC}"
echo -e "${BLUE}  rm -rf $PHOTO_DIR${NC}"
echo -e "${BLUE}  mv $TEMP_DIR $PHOTO_DIR${NC}"
echo ""
echo -e "${GREEN}✨ Renamed $total_renamed photos${NC}"
