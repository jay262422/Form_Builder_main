import React, { useState } from 'react';

/**
 * ColorInput - Color picker component
 * Supports preset colors, custom color input, and color preview
 */
export default function ColorInput({
  field,
  value = '#3B82F6',
  onChange,
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('ColorInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('ColorInput: field prop is undefined or null');
    return (
      <div className="color-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [hexInputValue, setHexInputValue] = useState(value);
  const presetColors = field.presetColors || [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#000000'
  ];

  // Update hex input when value prop changes
  React.useEffect(() => {
    setHexInputValue(value);
  }, [value]);

  const handleColorChange = (color) => {
    if (!disabled) {
      onChange(color);
      setHexInputValue(color);
    }
  };

  const handleHexChange = (e) => {
    const hex = e.target.value;
    setHexInputValue(hex);
    
    // Validate hex format
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      handleColorChange(hex);
    }
  };

  const handleHexBlur = () => {
    // Try to fix invalid hex
    let hex = hexInputValue;
    if (!hex.startsWith('#')) {
      hex = '#' + hex;
    }
    if (hex.length === 4) {
      hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      handleColorChange(hex);
    } else {
      setHexInputValue(value); // Revert to original value
    }
  };

  return (
    <div className="color-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="flex items-center space-x-3">
        {/* Color Preview */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setShowColorPicker(!showColorPicker)}
            disabled={disabled}
            className={`
              w-12 h-12 rounded-lg border-2 border-gray-300 
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400'}
            `}
            style={{ backgroundColor: value }}
            title="Click to open color picker"
          />
          
          {/* Color Picker Dropdown */}
          {showColorPicker && !disabled && (
            <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              <div className="grid grid-cols-5 gap-2 mb-3">
                {presetColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      handleColorChange(color);
                      setShowColorPicker(false);
                    }}
                    className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={value}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={hexInputValue}
                  onChange={handleHexChange}
                  onBlur={handleHexBlur}
                  placeholder="#000000"
                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Hex Input */}
        <input
          type="text"
          value={hexInputValue}
          onChange={handleHexChange}
          onBlur={handleHexBlur}
          disabled={disabled}
          placeholder="#000000"
          className={`
            px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${error ? 'border-red-500' : 'border-gray-300'}
          `}
        />
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
      
      {/* Click outside to close picker */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
