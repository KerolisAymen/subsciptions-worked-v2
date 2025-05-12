/**
 * SEO Integration - advanced SEO features and optimizations
 * This file should be loaded early in the page to ensure SEO optimizations happen as soon as possible
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Add page speed optimization listener
  monitorPageSpeed();
  
  // 2. Add lazy loading to images and iframes that aren't critical
  addLazyLoading();
  
  // 3. Add breadcrumbs listener
  setupBreadcrumbsListener();
  
  // 4. Set up link attributes properly
  optimizeLinks();
  
  // 5. Execute any initial SEO tasks based on the current URL
  initialSEOSetup();
});

/**
 * Measures and monitors page speed metrics
 */
function monitorPageSpeed() {
  if (window.performance && window.performance.timing) {
    // First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    if (paintEntries.length > 0) {
      paintEntries.forEach((entry) => {
        console.log(`SEO - ${entry.name}: ${Math.round(entry.startTime)} ms`);
      });
    }
    
    // Once the page is fully loaded, calculate load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const timingInfo = window.performance.timing;
        const pageLoadTime = timingInfo.loadEventEnd - timingInfo.navigationStart;
        console.log(`SEO - Page load time: ${pageLoadTime} ms`);
      }, 0);
    });
  }
}

/**
 * Adds lazy loading to non-critical images and iframes for better performance
 */
function addLazyLoading() {
  // Find all images that don't already have loading="lazy"
  document.querySelectorAll('img:not([loading="lazy"])').forEach(img => {
    // Skip small images or images visible in the initial viewport which are critical
    if (!img.classList.contains('critical-image')) {
      img.setAttribute('loading', 'lazy');
    }
  });
  
  // Same for iframes
  document.querySelectorAll('iframe:not([loading="lazy"])').forEach(iframe => {
    iframe.setAttribute('loading', 'lazy');
  });
}

/**
 * Sets up listener to update breadcrumbs based on page navigation
 */
function setupBreadcrumbsListener() {
  // Listen for custom event when navigation happens (must be fired by router)
  window.addEventListener('routeChanged', (event) => {
    if (event.detail && event.detail.path) {
      updateBreadcrumbs(event.detail.path, event.detail.title);
    }
  });
}

/**
 * Updates breadcrumbs based on current path
 * @param {string} path - Current URL path
 * @param {string} title - Current page title
 */
function updateBreadcrumbs(path, title) {
  // Find the breadcrumb container if it exists
  const breadcrumbContainer = document.getElementById('breadcrumbs');
  if (!breadcrumbContainer) return;
  
  // Don't show breadcrumbs on home page
  if (path === '/') {
    breadcrumbContainer.classList.add('breadcrumbs-hidden');
    return;
  } else {
    breadcrumbContainer.classList.remove('breadcrumbs-hidden');
  }
  
  // Create breadcrumb trail based on path
  const pathParts = path.split('/').filter(part => part !== '');
  
  // Clear any existing breadcrumbs
  breadcrumbContainer.innerHTML = '';
  
  // Always start with Home
  let breadcrumbsHtml = `
    <ol class="breadcrumb" itemscope itemtype="https://schema.org/BreadcrumbList">
      <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
        <a href="/" itemprop="item"><span itemprop="name">الرئيسية</span></a>
        <meta itemprop="position" content="1" />
      </li>
  `;
  
  // Add additional breadcrumb items based on path
  let currentPath = '';
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const isLast = index === pathParts.length - 1;
    
    // Convert URL part to readable name (should ideally come from a mapping)
    let readableName = title;
    if (!isLast) {
      // This is a simplistic mapping - in real implementation you'd want a more comprehensive solution
      switch(part) {
        case 'projects': readableName = 'المشاريع'; break;
        case 'project': readableName = 'المشروع'; break;
        case 'trip': readableName = 'الرحلة'; break;
        case 'about': readableName = 'عن النظام'; break;
        case 'contact': readableName = 'اتصل بنا'; break;
        case 'privacy': readableName = 'سياسة الخصوصية'; break;
        default: readableName = part; // Fallback to the URL part itself
      }
    }
    
    // For the last item, mark it as active
    if (isLast) {
      breadcrumbsHtml += `
        <li class="breadcrumb-item active" aria-current="page" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <span itemprop="name">${readableName}</span>
          <meta itemprop="position" content="${index + 2}" />
        </li>
      `;
    } else {
      breadcrumbsHtml += `
        <li class="breadcrumb-item" itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a href="${currentPath}" itemprop="item"><span itemprop="name">${readableName}</span></a>
          <meta itemprop="position" content="${index + 2}" />
        </li>
      `;
    }
  });
  
  breadcrumbsHtml += '</ol>';
  
  // Insert the breadcrumb HTML
  breadcrumbContainer.innerHTML = breadcrumbsHtml;
}

/**
 * Optimizes links for SEO (adds rel attributes, etc.)
 */
function optimizeLinks() {
  // For external links, add rel="noopener" for security and to prevent performance issues
  document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])').forEach(link => {
    if (!link.getAttribute('rel') || !link.getAttribute('rel').includes('noopener')) {
      const rel = link.getAttribute('rel') || '';
      link.setAttribute('rel', (rel + ' noopener').trim());
    }
  });
}

/**
 * Initial SEO setup based on current URL when page loads
 */
function initialSEOSetup() {
  // Get current path
  const path = window.location.pathname;
  
  // Update breadcrumbs immediately if possible
  if (document.getElementById('breadcrumbs')) {
    updateBreadcrumbs(path, document.title.split('|')[0].trim());
  }
}

// Make functions available globally if needed
window.SEOIntegration = {
  updateBreadcrumbs,
  optimizeLinks
};
