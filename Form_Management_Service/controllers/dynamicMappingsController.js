const DynamicMapping = require('../models/DynamicMapping');
const FieldOption = require('../models/FieldOption');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

// Get all dynamic mappings
exports.getAllMappings = async (req, res) => {
  try {
    const { parentField, childField, parentOptionType, childOptionType, isActive } = req.query;
    
    const query = {};
    
    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (parentField) query.parentField = parentField;
    if (childField) query.childField = childField;
    if (parentOptionType) query.parentOptionType = parentOptionType;
    if (childOptionType) query.childOptionType = childOptionType;
    
    const mappings = await DynamicMapping.find(query)
      .sort({ name: 1 });
    
    return successResponse(res, {
      mappings: mappings,
      total: mappings.length,
      query: query
    }, 'Dynamic mappings retrieved successfully');
  } catch (error) {
    console.error('Error in getAllMappings:', error);
    return errorResponse(res, error.message || 'Failed to retrieve dynamic mappings', 500);
  }
};

// Get mapping by ID
exports.getMappingById = async (req, res) => {
  try {
    const mapping = await DynamicMapping.findById(req.params.id);
    
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    return successResponse(res, mapping, 'Mapping retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mapping', 500);
  }
};

// Get mapping by custom ID
exports.getMappingByCustomId = async (req, res) => {
  try {
    const mapping = await DynamicMapping.findOne({ id: req.params.id });
    
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    return successResponse(res, mapping, 'Mapping retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mapping', 500);
  }
};

// Create new mapping
exports.createMapping = async (req, res) => {
  try {
    const { 
      id, 
      name, 
      description, 
      parentField, 
      childField, 
      parentOptionType, 
      childOptionType, 
      mapping, 
      metadata 
    } = req.body;
    
    if (!name || !parentField || !childField || !mapping) {
      return validationError(res, 'name, parentField, childField, and mapping are required');
    }
    
    // Validate mapping object
    if (typeof mapping !== 'object' || mapping === null) {
      return validationError(res, 'mapping must be a valid object');
    }
    
    // Generate custom ID if not provided
    const customId = id || `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const dynamicMapping = new DynamicMapping({
      id: customId,
      name,
      description,
      parentField,
      childField,
      parentOptionType,
      childOptionType,
      mapping,
      isActive: true,
      metadata: {
        createdBy: metadata?.createdBy || 'api',
        version: metadata?.version || '1.0.0',
        category: metadata?.category || 'custom',
        ...metadata
      }
    });
    
    await dynamicMapping.save();
    
    return createdResponse(res, dynamicMapping, 'Dynamic mapping created successfully');
  } catch (error) {
    console.error('Error creating mapping:', error);
    if (error.code === 11000) {
      return conflictResponse(res, 'Mapping with this ID already exists');
    }
    return errorResponse(res, error.message || 'Failed to create dynamic mapping', 500);
  }
};

// Update mapping
exports.updateMapping = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const mapping = await DynamicMapping.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    return successResponse(res, mapping, 'Dynamic mapping updated successfully');
  } catch (error) {
    if (error.code === 11000) {
      return conflictResponse(res, 'Mapping with this ID already exists');
    }
    return errorResponse(res, error.message || 'Failed to update dynamic mapping', 500);
  }
};

// Delete mapping
exports.deleteMapping = async (req, res) => {
  try {
    const { id } = req.params;
    
    const mapping = await DynamicMapping.findByIdAndDelete(id);
    
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    return successResponse(res, null, 'Mapping deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to delete mapping', 500);
  }
};

// Get mappings by parent-child relationship
exports.getMappingsByParentChild = async (req, res) => {
  try {
    const { parentField, childField } = req.params;
    
    const mappings = await DynamicMapping.find({ 
      parentField, 
      childField, 
      isActive: true 
    }).sort({ name: 1 });
    
    return successResponse(res, mappings, 'Mappings retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mappings', 500);
  }
};

// Get mappings by option types
exports.getMappingsByOptionTypes = async (req, res) => {
  try {
    const { parentOptionType, childOptionType } = req.params;
    
    const mappings = await DynamicMapping.find({ 
      parentOptionType, 
      childOptionType, 
      isActive: true 
    }).sort({ name: 1 });
    
    return successResponse(res, mappings, 'Mappings retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mappings', 500);
  }
};

// Get mapped options for a parent value
exports.getMappedOptions = async (req, res) => {
  try {
    const { mappingId, parentValue } = req.params;
    
    const mapping = await DynamicMapping.findById(mappingId);
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    // Direct access to mapping object instead of using method
    const mappedOptions = mapping.mapping && mapping.mapping[parentValue] ? mapping.mapping[parentValue] : [];
    
    return successResponse(res, {
      mapping: {
        id: mapping.id,
        name: mapping.name,
        parentField: mapping.parentField,
        childField: mapping.childField
      },
      parentValue,
      mappedOptions
    }, 'Mapped options retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mapped options', 500);
  }
};

// Get mapped options by mapping ID and parent value
exports.getMappedOptionsByMappingId = async (req, res) => {
  try {
    const { mappingId, parentValue } = req.params;
    
    const mapping = await DynamicMapping.findOne({ id: mappingId });
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    // Direct access to mapping object instead of using method
    const mappedOptions = mapping.mapping && mapping.mapping[parentValue] ? mapping.mapping[parentValue] : [];
    
    return successResponse(res, {
      mapping: {
        id: mapping.id,
        name: mapping.name,
        parentField: mapping.parentField,
        childField: mapping.childField
      },
      parentValue,
      mappedOptions
    }, 'Mapped options retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve mapped options', 500);
  }
};

// Apply mapping to data
exports.applyMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const { parentValue } = req.body;
    
    const mapping = await DynamicMapping.findById(mappingId);
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    if (!parentValue) {
      return validationError(res, 'parentValue is required');
    }
    
    // Direct access to mapping object instead of using method
    const mappedOptions = mapping.mapping && mapping.mapping[parentValue] ? mapping.mapping[parentValue] : [];
    
    return successResponse(res, {
      mapping: {
        id: mapping.id,
        name: mapping.name,
        parentField: mapping.parentField,
        childField: mapping.childField
      },
      parentValue,
      mappedOptions,
      totalMappedOptions: mappedOptions.length
    }, 'Mapping applied successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to apply mapping', 500);
  }
};

// Bulk create mappings
exports.bulkCreateMappings = async (req, res) => {
  try {
    const { mappings } = req.body;
    
    if (!Array.isArray(mappings) || mappings.length === 0) {
      return validationError(res, 'mappings array is required and must not be empty');
    }
    
    const createdMappings = [];
    const errors = [];
    
    for (const mappingData of mappings) {
      try {
        if (!mappingData.name || !mappingData.parentField || !mappingData.childField || !mappingData.mapping) {
          errors.push(`Invalid mapping data: ${JSON.stringify(mappingData)}`);
          continue;
        }
        
        const dynamicMapping = new DynamicMapping({
          id: mappingData.id || `mapping_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: mappingData.name,
          description: mappingData.description,
          parentField: mappingData.parentField,
          childField: mappingData.childField,
          parentOptionType: mappingData.parentOptionType,
          childOptionType: mappingData.childOptionType,
          mapping: mappingData.mapping,
          isActive: mappingData.isActive !== false,
          metadata: {
            createdBy: mappingData.metadata?.createdBy || 'api',
            version: mappingData.metadata?.version || '1.0.0',
            category: mappingData.metadata?.category || 'bulk_import',
            ...mappingData.metadata
          }
        });
        
        await dynamicMapping.save();
        createdMappings.push(dynamicMapping);
      } catch (error) {
        if (error.code === 11000) {
          errors.push(`Mapping ${mappingData.name} already exists`);
        } else {
          errors.push(`Error creating mapping ${mappingData.name}: ${error.message}`);
        }
      }
    }
    
    return createdResponse(res, {
      created: createdMappings.length,
      createdMappings: createdMappings,
      errors: errors.length > 0 ? errors : undefined
    }, `${createdMappings.length} mappings created successfully`);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to bulk create mappings', 500);
  }
};

