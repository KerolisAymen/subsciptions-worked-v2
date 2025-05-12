/**
 * SEO Image Generator Script
 * This script generates optimized placeholder images for SEO and social media sharing
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Configuration
const SEO_IMAGE_DIR = path.join(__dirname, '../public/images/seo');
const BRAND_COLOR = '#0078d4'; // Primary brand color
const TEXT_COLOR = '#ffffff';
const BRAND_NAME = 'Subscription Service';

// Ensure SEO image directory exists
if (!fs.existsSync(SEO_IMAGE_DIR)) {
  fs.mkdirSync(SEO_IMAGE_DIR, { recursive: true });
  console.log(`Created directory: ${SEO_IMAGE_DIR}`);
}

// Image specifications for different platforms
const imageSpecs = [
  { name: 'og-default.png', width: 1200, height: 630, type: 'Open Graph' },
  { name: 'twitter-card.png', width: 1200, height: 600, type: 'Twitter Card' },
  { name: 'favicon.png', width: 512, height: 512, type: 'Favicon' },
  { name: 'apple-touch-icon.png', width: 180, height: 180, type: 'Apple Touch' },
  { name: 'og-wide.png', width: 1600, height: 900, type: 'Wide Open Graph' }
];

/**
 * Creates a placeholder image with text
 */
function createPlaceholderImage(width, height, type, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fill background with brand color
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillRect(0, 0, width, height);

  // Draw a subtle pattern for visual interest
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  const patternSize = Math.min(width, height) / 10;
  for (let x = 0; x < width; x += patternSize) {
    for (let y = 0; y < height; y += patternSize) {
      if ((x + y) % (patternSize * 2) === 0) {
        ctx.fillRect(x, y, patternSize, patternSize);
      }
    }
  }

  // Add text
  const fontSize = Math.min(width, height) / 15;
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw brand name
  ctx.fillText(BRAND_NAME, width / 2, height / 2 - fontSize);
  
  // Draw image type info
  ctx.font = `${fontSize * 0.7}px Arial, sans-serif`;
  ctx.fillText(`${width}×${height} ${type}`, width / 2, height / 2 + fontSize);

  // Save the image
  const out = fs.createWriteStream(path.join(SEO_IMAGE_DIR, filename));
  const stream = canvas.createPNGStream();
  stream.pipe(out);
  
  return new Promise((resolve, reject) => {
    out.on('finish', () => resolve(filename));
    out.on('error', reject);
  });
}

// Generate all images
async function generateAllImages() {
  console.log('Generating SEO images...');
  
  try {
    const promises = imageSpecs.map(spec => 
      createPlaceholderImage(spec.width, spec.height, spec.type, spec.name)
    );
    
    const results = await Promise.all(promises);
    console.log(`Successfully generated ${results.length} SEO images:`);
    results.forEach(filename => console.log(`- ${filename}`));
  } catch (error) {
    console.error('Error generating images:', error);
  }
}

// Execute the function
generateAllImages();
