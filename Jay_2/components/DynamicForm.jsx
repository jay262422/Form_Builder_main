import React, { useMemo } from 'react';
import FormSection from './FormSection';
import LayoutAwareFormSection from './LayoutAwareFormSection';
import { evaluateCondition } from '../utils/conditionHelpers';

/**
 * DynamicForm - Renders form based on schema
 * Handles conditional rendering, field dependencies, and dynamic options
 */
export default function DynamicForm({
  schema,
  formData,
  errors,
  touched,
  onFieldChange,
  onFieldBlur,
  disabled = false,
  formTheme = 'modern',
  theme = null,
  form = null
}) {
  // Handle both direct schema and formData with schema inside
  const sections = schema || (formData?.schema?.sections) || [];
  
  // Memoize visible sections based on conditions
  const visibleSections = useMemo(() => {
    return sections.filter(section => {
      if (section.condition) {
        return evaluateCondition(section.condition, formData);
      }
      return true;
    });
  }, [sections, formData]);

  return (
    <div className="dynamic-form space-y-6">
      {visibleSections.map((section, index) => {
        // Use LayoutAwareFormSection if form is provided, otherwise use regular FormSection
        const SectionComponent = form ? LayoutAwareFormSection : FormSection;
        
        return (
          <SectionComponent
            key={section.id || section.title || index}
            section={section}
            formData={formData}
            errors={errors}
            touched={touched}
            onFieldChange={onFieldChange}
            onFieldBlur={onFieldBlur}
            disabled={disabled}
            formTheme={formTheme}
            theme={theme}
            form={form}
          />
        );
      })}
    </div>
  );
} 