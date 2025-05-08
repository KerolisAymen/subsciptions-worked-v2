/**
 * ViewToggle - A utility for toggling between table and card views
 * 
 * This utility allows switching between table and card views for better responsive experience.
 * It automatically detects the device width and sets an appropriate initial view.
 */

// ViewToggle namespace to avoid global scope pollution
window.ViewToggle = (function() {
  // Default options
  const options = {
    tableViewText: 'Table View',
    cardViewText: 'Card View',
    tableViewIcon: 'bi-table',
    cardViewIcon: 'bi-grid-3x3-gap',
    mobileBreakpoint: 768, // Mobile breakpoint in pixels
    tableOverflowThreshold: 20, // Pixels threshold for table width overflow
    dataLoadCheckDelay: 500, // Delay in ms to ensure data is loaded
    maxCheckAttempts: 3 // Maximum number of times to check for data
  };

  // Storage for view preferences (for current session only)
  const viewPreferences = {};
  
  // Track tables that are being processed for data loading
  const processingTables = new Set();

  // Initialize ViewToggle
  function init() {
    // Find all toggle-view-table elements on the page
    const toggleTables = document.querySelectorAll('.toggle-view-table');
    
    // Process each table that needs toggle capability
    toggleTables.forEach((table, index) => {
      const tableId = table.id || `toggle-table-${index}`;
      table.id = tableId; // Ensure table has ID

      // Get parent container (table-responsive)
      const tableContainer = table.closest('.table-responsive');
      if (!tableContainer) return;

      // Create toggle controls container (if not already present)
      let toggleControls = tableContainer.previousElementSibling;
      if (!toggleControls || !toggleControls.classList.contains('toggle-view-controls')) {
        toggleControls = document.createElement('div');
        toggleControls.className = 'toggle-view-controls';
        tableContainer.parentNode.insertBefore(toggleControls, tableContainer);
      }

      // Create toggle buttons if they don't exist
      if (toggleControls.children.length === 0) {
        // Table view button
        const tableViewBtn = document.createElement('button');
        tableViewBtn.type = 'button';
        tableViewBtn.className = 'btn btn-outline-primary me-2 view-toggle-btn';
        tableViewBtn.dataset.view = 'table';
        tableViewBtn.dataset.target = tableId;
        tableViewBtn.innerHTML = `<i class="bi ${options.tableViewIcon}"></i> ${options.tableViewText}`;
        
        // Card view button
        const cardViewBtn = document.createElement('button');
        cardViewBtn.type = 'button';
        cardViewBtn.className = 'btn btn-outline-primary view-toggle-btn';
        cardViewBtn.dataset.view = 'card';
        cardViewBtn.dataset.target = tableId;
        cardViewBtn.innerHTML = `<i class="bi ${options.cardViewIcon}"></i> ${options.cardViewText}`;
        
        // Add buttons to controls
        toggleControls.appendChild(tableViewBtn);
        toggleControls.appendChild(cardViewBtn);
        
        // Add event listeners
        tableViewBtn.addEventListener('click', () => setView(tableId, 'table', true));
        cardViewBtn.addEventListener('click', () => setView(tableId, 'card', true));
      }

      // Create card container for card view (if not exists)
      let cardContainer = document.createElement('div');
      cardContainer.className = 'card-view-container d-none';
      cardContainer.id = `card-container-${tableId}`;
      tableContainer.parentNode.insertBefore(cardContainer, tableContainer.nextSibling);

      // Process this table to decide on view mode only after data is loaded
      processTableWhenDataIsReady(table, tableContainer, cardContainer);
    });

    // Add window resize listener to handle view changes on screen size change
    window.addEventListener('resize', debounce(handleResize, 250));
  }

  // Process table when data is ready (has rows with data)
  function processTableWhenDataIsReady(table, tableContainer, cardContainer) {
    const tableId = table.id;
    
    // Skip if this table is already being processed
    if (processingTables.has(tableId)) return;
    processingTables.add(tableId);

    // Set default view initially (always table view)
    setView(tableId, 'table', false);
    
    // Check if table has rows with actual data
    const checkForData = function(attempts = 0) {
      // Get rows that have actual data (not empty or loading rows)
      const bodyRows = table.querySelectorAll('tbody tr');
      const hasData = Array.from(bodyRows).some(row => {
        // Check if this is a data row (not a "no data" or "loading" row)
        return (row.cells.length > 1 && row.cells[0].colSpan !== table.querySelectorAll('thead th').length);
      });
      
      if (hasData) {
        // Table has data, now we can decide the appropriate view
        finalizeViewMode(table, tableContainer, cardContainer);
        processingTables.delete(tableId);
      } else if (attempts < options.maxCheckAttempts) {
        // Try again after delay if we haven't reached max attempts
        setTimeout(() => checkForData(attempts + 1), options.dataLoadCheckDelay);
      } else {
        // We've reached max attempts but still no data, use default view
        processingTables.delete(tableId);
      }
    };
    
    // Start checking for data
    checkForData();
  }
  
  // Finalize view mode once data is loaded
  function finalizeViewMode(table, tableContainer, cardContainer) {
    const tableId = table.id;
    
    // Determine view based on device and table width
    const isMobile = window.innerWidth < options.mobileBreakpoint;
    const isTableOverflowing = checkTableOverflow(table, tableContainer);
    
    // Get previous user preference if any (only for the current session)
    const userPreference = viewPreferences[tableId];
    
    // Set appropriate initial view:
    // 1. On desktop devices, always start with Table View
    // 2. On mobile devices, check if the table width exceeds screen width
    //    and automatically switch to Card View if it does
    let initialView;
    if (userPreference) {
      // If user manually selected a view during this session, respect it
      initialView = userPreference;
    } else if (isMobile && isTableOverflowing) {
      // On mobile with overflowing table, use card view
      initialView = 'card';
    } else {
      // Default to table view
      initialView = 'table';
    }
    
    // Generate cards from table data
    generateCards(table, cardContainer);
    
    // Set the view
    setView(tableId, initialView, false);
  }

  // Check if table width exceeds its container
  function checkTableOverflow(table, container) {
    // Skip tables with zero width (not fully rendered yet)
    const tableWidth = table.scrollWidth || table.offsetWidth;
    const containerWidth = container.clientWidth;
    
    // If either width is zero, the table is not fully rendered
    if (tableWidth === 0 || containerWidth === 0) {
      return false;
    }
    
    // If table is wider than its container plus threshold, it's overflowing
    return tableWidth > (containerWidth + options.tableOverflowThreshold);
  }

  // Generate card view from table data
  function generateCards(table, cardContainer) {
    // Clear existing cards
    cardContainer.innerHTML = '';
    
    // Get headers
    const headers = [];
    table.querySelectorAll('thead th').forEach(th => {
      // Skip action columns and numbering columns
      if (!th.classList.contains('table-number') && 
          !th.textContent.trim().toLowerCase().includes('إجراءات') && 
          !th.textContent.trim().toLowerCase().includes('actions')) {
        headers.push(th.textContent.trim());
      }
    });
    
    // Process each row to create cards
    table.querySelectorAll('tbody tr').forEach(row => {
      // Skip empty rows or "no results" rows
      if (row.cells.length <= 1 || row.cells[0].colSpan > 1) return;
      
      // Create card
      const card = document.createElement('div');
      card.className = 'card mb-3';
      
      // Card content
      let cardContent = `
        <div class="card-body">
          <h5 class="card-title">${row.cells[1]?.textContent.trim() || 'Item'}</h5>
          <dl class="row mb-0">
      `;
      
      // Add data fields - skip first column (numbering) and last column (actions)
      for (let i = 1; i < row.cells.length - 1; i++) {
        // Skip if this is the same content as the card title
        if (i === 1) continue;
        
        // Get header and cell content
        const header = headers[i - 1] || `Field ${i}`;
        const content = row.cells[i].innerHTML;
        
        // Add to card
        cardContent += `
          <dt class="col-sm-4">${header}</dt>
          <dd class="col-sm-8">${content}</dd>
        `;
      }
      
      cardContent += '</dl>';
      
      // Add action buttons if they exist in the last column
      const actionsCell = row.cells[row.cells.length - 1];
      if (actionsCell && actionsCell.querySelectorAll('button, a').length > 0) {
        cardContent += '<div class="card-actions mt-3">';
        // Clone buttons to preserve event listeners
        actionsCell.querySelectorAll('button, a').forEach(btn => {
          const clonedBtn = btn.cloneNode(true);
          cardContent += clonedBtn.outerHTML;
        });
        cardContent += '</div>';
      }
      
      cardContent += '</div>'; // Close card-body
      card.innerHTML = cardContent;
      
      // Re-attach event listeners to cloned buttons
      card.querySelectorAll('button, a').forEach((btn, index) => {
        const originalBtn = actionsCell?.querySelectorAll('button, a')[index];
        if (originalBtn) {
          const originalBtnAttributes = originalBtn.attributes;
          for (let i = 0; i < originalBtnAttributes.length; i++) {
            const { name, value } = originalBtnAttributes[i];
            if (name.startsWith('data-')) {
              btn.setAttribute(name, value);
            }
          }
        }
      });
      
      // Add card to container
      cardContainer.appendChild(card);
    });
    
    // Add event listeners to card action buttons
    attachCardButtonListeners(cardContainer, table);
  }
  
  // Attach event listeners to card buttons
  function attachCardButtonListeners(cardContainer, originalTable) {
    // Get all action buttons in the original table
    const originalButtons = originalTable.querySelectorAll('tbody button, tbody a');
    const cardButtons = cardContainer.querySelectorAll('button, a');
    
    // Match buttons by data attributes and class names
    cardButtons.forEach(cardBtn => {
      let matchedOriginal = null;
      
      // Try to find matching original button
      originalButtons.forEach(origBtn => {
        // Match by data-id and button text/class
        if (cardBtn.dataset.id === origBtn.dataset.id && 
            (cardBtn.textContent.trim() === origBtn.textContent.trim() || 
             cardBtn.className === origBtn.className)) {
          matchedOriginal = origBtn;
        }
      });
      
      // If found a match, replicate click behavior
      if (matchedOriginal) {
        cardBtn.addEventListener('click', (e) => {
          // Prevent default action to avoid navigation
          e.preventDefault();
          // Simulate click on original button
          matchedOriginal.click();
        });
      }
    });
  }

  // Set view mode (table or card)
  function setView(tableId, viewMode, isUserAction = false) {
    // Get elements
    const table = document.getElementById(tableId);
    const tableContainer = table?.closest('.table-responsive');
    const cardContainer = document.getElementById(`card-container-${tableId}`);
    const toggleControls = tableContainer?.previousElementSibling;
    
    if (!table || !tableContainer || !cardContainer || !toggleControls) return;
    
    // Update button states
    toggleControls.querySelectorAll('.view-toggle-btn').forEach(btn => {
      if (btn.dataset.view === viewMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    
    // Toggle visibility
    if (viewMode === 'table') {
      tableContainer.classList.remove('d-none');
      cardContainer.classList.add('d-none');
    } else {
      tableContainer.classList.add('d-none');
      cardContainer.classList.remove('d-none');
      
      // Refresh cards in case table data has changed
      generateCards(table, cardContainer);
    }
    
    // Store the current view preference in memory only if user manually selected it
    if (isUserAction) {
      viewPreferences[tableId] = viewMode;
    }
  }
  
  // Handle window resize
  function handleResize() {
    document.querySelectorAll('.toggle-view-table').forEach(table => {
      const tableId = table.id;
      const userPreference = viewPreferences[tableId];
      const tableContainer = table.closest('.table-responsive');
      
      if (!userPreference && tableContainer) {
        // Only auto-switch if user hasn't set a preference during this session
        const isMobile = window.innerWidth < options.mobileBreakpoint;
        const isTableOverflowing = checkTableOverflow(table, tableContainer);
        
        if (isMobile && isTableOverflowing) {
          setView(tableId, 'card');
        } else {
          setView(tableId, 'table');
        }
      }
    });
  }
  
  // Check if a table has been updated with new data
  function refreshTable(tableId) {
    const table = document.getElementById(tableId);
    const tableContainer = table?.closest('.table-responsive');
    const cardContainer = document.getElementById(`card-container-${tableId}`);
    
    if (table && tableContainer && cardContainer) {
      // Regenerate cards from the updated table data
      generateCards(table, cardContainer);
      
      // Re-check if view mode should change (only if no user preference)
      if (!viewPreferences[tableId]) {
        const isMobile = window.innerWidth < options.mobileBreakpoint;
        const isTableOverflowing = checkTableOverflow(table, tableContainer);
        
        if (isMobile && isTableOverflowing) {
          setView(tableId, 'card', false);
        }
      }
    }
  }
  
  // Debounce function to limit resize event calls
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }

  // Public API
  return {
    init,
    setView,
    refreshTable,
    options
  };
})();