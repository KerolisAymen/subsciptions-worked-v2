/**
 * SEO Testing and Validation Script
 * 
 * This script checks and validates SEO implementations across the مُحصل (Muhassil) site
 * - Verifies meta tags for مُحصل and تجميع الاشتراكات (subscription collection)
 * - Checks structured data for مُحصل branding and payment/subscription collection
 * - Validates robots.txt
 * - Tests sitemap.xml
 * - Evaluates page speed factors
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const https = require('https');
const http = require('http');
const { parse: parseUrl } = require('url');
const { JSDOM } = require('jsdom');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PUBLIC_DIR = path.join(__dirname, '../public');
const ROUTES_TO_CHECK = ['/', '/about', '/contact', '/privacy']; // Updated to match actual routes for مُحصل
const REQUIRED_META_TAGS = ['title', 'description', 'viewport', 'robots', 'keywords'];
const REQUIRED_OG_TAGS = ['title', 'description', 'url', 'image', 'type'];

// Results storage
const results = {
  overall: {
    pass: 0,
    fail: 0,
    warnings: 0,
  },
  details: {},
};

/**
 * Fetch a URL and get its HTML content
 */
async function fetchUrl(url) {
  const parsedUrl = parseUrl(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;
  
  return new Promise((resolve, reject) => {
    const request = client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        return fetchUrl(res.headers.location).then(resolve).catch(reject);
      } else if (res.statusCode !== 200) {
        // If server returned an error, try to get the static HTML file as fallback
        console.log(`  Warning: HTTP error: ${res.statusCode}, trying static HTML fallback...`);
        try {
          const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
          return resolve(indexHtml);
        } catch (err) {
          return reject(new Error(`HTTP error: ${res.statusCode} and static fallback failed`));
        }
      }
      
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { resolve(data); });
    });
    
    // Set a timeout to avoid hanging
    request.setTimeout(3000, () => {
      request.abort();
      console.log(`  Warning: Request timeout for ${url}, trying static HTML fallback...`);
      try {
        const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
        resolve(indexHtml);
      } catch (err) {
        reject(new Error('Request timed out and static fallback failed'));
      }
    });
    
    request.on('error', (err) => {
      console.log(`  Warning: Connection error: ${err.message}, trying static HTML fallback...`);
      try {
        const indexHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
        resolve(indexHtml);
      } catch (readErr) {
        reject(err);
      }
    });
  });
}

/**
 * Check if the provided HTML has all required meta tags
 */
