/**
 * Form Manager Service
 * Handles saving, loading, editing, and managing forms
 * Currently uses localStorage, will be replaced with database calls later
 */

class FormManager {
  constructor() {
    this.storageKey = 'dynamic_forms';
    this.templates = this.getDefaultTemplates();
  }

  /**
   * Get default form templates
   */
  getDefaultTemplates() {
    return [
      {
        id: 'contact_form',
        name: 'Contact Form',
        description: 'Basic contact form with name, email, and message',
        schema: [
          {
            title: 'Contact Information',
            description: 'Please provide your contact details',
            fields: [
              {
                name: 'fullName',
                label: 'Full Name',
                type: 'text',
                placeholder: 'Enter your full name',
                required: true
              },
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                placeholder: 'Enter your email',
                required: true
              },
              {
                name: 'phone',
                label: 'Phone Number',
                type: 'phone',
                placeholder: 'Enter your phone number',
                required: false
              },
              {
                name: 'message',
                label: 'Message',
                type: 'textarea',
                placeholder: 'Enter your message',
                rows: 4,
                required: true
              }
            ]
          }
        ],
        isTemplate: true
      },
      {
        id: 'vendor_registration',
        name: 'Vendor Registration',
        description: 'Complete vendor onboarding form',
        schema: [
          {
            title: 'Company Information',
            description: 'Tell us about your company',
            fields: [
              {
                name: 'companyName',
                label: 'Company Name',
                type: 'text',
                placeholder: 'Enter company name',
                required: true
              },
              {
                name: 'industry',
                label: 'Primary Industry',
                type: 'select',
                optionType: 'industries',
                required: true
              },
              {
                name: 'businessType',
                label: 'Business Type',
                type: 'select',
                optionType: 'business_types',
                required: true
              },
              {
                name: 'yearsInBusiness',
                label: 'Years in Business',
                type: 'select',
                optionType: 'years_in_business',
                required: true
              }
            ]
          },
          {
            title: 'Service Categories',
            description: 'Select the services you provide',
            fields: [
              {
                name: 'serviceCategories',
                label: 'Service Categories',
                type: 'multiselect',
                optionType: 'categories',
                required: true
              },
              {
                name: 'serviceRegions',
                label: 'Service Regions',
                type: 'multiselect',
                optionType: 'service_regions',
                required: true
              }
            ]
          }
        ],
        isTemplate: true
      },
      {
        id: 'engineering_project',
        name: 'Engineering Project',
        description: 'Engineering project requirements form',
        schema: [
          {
            title: 'Project Details',
            description: 'Tell us about your engineering project',
            fields: [
              {
                name: 'industry',
                label: 'Industry',
                type: 'select',
                optionType: 'industries',
                required: true
              },
              {
                name: 'categories',
                label: 'Categories',
                type: 'multiselect',
                optionType: 'categories',
                required: true
              },
              {
                name: 'subcategories',
                label: 'Subcategories',
                type: 'multiselect',
                optionType: 'subcategories',
                required: true
              },
              {
                name: 'projectStage',
                label: 'Project Stage',
                type: 'select',
                options: [
                  { label: 'Planning', value: 'planning' },
                  { label: 'Design', value: 'design' },
                  { label: 'Development', value: 'development' },
                  { label: 'Testing', value: 'testing' },
                  { label: 'Deployment', value: 'deployment' },
                  { label: 'Maintenance', value: 'maintenance' }
                ],
                required: true
              }
            ]
          },
          {
            title: 'Additional Information',
            description: 'Provide additional details and documents',
            fields: [
              {
                name: 'instructions',
                label: 'Special Instructions',
                type: 'textarea',
                placeholder: 'Any special requirements or instructions',
                rows: 4,
                required: false
              },
              {
                name: 'documents',
                label: 'Relevant Documents',
                type: 'file',
                accept: '.pdf,.doc,.docx,.jpg,.png',
                multiple: true,
                required: false
              }
            ]
          }
        ],
        isTemplate: true
      },
      {
        id: 'wizard_test',
        name: 'Wizard Test Form',
        description: 'Test wizard form with multiple steps',
        schema: {
          formType: 'wizard',
          sections: [
            {
              title: 'Step 1: Basic Information',
              description: 'Enter your basic information',
              fields: [
                {
                  name: 'firstName',
                  label: 'First Name',
                  type: 'text',
                  placeholder: 'Enter your first name',
                  required: true
                },
                {
                  name: 'lastName',
                  label: 'Last Name',
                  type: 'text',
                  placeholder: 'Enter your last name',
                  required: true
                },
                {
                  name: 'email',
                  label: 'Email',
                  type: 'email',
                  placeholder: 'Enter your email',
                  required: true
                }
              ]
            },
            {
              title: 'Step 2: Preferences',
              description: 'Select your preferences',
              fields: [
                {
                  name: 'preferences',
                  label: 'Preferences',
                  type: 'multiselect',
                  options: [
                    { label: 'Option 1', value: 'option1' },
                    { label: 'Option 2', value: 'option2' },
                    { label: 'Option 3', value: 'option3' }
                  ],
                  required: true
                },
                {
                  name: 'comments',
                  label: 'Comments',
                  type: 'textarea',
                  placeholder: 'Any additional comments',
                  rows: 3,
                  required: false
                }
              ]
            }
          ]
        },
        isTemplate: true
      }
    ];
  }

  /**
   * Get all saved forms
   */
  getAllForms() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [];
      }
      const savedForms = localStorage.getItem(this.storageKey);
      return savedForms ? JSON.parse(savedForms) : [];
    } catch (error) {
      console.error('Error loading forms:', error);
      return [];
    }
  }

  /**
   * Get all templates
   */
  getTemplates() {
    return this.templates;
  }

  /**
   * Get all forms including templates
   */
  getAllFormsWithTemplates() {
    const savedForms = this.getAllForms();
    return [...this.templates, ...savedForms];
  }

  /**
   * Get a specific form by ID
   */
  getFormById(id) {
    const allForms = this.getAllFormsWithTemplates();
    return allForms.find(form => form.id === id);
  }

  /**
   * Save a new form
   */
  saveForm(formData) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      
      const forms = this.getAllForms();
      
      // Clean the form data to remove any circular references
      const cleanFormData = this.cleanFormData(formData);
      
      // Generate unique ID if not provided
      if (!cleanFormData.id) {
        cleanFormData.id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Add metadata
      cleanFormData.createdAt = new Date().toISOString();
      cleanFormData.updatedAt = new Date().toISOString();
      cleanFormData.isTemplate = false;
      
      // Check if form with same ID exists
      const existingIndex = forms.findIndex(form => form.id === cleanFormData.id);
      
      if (existingIndex !== -1) {
        // Update existing form
        forms[existingIndex] = { ...forms[existingIndex], ...cleanFormData, updatedAt: new Date().toISOString() };
      } else {
        // Add new form
        forms.push(cleanFormData);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(forms));
      return cleanFormData;
    } catch (error) {
      console.error('Error saving form:', error);
      throw new Error('Failed to save form');
    }
  }

  /**
   * Update an existing form
   */
  updateForm(id, updates) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      
      const forms = this.getAllForms();
      const formIndex = forms.findIndex(form => form.id === id);
      
      if (formIndex === -1) {
        throw new Error('Form not found');
      }
      
      // Clean the updates object to remove any circular references
      const cleanUpdates = this.cleanFormData(updates);
      
      forms[formIndex] = {
        ...forms[formIndex],
        ...cleanUpdates,
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem(this.storageKey, JSON.stringify(forms));
      return forms[formIndex];
    } catch (error) {
      console.error('Error updating form:', error);
      throw new Error('Failed to update form');
    }
  }

  /**
   * Delete a form
   */
  deleteForm(id) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      
      const forms = this.getAllForms();
      const filteredForms = forms.filter(form => form.id !== id);
      
      localStorage.setItem(this.storageKey, JSON.stringify(filteredForms));
      return true;
    } catch (error) {
      console.error('Error deleting form:', error);
      throw new Error('Failed to delete form');
    }
  }

  /**
   * Duplicate a form
   */
  duplicateForm(id) {
    try {
      const originalForm = this.getFormById(id);
      if (!originalForm) {
        throw new Error('Form not found');
      }
      
      const duplicatedForm = {
        ...originalForm,
        id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `${originalForm.name} (Copy)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTemplate: false
      };
      
      return this.saveForm(duplicatedForm);
    } catch (error) {
      console.error('Error duplicating form:', error);
      throw new Error('Failed to duplicate form');
    }
  }

  /**
   * Create form from template
   */
  createFromTemplate(templateId) {
    try {
      const template = this.getFormById(templateId);
      if (!template || !template.isTemplate) {
        throw new Error('Template not found');
      }
      
      const newForm = {
        ...template,
        id: `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: `New ${template.name}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isTemplate: false
      };
      
      return this.saveForm(newForm);
    } catch (error) {
      console.error('Error creating from template:', error);
      throw new Error('Failed to create from template');
    }
  }

  /**
   * Search forms by name or description
   */
  searchForms(query) {
    const allForms = this.getAllFormsWithTemplates();
    const searchTerm = query.toLowerCase();
    
    return allForms.filter(form => 
      form.name.toLowerCase().includes(searchTerm) ||
      (form.description && form.description.toLowerCase().includes(searchTerm))
    );
  }

  /**
   * Get form statistics
   */
  getFormStats() {
    const forms = this.getAllForms();
    const templates = this.getTemplates();
    
    return {
      totalForms: forms.length,
      totalTemplates: templates.length,
      totalItems: forms.length + templates.length,
      recentlyCreated: forms
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
  }

  /**
   * Export all forms (for backup)
   */
  exportForms() {
    try {
      const forms = this.getAllForms();
      const dataStr = JSON.stringify(forms, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `dynamic_forms_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      return true;
    } catch (error) {
      console.error('Error exporting forms:', error);
      throw new Error('Failed to export forms');
    }
  }

  /**
   * Import forms from JSON file
   */
  async importForms(file) {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      
      const text = await file.text();
      const importedForms = JSON.parse(text);
      
      if (!Array.isArray(importedForms)) {
        throw new Error('Invalid file format');
      }
      
      const existingForms = this.getAllForms();
      const mergedForms = [...existingForms, ...importedForms];
      
      localStorage.setItem(this.storageKey, JSON.stringify(mergedForms));
      return importedForms.length;
    } catch (error) {
      console.error('Error importing forms:', error);
      throw new Error('Failed to import forms');
    }
  }

  /**
   * Clear all forms (for testing)
   */
  clearAllForms() {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        throw new Error('localStorage not available');
      }
      
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing forms:', error);
      throw new Error('Failed to clear forms');
    }
  }

  /**
   * Clean form data to remove circular references and non-serializable objects
   */
  cleanFormData(data) {
    if (data === null || data === undefined) {
      return data;
    }

    // Handle primitive types
    if (typeof data !== 'object') {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.cleanFormData(item));
    }

    // Handle objects
    const cleaned = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip functions, DOM elements, and React components
      if (typeof value === 'function' || 
          (typeof value === 'object' && value !== null && 
           (value.nodeType !== undefined || value._reactInternalFiber !== undefined))) {
        continue;
      }
      
      cleaned[key] = this.cleanFormData(value);
    }
    
    return cleaned;
  }
}

// Create singleton instance
const formManager = new FormManager();

export default formManager; 