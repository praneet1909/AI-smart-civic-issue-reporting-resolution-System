import apiClient from './apiClient';

export const officerService = {
  /**
   * Fetch paginated complaints assigned to the authenticated officer
   * @param {string|null} status
   * @param {number} page
   * @param {number} size
   * @returns {Promise<any>}
   */
  listComplaints: async (status = null, page = 0, size = 10) => {
    let endpoint = `/officer/complaints?page=${page}&size=${size}`;
    if (status && status !== 'ALL') {
      endpoint += `&status=${status}`;
    }
    return apiClient.get(endpoint);
  },

  /**
   * Fetch full details of an assigned complaint
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getComplaintById: async (id) => {
    return apiClient.get(`/officer/complaints/${id}`);
  },

  /**
   * Fetch status timeline of an assigned complaint
   * @param {number|string} id
   * @returns {Promise<any[]>}
   */
  getTimeline: async (id) => {
    return apiClient.get(`/officer/complaints/${id}/timeline`);
  },

  /**
   * Transition complaint from PENDING to IN_PROGRESS
   * @param {number|string} id
   * @param {string} remarks
   * @returns {Promise<any>}
   */
  startWork: async (id, remarks = 'Officer initiated field repair work') => {
    return apiClient.put(`/officer/complaints/${id}/status`, {
      status: 'IN_PROGRESS',
      remarks,
    });
  },

  /**
   * Complete repair and submit after-photo resolution proof
   * @param {number|string} id
   * @param {FormData} formData (contains remarks and afterImage)
   * @returns {Promise<any>}
   */
  resolveComplaint: async (id, formData) => {
    return apiClient.put(`/officer/complaints/${id}/resolve`, formData);
  },

  /**
   * Fetch citizen feedback for a resolved complaint
   * @param {number|string} id
   * @returns {Promise<any>}
   */
  getFeedback: async (id) => {
    return apiClient.get(`/officer/complaints/${id}/feedback`);
  },
};

export default officerService;
