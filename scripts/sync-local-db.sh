#!/bin/bash

# Script to reset local database and copy from remote
# Usage: ./scripts/sync-local-db.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 Syncing local database from remote...${NC}"
echo ""

# Step 1: Backup if needed
echo -e "${YELLOW}⚠️  This will replace your local database with remote data!${NC}"
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Cancelled${NC}"
    exit 1
fi

# Step 2: Drop and recreate local database
echo -e "${BLUE}📋 Resetting local database...${NC}"

# Delete the local database file
rm -rf .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite*

echo -e "${GREEN}✅ Local database cleared${NC}"

# Step 3: Recreate schema
echo -e "${BLUE}📝 Creating schema...${NC}"
npx wrangler d1 execute foto_db --local --file=./schema.sql

echo -e "${GREEN}✅ Schema created${NC}"
echo ""

# Step 4: Export from remote and import to local
echo -e "${BLUE}📦 Copying photos from remote...${NC}"

# Get remote data as SQL
npx wrangler d1 export foto_db --remote --output=./temp_export.sql 2>/dev/null || {
    # If export doesn't work, do manual copy
    echo -e "${YELLOW}Using manual copy method...${NC}"
    
    # Get photos from remote
    REMOTE_DATA=$(npx wrangler d1 execute foto_db --remote --json --command="SELECT * FROM photos;")
    
    # Save to temp file
    echo "$REMOTE_DATA" > ./temp_photos.json
    
    # Use node script to insert
    npx tsx ./scripts/import-photos.ts
    
    rm -f ./temp_photos.json
}

echo ""
echo -e "${GREEN}✨ Local database synced!${NC}"
echo ""
echo -e "${BLUE}📊 Verification:${NC}"
npx wrangler d1 execute foto_db --local --command="SELECT COUNT(*) as total FROM photos;"
echo ""
npx wrangler d1 execute foto_db --local --command="SELECT name, r2_key FROM photos LIMIT 3;"
