import React, { useMemo } from 'react';
import FormField from './FormField';
import { getFormUI, getFieldWidthClass, getSectionStyleClasses } from '../utils/uiHelpers';
import { shouldShowField } from '../utils/conditionHelpers';

/**
 * LayoutAwareFormSection - Form section that applies layout settings
 * Features:
 * - Field width control
 * - Section styling options
 * - Side-by-side field arrangements
 */
export default function LayoutAwareFormSection({
  section,
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  disabled = false,
  theme = {},
  formTheme = 'modern',
  form = null
}) {
  // Get UI configuration from form or theme
  const uiConfig = form ? getFormUI(form) : (theme.layout || {});
  
  // Handle both ui_part format and theme format
  const fieldWidths = uiConfig.layout || uiConfig.fieldWidths || {};
  const sectionStyle = uiConfig.sectionStyle || 'card';
  const removeSectionBoxes = uiConfig.removeSectionBoxes || false;

  // Get section style classes
  const getSectionStyleClassesLocal = () => {
    return getSectionStyleClasses(sectionStyle, removeSectionBoxes);
  };

  // Get field width classes
  const getFieldWidthClassLocal = (fieldName) => {
    if (!fieldName) {
      console.warn('LayoutAwareFormSection: No fieldName provided to getFieldWidthClass');
      return 'w-full';
    }
    
    const width = fieldWidths[fieldName] || 'full';
    return getFieldWidthClass(width);
  };

  // Group fields by rows based on width
  const groupFieldsByRows = (fields) => {
    const rows = [];
    let currentRow = [];
    let currentRowWidth = 0;

    // Filter out invalid fields
    const validFields = fields.filter(field => field && field.name);

    validFields.forEach(field => {
      const fieldWidth = fieldWidths[field.name] || 'full';
      const widthValue = {
        'full': 1,
        'half': 0.5,
        'third': 0.33,
        'quarter': 0.25
      }[fieldWidth];

      if (currentRowWidth + widthValue > 1) {
        // Start new row
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [field];
        currentRowWidth = widthValue;
      } else {
        // Add to current row
        currentRow.push(field);
        currentRowWidth += widthValue;
      }
    });

    // Add the last row
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  };

  const visibleFields = useMemo(() => (
    (section.fields || []).filter((field) => shouldShowField(field, formData))
  ), [section.fields, formData]);

  const fieldRows = groupFieldsByRows(visibleFields);

  // Render section with or without container
  const sectionContent = (
    <div className="space-y-4">
      {/* Section Title (only show if not removing boxes) */}
      {!removeSectionBoxes && section.title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-gray-600 mt-1">{section.description}</p>
          )}
        </div>
      )}

      {/* Field Rows */}
      {fieldRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap -mx-2">
          {row.map((field) => {
            // Additional safety check
            if (!field || !field.name) {
              console.warn('LayoutAwareFormSection: Invalid field found:', field);
              return null;
            }
            
            return (
              <div key={field.name} className={`px-2 mb-4 ${getFieldWidthClassLocal(field.name)}`}>
                <FormField
                  field={field}
                  value={formData[field.name] ?? ''}
                  error={errors[field.name]}
                  touched={touched[field.name]}
                  onChange={(value) => onFieldChange(field.name, value)}
                  onBlur={() => onFieldBlur(field.name)}
                  disabled={disabled || field.disabled}
                  formData={formData}
                  formTheme={formTheme}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  // Return with or without container based on settings
  if (removeSectionBoxes) {
    return sectionContent;
  }

  return (
    <div className={`form-section ${getSectionStyleClassesLocal()}`}>
      {sectionContent}
    </div>
  );
}
