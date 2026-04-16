/**
 * Form Submission Service
 * Backend-only submission service.
 */

import SIMPLE_API_CONFIG from './simpleApiConfig';

class FormSubmissionService {
  /**
   * Validate form data against schema
   */
  validateFormData(formData, formSchema) {
    const errors = [];

    const allFields = [];
    if (formSchema.sections) {
      formSchema.sections.forEach(section => {
        if (section.fields) {
          allFields.push(...section.fields);
        }
      });
    }

    allFields.forEach(field => {
      const value = formData[field.name];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.name,
          message: `${field.label || field.name} is required`
        });
      }

      if (value && field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at least ${field.validation.minLength} characters`
          });
        }

        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be no more than ${field.validation.maxLength} characters`
          });
        }
      }

      if (value && field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} format is invalid`
          });
        }
      }

      if (value && field.type === 'number' && field.validation) {
        const numValue = parseFloat(value);
        if (field.validation.min !== undefined && numValue < field.validation.min) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be at least ${field.validation.min}`
          });
        }

        if (field.validation.max !== undefined && numValue > field.validation.max) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be no more than ${field.validation.max}`
          });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Prepare submission payload with metadata
   */
  async prepareSubmissionData(formData, formSchema, includeMetadata = true) {
    const processedFormData = await this.processFileUploads(formData, formSchema);

    const submission = {
      submissionId: this.generateSubmissionId(),
      formId: formSchema.id || formSchema.name?.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      formData: processedFormData,
      submittedAt: new Date().toISOString()
    };

    if (includeMetadata) {
      submission.metadata = {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
        ipAddress: null,
        formName: formSchema.name || 'Untitled Form'
      };
    }

    return submission;
  }

  /**
   * Process file uploads in form data
   */
  async processFileUploads(formData, formSchema) {
    const processedData = { ...formData };
    const fileFields = [];

    if (formSchema.sections) {
      formSchema.sections.forEach(section => {
        if (section.fields) {
          section.fields.forEach(field => {
            if (field.type === 'file') {
              fileFields.push(field.name);
            }
          });
        }
      });
    }

    for (const fieldName of fileFields) {
      const fileValue = formData[fieldName];
      if (!fileValue) {
        continue;
      }

      if (Array.isArray(fileValue)) {
        processedData[fieldName] = await Promise.all(fileValue.map(file => this.processFile(file)));
      } else {
        processedData[fieldName] = await this.processFile(fileValue);
      }
    }

    return processedData;
  }

  /**
   * Convert a File object to serializable payload
   */
  async processFile(file) {
    if (!file || !(file instanceof File)) {
      return file;
    }

    try {
      const base64 = await this.fileToBase64(file);

      return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        data: base64,
        processed: true
      };
    } catch (error) {
      console.error('Error processing file:', error);
      return {
        name: file.name,
        size: file.size,
        type: file.type,
        error: 'Failed to process file',
        processed: false
      };
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  generateSubmissionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

  async parseResponse(response) {
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return payload?.data !== undefined ? payload.data : payload;
  }

  /**
   * Submit a form to backend
   */
  async submitForm(formData, formSchema, options = {}) {
    const { validateBeforeSubmit = true, includeMetadata = true } = options;

    try {
      if (validateBeforeSubmit) {
        const validationResult = this.validateFormData(formData, formSchema);
        if (!validationResult.isValid) {
          return {
            success: false,
            error: 'Validation failed',
            details: validationResult.errors
          };
        }
      }

      const submissionData = await this.prepareSubmissionData(formData, formSchema, includeMetadata);
      const url = SIMPLE_API_CONFIG.getEndpointURL('submissions', 'create');

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(submissionData)
      });

      const result = await this.parseResponse(response);
      return {
        success: true,
        submissionId: result.submissionId || submissionData.submissionId,
        message: 'Form submitted successfully',
        data: result
      };
    } catch (error) {
      console.error('Form submission error:', error);
      return {
        success: false,
        error: 'Submission failed',
        details: error.message
      };
    }
  }

  /**
   * Get all submissions
   */
  async getSubmissions(options = {}) {
    const queryParams = new URLSearchParams(options).toString();
    const url = `${SIMPLE_API_CONFIG.getEndpointURL('submissions', 'getAll')}${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    return this.parseResponse(response);
  }

  /**
   * Get one submission
   */
  async getSubmission(submissionId) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('submissions', 'getById', { id: submissionId });
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    return this.parseResponse(response);
  }

  /**
   * Delete one submission
   */
  async deleteSubmission(submissionId) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('submissions', 'delete', { id: submissionId });
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    return this.parseResponse(response);
  }

  /**
   * Export submissions as CSV in browser
   */
  exportSubmissionsAsCSV(submissions) {
    if (!submissions || submissions.length === 0) {
      return '';
    }

    const fieldNames = new Set();
    submissions.forEach(submission => {
      Object.keys(submission.formData || {}).forEach(key => fieldNames.add(key));
    });

    const headers = ['Submission ID', 'Submitted At', ...Array.from(fieldNames)];
    const csvRows = [headers.join(',')];

    submissions.forEach(submission => {
      const row = [
        submission.submissionId,
        submission.submittedAt,
        ...Array.from(fieldNames).map(fieldName => {
          const value = submission.formData?.[fieldName];
          return `"${String(value || '').replace(/"/g, '""')}"`;
        })
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Export submissions via backend endpoint
   */
  async exportSubmissionsViaAPI(options = {}) {
    const { formId, ...restQuery } = options;
    if (!formId) {
      throw new Error('formId is required to export submissions');
    }

    const queryParams = new URLSearchParams(restQuery).toString();
    const exportUrl = SIMPLE_API_CONFIG.getEndpointURL(
      'submissions',
      'export',
      { formId }
    );
    const url = `${exportUrl}${queryParams ? `?${queryParams}` : ''}`;

    const response = await fetch(url, { headers: this.getAuthHeaders() });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.blob();
  }
}

const formSubmissionService = new FormSubmissionService();
export default formSubmissionService;
