import SIMPLE_API_CONFIG from './simpleApiConfig';

class AuditLogService {
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async parseResponse(response) {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return payload?.data !== undefined ? payload.data : payload;
  }

  async getWorkspaceAuditLogs({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    const baseUrl = SIMPLE_API_CONFIG.getEndpointURL('auditLogs', 'getMine');
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });

    return this.parseResponse(response);
  }
}

export default new AuditLogService();