// Get all mappings (summary)
exports.getAllMappingsSummary = async (req, res) => {
  try {
    const mappings = await DynamicMapping.find({}).sort({ name: 1 });
    return successResponse(res, {
      mappings: mappings,
      total: mappings.length,
      active: mappings.filter(m => m.isActive).length,
      inactive: mappings.filter(m => !m.isActive).length
    }, 'Mappings summary retrieved successfully');
  } catch (error) {
    console.error('Error in getAllMappingsSummary:', error);
    return errorResponse(res, error.message || 'Failed to retrieve mappings summary', 500);
  }
};

// Test mapping with sample data
exports.testMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const { testValues } = req.body;
    
    const mapping = await DynamicMapping.findById(mappingId);
    if (!mapping) {
      return notFoundResponse(res, 'Mapping not found');
    }
    
    if (!testValues || !Array.isArray(testValues)) {
      return validationError(res, 'testValues array is required');
    }
    
    const testResults = [];
    
    for (const parentValue of testValues) {
      // Direct access to mapping object instead of using method
      const mappedOptions = mapping.mapping && mapping.mapping[parentValue] ? mapping.mapping[parentValue] : [];
      testResults.push({
        parentValue,
        mappedOptions,
        mappedCount: mappedOptions.length
      });
    }
    
    return successResponse(res, {
      mapping: {
        id: mapping.id,
        name: mapping.name,
        parentField: mapping.parentField,
        childField: mapping.childField
      },
      testResults,
      totalTests: testResults.length
    }, 'Mapping test completed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to test mapping', 500);
  }
}; 