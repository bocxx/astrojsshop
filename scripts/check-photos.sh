#!/bin/bash

# Script to verify that photos in uploads folder exist in both D1 database and R2 bucket
# Usage: ./scripts/check-photos.sh [--remote]

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
  MODE="production"
  echo -e "${YELLOW}⚠️  Checking REMOTE (production) environment${NC}"
else
  REMOTE_FLAG="--local"
  MODE="local"
  echo -e "${BLUE}📍 Checking LOCAL environment${NC}"
fi

PHOTO_DIR="./uploads/fotos"

if [ ! -d "$PHOTO_DIR" ]; then
  echo -e "${RED}❌ Error: Directory '$PHOTO_DIR' not found${NC}"
  exit 1
fi

echo -e "${BLUE}🔍 Scanning photos in uploads folder...${NC}"
echo ""

# Count photos
TOTAL_PHOTOS=0
IN_DB=0
IN_R2=0
MISSING_DB=0
MISSING_R2=0
MISSING_BOTH=0

declare -a MISSING_DB_FILES
declare -a MISSING_R2_FILES
declare -a MISSING_BOTH_FILES

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
  
  ((TOTAL_PHOTOS++))
  
  # Check if exists in database
  DB_EXISTS=$(npx wrangler d1 execute foto_db $REMOTE_FLAG --command="SELECT COUNT(*) as count FROM photos WHERE r2_key = '$filename';" 2>/dev/null | grep -E "^[0-9]+$" | tail -1)
  
  # Check if exists in R2
  R2_EXISTS=$(npx wrangler r2 object get foto-bucket/"$filename" $REMOTE_FLAG 2>&1)
  
  IN_DB_FLAG=false
  IN_R2_FLAG=false
  
  if [[ "$DB_EXISTS" == "1" ]]; then
    IN_DB_FLAG=true
    ((IN_DB++))
  fi
  
  if [[ ! "$R2_EXISTS" =~ "NoSuchKey" ]] && [[ ! "$R2_EXISTS" =~ "error" ]] && [[ ! "$R2_EXISTS" =~ "not found" ]]; then
    IN_R2_FLAG=true
    ((IN_R2++))
  fi
  
  # Determine status
  if $IN_DB_FLAG && $IN_R2_FLAG; then
    echo -e "${GREEN}✅ $filename${NC} - in DB and R2"
  elif $IN_DB_FLAG && ! $IN_R2_FLAG; then
    echo -e "${YELLOW}⚠️  $filename${NC} - in DB, ${RED}MISSING in R2${NC}"
    MISSING_R2_FILES+=("$filename")
    ((MISSING_R2++))
  elif ! $IN_DB_FLAG && $IN_R2_FLAG; then
    echo -e "${YELLOW}⚠️  $filename${NC} - ${RED}MISSING in DB${NC}, in R2"
    MISSING_DB_FILES+=("$filename")
    ((MISSING_DB++))
  else
    echo -e "${RED}❌ $filename${NC} - ${RED}MISSING in both DB and R2${NC}"
    MISSING_BOTH_FILES+=("$filename")
    ((MISSING_BOTH++))
  fi
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 SUMMARY (${MODE})${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Total photos in uploads:     ${BLUE}$TOTAL_PHOTOS${NC}"
echo -e "Photos in database:          ${GREEN}$IN_DB${NC}"
echo -e "Photos in R2 bucket:         ${GREEN}$IN_R2${NC}"
echo -e "Missing from database:       ${RED}$MISSING_DB${NC}"
echo -e "Missing from R2:             ${RED}$MISSING_R2${NC}"
echo -e "Missing from both:           ${RED}$MISSING_BOTH${NC}"
echo ""

if [ $MISSING_DB -gt 0 ]; then
  echo -e "${YELLOW}📝 Files missing from database:${NC}"
  for file in "${MISSING_DB_FILES[@]}"; do
    echo -e "   - $file"
  done
  echo ""
fi

if [ $MISSING_R2 -gt 0 ]; then
  echo -e "${YELLOW}📦 Files missing from R2:${NC}"
  for file in "${MISSING_R2_FILES[@]}"; do
    echo -e "   - $file"
  done
  echo ""
fi

if [ $MISSING_BOTH -gt 0 ]; then
  echo -e "${RED}❌ Files missing from both:${NC}"
  for file in "${MISSING_BOTH_FILES[@]}"; do
    echo -e "   - $file"
  done
  echo ""
fi

# Exit status
if [ $TOTAL_PHOTOS -eq $IN_DB ] && [ $TOTAL_PHOTOS -eq $IN_R2 ]; then
  echo -e "${GREEN}✨ All photos are synced! Everything looks good.${NC}"
  exit 0
else
  echo -e "${YELLOW}⚠️  Some photos are missing. Run upload-photos.sh to sync.${NC}"
  exit 1
fi