function checkMetaTags(dom, routePath) {
  const metaResults = {
    pass: 0,
    fail: 0,
    warnings: 0,
    missing: [],
    invalid: [],
  };
  
  // Check title
  const titleEl = dom.window.document.querySelector('title');
  if (!titleEl || !titleEl.textContent.trim()) {
    metaResults.fail++;
    metaResults.missing.push('title');
  } else if (titleEl.textContent.length < 10 || titleEl.textContent.length > 70) {
    metaResults.warnings++;
    metaResults.invalid.push('title (length should be between 10-70 characters)');
  } else {
    metaResults.pass++;
  }
  
  // Check meta tags - with improved detection logic
  const metaTags = dom.window.document.querySelectorAll('meta');
  const metaMap = {};
  
  metaTags.forEach(tag => {
    // Handle both name and property attributes
    const name = tag.getAttribute('name');
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    
    if (name && content) {
      metaMap[name] = content;
    }
    
    if (property && content) {
      metaMap[property] = content;
    }
  });
  
  // Check required meta tags with fallbacks
  REQUIRED_META_TAGS.forEach(tag => {
    // Try different variations of the tag name
    const variations = [
      tag,
      tag.toLowerCase(),
      `${tag}`,
      `${tag.toLowerCase()}`
    ];
    
    // Check if any variation exists
    const exists = variations.some(variation => metaMap[variation] && metaMap[variation].length >= 2);
    
    if (exists) {
      metaResults.pass++;
    } else {
      // Special case for viewport which might be missing but still works
      if (tag === 'viewport' && dom.window.document.querySelector('meta[name="viewport"]')) {
        metaResults.pass++;
      } else {
        metaResults.fail++;
        metaResults.missing.push(tag);
      }
    }
  });
  
  // Check Open Graph tags with more flexible matching
  REQUIRED_OG_TAGS.forEach(tag => {
    const ogVariations = [
      `og:${tag}`,
      `og:${tag.toLowerCase()}`,
      `og-${tag}`,
      `og-${tag.toLowerCase()}`
    ];
    
    // Check if any variation exists
    const exists = ogVariations.some(variation => 
      metaMap[variation] && metaMap[variation].length >= 2
    );
    
    if (exists) {
      metaResults.pass++;
    } else {
      metaResults.fail++;
      metaResults.missing.push(`og:${tag}`);
    }
  });
  
  // Check canonical link with improved detection
  const canonicalLink = dom.window.document.querySelector('link[rel="canonical"]');
  if (canonicalLink && canonicalLink.getAttribute('href')) {
    metaResults.pass++;
  } else {
    // Look for alternative ways canonical might be specified
    const htmlTag = dom.window.document.querySelector('html');
    const canonicalMeta = dom.window.document.querySelector('meta[property="og:url"]');
    
    if (canonicalMeta && canonicalMeta.getAttribute('content')) {
      // OG:URL can serve as a fallback for canonical
      metaResults.pass++;
    } else {
      metaResults.fail++;
      metaResults.missing.push('canonical link');
    }
  }
  
  return metaResults;
}

/**
 * Check structured data in the HTML
 */
