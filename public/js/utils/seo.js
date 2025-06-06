// SEO.js - Helper functions for dynamic SEO optimization

/**
 * Updates meta tags for SEO based on current page
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} path - Current URL path
 * @param {string} [keywords] - Optional keywords specific to the page
 * @param {string} [imageUrl] - Optional image URL for social sharing
 */
function updateMetaTags(title, description, path, keywords, imageUrl) {  // Update document title - limited to 60 characters for SEO best practices
  const siteTitle = 'مُحصل';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  document.title = fullTitle.substring(0, 60);
  
  // Update meta description - limited to 160 characters for SEO best practices
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription && description) {
    metaDescription.setAttribute('content', description.substring(0, 160));
  }

  // Update meta keywords if provided
  if (keywords) {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords);
    }
  }
  
  // Update canonical URL - essential for SEO to avoid duplicate content issues
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    canonical.setAttribute('href', 'https://yourwebsite.com' + path);
  }
  
  // Update Open Graph and Twitter tags
  updateOpenGraphTags(title, description, path, imageUrl);

  // Generate structured data for the current page if needed
  generateStructuredData(title, description, path);
}

/**
 * Updates Open Graph and Twitter card meta tags
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} path - Current URL path
 * @param {string} [imageUrl] - Optional image URL
 */
function updateOpenGraphTags(title, description, path, imageUrl) {
  const siteTitle = 'مُحصل';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const fullUrl = 'https://yourwebsite.com' + path;
  const defaultImage = 'https://yourwebsite.com/images/muhassil-payment-system.jpg';
  const image = imageUrl || defaultImage;
  
  // Update Open Graph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  const ogImage = document.querySelector('meta[property="og:image"]');
  
  if (ogTitle) ogTitle.setAttribute('content', fullTitle);
  if (ogDesc && description) ogDesc.setAttribute('content', description.substring(0, 160));
  if (ogUrl) ogUrl.setAttribute('content', fullUrl);
  if (ogImage) ogImage.setAttribute('content', image);
  
  // Update Twitter tags
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  const twitterDesc = document.querySelector('meta[property="twitter:description"]');
  const twitterUrl = document.querySelector('meta[property="twitter:url"]');
  const twitterImage = document.querySelector('meta[property="twitter:image"]');
  if (twitterTitle) twitterTitle.setAttribute('content', fullTitle);
  if (twitterDesc && description) twitterDesc.setAttribute('content', description.substring(0, 160));
  if (twitterUrl) twitterUrl.setAttribute('content', fullUrl);
  if (twitterImage) twitterImage.setAttribute('content', image);
}

/**
 * Generates appropriate schema.org structured data based on the current page
 * @param {string} title - Page title
 * @param {string} description - Page description
 * @param {string} path - Current URL path
 */
function generateStructuredData(title, description, path) {
  let structuredData;
  const fullUrl = 'https://yourwebsite.com' + path;
  
  // Remove any existing JSON-LD scripts generated by this function
  const existingScripts = document.querySelectorAll('script[data-seo="dynamic"]');
  existingScripts.forEach(script => script.remove());
  
  // Generate different structured data based on page type/path
  switch (true) {
    case path === '/':
      // Homepage - WebSite schema
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': 'مُحصل',
        'url': 'https://yourwebsite.com/',
        'description': description || 'مُحصل - منصة متكاملة لإدارة وتحصيل المدفوعات وتسهيل تجميع الاشتراكات والمدفوعات الجماعية بكل سهولة وفعالية',
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://yourwebsite.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      };
      break;
    
    case path === '/about':
      // About page - Organization schema
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'مُحصل',
        'url': fullUrl,
        'logo': 'https://yourwebsite.com/images/logo.png',
        'description': description || 'معلومات عن مُحصل - منصة متكاملة لإدارة وتحصيل المدفوعات'
      };
      break;
      
    case path === '/contact':
      // Contact page - ContactPage schema
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': title || 'اتصل بنا',
        'description': description || 'صفحة الاتصال لمنصة مُحصل لإدارة وتحصيل المدفوعات',
        'url': fullUrl
      };
      break;
      
    case path.startsWith('/project/'):
      // Individual project - use SoftwareApplication with additional details
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': title || 'مشروع في منصة مُحصل',
        'applicationCategory': 'BusinessApplication',
        'operatingSystem': 'Web',
        'description': description || 'مشروع في منصة مُحصل لإدارة وتحصيل المدفوعات'
      };
      break;
      
    default:
      // Default schema for other pages
      structuredData = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': title || 'مُحصل',
        'description': description || 'مُحصل - منصة متكاملة لإدارة وتحصيل المدفوعات',
        'url': fullUrl
      };
  }
  
  // Create and insert the new structured data script
  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.setAttribute('data-seo', 'dynamic');
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
}

/**
 * Updates structured data for the current page
 * @param {Object} data - JSON-LD structured data
 */
function updateStructuredData(data) {
  // Remove existing JSON-LD scripts
  const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
  existingScripts.forEach(script => {
    if (script.parentNode) {
      script.parentNode.removeChild(script);
    }
  });
  
  // Add new JSON-LD script
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

// Export the functions so they can be used from other parts of the application
// In a script tag environment, we make them available on the window object
window.SEOUtils = {
  updateMetaTags,
  updateOpenGraphTags,
  generateStructuredData
};
