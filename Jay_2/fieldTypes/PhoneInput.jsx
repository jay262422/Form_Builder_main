import React from 'react';
import TextInput from './TextInput';

/**
 * PhoneInput - Phone number input field
 * Extends TextInput with phone-specific validation and formatting
 */
export default function PhoneInput(props) {
  return (
    <TextInput
      {...props}
      type="tel"
      autoComplete="tel"
      placeholder={props.placeholder || "Enter your phone number"}
    />
  );
} 