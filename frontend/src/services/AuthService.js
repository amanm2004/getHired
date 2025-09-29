// src/services/AuthService.js
class AuthService {
  constructor() {
    this.baseURL = `${process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"}/api`;
    this.tokenKey = 'gethired_token';
    this.userKey = 'gethired_user';
  }

  // Get stored token
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Get stored user
  getUser() {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Simple JWT expiration check (without verifying signature)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Store authentication data
  storeAuthData(token, user) {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Sign up
  async signUp(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Sign up failed');
      }

      // Store authentication data
      this.storeAuthData(data.access_token, data.user);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in
  async signIn(credentials) {
    try {
      const response = await fetch(`${this.baseURL}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Sign in failed');
      }

      // Store authentication data
      this.storeAuthData(data.access_token, data.user);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuthData();
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }

      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.clearAuthData();
        }
        throw new Error('Failed to fetch user data');
      }

      const user = await response.json();
      localStorage.setItem(this.userKey, JSON.stringify(user));
      
      return { success: true, user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Make authenticated API requests
  async authenticatedFetch(url, options = {}) {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        // Token expired or invalid, clear auth data
        this.clearAuthData();
        throw new Error('Authentication expired. Please sign in again.');
      }

      return response;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export default new AuthService();