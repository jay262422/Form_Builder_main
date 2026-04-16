/**
 * Dynamic Mappings Service
 * Handles loading and managing dynamic field mappings from the API
 */

import SIMPLE_API_CONFIG from './simpleApiConfig';

class DynamicMappingsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get the current base URL for this service
   */
  get baseUrl() {
    return SIMPLE_API_CONFIG.getBaseURL('dynamicMappings');
  }

  async parseResponse(response) {
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.message || payload?.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    return payload?.data !== undefined ? payload.data : payload;
  }

  getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }
    return headers;
  }

  /**
   * Get all dynamic mappings
   * @returns {Promise<Object>} All dynamic mappings
   */
  async getAllDynamicMappings() {
    const cacheKey = 'all';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'getAll');
      const response = await fetch(url);
      const data = await this.parseResponse(response);

      let mappings = {};

      if (data.mappings && Array.isArray(data.mappings)) {
        mappings = data.mappings.reduce((acc, mapping) => {
          acc[mapping.id || mapping._id] = mapping;
          return acc;
        }, {});
      }
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: mappings,
        timestamp: Date.now()
      });
      
      return mappings;
    } catch (error) {
      console.error('Error loading all dynamic mappings:', error);
      // Return empty object instead of throwing to prevent crashes
      return {};
    }
  }

  /**
   * Get specific dynamic mapping
   * @param {string} mappingId - The mapping ID to get
   * @returns {Promise<Object>} The specific mapping
   */
  async getDynamicMapping(mappingId) {
    const cacheKey = `mapping_${mappingId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'getById', { id: mappingId });
      const response = await fetch(url);
      const data = await this.parseResponse(response);
      const mapping = data || null;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: mapping,
        timestamp: Date.now()
      });
      
      return mapping;
    } catch (error) {
      console.error(`Error loading dynamic mapping '${mappingId}':`, error);
      // Return null instead of throwing to prevent crashes
      return null;
    }
  }

  /**
   * Get mapped options for a specific mapping and parent value
   * @param {string} mappingId - The mapping ID
   * @param {string} parentValue - The parent value to get options for
   * @returns {Promise<Array>} Mapped options for the parent value
   */
  async getMappedOptions(mappingId, parentValue) {
    const cacheKey = `mapped_options_${mappingId}_${parentValue}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'getMappedOptions', {
        mappingId,
        parentValue
      });
      const response = await fetch(url);
      const data = await this.parseResponse(response);
      const options = data.mappedOptions || [];
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: options,
        timestamp: Date.now()
      });
      
      return options;
    } catch (error) {
      console.error(`Error loading mapped options for '${mappingId}/${parentValue}':`, error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  /**
   * Get available dynamic mappings for a field
   * @param {string} fieldName - The field name to find mappings for
   * @param {string} role - 'parent' or 'child'
   * @returns {Promise<Array>} Available mappings
   */
  async getAvailableMappingsForField(fieldName, role = 'child') {
    try {
      const allMappings = await this.getAllDynamicMappings();
      const availableMappings = [];
      
      console.log(`🔍 Looking for mappings for field: "${fieldName}" with role: "${role}"`);
      console.log('📋 Available mappings:', Object.keys(allMappings));
      
      for (const [mappingId, mapping] of Object.entries(allMappings)) {
        console.log(`  📝 Checking mapping "${mappingId}":`);
        console.log(`    - parentField: "${mapping.parentField}"`);
        console.log(`    - childField: "${mapping.childField}"`);
        console.log(`    - fieldName: "${fieldName}"`);
        
        if (role === 'child' && fieldName === mapping.parentField) {
          console.log(`    ✅ Found as CHILD mapping`);
          availableMappings.push({
            id: mappingId,
            name: mapping.name,
            description: mapping.description,
            childField: mapping.childField,
            childOptionType: mapping.childOptionType
          });
        } else if (role === 'parent' && fieldName === mapping.childField) {
          console.log(`    ✅ Found as PARENT mapping`);
          availableMappings.push({
            id: mappingId,
            name: mapping.name,
            description: mapping.description,
            parentField: mapping.parentField,
            parentOptionType: mapping.parentOptionType
          });
        } else {
          console.log(`    ❌ No match`);
        }
      }
      
      console.log(`🎯 Found ${availableMappings.length} available mappings for "${fieldName}"`);
      return availableMappings;
    } catch (error) {
      console.error(`Error getting available mappings for field '${fieldName}':`, error);
      return [];
    }
  }



  /**
   * Get available dynamic mappings for a field considering backend connections
   * @param {Object} field - The field to check
   * @param {Array} allFields - All fields in the form
   * @returns {Promise<Array>} Available mappings that work with backend-connected fields
   */
  async getAvailableMappingsForConnectedField(field, allFields) {
    try {
      // Only allow dynamic if field is connected to backend
      if (!field.optionType) {
        console.log(`❌ Field "${field.name}" is not connected to backend options`);
        return [];
      }

      const allMappings = await this.getAllDynamicMappings();
      const availableMappings = [];
      
      console.log(`🔍 Looking for mappings for connected field: "${field.name}"`);
      console.log(`📋 Field option type: "${field.optionType}"`);
      console.log(`📋 All fields:`, allFields.map(f => ({ name: f.name, optionType: f.optionType })));
      
      // Find other fields that are also connected to backend
      const connectedFields = allFields.filter(f => 
        f.name !== field.name && f.optionType && f.optionType !== field.optionType
      );
      
      console.log(`🔗 Connected fields:`, connectedFields.map(f => ({ name: f.name, optionType: f.optionType })));
      
      for (const [mappingId, mapping] of Object.entries(allMappings)) {
        console.log(`  📝 Checking mapping "${mappingId}":`);
        console.log(`    - parentOptionType: "${mapping.parentOptionType}"`);
        console.log(`    - childOptionType: "${mapping.childOptionType}"`);
        console.log(`    - field optionType: "${field.optionType}"`);
        
        // Check if this field can be a child in this mapping (based on option type)
        if (mapping.childOptionType === field.optionType) {
          // Find if there's a connected field that can be the parent
          const parentField = connectedFields.find(f => f.optionType === mapping.parentOptionType);
          
          if (parentField) {
            console.log(`    ✅ Found as CHILD mapping with parent: "${parentField.name}" (${parentField.optionType})`);
            availableMappings.push({
              id: mappingId,
              name: mapping.name,
              description: mapping.description,
              childField: field.name,
              childOptionType: field.optionType,
              parentField: parentField.name,
              parentOptionType: parentField.optionType,
              role: 'child',
              mapping: mapping.mapping // Include the actual mapping data
            });
          }
        }
        
        // Check if this field can be a parent in this mapping (based on option type)
        if (mapping.parentOptionType === field.optionType) {
          // Find if there's a connected field that can be the child
          const childField = connectedFields.find(f => f.optionType === mapping.childOptionType);
          
          if (childField) {
            console.log(`    ✅ Found as PARENT mapping with child: "${childField.name}" (${childField.optionType})`);
            availableMappings.push({
              id: mappingId,
              name: mapping.name,
              description: mapping.description,
              parentField: field.name,
              parentOptionType: field.optionType,
              childField: childField.name,
              childOptionType: childField.optionType,
              role: 'parent',
              mapping: mapping.mapping // Include the actual mapping data
            });
          }
        }
      }
      
      console.log(`🎯 Found ${availableMappings.length} available mappings for connected field "${field.name}"`);
      return availableMappings;
    } catch (error) {
      console.error(`Error getting available mappings for connected field '${field.name}':`, error);
      return [];
    }
  }

  /**
   * Get child options based on parent value and mapping
   * @param {string} mappingId - The mapping ID
   * @param {string} parentValue - The parent field value
   * @returns {Promise<Array>} Child options
   */
  async getChildOptions(mappingId, parentValue) {
    try {
      console.log(`🔍 getChildOptions: mappingId=${mappingId}, parentValue=${parentValue}`);
      
      const mapping = await this.getDynamicMapping(mappingId);
      console.log(`🔍 getChildOptions: mapping=`, mapping);
      
      if (!mapping || !mapping.mapping) {
        console.log(`🔍 getChildOptions: No mapping or mapping data found`);
        return [];
      }
      
      console.log(`🔍 getChildOptions: Available mapping keys:`, Object.keys(mapping.mapping));
      const childOptionValues = mapping.mapping[parentValue] || [];
      console.log(`🔍 getChildOptions: Found ${childOptionValues.length} child options for parentValue="${parentValue}":`, childOptionValues);
      
      // Convert values to option objects
      const options = childOptionValues.map(value => ({
        label: value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value
      }));
      
      console.log(`🔍 getChildOptions: Returning ${options.length} options:`, options);
      return options;
    } catch (error) {
      console.error(`Error getting child options for mapping '${mappingId}':`, error);
      return [];
    }
  }

  /**
   * Add new dynamic mapping
   * @param {string} mappingId - The mapping ID
   * @param {Object} mappingData - The mapping data
   * @returns {Promise<Object>} Result
   */
  async addDynamicMapping(mappingId, mappingData) {
    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'create');
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(mappingData)
      });
      const result = await this.parseResponse(response);
      
      // Clear cache
      this.clearCache();
      
      return result;
    } catch (error) {
      console.error('Error adding dynamic mapping:', error);
      throw error;
    }
  }

  /**
   * Update existing dynamic mapping
   * @param {string} mappingId - The mapping ID
   * @param {Object} mappingData - The updated mapping data
   * @returns {Promise<Object>} Result
   */
  async updateDynamicMapping(mappingId, mappingData) {
    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'update', { id: mappingId });
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(mappingData)
      });
      const result = await this.parseResponse(response);
      
      // Clear cache
      this.clearCache();
      
      return result;
    } catch (error) {
      console.error('Error updating dynamic mapping:', error);
      throw error;
    }
  }

  /**
   * Delete dynamic mapping
   * @param {string} mappingId - The mapping ID to delete
   * @returns {Promise<Object>} Result
   */
  async deleteDynamicMapping(mappingId) {
    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('dynamicMappings', 'delete', { id: mappingId });
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      const result = await this.parseResponse(response);
      
      // Clear cache
      this.clearCache();
      
      return result;
    } catch (error) {
      console.error('Error deleting dynamic mapping:', error);
      throw error;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
const dynamicMappingsService = new DynamicMappingsService();
export default dynamicMappingsService; 
