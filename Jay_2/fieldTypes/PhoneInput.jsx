import React from 'react';
import TextInput from './TextInput';

function formatPhone(raw, format) {
  const text = String(raw ?? '');
  const hasPlus = text.trim().startsWith('+');
  const digits = text.replace(/\D/g, '');

  if (format === 'national') {
    const local = digits.slice(0, 10);
    if (local.length <= 3) return local;
    if (local.length <= 6) return `(${local.slice(0, 3)}) ${local.slice(3)}`;
    return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  if (format === 'simple') {
    return digits.slice(0, 15);
  }

  const international = digits.slice(0, 15);
  return hasPlus ? `+${international}` : international;
}

/**
 * PhoneInput - Phone number input field
 * Extends TextInput with phone-specific formatting
 */
export default function PhoneInput({
  phoneFormat = 'international',
  autoFormat = true,
  onChange,
  ...props
}) {
  const handleChange = (nextValue) => {
    const formatted = autoFormat === false ? nextValue : formatPhone(nextValue, phoneFormat);
    onChange?.(formatted);
  };

  return (
    <TextInput
      {...props}
      onChange={handleChange}
      type="tel"
      autoComplete="tel"
      placeholder={props.placeholder || 'Enter your phone number'}
    />
  );
}
