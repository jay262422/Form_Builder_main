import React from 'react';
import TextInput from './TextInput';

/**
 * DatePicker - Date input field
 * Extends TextInput with date-specific functionality
 */
export default function DatePicker({
  min,
  max,
  minDate,
  maxDate,
  validation,
  ...props
}) {
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMin = validationConfig.min || validationConfig.minDate || minDate || min;
  const finalMax = validationConfig.max || validationConfig.maxDate || maxDate || max;

  return (
    <TextInput
      {...props}
      type="date"
      min={finalMin}
      max={finalMax}
      validation={validation}
      placeholder={props.placeholder || "Select a date"}
    />
  );
} 
