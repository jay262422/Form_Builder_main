import React, { useState } from 'react';

/**
 * RepeaterTemplateEditor - Component for configuring repeating section templates
 * Provides a user-friendly interface to add, edit, and manage template fields
 */
export default function RepeaterTemplateEditor({
  template = [],
  onTemplateChange,
  className = ""
}) {
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: ''
  });

  // Available field types for template
  const fieldTypes = [
    { value: 'text', label: 'Text Input', icon: '📝' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'select', label: 'Dropdown', icon: '📋' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'radio', label: 'Radio', icon: '🔘' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'file', label: 'File Upload', icon: '📁' }
  ];

  // Preset templates for common use cases
  const presetTemplates = [
    {
      name: 'Work Experience',
      description: 'Company, position, duration, and responsibilities',
      template: [
        { name: 'company', label: 'Company Name', type: 'text', required: true, placeholder: 'Enter company name' },
        { name: 'position', label: 'Job Title', type: 'text', required: true, placeholder: 'Enter job title' },
        { name: 'start_date', label: 'Start Date', type: 'date', required: true },
        { name: 'end_date', label: 'End Date', type: 'date', required: false },
        { name: 'responsibilities', label: 'Responsibilities', type: 'textarea', required: false, placeholder: 'Describe your responsibilities' }
      ]
    },
    {
      name: 'Education',
      description: 'School, degree, graduation date, and GPA',
      template: [
        { name: 'institution', label: 'Institution Name', type: 'text', required: true, placeholder: 'Enter school/university name' },
        { name: 'degree', label: 'Degree/Certificate', type: 'text', required: true, placeholder: 'Enter degree or certificate' },
        { name: 'field_of_study', label: 'Field of Study', type: 'text', required: false, placeholder: 'Enter field of study' },
        { name: 'graduation_date', label: 'Graduation Date', type: 'date', required: true },
        { name: 'gpa', label: 'GPA (Optional)', type: 'number', required: false, placeholder: 'Enter GPA if applicable' }
      ]
    },
    {
      name: 'Project Portfolio',
      description: 'Project name, description, technologies, and links',
      template: [
        { name: 'project_name', label: 'Project Name', type: 'text', required: true, placeholder: 'Enter project name' },
        { name: 'description', label: 'Description', type: 'textarea', required: true, placeholder: 'Describe the project' },
        { name: 'technologies', label: 'Technologies Used', type: 'text', required: false, placeholder: 'e.g., React, Node.js, MongoDB' },
        { name: 'project_url', label: 'Project URL', type: 'text', required: false, placeholder: 'https://project-url.com' },
        { name: 'github_url', label: 'GitHub URL', type: 'text', required: false, placeholder: 'https://github.com/username/project' }
      ]
    },
    {
      name: 'References',
      description: 'Contact information for professional references',
      template: [
        { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Enter reference name' },
        { name: 'title', label: 'Job Title', type: 'text', required: true, placeholder: 'Enter job title' },
        { name: 'company', label: 'Company', type: 'text', required: true, placeholder: 'Enter company name' },
        { name: 'email', label: 'Email', type: 'email', required: true, placeholder: 'Enter email address' },
        { name: 'phone', label: 'Phone', type: 'text', required: false, placeholder: 'Enter phone number' }
      ]
    },
    {
      name: 'Skills',
      description: 'Skill name, proficiency level, and years of experience',
      template: [
        { name: 'skill_name', label: 'Skill Name', type: 'text', required: true, placeholder: 'Enter skill name' },
        { name: 'proficiency', label: 'Proficiency Level', type: 'select', required: true, options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
          { label: 'Expert', value: 'expert' }
        ]},
        { name: 'years_experience', label: 'Years of Experience', type: 'number', required: false, placeholder: 'Enter years of experience' }
      ]
    }
  ];

  const loadPreset = (preset) => {
    onTemplateChange(preset.template);
  };

  const addField = () => {
    if (newField.name && newField.label) {
      const fieldToAdd = {
        ...newField,
        name: newField.name.toLowerCase().replace(/\s+/g, '_'),
        options: newField.type === 'select' ? [] : undefined
      };
      
      const updatedTemplate = [...template, fieldToAdd];
      onTemplateChange(updatedTemplate);
      
      // Reset form
      setNewField({
        name: '',
        label: '',
        type: 'text',
        required: false,
        placeholder: ''
      });
      setShowAddField(false);
    }
  };

  const removeField = (index) => {
    const updatedTemplate = template.filter((_, i) => i !== index);
    onTemplateChange(updatedTemplate);
  };

  const updateField = (index, updates) => {
    const updatedTemplate = template.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    );
    onTemplateChange(updatedTemplate);
  };

  const moveField = (fromIndex, toIndex) => {
    const updatedTemplate = [...template];
    const [movedField] = updatedTemplate.splice(fromIndex, 1);
    updatedTemplate.splice(toIndex, 0, movedField);
    onTemplateChange(updatedTemplate);
  };

  return (
    <div className={`repeater-template-editor ${className}`}>
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">
          Template Fields
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Configure the fields that will be repeated for each item
        </p>
      </div>

      {/* Preset Templates */}
      {template.length === 0 && (
        <div className="mb-4">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Quick Start Templates</h5>
          <div className="grid grid-cols-1 gap-2">
            {presetTemplates.map((preset, index) => (
              <button
                key={index}
                onClick={() => loadPreset(preset)}
                className="text-left p-2 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="text-xs font-medium text-gray-900">{preset.name}</div>
                <div className="text-xs text-gray-600">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template Fields List */}
      <div className="space-y-3 mb-4">
        {template.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-500">No template fields added yet</p>
            <p className="text-xs text-gray-400 mt-1">Choose a preset template above or add custom fields below</p>
          </div>
        ) : (
          template.map((field, index) => (
            <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-700">
                    {field.label || field.name}
                  </span>
                  <span className="text-xs text-gray-500">({field.type})</span>
                  {field.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => moveField(index, Math.max(0, index - 1))}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(index, Math.min(template.length - 1, index + 1))}
                    disabled={index === template.length - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="p-1 text-red-400 hover:text-red-600"
                    title="Remove field"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {/* Field Configuration */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-gray-600 mb-1">Label</label>
                  <input
                    type="text"
                    value={field.label || ''}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Field label"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Type</label>
                  <select
                    value={field.type || 'text'}
                    onChange={(e) => updateField(index, { type: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={field.placeholder || ''}
                    onChange={(e) => updateField(index, { placeholder: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    placeholder="Optional placeholder"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center text-gray-600">
                    <input
                      type="checkbox"
                      checked={field.required || false}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                      className="mr-2"
                    />
                    Required
                  </label>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add New Field */}
      {showAddField ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div>
              <label className="block text-gray-600 mb-1">Field Name *</label>
              <input
                type="text"
                value={newField.name}
                onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="e.g., company_name"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Display Label *</label>
              <input
                type="text"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="e.g., Company Name"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Field Type</label>
              <select
                value={newField.type}
                onChange={(e) => setNewField({ ...newField, type: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              >
                {fieldTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-600 mb-1">Placeholder</label>
              <input
                type="text"
                value={newField.placeholder}
                onChange={(e) => setNewField({ ...newField, placeholder: e.target.value })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                placeholder="Optional placeholder"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center text-gray-600 text-xs">
              <input
                type="checkbox"
                checked={newField.required}
                onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                className="mr-2"
              />
              Required field
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowAddField(false)}
                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addField}
                disabled={!newField.name || !newField.label}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddField(true)}
          className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
        >
          + Add Template Field
        </button>
      )}

      {/* Preview */}
      {template.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Template Preview</h5>
          <div className="text-xs text-gray-600">
            <p>Each repeated item will contain {template.length} field{template.length !== 1 ? 's' : ''}:</p>
            <ul className="mt-1 space-y-1">
              {template.map((field, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span>{field.label || field.name}</span>
                  <span className="text-gray-400">({field.type})</span>
                  {field.required && <span className="text-red-500">*</span>}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
