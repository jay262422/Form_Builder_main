import React from 'react';
import DynamicForm from '../DynamicForm';
import LayoutAwareFormSection from '../LayoutAwareFormSection';

/**
 * LivePreview - Component for showing real-time form preview with theme
 * Features:
 * - Real-time theme application
 * - Form preview with current theme
 * - Responsive preview
 * - Sample form data
 */
export default function LivePreview({ form, theme, className = '' }) {
  // Create a preview form that merges the current theme with the form's ui_part
  const createPreviewForm = () => {
    if (!form) {
      // Use sample form if no form provided
      return {
        id: 'preview-form',
        name: 'Sample Form',
        schema: {
          formType: 'multi-section',
          formTheme: 'modern',
          sections: [
            {
              title: 'Personal Information',
              fields: [
                {
                  name: 'firstName',
                  label: 'First Name',
                  type: 'text',
                  required: true,
                  placeholder: 'Enter your first name'
                },
                {
                  name: 'lastName',
                  label: 'Last Name',
                  type: 'text',
                  required: true,
                  placeholder: 'Enter your last name'
                },
                {
                  name: 'email',
                  label: 'Email Address',
                  type: 'email',
                  required: true,
                  placeholder: 'Enter your email'
                },
                {
                  name: 'phone',
                  label: 'Phone Number',
                  type: 'text',
                  placeholder: 'Enter your phone number'
                },
                {
                  name: 'message',
                  label: 'Message',
                  type: 'textarea',
                  placeholder: 'Enter your message',
                  rows: 4
                }
              ]
            }
          ]
        },
        ui_part: {
          themeId: 'default',
          layout: {
            firstName: 'half',
            lastName: 'half',
            email: 'full',
            phone: 'full',
            message: 'full'
          },
          sectionStyle: 'card',
          removeSectionBoxes: false
        }
      };
    }

    // Merge the current theme with the form's ui_part for live preview
    const mergedUI = {
      ...form.ui_part,
      layout: theme?.layout?.fieldWidths || form.ui_part?.layout || {},
      sectionStyle: theme?.layout?.sectionStyle || form.ui_part?.sectionStyle || 'card',
      removeSectionBoxes: theme?.layout?.removeSectionBoxes || form.ui_part?.removeSectionBoxes || false,
      colors: theme?.colors || form.ui_part?.colors || {},
      spacing: theme?.spacing || form.ui_part?.spacing || {},
      typography: theme?.typography || form.ui_part?.typography || {}
    };

    return {
      ...form,
      ui_part: mergedUI
    };
  };

  const previewForm = createPreviewForm();

  // Convert theme to CSS variables
  const generateThemeCSS = (theme) => {
    if (!theme) return {};
    
    return {
      '--form-primary-color': theme.colors?.primary || '#3B82F6',
      '--form-secondary-color': theme.colors?.secondary || '#F3F4F6',
      '--form-border-color': theme.colors?.border || '#D1D5DB',
      '--form-text-color': theme.colors?.text || '#111827',
      '--form-background-color': theme.colors?.background || '#FFFFFF',
      '--form-error-color': theme.colors?.error || '#EF4444',
      '--form-success-color': theme.colors?.success || '#10B981',
      '--form-warning-color': theme.colors?.warning || '#F59E0B',
      '--form-label-color': theme.colors?.label || '#374151',
      '--form-placeholder-color': theme.colors?.placeholder || '#9CA3AF',
      '--form-focus-color': theme.colors?.focus || '#3B82F6',
      '--form-section-color': theme.colors?.section || '#FFFFFF',
      
      '--form-field-padding': theme.spacing?.fieldPadding || '12px',
      '--form-section-margin': theme.spacing?.sectionMargin || '24px',
      '--form-border-radius': theme.spacing?.borderRadius || '8px',
      '--form-field-spacing': theme.spacing?.fieldSpacing || '16px',
      
      '--form-label-font-size': theme.typography?.labelFontSize || '14px',
      '--form-label-font-weight': theme.typography?.labelFontWeight || '500',
      '--form-input-font-size': theme.typography?.inputFontSize || '16px',
      '--form-input-font-weight': theme.typography?.inputFontWeight || '400',
      '--form-error-font-size': theme.typography?.errorFontSize || '12px',
      '--form-error-font-weight': theme.typography?.errorFontWeight || '400',
      '--form-font-family': theme.typography?.fontFamily || 'system-ui'
    };
  };

  // Handle form submission in preview
  const handlePreviewSubmit = (formData) => {
    console.log('Preview form submitted:', formData);
    // In preview mode, just log the data
  };

  // Apply theme styles
  const themeStyles = generateThemeCSS(theme);

  return (
    <div 
      className={`live-preview ${className}`}
      style={themeStyles}
    >
      {/* Preview Header */}
      <div className="mb-4 p-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Form Preview</h4>
            <p className="text-xs text-gray-500">Live preview with current theme</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="preview-content overflow-y-auto max-h-[500px] lg:max-h-[550px] xl:max-h-[600px]">
        <DynamicForm
          schema={previewForm.schema?.sections || previewForm.sections || []}
          formData={{}}
          errors={{}}
          touched={{}}
          onFieldChange={() => {}} // No-op in preview
          onFieldBlur={() => {}} // No-op in preview
          disabled={true} // Disable in preview mode
          theme={theme} // Pass theme to DynamicForm
          form={previewForm} // Pass merged form object for UI configuration
        />
      </div>

      {/* Preview Footer */}
      <div className="mt-4 p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Preview Mode - Form submission is disabled</span>
          <span>Theme: {theme?.name || 'Custom'}</span>
        </div>
      </div>

      {/* Custom CSS for theme preview */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .live-preview {
            font-family: var(--form-font-family);
          }
          
          .preview-form {
            color: var(--form-text-color);
            background-color: var(--form-background-color);
          }
          
          .preview-form .form-section {
            background-color: var(--form-section-color);
            margin-bottom: var(--form-section-margin);
          }
          
          .preview-form .form-section.no-box {
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          
          .preview-form .form-section:not(.no-box) {
            background-color: var(--form-section-color);
          }
          
          .preview-form input,
          .preview-form textarea,
          .preview-form select {
            padding: var(--form-field-padding);
            border-radius: var(--form-border-radius);
            border: 1px solid var(--form-border-color);
            font-size: var(--form-input-font-size);
            font-weight: var(--form-input-font-weight);
            font-family: var(--form-font-family);
          }
          
          .preview-form input:focus,
          .preview-form textarea:focus,
          .preview-form select:focus {
            outline: none;
            border-color: var(--form-focus-color);
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          }
          
          .preview-form input::placeholder,
          .preview-form textarea::placeholder {
            color: var(--form-placeholder-color);
          }
          
          .preview-form label {
            font-size: var(--form-label-font-size);
            font-weight: var(--form-label-font-weight);
            color: var(--form-label-color);
            font-family: var(--form-font-family);
          }
          
          .preview-form button[type="submit"] {
            background-color: var(--form-primary-color);
            color: white;
            padding: var(--form-field-padding);
            border-radius: var(--form-border-radius);
            font-size: var(--form-input-font-size);
            font-weight: 500;
            font-family: var(--form-font-family);
          }
          
          .preview-form .error-message {
            color: var(--form-error-color);
            font-size: var(--form-error-font-size);
            font-weight: var(--form-error-font-weight);
            font-family: var(--form-font-family);
          }
          
          .preview-form .form-section {
            margin-bottom: var(--form-section-margin);
          }
          
          .preview-form .form-field {
            margin-bottom: var(--form-field-spacing);
          }
          
          .preview-content {
            scrollbar-width: thin;
            scrollbar-color: #CBD5E0 #F7FAFC;
          }
          
          .preview-content::-webkit-scrollbar {
            width: 6px;
          }
          
          .preview-content::-webkit-scrollbar-track {
            background: #F7FAFC;
            border-radius: 3px;
          }
          
          .preview-content::-webkit-scrollbar-thumb {
            background: #CBD5E0;
            border-radius: 3px;
          }
          
          .preview-content::-webkit-scrollbar-thumb:hover {
            background: #A0AEC0;
          }
        `
      }} />
    </div>
  );
}
