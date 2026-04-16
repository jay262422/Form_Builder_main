import React, { useState, useEffect } from 'react';

/**
 * PhoneAdvancedInput - Advanced phone input component
 * Supports country code, extension, and various formatting options
 */
export default function PhoneAdvancedInput({
  field,
  value = '',
  onChange,
  formData = {},
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('PhoneAdvancedInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('PhoneAdvancedInput: field prop is undefined or null');
    return (
      <div className="phone-advanced-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [phoneData, setPhoneData] = useState({
    countryCode: '+1',
    number: '',
    extension: ''
  });

  const includeCountryCode = field.includeCountryCode !== false;
  const includeExtension = field.includeExtension !== false;
  const format = field.format || 'international';

  useEffect(() => {
    if (typeof value === 'string' && value) {
      // Parse existing phone value
      const parsed = parsePhoneNumber(value);
      setPhoneData(parsed);
    } else if (typeof value === 'object' && value) {
      setPhoneData(value);
    }
  }, [value]);

  const parsePhoneNumber = (phoneString) => {
    // Simple parsing - can be enhanced
    const match = phoneString.match(/^(\+?\d{1,4})?[\s\-]?(\d{3,4})[\s\-]?(\d{3,4})[\s\-]?(\d{4})?[\s\-]?(\d+)?$/);
    if (match) {
      return {
        countryCode: match[1] || '+1',
        number: [match[2], match[3], match[4]].filter(Boolean).join(''),
        extension: match[5] || ''
      };
    }
    return { countryCode: '+1', number: phoneString.replace(/[^\d]/g, ''), extension: '' };
  };

  const updatePhoneData = (fieldName, fieldValue) => {
    const newPhoneData = { ...phoneData, [fieldName]: fieldValue };
    setPhoneData(newPhoneData);
    
    // Format the complete phone number
    const formattedNumber = formatPhoneNumber(newPhoneData);
    onChange(formattedNumber);
  };

  const formatPhoneNumber = (data) => {
    const { countryCode, number, extension } = data;
    let formatted = '';
    
    if (includeCountryCode && countryCode) {
      formatted += countryCode + ' ';
    }
    
    if (number) {
      switch (format) {
        case 'international':
          formatted += number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
          break;
        case 'national':
          formatted += number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
          break;
        case 'simple':
          formatted += number;
          break;
        default:
          formatted += number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
      }
    }
    
    if (includeExtension && extension) {
      formatted += ` ext. ${extension}`;
    }
    
    return formatted.trim();
  };

  const countryCodes = [
    { value: '+1', label: 'US/Canada (+1)' },
    { value: '+44', label: 'UK (+44)' },
    { value: '+61', label: 'Australia (+61)' },
    { value: '+91', label: 'India (+91)' },
    { value: '+86', label: 'China (+86)' },
    { value: '+81', label: 'Japan (+81)' },
    { value: '+49', label: 'Germany (+49)' },
    { value: '+33', label: 'France (+33)' },
    { value: '+39', label: 'Italy (+39)' },
    { value: '+34', label: 'Spain (+34)' },
    { value: '+31', label: 'Netherlands (+31)' },
    { value: '+46', label: 'Sweden (+46)' },
    { value: '+47', label: 'Norway (+47)' },
    { value: '+45', label: 'Denmark (+45)' },
    { value: '+358', label: 'Finland (+358)' },
    { value: '+48', label: 'Poland (+48)' },
    { value: '+420', label: 'Czech Republic (+420)' },
    { value: '+36', label: 'Hungary (+36)' },
    { value: '+40', label: 'Romania (+40)' },
    { value: '+421', label: 'Slovakia (+421)' }
  ];

  return (
    <div className="phone-advanced-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Advanced Phone
        </span>
      </label>
      
      <div className="space-y-3">
        {/* Country Code */}
        {includeCountryCode && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Country Code
            </label>
            <select
              value={phoneData.countryCode}
              onChange={(e) => updatePhoneData('countryCode', e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countryCodes.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Phone Number
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="tel"
            value={phoneData.number}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/[^\d]/g, '');
              updatePhoneData('number', cleaned);
            }}
            placeholder="Enter phone number"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Extension */}
        {includeExtension && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Extension (Optional)
            </label>
            <input
              type="text"
              value={phoneData.extension}
              onChange={(e) => updatePhoneData('extension', e.target.value)}
              placeholder="Enter extension"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Preview */}
        <div className="p-3 bg-gray-50 rounded-md">
          <div className="text-xs font-medium text-gray-600 mb-1">Preview:</div>
          <div className="text-sm text-gray-800 font-mono">
            {formatPhoneNumber(phoneData) || 'No phone number entered'}
          </div>
        </div>
      </div>
      
      {error && (
        <div className="mt-1 text-sm text-red-600">
          {error}
        </div>
      )}
      
      {field.helpText && (
        <div className="mt-1 text-sm text-gray-500">
          {field.helpText}
        </div>
      )}
    </div>
  );
}
