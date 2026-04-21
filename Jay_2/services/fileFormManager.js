/**
 * File-based Form Manager Service
 * Handles saving, loading, editing, and managing forms using individual JSON files
 * Each form is saved as a separate file in the all_forms folder
 */

import SIMPLE_API_CONFIG from './simpleApiConfig';
import errorHandler from './errorHandler';

class FileFormManager {
  constructor() {
    this.formsFolder = '/src/app/Jay_2/data/all_forms/';
  }

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

  // Normalize a form into Phase-1 schema and provide safe defaults
  normalizeForm(rawForm) {
    if (!rawForm || typeof rawForm !== 'object') {
      console.warn('FileFormManager: Invalid form data provided for normalization');
      return null;
    }

    const defaultSettings = {
      allowMultipleSubmissions: false,
      requireAuthentication: false,
      redirectUrl: '/thank-you',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Please check your form and try again.',
      // Button Configuration
      buttons: {
        submit: {
          text: 'Submit',
          show: true,
          customApiEndpoint: null, // null = use default endpoint
          customApiMethod: 'POST'
        },
        reset: {
          text: 'Reset',
          show: true // Can be toggled per form
        },
        cancel: {
          text: 'Cancel',
          show: true
        }
      },
      postSubmission: {
        showSuccessPage: true,
        showSubmittedData: false,
        allowResubmit: true,
        resubmitText: "Submit Another Request",
        successIcon: "OK",
        errorIcon: "!",
        autoRedirect: {
          enabled: false,
          delay: 3000
        },
        notifications: {
          email: {
            enabled: false,
            recipients: []
          }
        }
      }
    };

    const defaultStatus = {
      isPublished: false,
      isTemplate: false
    };

    const defaultMetadata = {
      createdBy: 'admin',
      version: '1.0.0',
      lastModifiedBy: 'admin'
    };

    const defaultStatistics = {
      totalSubmissions: 0,
      totalViews: 0,
      lastSubmissionDate: null
    };

    const defaultUI = {
      themeId: 'default',
      layout: {},
      sectionStyle: 'card',
      removeSectionBoxes: false
    };

    // Map legacy flags to new structure
    const legacyIsTemplate = rawForm.isTemplate || false;
    const legacyIsExample = rawForm.isExample || false; // ignored but tolerated

    return {
      // Keep optional Mongo _id if present; do NOT require
      _id: rawForm._id,
      id: rawForm.id,
      name: rawForm.name,
      description: rawForm.description,
      type: rawForm.type,
      schema: rawForm.schema,

      settings: { ...defaultSettings, ...(rawForm.settings || {}) },
      status: { ...defaultStatus, ...(rawForm.status || {}), isTemplate: (rawForm.status?.isTemplate ?? legacyIsTemplate) },
      metadata: { ...defaultMetadata, ...(rawForm.metadata || {}) },
      statistics: { ...defaultStatistics, ...(rawForm.statistics || {}) },
      ui_part: { ...defaultUI, ...(rawForm.ui_part || {}) },

      // Preserve calculated counts from API
      sectionsCount: rawForm.sectionsCount,
      fieldsCount: rawForm.fieldsCount,

      createdAt: rawForm.createdAt || new Date().toISOString(),
      updatedAt: rawForm.updatedAt || new Date().toISOString()
    };
  }

  /**
   * Get the current base URL for this service
   */
  get baseUrl() {
    return SIMPLE_API_CONFIG.getBaseURL('forms');
  }

  /**
   * Convert form name to filename
   */
  formNameToFilename(formName) {
    return formName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();
  }

