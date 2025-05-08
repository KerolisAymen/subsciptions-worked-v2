// فئة الموجه للتعامل مع التوجيه من جانب العميل
class Router {
  constructor() {
    this.app = document.getElementById('app');
    this.routes = {
      '/': this.renderLandingPage.bind(this),
      '/login': this.renderLoginPage.bind(this),
      '/signup': this.renderSignupPage.bind(this),
      '/projects': this.renderProjectsPage.bind(this),
      '/project/:id': this.renderProjectDashboard.bind(this),
      '/trip/:id': this.renderTripDetails.bind(this),
      '/about': this.renderAboutPage.bind(this),
      '/contact': this.renderContactPage.bind(this),
      '/privacy': this.renderPrivacyPage.bind(this),
      '/admin': this.renderAdminDashboard.bind(this),
      '/verify-email/:token': this.renderVerifyEmailPage.bind(this),
      '/forgot-password': this.renderForgotPasswordPage.bind(this),
      '/reset-password/:token': this.renderResetPasswordPage.bind(this)
    };
    
    // Don't initialize in constructor - we'll call initRouting explicitly
    this.participantSearchTerm = '';
    this.participantSortColumn = null;
    this.participantSortDirection = 'asc';
    this.fullParticipantsData = []; // Store the full dataset
  }

  // This method is called from app.js
  initRouting() {
    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => this.handleRoute());
    
    // Handle link clicks (prevent default behavior)
    document.body.addEventListener('click', e => {
      if (e.target.matches('a') || e.target.closest('a')) {
        const link = e.target.matches('a') ? e.target : e.target.closest('a');
        const href = link.getAttribute('href');
        
        // Skip for external links, anchors, or non-router links
        if (!href || href.startsWith('http') || href.startsWith('#') || link.hasAttribute('data-no-router')) {
          return;
        }
        
        e.preventDefault();
        this.navigate(href);
      }
    });
    