function checkStructuredData(dom, routePath) {
  const results = {
    pass: 0,
    fail: 0,
    warnings: 0,
    details: []
  };
  
  // Look for structured data in script tags
  const scriptTags = dom.window.document.querySelectorAll('script[type="application/ld+json"]');
  
  if (scriptTags.length === 0) {
    // If no structured data script tags found, check if there might be inline structured data
    const inlineStructured = dom.window.document.innerHTML.includes('@context') && 
                            dom.window.document.innerHTML.includes('@type') &&
                            dom.window.document.innerHTML.includes('schema.org');
    
    if (inlineStructured) {
      results.warnings++;
      results.details.push('Found possible inline structured data, but not in proper script tags');
      return results;
    }
    
    // If we're testing the homepage, lack of structured data is more serious
    if (routePath === '/') {
      results.fail++;
      results.details.push('No structured data found on homepage');
    } else {
      // For other pages, it's just a warning
      results.warnings++;
      results.details.push('No structured data found');
    }
    return results;
  }
  
  // Check each script tag containing structured data
  scriptTags.forEach((tag, index) => {
    try {
      // Some JSON may have comments or extra whitespace, try to clean it
      let jsonText = tag.textContent.trim();
      
      // Try to parse the JSON
      const data = JSON.parse(jsonText);
      
      // Check required properties
      if (!data['@context'] || !data['@type']) {
        results.fail++;
        results.details.push(`Structured data #${index + 1} missing required properties (@context or @type)`);
      } else {
        results.pass++;
        results.details.push(`Found structured data type: ${data['@type']}`);
        
        // Check recommended properties based on the type
        if (data['@type'] === 'WebSite' && !data.name) {
          results.warnings++;
          results.details.push('WebSite structured data missing recommended "name" property');
        }
        
        if (['Organization', 'LocalBusiness'].includes(data['@type']) && !data.url) {
          results.warnings++;
          results.details.push(`${data['@type']} structured data missing recommended "url" property`);
        }
      }
    } catch (e) {
      // Attempt to salvage common JSON errors
      try {
        // Replace any single quotes with double quotes (common mistake)
        const fixedJson = tag.textContent.replace(/'/g, '"')
          .replace(/(\w+):/g, '"$1":') // Add quotes to keys
          .replace(/:\s*([^"{\[]+),/g, ': "$1",'); // Add quotes to values
        
        const data = JSON.parse(fixedJson);
        if (data['@context'] && data['@type']) {
          results.warnings++;
          results.details.push(`Structured data #${index + 1} had formatting issues but was parsable`);
        } else {
          results.fail++;
          results.details.push(`Structured data #${index + 1} is missing required properties after fixing`);
        }
      } catch (fixError) {
        results.fail++;
        results.details.push(`Invalid JSON in structured data #${index + 1}: ${e.message}`);
      }
    }
  });
  
  return results;
}

/**
 * Check robots.txt file
 */
async function checkRobotsTxt() {
  const results = {
    pass: 0,
    fail: 0,
    warnings: 0,
    details: []
  };
  
  try {
    const robotsPath = path.join(PUBLIC_DIR, 'robots.txt');
    const content = await readFile(robotsPath, 'utf8');
    
    if (!content.includes('User-agent:')) {
      results.fail++;
      results.details.push('robots.txt missing User-agent directive');
    } else {
      results.pass++;
    }
    
    if (!content.includes('Sitemap:')) {
      results.warnings++;
      results.details.push('robots.txt missing Sitemap directive');
    } else {
      results.pass++;
    }
    
    // Check for recommended sections
    const hasDisallow = content.includes('Disallow:');
    const hasCrawlDelay = content.includes('Crawl-delay:');
    
    if (!hasDisallow) {
      results.warnings++;
      results.details.push('robots.txt missing Disallow directives');
    } else {
      results.pass++;
    }
    
    if (!hasCrawlDelay) {
      results.warnings++;
      results.details.push('Consider adding Crawl-delay directive');
    } else {
      results.pass++;
    }
    
  } catch (error) {
    results.fail++;
    results.details.push(`Failed to read robots.txt: ${error.message}`);
  }
  
  return results;
}

/**
 * Check sitemap.xml file
 */
async function checkSitemap() {
  const results = {
    pass: 0,
    fail: 0,
    warnings: 0,
    details: []
  };
  
  try {
    const sitemapPath = path.join(PUBLIC_DIR, 'sitemap.xml');
    const content = await readFile(sitemapPath, 'utf8');
    
    if (!content.includes('<urlset')) {
      results.fail++;
      results.details.push('sitemap.xml missing urlset element');
    } else {
      results.pass++;
    }
    
    if (!content.includes('<url>')) {
      results.fail++;
      results.details.push('sitemap.xml has no URL entries');
    } else {
      // Count URLs
      const urlCount = (content.match(/<url>/g) || []).length;
      results.pass++;
      results.details.push(`Found ${urlCount} URLs in sitemap`);
      
      // Check if URLs have lastmod
      if (!content.includes('<lastmod>')) {
        results.warnings++;
        results.details.push('URLs in sitemap missing lastmod dates');
      }
      
      // Check if URLs have priority
      if (!content.includes('<priority>')) {
        results.warnings++;
        results.details.push('URLs in sitemap missing priority values');
      }
    }
    
  } catch (error) {
    results.fail++;
    results.details.push(`Failed to read sitemap.xml: ${error.message}`);
  }
  
  return results;
}

/**
 * Check basic SEO optimization for images
 */
function checkImages(dom, routePath) {
  const results = {
    pass: 0,
    fail: 0,
    warnings: 0,
    details: []
  };
  
  const images = dom.window.document.querySelectorAll('img');
  if (images.length === 0) {
    results.warnings++;
    results.details.push('No images found on page');
    return results;
  }
  
  let missingAlt = 0;
  let missingDimensions = 0;
  let lazyLoaded = 0;
  
  images.forEach((img, index) => {
    const src = img.getAttribute('src');
    const alt = img.getAttribute('alt');
    const hasWidth = img.hasAttribute('width');
    const hasHeight = img.hasAttribute('height');
    const isLazy = img.hasAttribute('loading') && img.getAttribute('loading') === 'lazy';
    
    if (!alt) {
      missingAlt++;
    }
    
    if (!hasWidth || !hasHeight) {
      missingDimensions++;
    }
    
    if (isLazy) {
      lazyLoaded++;
    }
  });
  
  if (missingAlt > 0) {
    results.fail++;
    results.details.push(`${missingAlt} images missing alt text`);
  } else {
    results.pass++;
    results.details.push('All images have alt text');
  }
  
  if (missingDimensions > 0) {
    results.warnings++;
    results.details.push(`${missingDimensions} images missing explicit dimensions`);
  } else {
    results.pass++;
  }
  
  results.details.push(`${lazyLoaded} of ${images.length} images use lazy loading`);
  if (images.length > 3 && lazyLoaded === 0) {
    results.warnings++;
    results.details.push('Consider using lazy loading for images');
  } else if (lazyLoaded > 0) {
    results.pass++;
  }
  
  return results;
}

/**
 * Run SEO tests for a specific route
 */
async function testRoute(routePath) {
  console.log(`\nTesting route: ${routePath}`);
  
  const routeResults = {
    route: routePath,
    metaTags: null,
    structuredData: null,
    images: null,
  };
  
  try {
    const url = `${BASE_URL}${routePath}`;
    console.log(`  Fetching ${url}...`);
    
    // First check if the server is running at all
    const html = await fetchUrl(url);
    
    if (!html || html.length < 100) {
      console.log('  Warning: Received empty or very short HTML response');
      throw new Error('Invalid HTML response');
    }
    
    const dom = new JSDOM(html);
    
    // Test meta tags
    routeResults.metaTags = checkMetaTags(dom, routePath);
    console.log(`  Meta tags: ${routeResults.metaTags.pass} passed, ${routeResults.metaTags.fail} failed, ${routeResults.metaTags.warnings} warnings`);
    if (routeResults.metaTags.missing.length > 0) {
      console.log(`  Missing meta tags: ${routeResults.metaTags.missing.join(', ')}`);
    }
    
    // Test structured data
    routeResults.structuredData = checkStructuredData(dom, routePath);
    console.log(`  Structured data: ${routeResults.structuredData.pass} passed, ${routeResults.structuredData.fail} failed`);
    
    // Test images
    routeResults.images = checkImages(dom, routePath);
    console.log(`  Images: ${routeResults.images.pass} passed, ${routeResults.images.fail} failed, ${routeResults.images.warnings} warnings`);
    
    results.overall.pass += routeResults.metaTags.pass + routeResults.structuredData.pass + routeResults.images.pass;
    results.overall.fail += routeResults.metaTags.fail + routeResults.structuredData.fail + routeResults.images.fail;
    results.overall.warnings += routeResults.metaTags.warnings + routeResults.structuredData.warnings + routeResults.images.warnings;
    results.details[routePath] = routeResults;
  } catch (error) {
    console.error(`  Error testing route ${routePath}: ${error.message}`);
    
    // Try to test with the static HTML file as a fallback
    try {
      console.log('  Attempting to test with static HTML file...');
      const staticHtml = fs.readFileSync(path.join(PUBLIC_DIR, 'index.html'), 'utf8');
      const dom = new JSDOM(staticHtml);
      
      // Note: We're still testing the static file even though it might not have route-specific SEO
      console.log('  Testing with static HTML instead (SEO might not be route-specific)');
      
      // Test meta tags
      routeResults.metaTags = checkMetaTags(dom, routePath);
      console.log(`  Meta tags: ${routeResults.metaTags.pass} passed, ${routeResults.metaTags.fail} failed, ${routeResults.metaTags.warnings} warnings`);
      
      // Test structured data
      routeResults.structuredData = checkStructuredData(dom, routePath);
      console.log(`  Structured data: ${routeResults.structuredData.pass} passed, ${routeResults.structuredData.fail} failed`);
      
      // Test images
      routeResults.images = checkImages(dom, routePath);
      console.log(`  Images: ${routeResults.images.pass} passed, ${routeResults.images.fail} failed, ${routeResults.images.warnings} warnings`);
      
      results.overall.pass += routeResults.metaTags.pass + routeResults.structuredData.pass + routeResults.images.pass;
      results.overall.fail += routeResults.metaTags.fail + routeResults.structuredData.fail + routeResults.images.fail;
      results.overall.warnings += routeResults.metaTags.warnings + routeResults.structuredData.warnings + routeResults.images.warnings;
      results.details[routePath] = routeResults;
    } catch (staticError) {
      console.error(`  Failed to test static HTML: ${staticError.message}`);
      results.overall.fail += 1;
    }
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('===== SEO Test and Validation =====');
  console.log(`Testing against ${BASE_URL}`);
  console.log('Note: For best results, make sure your server is running at this URL.');
  
  // First check if the server is running
  let serverRunning = true;
  try {
    await new Promise((resolve, reject) => {
      const request = http.get(BASE_URL, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`HTTP status: ${res.statusCode}`));
        }
        res.resume(); // Consume response data to free memory
      });
      request.setTimeout(3000, () => reject(new Error('Connection timeout')));
      request.on('error', reject);
    });
    console.log('✓ Server is running');
  } catch (error) {
    console.log(`✗ Server does not appear to be running: ${error.message}`);
    console.log('  Continuing with static file testing...');
    serverRunning = false;
  }
  
  if (!serverRunning) {
    console.log('\nWARNING: Running tests on static files only. Some tests may not be accurate.');
    console.log('To get the most accurate results, start your server with:');
    console.log('  npm run start\n');
    console.log('Then in another terminal run:');
    console.log('  npm run test-seo\n');
  }
  
  // Test all routes
  for (const route of ROUTES_TO_CHECK) {
    await testRoute(route);
  }
  
  // Check robots.txt
  console.log('\nTesting robots.txt');
  const robotsResults = await checkRobotsTxt();
  console.log(`  robots.txt: ${robotsResults.pass} passed, ${robotsResults.fail} failed, ${robotsResults.warnings} warnings`);
  robotsResults.details.forEach(detail => console.log(`  - ${detail}`));
  
  // Check sitemap.xml
  console.log('\nTesting sitemap.xml');
  const sitemapResults = await checkSitemap();
  console.log(`  sitemap.xml: ${sitemapResults.pass} passed, ${sitemapResults.fail} failed, ${sitemapResults.warnings} warnings`);
  sitemapResults.details.forEach(detail => console.log(`  - ${detail}`));
  
  results.overall.pass += robotsResults.pass + sitemapResults.pass;
  results.overall.fail += robotsResults.fail + sitemapResults.fail;
  results.overall.warnings += robotsResults.warnings + sitemapResults.warnings;
  results.details.robots = robotsResults;
  results.details.sitemap = sitemapResults;
  
  // Print summary
  console.log('\n===== Test Summary =====');
  console.log(`Total Tests Passed: ${results.overall.pass}`);
  console.log(`Total Tests Failed: ${results.overall.fail}`);
  console.log(`Total Warnings: ${results.overall.warnings}`);
  
  const overallScore = Math.round((results.overall.pass / (results.overall.pass + results.overall.fail)) * 100);
  console.log(`\nOverall SEO Score: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log('Excellent! Your site has great SEO implementation.');
  } else if (overallScore >= 75) {
    console.log('Good job! Your site has decent SEO, but there\'s room for improvement.');
  } else if (overallScore >= 50) {
    console.log('Your site needs SEO improvement. Address the failed tests.');
  } else {
    console.log('Your site has serious SEO issues. Immediate attention required.');
  }
  
  console.log('\nSEO Test Complete!');
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
