import React, { useState, useEffect } from 'react';
import apiConfigManager from '../services/apiConfigManager';
import formSubmissionService from '../services/formSubmissionService';
import fieldOptionsService from '../services/fieldOptionsService';

/**
 * Endpoint Tester Component
 * Demonstrates per-endpoint switching between frontend and backend
 */
export default function EndpointTester() {
  const [config, setConfig] = useState(apiConfigManager.getConfig());
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for config changes
    const handleConfigChange = (newConfig) => {
      setConfig(newConfig);
    };

    apiConfigManager.addListener(handleConfigChange);
    return () => apiConfigManager.removeListener(handleConfigChange);
  }, []);

  // Test form submission
  const testFormSubmission = async () => {
    setLoading(true);
    try {
      const testData = {
        name: 'Test User',
        email: 'test@example.com',
        message: 'This is a test submission'
      };

      const result = await formSubmissionService.submitForm(testData, {}, { mode: 'auto' });
      
      setTestResults(prev => ({
        ...prev,
        submission: {
          success: result.success,
          message: result.success ? '✅ Form submitted successfully' : `❌ ${result.error}`,
          mode: result.mode || 'unknown'
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        submission: {
          success: false,
          message: `❌ Error: ${error.message}`,
          mode: 'error'
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Test field options
  const testFieldOptions = async () => {
    setLoading(true);
    try {
      const result = await fieldOptionsService.getAllFieldOptions();
      
      setTestResults(prev => ({
        ...prev,
        fieldOptions: {
          success: true,
          message: `✅ Loaded ${Object.keys(result).length} field option types`,
          data: result
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        fieldOptions: {
          success: false,
          message: `❌ Error: ${error.message}`,
          data: null
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Test specific endpoint
  const testEndpoint = async (serviceName, endpointName) => {
    setLoading(true);
    try {
      const endpoint = config.services[serviceName].endpoints[endpointName];
      const url = `${config.backend.baseURL}${endpoint.path}`;
      
      const response = await fetch(url, {
        method: endpoint.method,
        headers: apiConfigManager.getHeaders()
      });
      
      setTestResults(prev => ({
        ...prev,
        [`${serviceName}-${endpointName}`]: {
          success: response.ok,
          status: response.status,
          message: response.ok ? '✅ Success' : `❌ ${response.status} ${response.statusText}`,
          url: url
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [`${serviceName}-${endpointName}`]: {
          success: false,
          error: error.message,
          message: '❌ Connection failed',
          url: `${config.backend.baseURL}${config.services[serviceName].endpoints[endpointName].path}`
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  // Toggle endpoint backend usage
  const toggleEndpoint = (serviceName, endpointName) => {
    const currentValue = config.services[serviceName].endpoints[endpointName].useBackend;
    apiConfigManager.updateConfig({
      services: {
        ...config.services,
        [serviceName]: {
          ...config.services[serviceName],
          endpoints: {
            ...config.services[serviceName].endpoints,
            [endpointName]: {
              ...config.services[serviceName].endpoints[endpointName],
              useBackend: !currentValue
            }
          }
        }
      }
    });
  };

  const services = Object.keys(config.services);

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Endpoint Tester</h2>
        <p className="text-gray-600 mb-6">
          Test individual endpoints and see how they switch between frontend and backend modes.
        </p>

        {/* Backend Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Backend Status</h3>
          <div className="flex items-center space-x-4">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              config.backend.enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {config.backend.enabled ? '✅ Enabled' : '❌ Disabled'}
            </span>
            <span className="text-sm text-gray-600">
              Base URL: {config.backend.baseURL}
            </span>
          </div>
        </div>

        {/* Service Tests */}
        <div className="space-y-6">
          {services.map(serviceName => {
            const service = config.services[serviceName];
            const endpoints = Object.keys(service.endpoints);
            
            return (
              <div key={serviceName} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 capitalize">
                  {serviceName} Service
                </h3>
                
                <div className="space-y-3">
                  {endpoints.map(endpointName => {
                    const endpoint = service.endpoints[endpointName];
                    const testResult = testResults[`${serviceName}-${endpointName}`];
                    const isBackendEnabled = endpoint.useBackend && config.backend.enabled;
                    
                    return (
                      <div key={endpointName} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            isBackendEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <span className="font-medium text-gray-900">{endpointName}</span>
                          <span className="text-sm text-gray-600">{endpoint.description}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={isBackendEnabled}
                              onChange={() => toggleEndpoint(serviceName, endpointName)}
                              disabled={!config.backend.enabled}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-700">
                              {isBackendEnabled ? 'Backend' : 'Frontend'}
                            </span>
                          </label>
                          
                          <button
                            onClick={() => testEndpoint(serviceName, endpointName)}
                            disabled={!isBackendEnabled || loading}
                            className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Test
                          </button>
                        </div>
                        
                        {testResult && (
                          <div className={`text-xs p-2 rounded ${
                            testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {testResult.message}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Tests */}
        <div className="mt-8 space-y-4">
          <h3 className="font-semibold text-gray-900">Service Integration Tests</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={testFormSubmission}
              disabled={loading}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">Test Form Submission</div>
              <div className="text-sm text-gray-600">Submit a test form using current config</div>
              {testResults.submission && (
                <div className={`text-xs mt-2 p-2 rounded ${
                  testResults.submission.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.submission.message}
                </div>
              )}
            </button>
            
            <button
              onClick={testFieldOptions}
              disabled={loading}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">Test Field Options</div>
              <div className="text-sm text-gray-600">Load field options using current config</div>
              {testResults.fieldOptions && (
                <div className={`text-xs mt-2 p-2 rounded ${
                  testResults.fieldOptions.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {testResults.fieldOptions.message}
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Current Configuration</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {services.map(serviceName => {
              const service = config.services[serviceName];
              const backendCount = Object.values(service.endpoints).filter(e => e.useBackend).length;
              const frontendCount = Object.values(service.endpoints).filter(e => !e.useBackend).length;
              
              return (
                <div key={serviceName} className="text-gray-600">
                  <span className="font-medium capitalize">{serviceName}:</span>
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
    </div>
  );
}
