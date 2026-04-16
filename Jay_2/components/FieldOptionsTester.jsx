import React, { useState, useEffect } from 'react';
import fieldOptionsService from '../services/fieldOptionsService';

/**
 * FieldOptionsTester - Test component to verify field options API
 */
export default function FieldOptionsTester() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [options, setOptions] = useState([]);
  const [allOptions, setAllOptions] = useState(null);

  // Load available option types on component mount
  useEffect(() => {
    loadAvailableTypes();
  }, []);

  const loadAvailableTypes = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const types = await fieldOptionsService.getAvailableOptionTypes();
      setAvailableTypes(types);
      
      if (types.length > 0) {
        setSelectedType(types[0]);
        await loadOptionsForType(types[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadOptionsForType = async (optionType) => {
    setLoading(true);
    setError(null);
    
    try {
      const typeOptions = await fieldOptionsService.getOptionType(optionType);
      setOptions(typeOptions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOptions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const all = await fieldOptionsService.getAllFieldOptions();
      setAllOptions(all);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = async (type) => {
    setSelectedType(type);
    await loadOptionsForType(type);
  };

  const clearCache = () => {
    fieldOptionsService.clearCache();
    alert('Cache cleared!');
  };

  const getCacheStats = () => {
    const stats = fieldOptionsService.getCacheStats();
    alert(`Cache Stats:\nSize: ${stats.size}\nKeys: ${stats.keys.join(', ')}\nTimeout: ${stats.timeout}ms`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Field Options API Tester
        </h1>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            Loading...
          </div>
        )}

        {/* Control Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={loadAvailableTypes}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={loading}
          >
            Refresh Types
          </button>
          
          <button
            onClick={loadAllOptions}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            disabled={loading}
          >
            Load All Options
          </button>
          
          <button
            onClick={clearCache}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Clear Cache
          </button>
          
          <button
            onClick={getCacheStats}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Cache Stats
          </button>
        </div>

        {/* Option Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option Type:
          </label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            {availableTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Options Display */}
        {selectedType && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              Options for "{selectedType}" ({options.length} items)
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              {Array.isArray(options) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {options.map((option, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="font-medium text-gray-800">{option.label}</div>
                      <div className="text-sm text-gray-600">Value: {option.value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-600">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(options, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Options Display */}
        {allOptions && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-gray-800">
              All Field Options ({Object.keys(allOptions).length} types)
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {Object.entries(allOptions).map(([type, options]) => (
                  <div key={type} className="bg-white p-4 rounded border">
                    <h3 className="font-semibold text-gray-800 mb-2">{type}</h3>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(options) 
                        ? `${options.length} options`
                        : `${Object.keys(options).length} nested categories`
                      }
                    </div>
                    {Array.isArray(options) && options.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Sample: {options.slice(0, 3).map(opt => opt.label).join(', ')}
                        {options.length > 3 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API Status */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">API Status</h3>
          <div className="text-sm text-gray-600">
            <div>Base URL: {fieldOptionsService.baseUrl}</div>
            <div>Cache Timeout: {fieldOptionsService.cacheTimeout}ms</div>
            <div>Available Types: {availableTypes.length}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 