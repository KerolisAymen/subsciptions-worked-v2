/**
 * Sitemap Generator Script
 * This script automatically generates a sitemap.xml file by analyzing the application routes
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configuration
const BASE_URL = process.env.BASE_URL || 'https://yourdomain.com';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');

// Pages/routes to include in the sitemap
// These should match your application's actual routes
const pages = [
  { url: '/', priority: '1.0', changeFreq: 'daily' },
  { url: '/about', priority: '0.8', changeFreq: 'monthly' },
  { url: '/pricing', priority: '0.9', changeFreq: 'weekly' },
  { url: '/contact', priority: '0.8', changeFreq: 'monthly' },
  { url: '/features', priority: '0.9', changeFreq: 'weekly' },
  { url: '/faq', priority: '0.7', changeFreq: 'monthly' },
  { url: '/terms', priority: '0.6', changeFreq: 'yearly' },
  { url: '/privacy', priority: '0.6', changeFreq: 'yearly' },
  { url: '/blog', priority: '0.9', changeFreq: 'daily' }
  // Add additional pages as needed
];

// Don't include these pages in sitemap
const excludedPages = [
  '/login',
  '/signup',
  '/dashboard',
  '/account',
  '/reset-password',
  '/admin',
  '/user',
  '/payments',
  '/logout',
  '/callback',
  '/api/'
];

/**
 * Generates the XML content for the sitemap
 */
function generateSitemapXML() {
  const today = new Date().toISOString();
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '  xmlns:xhtml="http://www.w3.org/1999/xhtml"\n';
  xml += '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '    http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

  // Add each page to the sitemap
  pages.forEach(page => {
    if (excludedPages.some(excluded => page.url.includes(excluded))) {
      return; // Skip excluded pages
    }
    
    xml += '  <url>\n';
    xml += `    <loc>${BASE_URL}${page.url}</loc>\n`;
    xml += `    <lastmod>${today}</lastmod>\n`;
    xml += `    <changefreq>${page.changeFreq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  
  return xml;
}

/**
 * Saves the sitemap XML to file
 */
function saveSitemap(xml) {
  fs.writeFileSync(OUTPUT_FILE, xml);
  console.log(`Sitemap generated at: ${OUTPUT_FILE}`);
}

// Generate and save the sitemap
try {
  const sitemapXML = generateSitemapXML();
  saveSitemap(sitemapXML);
  console.log('Sitemap generation completed successfully!');
} catch (error) {
  console.error('Failed to generate sitemap:', error);
}
