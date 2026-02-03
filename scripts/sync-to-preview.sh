#!/bin/bash

# Script to sync photos from production bucket to preview bucket for local development
# Usage: ./scripts/sync-to-preview.sh

echo "🔄 Syncing photos from foto-bucket to foto-bucket-preview..."
echo ""

# Get list of all photos in uploads/fotos
PHOTO_DIR="./uploads/fotos"

if [ ! -d "$PHOTO_DIR" ]; then
  echo "❌ Error: Directory '$PHOTO_DIR' not found"
  exit 1
fi

COUNT=0
FAILED=0

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
  
  echo "📤 Uploading $filename to preview bucket..."
  
  if npx wrangler r2 object put "foto-bucket-preview/$filename" --file "$file" 2>/dev/null; then
    ((COUNT++))
    echo "✅ $filename uploaded"
  else
    ((FAILED++))
    echo "❌ Failed to upload $filename"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Uploaded:  $COUNT"
echo "❌ Failed:    $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✨ All photos synced to preview bucket!"
  exit 0
else
  echo "⚠️  Some photos failed to upload"
  exit 1
fi
