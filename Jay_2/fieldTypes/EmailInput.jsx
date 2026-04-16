import React from 'react';
import TextInput from './TextInput';

/**
 * EmailInput - Email-specific input field
 * Extends TextInput with email validation and styling
 */
export default function EmailInput({
  // Additional custom props that should not be passed to DOM
  showWhen,
  calculateFrom,
  condition,
  dependsOn,
  dynamicMapping,
  optionType,
  inputType,
  getOptions,
  validation,
  styling,
  helpText,
  defaultValue,
  ...props
}) {
  return (
    <TextInput
      {...props}
      type="email"
      autoComplete="email"
      placeholder={props.placeholder || "Enter your email address"}
    />
  );
} 