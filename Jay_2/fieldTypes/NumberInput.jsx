import React from 'react';
import TextInput from './TextInput';

/**
 * NumberInput - Numeric input field
 * Extends TextInput with number-specific validation and formatting
 */
export default function NumberInput({
  min,
  max,
  step,
  validation,
  // Additional custom props that should not be passed to DOM
  showWhen,
  calculateFrom,
  condition,
  dependsOn,
  dynamicMapping,
  optionType,
  inputType,
  getOptions,
  styling,
  helpText,
  defaultValue,
  ...props
}) {
  // Use validation object if provided, otherwise fall back to individual props
  const validationConfig = validation || {};
  const finalMin = validationConfig.min || min;
  const finalMax = validationConfig.max || max;
  const finalStep = validationConfig.step || step;

  return (
    <TextInput
      {...props}
      type="number"
      min={finalMin}
      max={finalMax}
      step={finalStep}
      validation={validation}
      placeholder={props.placeholder || "Enter a number"}
    />
  );
} 