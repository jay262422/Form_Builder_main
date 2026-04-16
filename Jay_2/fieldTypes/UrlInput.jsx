import React from 'react';
import TextInput from './TextInput';

/**
 * UrlInput - URL input field
 * Extends TextInput with URL-specific validation and styling
 */
export default function UrlInput({
  validation,
  ...props
}) {
  return (
    <TextInput
      {...props}
      type="url"
      autoComplete="url"
      placeholder={props.placeholder || "https://example.com"}
      validation={{
        pattern: validation?.pattern || '^https?:\\/\\/.+',
        ...validation
      }}
    />
  );
} 