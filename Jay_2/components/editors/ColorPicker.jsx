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
    const updates = {};
    
    // Map palette colors to theme colors
    if (paletteName === 'blue') {
      updates.primary = palette[0];
      updates.secondary = '#EBF4FF';
      updates.border = palette[2];
    } else if (paletteName === 'green') {
      updates.primary = palette[0];
      updates.secondary = '#ECFDF5';
      updates.border = palette[2];
    } else if (paletteName === 'purple') {
      updates.primary = palette[0];
      updates.secondary = '#F3F4F6';
      updates.border = palette[2];
    } else if (paletteName === 'gray') {
      updates.primary = palette[0];
      updates.secondary = '#F9FAFB';
      updates.border = palette[1];
      updates.text = palette[3];
    }
    
    onChange(updates);
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

      {/* Individual Color Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Custom Colors</h3>
        <div className="space-y-4">
          {colorDefinitions.map(({ key, label, description, defaultValue }) => (
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

      {/* Color Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Color Preview</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div
              className="h-8 rounded border"
              style={{ 
                backgroundColor: colors.primary || '#3B82F6',
                borderColor: colors.border || '#D1D5DB'
              }}
            />
            <span className="text-xs text-gray-600">Primary Button</span>
          </div>
          
          <div className="space-y-2">
            <div
              className="h-8 rounded border"
              style={{ 
                backgroundColor: colors.secondary || '#F3F4F6',
                borderColor: colors.border || '#D1D5DB'
              }}
            />
            <span className="text-xs text-gray-600">Secondary Background</span>
          </div>
          
          <div className="space-y-2">
            <div
              className="h-8 rounded border"
              style={{ 
                backgroundColor: colors.background || '#FFFFFF',
                borderColor: colors.border || '#D1D5DB'
              }}
            />
            <span className="text-xs text-gray-600">Form Background</span>
          </div>
          
          <div className="space-y-2">
            <div
              className="h-8 rounded border flex items-center justify-center"
              style={{ 
                backgroundColor: colors.error || '#EF4444',
                borderColor: colors.border || '#D1D5DB'
              }}
            >
              <span className="text-xs text-white font-medium">Error</span>
            </div>
            <span className="text-xs text-gray-600">Error State</span>
          </div>
        </div>
      </div>
    </div>
  );
}
