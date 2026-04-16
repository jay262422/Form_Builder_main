import React from 'react';
import TextInput from './TextInput';

/**
 * DatePicker - Date input field
 * Extends TextInput with date-specific functionality
 */
export default function DatePicker({
  min,
  max,
  validation,
  ...props
}) {
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMin = validationConfig.min || min;
  const finalMax = validationConfig.max || max;

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