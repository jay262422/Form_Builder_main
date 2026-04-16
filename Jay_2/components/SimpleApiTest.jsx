import React, { useState } from 'react';
import fieldOptionsService from '../services/fieldOptionsService';
import dynamicMappingsService from '../services/dynamicMappingsService';
import fileFormManager from '../services/fileFormManager';

export default function SimpleApiTest() {
  const [testResult, setTestResult] = useState('');
  const [selectedService, setSelectedService] = useState('fieldOptions');

  const testService = async () => {
    try {
      let result;
      let message;

      switch (selectedService) {
        case 'fieldOptions':
          result = await fieldOptionsService.getAllFieldOptions();
          message = `Success! Got ${Object.keys(result).length} field option types.`;
          break;
        case 'dynamicMappings':
          result = await dynamicMappingsService.getAllDynamicMappings();
          message = `Success! Got ${Object.keys(result).length} dynamic mappings.`;
          break;
        case 'forms':
          result = await fileFormManager.getAllForms();
          message = `Success! Got ${result.length} forms.`;
          break;
        default:
          message = 'Unknown service selected.';
      }

      setTestResult(message);
    } catch (error) {
      setTestResult(`Error: ${error.message}`);
    }
  };

  const getCurrentBaseUrl = () => {
    switch (selectedService) {
      case 'fieldOptions':
        return fieldOptionsService.baseUrl;
      case 'dynamicMappings':
        return dynamicMappingsService.baseUrl;
      case 'forms':
        return fileFormManager.baseUrl;
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Simple API Test - Backend Only</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select Service:</label>
          <select
            value={selectedService}
            onChange={e => setSelectedService(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="fieldOptions">Field Options</option>
            <option value="dynamicMappings">Dynamic Mappings</option>
            <option value="forms">Forms</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 border rounded">
            <h4 className="font-semibold">Field Options</h4>
            <p className="text-sm">URL: {fieldOptionsService.baseUrl}</p>
            <p className="text-sm">Mode: Backend</p>
          </div>
          <div className="p-3 border rounded">
            <h4 className="font-semibold">Dynamic Mappings</h4>
            <p className="text-sm">URL: {dynamicMappingsService.baseUrl}</p>
            <p className="text-sm">Mode: Backend</p>
          </div>
          <div className="p-3 border rounded">
            <h4 className="font-semibold">Forms</h4>
            <p className="text-sm">URL: {fileFormManager.baseUrl}</p>
            <p className="text-sm">Mode: Backend</p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded">
          <p><strong>Selected Service:</strong> {selectedService}</p>
          <p><strong>Current Base URL:</strong> {getCurrentBaseUrl()}</p>
          <p><strong>Using Backend:</strong> Yes</p>
        </div>

        <div>
          <button
            onClick={testService}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test Selected Service
          </button>
        </div>

        {testResult && (
          <div className="p-3 bg-gray-100 rounded">
            <p>{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
}
