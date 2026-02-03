#!/bin/bash

# Script to generate watermarked thumbnails for all photos
# Usage: ./scripts/generate-thumbnails.sh [--remote]

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check mode
REMOTE_FLAG=""
if [[ "$1" == "--remote" ]]; then
  REMOTE_FLAG="--remote"
  echo -e "${YELLOW}⚠️  Running in REMOTE mode (production)${NC}"
else
  echo -e "${BLUE}📍 Running in LOCAL mode (development)${NC}"
fi

echo -e "${BLUE}🎨 Generating watermarked thumbnails...${NC}"
echo ""

# Check if tsx is available
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ Error: npx not found. Please install Node.js${NC}"
    exit 1
fi

# Run the TypeScript script
npx tsx scripts/generate-thumbnails.ts $REMOTE_FLAG

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo -e "${GREEN}✨ Thumbnail generation completed successfully!${NC}"
else
    echo -e "${RED}❌ Thumbnail generation failed with exit code $exit_code${NC}"
    exit $exit_code
fi
