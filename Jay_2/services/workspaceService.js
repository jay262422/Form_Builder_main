import SIMPLE_API_CONFIG from './simpleApiConfig';
import { authenticatedFetch, parseApiResponse } from './apiClient';

class WorkspaceService {
  async getMyWorkspace() {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'getMine');
    const response = await authenticatedFetch(url);
    return parseApiResponse(response);
  }

  async updateWorkspace(name) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'updateMine');
    const response = await authenticatedFetch(url, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
    return parseApiResponse(response);
  }

  async inviteMember(email, role) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'invite');
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify({ email, role })
    });
    return parseApiResponse(response);
  }

  async acceptInvite(inviteToken) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'acceptInvite');
    const response = await authenticatedFetch(url, {
      method: 'POST',
      body: JSON.stringify({ inviteToken })
    });
    return parseApiResponse(response);
  }

  async updateMemberRole(userId, role) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'updateMemberRole', { userId });
    const response = await authenticatedFetch(url, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    return parseApiResponse(response);
  }

  async revokeInvite(email) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'revokeInvite', { email });
    const response = await authenticatedFetch(url, {
      method: 'DELETE'
    });
    return parseApiResponse(response);
  }

  async removeMember(userId) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'removeMember', { userId });
    const response = await authenticatedFetch(url, {
      method: 'DELETE'
    });
    return parseApiResponse(response);
  }
}

export default new WorkspaceService();
