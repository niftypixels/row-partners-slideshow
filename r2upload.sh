#!/bin/bash

BUCKET_NAME="row-partners-slideshow"
FRAMES_DIR="./public/frames"

find "$FRAMES_DIR" -type f -name "*.webp" | while read file; do
  key="${file#./public/}"
  echo "Uploading $key..."
  npx wrangler r2 object put "$BUCKET_NAME/$key" --file="$file" --remote
done

echo "Done."
