import React from 'react';

/**
 * TypographyControls - Component for controlling typography in the theme editor
 * Features:
 * - Font size controls
 * - Font weight options
 * - Font family selection
 * - Text preview
 * - Real-time updates
 */
export default function TypographyControls({ typography, onChange }) {
  // Typography definitions
  const typographyDefinitions = [
    {
      key: 'labelFontSize',
      label: 'Label Font Size',
      description: 'Size of field labels',
      defaultValue: '14px',
      options: ['12px', '13px', '14px', '15px', '16px', '18px']
    },
    {
      key: 'labelFontWeight',
      label: 'Label Font Weight',
      description: 'Weight of field labels',
      defaultValue: '500',
      options: ['300', '400', '500', '600', '700']
    },
    {
      key: 'inputFontSize',
      label: 'Input Font Size',
      description: 'Size of input text',
      defaultValue: '16px',
      options: ['14px', '15px', '16px', '17px', '18px', '20px']
    },
    {
      key: 'inputFontWeight',
      label: 'Input Font Weight',
      description: 'Weight of input text',
      defaultValue: '400',
      options: ['300', '400', '500', '600']
    },
    {
      key: 'errorFontSize',
      label: 'Error Font Size',
      description: 'Size of error messages',
      defaultValue: '12px',
      options: ['10px', '11px', '12px', '13px', '14px']
    },
    {
      key: 'errorFontWeight',
      label: 'Error Font Weight',
      description: 'Weight of error messages',
      defaultValue: '400',
      options: ['300', '400', '500', '600']
    }
  ];

  // Font family options
  const fontFamilies = [
    { value: 'Inter', label: 'Inter (Modern)', preview: 'Inter' },
    { value: 'Roboto', label: 'Roboto (Clean)', preview: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans (Friendly)', preview: 'Open Sans' },
    { value: 'Lato', label: 'Lato (Professional)', preview: 'Lato' },
    { value: 'Poppins', label: 'Poppins (Modern)', preview: 'Poppins' },
    { value: 'system-ui', label: 'System Font (Native)', preview: 'System Font' }
  ];

  // Preset typography options
  const typographyPresets = [
    {
      name: 'Compact',
      description: 'Small, dense text for space efficiency',
      values: {
        labelFontSize: '12px',
        labelFontWeight: '500',
        inputFontSize: '14px',
        inputFontWeight: '400',
        errorFontSize: '10px',
        errorFontWeight: '400'
      }
    },
    {
      name: 'Standard',
      description: 'Balanced typography for most forms',
      values: {
        labelFontSize: '14px',
        labelFontWeight: '500',
        inputFontSize: '16px',
        inputFontWeight: '400',
        errorFontSize: '12px',
        errorFontWeight: '400'
      }
    },
    {
      name: 'Large',
      description: 'Larger text for better readability',
      values: {
        labelFontSize: '16px',
        labelFontWeight: '600',
        inputFontSize: '18px',
        inputFontWeight: '400',
        errorFontSize: '14px',
        errorFontWeight: '500'
      }
    }
  ];

  // Handle typography change
  const handleTypographyChange = (key, value) => {
    onChange({ [key]: value });
  };

  // Handle preset selection
  const handlePresetSelect = (preset) => {
    onChange(preset.values);
  };

  // Handle font family change
  const handleFontFamilyChange = (fontFamily) => {
    onChange({ fontFamily });
  };

  // Get font weight label
  const getFontWeightLabel = (weight) => {
    const labels = {
      '300': 'Light',
      '400': 'Regular',
      '500': 'Medium',
      '600': 'Semi Bold',
      '700': 'Bold'
    };
    return labels[weight] || weight;
  };

  return (
    <div className="typography-controls space-y-6">
      {/* Font Family Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Font Family</h3>
        <div className="grid grid-cols-2 gap-2">
          {fontFamilies.map((font) => (
            <button
              key={font.value}
              onClick={() => handleFontFamilyChange(font.value)}
              className={`p-3 rounded-md border transition-colors text-left ${
                typography.fontFamily === font.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              style={{ fontFamily: font.value }}
            >
              <div className="text-sm font-medium text-gray-900">
                {font.preview}
              </div>
              <div className="text-xs text-gray-500">
                {font.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Preset Typography Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Presets</h3>
        <div className="space-y-2">
          {typographyPresets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              className="w-full text-left p-3 rounded-md border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {preset.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {preset.description}
                  </div>
                </div>
                <div className="text-right">
                  <div 
                    className="text-sm font-medium"
                    style={{ 
                      fontSize: preset.values.labelFontSize,
                      fontWeight: preset.values.labelFontWeight
                    }}
                  >
                    Label
                  </div>
                  <div 
                    className="text-xs"
                    style={{ 
                      fontSize: preset.values.inputFontSize,
                      fontWeight: preset.values.inputFontWeight
                    }}
                  >
                    Input
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Typography Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Typography</h3>
        <div className="space-y-4">
          {typographyDefinitions.map(({ key, label, description, defaultValue, options }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <p className="text-xs text-gray-500">
                    {description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={typography[key] || defaultValue}
                    onChange={(e) => handleTypographyChange(key, e.target.value)}
                    className="px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded"
                  >
                    {options.map((option) => (
                      <option key={option} value={option}>
                        {key.includes('Weight') ? getFontWeightLabel(option) : option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Preview */}
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <div
                  className="text-gray-900"
                  style={{
                    fontSize: typography[key] || defaultValue,
                    fontWeight: key.includes('Weight') ? (typography[key] || defaultValue) : 'normal',
                    fontFamily: typography.fontFamily || 'system-ui'
                  }}
                >
                  {key.includes('label') && 'Sample Label Text'}
                  {key.includes('input') && 'Sample input text'}
                  {key.includes('error') && 'Sample error message'}
                </div>
              </div>
              
              {/* Reset Button */}
              <button
                onClick={() => handleTypographyChange(key, defaultValue)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                Reset to Default
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Typography Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Form Preview</h3>
        <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg">
          {/* Label */}
          <div>
            <label
              className="block text-gray-700 mb-1"
              style={{
                fontSize: typography.labelFontSize || '14px',
                fontWeight: typography.labelFontWeight || '500',
                fontFamily: typography.fontFamily || 'system-ui'
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              style={{
                fontSize: typography.inputFontSize || '16px',
                fontWeight: typography.inputFontWeight || '400',
                fontFamily: typography.fontFamily || 'system-ui'
              }}
            />
            <p
              className="mt-1 text-red-600"
              style={{
                fontSize: typography.errorFontSize || '12px',
                fontWeight: typography.errorFontWeight || '400',
                fontFamily: typography.fontFamily || 'system-ui'
              }}
            >
              Please enter a valid email address
            </p>
          </div>
          
          {/* Button */}
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            style={{
              fontSize: typography.inputFontSize || '16px',
              fontWeight: '500',
              fontFamily: typography.fontFamily || 'system-ui'
            }}
          >
            Submit Form
          </button>
        </div>
      </div>
    </div>
  );
}
