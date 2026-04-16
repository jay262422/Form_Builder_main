import React, { useMemo, useEffect, useState } from 'react';
import FieldRegistry from '../fieldTypes/FieldRegistry';
import { getDynamicOptions } from '../utils/fieldHelpers';
import dynamicMappingsService from '../services/dynamicMappingsService';
import fieldOptionsService from '../services/fieldOptionsService';
import { builderThemeConfigs } from '../utils/themeConfigs';

// Use shared theme configurations
const themeConfigs = builderThemeConfigs;

/**
 * FormField - Renders individual form fields
 * Handles field validation, dynamic options, and proper field rendering
 */
export default function FormField({
  field,
  value,
  error,
  touched,
  onChange,
  onBlur,
  disabled = false,
  formData = {},
  formTheme = 'modern'
}) {
  // Add fallback for when field is undefined
  if (!field) {
    console.warn('FormField: No field provided');
    return null;
  }

  // Add fallback for when field type is undefined
  if (!field.type) {
    console.warn('FormField: No field type provided for field:', field.name || 'unnamed');
    return null;
  }


  
  // Additional safety checks for field properties
  if (!field.name || !field.type) {
    console.error('FormField: field is missing required properties (name or type):', field);
    return (
      <div className="form-field">
        <div className="text-red-500 text-sm">Error: Field configuration is incomplete</div>
      </div>
    );
  }

  const [dynamicOptions, setDynamicOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Handle backend-driven dynamic options
  useEffect(() => {
    if (!field) {
      return;
    }
    
    const loadDynamicOptions = async () => {
      if (!field.dynamicMapping || !field.dependsOn) {
        return;
      }

      const parentValue = formData[field.dependsOn];
      
      if (!parentValue) {
        setDynamicOptions([]);
        return;
      }

      setLoadingOptions(true);
      try {
        // Get child options based on parent value and mapping
        const options = await dynamicMappingsService.getChildOptions(field.dynamicMapping, parentValue);
        setDynamicOptions(options);
      } catch (error) {
        console.error(`Error loading dynamic options for ${field.name}:`, error);
        setDynamicOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadDynamicOptions();
  }, [field.dynamicMapping, field.dependsOn, formData[field.dependsOn]]);

  // Handle backend option types
  useEffect(() => {
    if (!field) {
      return;
    }
    
    const loadOptionTypeOptions = async () => {
      if (!field.optionType || field.dynamicMapping) {
        return; // Skip if using dynamic mapping or no option type
      }

      setLoadingOptions(true);
      try {
        const options = await fieldOptionsService.getOptionType(field.optionType);
        setDynamicOptions(options);
      } catch (error) {
        console.error(`Error loading option type for ${field.name}:`, error);
        setDynamicOptions([]);
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptionTypeOptions();
  }, [field.optionType, field.dynamicMapping]);

  // Get options for the field
  const options = useMemo(() => {
    // Safety check for field
    if (!field) {
      console.warn('FormField: No field provided to options useMemo');
      return [];
    }
    
    // Priority: 1. getOptions function (like engineering form), 2. Dynamic mapping options, 3. Option type options, 4. Static options
    
    // ✅ RECONSTRUCT getOptions from dynamicConfig if available
    let getOptionsFunction = field.getOptions;
    
    // Handle case where getOptions is stored as a string (from JSON)
    if (typeof getOptionsFunction === 'string') {
      try {
        // The string contains just the function body, so we need to wrap it
        // Check if it already has a return statement
        const trimmedFunction = getOptionsFunction.trim();
        if (trimmedFunction.startsWith('return ')) {
          getOptionsFunction = new Function('field', 'formData', getOptionsFunction);
        } else if (trimmedFunction.includes('return ')) {
          // Function has return statement but not at the beginning
          getOptionsFunction = new Function('field', 'formData', getOptionsFunction);
        } else {
          // No return statement, add one
          getOptionsFunction = new Function('field', 'formData', `return ${getOptionsFunction}`);
        }
      } catch (error) {
        console.error('Error parsing getOptions function:', error);
        getOptionsFunction = null;
      }
    }
    
    // If no getOptions function but has dynamicConfig (builder approach), reconstruct it
    if (!getOptionsFunction && field.dynamicConfig) {
      console.log(`🔍 FormField: Reconstructing getOptions from dynamicConfig for ${field.name}`);
      console.log(`🔍 FormField: dynamicConfig:`, field.dynamicConfig);
      
      getOptionsFunction = (field, formData) => {
        const parentValue = formData[field.dynamicConfig.parentField];
        console.log(`🔍 FormField: Parent field: ${field.dynamicConfig.parentField}, Parent value: ${parentValue}`);
        
        if (!parentValue) {
          console.log(`🔍 FormField: No parent value, returning empty array`);
          return [];
        }
        
        const childOptions = field.dynamicConfig.mappingData[parentValue] || [];
        console.log(`🔍 FormField: Found ${childOptions.length} options for parent value "${parentValue}":`, childOptions);
        
        return childOptions;
      };
    }
    
    if (getOptionsFunction) {
      const getOptionsResult = getOptionsFunction(field, formData);
      return getOptionsResult;
    }
    
    if (field.dynamicMapping && dynamicOptions.length > 0) {
      return dynamicOptions;
    }
    
    if (field.optionType && dynamicOptions.length > 0) {
      return dynamicOptions;
    }
    
    // If field has dynamic mapping but no dynamic options yet, return empty array
    if (field.dynamicMapping && dynamicOptions.length === 0) {
      return [];
    }
    
    const staticOptions = field.options || [];
    return staticOptions;
  }, [field, formData, dynamicOptions]);

  // Get the appropriate field component
  const FieldComponent = FieldRegistry[field.type];
  
  if (!FieldComponent) {
    console.warn(`Unknown field type: ${field.type || 'undefined'}`);
    return (
      <div className="form-field">
        <div className="text-red-500 text-sm">Error: Unknown field type "{field.type || 'undefined'}"</div>
      </div>
    );
  }

  // Get theme configuration
  const theme = themeConfigs[formTheme] || themeConfigs.modern;

  // Check if this is a Phase 3 component that expects the field prop
  const phase3FieldTypes = ['rating', 'color', 'calculated', 'signature', 'repeater', 'address', 'phone_advanced', 'currency', 'percentage'];
  const isPhase3Component = phase3FieldTypes.includes(field.type);

  // Prepare field props - filter out non-DOM props
  const { 
    getOptions, 
    condition, 
    dynamicMapping, 
    dependsOn, 
    optionType, 
    inputType,
    // Additional props that should not be passed to DOM elements
    validation,
    styling,
    helpText,
    defaultValue,
    // More custom props to filter out
    showWhen,
    calculateFrom,
    ...fieldProps 
  } = field;

  let finalFieldProps;
  
  if (isPhase3Component) {
    // For Phase 3 components, pass the field prop along with other props
    finalFieldProps = {
      field: field, // Pass the complete field object
      value,
      options,
      onChange,
      onBlur,
      disabled: disabled || loadingOptions,
      error: touched && error,
      formTheme: formTheme,
      theme: theme,
      formData // Pass formData for calculated fields
    };
  } else {
    // For existing components, use the individual props approach
    finalFieldProps = {
      ...fieldProps,
      value,
      options,
      onChange,
      onBlur,
      disabled: disabled || loadingOptions,
      error: touched && error,
      formTheme: formTheme,
      theme: theme
    };
  }

  return (
    <div className={`form-field ${field.className || ''}`}>
      <FieldComponent {...finalFieldProps} />
      {loadingOptions && (
        <div className="text-xs text-blue-600 mt-1">
          Loading options...
        </div>
      )}
      {touched && error && (
        <div className="error-message text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
} 