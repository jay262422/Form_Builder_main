import SIMPLE_API_CONFIG from './simpleApiConfig';
import { authenticatedFetch, parseApiResponse } from './apiClient';

class AuditLogService {
  async getWorkspaceAuditLogs({ page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });

    const baseUrl = SIMPLE_API_CONFIG.getEndpointURL('auditLogs', 'getMine');
    const response = await authenticatedFetch(`${baseUrl}?${params.toString()}`);
    return parseApiResponse(response);
  }
}

export default new AuditLogService();
