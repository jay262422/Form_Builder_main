import React, { useState, useEffect } from 'react';
import fieldOptionsService from '../services/fieldOptionsService';

/**
 * FieldConnectionManager - Manages connections between form fields and backend options
 */
export default function FieldConnectionManager({ 
  field, 
  onUpdate, 
  onClose 
}) {
  const [availableOptionTypes, setAvailableOptionTypes] = useState([]);
  const [selectedOptionType, setSelectedOptionType] = useState(field.optionType || '');
  const [showNewOptionType, setShowNewOptionType] = useState(false);
  const [newOptionType, setNewOptionType] = useState('');
  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailableOptionTypes();
  }, []);

  const loadAvailableOptionTypes = async () => {
    try {
      const types = await fieldOptionsService.getAvailableOptionTypes();
      setAvailableOptionTypes(types);
    } catch (err) {
      setError('Failed to load option types');
    }
  };

  const handleConnect = () => {
    if (!selectedOptionType) {
      setError('Please select an option type');
      return;
    }

    // Update the field with connection
    onUpdate({
      ...field,
      optionType: selectedOptionType,
      connectedToBackend: true,
      // Clear manual options if connecting to backend
      options: undefined
    });

    onClose();
  };

  const handleDisconnect = () => {
    // Remove connection
    onUpdate({
      ...field,
      optionType: undefined,
      connectedToBackend: false
    });

    onClose();
  };

  const handleAddNewOptionType = async () => {
    if (!newOptionType || !newOptionLabel || !newOptionValue) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add new option type to backend
      await fieldOptionsService.addOption(newOptionType, {
        label: newOptionLabel,
        value: newOptionValue
      }, true); // createNewType = true

      // Refresh available types
      await loadAvailableOptionTypes();
      
      // Select the new type
      setSelectedOptionType(newOptionType);
      
      // Reset form
      setNewOptionType('');
      setNewOptionLabel('');
      setNewOptionValue('');
      setShowNewOptionType(false);

    } catch (err) {
      setError('Failed to add new option type');
    } finally {
      setLoading(false);
    }
  };

  const handleAddOptionToExisting = async () => {
    if (!selectedOptionType || !newOptionLabel || !newOptionValue) {
      setError('Please fill all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add option to existing type
      await fieldOptionsService.addOption(selectedOptionType, {
        label: newOptionLabel,
        value: newOptionValue
      }, false); // createNewType = false

      // Reset form
      setNewOptionLabel('');
      setNewOptionValue('');

    } catch (err) {
      setError('Failed to add option');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Connect Field to Backend
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Field Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600">
            <strong>Field:</strong> {field.name || 'Unnamed Field'}
          </div>
          <div className="text-sm text-gray-600">
            <strong>Type:</strong> {field.type}
          </div>
          {field.connectedToBackend && (
            <div className="text-sm text-green-600">
              <strong>Currently connected to:</strong> {field.optionType}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Connection Options */}
        <div className="space-y-4">
          {/* Select Existing Option Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Connect to Existing Option Type:
            </label>
            <select
              value={selectedOptionType}
              onChange={(e) => setSelectedOptionType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select option type...</option>
              {availableOptionTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Add New Option Type */}
          <div>
            <button
              onClick={() => setShowNewOptionType(!showNewOptionType)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Create New Option Type
            </button>
          </div>

          {showNewOptionType && (
            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-2">Create New Option Type</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Option type name (e.g., 'custom_options')"
                  value={newOptionType}
                  onChange={(e) => setNewOptionType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="First option label"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="First option value"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleAddNewOptionType}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Create Option Type'}
                </button>
              </div>
            </div>
          )}

          {/* Add Option to Selected Type */}
          {selectedOptionType && (
            <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
              <h4 className="font-medium text-gray-800 mb-2">
                Add Option to "{selectedOptionType}"
              </h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Option label"
                  value={newOptionLabel}
                  onChange={(e) => setNewOptionLabel(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Option value"
                  value={newOptionValue}
                  onChange={(e) => setNewOptionValue(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <button
                  onClick={handleAddOptionToExisting}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Option'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-6">
          {field.connectedToBackend ? (
            <button
              onClick={handleDisconnect}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={!selectedOptionType}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Connect Field
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-800 mb-1">How it works:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Connect fields to existing option types from the backend</li>
            <li>• Create new option types if needed</li>
            <li>• Add options to existing types</li>
            <li>• Connected fields will load options dynamically</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 