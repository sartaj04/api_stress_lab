#!/usr/bin/env node

/**
 * OG Image Validator
 * Validates that all Open Graph images referenced in the codebase actually exist
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, 'frontend/public');
const CONTENT_DIR = path.join(__dirname, 'frontend/content');
const SRC_DIR = path.join(__dirname, 'frontend/src');

const errors = [];
const warnings = [];
const success = [];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function checkFileExists(imagePath) {
  const fullPath = path.join(PUBLIC_DIR, imagePath);
  return fs.existsSync(fullPath);
}

function extractOgImagesFromMDX() {
  console.log(`\n${colors.cyan}📝 Checking blog post OG images...${colors.reset}`);

  const blogDir = path.join(CONTENT_DIR, 'blog');
  if (!fs.existsSync(blogDir)) {
    warnings.push('Blog directory not found');
    return;
  }

  const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

  files.forEach(file => {
    const content = fs.readFileSync(path.join(blogDir, file), 'utf-8');
    const ogImageMatch = content.match(/ogImage:\s*["']([^"']+)["']/);

    if (ogImageMatch) {
      const imagePath = ogImageMatch[1].replace(/^\//, ''); // Remove leading slash
      const exists = checkFileExists(imagePath);

      if (exists) {
        success.push(`✓ ${file}: ${imagePath}`);
      } else {
        errors.push(`✗ ${file}: Missing image ${imagePath}`);
      }
    } else {
      warnings.push(`⚠ ${file}: No ogImage defined`);
    }
  });
}

function checkStaticOgImages() {
  console.log(`\n${colors.cyan}🖼️  Checking static OG images...${colors.reset}`);

  const staticImages = [
    'og-image.png',
    'og-image-home.png',
    'og-image-blog.png',
    'twitter-image.png',
  ];

  staticImages.forEach(image => {
    if (checkFileExists(image)) {
      success.push(`✓ Static: ${image}`);
    } else {
      errors.push(`✗ Static: Missing ${image}`);
    }
  });
}

function checkLandingPageImages() {
  console.log(`\n${colors.cyan}🚀 Checking landing page OG images...${colors.reset}`);

  // Read layout files to extract OG image references
  const layouts = [
    { file: 'src/app/openapi-performance-testing/layout.tsx', expected: 'landing/openapi-performance.png' },
    { file: 'src/app/api-load-testing-tools/layout.tsx', expected: 'landing/load-testing-tools.png' },
    { file: 'src/app/api-stress-testing-saas/layout.tsx', expected: 'landing/saas-testing.png' },
    { file: 'src/app/pre-launch-api-testing/layout.tsx', expected: 'landing/pre-launch-testing.png' },
    { file: 'src/app/api-testing-for-startups/layout.tsx', expected: 'landing/api-testing-startups.png' },
  ];

  layouts.forEach(({ file, expected }) => {
    const fullPath = path.join(__dirname, 'frontend', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      // Extract image URL from openGraph images array
      const imageMatch = content.match(/images:\s*\[['"]([^'"]+)['"]\]/);

      if (imageMatch) {
        const imagePath = imageMatch[1].replace(/^\//, '');
        const exists = checkFileExists(imagePath);

        if (exists) {
          success.push(`✓ ${path.basename(path.dirname(file))}: ${imagePath}`);
        } else {
          errors.push(`✗ ${path.basename(path.dirname(file))}: Missing ${imagePath}`);
        }
      }
    }
  });
}

function checkImageDimensions() {
  console.log(`\n${colors.cyan}📐 Checking image dimensions (recommended: 1200x630)...${colors.reset}`);

  try {
    const { execSync } = require('child_process');

    // Check all OG images
    const imagesToCheck = [
      'og-image.png',
      'og-image-home.png',
      'og-image-blog.png',
      'blog/load-testing-vs-stress-testing.png',
      'blog/openapi-spec.png',
    ];

    imagesToCheck.forEach(image => {
      const fullPath = path.join(PUBLIC_DIR, image);
      if (fs.existsSync(fullPath)) {
        try {
          // Using sips (macOS) or identify (ImageMagick) to get dimensions
          const result = execSync(`sips -g pixelWidth -g pixelHeight "${fullPath}" 2>/dev/null || echo "skip"`,
            { encoding: 'utf-8' });

          if (!result.includes('skip')) {
            const widthMatch = result.match(/pixelWidth:\s*(\d+)/);
            const heightMatch = result.match(/pixelHeight:\s*(\d+)/);

            if (widthMatch && heightMatch) {
              const width = parseInt(widthMatch[1]);
              const height = parseInt(heightMatch[1]);

              // OG image recommended size is 1200x630
              if (width === 1200 && height === 630) {
                success.push(`✓ ${image}: ${width}x${height} (optimal)`);
              } else if (width >= 1200 && height >= 630) {
                warnings.push(`⚠ ${image}: ${width}x${height} (larger than recommended 1200x630)`);
              } else {
                warnings.push(`⚠ ${image}: ${width}x${height} (recommended: 1200x630)`);
              }
            }
          }
        } catch (e) {
          // Skip dimension check if tools not available
        }
      }
    });
  } catch (e) {
    console.log(`  ${colors.yellow}⚠ Dimension checking skipped (requires sips or ImageMagick)${colors.reset}`);
  }
}

// Run all checks
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}   OG Image Validation Report${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

extractOgImagesFromMDX();
checkStaticOgImages();
checkLandingPageImages();
checkImageDimensions();

// Print results
console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
console.log(`${colors.blue}   Results${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

if (success.length > 0) {
  console.log(`\n${colors.green}✓ Success (${success.length}):${colors.reset}`);
  success.forEach(msg => console.log(`  ${colors.green}${msg}${colors.reset}`));
}

if (warnings.length > 0) {
  console.log(`\n${colors.yellow}⚠ Warnings (${warnings.length}):${colors.reset}`);
  warnings.forEach(msg => console.log(`  ${colors.yellow}${msg}${colors.reset}`));
}

if (errors.length > 0) {
  console.log(`\n${colors.red}✗ Errors (${errors.length}):${colors.reset}`);
  errors.forEach(msg => console.log(`  ${colors.red}${msg}${colors.reset}`));
}

console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
console.log(`${colors.cyan}Summary: ${colors.green}${success.length} passed${colors.reset}, ${colors.yellow}${warnings.length} warnings${colors.reset}, ${colors.red}${errors.length} errors${colors.reset}`);
console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

// Exit with error code if there are errors
process.exit(errors.length > 0 ? 1 : 0);
