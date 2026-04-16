import React, { useState, useEffect } from 'react';

/**
 * FieldDependenciesManager - Manages field dependencies and conditional logic
 * Allows setting up complex field relationships and show/hide conditions
 */
export default function FieldDependenciesManager({
  field,
  allFields = [],
  onDependenciesChange,
  isOpen = false,
  onClose
}) {
  const [dependencies, setDependencies] = useState(field.dependencies || []);
  const [conditions, setConditions] = useState(field.conditions || []);
  const [showWhen, setShowWhen] = useState(field.showWhen || 'all');
  const [formula, setFormula] = useState(field.formula || '');
  const [dependsOn, setDependsOn] = useState(field.dependsOn || []);

  useEffect(() => {
    if (field) {
      setDependencies(field.dependencies || []);
      setConditions(field.conditions || []);
      setShowWhen(field.showWhen || 'all');
      setFormula(field.formula || '');
      setDependsOn(field.dependsOn || []);
    }
  }, [field]);

  const handleSave = () => {
    const updatedField = {
      ...field,
      dependencies,
      conditions,
      showWhen,
      formula,
      dependsOn
    };
    onDependenciesChange?.(updatedField);
    onClose?.();
  };

  const addDependency = () => {
    setDependencies([...dependencies, {
      field: '',
      operator: 'equals',
      value: '',
      action: 'show'
    }]);
  };

  const removeDependency = (index) => {
    setDependencies(dependencies.filter((_, i) => i !== index));
  };

  const updateDependency = (index, key, value) => {
    const updated = [...dependencies];
    updated[index] = { ...updated[index], [key]: value };
    setDependencies(updated);
  };

  const addCondition = () => {
    setConditions([...conditions, {
      field: '',
      operator: 'equals',
      value: ''
    }]);
  };

  const removeCondition = (index) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index, key, value) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [key]: value };
    setConditions(updated);
  };

  const getOperatorOptions = () => [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_than_or_equal', label: 'Greater than or equal' },
    { value: 'less_than_or_equal', label: 'Less than or equal' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
    { value: 'is_checked', label: 'Is checked' },
    { value: 'is_not_checked', label: 'Is not checked' }
  ];

  const getActionOptions = () => [
    { value: 'show', label: 'Show field' },
    { value: 'hide', label: 'Hide field' },
    { value: 'enable', label: 'Enable field' },
    { value: 'disable', label: 'Disable field' },
    { value: 'require', label: 'Make required' },
    { value: 'optional', label: 'Make optional' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Field Dependencies: {field?.label || 'Untitled Field'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* Field Dependencies */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Field Dependencies</h3>
              <div className="space-y-3">
                {dependencies.map((dependency, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={dependency.field}
                      onChange={(e) => updateDependency(index, 'field', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field...</option>
                      {allFields.map(field => (
                        <option key={field.name} value={field.name}>
                          {field.label || field.name}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={dependency.operator}
                      onChange={(e) => updateDependency(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {getOperatorOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={dependency.value}
                      onChange={(e) => updateDependency(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                      value={dependency.action}
                      onChange={(e) => updateDependency(index, 'action', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {getActionOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={() => removeDependency(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addDependency}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Dependency
                </button>
              </div>
            </div>

            {/* Conditional Logic */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conditional Logic</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Show when:</label>
                  <select
                    value={showWhen}
                    onChange={(e) => setShowWhen(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All conditions are met</option>
                    <option value="any">Any condition is met</option>
                    <option value="none">No conditions are met</option>
                  </select>
                </div>
                
                {conditions.map((condition, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <select
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select field...</option>
                      {allFields.map(field => (
                        <option key={field.name} value={field.name}>
                          {field.label || field.name}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {getOperatorOptions().map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(index, 'value', e.target.value)}
                      placeholder="Value"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <button
                      onClick={() => removeCondition(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addCondition}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add Condition
                </button>
              </div>
            </div>

            {/* Calculated Field Formula */}
            {field.type === 'calculated' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Formula</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dependencies (field names separated by commas)
                    </label>
                    <input
                      type="text"
                      value={dependsOn.join(', ')}
                      onChange={(e) => setDependsOn(e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                      placeholder="field1, field2, field3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      JavaScript Formula
                    </label>
                    <textarea
                      value={formula}
                      onChange={(e) => setFormula(e.target.value)}
                      placeholder="return formData.field1 + formData.field2;"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Dependencies
          </button>
        </div>
      </div>
    </div>
  );
}
