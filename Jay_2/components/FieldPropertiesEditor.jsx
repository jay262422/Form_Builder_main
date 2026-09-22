import React, { useState, useEffect } from 'react';
import ValidationPreview from './ValidationPreview';
import ConditionBuilder from './ConditionBuilder';

/**
 * FieldPropertiesEditor - Comprehensive field configuration component
 * Handles field properties, validation rules, styling, and advanced options
 */
export default function FieldPropertiesEditor({
  field,
  onFieldUpdate,
  isOpen = false,
  onClose,
  availableFields = [] // Add this prop to pass available fields for condition builder
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Basic properties
    name: '',
    label: '',
    placeholder: '',
    required: false,
    disabled: false,
    helpText: '',
    defaultValue: '',
    
    // Validation
    validation: {
      required: false,
      minLength: '',
      maxLength: '',
      pattern: '',
      min: '',
      max: '',
      step: '',
      customValidation: '',
      customMessage: '',
      maxFileSize: '',
      allowedExtensions: '',
      minDate: '',
      maxDate: ''
    },
    
    // Styling
    styling: {
      width: '100%',
      height: '',
      className: '',
      customCSS: ''
    },
    
    // Advanced
    advanced: {
      dependsOn: '',
      condition: '',
      showWhen: 'always',
      calculateFrom: '',
      calculation: ''
    }
  });

  // Load field data when component opens
  useEffect(() => {
    if (field && isOpen) {
      console.log('🔍 FieldPropertiesEditor: Loading field data:', field.name, 'Field condition:', field.condition, 'Condition type:', typeof field.condition);
      setFormData({
        name: field.name || '',
        label: field.label || '',
        placeholder: field.placeholder || '',
        required: field.required || false,
        disabled: field.disabled || false,
        helpText: field.helpText || '',
        defaultValue: field.defaultValue || '',
        
        validation: {
          required: field.required || false,
          minLength: field.validation?.minLength || '',
          maxLength: field.validation?.maxLength || '',
          pattern: field.validation?.pattern || '',
          min: field.validation?.min || field.minDate || field.minTime || '',
          max: field.validation?.max || field.maxDate || field.maxTime || '',
          step: field.validation?.step || '',
          customValidation: field.validation?.custom || '',
          customMessage: field.validation?.customMessage || '',
          maxFileSize: field.validation?.maxFileSize || (field.maxSize ? field.maxSize / (1024 * 1024) : ''),
          allowedExtensions: field.validation?.allowedExtensions || field.accept || '',
          minDate: field.validation?.minDate || field.minDate || '',
          maxDate: field.validation?.maxDate || field.maxDate || ''
        },
        
        styling: {
          width: field.styling?.width || '100%',
          height: field.styling?.height || '',
          className: field.styling?.className || '',
          customCSS: field.styling?.customCSS || ''
        },
        
        advanced: {
          dependsOn: field.dependsOn || '',
          condition: field.condition || '',
          showWhen: field.showWhen || 'always',
          calculateFrom: field.calculateFrom || '',
          calculation: field.calculation || ''
        }
      });
      console.log('🔍 FieldPropertiesEditor: Set formData.advanced.condition to:', field.condition || '');
    }
  }, [field, isOpen]);

  // Handle form data changes
  const handleChange = (section, key, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  // Handle basic property changes
  const handleBasicChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Save changes
  const handleSave = () => {
    const normalizedValidation = {
      ...formData.validation
    };

    const normalizedFieldProps = {};

    if (field?.type === 'file') {
      if (normalizedValidation.allowedExtensions) {
        normalizedFieldProps.accept = normalizedValidation.allowedExtensions;
      }

      if (normalizedValidation.maxFileSize) {
        normalizedFieldProps.maxSize = Number(normalizedValidation.maxFileSize) * 1024 * 1024;
      }
    }

    if (field?.type === 'date') {
      normalizedFieldProps.minDate = normalizedValidation.min || normalizedValidation.minDate || '';
      normalizedFieldProps.maxDate = normalizedValidation.max || normalizedValidation.maxDate || '';
    }

    if (field?.type === 'time') {
      normalizedFieldProps.minTime = normalizedValidation.min || '';
      normalizedFieldProps.maxTime = normalizedValidation.max || '';
    }

    const updatedField = {
      ...field,
      name: formData.name,
      label: formData.label,
      placeholder: formData.placeholder,
      required: formData.required,
      disabled: formData.disabled,
      helpText: formData.helpText,
      defaultValue: formData.defaultValue,
      validation: normalizedValidation,
      styling: formData.styling,
      dependsOn: formData.advanced.dependsOn,
      condition: formData.advanced.condition,
      showWhen: formData.advanced.showWhen,
      calculateFrom: formData.advanced.calculateFrom,
      calculation: formData.advanced.calculation,
      ...normalizedFieldProps
    };

    console.log('🔍 FieldPropertiesEditor: Saving field with condition:', updatedField.name, 'Condition:', updatedField.condition, 'Condition type:', typeof updatedField.condition);

    onFieldUpdate?.(updatedField);
    onClose?.();
  };

  // Enhanced validation templates
  const validationTemplates = {
    email: {
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      message: 'Please enter a valid email address'
    },
    phone: {
      pattern: '^[+]?[0-9\\s\\-\\(\\)]{10,}$',
      message: 'Please enter a valid phone number'
    },
    url: {
      pattern: '^https?:\\/\\/.+',
      message: 'Please enter a valid URL'
    },
    zipcode: {
      pattern: '^[0-9]{5}(-[0-9]{4})?$',
      message: 'Please enter a valid ZIP code'
    },
    password: {
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
      message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character'
    },
    creditCard: {
      pattern: '^[0-9]{4}[-\\s]?[0-9]{4}[-\\s]?[0-9]{4}[-\\s]?[0-9]{4}$',
      message: 'Please enter a valid credit card number'
    },
    dateFormat: {
      pattern: '^\\d{4}-\\d{2}-\\d{2}$',
      message: 'Please enter date in YYYY-MM-DD format'
    },
    alphanumeric: {
      pattern: '^[a-zA-Z0-9]+$',
      message: 'Only letters and numbers are allowed'
    },
    noSpaces: {
      pattern: '^\\S+$',
      message: 'Spaces are not allowed'
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Field Properties: {field?.label || 'Untitled Field'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {['basic', 'validation', 'styling', 'advanced'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Basic Properties Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="field_name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => handleBasicChange('label', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Field Label"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={formData.placeholder}
                  onChange={(e) => handleBasicChange('placeholder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter placeholder text..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Help Text
                </label>
                <textarea
                  value={formData.helpText}
                  onChange={(e) => handleBasicChange('helpText', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Help text to guide users..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Value
                </label>
                <input
                  type="text"
                  value={formData.defaultValue}
                  onChange={(e) => handleBasicChange('defaultValue', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Default value..."
                />
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => handleBasicChange('required', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Required</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.disabled}
                    onChange={(e) => handleBasicChange('disabled', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Disabled</span>
                </label>
              </div>
            </div>
          )}

          {/* Validation Tab */}
          {activeTab === 'validation' && (
            <div className="space-y-4">
              {/* Field-specific validation options */}
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Field Type: {field?.type || 'text'}
                </h4>
                <p className="text-xs text-blue-700">
                  Available validation options for this field type
                </p>
              </div>

              {/* Text-based validation (text, email, password, phone, url, textarea) */}
              {(field?.type === 'text' || field?.type === 'email' || field?.type === 'password' || 
                field?.type === 'phone' || field?.type === 'url' || field?.type === 'textarea') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Length
                      </label>
                      <input
                        type="number"
                        value={formData.validation.minLength}
                        onChange={(e) => handleChange('validation', 'minLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Length
                      </label>
                      <input
                        type="number"
                        value={formData.validation.maxLength}
                        onChange={(e) => handleChange('validation', 'maxLength', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pattern (Regex)
                    </label>
                    <input
                      type="text"
                      value={formData.validation.pattern}
                      onChange={(e) => handleChange('validation', 'pattern', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="^[a-zA-Z]+$"
                    />
                  </div>
                </>
              )}

              {/* Number-based validation (number, range) */}
              {(field?.type === 'number' || field?.type === 'range') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={formData.validation.min}
                        onChange={(e) => handleChange('validation', 'min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={formData.validation.max}
                        onChange={(e) => handleChange('validation', 'max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Step Value
                    </label>
                    <input
                      type="number"
                      value={formData.validation.step}
                      onChange={(e) => handleChange('validation', 'step', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1"
                    />
                  </div>
                </>
              )}

              {/* File validation */}
              {field?.type === 'file' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max File Size (MB)
                      </label>
                      <input
                        type="number"
                        value={formData.validation.maxFileSize}
                        onChange={(e) => handleChange('validation', 'maxFileSize', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allowed Extensions
                      </label>
                      <input
                        type="text"
                        value={formData.validation.allowedExtensions}
                        onChange={(e) => handleChange('validation', 'allowedExtensions', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder=".pdf,.doc,.docx"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Date/Time validation */}
              {(field?.type === 'date' || field?.type === 'time') && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Min Date/Time
                      </label>
                      <input
                        type={field.type}
                        value={formData.validation.min}
                        onChange={(e) => handleChange('validation', 'min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max Date/Time
                      </label>
                      <input
                        type={field.type}
                        value={formData.validation.max}
                        onChange={(e) => handleChange('validation', 'max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Enhanced Custom Validation */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Validation Function
                  </label>
                  <textarea
                    value={formData.validation.customValidation}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                    placeholder="Not used"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Custom JavaScript checks are turned off. Use the length, pattern, and range rules above.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Error Message
                  </label>
                  <input
                    type="text"
                    value={formData.validation.customMessage}
                    onChange={(e) => handleChange('validation', 'customMessage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Custom error message..."
                  />
                </div>

              </div>

              {/* Enhanced Validation Templates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Validation Templates
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(validationTemplates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => {
                        handleChange('validation', 'pattern', template.pattern);
                        handleChange('validation', 'customMessage', template.message);
                      }}
                      className="px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 text-blue-700"
                    >
                      <div className="font-medium">{key}</div>
                      <div className="text-xs opacity-75">{template.message}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pattern Testing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Pattern
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter test value..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      const testValue = e.target.value;
                      const pattern = formData.validation.pattern;
                      if (pattern && testValue) {
                        try {
                          const regex = new RegExp(pattern);
                          const isValid = regex.test(testValue);
                          e.target.style.borderColor = isValid ? '#10B981' : '#EF4444';
                        } catch (error) {
                          e.target.style.borderColor = '#EF4444';
                        }
                      } else {
                        e.target.style.borderColor = '#D1D5DB';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const testInput = document.querySelector('input[placeholder="Enter test value..."]');
                      if (testInput) {
                        testInput.value = '';
                        testInput.style.borderColor = '#D1D5DB';
                      }
                    }}
                    className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Clear
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Test your regex pattern with sample values. Green = valid, Red = invalid.
                </p>
              </div>

              {/* Enhanced Validation Preview */}
              <ValidationPreview 
                validation={formData.validation}
                fieldType={field?.type || 'text'}
              />
            </div>
          )}

          {/* Styling Tab */}
          {activeTab === 'styling' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <select
                    value={formData.styling.width}
                    onChange={(e) => handleChange('styling', 'width', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="100%">Full Width</option>
                    <option value="75%">75%</option>
                    <option value="50%">50%</option>
                    <option value="25%">25%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={formData.styling.height}
                    onChange={(e) => handleChange('styling', 'height', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="auto"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSS Classes
                </label>
                <input
                  type="text"
                  value={formData.styling.className}
                  onChange={(e) => handleChange('styling', 'className', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="custom-class another-class"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom CSS
                </label>
                <textarea
                  value={formData.styling.customCSS}
                  onChange={(e) => handleChange('styling', 'customCSS', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder="border: 2px solid red; background: yellow;"
                />
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Depends On Field
                </label>
                <input
                  type="text"
                  value={formData.advanced.dependsOn}
                  onChange={(e) => handleChange('advanced', 'dependsOn', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="other_field_name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Show When
                </label>
                <select
                  value={formData.advanced.showWhen}
                  onChange={(e) => handleChange('advanced', 'showWhen', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="always">Always</option>
                  <option value="condition">When condition is met</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Conditional Logic
                </label>
                <ConditionBuilder
                  condition={formData.advanced.condition}
                  onConditionChange={(condition) => handleChange('advanced', 'condition', condition)}
                  availableFields={availableFields}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Set when this field should be visible based on other field values
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calculate From Fields
                </label>
                <input
                  type="text"
                  value={formData.advanced.calculateFrom}
                  onChange={(e) => handleChange('advanced', 'calculateFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="field1, field2, field3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Calculation Formula
                </label>
                <input
                  type="text"
                  value={formData.advanced.calculation}
                  onChange={(e) => handleChange('advanced', 'calculation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="field1 + field2 * 0.1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
} 
