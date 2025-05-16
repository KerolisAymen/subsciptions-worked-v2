// ملف التطبيق الرئيسي الذي يربط كل شيء معًا

// Remove the import as we're using script tags, not ES modules
// import router from './router/index.js';

// دوال المساعدة لواجهة المستخدم
function showLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.remove('d-none');
    console.log('Loading overlay shown');
  } else {
    console.error('Loading overlay element not found');
  }
}

function hideLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('d-none');
    console.log('Loading overlay hidden');
  } else {
    console.error('Loading overlay element not found');
  }
}

function showToast(title, message, type = 'info', duration = 5000, noAutoHide = false) {
  const toastEl = document.getElementById('toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');
  
  // تعيين محتوى التنبيه
  toastTitle.textContent = title;
  toastMessage.textContent = message;
  
  // تحديد لون التنبيه بناءً على النوع
  toastEl.className = 'toast';
  switch (type) {
    case 'success':
      toastEl.classList.add('bg-success', 'text-white');
      break;
    case 'error':
      toastEl.classList.add('bg-danger', 'text-white');
      break;
    case 'warning':
      toastEl.classList.add('bg-warning');
      break;
    default:
      toastEl.classList.add('bg-info', 'text-white');
  }
  
  // Configure autohide behavior
  if (noAutoHide) {
    toastEl.setAttribute('data-bs-autohide', 'false');
  } else {
    toastEl.setAttribute('data-bs-autohide', 'true');
    toastEl.setAttribute('data-bs-delay', duration);
  }
  
  // عرض التنبيه
  const toast = new bootstrap.Toast(toastEl);
  toast.show();
  
  // Return the toast element for further customization
  return toastEl;
}

// دالة تنسيق العملة بدون رمز العملة
function formatCurrency(amount) {
  // تنسيق الرقم بدون علامة العملة، مع إظهار منزلتين عشريتين دائمًا
  return Number(amount).toFixed(2);
}

// دالة تنسيق التاريخ
function formatDate(dateString) {
  return i18n.formatDate(dateString);
}

// SEO Utility Functions
const SEO = {
  updateMetaTags: function(title, description, path) {    // Update document title
    document.title = title + ' | مُحصل';
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', 'https://yourwebsite.com' + path);
    }
    
    // Update Open Graph tags
    this.updateOpenGraphTags(title, description, path);
  },
  
  updateOpenGraphTags: function(title, description, path) {
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    const twitterUrl = document.querySelector('meta[property="twitter:url"]');
    
    const fullUrl = 'https://yourwebsite.com' + path;
      if (ogTitle) ogTitle.setAttribute('content', title + ' | مُحصل');
    if (ogDesc) ogDesc.setAttribute('content', description);
    if (ogUrl) ogUrl.setAttribute('content', fullUrl);
    
    if (twitterTitle) twitterTitle.setAttribute('content', title + ' | مُحصل');
    if (twitterDesc) twitterDesc.setAttribute('content', description);
    if (twitterUrl) twitterUrl.setAttribute('content', fullUrl);
  },
  
  updateStructuredData: function(data) {
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
};

// التحقق من النماذج
function validateForm(form) {
  let isValid = true;
  
  // إعادة تعيين التحقق السابق
  form.querySelectorAll('.is-invalid').forEach(el => {
    el.classList.remove('is-invalid');
  });
  
  // التحقق من كل حقل مطلوب
  form.querySelectorAll('[required]').forEach(field => {
    if (!field.value.trim()) {
      field.classList.add('is-invalid');
      isValid = false;
    }
    
    // التحقق من البريد الإلكتروني
    if (field.type === 'email' && field.value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        field.classList.add('is-invalid');
        isValid = false;
      }
    }
    
    // الحد الأدنى لطول كلمة المرور
    if (field.type === 'password' && field.minLength && field.value.length < field.minLength) {
      field.classList.add('is-invalid');
      isValid = false;
    }
  });
  
  // تطابق كلمة المرور مع التأكيد
  const password = form.querySelector('#password');
  const confirmPassword = form.querySelector('#confirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.classList.add('is-invalid');
    isValid = false;
  }
  
  return isValid;
}

// التحقق من نموذج المشروع
function validateProjectForm() {
  const projectName = document.getElementById('projectName');
  let isValid = true;
  
  // إعادة تعيين حالات التحقق
  projectName.classList.remove('is-invalid');
  
  // التحقق من اسم المشروع
  if (!projectName.value.trim()) {
    projectName.classList.add('is-invalid');
    isValid = false;
  }
  
  return isValid;
}

// تهيئة التطبيق عند اكتمال تحميل DOM
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM loaded, initializing application...');
  
  // Create a new Router instance if not already created
  if (!window.router) {
    window.router = new Router();
    console.log('Router instance created');
  }
  
  // Initialize Bootstrap components
  try {
    console.log('Initializing Bootstrap components...');
    document.querySelectorAll('.modal').forEach(modalEl => {
      try {
        new bootstrap.Modal(modalEl);
        console.log('Modal initialized:', modalEl.id);
      } catch (e) {
        console.error('Error initializing modal:', modalEl.id, e);
      }
    });
  } catch (e) {
    console.error('Error initializing Bootstrap components:', e);
  }
  
  // التحقق من حالة المصادقة
  await auth.checkAuthStatus();
  
  // Initialize routing (this triggers the initial route)
  window.router.initRouting();
  console.log('Router initialized');
  
  // Bootstrap initialization for tooltips and popovers
  try {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl)
    });
    console.log('Tooltips initialized:', tooltipList.length);
  } catch (e) {
    console.error('Error initializing tooltips:', e);
  }
  
  // إعداد زر تسجيل الخروج
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        await auth.logout();
        window.router.navigate('/');
        showToast('Success', 'You have been logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
  
  // Simple utility function to show modals
  window.showModal = function(modalId) {
    console.log(`Attempting to show modal: ${modalId}`);
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
      try {
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        console.log(`Modal ${modalId} shown successfully`);
        return true;
      } catch (e) {
        console.error(`Error showing modal ${modalId}:`, e);
        return false;
      }
    }
    console.error('Modal element not found:', modalId);
    return false;
  };
  
  // تعريف تابع لتحديث بيانات التقارير
  window.updateReportSummary = function(summaryData) {
    if (!summaryData) return;
    
    // تحديث بطاقات الملخص
    document.getElementById('report-total-expected').textContent = formatCurrency(summaryData.totalExpected);
    document.getElementById('report-total-collected').textContent = formatCurrency(summaryData.totalCollected);
    document.getElementById('report-total-remaining').textContent = formatCurrency(summaryData.totalRemainingAmount);
    document.getElementById('report-completion').textContent = `${summaryData.percentComplete.toFixed(0)}%`;
    
    // يمكن إضافة المزيد من تحديثات بيانات التقارير هنا
  };
  
  // Utility to show loading spinner on a button
  window.setButtonLoading = function(btn, loadingText) {
    if (!btn) return;
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> ${loadingText || ''}`;
  };
  
  window.resetButtonLoading = function(btn) {
    if (!btn) return;
    btn.disabled = false;
    if (btn.dataset.originalText) {
      btn.innerHTML = btn.dataset.originalText;
      delete btn.dataset.originalText;
    }
  };
});
