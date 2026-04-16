import React, { useState, useEffect } from 'react';
import apiConfigManager from '../services/apiConfigManager';

/**
 * Enhanced API Configuration Panel
 * Allows granular control over each endpoint (frontend vs backend)
 */
export default function ApiConfigPanel({ isOpen, onClose, onSave }) {
  const [config, setConfig] = useState(apiConfigManager.getConfig());
  const [activeService, setActiveService] = useState('forms');
  const [testResults, setTestResults] = useState({});

  // Load saved configuration on mount
  useEffect(() => {
    setConfig(apiConfigManager.getConfig());
  }, []);

  // Save configuration
  const handleSave = () => {
    apiConfigManager.saveConfig(config);
    onSave(config);
    onClose();
  };

  // Test API connection
  const testConnection = async () => {
    const result = await apiConfigManager.testConnection();
    if (result.success) {
      alert('✅ API connection successful!');
    } else {
      alert('❌ API connection failed: ' + result.message);
    }
  };

  // Test specific endpoint
  const testEndpoint = async (serviceName, endpointName) => {
    const endpoint = config.services[serviceName].endpoints[endpointName];
    const url = `${config.backend.baseURL}${endpoint.path}`;
    
    try {
      const response = await fetch(url, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      setTestResults(prev => ({
        ...prev,
        [`${serviceName}-${endpointName}`]: {
          success: response.ok,
          status: response.status,
          message: response.ok ? '✅ Success' : `❌ ${response.status} ${response.statusText}`
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`${serviceName}-${endpointName}`]: {
          success: false,
          error: error.message,
          message: '❌ Connection failed'
        }
      }));
    }
  };

  // Update endpoint configuration
  const updateEndpoint = (serviceName, endpointName, updates) => {
    setConfig(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: {
          ...prev.services[serviceName],
          endpoints: {
            ...prev.services[serviceName].endpoints,
            [endpointName]: {
              ...prev.services[serviceName].endpoints[endpointName],
              ...updates
            }
          }
        }
      }
    }));
  };

  // Toggle endpoint backend usage
  const toggleEndpointBackend = (serviceName, endpointName) => {
    const currentValue = config.services[serviceName].endpoints[endpointName].useBackend;
    updateEndpoint(serviceName, endpointName, { useBackend: !currentValue });
  };

  // Bulk operations
  const enableAllBackend = (serviceName) => {
    const service = config.services[serviceName];
    const updatedEndpoints = {};
    
    Object.keys(service.endpoints).forEach(endpointName => {
      updatedEndpoints[endpointName] = {
        ...service.endpoints[endpointName],
        useBackend: true
      };
    });

    setConfig(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: {
          ...prev.services[serviceName],
          endpoints: updatedEndpoints
        }
      }
    }));
  };

  const enableAllFrontend = (serviceName) => {
    const service = config.services[serviceName];
    const updatedEndpoints = {};
    
    Object.keys(service.endpoints).forEach(endpointName => {
      updatedEndpoints[endpointName] = {
        ...service.endpoints[endpointName],
        useBackend: false
      };
    });

    setConfig(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: {
          ...prev.services[serviceName],
          endpoints: updatedEndpoints
        }
      }
    }));
  };

  if (!isOpen) return null;

  const services = Object.keys(config.services);
  const currentService = config.services[activeService];
  const endpoints = Object.keys(currentService.endpoints);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Advanced API Configuration</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Configure each endpoint individually to use frontend (localStorage) or backend API
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Backend Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Backend API Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enable Backend API
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.backend.enabled}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      backend: { ...prev.backend, enabled: e.target.checked }
                    }))}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Use backend API</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="text"
                  value={config.backend.baseURL}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    backend: { ...prev.backend, baseURL: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://localhost:3004"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Connection
                </label>
                <button
                  onClick={testConnection}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Test Connection
                </button>
              </div>
            </div>
          </div>

          {/* Service Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Service Configuration</h3>
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {services.map(serviceName => (
                <button
                  key={serviceName}
                  onClick={() => setActiveService(serviceName)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    activeService === serviceName
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Endpoint Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeService.charAt(0).toUpperCase() + activeService.slice(1)} Endpoints
              </h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => enableAllBackend(activeService)}
                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Enable All Backend
                </button>
                <button
                  onClick={() => enableAllFrontend(activeService)}
                  className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700"
                >
                  Enable All Frontend
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {endpoints.map(endpointName => {
                const endpoint = currentService.endpoints[endpointName];
                const testResult = testResults[`${activeService}-${endpointName}`];
                
                return (
                  <div key={endpointName} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            endpoint.useBackend && config.backend.enabled
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <span className="font-medium text-gray-900">{endpointName}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={endpoint.useBackend && config.backend.enabled}
                              onChange={() => toggleEndpointBackend(activeService, endpointName)}
                              disabled={!config.backend.enabled}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-700">
                              {endpoint.useBackend && config.backend.enabled ? 'Backend' : 'Frontend'}
                            </span>
                          </label>
                        </div>
                      </div>

                      <button
                        onClick={() => testEndpoint(activeService, endpointName)}
                        disabled={!endpoint.useBackend || !config.backend.enabled}
                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Test
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">{endpoint.description}</p>
                      <p className="text-xs text-gray-500 font-mono">{endpoint.path}</p>
                      
                      {testResult && (
                        <div className={`text-xs p-2 rounded ${
                          testResult.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {testResult.message}
                          {testResult.status && ` (${testResult.status})`}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Configuration Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {services.map(serviceName => {
                const service = config.services[serviceName];
                const backendCount = Object.values(service.endpoints).filter(e => e.useBackend).length;
                const frontendCount = Object.values(service.endpoints).filter(e => !e.useBackend).length;
                
                return (
                  <div key={serviceName} className="text-gray-600">
                    <span className="font-medium">{serviceName}:</span>
                    <div className="text-xs">
                      <span className="text-blue-600">{backendCount} backend</span>
                      <span className="mx-1">•</span>
                      <span className="text-orange-600">{frontendCount} frontend</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
