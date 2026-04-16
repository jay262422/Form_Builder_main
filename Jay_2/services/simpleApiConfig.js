/**
 * Simple API Configuration
 * Backend-only API configuration for all services.
 */

// Get API URL from environment variable or use default
const getApiBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or default
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';
  }
  // Server-side: use environment variable or default
  return process.env.API_URL || 'http://localhost:3004';
};

const SIMPLE_API_CONFIG = {
  // Backend base URL
  get backendBaseURL() {
    return getApiBaseURL();
  },

  // Backend endpoint paths (to be added to backendBaseURL)
  backendEndpoints: {
    forms: {
      getAll: '/api/forms',
      getById: '/api/forms/:id',
      create: '/api/forms',
      update: '/api/forms/:id',
      delete: '/api/forms/:id',
      duplicate: '/api/forms/:id/duplicate',
      stats: '/api/forms/:id/stats',
      export: '/api/forms/:id/export',
      versions: '/api/forms/:id/versions',
      versionByNumber: '/api/forms/:id/versions/:versionNumber',
      restoreVersion: '/api/forms/:id/versions/:versionNumber/restore'
    },
    fieldOptions: {
      getAll: '/api/field-options',
      getTypes: '/api/field-options/types',
      getByType: '/api/field-options/type/:optionType',
      create: '/api/field-options',
      update: '/api/field-options/:id',
      delete: '/api/field-options/:id',
      addOption: '/api/field-options/:id/options',
      updateOption: '/api/field-options/:id/options/:optionValue',
      removeOption: '/api/field-options/:id/options/:optionValue',
      bulkCreate: '/api/field-options/bulk',
      getForSchema: '/api/field-options/schema',
      import: '/api/field-options/import'
    },
    dynamicMappings: {
      getAll: '/api/dynamic-mappings',
      getSummary: '/api/dynamic-mappings/summary',
      getByCustomId: '/api/dynamic-mappings/custom/:id',
      getByParentChild: '/api/dynamic-mappings/parent/:parentField/child/:childField',
      getByOptionTypes: '/api/dynamic-mappings/options/:parentOptionType/:childOptionType',
      getById: '/api/dynamic-mappings/:id',
      create: '/api/dynamic-mappings',
      update: '/api/dynamic-mappings/:id',
      delete: '/api/dynamic-mappings/:id',
      getMappedOptions: '/api/dynamic-mappings/:mappingId/options/:parentValue',
      getMappedOptionsByCustomId: '/api/dynamic-mappings/custom/:mappingId/options/:parentValue',
      applyMapping: '/api/dynamic-mappings/:mappingId/apply',
      testMapping: '/api/dynamic-mappings/:mappingId/test',
      bulkCreate: '/api/dynamic-mappings/bulk'
    },
    submissions: {
      getAll: '/api/submissions',
      getById: '/api/submissions/:id',
      create: '/api/submissions',
      update: '/api/submissions/:id',
      delete: '/api/submissions/:id',
      getByForm: '/api/submissions/form/:formId',
      getStats: '/api/submissions/form/:formId/stats',
      export: '/api/submissions/form/:formId/export'
    },
    workspaces: {
      getMine: '/api/workspaces/me',
      updateMine: '/api/workspaces/me',
      invite: '/api/workspaces/me/invite',
      acceptInvite: '/api/workspaces/invitations/accept',
      updateMemberRole: '/api/workspaces/me/members/:userId/role',
      removeMember: '/api/workspaces/me/members/:userId'
    }
  },

  // Helper function to get the service base URL
  getBaseURL(serviceName) {
    const mainEndpoint = this.backendEndpoints[serviceName]?.getAll;
    if (mainEndpoint) {
      return `${this.backendBaseURL}${mainEndpoint}`;
    }
    return this.backendBaseURL;
  },

  // Helper function to get a specific endpoint URL
  getEndpointURL(serviceName, endpointName, params = {}) {
    let endpointPath = this.backendEndpoints[serviceName]?.[endpointName];
    if (!endpointPath) {
      console.warn(`Endpoint ${endpointName} not found for service ${serviceName}`);
      return this.getBaseURL(serviceName);
    }

    Object.keys(params).forEach(key => {
      endpointPath = endpointPath.replace(`:${key}`, encodeURIComponent(params[key]));
    });

    return `${this.backendBaseURL}${endpointPath}`;
  },

  // Legacy compatibility: platform is backend-only now.
  shouldUseBackend(serviceName) {
    return Boolean(this.backendEndpoints[serviceName]);
  },

  // Legacy compatibility no-op.
  setUseBackend(serviceName, useBackend) {
    console.warn(
      `setUseBackend(${serviceName}, ${useBackend}) ignored: application is backend-only.`
    );
  },

  // Legacy compatibility no-op.
  useFrontendForDevelopment() {
    console.warn('useFrontendForDevelopment() ignored: application is backend-only.');
  },

  // Kept for compatibility.
  useBackendForProduction() {
    console.log('Backend APIs are always enabled.');
  }
};

export default SIMPLE_API_CONFIG;
