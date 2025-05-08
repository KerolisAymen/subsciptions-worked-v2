// فئة API للتعامل مع جميع طلبات API
class API {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('token');
  }

  // تعيين رمز المصادقة
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // طريقة عامة لإرسال طلبات API
  async fetchData(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };
      
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`API Request to ${url}`, options);
      
      const response = await fetch(url, { ...defaultOptions, ...options });
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`API Error (${response.status}):`, data);
        throw {
          status: response.status,
          response: { data },
          message: data.message || 'API request failed'
        };
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      if (error.status === 401) {
        // Only force logout if not an unverified email error
        if (
          !(
            error.response &&
            error.response.data &&
            error.response.data.requiresVerification
          )
        ) {
          auth.logout();
          window.location.href = '/login';
        }
      }
      throw error;
    }
  }

  // طرق المصادقة
  async signup(userData) {
    return this.fetchData('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials) {
    return this.fetchData('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async logout() {
    return this.fetchData('/auth/logout');
  }

  async getCurrentUser() {
    return this.fetchData('/auth/me');
  }

  // Forgot Password
  async forgotPassword(email) {
    return this.fetchData('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // Reset Password
  async resetPassword(token, password) {
    return this.fetchData(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password })
    });
  }

  // Project methods
  async getProjects() {
    return this.fetchData('/projects');
  }

  async createProject(projectData) {
    return this.fetchData('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async getProject(projectId) {
    try {
      console.log(`Fetching project with ID: ${projectId}`);
      return this.fetchData(`/projects/${projectId}`);
    } catch (error) {
      console.error(`Failed to fetch project ${projectId}:`, error);
      throw error;
    }
  }

  async updateProject(projectId, projectData) {
    return this.fetchData(`/projects/${projectId}`, {
      method: 'PATCH',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(projectId) {
    return this.fetchData(`/projects/${projectId}`, {
      method: 'DELETE'
    });
  }

  // Project members methods
  async getProjectMembers(projectId) {
    return this.fetchData(`/projects/${projectId}/members`);
  }

  async addProjectMember(projectId, memberData) {
    return this.fetchData(`/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify(memberData)
    });
  }

  async updateProjectMember(projectId, memberId, memberData) {
    return this.fetchData(`/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify(memberData)
    });
  }

  async removeProjectMember(projectId, memberId) {
    return this.fetchData(`/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE'
    });
  }

  // Trip methods
  async getProjectTrips(projectId) {
    return this.fetchData(`/trips/project/${projectId}`);
  }

  async createTrip(tripData) {
    return this.fetchData('/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    });
  }

  async getTrip(tripId) {
    return this.fetchData(`/trips/${tripId}`);
  }

  async updateTrip(tripId, tripData) {
    return this.fetchData(`/trips/${tripId}`, {
      method: 'PATCH',
      body: JSON.stringify(tripData)
    });
  }

  async deleteTrip(tripId) {
    return this.fetchData(`/trips/${tripId}`, {
      method: 'DELETE'
    });
  }

  // Participant methods
  async getTripParticipants(tripId) {
    return this.fetchData(`/participants/trip/${tripId}`);
  }

  async createParticipant(participantData) {
    return this.fetchData('/participants', {
      method: 'POST',
      body: JSON.stringify(participantData)
    });
  }

  async getParticipant(participantId) {
    return this.fetchData(`/participants/${participantId}`);
  }

  async updateParticipant(participantId, participantData) {
    return this.fetchData(`/participants/${participantId}`, {
      method: 'PATCH',
      body: JSON.stringify(participantData)
    });
  }

  async deleteParticipant(participantId) {
    return this.fetchData(`/participants/${participantId}`, {
      method: 'DELETE'
    });
  }

  // Payment methods
  async getTripPayments(tripId) {
    return this.fetchData(`/payments/trip/${tripId}`);
  }

  async getParticipantPayments(participantId) {
    return this.fetchData(`/payments/participant/${participantId}`);
  }

  async createPayment(paymentData) {
    return this.fetchData('/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async updatePayment(paymentId, paymentData) {
    return this.fetchData(`/payments/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData)
    });
  }

  async deletePayment(paymentId) {
    return this.fetchData(`/payments/${paymentId}`, {
      method: 'DELETE'
    });
  }

  // Report methods
  async getProjectSummary(projectId) {
    return this.fetchData(`/reports/project/${projectId}`);
  }

  async getTripReport(tripId) {
    return this.fetchData(`/reports/trip/${tripId}`);
  }
  
  // Admin methods
  async getAdminStats() {
    return this.fetchData('/admin/stats');
  }
  
  async getAdminUsers() {
    return this.fetchData('/admin/users');
  }
  
  async getAdminProjects() {
    return this.fetchData('/admin/projects');
  }
  
  async makeUserAdmin(userId) {
    return this.fetchData(`/admin/users/${userId}/make-admin`, {
      method: 'PATCH'
    });
  }
  
  async removeUserAdmin(userId) {
    return this.fetchData(`/admin/users/${userId}/remove-admin`, {
      method: 'PATCH'
    });
  }

  // Email verification methods
  verifyEmail(token) {
    if (token) {
      return this.fetchData(`/auth/verify-email/${token}`);
    }
    return Promise.resolve({ data: { success: false } });
  }

  async resendVerificationEmail(email) {
    return this.fetchData('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
}

// إنشاء مثيل API عالمي
const api = new API();
