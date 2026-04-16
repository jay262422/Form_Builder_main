import React, { useState, useEffect } from 'react';
import FormBuilder from '../FormBuilder';
import { generateSubmissionHandler } from '../utils/submissionHandler';
import fileFormManager from '../services/fileFormManager';

const FormTemplate = ({ 
  templateId, 
  formId, 
  style = 'centered',
  className = '',
  onSuccess,
  onError,
  onSubmitting,
  customStyle = null
}) => {
  const [formData, setFormData] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);

  useEffect(() => {
    loadFormAndTemplate();
  }, [templateId, formId]);

  const loadFormAndTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load template if templateId is provided
      if (templateId) {
        const savedTemplates = localStorage.getItem('formTemplates');
        if (savedTemplates) {
          const templates = JSON.parse(savedTemplates);
          const foundTemplate = templates.find(t => t.id === templateId);
          if (foundTemplate) {
            setTemplate(foundTemplate);
            // Use template's formId if not explicitly provided
            const targetFormId = formId || foundTemplate.formId;
            if (targetFormId) {
              await loadFormData(targetFormId);
            }
          } else {
            setError('Template not found');
          }
        } else {
          setError('No templates available');
        }
      } else if (formId) {
        // Load form directly if no template
        await loadFormData(formId);
      } else {
        setError('No form or template specified');
      }
    } catch (error) {
      console.error('Error loading form template:', error);
      setError('Failed to load form');
    } finally {
      setLoading(false);
    }
  };

  const loadFormData = async (targetFormId) => {
    try {
      const form = await fileFormManager.getFormByCustomId(targetFormId);
      setFormData(form);
    } catch (error) {
      console.error('Error loading form from API:', error);
      setError(`Failed to load form: ${targetFormId}. Please check if the form exists.`);
    }
  };

  const handleSubmit = formData ? generateSubmissionHandler(
    formData, 
    (submitting) => {
      setSubmitting(submitting);
      if (onSubmitting) onSubmitting(submitting);
    }, 
    (submitted) => {
      setSubmitted(submitted);
      if (onSuccess) onSuccess(submitted);
    }, 
    (error) => {
      setError(error);
      if (onError) onError(error);
    }, 
    setSubmittedData
  ) : null;

  const getStyleClasses = () => {
    // Use custom style if provided, otherwise use template style or default
    const styleConfig = customStyle || (template?.style) || getDefaultStyle(style);
    let classes = '';

    // Layout
    switch (styleConfig.layout) {
      case 'centered':
        classes += 'max-w-md mx-auto text-center ';
        break;
      case 'left-aligned':
        classes += 'max-w-lg ';
        break;
      case 'card':
        classes += 'max-w-md mx-auto bg-white rounded-lg shadow-lg ';
        break;
      case 'minimal':
        classes += 'max-w-sm mx-auto ';
        break;
      default:
        classes += 'max-w-md mx-auto ';
    }

    // Padding
    switch (styleConfig.padding) {
      case 'small':
        classes += 'p-4 ';
        break;
      case 'medium':
        classes += 'p-6 ';
        break;
      case 'large':
        classes += 'p-8 ';
        break;
      default:
        classes += 'p-6 ';
    }

    // Shadow
    switch (styleConfig.shadow) {
      case 'small':
        classes += 'shadow-sm ';
        break;
      case 'medium':
        classes += 'shadow-md ';
        break;
      case 'large':
        classes += 'shadow-lg ';
        break;
      case 'none':
        classes += '';
        break;
      default:
        classes += 'shadow-md ';
    }

    // Spacing
    switch (styleConfig.spacing) {
      case 'compact':
        classes += 'space-y-3 ';
        break;
      case 'comfortable':
        classes += 'space-y-4 ';
        break;
      case 'spacious':
        classes += 'space-y-6 ';
        break;
      default:
        classes += 'space-y-4 ';
    }

    return classes;
  };

  const getStyleObject = () => {
    const styleConfig = customStyle || (template?.style) || getDefaultStyle(style);
    return {
      backgroundColor: styleConfig.backgroundColor,
      color: styleConfig.textColor,
      borderRadius: styleConfig.borderRadius,
      border: `1px solid ${styleConfig.borderColor}`,
      fontFamily: styleConfig.typography?.fontFamily || 'Inter, sans-serif'
    };
  };

  const getDefaultStyle = (styleType) => {
    const defaults = {
      centered: {
        layout: 'centered',
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#E5E7EB',
        borderRadius: '8px',
        padding: 'large',
        shadow: 'medium',
        spacing: 'comfortable',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'large',
          textSize: 'medium'
        }
      },
      card: {
        layout: 'card',
        theme: 'light',
        primaryColor: '#10B981',
        secondaryColor: '#6B7280',
        backgroundColor: '#FFFFFF',
        textColor: '#1F2937',
        borderColor: '#F3F4F6',
        borderRadius: '8px',
        padding: 'medium',
        shadow: 'small',
        spacing: 'compact',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'medium',
          textSize: 'medium'
        }
      },
      minimal: {
        layout: 'minimal',
        theme: 'light',
        primaryColor: '#6B7280',
        secondaryColor: '#9CA3AF',
        backgroundColor: 'transparent',
        textColor: '#374151',
        borderColor: 'transparent',
        borderRadius: '0px',
        padding: 'small',
        shadow: 'none',
        spacing: 'compact',
        typography: {
          fontFamily: 'Inter',
          headingSize: 'medium',
          textSize: 'medium'
        }
      }
    };

    return defaults[styleType] || defaults.centered;
  };

  const shouldShowTitle = template?.settings?.showTitle !== false;
  const shouldShowDescription = template?.settings?.showDescription !== false;

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
        <p className="text-gray-500 text-sm">No form data available</p>
      </div>
    );
  }

  return (
    <div 
      className={`${getStyleClasses()} ${className}`}
      style={getStyleObject()}
    >
      {shouldShowTitle && (
        <h2 
          className="text-2xl font-bold mb-4" 
          style={{ 
            color: (customStyle || template?.style)?.textColor || '#1F2937',
            fontSize: (customStyle || template?.style)?.typography?.headingSize === 'large' ? '1.5rem' : '1.25rem'
          }}
        >
          {formData.name}
        </h2>
      )}
      
      {shouldShowDescription && formData.description && (
        <p 
          className="mb-6" 
          style={{ 
            color: (customStyle || template?.style)?.secondaryColor || '#6B7280',
            fontSize: (customStyle || template?.style)?.typography?.textSize === 'large' ? '1.125rem' : '1rem'
          }}
        >
          {formData.description}
        </p>
      )}
      
      <FormBuilder
        schema={formData.schema.sections}
        onSubmit={handleSubmit}
        loading={submitting}
        submitText="Submit"
        showCancel={false}
      />
    </div>
  );
};

export default FormTemplate;
