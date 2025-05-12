/**
 * Google Search Console and Analytics Integration Helper
 * 
 * This script helps configure and integrate Google search and analytics tools
 * - Google Search Console for indexing and site monitoring
 * - Google Analytics for traffic tracking
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Configuration
const HTML_FILE = path.join(__dirname, '../public/index.html');
const VERIFICATION_FILE_DIR = path.join(__dirname, '../public');
// Update these with your actual IDs when you have them
const GOOGLE_ANALYTICS_ID = 'G-XXXXXXXXXX'; // Replace with your Google Analytics ID
const GOOGLE_TAG_MANAGER_ID = 'GTM-XXXXXXX'; // Replace with your Google Tag Manager ID

/**
 * Insert Google Analytics tracking code into index.html
 */
async function insertGoogleAnalytics() {
  try {
    let content = await readFile(HTML_FILE, 'utf8');
    
    // Check if analytics is already integrated
    if (content.includes('Google Analytics') || content.includes('gtag')) {
      console.log('Google Analytics code already exists in the HTML file');
      return;
    }
    
    // Google Analytics tracking code
    const analyticsCode = `
    <!-- Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GOOGLE_ANALYTICS_ID}', {
        'send_page_view': false, // We'll send page views manually for SPA
        'cookie_flags': 'SameSite=None;Secure'
      });
      
      // Custom event to track page views in SPA
      document.addEventListener('router:navigated', function(e) {
        const path = e.detail.path || window.location.pathname;
        gtag('config', '${GOOGLE_ANALYTICS_ID}', {
          'page_title': document.title,
          'page_path': path
        });
      });
    </script>
    `;
    
    // Insert analytics code before closing head tag
    content = content.replace('</head>', `${analyticsCode}\n</head>`);
    
    // Save the updated file
    await writeFile(HTML_FILE, content, 'utf8');
    console.log('Google Analytics tracking code added successfully!');
  } catch (error) {
    console.error('Failed to insert Google Analytics code:', error);
  }
}

/**
 * Insert Google Tag Manager code into index.html
 */
async function insertGoogleTagManager() {
  try {
    let content = await readFile(HTML_FILE, 'utf8');
    
    // Check if Tag Manager is already integrated
    if (content.includes('Google Tag Manager') || content.includes('gtm.js')) {
      console.log('Google Tag Manager code already exists in the HTML file');
      return;
    }
    
    // Google Tag Manager head code
    const gtmHeadCode = `
    <!-- Google Tag Manager -->
    <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER_ID}');</script>
    <!-- End Google Tag Manager -->
    `;
    
    // Google Tag Manager body code
    const gtmBodyCode = `
    <!-- Google Tag Manager (noscript) -->
    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER_ID}"
    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
    <!-- End Google Tag Manager (noscript) -->
    `;
    
    // Insert tag manager code in head and body
    content = content.replace('</head>', `${gtmHeadCode}\n</head>`);
    content = content.replace('<body>', `<body>\n${gtmBodyCode}`);
    
    // Save the updated file
    await writeFile(HTML_FILE, content, 'utf8');
    console.log('Google Tag Manager code added successfully!');
  } catch (error) {
    console.error('Failed to insert Google Tag Manager code:', error);
  }
}

/**
 * Create a Search Console verification file
 * Note: The verification token should be obtained from Google Search Console
 */
async function createSearchConsoleVerification(token) {
  if (!token) {
    console.error('Error: Verification token is required');
    return;
  }
  
  try {
    const filename = `google${token}.html`;
    const filePath = path.join(VERIFICATION_FILE_DIR, filename);
    const content = `google-site-verification: google${token}.html`;
    
    await writeFile(filePath, content, 'utf8');
    console.log(`Search Console verification file created at ${filePath}`);
  } catch (error) {
    console.error('Failed to create verification file:', error);
  }
}

/**
 * Main function to run the script interactively
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n===== Google Search Console & Analytics Integration =====');
  console.log('This script helps integrate Google tools with your website.');
  console.log('Follow these steps:');
  console.log('1. Go to https://analytics.google.com to create an Analytics account');
  console.log('2. Go to https://search.google.com/search-console to add your site');
  console.log('3. Obtain verification token and tracking IDs\n');
  
  rl.question('Do you want to add Google Analytics? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      const gaId = await new Promise(resolve => {
        rl.question('Enter your Google Analytics ID (G-XXXXXXXXXX): ', id => resolve(id || GOOGLE_ANALYTICS_ID));
      });
      
      if (gaId === 'G-XXXXXXXXXX') {
        console.log('Using placeholder Google Analytics ID. Remember to update it later.');
      }
      
      GOOGLE_ANALYTICS_ID = gaId;
      await insertGoogleAnalytics();
    }
    
    rl.question('Do you want to add Google Tag Manager? (y/n): ', async (answer) => {
      if (answer.toLowerCase() === 'y') {
        const gtmId = await new Promise(resolve => {
          rl.question('Enter your Google Tag Manager ID (GTM-XXXXXXX): ', id => resolve(id || GOOGLE_TAG_MANAGER_ID));
        });
        
        if (gtmId === 'GTM-XXXXXXX') {
          console.log('Using placeholder Google Tag Manager ID. Remember to update it later.');
        }
        
        GOOGLE_TAG_MANAGER_ID = gtmId;
        await insertGoogleTagManager();
      }
      
      rl.question('Do you need to create a Search Console verification file? (y/n): ', async (answer) => {
        if (answer.toLowerCase() === 'y') {
          const token = await new Promise(resolve => {
            rl.question('Enter your Search Console verification token: ', token => resolve(token));
          });
          
          await createSearchConsoleVerification(token);
        }
        
        console.log('\nSetup complete! Follow these next steps:');
        console.log('1. Deploy your website with these changes');
        console.log('2. Complete verification in Google Search Console');
        console.log('3. Submit your sitemap.xml in Search Console');
        console.log('4. Check Analytics to confirm data collection\n');
        
        rl.close();
      });
    });
  });
}

// Export functions for direct use in other scripts
module.exports = {
  insertGoogleAnalytics,
  insertGoogleTagManager,
  createSearchConsoleVerification
};

// Run the script directly if invoked from command line
if (require.main === module) {
  main();
}