  /**
   * Get all saved forms from the all_forms folder (summary only - fast loading)
   */
  async getAllForms() {
    return errorHandler.withErrorHandling(async () => {
      const response = await fetch(this.baseUrl, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.status} ${response.statusText}`);
      }
      const responseData = await response.json();

      // Backend returns { success, data: { forms } }; unwrap for single source of truth
      const payload = responseData.data !== undefined ? responseData.data : responseData;
      let forms = [];
      if (payload && payload.forms && Array.isArray(payload.forms)) {
        forms = payload.forms;
      } else if (Array.isArray(payload)) {
        forms = payload;
      }

      const normalizedForms = forms.map(f => this.normalizeForm(f));
      return normalizedForms;
    }, 'getAllForms').catch(error => {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const savedForms = localStorage.getItem('dynamic_forms_backup');
        if (savedForms) {
          try {
            const parsed = JSON.parse(savedForms);
            return Array.isArray(parsed) ? parsed.map(f => this.normalizeForm(f)) : [];
          } catch (parseError) {
            errorHandler.showErrorToast(parseError, 'Failed to parse backup forms');
            return [];
          }
        }
      }
      errorHandler.showErrorToast(error, 'Failed to load forms');
      return [];
    });
  }

  /**
   * Get full form data by custom ID (for edit/preview)
   */
  async getFormByCustomId(customId) {
    return errorHandler.withErrorHandling(async () => {
      const fullFormUrl = SIMPLE_API_CONFIG.getEndpointURL('forms', 'getById', { id: customId });
      const response = await fetch(fullFormUrl, {
        headers: this.getAuthHeaders()
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch form: ${response.status} ${response.statusText}`);
      }
      const responseData = await response.json();
      // Backend returns { success, data: form }
      const formData = responseData.data !== undefined ? responseData.data : responseData;
      return this.normalizeForm(formData);
    }, 'getFormByCustomId');
  }



  /**
   * Get all forms including examples
   * Note: All forms (including examples) are now stored as JSON files
   */
  async getAllFormsWithExamples() {
    // All forms are now loaded from JSON files via getAllForms()
    return await this.getAllForms();
  }

  /**
   * Save a form as an individual JSON file
   */
  async saveForm(formData) {
    return errorHandler.withErrorHandling(async () => {
      const cleanFormData = this.cleanFormData(formData);
      const normalized = this.normalizeForm(cleanFormData);

      const createUrl = SIMPLE_API_CONFIG.getEndpointURL('forms', 'create');
      const response = await fetch(createUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(normalized),
      });

      if (!response.ok) {
        throw new Error(`Failed to save form: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const savedForm = responseData.data !== undefined ? responseData.data : responseData;
      return savedForm;
    }, 'saveForm').catch(async error => {
      try {
        const cleanFormData = this.cleanFormData(formData);
        const normalized = this.normalizeForm(cleanFormData);
        await this.saveFormToLocalStorage(normalized);
        errorHandler.showErrorToast(new Error('Form saved locally due to server error'), 'Form saved locally');
        return normalized;
      } catch (fallbackError) {
        errorHandler.showErrorToast(fallbackError, 'Failed to save form');
        throw fallbackError;
      }
    });
  }

  /**
   * Update an existing form
   */
  async updateForm(id, updates) {
    return errorHandler.withErrorHandling(async () => {
      const cleanUpdates = this.cleanFormData(updates);
      const updateData = {
        ...cleanUpdates,
        id: id,
        updatedAt: new Date().toISOString()
      };

      const updateUrl = SIMPLE_API_CONFIG.getEndpointURL('forms', 'update', { id: id });
      const response = await fetch(updateUrl, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update form: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData.data !== undefined ? responseData.data : responseData;
    }, 'updateForm').catch(async error => {
      try {
        const forms = await this.getAllForms();
        const formIndex = forms.findIndex(form => form.id === id);

        if (formIndex === -1) {
          throw new Error('Form not found');
        }

        const cleanUpdates = this.cleanFormData(updates);
        const updatedForm = this.normalizeForm({
          ...forms[formIndex],
          ...cleanUpdates,
          updatedAt: new Date().toISOString()
        });

        forms[formIndex] = updatedForm;
        await this.saveFormsToLocalStorage(forms);

        errorHandler.showErrorToast(new Error('Form updated locally due to server error'), 'Form updated locally');
        return updatedForm;
      } catch (fallbackError) {
        errorHandler.showErrorToast(fallbackError, 'Failed to update form');
        throw fallbackError;
      }
    });
  }

  /**
   * Delete a form
   */
  async deleteForm(id) {
    try {
      const forms = await this.getAllForms();
      const formToDelete = forms.find(form => form.id === id);
      
      if (!formToDelete) {
        throw new Error('Form not found');
      }
      
      // Use the API endpoint to delete the form
      const deleteUrl = SIMPLE_API_CONFIG.getEndpointURL('forms', 'delete', { id: id });
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ id, name: formToDelete.name }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete form');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw new Error('Failed to delete form');
    }
  }

  /**
   * Duplicate a form
   */
  async duplicateForm(id) {
    return errorHandler.withErrorHandling(async () => {
      const duplicateUrl = SIMPLE_API_CONFIG.getEndpointURL('forms', 'duplicate', { id: id });
      const response = await fetch(duplicateUrl, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to duplicate form: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData.data !== undefined ? responseData.data : responseData;
    }, 'duplicateForm').catch(async error => {
      try {
        const fullFormData = await this.getFormByCustomId(id);

        const duplicateForm = {
          ...fullFormData,
          id: null,
          name: `${fullFormData.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return await this.saveForm(duplicateForm);
      } catch (fallbackError) {
        errorHandler.showErrorToast(fallbackError, 'Failed to duplicate form');
        throw fallbackError;
      }
    });
  }

  /**
   * Save form to localStorage (temporary solution)
   */
  async saveFormToLocalStorage(formData) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const forms = await this.getAllForms();
      const existingIndex = forms.findIndex(form => form.id === formData.id);
      
      if (existingIndex !== -1) {
        forms[existingIndex] = formData;
      } else {
        forms.push(formData);
      }
      
      localStorage.setItem('dynamic_forms_backup', JSON.stringify(forms));
    }
  }

  /**
   * Save all forms to localStorage (temporary solution)
   */
  async saveFormsToLocalStorage(forms) {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem('dynamic_forms_backup', JSON.stringify(forms));
    }
  }

  /**
   * Save form to individual file (placeholder for server-side implementation)
   */
  async saveFormToFile(filePath, formData) {
    // This would need a server-side API endpoint to write the file
    console.log(`Would save form to: ${filePath}`);
    console.log('Form data:', formData);
    
    // Example server-side API call:
    // await fetch('/api/forms/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filePath, formData })
    // });
  }

  /**
   * Delete form file (placeholder for server-side implementation)
   */
  async deleteFormFile(filePath) {
    // This would need a server-side API endpoint to delete the file
    console.log(`Would delete file: ${filePath}`);
    
    // Example server-side API call:
    // await fetch('/api/forms/delete', {
    //   method: 'DELETE',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ filePath })
    // });
  }

  /**
   * Clean form data to remove circular references
   */
  cleanFormData(data) {
    if (data === null || data === undefined) {
      return data;
    }

    if (typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.cleanFormData(item));
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'function' || 
          (typeof value === 'object' && value !== null && 
           (value.nodeType !== undefined || value._reactInternalFiber !== undefined))) {
        continue;
      }
      
      cleaned[key] = this.cleanFormData(value);
    }
    
    return cleaned;
  }

  /**
   * Get form statistics
   */
  async getFormStats() {
    const allForms = await this.getAllForms();
    
    return {
      totalForms: allForms.length,
      totalExamples: 0, // All forms are now in JSON files
      totalItems: allForms.length,
      recentlyCreated: allForms
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
  }

  /**
   * Get version history for a form
   */
  async getFormVersions(id) {
    return errorHandler.withErrorHandling(async () => {
      const url = SIMPLE_API_CONFIG.getEndpointURL('forms', 'versions', { id });
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch form versions: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const data = responseData.data !== undefined ? responseData.data : responseData;
      return data.versions || [];
    }, 'getFormVersions');
  }

  /**
   * Get a specific form version by version number
   */
  async getFormVersion(id, versionNumber) {
    return errorHandler.withErrorHandling(async () => {
      const url = SIMPLE_API_CONFIG.getEndpointURL('forms', 'versionByNumber', { id, versionNumber });
      const response = await fetch(url, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch form version: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      const data = responseData.data !== undefined ? responseData.data : responseData;
      return data.version;
    }, 'getFormVersion');
  }

  /**
   * Restore a form from a specific version number
   */
  async restoreFormVersion(id, versionNumber) {
    return errorHandler.withErrorHandling(async () => {
      const url = SIMPLE_API_CONFIG.getEndpointURL('forms', 'restoreVersion', { id, versionNumber });
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to restore form version: ${response.status} ${response.statusText}`);
      }

      const responseData = await response.json();
      return responseData.data?.form || responseData.form || null;
    }, 'restoreFormVersion');
  }
}

// Create singleton instance
const fileFormManager = new FileFormManager();

export default fileFormManager; 
