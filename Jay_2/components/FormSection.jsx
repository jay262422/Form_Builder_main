import React, { useMemo } from 'react';
import FormField from './FormField';
import { evaluateCondition } from '../utils/conditionHelpers';

// Theme configurations with enhanced visual differences
const themeConfigs = {
  modern: {
    name: 'Modern',
    description: 'Clean, professional design with subtle shadows',
    colors: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200',
      border: 'border-gray-200',
      text: 'text-gray-900',
      section: 'bg-white shadow-lg border border-gray-200 rounded-lg',
      field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
      background: 'bg-gray-50',
      label: 'text-gray-700 font-medium'
    }
  },
  'contact-layout': {
    name: 'Contact Layout',
    description: 'Original contact form layout with side-by-side fields',
    colors: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-100 hover:bg-gray-200',
      border: 'border-gray-300',
      text: 'text-gray-900',
      section: 'bg-transparent border-0 shadow-none',
      field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500',
      background: 'bg-transparent',
      label: 'text-gray-700 font-medium'
    }
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional design with company green branding',
    colors: {
      primary: 'bg-green-600 hover:bg-green-700 text-white',
      secondary: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-200',
      text: 'text-gray-900',
      section: 'bg-white shadow-lg border-2 border-green-200 rounded-xl',
      field: 'bg-white border-2 border-green-300 focus:border-green-600 focus:ring-2 focus:ring-green-200',
      background: 'bg-gradient-to-br from-green-50 to-emerald-50',
      label: 'text-green-800 font-semibold'
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple, clean design with minimal styling',
    colors: {
      primary: 'bg-black hover:bg-gray-800 text-white',
      secondary: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-gray-100',
      text: 'text-gray-900',
      section: 'bg-white border-0 shadow-none',
      field: 'bg-white border-b-2 border-gray-200 focus:border-black focus:ring-0',
      background: 'bg-white',
      label: 'text-gray-900 font-light'
    }
  },
  colorful: {
    name: 'Colorful',
    description: 'Vibrant design with colorful accents',
    colors: {
      primary: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white',
      secondary: 'bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100',
      border: 'border-purple-200',
      text: 'text-gray-900',
      section: 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl rounded-xl',
      field: 'bg-white border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200',
      background: 'bg-gradient-to-br from-purple-100 to-pink-100',
      label: 'text-purple-800 font-semibold'
    }
  },
  professional: {
    name: 'Professional',
    description: 'Clean, modern design like vendor registration forms',
    colors: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-50 hover:bg-gray-100',
      border: 'border-gray-200',
      text: 'text-gray-900',
      section: 'bg-white shadow-sm border border-gray-200 rounded-lg',
      field: 'bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200',
      background: 'bg-gray-50',
      label: 'text-gray-700 font-medium'
    }
  }
};

/**
 * FormSection - Renders a form section with title and fields
 * Handles conditional field rendering and dynamic options
 */
export default function FormSection({
  section,
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  disabled = false,
  formTheme = 'modern'
}) {
  // Check section-level condition first
  if (section.condition) {
    console.log('🔍 FormSection: Section has condition:', section.title, 'Condition:', section.condition);
    const shouldShowSection = evaluateCondition(section.condition, formData);
    console.log('🔍 FormSection: Section condition result:', section.title, 'Should show section:', shouldShowSection);
    
    if (!shouldShowSection) {
      console.log('🔍 FormSection: Hiding entire section due to condition:', section.title);
      return null;
    }
  }

  // Memoize visible fields based on conditions
  const visibleFields = useMemo(() => {
    if (!section.fields) return [];
    
    console.log('🔍 FormSection: Processing fields for section:', section.title, 'Fields:', section.fields);
    console.log('🔍 FormSection: Current formData:', formData);
    
    return section.fields.filter(field => {
      if (field.condition) {
        console.log('🔍 FormSection: Field has condition:', field.name, 'Condition:', field.condition, 'Condition type:', typeof field.condition);
        const shouldShow = evaluateCondition(field.condition, formData);
        console.log('🔍 FormSection: Field condition result:', field.name, 'Should show:', shouldShow, 'Field value in formData:', formData[field.condition.field || field.condition]);
        return shouldShow;
      }
      return true;
    });
  }, [section.fields, formData]);

  // Don't render section if no visible fields
  if (visibleFields.length === 0) {
    return null;
  }

  console.log('FormSection: Rendering visible fields:', visibleFields);

  const theme = themeConfigs[formTheme] || themeConfigs.modern;

  return (
    <div className={`form-section ${section.className || ''} ${theme.colors.section} p-6 mb-6`}>
      {section.title && (
        <div className="section-header mb-6">
          <h3 className={`text-xl font-bold ${theme.colors.text} border-b-2 ${theme.colors.border} pb-3`}>
            {section.title}
          </h3>
          {section.description && (
            <p className={`text-sm ${theme.colors.text} opacity-75 mt-2`}>{section.description}</p>
          )}
        </div>
      )}
      
      <div className={`section-content ${section.layout || 'grid grid-cols-1 gap-6'}`}>
        {visibleFields.map((field, index) => (
          <FormField
            key={field.name || index}
            field={field}
            value={formData[field.name]}
            error={errors[field.name]}
            touched={touched[field.name]}
            onChange={(value) => onFieldChange(field.name, value)}
            onFieldChange={onFieldChange}
            onBlur={() => onFieldBlur(field.name)}
            disabled={disabled || field.disabled}
            formData={formData}
            formTheme={formTheme}
          />
        ))}
      </div>
    </div>
  );
} 