import React, { useState, useEffect } from 'react';

/**
 * AddressInput - Comprehensive address input component
 * Provides street, city, state, country, and zip code fields
 */
export default function AddressInput({
  field,
  value = {},
  onChange,
  formData = {},
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('AddressInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('AddressInput: field prop is undefined or null');
    return (
      <div className="address-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [address, setAddress] = useState(value || {});
  const includeCountry = field.includeCountry !== false;
  const includeState = field.includeState !== false;
  const includeCity = field.includeCity !== false;
  const includeZip = field.includeZip !== false;

  useEffect(() => {
    if (value !== address) {
      setAddress(value || {});
    }
  }, [value]);

  const updateAddress = (fieldName, fieldValue) => {
    const newAddress = { ...address, [fieldName]: fieldValue };
    setAddress(newAddress);
    onChange(newAddress);
  };

  const countries = [
    { value: 'us', label: 'United States' },
    { value: 'ca', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'au', label: 'Australia' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'in', label: 'India' },
    { value: 'jp', label: 'Japan' },
    { value: 'cn', label: 'China' },
    { value: 'br', label: 'Brazil' }
  ];

  const getStatesByCountry = (countryCode) => {
    const stateMap = {
      us: [
        { value: 'ca', label: 'California' },
        { value: 'ny', label: 'New York' },
        { value: 'tx', label: 'Texas' },
        { value: 'fl', label: 'Florida' },
        { value: 'il', label: 'Illinois' },
        { value: 'pa', label: 'Pennsylvania' },
        { value: 'oh', label: 'Ohio' },
        { value: 'ga', label: 'Georgia' },
        { value: 'nc', label: 'North Carolina' },
        { value: 'mi', label: 'Michigan' }
      ],
      ca: [
        { value: 'on', label: 'Ontario' },
        { value: 'qc', label: 'Quebec' },
        { value: 'bc', label: 'British Columbia' },
        { value: 'ab', label: 'Alberta' },
        { value: 'mb', label: 'Manitoba' },
        { value: 'sk', label: 'Saskatchewan' },
        { value: 'ns', label: 'Nova Scotia' },
        { value: 'nb', label: 'New Brunswick' },
        { value: 'nl', label: 'Newfoundland and Labrador' },
        { value: 'pe', label: 'Prince Edward Island' }
      ],
      uk: [
        { value: 'eng', label: 'England' },
        { value: 'sct', label: 'Scotland' },
        { value: 'wls', label: 'Wales' },
        { value: 'nir', label: 'Northern Ireland' }
      ],
      au: [
        { value: 'nsw', label: 'New South Wales' },
        { value: 'vic', label: 'Victoria' },
        { value: 'qld', label: 'Queensland' },
        { value: 'wa', label: 'Western Australia' },
        { value: 'sa', label: 'South Australia' },
        { value: 'tas', label: 'Tasmania' },
        { value: 'act', label: 'Australian Capital Territory' },
        { value: 'nt', label: 'Northern Territory' }
      ]
    };
    return stateMap[countryCode] || [];
  };

  return (
    <div className="address-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Address
        </span>
      </label>
      
      <div className="space-y-4">
        {/* Street Address */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Street Address
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={address.street || ''}
            onChange={(e) => updateAddress('street', e.target.value)}
            placeholder="Enter street address"
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* City */}
        {includeCity && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              City
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={address.city || ''}
              onChange={(e) => updateAddress('city', e.target.value)}
              placeholder="Enter city"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Country and State Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Country */}
          {includeCountry && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Country
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                value={address.country || ''}
                onChange={(e) => {
                  updateAddress('country', e.target.value);
                  updateAddress('state', ''); // Reset state when country changes
                }}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select country</option>
                {countries.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* State/Province */}
          {includeState && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                State/Province
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <select
                value={address.state || ''}
                onChange={(e) => updateAddress('state', e.target.value)}
                disabled={disabled || !address.country}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select state/province</option>
                {address.country && getStatesByCountry(address.country).map((state) => (
                  <option key={state.value} value={state.value}>
                    {state.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ZIP/Postal Code */}
        {includeZip && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ZIP/Postal Code
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={address.zip || ''}
              onChange={(e) => updateAddress('zip', e.target.value)}
              placeholder="Enter ZIP/postal code"
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
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
