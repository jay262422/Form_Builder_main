import React from 'react';

/**
 * ColorPicker - Component for selecting colors in the theme editor
 * Features:
 * - Color input with preview
 * - Preset color palettes
 * - Color name labels
 * - Real-time updates
 */
export default function ColorPicker({ colors = {}, onChange }) {
  // Preset color palettes
  const colorPalettes = {
    blue: ['#3B82F6', '#1D4ED8', '#1E40AF', '#1E3A8A'],
    green: ['#10B981', '#059669', '#047857', '#065F46'],
    purple: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6'],
    red: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B'],
    gray: ['#6B7280', '#4B5563', '#374151', '#1F2937'],
    orange: ['#F59E0B', '#D97706', '#B45309', '#92400E']
  };

  // Color definitions with labels and descriptions
  const colorDefinitions = [
    {
      key: 'primary',
      label: 'Primary Color',
      description: 'Main brand color for buttons and links',
      defaultValue: '#3B82F6'
    },
    {
      key: 'secondary',
      label: 'Secondary Color',
      description: 'Background color for secondary elements',
      defaultValue: '#F3F4F6'
    },
    {
      key: 'border',
      label: 'Border Color',
      description: 'Color for field borders and dividers',
      defaultValue: '#D1D5DB'
    },
    {
      key: 'text',
      label: 'Text Color',
      description: 'Main text color for labels and content',
      defaultValue: '#111827'
    },
    {
      key: 'background',
      label: 'Background Color',
      description: 'Main background color for forms',
      defaultValue: '#FFFFFF'
    },
    {
      key: 'error',
      label: 'Error Color',
      description: 'Color for error messages and validation',
      defaultValue: '#EF4444'
    },
    {
      key: 'success',
      label: 'Success Color',
      description: 'Color for success messages and states',
      defaultValue: '#10B981'
    },
    {
      key: 'warning',
      label: 'Warning Color',
      description: 'Color for warning messages and alerts',
      defaultValue: '#F59E0B'
    },
    {
      key: 'label',
      label: 'Label Color',
      description: 'Color for field labels',
      defaultValue: '#374151'
    },
    {
      key: 'placeholder',
      label: 'Placeholder Color',
      description: 'Color for input placeholders',
      defaultValue: '#9CA3AF'
    },
    {
      key: 'focus',
      label: 'Focus Color',
      description: 'Color for focused input borders',
      defaultValue: '#3B82F6'
    },
    {
      key: 'section',
      label: 'Section Background',
      description: 'Background color for form sections',
      defaultValue: '#FFFFFF'
    }
  ];

  // Handle color change
  const handleColorChange = (key, value) => {
    onChange({ [key]: value });
  };

  // Handle palette selection
  const handlePaletteSelect = (paletteName) => {
    const palette = colorPalettes[paletteName];
    const updatesByPalette = {
      blue: { primary: palette[0], secondary: '#EBF4FF', border: palette[2], focus: palette[0] },
      green: { primary: palette[0], secondary: '#ECFDF5', border: palette[2], focus: palette[0] },
      purple: { primary: palette[0], secondary: '#F5F3FF', border: palette[2], focus: palette[0] },
      red: { primary: palette[0], secondary: '#FEF2F2', border: palette[2], focus: palette[0] },
      gray: { primary: palette[0], secondary: '#F9FAFB', border: palette[1], text: palette[3], focus: palette[0] },
      orange: { primary: palette[0], secondary: '#FFFBEB', border: palette[2], focus: palette[0] }
    };

    onChange(updatesByPalette[paletteName] || { primary: palette[0], focus: palette[0] });
  };

  return (
    <div className="color-picker space-y-6">
      {/* Preset Palettes */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Palettes</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(colorPalettes).map(([name, palette]) => (
            <button
              key={name}
              onClick={() => handlePaletteSelect(name)}
              className="flex items-center p-2 rounded-md border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex space-x-1 mr-2">
                {palette.slice(0, 3).map((color, index) => (
                  <div
                    key={index}
                    className="w-4 h-4 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-gray-700 capitalize">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Main colors</h3>
        <div className="space-y-4">
          {colorDefinitions.filter((item) => ['primary', 'background', 'text', 'border', 'label'].includes(item.key)).map(({ key, label, description, defaultValue }) => (
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
                  {/* Color Preview */}
                  <div
                    className="w-8 h-8 rounded border border-gray-200 shadow-sm"
                    style={{ backgroundColor: colors[key] || defaultValue }}
                  />
                  {/* Color Input */}
                  <input
                    type="color"
                    value={colors[key] || defaultValue}
                    onChange={(e) => handleColorChange(key, e.target.value)}
                    className="w-8 h-8 rounded border border-gray-200 cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Color Value Display */}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={colors[key] || defaultValue}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="flex-1 px-2 py-1 text-xs font-mono bg-gray-50 border border-gray-200 rounded"
                  placeholder={defaultValue}
                />
                <button
                  onClick={() => handleColorChange(key, defaultValue)}
                  className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <details className="rounded-lg border border-gray-200 p-3">
        <summary className="cursor-pointer text-sm font-medium text-gray-800">More colors</summary>
        <div className="mt-4 space-y-4">
          {colorDefinitions.filter((item) => !['primary', 'background', 'text', 'border', 'label'].includes(item.key)).map(({ key, label, description, defaultValue }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
                <input
                  type="color"
                  value={colors[key] || defaultValue}
                  onChange={(e) => handleColorChange(key, e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border border-gray-200"
                />
              </div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
