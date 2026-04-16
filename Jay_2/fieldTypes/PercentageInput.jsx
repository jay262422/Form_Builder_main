import React, { useState, useEffect } from 'react';

/**
 * PercentageInput - Percentage input component
 * Supports percentage formatting, validation, and range controls
 */
export default function PercentageInput({
  field,
  value = '',
  onChange,
  formData = {},
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('PercentageInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('PercentageInput: field prop is undefined or null');
    return (
      <div className="percentage-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [percentage, setPercentage] = useState('');
  const [displayValue, setDisplayValue] = useState('');

  const minValue = field.minValue || 0;
  const maxValue = field.maxValue || 100;
  const decimalPlaces = field.decimalPlaces || 2;
  const showSlider = field.showSlider !== false;

  useEffect(() => {
    if (value !== percentage) {
      setPercentage(value || '');
      formatDisplayValue(value || '');
    }
  }, [value]);

  const formatDisplayValue = (value) => {
    if (!value) {
      setDisplayValue('');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setDisplayValue('');
      return;
    }

    // Format with specified decimal places
    const formatted = numValue.toFixed(decimalPlaces);
    setDisplayValue(`${formatted}%`);
  };

  const handlePercentageChange = (e) => {
    const inputValue = e.target.value;
    
    // Remove percentage symbol and non-numeric characters
    const cleanValue = inputValue.replace(/[^\d.-]/g, '');
    
    // Validate numeric input
    if (cleanValue === '' || cleanValue === '-') {
      setPercentage('');
      setDisplayValue('');
      onChange('');
      return;
    }

    const numValue = parseFloat(cleanValue);
    if (isNaN(numValue)) {
      return;
    }

    // Apply min/max validation
    if (numValue < minValue) {
      return;
    }
    if (numValue > maxValue) {
      return;
    }

    setPercentage(numValue.toString());
    formatDisplayValue(numValue.toString());
    onChange(numValue.toString());
  };

  const handleSliderChange = (e) => {
    const sliderValue = parseFloat(e.target.value);
    setPercentage(sliderValue.toString());
    formatDisplayValue(sliderValue.toString());
    onChange(sliderValue.toString());
  };

  const getValidationStatus = () => {
    if (!percentage) return 'neutral';
    const numValue = parseFloat(percentage);
    if (numValue < minValue) return 'error';
    if (numValue > maxValue) return 'error';
    return 'success';
  };

  const validationStatus = getValidationStatus();

  return (
    <div className="percentage-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Percentage
        </span>
      </label>
      
      <div className="space-y-3">
        {/* Percentage Input */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Percentage Value
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              type="text"
              value={displayValue}
              onChange={handlePercentageChange}
              placeholder={`0.${'0'.repeat(decimalPlaces)}%`}
              disabled={disabled}
              className={`
                w-full pr-8 pl-3 py-2 border rounded-md focus:outline-none focus:ring-2
                ${validationStatus === 'error' ? 'border-red-500 focus:ring-red-200' : 
                  validationStatus === 'success' ? 'border-green-500 focus:ring-green-200' : 
                  'border-gray-300 focus:ring-blue-500'}
              `}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              %
            </span>
          </div>
        </div>

        {/* Slider */}
        {showSlider && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Adjust with slider
            </label>
            <div className="flex items-center space-x-3">
              <span className="text-xs text-gray-500 w-8">{minValue}%</span>
              <input
                type="range"
                min={minValue}
                max={maxValue}
                step={1 / Math.pow(10, decimalPlaces)}
                value={percentage || minValue}
                onChange={handleSliderChange}
                disabled={disabled}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-500 w-8">{maxValue}%</span>
            </div>
          </div>
        )}

        {/* Validation Info */}
        <div className="text-xs text-gray-500">
          <div>Range: {minValue}% - {maxValue}%</div>
          <div>Decimal places: {decimalPlaces}</div>
        </div>

        {/* Validation Status */}
        {percentage && (
          <div className={`text-xs p-2 rounded ${
            validationStatus === 'error' ? 'bg-red-50 text-red-700' :
            validationStatus === 'success' ? 'bg-green-50 text-green-700' :
            'bg-gray-50 text-gray-700'
          }`}>
            {validationStatus === 'error' && (
              <div>⚠️ Value must be between {minValue}% and {maxValue}%</div>
            )}
            {validationStatus === 'success' && (
              <div>✅ Valid percentage value</div>
            )}
          </div>
        )}

        {/* Preview */}
        {percentage && validationStatus === 'success' && (
          <div className="p-3 bg-gray-50 rounded-md">
            <div className="text-xs font-medium text-gray-600 mb-1">Formatted Value:</div>
            <div className="text-sm text-gray-800 font-mono">
              {displayValue}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Decimal value: {parseFloat(percentage).toFixed(decimalPlaces)}
            </div>
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
