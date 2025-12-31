# OG Image Validation Guide

This guide explains how to validate that all Open Graph (OG) images are correctly placed and accessible for social media sharing.

## Quick Start

### 1. Validate Local Files
Check that all OG images exist in the correct locations:

```bash
cd frontend
npm run validate:og
```

This checks:
- ✅ All blog post OG images exist
- ✅ Static OG images (home, blog, twitter)
- ✅ Landing page OG images
- ✅ Image dimensions (warns if not 1200x630)

### 2. Validate on Local Dev Server
Start your dev server and check if images are accessible via HTTP:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Validate images are accessible
npm run validate:og:live
```

### 3. Validate on Production
Check your deployed site:

```bash
npm run validate:og:prod
```

Or with a custom URL:
```bash
node ../validate-og-images-live.js https://your-domain.com
```

## OG Image Locations

### Static Images (Root Level)
Located in `frontend/public/`:
- `og-image.png` - Default fallback
- `og-image-home.png` - Homepage
- `og-image-blog.png` - Blog listing page
- `twitter-image.png` - Twitter card default

### Blog Post Images
Located in `frontend/public/blog/`:
- `api-performance-bottlenecks.png`
- `how-to-performance-test-api.png`
- `load-testing-vs-stress-testing.png`
- `mvp-launch-checklist.png`
- `openapi-spec.png`
- `test-api-before-launch.png`

Referenced in MDX frontmatter:
```yaml
---
title: "Post Title"
ogImage: "/blog/image-name.png"
---
```

### Landing Page Images
Located in `frontend/public/landing/`:
- `api-testing-startups.png`
- `load-testing-tools.png`
- `openapi-performance.png`
- `pre-launch-testing.png`
- `saas-testing.png`

Referenced in layout.tsx files:
```typescript
export const metadata: Metadata = {
  openGraph: {
    images: ['/landing/image-name.png'],
  },
}
```

## Recommended Image Specs

### Dimensions
- **Optimal**: 1200 x 630 pixels (1.91:1 ratio)
- **Minimum**: 600 x 315 pixels
- **Maximum**: 8 MB file size

### Format
- PNG or JPG
- Keep file size under 300 KB for fast loading

### Why 1200x630?
- Facebook's recommended size
- Works across all social platforms
- Twitter, LinkedIn, Slack all support this size

## Testing OG Images on Social Platforms

### Facebook/Meta
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL
3. Click "Scrape Again" to refresh cache
4. Check the preview

### Twitter/X
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Check the card preview

### LinkedIn
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Check the preview

### General OG Tester
1. Visit: https://www.opengraph.xyz/
2. Enter your URL
3. See how it appears across all platforms

## Common Issues & Solutions

### Issue: Image not showing on social media
**Solution**:
- Verify file exists using `npm run validate:og`
- Check file path matches exactly (case-sensitive)
- Clear social platform cache using debugging tools above

### Issue: Old image still showing
**Solution**:
- Social platforms cache OG images
- Use platform debug tools to refresh cache
- Facebook: Use "Scrape Again" button
- Twitter: May take up to 7 days to update

### Issue: Image looks pixelated
**Solution**:
- Check dimensions are at least 1200x630
- Ensure you're using high-quality source images

### Issue: Wrong image showing
**Solution**:
1. Check MDX frontmatter has correct `ogImage` path
2. Verify layout.tsx has correct image in metadata
3. Check for typos in filename

## Code Reference

### Blog Posts
OG images are defined in MDX frontmatter:
- Files: `frontend/content/blog/*.mdx`
- Each file should have: `ogImage: "/blog/filename.png"`

### Layout Pages
OG images are defined in metadata:
- Files: `frontend/src/app/*/layout.tsx` or `*/page.tsx`
- Look for: `openGraph: { images: [...] }`

### Structured Data
Blog posts also include OG images in JSON-LD:
- Component: `frontend/src/components/StructuredData.tsx`
- Fallback: Uses `og-image-blog.png` if no specific image

## Adding New OG Images

### For a new blog post:
1. Create/export image at 1200x630
2. Save to `frontend/public/blog/post-slug.png`
3. Add to MDX frontmatter:
   ```yaml
   ogImage: "/blog/post-slug.png"
   ```
4. Validate: `npm run validate:og`

### For a new landing page:
1. Create/export image at 1200x630
2. Save to `frontend/public/landing/page-name.png`
3. Add to layout.tsx:
   ```typescript
   openGraph: {
     images: ['/landing/page-name.png'],
   }
   ```
4. Validate: `npm run validate:og`

## Automation

### Pre-commit Hook (Optional)
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
cd frontend && npm run validate:og
```

### CI/CD Integration
Add to your CI pipeline:
```yaml
- name: Validate OG Images
  run: |
    cd frontend
    npm run validate:og
```

## Manual Check Commands

```bash
# List all blog images
ls -la frontend/public/blog/

# List all landing images
ls -la frontend/public/landing/

# Check image dimensions (macOS)
sips -g pixelWidth -g pixelHeight frontend/public/og-image.png

# Check if image is accessible locally
curl -I http://localhost:3000/blog/image-name.png

# Check on production
curl -I https://apistresslab.com/blog/image-name.png
```

## Current Status

All OG images are correctly placed! ✅

- ✅ 6 blog post OG images
- ✅ 4 static OG images
- ✅ 5 landing page OG images
- ⚠️  Some images are 1024x1024 (consider resizing to 1200x630 for optimal social sharing)

## Resources

- [Open Graph Protocol](https://ogp.me/)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Inspector](https://www.linkedin.com/post-inspector/)
- [OpenGraph.xyz Tester](https://www.opengraph.xyz/)
