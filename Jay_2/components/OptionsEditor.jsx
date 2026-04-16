import React, { useState, useEffect } from 'react';
import fieldOptionsService from '../services/fieldOptionsService';
import FieldConnectionManager from './FieldConnectionManager';

const QUICK_TEMPLATES = {
  'yes_no': [
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' }
  ],
  'priority': [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ],
  'status': [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' }
  ],
  'rating': [
    { label: '1 Star', value: '1' },
    { label: '2 Stars', value: '2' },
    { label: '3 Stars', value: '3' },
    { label: '4 Stars', value: '4' },
    { label: '5 Stars', value: '5' }
  ]
};

/**
 * OptionsEditor - Component for managing dropdown options
 * Allows adding, editing, and removing options
 */
export default function OptionsEditor({
  field,
  onOptionsChange,
  onFieldUpdate,
  isOpen = false,
  onClose
}) {
  // Add null check for field
  if (!field) {
    console.warn('OptionsEditor: field prop is undefined');
    return null;
  }

  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState({ label: '', value: '' });
  const [editingIndex, setEditingIndex] = useState(-1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showConnectionManager, setShowConnectionManager] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);

  // Load options from backend or use field's own options
  useEffect(() => {
    const loadOptions = async () => {
      if (field && field.connectedToBackend && field.optionType) {
        setLoadingOptions(true);
        try {
          // Load from fieldOptionsService for connected fields
          const serviceOptions = await fieldOptionsService.getOptionType(field.optionType);
          setOptions(serviceOptions || []);
          onOptionsChange?.(serviceOptions || []);
        } catch (error) {
          console.error('Error loading field options:', error);
          setOptions([]);
        } finally {
          setLoadingOptions(false);
        }
      } else if (field && field.options) {
        // Use field's own options if not connected to backend
        setOptions(field.options || []);
        onOptionsChange?.(field.options || []);
      }
    };

    loadOptions();
  }, [field?.optionType, field?.connectedToBackend]); // Removed onOptionsChange to prevent infinite loop

  // Handle adding new option
  const handleAddOption = () => {
    if (!newOption.label.trim()) return;

    const option = {
      label: newOption.label.trim(),
      value: newOption.value.trim() || newOption.label.trim().toLowerCase().replace(/\s+/g, '_')
    };

    const updatedOptions = [...options, option];
    setOptions(updatedOptions);
    onOptionsChange?.(updatedOptions);
    
    setNewOption({ label: '', value: '' });
    setShowAddForm(false);
  };

  // Handle editing option
  const handleEditOption = (index) => {
    const option = options[index];
    setNewOption({ label: option.label, value: option.value });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  // Handle updating option
  const handleUpdateOption = () => {
    if (!newOption.label.trim()) return;

    const updatedOptions = [...options];
    updatedOptions[editingIndex] = {
      label: newOption.label.trim(),
      value: newOption.value.trim() || newOption.label.trim().toLowerCase().replace(/\s+/g, '_')
    };

    setOptions(updatedOptions);
    onOptionsChange?.(updatedOptions);
    
    setNewOption({ label: '', value: '' });
    setEditingIndex(-1);
    setShowAddForm(false);
  };

  // Handle removing option
  const handleRemoveOption = (index) => {
    const updatedOptions = options.filter((_, i) => i !== index);
    setOptions(updatedOptions);
    onOptionsChange?.(updatedOptions);
  };

  // Handle cancel edit/add
  const handleCancel = () => {
    setNewOption({ label: '', value: '' });
    setEditingIndex(-1);
    setShowAddForm(false);
  };

  // Handle quick template selection
  const handleQuickTemplate = (templateName) => {
    const template = QUICK_TEMPLATES[templateName];
    if (template) {
      setOptions(template);
      onOptionsChange?.(template);
      setShowQuickTemplates(false);
    }
  };



  if (!isOpen) return null;

  // Safety check for options
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Manage Options for "{field?.label || 'Unknown Field'}"
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Connection Status */}
          {field?.connectedToBackend && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🔗</span>
                  <span className="text-sm text-green-800">
                    Connected to backend: <strong>{field.optionType}</strong>
                  </span>
                </div>
                <button
                  onClick={() => setShowConnectionManager(true)}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Manage
                </button>
              </div>
            </div>
          )}

                     {/* Connect to Backend - Only show if NOT connected */}
           {!field?.connectedToBackend && (
             <div className="mb-6">
               <div className="flex items-center justify-between mb-2">
                 <label className="block text-sm font-medium text-gray-700">
                   Backend Connection
                 </label>
                 <button
                   onClick={() => setShowConnectionManager(true)}
                   className="text-sm text-blue-600 hover:text-blue-800"
                 >
                   🔗 Connect to Backend
                 </button>
               </div>
               <p className="text-xs text-gray-500">
                 Connect to backend to use options from JSON file
               </p>
             </div>
           )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                {editingIndex >= 0 ? 'Edit Option' : 'Add New Option'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={newOption.label}
                    onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Option label"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={newOption.value}
                    onChange={(e) => setNewOption(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Option value"
                  />
                </div>
              </div>
              <div className="flex space-x-2 mt-3">
                <button
                  onClick={editingIndex >= 0 ? handleUpdateOption : handleAddOption}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingIndex >= 0 ? 'Update' : 'Add'}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">
                Options ({safeOptions.length})
                {loadingOptions && <span className="text-blue-600 ml-2">(Loading...)</span>}
                {field?.connectedToBackend && !loadingOptions && (
                  <span className="text-green-600 ml-2">(From Backend)</span>
                )}
              </h4>
                             {!field?.connectedToBackend && (
                 <div className="flex space-x-2">
                   <button
                     onClick={() => setShowQuickTemplates(true)}
                     className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
                   >
                     📋 Quick Templates
                   </button>
                   <button
                     onClick={() => setShowAddForm(true)}
                     className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                   >
                     + Add Option
                   </button>
                 </div>
               )}
            </div>

            {loadingOptions ? (
              <div className="text-center py-4 text-blue-600">
                Loading options from backend...
              </div>
            ) : field?.connectedToBackend && safeOptions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No options found in backend for "{field.optionType}"
              </div>
            ) : !field?.connectedToBackend && safeOptions.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No options defined
              </div>
            ) : (
              <div className="space-y-2">
                {safeOptions.map((option, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {option.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        Value: {option.value}
                      </div>
                    </div>
                                         {!field?.connectedToBackend && (
                       <div className="flex space-x-2">
                         <button
                           onClick={() => handleEditOption(index)}
                           className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                           title="Edit option"
                         >
                           ✏️
                         </button>
                         <button
                           onClick={() => handleRemoveOption(index)}
                           className="p-1 text-red-600 hover:bg-red-50 rounded"
                           title="Remove option"
                         >
                           🗑️
                         </button>
                       </div>
                     )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select an option...</option>
              {safeOptions.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>

             {/* Field Connection Manager */}
       {showConnectionManager && (
         <FieldConnectionManager
           field={field}
           onUpdate={(updatedField) => {
             onFieldUpdate?.(updatedField);
             setShowConnectionManager(false);
           }}
           onClose={() => setShowConnectionManager(false)}
         />
       )}

       {/* Quick Templates Modal */}
       {showQuickTemplates && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-semibold text-gray-800">
                 Quick Templates
               </h3>
               <button
                 onClick={() => setShowQuickTemplates(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             </div>
             <div className="grid grid-cols-2 gap-3">
               {Object.entries(QUICK_TEMPLATES).map(([name, template]) => (
                 <button
                   key={name}
                   onClick={() => handleQuickTemplate(name)}
                   className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                 >
                   <div className="font-medium text-gray-800 capitalize">
                     {name.replace('_', ' ')}
                   </div>
                   <div className="text-xs text-gray-500">
                     {template.length} options
                   </div>
                 </button>
               ))}
             </div>
             <div className="mt-4 text-center">
               <button
                 onClick={() => setShowQuickTemplates(false)}
                 className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
               >
                 Cancel
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 } 