import React from 'react';
import Select from './Select';

/**
 * MultiSelect - Multi-selection dropdown field
 * Extends Select with multiple selection capabilities
 */
export default function MultiSelect(props) {
  return (
    <Select
      {...props}
      multiple={true}
    />
  );
} 