import React from 'react';

/**
 * LayoutEditor - Component for controlling form field layouts
 * Features:
 * - Field width controls
 * - Side-by-side field arrangements
 * - Section styling options
 * - Layout presets
 */
export default function LayoutEditor({ layout, onChange, formSchema }) {
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
    const sections = Array.isArray(formSchema) ? formSchema : (formSchema?.sections || []);
    return sections.flatMap((section) => section.fields || []);
  };

  const fields = getAllFields();

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
      <p className="text-xs leading-5 text-gray-500">
        This changes how sections and fields are drawn. It does not add, remove, or change what a field asks.
      </p>
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
    </div>
  );
}
