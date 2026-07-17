#!/usr/bin/env node

/**
 * Generate PWA icons from base logo
 * Usage: node scripts/generate-pwa-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logoPath = path.join(__dirname, '../public/sx-time-tasks-logo.png');
const publicDir = path.join(__dirname, '../public');

if (!fs.existsSync(logoPath)) {
  console.error('❌ Logo not found:', logoPath);
  process.exit(1);
}

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-192-maskable.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512 }
];

console.log('🎨 Generating PWA icons...\n');

Promise.all(
  sizes.map(({ name, size }) => {
    const outputPath = path.join(publicDir, name);
    console.log(`  → ${name} (${size}x${size})`);
    return sharp(logoPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
  })
).then(() => {
  console.log('\n✅ PWA icons generated successfully!');
  console.log('\nFiles created:');
  sizes.forEach(({ name }) => {
    console.log(`  ✓ public/${name}`);
  });
}).catch((error) => {
  console.error('❌ Error generating icons:', error.message);
  process.exit(1);
});
