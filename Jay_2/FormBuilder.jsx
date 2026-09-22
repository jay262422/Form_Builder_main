import React, { useState, useCallback, useMemo, useEffect } from 'react';
import DynamicForm from './components/DynamicForm';
import FormValidator from './utils/FormValidator';
import { createInitialFormData } from './utils/formHelpers';
import { getFormUI } from './utils/uiHelpers';
import { convertCustomThemeToClasses, defaultFormThemeConfig } from './utils/themeConfigs';

/**
 * FormBuilder - Main component for creating dynamic forms
 * 
 * Features:
 * - Schema-driven form generation
 * - Validation with custom rules
 * - Conditional field visibility
 * - Dynamic field dependencies
 * - File uploads
 * - Multi-step forms
 * - Form state management
 * - Custom field types
 */
export default function FormBuilder({ 
  schema, 
  initialData = {}, 
  onSubmit, 
  onCancel,
  validationRules = {},
  className = "",
  submitText = "Submit",
  cancelText = "Cancel",
  showCancel = true,
  loading = false,
  disabled = false,
  onFormDataChange,
  formData: externalFormData,
  setFormData: externalSetFormData,
  theme = null, // Legacy theme prop, prefer 'form'
  form = null, // New: Pass the full form object for UI configuration
  showActions = true // New: Control whether to show action buttons
}) {
  // Debug logging for schema and form data
  console.log('🔍 FormBuilder: Received schema:', schema);
  console.log('🔍 FormBuilder: Received form:', form);
  console.log('🔍 FormBuilder: Initial data:', initialData);
  
  // Normalize schema format - handle both array and object formats
  const normalizedSchema = useMemo(() => {
    if (!schema) return [];
    
    // If schema is an array, use it directly
    if (Array.isArray(schema)) {
      return schema;
    }
    
    // If schema has sections property, use sections
    if (schema.sections && Array.isArray(schema.sections)) {
      return schema.sections;
    }
    
    // Fallback to empty array
    return [];
  }, [schema]);

  // Check for conditional logic in normalized schema
  if (normalizedSchema.length > 0) {
    normalizedSchema.forEach((section, sectionIndex) => {
      if (section.condition) {
        console.log(`🔍 FormBuilder: Section "${section.title}" has condition:`, section.condition);
      }
      
      if (section.fields) {
        section.fields.forEach((field, fieldIndex) => {
          if (field.condition) {
            console.log(`🔍 FormBuilder: Field "${field.name}" has condition:`, field.condition);
          }
        });
      }
    });
  }

  // Use external form data if provided (for wizard integration)
  const [internalFormData, setInternalFormData] = useState(() => createInitialFormData(normalizedSchema, initialData));
  const formData = externalFormData !== undefined ? externalFormData : internalFormData;
  const setFormData = externalSetFormData || setInternalFormData;
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Memoize validator instance
  const validator = useMemo(() => new FormValidator(validationRules), [validationRules]);

  // Handle form data changes for parent component notification
  useEffect(() => {
    if (onFormDataChange && formData !== initialData) {
      onFormDataChange(formData);
    }
  }, [formData, onFormDataChange, initialData]);

  // Get UI configuration from form or use default theme
  const uiConfig = form ? getFormUI(form) : null;
  
  // Create theme configuration from form's ui_part or use default
  const themeConfig = useMemo(() => {
    if (uiConfig && uiConfig.colors) {
      return convertCustomThemeToClasses(uiConfig);
    }
    return defaultFormThemeConfig;
  }, [uiConfig]);

  // Get button configuration from form settings
  const buttonConfig = form?.settings?.buttons || {
    submit: { text: submitText, show: true, customApiEndpoint: null },
    reset: { text: 'Reset', show: true },
    cancel: { text: cancelText, show: showCancel }
  };

  // Handle field value changes
  const handleFieldChange = useCallback((fieldName, value) => {
    console.log(`🔍 FormBuilder: Field "${fieldName}" changed to:`, value);
    
    setFormData(prevData => {
      const nextData = { ...prevData, [fieldName]: value };
      const clearChildren = (parentName) => {
        (normalizedSchema || []).forEach((section) => {
          (section.fields || []).forEach((field) => {
            if (!field.dynamicMapping || field.dependsOn !== parentName) return;
            const currentValue = nextData[field.name];
            const isEmpty = currentValue == null || currentValue === '' || (Array.isArray(currentValue) && currentValue.length === 0);
            if (isEmpty) return;
            nextData[field.name] = Array.isArray(currentValue) ? [] : '';
            clearChildren(field.name);
          });
        });
      };
      clearChildren(fieldName);
      return nextData;
    });
    
    // Clear field-specific errors when user starts typing
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      delete newErrors[fieldName];
      return newErrors;
    });
    
    // Mark field as touched
    setTouched(prevTouched => ({
      ...prevTouched,
      [fieldName]: true
    }));
  }, [normalizedSchema]);

  // Handle field blur for validation
  const handleFieldBlur = useCallback((fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate single field
    const fieldSchema = findFieldInSchema(normalizedSchema, fieldName);
    if (fieldSchema) {
      const fieldError = validator.validateField(fieldName, formData[fieldName], fieldSchema, formData);
      setErrors(prev => ({ ...prev, [fieldName]: fieldError }));
    }
  }, [normalizedSchema, formData, validator]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    normalizedSchema.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          allTouched[field.name] = true;
        });
      }
    });
    setTouched(allTouched);

    // Validate entire form
    const validationErrors = validator.validateForm(formData, normalizedSchema);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        await onSubmit?.(formData);
      } catch (error) {
        // Error handling is done by the parent component
        throw error;
      }
    }
  }, [formData, normalizedSchema, validator, onSubmit]);

  // Handle form reset
  const handleReset = useCallback(() => {
    setFormData(createInitialFormData(normalizedSchema, initialData));
    setErrors({});
    setTouched({});
  }, [normalizedSchema, initialData]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  // Generate CSS variables for custom theme
  const generateThemeCSS = useMemo(() => {
    if (!uiConfig || !uiConfig.colors) return {};
    
    return {
      '--form-primary-color': uiConfig.colors.primary || '#3B82F6',
      '--form-secondary-color': uiConfig.colors.secondary || '#F3F4F6',
      '--form-border-color': uiConfig.colors.border || '#D1D5DB',
      '--form-text-color': uiConfig.colors.text || '#111827',
      '--form-background-color': uiConfig.colors.background || '#FFFFFF',
      '--form-error-color': uiConfig.colors.error || '#EF4444',
      '--form-success-color': uiConfig.colors.success || '#10B981',
      '--form-warning-color': uiConfig.colors.warning || '#F59E0B',
      '--form-label-color': uiConfig.colors.label || '#374151',
      '--form-placeholder-color': uiConfig.colors.placeholder || '#9CA3AF',
      '--form-focus-color': uiConfig.colors.focus || '#3B82F6',
      '--form-section-color': uiConfig.colors.section || '#FFFFFF',
      
      '--form-field-padding': uiConfig.spacing?.fieldPadding || '12px',
      '--form-section-margin': uiConfig.spacing?.sectionMargin || '24px',
      '--form-border-radius': uiConfig.spacing?.borderRadius || '8px',
      '--form-field-spacing': uiConfig.spacing?.fieldSpacing || '16px',
      
      '--form-label-font-size': uiConfig.typography?.labelFontSize || '14px',
      '--form-label-font-weight': uiConfig.typography?.labelFontWeight || '500',
      '--form-input-font-size': uiConfig.typography?.inputFontSize || '16px',
      '--form-input-font-weight': uiConfig.typography?.inputFontWeight || '400',
      '--form-error-font-size': uiConfig.typography?.errorFontSize || '12px',
      '--form-error-font-weight': uiConfig.typography?.errorFontWeight || '400',
      '--form-font-family': uiConfig.typography?.fontFamily || 'system-ui'
    };
  }, [uiConfig]);

  return (
    <div 
      className={`dynamic-form-builder ${className} ${themeConfig.colors.background} p-6`}
      style={generateThemeCSS}
    >
      <DynamicForm
        schema={normalizedSchema}
        formData={formData}
        errors={errors}
        touched={touched}
        onFieldChange={handleFieldChange}
        onFieldBlur={handleFieldBlur}
        disabled={disabled}
        theme={theme} // Legacy theme prop, prefer 'form'
        form={form} // Pass form object for UI configuration
      />
      
      {/* Form Actions - Only show if showActions is true */}
      {showActions && (
        <div className="form-actions flex gap-3 mt-8">
          {/* Submit Button */}
          {buttonConfig.submit?.show !== false && (
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading || disabled}
              className={`px-8 py-3 ${themeConfig.colors.primary} rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg`}
            >
              {loading ? "Submitting..." : (buttonConfig.submit?.text || submitText)}
            </button>
          )}
          
          {/* Cancel Button */}
          {buttonConfig.cancel?.show !== false && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-8 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50 font-semibold"
            >
              {buttonConfig.cancel?.text || cancelText}
            </button>
          )}
          
          {/* Reset Button */}
          {buttonConfig.reset?.show !== false && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="px-8 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 font-semibold"
            >
              {buttonConfig.reset?.text || 'Reset'}
            </button>
          )}
        </div>
      )}
      
      {/* Custom CSS for theme variables */}
      {uiConfig && uiConfig.colors && (
        <style dangerouslySetInnerHTML={{
          __html: `
            .dynamic-form-builder {
              font-family: var(--form-font-family);
            }
            
            .dynamic-form-builder input,
            .dynamic-form-builder textarea,
            .dynamic-form-builder select {
              padding: var(--form-field-padding);
              border-radius: var(--form-border-radius);
              border: 1px solid var(--form-border-color);
              font-size: var(--form-input-font-size);
              font-weight: var(--form-input-font-weight);
              font-family: var(--form-font-family);
            }
            
            .dynamic-form-builder input:focus,
            .dynamic-form-builder textarea:focus,
            .dynamic-form-builder select:focus {
              outline: none;
              border-color: var(--form-focus-color);
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
            }
            
            .dynamic-form-builder input::placeholder,
            .dynamic-form-builder textarea::placeholder {
              color: var(--form-placeholder-color);
            }
            
            .dynamic-form-builder label {
              font-size: var(--form-label-font-size);
              font-weight: var(--form-label-font-weight);
              color: var(--form-label-color);
              font-family: var(--form-font-family);
            }
            
            .dynamic-form-builder button[type="submit"] {
              background-color: var(--form-primary-color);
              color: white;
              padding: var(--form-field-padding);
              border-radius: var(--form-border-radius);
              font-size: var(--form-input-font-size);
              font-weight: 500;
              font-family: var(--form-font-family);
            }
            
            .dynamic-form-builder .error-message {
              color: var(--form-error-color);
              font-size: var(--form-error-font-size);
              font-weight: var(--form-error-font-weight);
              font-family: var(--form-font-family);
            }
            
            .dynamic-form-builder .form-section {
              margin-bottom: var(--form-section-margin);
            }
            
            .dynamic-form-builder .form-field {
              margin-bottom: var(--form-field-spacing);
            }
          `
        }} />
      )}
    </div>
  );
}

// Helper function to find field in schema
function findFieldInSchema(schema, fieldName) {
  for (const section of schema) {
    if (section.fields) {
      for (const field of section.fields) {
        if (field.name === fieldName) {
          return field;
        }
      }
    }
  }
  return null;
} 