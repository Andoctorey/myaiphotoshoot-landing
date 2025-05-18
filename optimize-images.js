#!/usr/bin/env node

/**
 * This script optimizes images in the public directory
 * Run with: node optimize-images.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if sharp is installed
try {
  require.resolve('sharp');
} catch (e) {
  console.log('Installing sharp for image optimization...');
  execSync('npm install --save-dev sharp', { stdio: 'inherit' });
}

const sharp = require('sharp');

const IMAGE_DIR = path.join(__dirname, 'public', 'images');

// Create the images directory if it doesn't exist
if (!fs.existsSync(IMAGE_DIR)) {
  console.log('Images directory not found. Creating it...');
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

// Process all images in the public/images directory
async function optimizeImages() {
  const files = fs.readdirSync(IMAGE_DIR);
  
  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && /\.(jpg|jpeg|png|webp)$/i.test(file)) {
      const outputPath = path.join(IMAGE_DIR, file);
      
      console.log(`Optimizing ${file}...`);
      
      try {
        await sharp(filePath)
          .webp({ quality: 80 }) // Convert to WebP with 80% quality
          .toFile(outputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp'));
        
        // Also create optimized versions of original format
        if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
          await sharp(filePath)
            .jpeg({ quality: 85, mozjpeg: true })
            .toFile(outputPath + '.optimized');
          fs.renameSync(outputPath + '.optimized', outputPath);
        } else if (file.endsWith('.png')) {
          await sharp(filePath)
            .png({ quality: 85, compressionLevel: 9 })
            .toFile(outputPath + '.optimized');
          fs.renameSync(outputPath + '.optimized', outputPath);
        }
      } catch (err) {
        console.error(`Error optimizing ${file}:`, err);
      }
    }
  }
  
  console.log('Image optimization complete!');
}

optimizeImages().catch(err => {
  console.error('Error during image optimization:', err);
  process.exit(1);
}); 