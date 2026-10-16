import apiClient from './apiClient';

export const complaintService = {
  /**
   * Create a new complaint with multipart beforeImage file and details
   * @param {FormData} formData
   * @returns {Promise<any>}
   */
  createComplaint: async (formData) => {
    return apiClient.post('/complaints', formData);
  },

  /**
   * Fetch paginated list of complaints reported by the authenticated citizen
   * @param {number} page
   * @param {number} size
   * @returns {Promise<any>}
   */
  getMyComplaints: async (page = 0, size = 10) => {
    return apiClient.get(`/complaints/my?page=${page}&size=${size}`);
  },

  /**
   * Fetch single complaint details by ID
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getComplaintById: async (id) => {
    return apiClient.get(`/complaints/${id}`);
  },

  /**
   * Fetch lifecycle status timeline for a complaint
   * @param {number|string} id
   * @returns {Promise<any[]>}
   */
  getComplaintTimeline: async (id) => {
    return apiClient.get(`/complaints/${id}/timeline`);
  },

  /**
   * Close a complaint administratively by the citizen
   * @param {number|string} id
   * @param {string} reason
   * @returns {Promise<any>}
   */
  closeComplaint: async (id, reason = '') => {
    return apiClient.put(`/complaints/${id}/close`, { reason });
  },

  /**
   * Submit citizen rating and satisfaction review
   * @param {number|string} id
   * @param {{ rating: number, comments?: string }} feedbackData
   * @returns {Promise<any>}
   */
  submitFeedback: async (id, feedbackData) => {
    return apiClient.post(`/complaints/${id}/feedback`, feedbackData);
  },

  /**
   * Fetch submitted feedback for a complaint
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getFeedback: async (id) => {
    return apiClient.get(`/complaints/${id}/feedback`);
  },
};

export default complaintService;
