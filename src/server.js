const express = require('express');
const path = require('path');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const flash = require('connect-flash');
const cors = require('cors');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
require('dotenv').config();
require('reflect-metadata');

const AppDataSource = require('./config/database');
const initializeDatabase = require('./config/db-init');
const authRoutes = require('./routes/auth.routes');
const projectRoutes = require('./routes/project.routes');
const tripRoutes = require('./routes/trip.routes');
const participantRoutes = require('./routes/participant.routes');
const paymentRoutes = require('./routes/payment.routes');
const reportRoutes = require('./routes/report.routes');
const adminRoutes = require('./routes/admin.routes');
const { authMiddleware, protect } = require('./middlewares/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));
app.use(flash());

// Enhanced SEO Routes middleware - helps search engines crawl the site properly
// This provides advanced pre-rendered metadata for specific public routes
app.use(async (req, res, next) => {
  // Only apply to GET requests
  if (req.method !== 'GET') {
    return next();
  }
  
  // Apply to all SEO-important paths
  const seoRoutes = ['/', '/about', '/contact', '/privacy', '/pricing', '/features', '/faq', '/terms', '/blog'];
  const reqPath = req.path;
  
  // Detect search engine crawlers and social media bots
  const botPatterns = [
    'bot', 'crawl', 'spider', 'slurp', 'bingbot', 'googlebot', 
    'yandex', 'baidu', 'facebookexternalhit', 'twitterbot', 
    'linkedinbot', 'whatsapp', 'telegrambot', 'skype', 'pinterest'
  ];
  
  const isBot = req.headers['user-agent'] && 
    botPatterns.some(pattern => req.headers['user-agent'].toLowerCase().includes(pattern));
  
  // Apply server-side rendering for bots or when explicitly requested
  if ((seoRoutes.includes(reqPath) && isBot) || req.query.ssr === 'true') {
    try {
      // Read the index.html file
      const indexPath = path.join(__dirname, '../public/index.html');
      let content = await readFile(indexPath, 'utf8');
      
      // Prepare route-specific SEO data
      let title, description, keywords, canonicalUrl, ogType, ogImage, structuredData;
      
      // Base URL for canonical links and social sharing
      const baseUrl = process.env.BASE_URL || 'https://yourdomain.com';
      
      switch(reqPath) {
        case '/':          title = 'مُحصل | منصة متكاملة لإدارة وتحصيل المدفوعات';
          description = 'مُحصل - منصة متكاملة لإدارة وتحصيل المدفوعات بكل سهولة وفعالية';
          keywords = 'تحصيل المدفوعات, إدارة المشاريع, إدارة التحصيل, تنظيم المدفوعات, إدارة المشاركين, إدارة النفقات, تحصيل الأموال';
          canonicalUrl = `${baseUrl}/`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-default.png`;          structuredData = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "مُحصل",
            "url": baseUrl,
            "potentialAction": {
              "@type": "SearchAction",
              "target": `${baseUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string"
            }
          };
          break;        case '/about':
          title = 'عن النظام | مُحصل';
          description = 'تعرف على منصة مُحصل وكيف يمكنها مساعدتك في إدارة وتحصيل المدفوعات بكل سهولة وفعالية';
          keywords = 'عن النظام, تحصيل المدفوعات, إدارة المشاريع, نبذة عن النظام, تنظيم المدفوعات';
          canonicalUrl = `${baseUrl}/about`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-about.png`;
          structuredData = {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            "name": "عن منصة مُحصل",
            "url": `${baseUrl}/about`,
            "mainEntity": {
              "@type": "Organization",
              "name": "مُحصل",
              "description": description
            }
          };
          break;        case '/contact':
          title = 'اتصل بنا | مُحصل';
          description = 'تواصل معنا لمزيد من المعلومات حول منصة مُحصل أو للحصول على الدعم الفني';
          keywords = 'اتصل بنا, دعم فني, تواصل, استفسارات';
          canonicalUrl = `${baseUrl}/contact`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-contact.png`;
          structuredData = {
            "@context": "https://schema.org",
            "@type": "ContactPage",
            "name": "اتصل بنا",
            "url": `${baseUrl}/contact`,
            "mainEntity": {
              "@type": "Organization",
              "name": "مُحصل",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "email": "support@example.com"
              }
            }
          };
          break;        case '/privacy':
          title = 'سياسة الخصوصية | مُحصل';
          description = 'اطلع على سياسة الخصوصية لمنصة مُحصل وكيفية حماية بياناتك الشخصية';
          keywords = 'سياسة الخصوصية, حماية البيانات, أمان المعلومات';
          canonicalUrl = `${baseUrl}/privacy`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-policy.png`;
          structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "سياسة الخصوصية",
            "url": `${baseUrl}/privacy`,
            "mainEntity": {
              "@type": "Article",
              "name": "سياسة الخصوصية",
              "articleBody": "سياسة الخصوصية لمنصة مُحصل..."
            }
          };
          break;        case '/pricing':
          title = 'خطط الأسعار | مُحصل';
          description = 'اطلع على خطط الأسعار المتاحة لمنصة مُحصل';
          keywords = 'خطط الأسعار, الاشتراكات, التكلفة, الدفع';
          canonicalUrl = `${baseUrl}/pricing`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-pricing.png`;
          structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "خطط الأسعار",
            "url": `${baseUrl}/pricing`
          };
          break;        default:
          // Default SEO data for other routes
          title = 'مُحصل';
          description = 'منصة متكاملة لإدارة وتحصيل المدفوعات بكل سهولة وفعالية';
          keywords = 'تحصيل المدفوعات, إدارة المشاريع, إدارة التحصيل, تنظيم المدفوعات';
          canonicalUrl = `${baseUrl}${reqPath}`;
          ogType = 'website';
          ogImage = `${baseUrl}/images/seo/og-default.png`;
          structuredData = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": title,
            "description": description,
            "url": canonicalUrl
          };
      }
      
      // Generate the structured data script tag
      const structuredDataScript = `<script type="application/ld+json">${JSON.stringify(structuredData)}</script>`;
      
      // Update the HTML content with appropriate meta data
      content = content
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${description}">`)
        .replace(/<meta name="keywords" content=".*?">/, `<meta name="keywords" content="${keywords}">`);
      
      // Add Google site verification meta tag if not present
      if (!content.includes('name="google-site-verification"')) {
        content = content.replace('</head>', `<meta name="google-site-verification" content="Na51kZpvyjO1XGG6CyF8EyQGKYujx2MBKtdoWGFZIJw" />\n</head>`);
      }
      
      // Add canonical URL if not present
      if (!content.includes('<link rel="canonical"')) {
        content = content.replace('</head>', `<link rel="canonical" href="${canonicalUrl}" />\n</head>`);
      } else {
        content = content.replace(/<link rel="canonical".*?>/, `<link rel="canonical" href="${canonicalUrl}" />`);
      }
      
      // Add Open Graph and Twitter Card meta tags if not present
      if (!content.includes('property="og:title"')) {
        const ogTags = `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${canonicalUrl}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:locale" content="ar_SA" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${ogImage}" />`;
        
        content = content.replace('</head>', `${ogTags}\n</head>`);
      }
      
      // Add structured data if not present
      if (!content.includes('application/ld+json')) {
        content = content.replace('</head>', `${structuredDataScript}\n</head>`);
      } else {
        content = content.replace(/<script type="application\/ld\+json">.*?<\/script>/s, structuredDataScript);
      }
      
      // Send the modified HTML with proper content type
      res.set('Content-Type', 'text/html');
      res.send(content);
    } catch (error) {
      console.error('Enhanced SEO middleware error:', error);
      next(); // Fall back to regular route handling
    }
  } else {
    next();
  }
});

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// Google Site Verification route (special handler for SEO verification)
app.get('/googleVerification/*', (req, res) => {
  const fileName ="google8bb20b8d1864f099.html"
  if (fileName && fileName.startsWith('google') && fileName.endsWith('.html')) {
    return res.sendFile(path.join(__dirname, '../public', fileName));
  } else {
    return res.status(404).send('File not found');
  }
});

// Explicit route for sitemap.xml to ensure it's properly served
app.get('/sitemap', (req, res) => {
  res.header('Content-Type', 'application/xml');
  return res.sendFile(path.join(__dirname, '../public/sitemap.xml'));
});

// Explicit route for robots.txt to ensure it's properly served
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  return res.sendFile(path.join(__dirname, '../public/robots.txt'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', protect, projectRoutes);
app.use('/api/trips', protect, tripRoutes);
app.use('/api/participants', protect, participantRoutes);
app.use('/api/payments', protect, paymentRoutes);
app.use('/api/reports', protect, reportRoutes);
app.use('/api/admin', protect, adminRoutes); // Admin routes

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('SEO enhancements active - optimized for search engines');
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database. Server not started:", error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
