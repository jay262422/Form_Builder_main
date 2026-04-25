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
  async prepareSubmissionData(formData, formSchema, includeMetadata = true, metadataOverrides = {}) {
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
        formName: formSchema.name || 'Untitled Form',
        formType: metadataOverrides.formType || formSchema.formType || 'multi-section',
        fieldCount: Array.isArray(formSchema.sections)
          ? formSchema.sections.reduce((total, section) => total + (section.fields?.length || 0), 0)
          : 0,
        submissionMode: metadataOverrides.source || 'form-page',
        ...metadataOverrides
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
        processedData[fieldName] = await Promise.all(fileValue.map(file => this.processFile(file, formSchema, fieldName)));
      } else {
        processedData[fieldName] = await this.processFile(fileValue, formSchema, fieldName);
      }
    }

    return processedData;
  }

  /**
   * Convert a File object to serializable payload
   */
  getUploadHeaders() {
    const headers = {};

    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async uploadFile(file, formSchema, fieldName) {
    const formId = formSchema?.id;
    if (!formId) {
      throw new Error('formId is required to upload files');
    }

    const formData = new FormData();
    formData.append('file', file);
    if (fieldName) {
      formData.append('fieldName', fieldName);
    }

    const url = SIMPLE_API_CONFIG.getEndpointURL('uploads', 'uploadForForm', { formId });
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getUploadHeaders(),
      body: formData
    });

    return this.parseResponse(response);
  }

  async processFile(file, formSchema, fieldName) {
    if (!file || !(file instanceof File)) {
      return file;
    }

    try {
      const uploadedFile = await this.uploadFile(file, formSchema, fieldName);
      return {
        ...uploadedFile,
        lastModified: file.lastModified
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

  buildQueryString(params = {}) {
    const sanitizedEntries = Object.entries(params).filter(([, value]) => (
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== 'undefined' &&
      value !== 'null'
    ));

    return new URLSearchParams(sanitizedEntries).toString();
  }

  /**
   * Submit a form to backend
   */
  async submitForm(formData, formSchema, options = {}) {
    const { validateBeforeSubmit = true, includeMetadata = true, ...metadataOverrides } = options;

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

      const submissionData = await this.prepareSubmissionData(formData, formSchema, includeMetadata, metadataOverrides);
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
    const queryParams = this.buildQueryString(options);
    const url = `${SIMPLE_API_CONFIG.getEndpointURL('submissions', 'getAll')}${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    return this.parseResponse(response);
  }

  /**
   * Get submissions for a specific form
   */
  async getSubmissionsByForm(formId, options = {}) {
    if (!formId) {
      throw new Error('formId is required to load submissions');
    }

    const queryParams = this.buildQueryString(options);
    const formUrl = SIMPLE_API_CONFIG.getEndpointURL('submissions', 'getByForm', { formId });
    const url = `${formUrl}${queryParams ? `?${queryParams}` : ''}`;
    const response = await fetch(url, { headers: this.getAuthHeaders() });
    return this.parseResponse(response);
  }

  async getAllSubmissionsByForm(formId, options = {}) {
    if (!formId) {
      throw new Error('formId is required to load submissions');
    }

    const pageSize = options.limit || 100;
    let currentPage = 1;
    let totalPages = 1;
    const allSubmissions = [];

    do {
      const result = await this.getSubmissionsByForm(formId, {
        ...options,
        limit: pageSize,
        page: currentPage
      });

      const submissions = result?.submissions || [];
      allSubmissions.push(...submissions);
      totalPages = Math.max(result?.totalPages || 1, 1);
      currentPage += 1;
    } while (currentPage <= totalPages);

    return allSubmissions;
  }

  /**
   * Get submission statistics for a specific form
   */
  async getSubmissionStats(formId) {
    if (!formId) {
      throw new Error('formId is required to load submission stats');
    }

    const url = SIMPLE_API_CONFIG.getEndpointURL('submissions', 'getStats', { formId });
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
   * Delete all submissions for a specific form by iterating existing records
   */
  async clearSubmissionsByForm(formId) {
    const submissions = await this.getAllSubmissionsByForm(formId, {
      limit: 500,
      sortBy: 'submittedAt',
      sortOrder: 'desc'
    });
    await Promise.all(submissions.map((submission) => this.deleteSubmission(submission.submissionId)));

    return {
      success: true,
      cleared: submissions.length
    };
  }

  normalizeExportValue(value) {
    if (value === null || value === undefined) {
      return '';
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.normalizeExportValue(item))
        .filter(Boolean)
        .join(' | ');
    }

    if (typeof value === 'object') {
      if (value.name && value.type) {
        return `${value.name} (${value.type})`;
      }

      try {
        return JSON.stringify(value);
      } catch (error) {
        return String(value);
      }
    }

    return String(value);
  }

  buildExportRows(submissions, selectedColumns = null) {
    if (!submissions || submissions.length === 0) {
      return [];
    }

    const rows = submissions.map((submission) => {
      const metadata = submission.metadata || {};
      const row = {
        submissionId: submission.submissionId || '',
        submittedAt: submission.submittedAt || '',
        formId: submission.formId || '',
        formName: metadata.formName || '',
        formType: metadata.formType || '',
        submissionMode: metadata.submissionMode || '',
        fieldCount: metadata.fieldCount ?? '',
        submitter: submission.user?.name || submission.user?.email || metadata.submittedBy || 'Anonymous',
        submitterEmail: submission.user?.email || metadata.submitterEmail || '',
        ipAddress: metadata.ipAddress || ''
      };

      Object.entries(submission.formData || {}).forEach(([key, value]) => {
        row[`field_${key}`] = this.normalizeExportValue(value);
      });

      return row;
    });

    if (!selectedColumns || selectedColumns.length === 0) {
      return rows;
    }

    return rows.map((row) => selectedColumns.reduce((filteredRow, columnKey) => {
      filteredRow[columnKey] = row[columnKey] ?? '';
      return filteredRow;
    }, {}));
  }

  getAvailableExportColumns(submissions) {
    const rows = this.buildExportRows(submissions);
    const columns = rows.reduce((columnSet, row) => {
      Object.keys(row).forEach((key) => columnSet.add(key));
      return columnSet;
    }, new Set());

    return Array.from(columns).map((key) => ({
      key,
      label: key.startsWith('field_')
        ? `Field: ${key.replace(/^field_/, '')}`
        : key.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase())
    }));
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export submissions as CSV in browser
   */
  exportSubmissionsAsCSV(submissions, selectedColumns = null) {
    const rows = this.buildExportRows(submissions, selectedColumns);
    if (rows.length === 0) {
      return '';
    }

    const headers = Array.from(
      rows.reduce((headerSet, row) => {
        Object.keys(row).forEach((key) => headerSet.add(key));
        return headerSet;
      }, new Set())
    );

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvRows = [headers.map(escapeCsv).join(',')];

    rows.forEach((row) => {
      csvRows.push(headers.map((header) => escapeCsv(row[header])).join(','));
    });

    return csvRows.join('\n');
  }

  exportSubmissionsAsExcel(submissions, selectedColumns = null) {
    const rows = this.buildExportRows(submissions, selectedColumns);
    if (rows.length === 0) {
      return null;
    }

    const headers = Array.from(
      rows.reduce((headerSet, row) => {
        Object.keys(row).forEach((key) => headerSet.add(key));
        return headerSet;
      }, new Set())
    );

    const escapeHtml = (value) => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const tableHeaders = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
    const tableRows = rows.map((row) => (
      `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? '')}</td>`).join('')}</tr>`
    )).join('');

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
      th { background: #f3f4f6; font-weight: 600; }
    </style>
  </head>
  <body>
    <table>
      <thead><tr>${tableHeaders}</tr></thead>
      <tbody>${tableRows}</tbody>
    </table>
  </body>
</html>`;
  }

  /**
   * Export submissions via backend endpoint
   */
  async exportSubmissionsViaAPI(options = {}) {
    const { formId, ...restQuery } = options;
    if (!formId) {
      throw new Error('formId is required to export submissions');
    }

    const queryParams = this.buildQueryString(restQuery);
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
