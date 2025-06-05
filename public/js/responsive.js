// تحسينات تفاعلية للأجهزة المحمولة

document.addEventListener('DOMContentLoaded', function() {
  // Debug check for app container
  const appContainer = document.getElementById('app');
  if (appContainer) {
    console.log('تم العثور على حاوية التطبيق وهي جاهزة');
  } else {
    console.error('لم يتم العثور على حاوية التطبيق!');
  }
  
  // Debug check for templates
  const templates = document.querySelectorAll('template');
  if (templates.length > 0) {
    console.log(`تم العثور على ${templates.length} قوالب`);
  } else {
    console.error('لم يتم العثور على أي قوالب!');
  }
  
  // تحسين التنقل في الأجهزة المحمولة
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarNav = document.getElementById('navbarNav');
    if (navbarToggler && navbarNav) {
    // إغلاق القائمة عند النقر على أي رابط في الأجهزة المحمولة (باستثناء القائمة المنسدلة للمستخدم)
    navbarNav.querySelectorAll('.nav-link:not(.dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992 && navbarNav.classList.contains('show')) {
          navbarToggler.click();
        }
      });
    });
    
    // حدث خاص للقائمة المنسدلة للمستخدم
    const userDropdownToggle = document.getElementById('userDropdown');
    if (userDropdownToggle) {
      userDropdownToggle.addEventListener('click', (e) => {
        // منع الفقاعة (bubbling) لتجنب إغلاق القائمة المنسدلة
        e.stopPropagation();
      });
    }
  }
  
  // ضبط حجم الجداول للشاشات الصغيرة
  function adjustTables() {
    const tables = document.querySelectorAll('.table');
    if (window.innerWidth < 768) {
      tables.forEach(table => {
        if (!table.classList.contains('table-sm')) {
          table.classList.add('table-sm');
        }
      });
    } else {
      tables.forEach(table => {
        table.classList.remove('table-sm');
      });
    }
  }
  
  // تنفيذ عند التحميل وتغيير حجم النافذة
  adjustTables();
  window.addEventListener('resize', adjustTables);
  
  // تحسين تمرير الصفحة للشاشات الصغيرة
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        window.scrollTo({
          top: target.offsetTop - 70, // تعويض ارتفاع شريط التنقل
          behavior: 'smooth'
        });
      }
    });
  });
  

  
  // زر العودة للأعلى
  const backToTopBtn = document.createElement('button');
  backToTopBtn.id = 'back-to-top';
  backToTopBtn.className = 'btn btn-primary btn-sm position-fixed rounded-circle د-none';
  backToTopBtn.innerHTML = '<i class="bi bi-arrow-up"></i>';
  backToTopBtn.style.bottom = '20px';
  backToTopBtn.style.right = '20px';
  backToTopBtn.style.zIndex = '1000';
  backToTopBtn.style.width = '40px';
  backToTopBtn.style.height = '40px';
  document.body.appendChild(backToTopBtn);
  
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove('d-none');
    } else {
      backToTopBtn.classList.add('d-none');
    }
  });

  // تحسين مظهر التقارير للشاشات المختلفة
  function optimizeReportsForScreens() {
    const reportCharts = document.querySelectorAll('#reports canvas, #trip-report canvas');
    
    if (window.innerWidth < 768) {
      reportCharts.forEach(chart => {
        // تقليل ارتفاع الرسوم البيانية على الشاشات الصغيرة
        chart.parentElement.style.height = '250px';
      });
    } else {
      reportCharts.forEach(chart => {
        // زيادة ارتفاع الرسوم البيانية على الشاشات الكبيرة
        chart.parentElement.style.height = '300px';
      });
    }
  }
  
  // Initialize ViewToggle for responsive tables
  function initResponsiveTables() {
    // Setup localization for ViewToggle
    if (typeof ViewToggle !== 'undefined') {
      // Set up translations if i18n is available
      if (typeof i18n !== 'undefined') {
        ViewToggle.options.tableViewText = i18n.t('common.tableView') || 'جدول';
        ViewToggle.options.cardViewText = i18n.t('common.cardView') || 'بطاقات';
      } else {
        ViewToggle.options.tableViewText = 'جدول';
        ViewToggle.options.cardViewText = 'بطاقات';
      }
      
      // Add toggle-view-table class to all tables that need responsive toggle
      const tableContainers = document.querySelectorAll('.table-responsive');
      tableContainers.forEach(container => {
        const table = container.querySelector('table');
        if (!table) return;
        
        // Check if table potentially needs card view (has enough columns)
        const hasEnoughColumns = table.querySelectorAll('thead th').length >= 3;
        
        if (hasEnoughColumns && !table.classList.contains('toggle-view-table')) {
          table.classList.add('toggle-view-table');
        }
      });
      
      // Initialize ViewToggle
      ViewToggle.init();
    }
  }
  
  // تنفيذ تحسين التقارير والجداول عند التحميل وتغيير حجم النافذة
  optimizeReportsForScreens();
  
  // Initialize tables, but give them a small delay to ensure DOM is ready
  setTimeout(() => {
    initResponsiveTables();
  }, 100);
  
  // Function to refresh view toggle on content update
  function refreshViewToggle() {
    if (typeof ViewToggle === 'undefined') return;
    
    document.querySelectorAll('.toggle-view-table').forEach(table => {
      if (table.id) {
        // If data has been updated, refresh the view
        ViewToggle.refreshTable(table.id);
      }
    });
  }
  
  // Function to handle tables in newly shown tabs
  function reinitTablesInTab(tabElement) {
    if (typeof ViewToggle === 'undefined') return;

    // Find all tables in the newly activated tab
    const tableContainers = tabElement.querySelectorAll('.table-responsive');
    if (tableContainers.length === 0) return;
    
    // Process each table to ensure it has proper dimensions and view mode
    tableContainers.forEach(container => {
      const table = container.querySelector('.toggle-view-table');
      if (!table || !table.id) return;
      
      // Force recalculation of table dimensions and view mode
      setTimeout(() => {
        ViewToggle.refreshTable(table.id);
      }, 50);
    });
  }
  
  // Add event listener for tab changes to handle responsive tables in newly shown tabs
  document.addEventListener('shown.bs.tab', function(event) {
    // Get the newly activated tab content element
    const activeTabPane = document.querySelector(event.target.getAttribute('data-bs-target'));
    if (activeTabPane) {
      reinitTablesInTab(activeTabPane);
    }
  });
  
  // For tables with dynamic content (added via AJAX or DOM manipulation)
  // we need to observe DOM changes and re-initialize if needed
  const observer = new MutationObserver((mutations) => {
    let tablesChanged = false;
    let newTablesAdded = false;
    
    mutations.forEach((mutation) => {
      // Check if content was added
      if (mutation.addedNodes.length) {
        mutation.addedNodes.forEach(node => {
          // Check if a table-responsive container or its children were added
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList?.contains('table-responsive') || 
                node.querySelector?.('.table-responsive')) {
              newTablesAdded = true;
            }
            
            // Check for table rows added to existing tables
            if ((node.tagName === 'TR' && node.parentElement?.tagName === 'TBODY') ||
                node.querySelector?.('tbody tr')) {
              tablesChanged = true;
            }
          }
        });
      }
      
      // Check if content was modified (e.g., table cells updated)
      if (mutation.type === 'characterData' || mutation.type === 'attributes') {
        // Check if the modified element is inside a table
        let targetNode = mutation.target;
        while (targetNode && targetNode !== document) {
          if (targetNode.tagName === 'TABLE') {
            tablesChanged = true;
            break;
          }
          targetNode = targetNode.parentNode;
        }
      }
    });
    
    // Handle table changes
    if (newTablesAdded) {
      // New tables added - re-initialize the toggle system
      setTimeout(initResponsiveTables, 300);
    } else if (tablesChanged) {
      // Existing tables changed - just refresh the view
      setTimeout(refreshViewToggle, 300);
    }
  });
  
  // Start observing the app container for content changes
  if (appContainer) {
    observer.observe(appContainer, { 
      childList: true, 
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-*'] 
    });
  }
  
  // Add resize listener
  window.addEventListener('resize', function() {
    optimizeReportsForScreens();
  });
});
