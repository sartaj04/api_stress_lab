#!/bin/bash

# Compress OG images (keeping 1014x653 dimensions)

set -e

echo "🗜️  Compressing OG Images (1014x653)"
echo "====================================="
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

compress_image() {
    local file=$1
    local filename=$(basename "$file")

    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⚠️  Skipping $filename (not found)${NC}"
        return
    fi

    local original_size=$(ls -lh "$file" | awk '{print $5}')
    local original_bytes=$(stat -f%z "$file")

    echo "Compressing: $filename"
    echo "  Original: $original_size"

    # Convert to optimized JPG, then save back as PNG
    magick "$file" -quality 85 -strip "${file}.tmp.jpg"

    # Check if JPG is smaller
    local jpg_bytes=$(stat -f%z "${file}.tmp.jpg")

    if [ $jpg_bytes -lt $original_bytes ]; then
        # Use compressed version
        magick "${file}.tmp.jpg" -strip "$file"
        rm "${file}.tmp.jpg"

        local new_size=$(ls -lh "$file" | awk '{print $5}')
        local saved_kb=$((($original_bytes - $(stat -f%z "$file")) / 1024))
        echo -e "  ${GREEN}✓ Compressed: $new_size (saved ${saved_kb}KB)${NC}"
    else
        # Keep original
        rm "${file}.tmp.jpg"
        echo -e "  ${YELLOW}ℹ️  Already optimized${NC}"
    fi

    echo ""
}

# Root OG images
compress_image "frontend/public/og-image.png"
compress_image "frontend/public/og-image-home.png"
compress_image "frontend/public/og-image-blog.png"
compress_image "frontend/public/twitter-image.png"

# Blog images
compress_image "frontend/public/blog/api-performance-bottlenecks.png"
compress_image "frontend/public/blog/how-to-performance-test-api.png"
compress_image "frontend/public/blog/load-testing-vs-stress-testing.png"
compress_image "frontend/public/blog/mvp-launch-checklist.png"
compress_image "frontend/public/blog/openapi-spec.png"
compress_image "frontend/public/blog/test-api-before-launch.png"

# Landing images
compress_image "frontend/public/landing/api-testing-startups.png"
compress_image "frontend/public/landing/load-testing-tools.png"
compress_image "frontend/public/landing/openapi-performance.png"
compress_image "frontend/public/landing/pre-launch-testing.png"
compress_image "frontend/public/landing/saas-testing.png"

echo -e "${GREEN}✅ Compression complete!${NC}"
echo ""
echo "All images kept at 1014x653, file sizes optimized"
