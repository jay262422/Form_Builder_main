import React, { useState, useEffect } from 'react';
import dynamicMappingsService from '../services/dynamicMappingsService';
import fieldOptionsService from '../services/fieldOptionsService';

/**
 * DynamicFieldConnection - Component for connecting fields to dynamic mappings
 * Allows users to enable dynamic behavior between fields using backend mappings
 */
export default function DynamicFieldConnection({
  field,
  allFields,
  onFieldUpdate,
  isOpen = false,
  onClose
}) {
  const [availableMappings, setAvailableMappings] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load available mappings for this field
  useEffect(() => {
    const loadAvailableMappings = async () => {
      if (!field || !isOpen) return;
      
      setLoading(true);
      setError('');
      
      try {
        // Use new logic that checks for backend-connected fields
        const mappings = await dynamicMappingsService.getAvailableMappingsForConnectedField(field, allFields);
        setAvailableMappings(mappings);
        
        // Auto-select current mapping if field is already dynamic
        // Check both dynamicMapping (builder approach) and getOptions (saved approach)
        let currentMapping = null;
        
        console.log(`🔍 DynamicFieldConnection: Auto-selection - Field state:`, {
          dynamicMapping: field.dynamicMapping,
          getOptions: field.getOptions ? 'present' : 'not present',
          dependsOn: field.dependsOn,
          optionType: field.optionType
        });
        
        if (field.dynamicMapping) {
          // Builder approach - field has dynamicMapping
          currentMapping = mappings.find(m => m.id === field.dynamicMapping);
          console.log(`🔍 DynamicFieldConnection: Looking for mapping with id: ${field.dynamicMapping}`);
        } else if (field.getOptions && typeof field.getOptions === 'string') {
          // Saved approach - field has getOptions function
          // Try to find mapping by checking if any mapping's parent field matches the dependsOn
          if (field.dependsOn) {
            currentMapping = mappings.find(m => 
              m.role === 'child' && m.parentField === field.dependsOn
            );
            console.log(`🔍 DynamicFieldConnection: Looking for mapping with parent field: ${field.dependsOn}`);
          }
          
          // If still not found, try to extract parent field from getOptions string
          if (!currentMapping && field.getOptions) {
            console.log(`🔍 DynamicFieldConnection: Trying to extract parent field from getOptions:`, field.getOptions);
            // Look for pattern: formData['parentFieldName']
            const match = field.getOptions.match(/formData\['([^']+)'\]/);
            if (match) {
              const extractedParentField = match[1];
              console.log(`🔍 DynamicFieldConnection: Extracted parent field: ${extractedParentField}`);
              currentMapping = mappings.find(m => 
                m.role === 'child' && m.parentField === extractedParentField
              );
            }
          }
          
          // If still not found, try to match by optionType (fallback)
          if (!currentMapping && field.optionType) {
            console.log(`🔍 DynamicFieldConnection: Trying to match by optionType: ${field.optionType}`);
            currentMapping = mappings.find(m => 
              m.role === 'child' && m.childOptionType === field.optionType
            );
          }
        }
        
        console.log(`🔍 DynamicFieldConnection: Available mappings:`, mappings.map(m => ({ 
          id: m.id, 
          name: m.name, 
          role: m.role, 
          parentField: m.parentField,
          childField: m.childField,
          parentOptionType: m.parentOptionType,
          childOptionType: m.childOptionType
        })));
        
        if (currentMapping) {
          console.log(`🔍 DynamicFieldConnection: Auto-selecting current mapping:`, currentMapping);
          setSelectedMapping(currentMapping);
        } else {
          console.log(`🔍 DynamicFieldConnection: Could not find current mapping`);
          console.log(`🔍 DynamicFieldConnection: Field state:`, {
            dynamicMapping: field.dynamicMapping,
            getOptions: field.getOptions ? 'present' : 'not present',
            dependsOn: field.dependsOn
          });
        }
      } catch (error) {
        console.error('Error loading available mappings:', error);
        setError('Failed to load available mappings');
      } finally {
        setLoading(false);
      }
    };

    loadAvailableMappings();
  }, [field, allFields, isOpen]);

  // Handle mapping selection
  const handleMappingSelect = (mapping) => {
    console.log(`🔍 DynamicFieldConnection: Mapping selected:`, mapping);
    setSelectedMapping(mapping);
  };

  // Reset selected mapping when field changes
  useEffect(() => {
    console.log(`🔍 DynamicFieldConnection: Field changed, dynamicMapping:`, field?.dynamicMapping, `getOptions:`, field?.getOptions);
    if (field && !field.dynamicMapping && !field.getOptions) {
      console.log(`🔍 DynamicFieldConnection: Resetting selected mapping to null`);
      setSelectedMapping(null);
    }
  }, [field]);

  // Handle enabling dynamic connection
  const handleEnableDynamic = async () => {
    if (!selectedMapping) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Update field with dynamic mapping based on role
      const updatedField = {
        ...field,
        dynamicMapping: selectedMapping.id
      };
      
      if (selectedMapping.role === 'child') {
        // This field will be a child, so it depends on the parent field
        updatedField.dependsOn = selectedMapping.parentField;
        // Remove static options when dynamic is enabled - options will be loaded dynamically
        updatedField.options = [];
        
        // ✅ SAVE MAPPING DATA for dynamic reconstruction
        updatedField.dynamicConfig = {
          parentField: selectedMapping.parentField,
          mappingData: selectedMapping.mapping,
          mappingId: selectedMapping.id
        };
        
        // Keep the optionType for backend connection
        console.log(`🔍 DynamicFieldConnection: Setting ${field.name} to depend on ${selectedMapping.parentField}`);
        console.log(`🔍 DynamicFieldConnection: Added dynamicConfig for dynamic behavior`);
        console.log(`🔍 DynamicFieldConnection: Field will use backend optionType: ${field.optionType}`);
        console.log(`🔍 DynamicFieldConnection: Updated field structure:`, updatedField);
        console.log(`🔍 DynamicFieldConnection: Selected mapping:`, selectedMapping);
        console.log(`🔍 DynamicFieldConnection: Role is CHILD - field will depend on parent`);
      } else if (selectedMapping.role === 'parent') {
        // This field will be a parent, so the child field depends on it
        updatedField.dependsOn = null; // Parent doesn't depend on anything
        console.log(`🔍 DynamicFieldConnection: Setting ${field.name} as parent`);
        console.log(`🔍 DynamicFieldConnection: Role is PARENT - field will be parent for child`);
      }
      
      console.log(`🔍 DynamicFieldConnection: Updated field:`, updatedField);
      onFieldUpdate(updatedField);
      onClose();
    } catch (error) {
      console.error('Error enabling dynamic connection:', error);
      setError('Failed to enable dynamic connection');
    } finally {
      setLoading(false);
    }
  };

  // Handle disabling dynamic connection
  const handleDisableDynamic = () => {
    // Clear selected mapping if it's just selected but not applied
    if (selectedMapping && !field.dynamicMapping && !field.getOptions) {
      console.log(`🔍 DynamicFieldConnection: Clearing selected mapping`);
      setSelectedMapping(null);
      return;
    }
    
    const updatedField = {
      ...field,
      dynamicMapping: null,
      dependsOn: null,
      dynamicConfig: undefined, // ✅ Remove dynamicConfig
      getOptions: undefined // ✅ Remove getOptions that was created from dynamicConfig
    };
    
    // If field has optionType, load static options from backend
    if (field.optionType) {
      console.log(`🔍 DynamicFieldConnection: Disabling dynamic for ${field.name}`);
      console.log(`🔍 DynamicFieldConnection: Will load static options from optionType: ${field.optionType}`);
    }
    
    console.log(`🔍 DynamicFieldConnection: Disabling dynamic - updated field:`, updatedField);
    onFieldUpdate(updatedField);
    onClose();
  };

  if (!isOpen) return null;

  console.log(`🔍 DynamicFieldConnection: Rendering with field:`, field);
  console.log(`🔍 DynamicFieldConnection: Field dynamicMapping:`, field?.dynamicMapping);
  console.log(`🔍 DynamicFieldConnection: Field dependsOn:`, field?.dependsOn);
  console.log(`🔍 DynamicFieldConnection: Field getOptions:`, field?.getOptions ? 'present' : 'not present');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Dynamic Field Connection
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Connect "{field?.label || field?.name}" to dynamic mappings
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Current Status */}
          {(field?.dynamicMapping || (field?.getOptions && field?.dependsOn) || selectedMapping) ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">🔄</span>
                  <span className="text-sm text-green-800">
                    <strong>Dynamic Enabled:</strong> {field.dynamicMapping || selectedMapping?.name || 'getOptions'}
                  </span>
                </div>
                <button
                  onClick={handleDisableDynamic}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Disable
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">⚪</span>
                <span className="text-sm text-gray-700">
                  <strong>Static Field:</strong> No dynamic behavior enabled
                </span>
              </div>
            </div>
          )}

          {/* Available Mappings */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Available Dynamic Mappings
            </h4>
            
            {loading ? (
              <div className="text-center py-4 text-blue-600">
                Loading available mappings...
              </div>
            ) : error ? (
              <div className="text-center py-4 text-red-600">
                {error}
              </div>
                         ) : availableMappings.length === 0 ? (
               <div className="text-center py-4 text-gray-500">
                 <div>No dynamic mappings available for this field</div>
                 <div className="text-xs mt-2 text-gray-400">
                   Field: "{field?.name}" | Backend: "{field?.optionType || 'Not connected'}"
                 </div>
                 {!field?.optionType ? (
                   <div className="text-xs mt-1 text-red-400">
                     ❌ Field must be connected to backend options first
                   </div>
                 ) : (
                   <div className="text-xs mt-1 text-gray-400">
                     ℹ️ Need another field connected to different backend options to enable dynamic
                   </div>
                 )}
                 <div className="text-xs mt-1 text-gray-400">
                   Tip: Connect fields to different backend option types (e.g., "countries" + "states")
                 </div>
               </div>
            ) : (
              <div className="space-y-2">
                {availableMappings.map((mapping) => (
                  <div
                    key={mapping.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMapping?.id === mapping.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleMappingSelect(mapping)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {mapping.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {mapping.description}
                        </div>
                                                 <div className="text-xs text-gray-500 mt-1">
                           {mapping.role === 'child' ? (
                             <span className="text-blue-600">
                               This field ({field?.optionType}) will depend on "{mapping.parentField}" ({mapping.parentOptionType})
                             </span>
                           ) : mapping.role === 'parent' ? (
                             <span className="text-green-600">
                               "{mapping.childField}" ({mapping.childOptionType}) will depend on this field ({field?.optionType})
                             </span>
                           ) : (
                             <span>Dynamic mapping</span>
                           )}
                         </div>
                      </div>
                      <div className="text-blue-600">
                        {selectedMapping?.id === mapping.id ? '✓' : '→'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {!field?.dynamicMapping && availableMappings.length > 0 && (
            <div className="flex space-x-3">
              <button
                onClick={handleEnableDynamic}
                disabled={!selectedMapping || loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enabling...' : 'Enable Dynamic'}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 