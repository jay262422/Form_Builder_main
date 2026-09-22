/**
 * Field Options Service
 * Handles loading and managing field options from the API
 */

import SIMPLE_API_CONFIG from './simpleApiConfig';
import { authenticatedFetch } from './apiClient';

class FieldOptionsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get the current base URL for this service
   */
  get baseUrl() {
    return SIMPLE_API_CONFIG.getBaseURL('fieldOptions');
  }

  async parseResponse(response) {
    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.message || payload?.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(message);
    }
    return payload?.data !== undefined ? payload.data : payload;
  }

  async findOptionTypeRecord(optionType) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'getTypes');
    const response = await authenticatedFetch(url);
    const data = await this.parseResponse(response);
    return (data.optionTypes || []).find(item => item.optionType === optionType);
  }

  /**
   * Get all field options
   * @returns {Promise<Object>} All field options
   */
  async getAllFieldOptions() {
    const cacheKey = 'all';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await authenticatedFetch(this.baseUrl);
      const data = await this.parseResponse(response);
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data.fieldOptions || {},
        timestamp: Date.now()
      });
      
      return data.fieldOptions || {};
    } catch (error) {
      console.error('Error loading all field options:', error);
      // Return empty object instead of throwing to prevent crashes
      return {};
    }
  }

  /**
   * Get specific option type
   * @param {string} optionType - The option type to get
   * @returns {Promise<Array>} Options for the specified type
   */
  async getOptionType(optionType) {
    const cacheKey = `type_${optionType}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'getByType', { optionType });
      const response = await authenticatedFetch(url);
      const data = await this.parseResponse(response);
      const options = data.options || [];
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: options,
        timestamp: Date.now()
      });
      
      return options;
    } catch (error) {
      console.error(`Error loading option type '${optionType}':`, error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  /**
   * Get dependent options (like service categories based on industry)
   * @param {string} optionType - The option type
   * @param {string} parentValue - The parent value to filter by
   * @returns {Promise<Array>} Filtered options
   */
  async getDependentOptions(optionType, parentValue) {
    try {
      const allOptions = await this.getAllFieldOptions();
      const options = allOptions[optionType];
      
      if (!options) {
        return [];
      }
      
      // For nested objects like service_categories
      if (typeof options === 'object' && !Array.isArray(options)) {
        return options[parentValue] || [];
      }
      
      // For regular arrays, return as is
      return options;
    } catch (error) {
      console.error(`Error loading dependent options for '${optionType}':`, error);
      return [];
    }
  }

  /**
   * Get available option types
   * @returns {Promise<Array>} List of available option types
   */
  async listOptionSets() {
    const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'getTypes');
    const response = await authenticatedFetch(url);
    const data = await this.parseResponse(response);
    return (data.optionTypes || []).map((item) => ({
      id: item._id,
      optionType: item.optionType,
      isTemplate: Boolean(item.isTemplate),
      displayName: item.metadata?.displayName || item.optionType,
      description: item.metadata?.description || ''
    }));
  }

  async saveOptionSet(optionSet) {
    const body = {
      optionType: optionSet.optionType,
      options: optionSet.options,
      isTemplate: Boolean(optionSet.isTemplate),
      metadata: {
        displayName: optionSet.displayName,
        description: optionSet.description || '',
        category: optionSet.isTemplate ? 'example' : 'custom'
      }
    };
    const url = optionSet.id
      ? SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'update', { id: optionSet.id })
      : SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'create');
    const response = await authenticatedFetch(url, {
      method: optionSet.id ? 'PUT' : 'POST',
      body: JSON.stringify(body)
    });
    const result = await this.parseResponse(response);
    this.clearCache();
    return result;
  }

  async getAvailableOptionTypes() {
    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'getTypes');
      const response = await authenticatedFetch(url);
      const data = await this.parseResponse(response);
      return data.optionTypes?.map(opt => opt.optionType) || [];
    } catch (error) {
      console.error('Error loading available option types:', error);
      return [];
    }
  }

  /**
   * Add new option to existing type or create new type
   * @param {string} optionType - The option type
   * @param {Object} newOption - The new option to add
   * @param {boolean} createNewType - Whether to create a new option type
   * @returns {Promise<Object>} Result of the operation
   */
  async addOption(optionType, newOption, createNewType = false) {
    try {
      let response;

      if (createNewType) {
        const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'create');
        response = await authenticatedFetch(url, {
          method: 'POST',
          body: JSON.stringify({
            optionType,
            options: [newOption]
          })
        });
      } else {
        const optionTypeRecord = await this.findOptionTypeRecord(optionType);
        if (!optionTypeRecord?._id) {
          throw new Error(`Option type '${optionType}' not found`);
        }

        const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'addOption', {
          id: optionTypeRecord._id
        });
        response = await authenticatedFetch(url, {
          method: 'POST',
          body: JSON.stringify(newOption)
        });
      }

      const result = await this.parseResponse(response);
      
      // Clear cache for this option type
      this.cache.delete(`type_${optionType}`);
      this.cache.delete('all');
      
      return result;
    } catch (error) {
      console.error(`Error adding option to '${optionType}':`, error);
      throw error;
    }
  }

  /**
   * Update existing option
   * @param {string} optionType - The option type
   * @param {string} optionValue - The current option value
   * @param {Object} updatedOption - The updated option
   * @returns {Promise<Object>} Result of the operation
   */
  async updateOption(optionType, optionValue, updatedOption) {
    try {
      const optionTypeRecord = await this.findOptionTypeRecord(optionType);
      if (!optionTypeRecord?._id) {
        throw new Error(`Option type '${optionType}' not found`);
      }

      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'updateOption', {
        id: optionTypeRecord._id,
        optionValue
      });

      const response = await authenticatedFetch(url, {
        method: 'PUT',
        body: JSON.stringify(updatedOption)
      });
      
      const result = await this.parseResponse(response);
      
      // Clear cache for this option type
      this.cache.delete(`type_${optionType}`);
      this.cache.delete('all');
      
      return result;
    } catch (error) {
      console.error(`Error updating option in '${optionType}':`, error);
      throw error;
    }
  }

  /**
   * Delete option
   * @param {string} optionType - The option type
   * @param {string} optionValue - The option value to delete
   * @returns {Promise<Object>} Result of the operation
   */
  async deleteOption(optionType, optionValue) {
    try {
      const optionTypeRecord = await this.findOptionTypeRecord(optionType);
      if (!optionTypeRecord?._id) {
        throw new Error(`Option type '${optionType}' not found`);
      }

      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'removeOption', {
        id: optionTypeRecord._id,
        optionValue
      });

      const response = await authenticatedFetch(url, {
        method: 'DELETE',
      });
      
      const result = await this.parseResponse(response);
      
      // Clear cache for this option type
      this.cache.delete(`type_${optionType}`);
      this.cache.delete('all');
      
      return result;
    } catch (error) {
      console.error(`Error deleting option from '${optionType}':`, error);
      throw error;
    }
  }

  /**
   * Delete option type
   */
  async getOptionSetById(id) {
    try {
      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'getById', { id });
      const response = await authenticatedFetch(url);
      const data = await this.parseResponse(response);
      return data.options || [];
    } catch (error) {
      return [];
    }
  }

  async copyOptionSet(id) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'copy', { id });
    const response = await authenticatedFetch(url, { method: 'POST' });
    const result = await this.parseResponse(response);
    this.clearCache();
    return result;
  }

  async publishOptionSet(id) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'publish', { id });
    const response = await authenticatedFetch(url, { method: 'POST' });
    const result = await this.parseResponse(response);
    this.clearCache();
    return result;
  }

  async deleteOptionSet(id) {
    const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'delete', { id });
    const response = await authenticatedFetch(url, { method: 'DELETE' });
    const result = await this.parseResponse(response);
    this.clearCache();
    return result;
  }

  async deleteOptionType(optionType) {
    try {
      const optionTypeRecord = await this.findOptionTypeRecord(optionType);
      if (!optionTypeRecord?._id) {
        throw new Error(`Option type '${optionType}' not found`);
      }

      const url = SIMPLE_API_CONFIG.getEndpointURL('fieldOptions', 'delete', {
        id: optionTypeRecord._id
      });
      const response = await authenticatedFetch(url, {
        method: 'DELETE',
      });
      
      const result = await this.parseResponse(response);
      
      this.cache.delete(`type_${optionType}`);
      this.cache.delete('all');
      
      return result;
    } catch (error) {
      console.error(`Error deleting option type '${optionType}':`, error);
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
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }

  /**
   * Load options for a form schema
   * @param {Array} schema - Form schema
   * @returns {Promise<Object>} Options mapped by field name
   */
  async loadOptionsForSchema(schema) {
    const options = {};
    
    try {
      for (const section of schema) {
        if (section.fields) {
          for (const field of section.fields) {
            if (field.optionType) {
              options[field.name] = await this.getOptionType(field.optionType);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading options for schema:', error);
    }
    
    return options;
  }

  /**
   * Get option label by value
   * @param {string} optionType - The option type
   * @param {string} value - The option value
   * @returns {Promise<string>} The option label
   */
  async getOptionLabel(optionType, value) {
    try {
      const options = await this.getOptionType(optionType);
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    } catch (error) {
      console.error(`Error getting label for '${optionType}' value '${value}':`, error);
      return value;
    }
  }

  /**
   * Get option value by label
   * @param {string} optionType - The option type
   * @param {string} label - The option label
   * @returns {Promise<string>} The option value
   */
  async getOptionValue(optionType, label) {
    try {
      const options = await this.getOptionType(optionType);
      const option = options.find(opt => opt.label === label);
      return option ? option.value : label;
    } catch (error) {
      console.error(`Error getting value for '${optionType}' label '${label}':`, error);
      return label;
    }
  }
}

// Create singleton instance
const fieldOptionsService = new FieldOptionsService();

export default fieldOptionsService; 
