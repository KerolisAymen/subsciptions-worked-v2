// Auth class to handle user authentication
class Auth {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user')) || null;
    
    // Initialize API token
    if (this.token) {
      api.setToken(this.token);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Get current user
  getUser() {
    return this.user;
  }

  // Set authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    
    // Save to localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    // Set token in API
    api.setToken(token);
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.user = null;
    
    // Remove from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Clear token in API
    api.setToken(null);
  }

  // Sign up a new user
  async signup(userData) {
    try {
      const response = await api.signup(userData);
      
      // Check if token is returned - if not, user needs email verification
      if (response.token) {
        // Set authentication data
        this.setAuth(response.token, response.data.user);
      } else if (response.data && response.data.user) {
        // Show verification notification
        const toastElement = showToast(
          'Email Verification Required',
          'Please check your email for a verification link before logging in.',
          'warning',
          10000
        );
        
        // Store email for potential resend
        localStorage.setItem('pendingVerificationEmail', userData.email);
      }
      
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        showToast('Error', error.response.data.message || 'Signup failed');
      } else {
        showToast('Error', 'Network error. Please try again later.');
      }
      throw error;
    }
  }

  // Log in a user
  async login(credentials) {
    try {
      const response = await api.login(credentials);
      
      // Set authentication data
      this.setAuth(response.token, response.data.user);
      
      return response;
    } catch (error) {
      if (error.response && error.response.data) {
        // Special handling for unverified email errors
        if (error.response.data.requiresVerification) {
          // Store email for resend verification
          localStorage.setItem('pendingVerificationEmail', credentials.email);
          
          // Show specialized toast with resend option
          const toastElement = showToast(
            'Verify Email', 
            'Please verify your email before logging in. Check your inbox or click to resend verification email.',
            'warning',
            10000, // longer timeout
            true // Don't close automatically
          );
          
          // Add resend button to the toast
          if (toastElement) {
            const toastBody = toastElement.querySelector('.toast-body');
            if (toastBody) {
              // Add a button to resend verification email
              const resendBtn = document.createElement('button');
              resendBtn.classList.add('btn', 'btn-sm', 'btn-primary', 'mt-2');
              resendBtn.textContent = 'Resend Verification Email';
              resendBtn.addEventListener('click', async () => {
                try {
                  resendBtn.disabled = true;
                  resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
                  
                  await api.resendVerificationEmail(credentials.email);
                  showToast('Success', 'Verification email has been resent. Please check your inbox.');
                  
                  // Close the original toast
                  const bsToast = bootstrap.Toast.getInstance(toastElement);
                  if (bsToast) bsToast.hide();
                } catch (err) {
                  console.error('Failed to resend verification email:', err);
                  showToast('Error', 'Failed to resend verification email. Please try again.');
                  resendBtn.disabled = false;
                  resendBtn.textContent = 'Resend Verification Email';
                }
              });
              
              toastBody.appendChild(document.createElement('br'));
              toastBody.appendChild(resendBtn);
            }
          }
        } else {
          showToast('Error', error.response.data.message || 'Login failed');
        }
      } else {
        showToast('Error', 'Network error. Please try again later.');
      }
      throw error;
    }
  }

  // Log out a user
  async logout() {
    try {
      await api.logout();
      
      // Clear authentication data
      this.clearAuth();
    } catch (error) {
      console.error('Logout error:', error);
      
      // Still clear auth data even if API call fails
      this.clearAuth();
    }
  }

  // Check current authentication status with server
  async checkAuthStatus() {
    if (!this.isAuthenticated()) {
      return false;
    }
    
    try {
      const response = await api.getCurrentUser();
      
      // Update user data
      this.user = response.data.user;
      localStorage.setItem('user', JSON.stringify(this.user));
      
      return true;
    } catch (error) {
      console.error('Auth status check error:', error);
      
      // Clear auth data if token is invalid
      this.clearAuth();
      
      return false;
    }
  }

  // Update UI based on authentication status
  updateUI() {
    const authHiddenElements = document.querySelectorAll('.auth-hidden');
    const noAuthElements = document.querySelectorAll('.no-auth');
    
    if (this.isAuthenticated()) {
      // Show elements for authenticated users
      authHiddenElements.forEach(el => {
        // Use display flex only for nav items, otherwise use block
        if (el.classList.contains('navbar-nav')) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'block';
        }
      });
      noAuthElements.forEach(el => el.style.display = 'none');
      
      // Update username if element exists
      const usernameEl = document.getElementById('username');
      if (usernameEl && this.user) {
        usernameEl.textContent = this.user.name;
      }
    } else {
      // Hide elements for authenticated users
      authHiddenElements.forEach(el => el.style.display = 'none');
      // Show elements for non-authenticated users
      noAuthElements.forEach(el => {
        // Use display flex only for nav items, otherwise use block
        if (el.classList.contains('navbar-nav')) {
          el.style.display = 'flex';
        } else {
          el.style.display = 'block';
        }
      });
    }
  }
}

// Create a global Auth instance
const auth = new Auth();
