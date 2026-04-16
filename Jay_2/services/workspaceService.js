import SIMPLE_API_CONFIG from './simpleApiConfig';

class WorkspaceService {
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

  async getMyWorkspace() {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'getMine');
    const response = await fetch(url, {
      headers: this.getAuthHeaders()
    });
    return this.parseResponse(response);
  }

  async updateWorkspace(name) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'updateMine');
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name })
    });
    return this.parseResponse(response);
  }

  async inviteMember(email, role) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'invite');
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ email, role })
    });
    return this.parseResponse(response);
  }

  async acceptInvite(inviteToken) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'acceptInvite');
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ inviteToken })
    });
    return this.parseResponse(response);
  }

  async updateMemberRole(userId, role) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'updateMemberRole', { userId });
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ role })
    });
    return this.parseResponse(response);
  }

  async removeMember(userId) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('workspaces', 'removeMember', { userId });
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.parseResponse(response);
  }
}

export default new WorkspaceService();
