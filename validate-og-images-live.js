#!/usr/bin/env node

/**
 * Live OG Image Validator
 * Tests if OG images are accessible via HTTP on your deployed site
 * Usage: node validate-og-images-live.js [base-url]
 * Example: node validate-og-images-live.js https://apistresslab.com
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.argv[2] || 'http://localhost:3000';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const results = {
  success: [],
  errors: [],
  warnings: [],
};

function checkUrl(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        const contentType = res.headers['content-type'] || '';
        const contentLength = res.headers['content-length'] || 0;

        resolve({
          success: true,
          statusCode: res.statusCode,
          contentType,
          size: contentLength,
        });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        resolve({
          success: false,
          statusCode: res.statusCode,
          redirect: res.headers.location,
        });
      } else {
        resolve({
          success: false,
          statusCode: res.statusCode,
        });
      }

      // Drain response to free up memory
      res.resume();
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Request timeout',
      });
    });
  });
}

async function validateImage(imagePath, description) {
  const url = `${BASE_URL}${imagePath}`;
  console.log(`  Checking: ${imagePath}`);

  const result = await checkUrl(url);

  if (result.success) {
    const sizeKB = (result.size / 1024).toFixed(2);
    results.success.push(
      `✓ ${description}: ${imagePath} (${sizeKB} KB, ${result.contentType})`
    );

    // Warn if image is too large (>300KB)
    if (result.size > 300000) {
      results.warnings.push(
        `⚠ ${description}: Large file size ${sizeKB} KB (consider optimizing)`
      );
    }

    // Warn if content type is not image
    if (!result.contentType.startsWith('image/')) {
      results.warnings.push(
        `⚠ ${description}: Unexpected content type ${result.contentType}`
      );
    }
  } else if (result.redirect) {
    results.warnings.push(
      `⚠ ${description}: Redirects to ${result.redirect} (${result.statusCode})`
    );
  } else {
    results.errors.push(
      `✗ ${description}: ${result.error || `HTTP ${result.statusCode}`}`
    );
  }
}

async function main() {
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Live OG Image Validation${colors.reset}`);
  console.log(`${colors.blue}   Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  // Check static OG images
  console.log(`${colors.cyan}🖼️  Checking static OG images...${colors.reset}`);
  await validateImage('/og-image.png', 'Default OG');
  await validateImage('/og-image-home.png', 'Home OG');
  await validateImage('/og-image-blog.png', 'Blog OG');
  await validateImage('/twitter-image.png', 'Twitter Card');

  // Check blog post OG images
  console.log(`\n${colors.cyan}📝 Checking blog post OG images...${colors.reset}`);
  const blogImages = [
    'api-performance-bottlenecks.png',
    'how-to-performance-test-api.png',
    'load-testing-vs-stress-testing.png',
    'mvp-launch-checklist.png',
    'openapi-spec.png',
    'test-api-before-launch.png',
  ];

  for (const img of blogImages) {
    await validateImage(`/blog/${img}`, `Blog: ${img}`);
  }

  // Check landing page OG images
  console.log(`\n${colors.cyan}🚀 Checking landing page OG images...${colors.reset}`);
  const landingImages = [
    'api-testing-startups.png',
    'load-testing-tools.png',
    'openapi-performance.png',
    'pre-launch-testing.png',
    'saas-testing.png',
  ];

  for (const img of landingImages) {
    await validateImage(`/landing/${img}`, `Landing: ${img}`);
  }

  // Check metadata on actual pages
  console.log(`\n${colors.cyan}🔍 Checking page metadata...${colors.reset}`);
  const pagesToCheck = [
    { url: '/', description: 'Home page' },
    { url: '/blog', description: 'Blog index' },
    { url: '/blog/load-testing-vs-stress-testing', description: 'Blog post' },
    { url: '/api-load-testing-tools', description: 'Landing page' },
  ];

  for (const page of pagesToCheck) {
    const result = await checkUrl(`${BASE_URL}${page.url}`);
    if (result.success) {
      results.success.push(`✓ ${page.description} accessible`);
    } else {
      results.errors.push(`✗ ${page.description} not accessible`);
    }
  }

  // Print results
  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}   Results${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}`);

  if (results.success.length > 0) {
    console.log(`\n${colors.green}✓ Success (${results.success.length}):${colors.reset}`);
    results.success.forEach((msg) => console.log(`  ${colors.green}${msg}${colors.reset}`));
  }

  if (results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠ Warnings (${results.warnings.length}):${colors.reset}`);
    results.warnings.forEach((msg) => console.log(`  ${colors.yellow}${msg}${colors.reset}`));
  }

  if (results.errors.length > 0) {
    console.log(`\n${colors.red}✗ Errors (${results.errors.length}):${colors.reset}`);
    results.errors.forEach((msg) => console.log(`  ${colors.red}${msg}${colors.reset}`));
  }

  console.log(`\n${colors.blue}═══════════════════════════════════════════${colors.reset}`);
  console.log(
    `${colors.cyan}Summary: ${colors.green}${results.success.length} passed${colors.reset}, ${colors.yellow}${results.warnings.length} warnings${colors.reset}, ${colors.red}${results.errors.length} errors${colors.reset}`
  );
  console.log(`${colors.blue}═══════════════════════════════════════════${colors.reset}\n`);

  process.exit(results.errors.length > 0 ? 1 : 0);
}

main().catch(console.error);
