import React, { useState } from 'react';

/**
 * LayoutEditor - Component for controlling form field layouts
 * Features:
 * - Field width controls
 * - Side-by-side field arrangements
 * - Section styling options
 * - Layout presets
 */
export default function LayoutEditor({ layout, onChange, formSchema }) {
  const [selectedField, setSelectedField] = useState(null);

  // Layout presets for common form patterns
  const layoutPresets = [
    {
      name: 'Contact Form',
      description: 'Side-by-side name fields, full-width others',
      layout: {
        fieldWidths: {
          firstName: 'half',
          lastName: 'half',
          email: 'full',
          phone: 'full',
          message: 'full'
        },
        fieldArrangement: [
          ['firstName', 'lastName'],
          ['email'],
          ['phone'],
          ['message']
        ],
        sectionStyle: 'minimal',
        removeSectionBoxes: true
      }
    },
    {
      name: 'Registration Form',
      description: 'All fields full-width, stacked',
      layout: {
        fieldWidths: {
          firstName: 'full',
          lastName: 'full',
          email: 'full',
          password: 'full',
          confirmPassword: 'full'
        },
        fieldArrangement: [
          ['firstName'],
          ['lastName'],
          ['email'],
          ['password'],
          ['confirmPassword']
        ],
        sectionStyle: 'card',
        removeSectionBoxes: false
      }
    },
    {
      name: 'Compact Form',
      description: 'All fields side-by-side where possible',
      layout: {
        fieldWidths: {
          firstName: 'half',
          lastName: 'half',
          email: 'half',
          phone: 'half',
          company: 'full',
          message: 'full'
        },
        fieldArrangement: [
          ['firstName', 'lastName'],
          ['email', 'phone'],
          ['company'],
          ['message']
        ],
        sectionStyle: 'minimal',
        removeSectionBoxes: true
      }
    }
  ];

  // Section style options
  const sectionStyles = [
    {
      id: 'card',
      name: 'Card Style',
      description: 'Fields in bordered cards with background',
      preview: 'bg-white border rounded-lg shadow-sm p-6'
    },
    {
      id: 'minimal',
      name: 'Minimal Style',
      description: 'Clean, no borders or backgrounds',
      preview: 'bg-transparent border-0 shadow-none p-0'
    },
    {
      id: 'outlined',
      name: 'Outlined Style',
      description: 'Simple border around sections',
      preview: 'bg-white border border-gray-200 rounded-lg p-4'
    }
  ];

  // Field width options
  const fieldWidths = [
    { value: 'full', label: 'Full Width', description: 'Takes entire row' },
    { value: 'half', label: 'Half Width', description: 'Takes half the row' },
    { value: 'third', label: 'One Third', description: 'Takes 1/3 of the row' },
    { value: 'quarter', label: 'One Quarter', description: 'Takes 1/4 of the row' }
  ];

  // Get all fields from form schema
  const getAllFields = () => {
    if (!formSchema?.sections) return [];
    
    const fields = [];
    formSchema.sections.forEach(section => {
      if (section.fields) {
        fields.push(...section.fields);
      }
    });
    return fields;
  };

  const fields = getAllFields();

  // Handle layout preset selection
  const handlePresetSelect = (preset) => {
    onChange(preset.layout);
  };

  // Handle field width change
  const handleFieldWidthChange = (fieldName, width) => {
    const newLayout = {
      ...layout,
      fieldWidths: {
        ...layout.fieldWidths,
        [fieldName]: width
      }
    };
    onChange(newLayout);
  };

  // Handle section style change
  const handleSectionStyleChange = (style) => {
    onChange({
      ...layout,
      sectionStyle: style
    });
  };

  // Handle remove section boxes toggle
  const handleRemoveSectionBoxesChange = (remove) => {
    onChange({
      ...layout,
      removeSectionBoxes: remove
    });
  };

  return (
    <div className="layout-editor space-y-6">
      {/* Layout Presets */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Layouts</h3>
        <div className="space-y-2">
          {layoutPresets.map((preset) => (
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
                  {preset.layout.fieldArrangement.slice(0, 2).map((row, index) => (
                    <div key={index} className="flex space-x-1">
                      {row.map((field, fieldIndex) => (
                        <div
                          key={fieldIndex}
                          className={`w-2 h-2 rounded ${
                            preset.layout.fieldWidths[field] === 'half' 
                              ? 'bg-blue-400' 
                              : 'bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section Styling */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Section Style</h3>
        <div className="grid grid-cols-1 gap-2">
          {sectionStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => handleSectionStyleChange(style.id)}
              className={`p-3 rounded-md border transition-colors text-left ${
                layout.sectionStyle === style.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {style.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {style.description}
                  </div>
                </div>
                <div className={`w-8 h-6 rounded border ${style.preview.split(' ')[0]}`}></div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Remove Section Boxes */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Section Containers</h3>
        <div className="flex items-center space-x-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={layout.removeSectionBoxes || false}
              onChange={(e) => handleRemoveSectionBoxesChange(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              Remove section boxes/containers
            </span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This will remove the card-style containers around form sections
        </p>
      </div>

      {/* Field Width Controls */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Field Widths</h3>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.name} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {field.label || field.name}
                </div>
                <div className="text-xs text-gray-500">
                  Current: {layout.fieldWidths?.[field.name] || 'full'}
                </div>
              </div>
              <select
                value={layout.fieldWidths?.[field.name] || 'full'}
                onChange={(e) => handleFieldWidthChange(field.name, e.target.value)}
                className="px-2 py-1 text-sm bg-white border border-gray-200 rounded"
              >
                {fieldWidths.map((width) => (
                  <option key={width.value} value={width.value}>
                    {width.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Layout Preview */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Layout Preview</h3>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <div className="space-y-3">
            {fields.slice(0, 4).map((field, index) => {
              const width = layout.fieldWidths?.[field.name] || 'full';
              const widthClass = {
                'full': 'w-full',
                'half': 'w-1/2',
                'third': 'w-1/3',
                'quarter': 'w-1/4'
              }[width];

              return (
                <div key={field.name} className={`${widthClass} inline-block`}>
                  <div className="h-6 bg-blue-100 border border-blue-200 rounded flex items-center justify-center">
                    <span className="text-xs text-blue-700">{field.label || field.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            This shows how fields will be arranged in your form
          </div>
        </div>
      </div>
    </div>
  );
}
