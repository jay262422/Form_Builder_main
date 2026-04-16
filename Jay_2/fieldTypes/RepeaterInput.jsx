import React, { useState, useEffect } from 'react';

/**
 * RepeaterInput - Repeating field component
 * Allows users to add/remove multiple instances of field groups
 */
export default function RepeaterInput({
  field,
  value = [],
  onChange,
  formData = {},
  disabled = false,
  error = null
}) {
  // Debug logging
  console.log('RepeaterInput props:', { field, value, onChange, disabled, error });
  
  // Add fallback for when field is undefined
  if (!field) {
    console.error('RepeaterInput: field prop is undefined or null');
    return (
      <div className="repeater-input">
        <div className="text-red-500 text-sm">Error: Field configuration is missing</div>
      </div>
    );
  }

  const [items, setItems] = useState(value || []);
  const minItems = field.minItems || 1;
  const maxItems = field.maxItems || 10;
  const template = field.template || [];

  useEffect(() => {
    if (value !== items) {
      setItems(value || []);
    }
  }, [value]);

  const addItem = () => {
    if (items.length < maxItems) {
      const newItem = template.map(fieldTemplate => ({
        ...fieldTemplate,
        name: `${fieldTemplate.name}_${items.length}`,
        value: fieldTemplate.defaultValue || ''
      }));
      
      const newItems = [...items, newItem];
      setItems(newItems);
      onChange(newItems);
    }
  };

  const removeItem = (index) => {
    if (items.length > minItems) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
      onChange(newItems);
    }
  };

  const updateItem = (itemIndex, fieldName, fieldValue) => {
    const newItems = [...items];
    const item = newItems[itemIndex];
    const fieldIndex = item.findIndex(f => f.name === fieldName);
    
    if (fieldIndex !== -1) {
      item[fieldIndex].value = fieldValue;
      setItems(newItems);
      onChange(newItems);
    }
  };

  const renderTemplateField = (templateField, itemIndex) => {
    const fieldName = templateField.name;
    const fieldValue = templateField.value || '';

    switch (templateField.type) {
      case 'text':
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => updateItem(itemIndex, fieldName, e.target.value)}
            placeholder={templateField.placeholder || ''}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={fieldValue}
            onChange={(e) => updateItem(itemIndex, fieldName, e.target.value)}
            placeholder={templateField.placeholder || ''}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'select':
        return (
          <select
            value={fieldValue}
            onChange={(e) => updateItem(itemIndex, fieldName, e.target.value)}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{templateField.placeholder || 'Select...'}</option>
            {templateField.options?.map((option, idx) => (
              <option key={idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => updateItem(itemIndex, fieldName, e.target.value)}
            placeholder={templateField.placeholder || ''}
            disabled={disabled}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="repeater-input">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Repeater ({items.length}/{maxItems})
        </span>
      </label>
      
      <div className="space-y-4">
        {items.map((item, itemIndex) => (
          <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-gray-700">
                Item {itemIndex + 1}
              </h4>
              {items.length > minItems && (
                <button
                  type="button"
                  onClick={() => removeItem(itemIndex)}
                  disabled={disabled}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {item.map((templateField, fieldIndex) => (
                <div key={fieldIndex} className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    {templateField.label}
                    {templateField.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderTemplateField(templateField, itemIndex)}
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {items.length < maxItems && (
          <button
            type="button"
            onClick={addItem}
            disabled={disabled}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + Add {field.label || 'Item'}
          </button>
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
