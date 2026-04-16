import React, { useState, useEffect } from 'react';
import apiConfigManager from '../services/apiConfigManager';

/**
 * API Status Indicator
 * Shows current API configuration status
 */
export default function ApiStatusIndicator() {
  const [config, setConfig] = useState(apiConfigManager.getConfig());
  const [connectionStatus, setConnectionStatus] = useState('unknown');

  // Listen for configuration changes
  useEffect(() => {
    const handleConfigChange = (newConfig) => {
      setConfig(newConfig);
    };

    apiConfigManager.addListener(handleConfigChange);
    return () => apiConfigManager.removeListener(handleConfigChange);
  }, []);

  // Test connection status
  useEffect(() => {
    const testConnection = async () => {
      if (config.backend.enabled) {
        const result = await apiConfigManager.testConnection();
        setConnectionStatus(result.success ? 'connected' : 'failed');
      } else {
        setConnectionStatus('disabled');
      }
    };

    testConnection();
  }, [config.backend.enabled, config.backend.baseURL]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'disabled':
        return 'bg-gray-400';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'API Connected';
      case 'failed':
        return 'API Failed';
      case 'disabled':
        return 'Frontend Only';
      default:
        return 'Testing...';
    }
  };

  const getEnabledServices = () => {
    return Object.entries(config.services)
      .filter(([_, service]) => service.enabled)
      .map(([name, _]) => name)
      .join(', ');
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-sm">
      <div className="flex items-center space-x-2 mb-2">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm font-medium text-gray-900">
          {getStatusText()}
        </span>
      </div>
      
      {config.backend.enabled && (
        <div className="text-xs text-gray-600 space-y-1">
          <div>URL: {config.backend.baseURL}</div>
          <div>Services: {getEnabledServices() || 'None'}</div>
        </div>
      )}
      
      {!config.backend.enabled && (
        <div className="text-xs text-gray-600">
          Using frontend-only mode
        </div>
      )}
    </div>
  );
}
