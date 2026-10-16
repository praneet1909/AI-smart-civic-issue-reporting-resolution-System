import apiClient from './apiClient';

export const adminService = {
  /**
   * Fetch paginated list of all complaints in the city
   * @param {number} page
   * @param {number} size
   * @returns {Promise<any>}
   */
  listComplaints: async (page = 0, size = 10) => {
    return apiClient.get(`/admin/complaints?page=${page}&size=${size}`);
  },

  /**
   * Fetch single complaint full details
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getComplaintById: async (id) => {
    return apiClient.get(`/admin/complaints/${id}`);
  },

  /**
   * Fetch lifecycle status timeline for a complaint
   * @param {number|string} id
   * @returns {Promise<any[]>}
   */
  getTimeline: async (id) => {
    return apiClient.get(`/admin/complaints/${id}/timeline`);
  },

  /**
   * Initial assignment of an AI-verified complaint to a field officer
   * @param {number|string} id
   * @param {{ officerId: number, remarks?: string }} data
   * @returns {Promise<any>}
   */
  assignComplaint: async (id, data) => {
    return apiClient.put(`/admin/complaints/${id}/assign`, data);
  },

  /**
   * Reassignment of an active complaint to a different field officer
   * @param {number|string} id
   * @param {{ officerId: number, remarks?: string }} data
   * @returns {Promise<any>}
   */
  reassignComplaint: async (id, data) => {
    return apiClient.put(`/admin/complaints/${id}/reassign`, data);
  },

  /**
   * Administratively close a complaint
   * @param {number|string} id
   * @param {{ remarks?: string }} data
   * @returns {Promise<any>}
   */
  closeComplaint: async (id, data = {}) => {
    return apiClient.put(`/admin/complaints/${id}/close`, data);
  },

  /**
   * Fetch citizen feedback for a resolved complaint
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getFeedback: async (id) => {
    return apiClient.get(`/admin/complaints/${id}/feedback`);
  },

  /**
   * List all municipal field officers
   * @returns {Promise<any[]>}
   */
  listOfficers: async () => {
    return apiClient.get('/admin/officers');
  },
};

export default adminService;
