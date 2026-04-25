import React from 'react';
import TextInput from './TextInput';

/**
 * TimePicker - Time input field
 * Extends TextInput with time-specific functionality
 */
export default function TimePicker({
  min,
  max,
  step,
  minTime,
  maxTime,
  validation,
  ...props
}) {
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMin = validationConfig.min || validationConfig.minTime || minTime || min;
  const finalMax = validationConfig.max || validationConfig.maxTime || maxTime || max;
  const finalStep = validationConfig.step || step;

  return (
    <TextInput
      {...props}
      type="time"
      min={finalMin}
      max={finalMax}
      step={finalStep}
      validation={validation}
      placeholder={props.placeholder || "Select time"}
    />
  );
} 
