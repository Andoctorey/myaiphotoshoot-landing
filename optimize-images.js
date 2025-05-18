#!/usr/bin/env node

/**
 * This script only generates WebP versions of JPG/PNG files if they don't already exist
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

// Only generates WebP versions of images if they don't already exist
async function optimizeImages() {
  const files = fs.readdirSync(IMAGE_DIR);
  const existingFiles = new Set(files);
  
  for (const file of files) {
    const filePath = path.join(IMAGE_DIR, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isFile() && /\.(jpg|jpeg|png)$/i.test(file)) {
      
      try {
        // Check if WebP version already exists
        const webpFilename = file.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        const webpPath = path.join(IMAGE_DIR, webpFilename);
        
        if (!existingFiles.has(webpFilename)) {
          console.log(`Generating WebP for ${file}...`);
          await sharp(filePath)
            .webp({ quality: 80 })
            .toFile(webpPath);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err);
      }
    }
    // Skip any WebP files completely
  }
  
  console.log('Image processing complete!');
}

optimizeImages().catch(err => {
  console.error('Error during image processing:', err);
  process.exit(1);
}); 