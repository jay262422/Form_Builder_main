import React from 'react';

/**
 * SpacingControls - Component for controlling spacing in the theme editor
 * Features:
 * - Slider controls for spacing values
 * - Visual preview of spacing
 * - Preset spacing options
 * - Real-time updates
 */
export default function SpacingControls({ spacing, onChange }) {
  // Spacing definitions with labels and ranges
  const spacingDefinitions = [
    {
      key: 'fieldPadding',
      label: 'Field Padding',
      description: 'Internal padding for input fields',
      defaultValue: '12px',
      min: 4,
      max: 24,
      unit: 'px'
    },
    {
      key: 'sectionMargin',
      label: 'Section Margin',
      description: 'Margin between form sections',
      defaultValue: '24px',
      min: 8,
      max: 48,
      unit: 'px'
    },
    {
      key: 'borderRadius',
      label: 'Border Radius',
      description: 'Corner radius for fields and buttons',
      defaultValue: '8px',
      min: 0,
      max: 16,
      unit: 'px'
    },
    {
      key: 'fieldSpacing',
      label: 'Field Spacing',
      description: 'Space between form fields',
      defaultValue: '16px',
      min: 8,
      max: 32,
      unit: 'px'
    }
  ];

  // Preset spacing options
  const spacingPresets = [
    {
      name: 'Compact',
      description: 'Tight spacing for dense forms',
      values: {
        fieldPadding: '8px',
        sectionMargin: '16px',
        borderRadius: '4px',
        fieldSpacing: '12px'
      }
    },
    {
      name: 'Comfortable',
      description: 'Balanced spacing for most forms',
      values: {
        fieldPadding: '12px',
        sectionMargin: '24px',
        borderRadius: '8px',
        fieldSpacing: '16px'
      }
    },
    {
      name: 'Spacious',
      description: 'Generous spacing for premium feel',
      values: {
        fieldPadding: '16px',
        sectionMargin: '32px',
        borderRadius: '12px',
        fieldSpacing: '24px'
      }
    }
  ];

  // Handle spacing change
  const handleSpacingChange = (key, value) => {
    onChange({ [key]: value });
  };

  // Handle preset selection
  const handlePresetSelect = (preset) => {
    onChange(preset.values);
  };

  // Convert px to number for slider
  const pxToNumber = (pxValue) => {
    return parseInt(pxValue) || 0;
  };

  // Convert number to px for display
  const numberToPx = (number) => {
    return `${number}px`;
  };

  return (
    <div className="spacing-controls space-y-6">
      {/* Preset Spacing Options */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Presets</h3>
        <div className="space-y-2">
          {spacingPresets.map((preset) => (
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
                <div className="flex space-x-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ 
                      backgroundColor: '#3B82F6',
                      padding: preset.values.fieldPadding
                    }}
                  />
                  <div
                    className="w-3 h-3 rounded"
                    style={{ 
                      backgroundColor: '#10B981',
                      margin: preset.values.fieldSpacing
                    }}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Spacing Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Spacing</h3>
        <div className="space-y-4">
          {spacingDefinitions.map(({ key, label, description, defaultValue, min, max, unit }) => (
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
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={pxToNumber(spacing[key] || defaultValue)}
                    onChange={(e) => handleSpacingChange(key, numberToPx(e.target.value))}
                    className="w-16 px-2 py-1 text-sm bg-gray-50 border border-gray-200 rounded text-center"
                  />
                  <span className="text-sm text-gray-500">{unit}</span>
                </div>
              </div>
              
              {/* Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={pxToNumber(spacing[key] || defaultValue)}
                  onChange={(e) => handleSpacingChange(key, numberToPx(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{min}{unit}</span>
                  <span>{max}{unit}</span>
                </div>
              </div>
              
              {/* Reset Button */}
              <button
                onClick={() => handleSpacingChange(key, defaultValue)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
              >
                Reset to Default
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