    // Initial routing
    this.handleRoute();
  }

  // Navigate to a new path
  navigate(path) {
    window.history.pushState(null, null, path);
    this.handleRoute();
  }
  
  // Handle routing - was missing in original code
  handleRoute() {
    // Just delegate to the route method
    this.route();
  }

  // Match current path to defined routes
  async route(forceReload = false) {
    // Get the current path
    const path = window.location.pathname;
    
    // Check if authentication is required for this route
    const requiresAuth = this.isAuthenticatedRoute(path);
    
    // If authentication is required and user is not authenticated,
    // redirect to login page
    if (requiresAuth && !auth.isAuthenticated()) {
      window.history.replaceState(null, '', '/login');
      this.renderLoginPage();
      return;
    }
    
    console.log('Routing to path:', path);
    
    // Route to the appropriate page based on the path
    if (path === '/') {
      this.renderLandingPage();
    } else if (path === '/login') {
      // Only redirect if user is already authenticated
      if (auth.isAuthenticated()) {
        window.history.replaceState(null, '', '/projects');
        this.renderProjectsPage();
      } else {
        this.renderLoginPage();
      }
    } else if (path === '/signup') {
      // Only redirect if user is already authenticated
      if (auth.isAuthenticated()) {
        window.history.replaceState(null, '', '/projects');
        this.renderProjectsPage();
      } else {
        this.renderSignupPage();
      }
    } else if (path === '/forgot-password') {
      this.renderForgotPasswordPage();
    } else if (path.match(/^\/reset-password\/[A-Za-z0-9-_]+$/)) {
      const token = path.split('/')[2];
      this.renderResetPasswordPage({ token });
    } else if (path === '/about') {
      this.renderAboutPage();
    } else if (path === '/contact') {
      this.renderContactPage();
    } else if (path === '/privacy') {
      this.renderPrivacyPage();
    } else if (path === '/projects') {
      this.renderProjectsPage();
    } else if (path === '/admin') {
      this.renderAdminDashboard();
    } else if (path.match(/^\/verify-email\/[A-Za-z0-9-_]+$/)) {
      const token = path.split('/')[2];
      this.renderVerifyEmailPage({ token });
    } else if (path.match(/^\/project\/[a-zA-Z0-9-]+$/)) {
      // Updated to match UUID and other ID formats
      const id = path.split('/')[2];
      console.log('Rendering project dashboard for ID:', id);
      this.renderProjectDashboard({ id });
    } else if (path.match(/^\/trip\/[a-zA-Z0-9-]+$/)) {
      // Updated to match UUID and other ID formats
      const id = path.split('/')[2];
      console.log('Rendering trip details for ID:', id);
      this.renderTripDetails({ id });
    } else {
      console.log('No route match found, rendering 404 page');
      this.renderNotFoundPage();
    }
    
    // Update authentication UI
    auth.updateUI();
  }

  // Check if route requires authentication
  isAuthenticatedRoute(path) {
    // Check exact path matches first
    if (['/forgot-password', '/', '/login', '/signup', '/about', '/contact', '/privacy'].includes(path)) {
      return false;
    }
    
    // Check pattern matches for routes with parameters
    if (path.match(/^\/reset-password\/[A-Za-z0-9-_]+$/)) {
      return false;
    }
    
    if (path.match(/^\/verify-email\/[A-Za-z0-9-_]+$/)) {
      return false;
    }
    // All other routes require authentication
    return true;
  }

  // Clear app content
  clearApp() {
    if (this.app) this.app.innerHTML = '';
  }

  // Render a template by its ID
  renderTemplate(templateId, data = {}) {
    this.clearApp();
    
    const template = document.getElementById(templateId);
    if (!template) {
      console.error(`Template "${templateId}" not found`);
      return;
    }
    
    // Clone template content
    const clone = document.importNode(template.content, true);
    
    // If data is provided, try to replace placeholders
    if (Object.keys(data).length > 0) {
      const elements = clone.querySelectorAll('[data-bind]');
      elements.forEach(el => {
        const key = el.getAttribute('data-bind');
        if (data[key] !== undefined) {
          el.textContent = data[key];
        }
      });
    }
    
    // ترجمة العناصر التي تحتوي على سمة data-i18n
    clone.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = i18n.t(key);
    });
    
    // Ensure app container exists
    if (!this.app) {
      console.error('App container not found!');
      return;
    }
    
    // Append the clone to the app container
    this.app.appendChild(clone);
    
    // إرسال حدث للإشارة إلى انتقال الصفحة
    document.dispatchEvent(new CustomEvent('page-transition'));
    
    console.log('Template rendered:', templateId);
  }

  // Page handlers
  renderLandingPage() {
    console.log('Rendering landing page');
    this.renderTemplate('landing-template');
  }

  renderLoginPage() {
    this.clearApp();
    this.renderTemplate('login-template');
    const form = document.getElementById('login-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        setButtonLoading(submitBtn, i18n.t('common.loading'));
        try {
          await auth.login({ email, password });
          this.navigate('/projects');
          showToast(i18n.t('common.success'), i18n.t('auth.loginSuccess'), 'success');
        } catch (error) {
          console.error('Login error:', error);
        } finally {
          resetButtonLoading(submitBtn);
        }
      });
    }
  }

  renderSignupPage() {
    this.clearApp();
    this.renderTemplate('signup-template');
    const form = document.getElementById('signup-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(form)) return;
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (!name || !email || !password || !confirmPassword) {
          showToast(i18n.t('common.error'), i18n.t('errors.requiredField'));
          return;
        }
        if (password !== confirmPassword) {
          showToast(i18n.t('common.error'), i18n.t('errors.passwordMismatch'));
          return;
        }
        if (password.length < 8) {
          showToast(i18n.t('common.error'), i18n.t('errors.shortPassword'));
          return;
        }
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        setButtonLoading(submitBtn, i18n.t('common.loading'));
        try {
          await auth.signup({ name, email, password });
          this.navigate('/projects');
          showToast(i18n.t('common.success'), i18n.t('auth.signupSuccess'));
        } catch (error) {
          console.error('Signup error:', error);
        } finally {
          resetButtonLoading(submitBtn);
        }
      });
    }
  }

  async renderProjectsPage() {
    this.renderTemplate('projects-template');
    
    try {
      const response = await api.getProjects();
      // Ensure the response structure matches what the backend provides
      // Assuming backend returns { data: { projects: [...] }
      const projects = response.data.projects || []; 
      
      const container = document.getElementById('projects-container');
      if (container) {
        if (projects.length === 0) {
          container.innerHTML = `
            <div class="col-12 text-center">
              <p class="lead">${i18n.t('projects.noProjects')}</p> 
              <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createProjectModal">
                 <i class="bi bi-plus-circle"></i> ${i18n.t('projects.newProject')}
              </button>
            </div>
          `;
        } else {
          container.innerHTML = ''; // Clear previous projects
          projects.forEach(project => {
            const col = document.createElement('div');
            // Use the classes from the previous implementation for consistency
            col.className = 'col-md-6 col-lg-4 mb-4 project-card'; 
            col.setAttribute('data-project-id', project.id); // Add project id attribute

            // Enhanced card UI: shadow, hover, rounded, border, subtle background
            let cardClass = "card h-100 shadow-sm border-0 rounded-4 project-card-ui";
            // Conditionally add Edit and Delete buttons for the owner
            let ownerControls = '';
            if (project.role === 'owner') {
              ownerControls = `
                <button class="btn btn-sm btn-outline-secondary me-2 btn-edit-project" data-id="${project.id}" data-bs-placement="top" title="${i18n.t('common.edit')}">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger btn-delete-project" data-id="${project.id}" data-bs-placement="top" title="${i18n.t('common.delete')}">
                  <i class="bi bi-trash"></i>
                </button>
              `;
            }

            col.innerHTML = `
              <div class="${cardClass}">
                <div class="card-body d-flex flex-column">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="card-title mb-0">${project.name}</h5>
                    <span class="badge ${this.getRoleBadgeClass(project.role)} ms-2 text-uppercase">${project.role}</span>
                  </div>
                  <p class="card-text text-muted small flex-grow-1">${project.description || i18n.t('projects.noDescription')}</p>
                </div>
                <div class="card-footer bg-light border-0 d-flex justify-content-between align-items-center">
                  <a href="/project/${project.id}" class="btn btn-primary btn-sm px-3"  data-bs-placement="top" title="${i18n.t('projects.viewProject')}">
                    <i class="bi bi-box-arrow-in-up-right"></i> ${i18n.t('projects.viewProject')}
                  </a>
                  <div class="d-flex gap-1">
                    ${ownerControls}
                  </div>
                </div>
              </div>
            `;
            
            container.appendChild(col);
          });

          // Enhance card UI with CSS (add once)
          if (!document.getElementById('project-card-ui-style')) {
            const style = document.createElement('style');
            style.id = 'project-card-ui-style';
            style.innerHTML = `
              .project-card-ui { transition: box-shadow 0.2s, transform 0.2s; background: #f8f9fa; }
              .project-card-ui:hover { box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.08); transform: translateY(-2px) scale(1.01); }
              .project-card-ui .btn { transition: background 0.15s, color 0.15s; }
              .project-card-ui .btn-outline-danger:hover { background: #dc3545; color: #fff; }
              .project-card-ui .btn-outline-secondary:hover { background: #6c757d; color: #fff; }
              .project-card-ui .btn-primary { box-shadow: none; }
            `;
            document.head.appendChild(style);
          }
        }
      }
      
      // Add event handlers for project creation
      this.addProjectCreationHandlers(); 
      // Add event handlers for project edit and delete AFTER rendering cards
      this.addProjectEditAndDeleteHandlers(); 

      // Initialize Bootstrap tooltips for new elements
      setTimeout(() => {
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
          if (!el._tooltipInstance) {
            el._tooltipInstance = new bootstrap.Tooltip(el);
          }
        });
      }, 0);

    } catch (error) {
      console.error('Get projects error:', error);
      showToast(i18n.t('common.error'), i18n.t('errors.projectLoadError'));
      const container = document.getElementById('projects-container');
      if (container) {
          container.innerHTML = `<p class="text-danger">${i18n.t('errors.projectLoadError')}</p>`;
      }
    }
  }

  // Add event handlers for project creation (Refactored from previous implementation)
  addProjectCreationHandlers() {
    const createProjectForm = document.getElementById('create-project-form');
    const createProjectBtn = document.getElementById('create-project-btn');
    const createProjectModalEl = document.getElementById('createProjectModal');
    
    // Ensure modal element exists before proceeding
    if (!createProjectModalEl) {
        console.error("Create project modal element (#createProjectModal) not found.");
        return;
    }
    // Get instance safely
    const createProjectModal = bootstrap.Modal.getOrCreateInstance(createProjectModalEl);

    if (createProjectBtn && createProjectForm) { // Also check if form exists
      // Use cloneNode to avoid duplicate listeners if re-rendered
      const newCreateBtn = createProjectBtn.cloneNode(true);
      createProjectBtn.parentNode.replaceChild(newCreateBtn, createProjectBtn);

      newCreateBtn.addEventListener('click', async () => {
        // Check validity using the form element
        if (createProjectForm.checkValidity() === false) {
          createProjectForm.classList.add('was-validated');
          return;
        }
        createProjectForm.classList.remove('was-validated'); // Reset validation state

        const projectName = document.getElementById('projectName').value;
        const projectDescription = document.getElementById('projectDescription').value;

        const originalText = newCreateBtn.innerHTML;
        setButtonLoading(newCreateBtn, i18n.t('common.creating'));

        try {
          const response = await api.createProject({
            name: projectName,
            description: projectDescription
          });

          // --- Safely hide the modal ---
          // Re-fetch the instance right before hiding to ensure it's valid
          const modalInstanceToHide = bootstrap.Modal.getInstance(createProjectModalEl);
          if (modalInstanceToHide) {
            modalInstanceToHide.hide();
          } else {
             console.warn("Bootstrap modal instance could not be retrieved before hiding createProjectModal.");
             // Optional: Add manual fallback if needed, but it's better to fix the root cause
             createProjectModalEl.classList.remove('show');
             createProjectModalEl.style.display = 'none';
             const backdrop = document.querySelector('.modal-backdrop');
             if (backdrop) backdrop.remove();
             document.body.classList.remove('modal-open');
             document.body.style.paddingRight = '';
          }
          // --- End safe hide ---

          // Reset form only if it exists
          if (createProjectForm) {
             createProjectForm.reset();
          }

          // Navigate to the new project dashboard
          this.navigate(`/project/${response.data.project.id}`);
          showToast(i18n.t('common.success'), i18n.t('projects.projectCreated'));

        } catch (error) {
          console.error('Create project error:', error);
          // Check if the error is the specific backdrop error
          if (error instanceof TypeError && error.message.includes('backdrop')) {
              console.error("Potential Bootstrap backdrop issue detected during hide().");
              // Attempt manual cleanup as a last resort
              createProjectModalEl.classList.remove('show');
              createProjectModalEl.style.display = 'none';
              const backdrop = document.querySelector('.modal-backdrop');
              if (backdrop) backdrop.remove();
              document.body.classList.remove('modal-open');
              document.body.style.paddingRight = '';
          }
          showToast(i18n.t('common.error'), i18n.t('errors.projectCreateError'));
        } finally {
          resetButtonLoading(newCreateBtn, originalText);
        }
      });
    } else {
        if (!createProjectBtn) console.warn("Create project button (#create-project-btn) not found.");
        if (!createProjectForm) console.warn("Create project form (#create-project-form) not found.");
    }

    // Clear form validation when modal is hidden
    // Ensure listener is attached only once and element exists
    const existingListener = createProjectModalEl.getAttribute('data-hidden-listener');
    if (!existingListener) {
        createProjectModalEl.setAttribute('data-hidden-listener', 'true');
        createProjectModalEl.addEventListener('hidden.bs.modal', () => {
            console.log("Create project modal hidden event triggered.");
            // Check form exists before resetting
            if (createProjectForm) {
                createProjectForm.classList.remove('was-validated');
                createProjectForm.reset();
            } else {
                console.warn("Create project form not found during hidden.bs.modal event.");
            }
        });
    }
  }

  // Add event handlers for project edit and delete (Refactored from previous implementation)
  addProjectEditAndDeleteHandlers() {
    const editProjectForm = document.getElementById('edit-project-form');
    const editProjectBtn = document.getElementById('edit-project-btn');
    const editProjectModalEl = document.getElementById('editProjectModal');
    const editProjectIdInput = document.getElementById('editProjectId');
    const editProjectNameInput = document.getElementById('editProjectName');
    const editProjectDescriptionInput = document.getElementById('editProjectDescription');

    // --- Defensive: If modal is missing, disable all edit/delete buttons and show tooltip ---
    if (!editProjectModalEl) {
      console.error("Edit project modal element (#editProjectModal) not found.");
      document.querySelectorAll('.btn-edit-project, .btn-delete-project').forEach(btn => {
        btn.disabled = true;
        btn.title = "Edit/Delete not available: modal missing in HTML";
        btn.classList.add('disabled');
      });
      showToast(i18n.t('common.error'), "Edit project modal is missing from the page. Please contact support.");
      return;
    }
    // --- Edit Button Click (Open Modal) ---
    document.querySelectorAll('.btn-edit-project').forEach(button => {
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', async () => {
        if (!editProjectModalEl || !editProjectForm || !editProjectIdInput || !editProjectNameInput || !editProjectDescriptionInput) {
          showToast(i18n.t('common.error'), "Edit modal or form fields missing.");
          return;
        }
        const projectId = newButton.getAttribute('data-id');
        editProjectIdInput.value = projectId;

        const originalButtonText = newButton.innerHTML;
        try {
          setButtonLoading(newButton);
          const projectResponse = await api.getProject(projectId);
          resetButtonLoading(newButton, originalButtonText);

          if (projectResponse?.data?.project) {
            const project = projectResponse.data.project;
            editProjectNameInput.value = project.name;
            editProjectDescriptionInput.value = project.description || '';
            editProjectForm.classList.remove('was-validated');
            // Always get a fresh modal instance
            const modalInstance = bootstrap.Modal.getOrCreateInstance(editProjectModalEl);
            modalInstance.show();
          } else {
            showToast(i18n.t('common.error'), i18n.t('errors.projectLoadError'));
          }
        } catch (error) {
          console.error("Failed to load project details for editing:", error);
          showToast(i18n.t('common.error'), i18n.t('errors.projectLoadError'));
          resetButtonLoading(newButton, originalButtonText);
        }
      });
    });

    // --- Save Changes Button Click (Submit Edit) ---
    if (editProjectBtn && editProjectForm) {
      const newEditSaveBtn = editProjectBtn.cloneNode(true);
      editProjectBtn.parentNode.replaceChild(newEditSaveBtn, editProjectBtn);

      newEditSaveBtn.addEventListener('click', async () => {
        if (!editProjectForm || !editProjectIdInput || !editProjectNameInput) {
          showToast(i18n.t('common.error'), "Edit form or fields missing.");
          return;
        }
        if (editProjectForm.checkValidity() === false) {
          editProjectForm.classList.add('was-validated');
          return;
        }
        editProjectForm.classList.remove('was-validated');

        const projectId = editProjectIdInput.value;
        const name = editProjectNameInput.value;
        const description = editProjectDescriptionInput ? editProjectDescriptionInput.value : '';

        if (!projectId || name === null) {
          showToast(i18n.t('common.error'), i18n.t('errors.genericError'));
          return;
        }

        const originalText = newEditSaveBtn.innerHTML;
        setButtonLoading(newEditSaveBtn, i18n.t('common.saving'));

        try {
          await api.updateProject(projectId, { name, description: description || '' });
          // Safely hide the modal
          const modalInstanceToHide = bootstrap.Modal.getInstance(editProjectModalEl);
          if (modalInstanceToHide) {
            modalInstanceToHide.hide();
          } else {
            console.warn("Edit project modal instance not found before hiding.");
          }
          showToast(i18n.t('common.success'), i18n.t('projects.projectUpdated'));
          await this.renderProjectsPage();
        } catch (error) {
          console.error('Update project error:', error);
          showToast(i18n.t('common.error'), i18n.t('errors.projectUpdateError'));
        } finally {
          resetButtonLoading(newEditSaveBtn, originalText);
        }
      });
    } else {
      if (!editProjectBtn) console.warn("Edit project save button (#edit-project-btn) not found.");
      if (!editProjectForm) console.warn("Edit project form (#edit-project-form) not found.");
    }

    // Clear form validation when modal is hidden
    // Ensure listener is attached only once
    const existingEditHiddenListener = editProjectModalEl.getAttribute('data-hidden-listener');
    if (!existingEditHiddenListener) {
        editProjectModalEl.setAttribute('data-hidden-listener', 'true');
        editProjectModalEl.addEventListener('hidden.bs.modal', () => {
            console.log("Edit project modal hidden event triggered.");
            if (editProjectForm) { // Check form exists
                editProjectForm.classList.remove('was-validated');
                // Optionally reset form if needed, but might clear data unexpectedly if closed manually
                // editProjectForm.reset(); 
            } else {
                console.warn("Edit project form not found during hidden.bs.modal event.");
            }
        });
    }


    // --- Delete Button Click ---
    document.querySelectorAll('.btn-delete-project').forEach(button => {
      // Use cloneNode to prevent duplicate listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      newButton.addEventListener('click', async () => {
        const projectId = newButton.getAttribute('data-id');
        // --- Confirmation dialog before deletion ---
        const confirmed = await showConfirmDialog(
          `<span class="text-danger"><i class="bi bi-exclamation-triangle"></i> ${i18n.t('projects.confirmDeleteProject')}</span><br>
          <small class="text-muted">${i18n.t('projects.deleteWarning') || 'This action cannot be undone.'}</small>`
        );
        if (confirmed) {
          const originalText = newButton.innerHTML;
          setButtonLoading(newButton);
          try {
            await api.deleteProject(projectId);
            showToast(i18n.t('common.success'), i18n.t('projects.projectDeleted'));
            const cardToRemove = document.querySelector(`.project-card[data-project-id="${projectId}"]`);
            if (cardToRemove) {
              cardToRemove.remove();
              // Check if container is empty after deletion
              const container = document.getElementById('projects-container');
              // Check if container exists and has no *element* children left
              if (container && container.childElementCount === 0) { 
                  container.innerHTML = `
                    <div class="col-12 text-center">
                      <p class="lead">${i18n.t('projects.noProjects')}</p> 
                      <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createProjectModal">
                         <i class="bi bi-plus-circle"></i> ${i18n.t('projects.newProject')}
                      </button>
                    </div>`;
                  // Re-attach creation handler if needed, though renderProjectsPage might be simpler
                  this.addProjectCreationHandlers(); 
              }
            } else {
              // Fallback: re-render if card not found
              console.warn(`Project card with ID ${projectId} not found for removal. Re-rendering list.`);
              await this.renderProjectsPage();
            }
          } catch (error) {
            console.error('Delete project error:', error);
            showToast(i18n.t('common.error'), i18n.t('errors.projectDeleteError'));
            resetButtonLoading(newButton, originalText); // Reset button on error
          }
          // No finally block needed here as the button/card is removed on success
        }
      });
    });
  }

  async renderProjectDashboard(params) {
    console.log('Starting project dashboard render with params:', params);
    this.renderTemplate('project-dashboard-template');
    
    try {
      const projectId = params.id;
      console.log('Fetching project data for ID:', projectId);
      
      showLoading(); // Show loading indicator
      
      // Launch multiple API calls in parallel to improve loading time
      const [projectResponse, summaryResponse] = await Promise.all([
        api.getProject(projectId),
        api.getProjectSummary(projectId)
      ]);
      
      console.log('Project API response:', projectResponse);
      
      hideLoading(); // Hide loading indicator
      
      if (!projectResponse || !projectResponse.data || !projectResponse.data.project) {
        console.error('Invalid project data received');
        showToast('Error', 'Failed to load project data - invalid response');
        return;
      }
      
      const project = projectResponse.data.project;
      const userRole = projectResponse.data.userRole;
      const summary = summaryResponse.data;
      
      // Update project name and description
      const projectNameElement = document.getElementById('project-name');
      const dashboardProjectNameElement = document.getElementById('dashboard-project-name');
      const projectDescriptionElement = document.getElementById('project-description');
      
      if (projectNameElement) projectNameElement.textContent = project.name;
      if (dashboardProjectNameElement) dashboardProjectNameElement.textContent = project.name;
      if (projectDescriptionElement) projectDescriptionElement.textContent = project.description || 'No description';
      
      // Update overview tab
      document.getElementById('trip-count').textContent = summary.tripCount;
      document.getElementById('total-expected').textContent = i18n.formatCurrency(summary.totalExpected); // Use formatCurrency
      document.getElementById('total-collected').textContent = i18n.formatCurrency(summary.totalCollected); // Use formatCurrency
      document.getElementById('total-remaining').textContent = i18n.formatCurrency(summary.totalRemainingAmount); // Use formatCurrency
      
      const progressBar = document.getElementById('collection-progress');
      const percent = summary.percentComplete.toFixed(0);
      progressBar.style.width = `${percent}%`;
      progressBar.textContent = `${percent}%`;
      
      // Update recent trips
      const recentTripsContainer = document.getElementById('recent-trips');
      if (summary.trips.length === 0) {
        recentTripsContainer.innerHTML = '<li class="list-group-item">No trips yet</li>';
      } else {
        recentTripsContainer.innerHTML = '';
        // Show up to 5 most recent trips
        const recentTrips = summary.trips.slice(0, 5);
        recentTrips.forEach((trip, idx) => {
          recentTripsContainer.innerHTML += `
            <li class="list-group-item d-flex justify-content بين align-items-center">
              <span class="table-number me-2">${idx + 1}</span>
              <a href="/trip/${trip.id}" class="text-decoration-none">${trip.name}</a>
              <span class="badge bg-primary rounded-pill">${trip.percentComplete.toFixed(0)}%</span>
            </li>
          `;
        });
      }
      
      // Update collector summary
      const collectorSummaryContainer = document.getElementById('collector-summary');
      if (summary.collectorSummary.length === 0) {
        collectorSummaryContainer.innerHTML = '<tr><td colspan="3">No payments collected yet</td></tr>';
      } else {
        collectorSummaryContainer.innerHTML = '';
        summary.collectorSummary.forEach((collector, idx) => {
          collectorSummaryContainer.innerHTML += `
            <tr>
              <td class="table-number">${idx + 1}</td>
              <td>${collector.collectorName}</td>
              <td>${collector.total.toFixed(2)}</td>
            </tr>
          `;
        });
      }
      
      // Update Report Tab Summary Cards
      const reportTotalExpected = document.getElementById('report-total-expected');
      const reportTotalCollected = document.getElementById('report-total-collected');
      const reportTotalRemaining = document.getElementById('report-total-remaining');
      const reportCompletion = document.getElementById('report-completion');

      if (reportTotalExpected) reportTotalExpected.textContent = i18n.formatCurrency(summary.totalExpected);
      if (reportTotalCollected) reportTotalCollected.textContent = i18n.formatCurrency(summary.totalCollected);
      if (reportTotalRemaining) reportTotalRemaining.textContent = i18n.formatCurrency(summary.totalRemainingAmount);
      if (reportCompletion) reportCompletion.textContent = `${summary.percentComplete.toFixed(0)}%`;
      
      // Initialize tabs in parallel to improve performance
      const initPromises = [
        this.initTripsTab(projectId, userRole , summary),
        this.initMembersTab(projectId, userRole),
        this.initReportsTab(projectId, summary)
      ];
      
      // Wait for all initializations to complete
      await Promise.all(initPromises);
      
      // Handle access control based on user role
      this.handleRoleBasedAccess(userRole);
      
      // Add event listeners for creating trips and adding members
      this.addProjectEventListeners(projectId);
    } catch (error) {
      hideLoading(); // Hide loading indicator in case of error
      console.error('Load project error:', error);
      
      // Detailed error reporting
      if (error.response) {
        console.error('Error response:', error.response);
        showToast('Error', `Failed to load project: ${error.response.data?.message || 'Server error'}`);
      } else if (error.request) {
        console.error('Error request:', error.request);
        showToast('Error', 'Network error - no response from server');
      } else {
        showToast('Error', `Failed to load project: ${error.message || 'Unknown error'}`);
      }
    }
  }

  async initTripsTab(projectId, userRole,summary) {
    try {
      const response = await api.getProjectTrips(projectId);
      const trips = response.data.trips;
      
      const tripsListContainer = document.getElementById('trips-list');
      if (tripsListContainer) {
        if (trips.length === 0) {
          tripsListContainer.innerHTML = `
            <tr>
              <td colspan="8" class="text-center">No trips yet</td>
            </tr>
          `;
        } else {
          tripsListContainer.innerHTML = '';
          trips.forEach((trip, idx) => {

            const expected = summary.trips?.[idx]?.expected || 0;
            const collected = summary.trips?.[idx]?.collected || 0;

            const remaining = expected - collected;
            const progress = expected > 0 ? Math.round((collected / expected) * 100) : 0;
            
            tripsListContainer.innerHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td>${trip.name}</td>
                <td>${trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'غير محدد'}</td>
                <td>${trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'غير محدد'}</td>
                <td>${expected.toFixed(2)}</td>
                <td>${collected.toFixed(2)}</td>
                <td>${remaining.toFixed(2)}</td>
                <td>
                  <div class="progress">
                    <div class="progress-bar" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${progress}%</div>
                  </div>
                </td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <a href="/trip/${trip.id}" class="btn btn-primary">${i18n.t('common.view')}</a>
                    ${['owner', 'admin'].includes(userRole) ? `
                      <button class="btn btn-outline-secondary btn-edit-trip" data-id="${trip.id}">${i18n.t('common.edit')}</button>
                      <button class="btn btn-outline-danger btn-delete-trip" data-id="${trip.id}">${i18n.t('common.delete')}</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          });
          
          // Add event listeners for edit and delete buttons
          if (['owner', 'admin'].includes(userRole)) {
            document.querySelectorAll('.btn-edit-trip').forEach(btn => {
              // Remove previous listeners
              const newBtn = btn.cloneNode(true);
              btn.parentNode.replaceChild(newBtn, btn);
              newBtn.addEventListener('click', async () => {
                const tripId = newBtn.getAttribute('data-id');
                // Get trip data
                try {
                  setButtonLoading(newBtn, i18n.t('common.loading'));
                  const tripResp = await api.getTrip(tripId);
                  resetButtonLoading(newBtn, i18n.t('common.edit'));
                  if (!tripResp || !tripResp.data || !tripResp.data.trip) {
                    showToast('خطأ', 'تعذر تحميل بيانات الرحلة');
                    return;
                  }
                  const trip = tripResp.data.trip;
                  // Fill modal fields
                  document.getElementById('editTripId').value = trip.id;
                  document.getElementById('editTripName').value = trip.name || '';
                  document.getElementById('editTripDescription').value = trip.description || '';
                  document.getElementById('editStartDate').value = trip.startDate ? trip.startDate.split('T')[0] : '';
                  document.getElementById('editEndDate').value = trip.endDate ? trip.endDate.split('T')[0] : '';
                  document.getElementById('editTotalCost').value = trip.totalCost || '';
                  document.getElementById('editExpectedAmountPerPerson').value = trip.expectedAmountPerPerson || '';
                  // Show modal
                  const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('editTripModal'));
                  modal.show();
                } catch (error) {
                  resetButtonLoading(newBtn, i18n.t('common.edit'));
                  showToast('خطأ', 'تعذر تحميل بيانات الرحلة');
                }
              });
            });
            
            // Save changes in edit trip modal
            const editTripBtn = document.getElementById('edit-trip-btn');
            if (editTripBtn) {
              const newEditBtn = editTripBtn.cloneNode(true);
              editTripBtn.parentNode.replaceChild(newEditBtn, editTripBtn);
              newEditBtn.addEventListener('click', async () => {
                const tripId = document.getElementById('editTripId').value;
                const name = document.getElementById('editTripName').value;
                const description = document.getElementById('editTripDescription').value;
                const startDate = document.getElementById('editStartDate').value;
                const endDate = document.getElementById('editEndDate').value;
                const totalCost = document.getElementById('editTotalCost').value;
                const expectedAmountPerPerson = document.getElementById('editExpectedAmountPerPerson').value;
                if (!name) {
                  showToast('خطأ', 'اسم الرحلة مطلوب');
                  return;
                }
                setButtonLoading(newEditBtn, i18n.t('common.saving'));
                try {
                  await api.updateTrip(tripId, {
                    name,
                    description,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    totalCost: totalCost || 0,
                    expectedAmountPerPerson: expectedAmountPerPerson || 0
                  });
                  // Hide modal
                  const modal = bootstrap.Modal.getInstance(document.getElementById('editTripModal'));
                  if (modal) modal.hide();
                  showToast('نجاح', 'تم تحديث بيانات الرحلة');
                  // Refresh trips list
                  await this.initTripsTab(projectId, userRole);
                } catch (error) {
                  showToast('خطأ', 'فشل في تحديث بيانات الرحلة');
                } finally {
                  resetButtonLoading(newEditBtn, i18n.t('common.save'));
                }
              });
            }

            document.querySelectorAll('.btn-delete-trip').forEach(btn => {
              btn.addEventListener('click', async () => {
                const confirmed = await showConfirmDialog(i18n.t('common.confirmDelete'));
                if (!confirmed) return;
                
                const tripId = btn.getAttribute('data-id');
                try {
                  await api.deleteTrip(tripId);
                  // Refresh trips list
                  this.initTripsTab(projectId, userRole);
                  showToast('Success', 'Trip deleted successfully');
                } catch (error) {
                  console.error('Delete trip error:', error);
                }
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Get trips error:', error);
    }
  }

  async initMembersTab(projectId, userRole) {
    try {
      const response = await api.getProjectMembers(projectId);
      const members = response.data.members;
      
      const membersListContainer = document.getElementById('members-list');
      if (membersListContainer) {
        if (members.length === 0) {
          membersListContainer.innerHTML = `
            <tr>
              <td colspan="4" class="text-center">No members yet</td>
            </tr>
          `;
        } else {
          membersListContainer.innerHTML = '';
          members.forEach((member, idx) => {
            membersListContainer.innerHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td>${member.user.name}</td>
                <td>${member.user.email}</td>
                <td>
                  <span class="badge ${this.getRoleBadgeClass(member.role)}">${member.role}</span>
                </td>
                <td>
                  ${member.role !== 'owner' && ['owner', 'admin'].includes(userRole) ? `
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary btn-change-role" data-id="${member.id}" data-role="${member.role}">Change Role</button>
                      <button class="btn btn-outline-danger btn-remove-member" data-id="${member.id}">Remove</button>
                    </div>
                  ` : ''}
                </td>
              </tr>
            `;
          });
          
          // Add event listeners for role change and remove buttons
          if (['owner', 'admin'].includes(userRole)) {
            document.querySelectorAll('.btn-change-role').forEach(btn => {
              btn.addEventListener('click', async () => {
                const memberId = btn.getAttribute('data-id');
                const currentRole = btn.getAttribute('data-role');
                const newRole = currentRole === 'admin' ? 'collector' : 'admin';
                
                try {
                  await api.updateProjectMember(projectId, memberId, { role: newRole });
                  // Refresh members list
                  this.initMembersTab(projectId, userRole);
                  showToast('Success', `Member role updated to ${newRole}`);
                } catch (error) {
                  console.error('Update member role error:', error);
                }
              });
            });
            
            document.querySelectorAll('.btn-remove-member').forEach(btn => {
              btn.addEventListener('click', async () => {
                const confirmed = await showConfirmDialog('Are you sure you want to remove this member?');
                if (!confirmed) return;
                
                const memberId = btn.getAttribute('data-id');
                try {
                  await api.removeProjectMember(projectId, memberId);
                  // Refresh members list
                  this.initMembersTab(projectId, userRole);
                  showToast('Success', 'Member removed successfully');
                } catch (error) {
                  console.error('Remove member error:', error);
                }
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Get members error:', error);
    }
  }

  initReportsTab(projectId, summary) {
    const collectionChartCanvas = document.getElementById('collectionChart');
    const collectorChartCanvas = document.getElementById('collectorChart');
    const tripProgressContainer = document.getElementById('trip-progress-bars');
    
    // Add a detailed collector summary table to the reports section
    const detailedCollectorSummary = document.getElementById('detailed-collector-summary');
    if (detailedCollectorSummary) {
      if (summary.collectorSummary.length === 0) {
        detailedCollectorSummary.innerHTML = `<tr><td colspan="3" class="text-center">${i18n.t('reports.noCollectorData')}</td></tr>`;
      } else {
        detailedCollectorSummary.innerHTML = '';
        // Sort by amount collected (highest first)
        const sortedCollectors = [...summary.collectorSummary].sort((a, b) => b.total - a.total);
        let totalCollected = 0;
        
        sortedCollectors.forEach((collector, index) => {
          totalCollected += collector.total;
          const percentage = summary.totalCollected > 0 ? ((collector.total / summary.totalCollected) * 100).toFixed(1) : 0;
          
          detailedCollectorSummary.innerHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${collector.collectorName}</td>
              <td>${i18n.formatCurrency(collector.total)}</td>
              <td>${percentage}%</td>
            </tr>
          `;
        });
        
        // Add a total row
        detailedCollectorSummary.innerHTML += `
          <tr class="table-active">
            <td colspan="2"><strong>${i18n.t('common.total')}</strong></td>
            <td><strong>${i18n.formatCurrency(totalCollected)}</strong></td>
            <td>100%</td>
          </tr>
        `;
      }
    }
    
    if (collectionChartCanvas) {
      new Chart(collectionChartCanvas, {
        type: 'doughnut',
        data: {
          labels: [i18n.t('payments.paid'), i18n.t('payments.unpaid')],
          datasets: [{
            data: [summary.totalCollected, summary.totalRemainingAmount],
            backgroundColor: ['#198754', '#dc3545'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: 'Tajawal'
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += context.raw.toFixed(2);
                  return label;
                }
              }
            },
            // Add a center text plugin
            doughnutLabel: {
              labels: [
                {
                  text: i18n.t('reports.completion'),
                  font: {
                    size: '16',
                    family: 'Tajawal'
                  }
                },
                {
                  text: `${summary.percentComplete.toFixed(0)}%`,
                  font: {
                    size: '28',
                    family: 'Tajawal',
                    weight: 'bold'
                  }
                }
              ]
            }
          }
        }
      });
    }
    
    if (collectorChartCanvas && summary.collectorSummary.length > 0) {
      new Chart(collectorChartCanvas, {
        type: 'bar',
        data: {
          labels: summary.collectorSummary.map(c => c.collectorName),
          datasets: [{
            label: i18n.t('reports.totalCollected'),
            data: summary.collectorSummary.map(c => c.total),
            backgroundColor: '#0d6efd'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += i18n.formatCurrency(context.raw);
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return i18n.formatCurrency(value);
                }
              }
            }
          }
        }
      });
    } else if (collectorChartCanvas) {
      collectorChartCanvas.parentElement.innerHTML = `<p class="text-center mt-4">${i18n.t('reports.noCollectorData')}</p>`;
    }
    
    if (tripProgressContainer) {
      if (summary.trips.length === 0) {
        tripProgressContainer.innerHTML = `<p class="text-center">${i18n.t('trips.noTrips')}</p>`;
      } else {
        tripProgressContainer.innerHTML = '';
        summary.trips.forEach(trip => {
          tripProgressContainer.innerHTML += `
            <div class="mb-3">
              <div class="d-flex justify-content بين mb-1">
                <span>${trip.name}</span>
                <span>${trip.percentComplete.toFixed(0)}%</span>
              </div>
              <div class="progress">
                <div class="progress-bar ${this.getProgressBarClass(trip.percentComplete)}" role="progressbar" 
                     style="width: ${trip.percentComplete}%" aria-valuenow="${trip.percentComplete}" 
                     aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <div class="d-flex justify-content بين mt-1">
                <small>${i18n.t('trips.collected')}: ${i18n.formatCurrency(trip.collected)}</small>
                <small>${i18n.t('trips.expected')}: ${i18n.formatCurrency(trip.expected)}</small>
              </div>
            </div>
          `;
        });
      }
    }
  }

  handleRoleBasedAccess(userRole) {
    // Hide/show elements based on user role
    const createTripBtn = document.getElementById('create-trip-btn');
    const addMemberBtn = document.getElementById('add-member-btn');
    
    if (createTripBtn) {
      createTripBtn.style.display = ['owner', 'admin'].includes(userRole) ? 'block' : 'none';
    }
    
    if (addMemberBtn) {
      addMemberBtn.style.display = ['owner', 'admin'].includes(userRole) ? 'block' : 'none';
    }
  }

  addProjectEventListeners(projectId) {
    // Create trip button event listener
    const createTripBtn = document.getElementById('save-trip-btn');
    if (createTripBtn) {
      createTripBtn.addEventListener('click', async () => {
        if (createTripBtn.disabled) return;
        setButtonLoading(createTripBtn, i18n.t('common.loading'));
        const name = document.getElementById('tripName').value;
        const description = document.getElementById('tripDescription').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const totalCost = document.getElementById('totalCost').value;
        const expectedAmountPerPerson = document.getElementById('expectedAmountPerPerson').value;
        
        if (!name) {
          showToast('خطأ', 'اسم الرحلة مطلوب');
          createTripBtn.disabled = false;
          createTripBtn.innerHTML = originalText;
          return;
        }
        
        try {
          const response = await api.createTrip({
            name,
            description,
            startDate: startDate || null,
            endDate: endDate || null,
            totalCost: totalCost || 0,
            expectedAmountPerPerson: expectedAmountPerPerson || 0,
            projectId
          });
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('createTripModal'));
          modal.hide();
          
          // Navigate to trip
          this.navigate(`/trip/${response.data.trip.id}`);
        } catch (error) {
          console.error('Create trip error:', error);
        } finally {
          resetButtonLoading(createTripBtn);
        }
      });
    }
    
    // Add member button event listener
    const addMemberBtn = document.getElementById('save-member-btn');
    if (addMemberBtn) {
      addMemberBtn.addEventListener('click', async () => {
        if (addMemberBtn.disabled) return;
        setButtonLoading(addMemberBtn, i18n.t('common.loading'));
        const email = document.getElementById('memberEmail').value;
        const role = document.getElementById('memberRole').value;
        
        if (!email) {
          showToast('Error', 'Email is required');
          addMemberBtn.disabled = false;
          addMemberBtn.innerHTML = originalText;
          return;
        }
        
        try {
          await api.addProjectMember(projectId, { email, role });
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('addMemberModal'));
          modal.hide();
          
          // Refresh members list
          const userRoleResponse = await api.getProject(projectId);
          const userRole = userRoleResponse.data.userRole;
          
          this.initMembersTab(projectId, userRole);
          showToast('Success', 'Member added successfully');
        } catch (error) {
          console.error('Add member error:', error);
        } finally {
          resetButtonLoading(addMemberBtn);
        }
      });
    }
  }

  async renderTripDetails(params) {
    this.renderTemplate('trip-details-template');
    try {
      const tripId = params.id;
      console.log('Loading trip details for ID:', tripId);
      
      // Show loading indicator
      showLoading();
      
      // Load trip data and report in parallel for better performance
      const [tripResponse, reportResponse] = await Promise.all([
        api.getTrip(tripId),
        api.getTripReport(tripId).catch(err => {
          console.error('Failed to load trip report:', err);
          return { data: null }; // Return empty data on error
        })
      ]);
      
      console.log('Trip API response:', tripResponse);
      
      if (!tripResponse || !tripResponse.data || !tripResponse.data.trip) {
        console.error('Invalid trip response:', tripResponse);
        hideLoading();
        showToast('خطأ', 'بيانات الرحلة غير صالحة');
        return;
      }
      
      const trip = tripResponse.data.trip;
      const userRole = tripResponse.data.userRole;
      
      // Store the expectedAmountPerPerson in a data attribute on a hidden element
      const appContainer = document.getElementById('app');
      if (appContainer) {
        appContainer.dataset.expectedAmount = trip.expectedAmountPerPerson || '0';
      }
      
      // Update trip name and description
      const tripNameEl = document.getElementById('trip-name');
      const tripTitleEl = document.getElementById('trip-title');
      const tripDescriptionEl = document.getElementById('trip-description');
      
      if (tripNameEl) tripNameEl.textContent = trip.name;
      if (tripTitleEl) tripTitleEl.textContent = trip.name;
      if (tripDescriptionEl) tripDescriptionEl.textContent = trip.description || 'لا يوجد وصف';
      
      // Set up project link
      const projectLink = document.getElementById('project-link');
      if (projectLink) {
        projectLink.href = `/project/${trip.projectId}`;
        projectLink.textContent = 'العودة إلى المشروع';
      }
      
      // Initialize report data if available
      if (reportResponse && reportResponse.data) {
        const report = reportResponse.data;
        
        // Update report tab with enhanced data
        const tripTotalExpected = document.getElementById('trip-total-expected'); // ID in trip-report tab
        const tripTotalCollected = document.getElementById('trip-total-collected'); // ID in trip-report tab
        const tripTotalRemaining = document.getElementById('trip-total-remaining'); // ID in trip-report tab
        const tripCompletionPercent = document.getElementById('trip-completion-percent'); // ID in trip-report tab
        
        if (tripTotalExpected) tripTotalExpected.textContent = i18n.formatCurrency(report.totalExpected);
        if (tripTotalCollected) tripTotalCollected.textContent = i18n.formatCurrency(report.totalCollected);
        if (tripTotalRemaining) tripTotalRemaining.textContent = i18n.formatCurrency(report.totalRemainingAmount);
        if (tripCompletionPercent) tripCompletionPercent.textContent = `${report.percentComplete.toFixed(0)}%`;
        
        // This progress bar might be redundant if the cards are updated, but keep for now
        const tripProgressBar = document.getElementById('trip-collection-progress'); // This ID might be in a different section
        if (tripProgressBar) {
          const tripPercent = report.percentComplete.toFixed(0);
          tripProgressBar.style.width = `${tripPercent}%`;
          tripProgressBar.textContent = `${tripPercent}%`;
          tripProgressBar.classList.add(this.getProgressBarClass(report.percentComplete));
        }
        
        // Initialize enhanced payment chart and visualizations
        this.initEnhancedTripReports(report);
      }
      
      // Initialize participants and payments tabs in parallel
      await Promise.all([
        this.initParticipantsTab(tripId, userRole),
        this.initPaymentsTab(tripId, userRole)
      ]);
      
      // Hide loading indicator after all data is loaded
      hideLoading();
      
      // Add trip event listeners
      this.addTripEventListeners(tripId, trip.projectId);
      
      // Handle role-based access
      this.handleTripRoleBasedAccess(userRole);
    } catch (error) {
      hideLoading();
      console.error('Load trip error:', error);
      
      let errorMessage = 'فشل في تحميل بيانات الرحلة';
      if (error.response) {
        console.error('Error response:', error.response);
        errorMessage = `فشل في تحميل بيانات الرحلة: ${error.response.data?.message || 'خطأ في الخادم'}`;
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = 'خطأ في الشبكة - لا استجابة من الخادم';
      } else if (error.message) {
        errorMessage = `فشل في تحميل بيانات الرحلة: ${error.message}`;
      }
      
      showToast('خطأ', errorMessage);
    }
  }

  initEnhancedTripReports(report) {
    // Initialize all charts and report elements
    this.initPaymentChart(report);
    this.initCollectorChart(report);
    this.initPaymentTimeline(report);
    this.initParticipantSummary(report);
    this.initTripCollectorSummaryTable(report); // Add this call
  }

  initPaymentChart(report) {
    const tripPaymentChartCanvas = document.getElementById('tripPaymentChart');
    
    if (tripPaymentChartCanvas) {
      const collected = report.totalCollected;
      const remaining = report.totalRemainingAmount;
      
      // Destroy existing chart instance if it exists (Chart.js v3+)
      const existingChart = Chart.getChart(tripPaymentChartCanvas);
      if (existingChart) {
        existingChart.destroy();
      }
      
      window.tripPaymentChart = new Chart(tripPaymentChartCanvas, {
        type: 'doughnut',
        data: {
          labels: [i18n.t('payments.paid'), i18n.t('payments.unpaid')],
          datasets: [{
            data: [collected, remaining],
            backgroundColor: ['#198754', '#dc3545'],
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: {
                  family: 'Tajawal'
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += i18n.formatCurrency(context.raw);
                  return label;
                }
              }
            },
            // Add center text plugin to show completion percentage
            doughnutLabel: {
              labels: [
                {
                  text: i18n.t('reports.completion'),
                  font: {
                    size: '14',
                    family: 'Tajawal'
                  }
                },
                {
                  text: `${report.percentComplete.toFixed(0)}%`,
                  font: {
                    size: '24',
                    family: 'Tajawal',
                    weight: 'bold'
                  }
                }
              ]
            }
          }
        }
      });
    }
  }
  
  initCollectorChart(report) {
    // Add a collector distribution chart
    const collectorsChartCanvas = document.getElementById('tripCollectorsChart');
    if (collectorsChartCanvas && report.collectorSummary && report.collectorSummary.length > 0) {
      // Get existing chart instance for this canvas
      const existingChart = Chart.getChart(collectorsChartCanvas);
      // Destroy the existing chart if it exists
      if (existingChart) {
        existingChart.destroy();
      }
      
      // Sort collectors by amount collected (highest first)
      const sortedCollectors = [...report.collectorSummary].sort((a, b) => b.total - a.total);
      
      // Create the new chart instance directly
      new Chart(collectorsChartCanvas, {
        type: 'bar',
        data: {
          labels: sortedCollectors.map(c => c.collectorName),
          datasets: [{
            label: i18n.t('reports.totalCollected'),
            data: sortedCollectors.map(c => c.total),
            backgroundColor: [
              '#0d6efd', '#6f42c1', '#fd7e14', '#20c997', '#0dcaf0', 
              '#6610f2', '#d63384', '#dc3545', '#198754', '#ffc107'
            ],
            borderWidth: 0
          }]
        },
        options: {
          indexAxis: 'y', // Change back to 'y' for horizontal bars
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += i18n.formatCurrency(context.raw);
                  const percentage = report.totalCollected > 0 
                    ? ((context.raw / report.totalCollected) * 100).toFixed(1) + '%' 
                    : '0%';
                  return `${label} (${percentage})`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true
            },
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return i18n.formatCurrency(value);
                }
              }
            }
          }
        }
      });
    } else if (collectorsChartCanvas) {
      // Ensure existing chart is destroyed even if there's no new data
      const existingChart = Chart.getChart(collectorsChartCanvas);
      if (existingChart) {
        existingChart.destroy();
      }
      collectorsChartCanvas.parentElement.innerHTML = `
        <div class="alert alert-info text-center">
          <i class="bi bi-info-circle me-2"></i>
          ${i18n.t('reports.noCollectorData')}
        </div>
      `;
    }
  }
  
  initPaymentTimeline(report) {
    const timelineChartCanvas = document.getElementById('tripPaymentTimelineChart');
    if (timelineChartCanvas && report.payments && report.payments.length > 0) {
      // Clear any existing chart
      if (window.tripPaymentTimelineChart) {
        window.tripPaymentTimelineChart.destroy();
      }
      
      // Group payments by date and calculate cumulative sum
      const paymentsByDate = {};
      let cumulativeSum = 0;
      
      // Sort payments by date
      const sortedPayments = [...report.payments].sort((a, b) => 
        new Date(a.paymentDate) - new Date(b.paymentDate)
      );
      
      sortedPayments.forEach(payment => {
        const date = new Date(payment.paymentDate).toLocaleDateString();
        if (!paymentsByDate[date]) {
          paymentsByDate[date] = {
            total: 0,
            count: 0
          };
        }
        paymentsByDate[date].total += Number(payment.amount);
        paymentsByDate[date].count += 1;
      });
      
      const dates = Object.keys(paymentsByDate);
      const dailyAmounts = dates.map(date => paymentsByDate[date].total);
      const cumulativeAmounts = [];
      
      dailyAmounts.forEach(amount => {
        cumulativeSum += amount;
        cumulativeAmounts.push(cumulativeSum);
      });
      
      window.tripPaymentTimelineChart = new Chart(timelineChartCanvas, {
        type: 'line',
        data: {
          labels: dates,
          datasets: [
            {
              label: i18n.t('reports.dailyCollection'),
              data: dailyAmounts,
              backgroundColor: 'rgba(13, 110, 253, 0.5)',
              borderColor: '#0d6efd',
              borderWidth: 2,
              type: 'bar'
            },
            {
              label: i18n.t('reports.cumulativeCollection'),
              data: cumulativeAmounts,
              backgroundColor: 'rgba(25, 135, 84, 0.1)',
              borderColor: '#198754',
              borderWidth: 2,
              type: 'line',
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false,
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  label += i18n.formatCurrency(context.raw);
                  return label;
                }
              }
            }
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: i18n.t('reports.dailyAmount')
              },
              ticks: {
                callback: function(value) {
                  return i18n.formatCurrency(value);
                }
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              title: {
                display: true,
                text: i18n.t('reports.cumulativeAmount')
              },
              grid: {
                drawOnChartArea: false
              },
              ticks: {
                callback: function(value) {
                  return i18n.formatCurrency(value);
                }
              }
            }
          }
        }
      });
    } else if (timelineChartCanvas) {
      timelineChartCanvas.parentElement.innerHTML = `
        <div class="alert alert-info text-center">
          <i class="bi bi-info-circle me-2"></i>
          ${i18n.t('reports.noPaymentData')}
        </div>
      `;
    }
  }
  
  initParticipantSummary(report) {
    const participantSummaryContainer = document.getElementById('trip-participant-summary');
    if (participantSummaryContainer && report.participants && report.participants.length > 0) {
      participantSummaryContainer.innerHTML = '';
      
      // Sort participants by completion percentage (highest first)
      const sortedParticipants = [...report.participants].sort((a, b) => 
        (b.paidAmount / (b.expectedAmount || 1)) - (a.paidAmount / (a.expectedAmount || 1))
      );
      
      sortedParticipants.forEach((participant, idx) => {
        const expectedAmount = Number(participant.expectedAmount);
        const paidAmount = Number(participant.paidAmount);
        const remainingAmount = expectedAmount - paidAmount;
        const progress = expectedAmount > 0 ? (paidAmount / expectedAmount) * 100 : 0;
        
        participantSummaryContainer.innerHTML += `
          <tr>
            <td>${idx + 1}</td>
            <td>${participant.name}</td>
            <td>${i18n.formatCurrency(expectedAmount)}</td>
            <td>${i18n.formatCurrency(paidAmount)}</td>
            <td class="${remainingAmount <= 0 ? 'text-success' : 'text-danger'}">${i18n.formatCurrency(remainingAmount)}</td>
            <td>
              <div class="progress">
                <div class="progress-bar ${this.getProgressBarClass(progress)}" 
                     role="progressbar" 
                     style="width: ${progress.toFixed(0)}%" 
                     aria-valuenow="${progress.toFixed(0)}" 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                  ${progress.toFixed(0)}%
                </div>
              </div>
            </td>
          </tr>
        `;
      });
      
      // Add a total row
      const totalExpected = sortedParticipants.reduce((sum, p) => sum + Number(p.expectedAmount), 0);
      const totalPaid = sortedParticipants.reduce((sum, p) => sum + Number(p.paidAmount), 0);
      const totalRemaining = totalExpected - totalPaid;
      const totalProgress = totalExpected > 0 ? (totalPaid / totalExpected) * 100 : 0;
      
      participantSummaryContainer.innerHTML += `
        <tr class="table-active">
          <td><strong>${i18n.t('common.total')}</strong></td>
          <td><strong>${i18n.formatCurrency(totalExpected)}</strong></td>
          <td><strong>${i18n.formatCurrency(totalPaid)}</strong></td>
          <td class="${totalRemaining <= 0 ? 'text-success' : 'text-danger'}">
            <strong>${i18n.formatCurrency(totalRemaining)}</strong>
          </td>
          <td>
            <div class="progress">
              <div class="progress-bar ${this.getProgressBarClass(totalProgress)}" 
                   role="progressbar" 
                   style="width: ${totalProgress.toFixed(0)}%" 
                   aria-valuenow="${totalProgress.toFixed(0)}" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
                ${totalProgress.toFixed(0)}%
              </div>
            </div>
          </td>
        </tr>
      `;
    } else if (participantSummaryContainer) {
      participantSummaryContainer.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">${i18n.t('participants.noParticipants')}</td>
        </tr>
      `;
    }
  }

  // New function to populate the detailed collector summary table in the trip report
  initTripCollectorSummaryTable(report) {
    const detailedCollectorSummaryContainer = document.getElementById('trip-collector-summary'); // Use the correct ID from the HTML template
    if (detailedCollectorSummaryContainer) {
      if (!report.collectorSummary || report.collectorSummary.length === 0) {
        detailedCollectorSummaryContainer.innerHTML = `<tr><td colspan="4" class="text-center">${i18n.t('reports.noCollectorData')}</td></tr>`;
      } else {
        detailedCollectorSummaryContainer.innerHTML = '';
        // Sort by amount collected (highest first)
        const sortedCollectors = [...report.collectorSummary].sort((a, b) => b.total - a.total);
        let totalCollected = 0;
        
        sortedCollectors.forEach((collector, index) => {
          totalCollected += collector.total;
          const percentage = report.totalCollected > 0 ? ((collector.total / report.totalCollected) * 100).toFixed(1) : 0;
          
          detailedCollectorSummaryContainer.innerHTML += `
            <tr>
              <td>${index + 1}</td>
              <td>${collector.collectorName}</td>
              <td>${i18n.formatCurrency(collector.total)}</td>
              <td>${percentage}%</td>
            </tr>
          `;
        });
        
        // Add a total row
        detailedCollectorSummaryContainer.innerHTML += `
          <tr class="table-active">
            <td colspan="2"><strong>${i18n.t('common.total')}</strong></td>
            <td><strong>${i18n.formatCurrency(totalCollected)}</strong></td>
            <td>${report.totalCollected > 0 ? '100%' : '0%'}</td>
          </tr>
        `;
      }
    } else {
      console.warn("Element with ID 'trip-collector-summary' not found for trip report."); // Updated warning message
    }
  }

  async initParticipantsTab(tripId, userRole) {
    try {
      const response = await api.getTripParticipants(tripId);
      // Store the full data and userRole with each participant for context
      this.fullParticipantsData = response.data.participants.map(p => ({ ...p, tripId, userRole }));

      // Initial render
      this.renderParticipantsTable(this.fullParticipantsData);

      // Add Search Event Listener
      const searchInput = document.getElementById('participant-search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.participantSearchTerm = e.target.value;
          this.renderParticipantsTable(this.fullParticipantsData); // Re-render with search term
        });
        // Set initial value if needed (e.g., from previous state)
        searchInput.value = this.participantSearchTerm;
      }

      // Add Sorting Event Listeners
      document.querySelectorAll('#participants th[data-sortable]').forEach(th => {
        th.style.cursor = 'pointer'; // Indicate clickable
        th.addEventListener('click', () => {
          const column = th.getAttribute('data-sortable');
          if (this.participantSortColumn === column) {
            // Toggle direction
            this.participantSortDirection = this.participantSortDirection === 'asc' ? 'desc' : 'asc';
          } else {
            // Sort by new column
            this.participantSortColumn = column;
            this.participantSortDirection = 'asc';
          }
          this.renderParticipantsTable(this.fullParticipantsData); // Re-render with new sort
        });
      });

    } catch (error) {
      console.error('Get participants error:', error);
      const participantsListContainer = document.getElementById('participants-list');
      if (participantsListContainer) {
        participantsListContainer.innerHTML = `<tr><td colspan="8" class="text-center text-danger">${i18n.t('errors.dataLoadError')}</td></tr>`;
      }
    }
  }

  // Helper function to render the participants table
  renderParticipantsTable(participantsData) {
    const participantsListContainer = document.getElementById('participants-list');
    if (!participantsListContainer) return;

    let filteredData = [...participantsData];

    // Apply search filter
    if (this.participantSearchTerm) {
      const searchTermLower = this.participantSearchTerm.toLowerCase();
      filteredData = filteredData.filter(p =>
        p.name.toLowerCase().includes(searchTermLower) ||
        (p.email && p.email.toLowerCase().includes(searchTermLower)) ||
        (p.phone && p.phone.includes(searchTermLower))
      );
    }

    // Apply sorting
    if (this.participantSortColumn) {
      filteredData.sort((a, b) => {
        let valA = a[this.participantSortColumn];
        let valB = b[this.participantSortColumn];

        // Handle specific column types for sorting
        if (this.participantSortColumn === 'expectedAmount' || this.participantSortColumn === 'totalPaid' || this.participantSortColumn === 'balance' || this.participantSortColumn === 'progress') {
          valA = Number(valA) || 0;
          valB = Number(valB) || 0;
        } else if (this.participantSortColumn === 'contact') {
          valA = a.email || a.phone || '';
          valB = b.email || b.phone || '';
        } else {
          // Default to string comparison
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }

        if (valA < valB) return this.participantSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.participantSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Render table rows
    if (filteredData.length === 0) {
      participantsListContainer.innerHTML = `
        <tr>
          <td colspan="10" class="text-center">${this.participantSearchTerm ? i18n.t('common.noResults') : i18n.t('participants.noParticipants')}</td>
        </tr>
      `;
    } else {
      participantsListContainer.innerHTML = '';
      filteredData.forEach((participant, idx) => {
        const expectedAmount = Number(participant.expectedAmount);
        const paidAmount = Number(participant.totalPaid);
        const balance = Number(participant.balance);
        const progress = expectedAmount > 0 ? Math.round((paidAmount / expectedAmount) * 100) : 0;
        participant.progress = progress; // Add progress to participant object for sorting

        participantsListContainer.innerHTML += `
          <tr>
            <td>${idx + 1}</td>
            <td>${participant.name}</td>
            <td>${participant.email || participant.phone || 'غير متوفر'}</td>
            <td>${i18n.formatCurrency(expectedAmount)}</td>
            <td>${i18n.formatCurrency(paidAmount)}</td>
            <td class="${balance <= 0 ? 'text-success' : 'text-danger'}">${i18n.formatCurrency(balance)}</td>
            <td>
              <div class="progress">
                <div class="progress-bar ${this.getProgressBarClass(progress)}" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${progress}%</div>
              </div>
            </td>
            <td>${participant.createdByUser ? participant.createdByUser.name : '-'}</td>
            <td>${participant.updatedByUser ? participant.updatedByUser.name : '-'}</td>
            <td>
              <div class="btn-group btn-group-sm">
                <button class="btn btn-primary btn-view-participant" data-id="${participant.id}">${i18n.t('common.view')}</button>
                <button class="btn btn-success btn-add-payment" data-id="${participant.id}" data-name="${participant.name}">${i18n.t('payments.add')}</button>
                ${participant.userRole !== 'collector' ? `
                  <button class="btn btn-outline-secondary btn-edit-participant" data-id="${participant.id}">${i18n.t('common.edit')}</button>
                  <button class="btn btn-outline-danger btn-delete-participant" data-id="${participant.id}">${i18n.t('common.delete')}</button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      });
    }

    // Re-attach event listeners for buttons inside the rendered table
    this.attachParticipantButtonListeners(participantsListContainer, filteredData[0]?.tripId, filteredData[0]?.userRole); // Pass necessary context if needed

    // Update sort icons in headers
    // Scope the query to the specific table to avoid conflicts
    const tableHeader = participantsListContainer?.closest('table')?.querySelector('thead');
    if (tableHeader) {
      tableHeader.querySelectorAll('th[data-sortable]').forEach(th => {
        const icon = th.querySelector('.sort-icon');
        // Add null check for icon
        if (icon) {
          if (th.getAttribute('data-sortable') === this.participantSortColumn) {
            icon.innerHTML = this.participantSortDirection === 'asc' ? ' <i class="bi bi-sort-up"></i>' : ' <i class="bi bi-sort-down"></i>';
          } else {
            icon.innerHTML = ' <i class="bi bi-filter"></i>'; // Default icon
          }
        } else {
          console.warn('Sort icon span not found in header:', th);
        }
      });
    } else {
      console.warn('Could not find table header to update sort icons.');
    }
  }

  // Function to attach event listeners (extracted for reusability after re-render)
  attachParticipantButtonListeners(container, tripId, userRole) {
    // View Participant Button
    container.querySelectorAll('.btn-view-participant').forEach(btn => {
      // Remove existing listener to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', async () => {
        const participantId = newBtn.getAttribute('data-id');
        try {
          // Show loading state on button
          newBtn.disabled = true;
          newBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
          
          const response = await api.getParticipant(participantId);
          const participant = response.data.participant;
          
          // Reset button state
          newBtn.disabled = false;
          newBtn.innerHTML = i18n.t('common.view');
          
          // ...existing code...
          document.getElementById('view-participant-name').textContent = participant.name;
          document.getElementById('view-participant-email').textContent = participant.email || 'N/A';
          document.getElementById('view-participant-phone').textContent = participant.phone || 'N/A';
          document.getElementById('view-participant-expected').textContent = i18n.formatCurrency(participant.expectedAmount);
          document.getElementById('view-participant-paid').textContent = i18n.formatCurrency(participant.totalPaid);
          document.getElementById('view-participant-balance').textContent = i18n.formatCurrency(participant.balance);

          const progress = participant.expectedAmount > 0 ? Math.round((participant.totalPaid / participant.expectedAmount) * 100) : 0;
          const progressBar = document.getElementById('view-participant-progress');
          progressBar.style.width = `${progress}%`;
          progressBar.textContent = `${progress}%`;
          progressBar.className = `progress-bar ${this.getProgressBarClass(progress)}`;

          const paymentHistoryContainer = document.getElementById('participant-payments');
          if (!participant.payments || participant.payments.length === 0) {
            paymentHistoryContainer.innerHTML = `<tr><td colspan="5" class="text-center">${i18n.t('participants.noPaymentHistory')}</td></tr>`;
          } else {
            paymentHistoryContainer.innerHTML = '';
            participant.payments.forEach((payment) => {
              paymentHistoryContainer.innerHTML += `
                <tr>
                  <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                  <td>${i18n.formatCurrency(payment.amount)}</td>
                  <td>${payment.collector.name}</td>
                  <td>${payment.notes || '-'}</td>
                </tr>
              `;
            });
          }

          const createdByEl = document.getElementById('view-participant-createdby');
          if (createdByEl) {
            createdByEl.textContent = participant.createdByUser ? participant.createdByUser.name : '-';
          }
          const updatedByEl = document.getElementById('view-participant-updatedby');
          if (updatedByEl) {
            updatedByEl.textContent = participant.updatedByUser ? participant.updatedByUser.name : '-';
          }

          const modal = new bootstrap.Modal(document.getElementById('viewParticipantModal'));
          modal.show();
        } catch (error) {
          console.error('Get participant error:', error);
          showToast('خطأ', 'فشل في تحميل تفاصيل المشارك');
          
          // Reset button state on error
          newBtn.disabled = false;
          newBtn.innerHTML = i18n.t('common.view');
        }
      });
    });

    // Add Payment Button
    container.querySelectorAll('.btn-add-payment').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        const participantId = newBtn.getAttribute('data-id');
        const participantName = newBtn.getAttribute('data-name');
        // ...existing code...
        const participantSelect = document.getElementById('paymentParticipant');
        const option = document.createElement('option');
        option.value = participantId;
        option.textContent = participantName;
        option.selected = true;

        participantSelect.innerHTML = ''; // Clear previous options if any
        participantSelect.appendChild(option);

        const today = new Date().toISOString().split('T')[0];
        document.getElementById('paymentDate').value = today;
        document.getElementById('paymentAmount').value = ''; // Clear amount
        document.getElementById('paymentNotes').value = ''; // Clear notes

        const modal = new bootstrap.Modal(document.getElementById('addPaymentModal'));
        modal.show();
      });
    });

    // Edit Participant Button
    container.querySelectorAll('.btn-edit-participant').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', async () => {
        const participantId = newBtn.getAttribute('data-id');
        
        // Show loading state on button
        newBtn.disabled = true;
        newBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
        
        try {
          const response = await api.getParticipant(participantId);
          const participant = response.data.participant;
          
          // Reset button state
          newBtn.disabled = false;
          newBtn.innerHTML = i18n.t('common.edit');

          let editModalEl = document.getElementById('editParticipantModal');
          // ...existing code...
          if (!editModalEl) {
            // Create modal if it doesn't exist (simplified)
            editModalEl = document.createElement('div');
            // ... add modal structure ...
            document.body.appendChild(editModalEl);
          }

          document.getElementById('editParticipantName').value = participant.name || '';
          document.getElementById('editParticipantEmail').value = participant.email || '';
          document.getElementById('editParticipantPhone').value = participant.phone || '';
          document.getElementById('editExpectedAmount').value = participant.expectedAmount || '';

          const editModal = new bootstrap.Modal(editModalEl);
          editModal.show();

          const saveBtn = document.getElementById('save-edit-participant-btn');
          // Ensure only one click listener
          const newSaveBtn = saveBtn.cloneNode(true);
          saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
          newSaveBtn.onclick = async () => { 
            if (newSaveBtn.disabled) return;
            setButtonLoading(newSaveBtn, i18n.t('common.loading'));
            const name = document.getElementById('editParticipantName').value;
            const email = document.getElementById('editParticipantEmail').value;
            const phone = document.getElementById('editParticipantPhone').value;
            const expectedAmount = document.getElementById('editExpectedAmount').value;

            if (!name || !expectedAmount) {
              showToast('خطأ', 'الاسم والمبلغ المتوقع مطلوبان');
              
              // Reset button state
              newSaveBtn.disabled = false;
              newSaveBtn.innerHTML = i18n.t('common.save');
              return;
            }

            try {
              const userId = auth.getUser()?.id;
              await api.updateParticipant(participantId, { 
                name, 
                email: email || null, 
                phone: phone || null, 
                expectedAmount: parseFloat(expectedAmount),
                updatedBy: userId
              });
              editModal.hide();
              
              // Store current tripId before refresh
              const currentTripId = participant.tripId;
              const currentUserRole = participant.userRole || userRole;
              
              this.initParticipantsTab(currentTripId, currentUserRole); // Refresh
              showToast('نجاح', 'تم تحديث المشارك');
            } catch (error) {
              console.error('Update participant error:', error);
              showToast('خطأ', 'فشل تحديث المشارك');
              
              // Reset button state on error
              newSaveBtn.disabled = false;
              newSaveBtn.innerHTML = i18n.t('common.save');
            } finally {
              resetButtonLoading(newSaveBtn);
            }
          };
        } catch (error) {
          console.error('Get participant error for edit:', error);
          showToast('خطأ', 'فشل تحميل بيانات المشارك للتعديل');
          
          // Reset button state on error
          newBtn.disabled = false;
          newBtn.innerHTML = i18n.t('common.edit');
        }
      });
    });

    // Delete Participant Button - FIX ERROR WHEN DELETING
    container.querySelectorAll('.btn-delete-participant').forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmDialog(i18n.t('participants.confirmDelete'));
        if (!confirmed) return;
        
        // Save needed data before deletion
        const participantId = newBtn.getAttribute('data-id');
        let savedTripId = tripId; // Use the passed tripId as fallback
        
        try {
          // First, get participant data to store tripId securely
          const participantData = this.fullParticipantsData.find(p => p.id === participantId);
          
          if (participantData && participantData.tripId) {
            savedTripId = participantData.tripId;
          }
          
          // Show loading state on button
          newBtn.disabled = true;
          newBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';
          
          // Then delete the participant
          await api.deleteParticipant(participantId);
          
          // Only refresh if we have the tripId
          if (savedTripId) {
            await this.initParticipantsTab(savedTripId, userRole);
            
            // Also refresh trip report data since participant count changed
            try {
              const reportResponse = await api.getTripReport(savedTripId);
              if (reportResponse && reportResponse.data) {
                this.initEnhancedTripReports(reportResponse.data);
              }
            } catch (reportError) {
              console.error("Couldn't refresh trip reports after deletion:", reportError);
              // Non-critical error, don't show toast
            }
            
            showToast('نجاح', 'تم حذف المشارك');
          } else {
            console.error("Couldn't determine trip ID for refresh after deletion");
            showToast('نجاح', 'تم حذف المشارك، يرجى تحديث الصفحة');
            // Fallback to navigate to refresh the whole page
            this.navigate(window.location.pathname);
          }
        } catch (error) {
          console.error('Delete participant error:', error);
          showToast('خطأ', 'فشل حذف المشارك');
          
          // Reset button state on error
          newBtn.disabled = false;
          newBtn.innerHTML = i18n.t('common.delete');
        }
      });
    });
  }

  async initPaymentsTab(tripId, userRole) {
    try {
      // Show loading indicator
      const paymentsListContainer = document.getElementById('payments-list');
      if (paymentsListContainer) {
        paymentsListContainer.innerHTML = `
          <tr>
            <td colspan="7" class="text-center">
              <div class="spinner-border spinner-border-sm text-primary" role="status"></div>
              Loading payments...
            </td>
          </tr>
        `;
      }
      
      // Hide CRUD controls initially
      const paymentCrudControls = document.querySelectorAll('.payment-crud-control');
      paymentCrudControls.forEach(control => {
        control.style.display = 'none';
      });

      const response = await api.getTripPayments(tripId);
      const payments = response.data.payments;
      
      // Show CRUD controls now that we have data
      paymentCrudControls.forEach(control => {
        control.style.display = '';
      });
      
      if (paymentsListContainer) {
        if (payments.length === 0) {
          paymentsListContainer.innerHTML = `
            <tr>
              <td colspan="7" class="text-center">No payments yet</td>
            </tr>
          `;
        } else {
          paymentsListContainer.innerHTML = '';
          payments.forEach((payment, idx) => {
            paymentsListContainer.innerHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
                <td>${payment.participant.name}</td>
                <td>${i18n.formatCurrency(Number(payment.amount))}</td>
                <td>${payment.collector.name}</td>
                <td>${payment.notes || '-'}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    ${payment.collector.id === auth.getUser().id || ['owner', 'admin'].includes(userRole) ? `
                      <button class="btn btn-outline-secondary btn-edit-payment" data-id="${payment.id}">${i18n.t('common.edit')}</button>
                      <button class="btn btn-outline-danger btn-delete-payment" data-id="${payment.id}">${i18n.t('common.delete')}</button>
                    ` : ''}
                  </div>
                </td>
              </tr>
            `;
          });
          
          // Add event listeners - FIX PAYMENT DELETION ERROR
          document.querySelectorAll('.btn-edit-payment').forEach(btn => {
            btn.addEventListener('click', async () => {
              const paymentId = btn.getAttribute('data-id');
              // TODO: Implement edit payment
              showToast('Info', 'Edit payment functionality coming soon');
            });
          });
          
          document.querySelectorAll('.btn-delete-payment').forEach(btn => {
            btn.addEventListener('click', async () => {
              const confirmed = await showConfirmDialog(i18n.t('payments.confirmDelete') || 'Are you sure you want to delete this payment?');
              if (!confirmed) return;
              
              const paymentId = btn.getAttribute('data-id');
              
              // Store current tripId for refresh
              const savedTripId = tripId;
              const savedUserRole = userRole;
              
              try {
                // Show loading state on button
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Deleting...';
                
                // Delete the payment
                await api.deletePayment(paymentId);
                
                // Refresh payment list
                await this.initPaymentsTab(savedTripId, savedUserRole);
                
                // Also refresh participants tab as balances have changed
                await this.initParticipantsTab(savedTripId, savedUserRole);
                
                // Also refresh trip report data since payment was deleted
                try {
                  const reportResponse = await api.getTripReport(savedTripId);
                  if (reportResponse && reportResponse.data) {
                    this.initEnhancedTripReports(reportResponse.data);
                  }
                } catch (reportError) {
                  console.error("Couldn't refresh trip reports after payment deletion:", reportError);
                  // Non-critical error, don't show toast
                }
                
                showToast('Success', 'Payment deleted successfully');
              } catch (error) {
                console.error('Delete payment error:', error);
                showToast('Error', 'Failed to delete payment');
                
                // Reset button state on error
                btn.disabled = false;
                btn.innerHTML = i18n.t('common.delete');
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Get payments error:', error);
      
      const paymentsListContainer = document.getElementById('payments-list');
      if (paymentsListContainer) {
        paymentsListContainer.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-danger">
              <i class="bi bi-exclamation-triangle"></i> 
              Failed to load payments data
            </td>
          </tr>
        `;
      }
    }
  }

  addTripEventListeners(tripId, projectId) {
    // Save participant button
    const saveParticipantBtn = document.getElementById('save-participant-btn');
    if (saveParticipantBtn) {
      saveParticipantBtn.addEventListener('click', async () => {
        if (saveParticipantBtn.disabled) return;
        setButtonLoading(saveParticipantBtn, i18n.t('common.loading'));
        const name = document.getElementById('participantName').value;
        const email = document.getElementById('participantEmail').value;
        const phone = document.getElementById('participantPhone').value;
        const expectedAmount = document.getElementById('expectedAmount').value;
        
        if (!name) {
          showToast('خطأ', 'اسم المشارك مطلوب');
          saveParticipantBtn.disabled = false;
          saveParticipantBtn.innerHTML = originalText;
          return;
        }
        
        if (!expectedAmount) {
          showToast('خطأ', 'المبلغ المتوقع مطلوب');
          saveParticipantBtn.disabled = false;
          saveParticipantBtn.innerHTML = originalText;
          return;
        }
        
        try {
          // Add createdBy/updatedBy if needed (optional, backend can get from token)
          const userId = auth.getUser()?.id;
          const response = await api.createParticipant({
            name,
            email: email || null,
            phone: phone || null,
            expectedAmount: parseFloat(expectedAmount), // Make sure expectedAmount is a number
            tripId,
            createdBy: userId,
            updatedBy: userId
          });
          
          console.log('Participant created successfully:', response);
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('addParticipantModal'));
          if (modal) {
            modal.hide();
          } else {
            console.error('Failed to get modal instance');
            // Try to close modal directly as fallback
            document.getElementById('addParticipantModal').classList.remove('show');
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
          }
          
          // Get user role and refresh participants list
          const tripResponse = await api.getTrip(tripId);
          const userRole = tripResponse.data.userRole;
          
          this.initParticipantsTab(tripId, userRole);
          
          showToast('نجاح', 'تمت إضافة المشارك بنجاح');
        } catch (error) {
          console.error('Create participant error:', error);
          let errorMessage = 'حدث خطأ أثناء إضافة المشارك';
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          showToast('خطأ', errorMessage);
        } finally {
          resetButtonLoading(saveParticipantBtn);
        }
      });
    }

    // Add payment button should populate participant dropdown
    const addPaymentBtn = document.getElementById('add-payment-btn');
    if (addPaymentBtn) {
      addPaymentBtn.addEventListener('click', async () => {
        try {
          // Get all participants for the trip
          const response = await api.getTripParticipants(tripId);
          const participants = response.data.participants;
          
          const participantSelect = document.getElementById('paymentParticipant');
          participantSelect.innerHTML = '<option value="" selected disabled>Select participant</option>';
          
          participants.forEach(participant => {
            const option = document.createElement('option');
            option.value = participant.id;
            option.textContent = participant.name;
            participantSelect.appendChild(option);
          });
          
          // Set today's date as default
          const today = new Date().toISOString().split('T')[0];
          document.getElementById('paymentDate').value = today;
        } catch (error) {
          console.error('Get participants error:', error);
        }
      });
    }
    
    // Add participant modal event listeners
    const addParticipantBtn = document.getElementById('add-participant-btn');
    if (addParticipantBtn) {
      addParticipantBtn.addEventListener('click', () => {
        // Pre-fill the expected amount with the trip's default
        const appContainer = document.getElementById('app');
        const defaultExpectedAmount = appContainer ? appContainer.dataset.expectedAmount : '0';
        
        const expectedAmountField = document.getElementById('expectedAmount');
        if (expectedAmountField) {
          expectedAmountField.value = defaultExpectedAmount;
        }
      });
    }

    // Save payment button
    const savePaymentBtn = document.getElementById('save-payment-btn');
    if (savePaymentBtn) {
      savePaymentBtn.addEventListener('click', async () => {
        if (savePaymentBtn.disabled) return;
        setButtonLoading(savePaymentBtn, i18n.t('common.loading'));
        const participantId = document.getElementById('paymentParticipant').value;
        const amount = document.getElementById('paymentAmount').value;
        const paymentDate = document.getElementById('paymentDate').value;
        const notes = document.getElementById('paymentNotes').value;
        
        if (!participantId) {
          showToast('Error', 'Participant is required');
          savePaymentBtn.disabled = false;
          savePaymentBtn.innerHTML = originalText;
          return;
        }
        
        if (!amount) {
          showToast('Error', 'Amount is required');
          savePaymentBtn.disabled = false;
          savePaymentBtn.innerHTML = originalText;
          return;
        }
        
        if (!paymentDate) {
          showToast('Error', 'Payment date is required');
          savePaymentBtn.disabled = false;
          savePaymentBtn.innerHTML = originalText;
          return;
        }
        
        try {
          await api.createPayment({
            participantId,
            amount,
            paymentDate,
            notes: notes || null
          });
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('addPaymentModal'));
          modal.hide();
          
          // Get user role
          const tripResponse = await api.getTrip(tripId);
          const userRole = tripResponse.data.userRole;
          
          // Refresh tabs
          this.initParticipantsTab(tripId, userRole);
          this.initPaymentsTab(tripId, userRole);
          
          // Refresh the trip details page to update reports
          this.navigate(`/trip/${tripId}`);
          
          showToast('Success', 'Payment recorded successfully');
        } catch (error) {
          console.error('Create payment error:', error);
        } finally {
          resetButtonLoading(savePaymentBtn);
        }
      });
    }
  }

  handleTripRoleBasedAccess(userRole) {
    // Hide/show elements based on user role
    const addParticipantBtn = document.getElementById('add-participant-btn');
    
    if (addParticipantBtn) {
      addParticipantBtn.style.display = ['owner', 'admin', 'collector'].includes(userRole) ? 'block' : 'none';
    }
  }

  renderNotFoundPage() {
    this.clearApp();
    this.app.innerHTML = `
      <div class="text-center mt-5">
        <h1 class="display-1">404</h1>
        <h2>${i18n.t('errors.pageNotFound')}</h2>
        <p class="lead">${i18n.t('errors.pageNotFoundDesc')}</p>
        <a href="/" class="btn btn-primary">${i18n.t('errors.goHome')}</a>
      </div>
    `;
  }

  renderAboutPage() {
    this.clearApp();
    this.renderTemplate('about-template');
  }

  renderContactPage() {
    this.clearApp();
    this.renderTemplate('contact-template');
    const form = document.getElementById('contact-form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (
          !form.contactName.value.trim() ||
          !form.contactEmail.value.trim() ||
          !form.contactMessage.value.trim()
        ) {
          alert('يرجى تعبئة جميع الحقول.');
          return;
        }
        form.reset();
        document.getElementById('contact-success').classList.remove('d-none');
      });
    }
  }

  renderPrivacyPage() {
    this.clearApp();
    this.renderTemplate('privacy-template');
  }

  renderAdminDashboard() {
    console.log('Rendering admin dashboard');
    this.renderTemplate('admin-dashboard-template');
    
    // Check if the current user is a system admin
    if (!auth.isAuthenticated() || !auth.getUser().isSystemAdmin) {
      showToast('خطأ', 'لا تملك صلاحيات للوصول إلى لوحة تحكم المسؤول');
      this.navigate('/projects');
      return;
    }
    
    // Load admin data
    this.loadAdminDashboardData();
  }

  async loadAdminDashboardData() {
    try {
      showLoading();
      
      // Load data from backend
      const statsResponse = await api.getAdminStats();
      const stats = statsResponse.data.stats;
      const recentActivity = statsResponse.data.recentActivity;
      
      // Update stats cards
      document.getElementById('admin-user-count').textContent = stats.userCount;
      document.getElementById('admin-project-count').textContent = stats.projectCount;
      document.getElementById('admin-trip-count').textContent = stats.tripCount;
      document.getElementById('admin-participant-count').textContent = stats.participantCount;
      document.getElementById('admin-total-collected').textContent = i18n.formatCurrency(stats.totalCollected);
      
      // Create overview chart
      this.createAdminOverviewChart([stats.userCount, stats.projectCount, stats.tripCount, stats.participantCount]);
      
      // Initialize tabs
      await Promise.all([
        this.loadAdminProjects(),
        this.loadAdminUsers(),
        this.loadAdminRecentActivity(recentActivity)
      ]);
      
      hideLoading();
    } catch (error) {
      hideLoading();
      console.error('Load admin dashboard error:', error);
      showToast('خطأ', 'فشل في تحميل بيانات لوحة التحكم');
    }
  }
  
  createAdminOverviewChart(data) {
    const chartCanvas = document.getElementById('admin-overview-chart');
    if (chartCanvas) {
      const chartData = {
        labels: ['المستخدمين', 'المشاريع', 'الرحلات', 'المشاركين'],
        datasets: [{
          label: 'إحصائيات النظام',
          data: data,
          backgroundColor: [
            'rgba(13, 110, 253, 0.6)', // bootstrap primary
            'rgba(25, 135, 84, 0.6)',  // bootstrap success
            'rgba(13, 202, 240, 0.6)', // bootstrap info
            'rgba(255, 193, 7, 0.6)'   // bootstrap warning
          ],
          borderColor: [
            'rgba(13, 110, 253, 1)',
            'rgba(25, 135, 84, 1)',
            'rgba(13, 202, 240, 1)',
            'rgba(255, 193, 7, 1)'
          ],
          borderWidth: 1
        }]
      };
      
      new Chart(chartCanvas, {
        type: 'bar',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
  }
  
  async loadAdminProjects() {
    try {
      const response = await api.getAdminProjects();
      const projects = response.data.projects;
      
      const projectsContainer = document.getElementById('admin-projects-list');
      if (projectsContainer) {
        if (projects.length === 0) {
          projectsContainer.innerHTML = '<tr><td colspan="7" class="text-center">لا توجد مشاريع</td></tr>';
        } else {
          projectsContainer.innerHTML = '';
          projects.forEach((project, idx) => {
            const createdAt = new Date(project.createdAt).toLocaleDateString();
            projectsContainer.innerHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td>${project.name}</td>
                <td>${project.owner ? project.owner.name : 'غير معروف'}</td>
                <td>${createdAt}</td>
                <td>${project.memberCount || 0}</td>
                <td>${project.tripCount || 0}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    <a href="/project/${project.id}" class="btn btn-primary">عرض</a>
                  </div>
                </td>
              </tr>
            `;
          });
        }
      }
    } catch (error) {
      console.error('Load admin projects error:', error);
      const projectsContainer = document.getElementById('admin-projects-list');
      if (projectsContainer) {
        projectsContainer.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل في تحميل بيانات المشاريع</td></tr>';
      }
    }
  }
  
  async loadAdminUsers() {
    try {
      const response = await api.getAdminUsers();
      const users = response.data.users;
      
      const usersContainer = document.getElementById('admin-users-list');
      if (usersContainer) {
        if (users.length === 0) {
          usersContainer.innerHTML = '<tr><td colspan="7" class="text-center">لا يوجد مستخدمين</td></tr>';
        } else {
          usersContainer.innerHTML = '';
          users.forEach((user, idx) => {
            const createdAt = new Date(user.createdAt).toLocaleDateString();
            const updatedAt = new Date(user.updatedAt).toLocaleDateString();
            
            usersContainer.innerHTML += `
              <tr>
                <td>${idx + 1}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>
                  <span class="badge ${user.isSystemAdmin ? 'bg-danger' : 'bg-secondary'}">${user.isSystemAdmin ? 'مسؤول نظام' : 'مستخدم عادي'}</span>
                </td>
                <td>${createdAt}</td>
                <td>${updatedAt}</td>
                <td>
                  <div class="btn-group btn-group-sm">
                    ${!user.isSystemAdmin ? 
                      `<button class="btn btn-success btn-make-admin" data-id="${user.id}">تعيين كمسؤول</button>` :
                      `<button class="btn btn-warning btn-remove-admin" data-id="${user.id}">إزالة الصلاحية</button>`
                    }
                  </div>
                </td>
              </tr>
            `;
          });
          
          // Add event listeners for make/remove admin buttons
          document.querySelectorAll('.btn-make-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
              const userId = btn.getAttribute('data-id');
              try {
                await api.makeUserAdmin(userId);
                this.loadAdminUsers(); // Reload user list
                showToast('نجاح', 'تم تعيين المستخدم كمسؤول نظام بنجاح');
              } catch (error) {
                console.error('Make admin error:', error);
                showToast('خطأ', 'فشل في تعيين المستخدم كمسؤول نظام');
              }
            });
          });
          
          document.querySelectorAll('.btn-remove-admin').forEach(btn => {
            btn.addEventListener('click', async () => {
              const userId = btn.getAttribute('data-id');
              try {
                await api.removeUserAdmin(userId);
                this.loadAdminUsers(); // Reload user list
                showToast('نجاح', 'تم إزالة صلاحيات المسؤول بنجاح');
              } catch (error) {
                console.error('Remove admin error:', error);
                showToast('خطأ', 'فشل في إزالة صلاحيات المسؤول');
              }
            });
          });
        }
      }
    } catch (error) {
      console.error('Load admin users error:', error);
      const usersContainer = document.getElementById('admin-users-list');
      if (usersContainer) {
        usersContainer.innerHTML = '<tr><td colspan="7" class="text-center text-danger">فشل في تحميل بيانات المستخدمين</td></tr>';
      }
    }
  }
  
  loadAdminRecentActivity(recentActivity) {
    // Load recent payments
    const paymentsContainer = document.getElementById('admin-payments-list');
    if (paymentsContainer) {
      if (!recentActivity.payments || recentActivity.payments.length === 0) {
        paymentsContainer.innerHTML = '<tr><td colspan="4" class="text-center">لا توجد مدفوعات حديثة</td></tr>';
      } else {
        paymentsContainer.innerHTML = '';
        recentActivity.payments.forEach(payment => {
          const paymentDate = new Date(payment.createdAt).toLocaleDateString();
          paymentsContainer.innerHTML += `
            <tr>
              <td>${payment.participant.name}</td>
              <td>${i18n.formatCurrency(payment.amount)}</td>
              <td>${payment.collector.name}</td>
              <td>${paymentDate}</td>
            </tr>
          `;
        });
      }
    }
    
    // Load recent users
    const usersContainer = document.getElementById('admin-recent-users-list');
    if (usersContainer) {
      if (!recentActivity.users || recentActivity.users.length === 0) {
        usersContainer.innerHTML = '<tr><td colspan="3" class="text-center">لا يوجد مستخدمين جدد</td></tr>';
      } else {
        usersContainer.innerHTML = '';
        recentActivity.users.forEach(user => {
          const registrationDate = new Date(user.createdAt).toLocaleDateString();
          usersContainer.innerHTML += `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${registrationDate}</td>
            </tr>
          `;
        });
      }
    }
  }

  // Helper methods
  getRoleBadgeClass(role) {
    switch (role) {
      case 'owner':
        return 'bg-danger role-owner';
      case 'admin':
        return 'bg-purple role-admin';
      case 'collector':
        return 'bg-primary role-collector';
      default:
        return 'bg-secondary';
    }
  }

  getProgressBarClass(percent) {
    if (percent >= 100) {
      return 'bg-success';
    } else if (percent >= 50) {
      return 'bg-warning';
    } else {
      return 'bg-danger';
    }
  }

  // Add the email verification page handler
  renderVerifyEmailPage(params) {
    this.clearApp();
    this.renderTemplate('verify-email-template');

    // Extract the verification token from the URL if no status parameters
    const token = params.token;
    if (!token) {
      this.showVerificationError('Invalid verification link. The token is missing.');
      return;
    }
    setTimeout(() => {
      this.verifyEmailToken(token);
    }, 1000); // Short delay for better UX
   
      // If the user is logged in, update the verification status
      if (auth.isAuthenticated()) {
        const user = auth.getUser();
        user.emailVerified = true;
        auth.saveUserToLocalStorage(user);
        auth.updateUI();
        
        // Auto-redirect to projects page after 3 seconds if user is logged in
        setTimeout(() => {
          this.navigate('/projects');
        }, 3000);
      }
    
    
  
    
    // Verify the token with the backend

    
    // Add event listener to resend verification email button
    const resendButton = document.getElementById('resend-verification-btn');
    if (resendButton) {
      resendButton.addEventListener('click', async () => {
        try {
          setButtonLoading(resendButton, i18n.t('auth.sending'));
          
          // Try to get email from various sources
          let email = '';
          
          // First check if we have email from URL parameters
          const urlParams = new URLSearchParams(window.location.search);
          email = urlParams.get('email');
          
          // Next try from localStorage (may have been stored during signup or login attempt)
          if (!email) {
            email = localStorage.getItem('pendingVerificationEmail');
          }
          
          if (!email) {
            showToast('Error', 'Could not determine your email address. Please login and request verification again.');
            resetButtonLoading(resendButton, i18n.t('auth.resendVerification'));
            return;
          }
          
          await api.resendVerificationEmail(email);
          showToast('Success', 'Verification email has been resent. Please check your inbox.');
          resetButtonLoading(resendButton, i18n.t('auth.resendVerification'));
        } catch (error) {
          console.error('Resend verification email error:', error);
          showToast('Error', 'Failed to resend verification email. Please try again later.');
          resetButtonLoading(resendButton, i18n.t('auth.resendVerification'));
        }
      });
    }
  }

  // Helper method to verify the email token with the backend
  async verifyEmailToken(token) {
    try {
      const response = await api.verifyEmail(token);
      if (response?.success) {
        // Show success message
        document.getElementById('verification-loading').classList.add('d-none');
        document.getElementById('verification-success').classList.remove('d-none');
        document.getElementById('verification-error').classList.add('d-none');
        
        // If the user is logged in, update the verification status
        if (auth.isAuthenticated()) {
          const user = auth.getUser();
          user.emailVerified = true;
          auth.saveUserToLocalStorage(user);
          auth.updateUI();
        }
        
        // Auto-redirect to projects page after 3 seconds if user is logged in
        if (auth.isAuthenticated()) {
          setTimeout(() => {
            this.navigate('/projects');
          }, 3000);
        }
      } else {
        this.showVerificationError('The verification link is invalid or has expired.');
      }
    } catch (error) {
      console.error('Email verification error:', error);
      let errorMessage = 'Failed to verify your email. The verification link may be invalid or expired.';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      this.showVerificationError(errorMessage);
    }
  }
  
  // Helper method to show verification error
  showVerificationError(message) {
    document.getElementById('verification-loading').classList.add('d-none');
    document.getElementById('verification-success').classList.add('d-none');
    document.getElementById('verification-error').classList.remove('d-none');
    document.getElementById('verification-error-message').textContent = message;
  }

  // Forgot Password Page
  renderForgotPasswordPage() {
    this.clearApp();
    this.renderTemplate('forgot-password-template');
    const form = document.getElementById('forgot-password-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value;
        const submitBtn = form.querySelector('button[type="submit"]');
        setButtonLoading(submitBtn, 'Sending...');
        try {
          await api.forgotPassword(email);
          document.getElementById('forgot-success').classList.remove('d-none');
          form.classList.add('d-none');
        } catch (error) {
          showToast('Error', error.message || 'Failed to send reset email.');
        } finally {
          resetButtonLoading(submitBtn);
        }
      });
    }
  }

  // Reset Password Page
  renderResetPasswordPage(params) {
    this.clearApp();
    this.renderTemplate('reset-password-template');
    const form = document.getElementById('reset-password-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('reset-password').value;
        const confirmPassword = document.getElementById('reset-confirm-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        // Validate password
        if (password.length < 8) {
          showToast('Error', 'Password must be at least 8 characters long.');
          return;
        }

        // Validate password confirmation
        if (password !== confirmPassword) {
          document.getElementById('reset-confirm-password').classList.add('is-invalid');
          return;
        } else {
          document.getElementById('reset-confirm-password').classList.remove('is-invalid');
        }

        setButtonLoading(submitBtn, 'Resetting...');
        try {
          await api.resetPassword(params.token, password);
          document.getElementById('reset-success').classList.remove('d-none');
          form.classList.add('d-none');

          // Auto-redirect to login page after 3 seconds
          setTimeout(() => {
            this.navigate('/login');
          }, 3000);
        } catch (error) {
          console.error('Reset password error:', error);
          let errorMessage = 'Failed to reset password.';
          
          if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          }
          
          showToast('Error', errorMessage);
        } finally {
          resetButtonLoading(submitBtn);
        }
      });

      // Add event listener to validate password confirmation as the user types
      const confirmPasswordInput = document.getElementById('reset-confirm-password');
      confirmPasswordInput.addEventListener('input', () => {
        const password = document.getElementById('reset-password').value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (password !== confirmPassword) {
          confirmPasswordInput.classList.add('is-invalid');
        } else {
          confirmPasswordInput.classList.remove('is-invalid');
        }
      });
    }
  }
}

// Utility: Show a custom confirmation modal (returns a Promise)
function showConfirmDialog(message) {
  return new Promise((resolve) => {
    // Create modal if not exists
    let modalEl = document.getElementById('customConfirmModal');
    if (!modalEl) {
      modalEl = document.createElement('div');
      modalEl.id = 'customConfirmModal';
      modalEl.className = 'modal fade';
      modalEl.tabIndex = -1;
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${i18n.t('common.confirmDelete')}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p id="customConfirmMessage">${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" id="customConfirmCancel">${i18n.t('common.cancel')}</button>
              <button type="button" class="btn btn-danger" id="customConfirmOk">${i18n.t('common.delete')}</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modalEl);
    } else {
      modalEl.querySelector('#customConfirmMessage').textContent = message;
    }
    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Remove previous listeners
    const okBtn = modalEl.querySelector('#customConfirmOk');
    const cancelBtn = modalEl.querySelector('#customConfirmCancel');
    okBtn.onclick = () => { modal.hide(); resolve(true); };
    cancelBtn.onclick = () => { modal.hide(); resolve(false); };
    modalEl.addEventListener('hidden.bs.modal', () => resolve(false), { once: true });
  });
}

// Don't create a global instance here
// Let app.js handle instance creation
