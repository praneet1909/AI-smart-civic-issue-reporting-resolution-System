import apiClient from './apiClient';

export const authService = {
  /**
   * Log in with email and password.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{token: string, tokenType: string, expiresIn: number, user: object}>}
   */
  async login(email, password) {
    return apiClient.post('/auth/login', { email: email.trim(), password });
  },

  /**
   * Register a new citizen account.
   * @param {{name: string, email: string, password: string, phone?: string}} data
   * @returns {Promise<object>} UserResponse
   */
  async register(data) {
    return apiClient.post('/auth/register', {
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
      phone: data.phone ? data.phone.trim() : null,
    });
  },

  /**
   * Fetch currently authenticated user profile from token.
   * @returns {Promise<object>} UserResponse
   */
  async getMe() {
    return apiClient.get('/auth/me');
  },
};

export default authService;
