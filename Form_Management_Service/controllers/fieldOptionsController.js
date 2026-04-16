const FieldOption = require('../models/FieldOption');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

// Get all field option types
exports.getAllFieldOptionTypes = async (req, res) => {
  try {
    const { isActive, category } = req.query;
    
    const query = {};
    
    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) query['metadata.category'] = category;
    
    const optionTypes = await FieldOption.find(query)
      .sort({ optionType: 1 });
    
    // Convert to frontend-compatible structure
    const fieldOptions = {};
    optionTypes.forEach(optionType => {
      fieldOptions[optionType.optionType] = optionType.options || [];
    });
    
    return successResponse(res, {
      fieldOptions: fieldOptions,
      availableTypes: Object.keys(fieldOptions),
      totalTypes: Object.keys(fieldOptions).length
    }, 'Field option types retrieved successfully');
  } catch (error) {
    console.error('Error in getAllFieldOptionTypes:', error);
    return errorResponse(res, error.message || 'Failed to retrieve field option types', 500);
  }
};

// Get options by type
exports.getOptionsByType = async (req, res) => {
  try {
    const { optionType } = req.params;
    const { parentValue } = req.query;
    
    if (!optionType) {
      return validationError(res, 'optionType parameter is required');
    }
    
    const fieldOption = await FieldOption.findOne({ 
      optionType, 
      isActive: true 
    });
    
    if (!fieldOption) {
      return notFoundResponse(res, 'Option type not found');
    }
    
    let options = fieldOption.options || [];
    
    // Filter by parent value if specified
    if (parentValue) {
      options = options.filter(option => option.parentValue === parentValue);
    } else {
      // Return only top-level options (no parent value)
      options = options.filter(option => !option.parentValue);
    }
    
    return successResponse(res, {
      optionType: fieldOption.optionType,
      options: options,
      count: options.length
    }, 'Options retrieved successfully');
  } catch (error) {
    console.error('Error in getOptionsByType:', error);
    return errorResponse(res, error.message || 'Failed to retrieve options', 500);
  }
};

// Get all option types (summary)
exports.getOptionTypes = async (req, res) => {
  try {
    const optionTypes = await FieldOption.find({}, 'optionType metadata.displayName').sort({ optionType: 1 });
    return successResponse(res, {
      optionTypes: optionTypes,
      total: optionTypes.length
    }, 'Option types retrieved successfully');
  } catch (error) {
    console.error('Error in getOptionTypes:', error);
    return errorResponse(res, error.message || 'Failed to retrieve option types', 500);
  }
};

// Create new field option type
exports.createFieldOptionType = async (req, res) => {
  try {
    const { optionType, options, metadata } = req.body;
    
    if (!optionType) {
      return validationError(res, 'optionType is required');
    }
    
    if (!options || !Array.isArray(options)) {
      return validationError(res, 'options array is required');
    }
    
    // Validate each option
    for (const option of options) {
      if (!option.label || !option.value) {
        return validationError(res, 'Each option must have label and value');
      }
    }
    
    // Check if option type already exists
    const existingOption = await FieldOption.findOne({ optionType });
    if (existingOption) {
      return conflictResponse(res, 'Option type already exists');
    }
    
    const fieldOption = new FieldOption({
      optionType,
      options: options,
      isActive: true,
      metadata: {
        description: metadata?.description || `Options for ${optionType}`,
        category: metadata?.category || 'custom',
        displayName: metadata?.displayName || optionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        ...metadata
      }
    });
    
    await fieldOption.save();
    await logAuditEvent(req, {
      action: 'FIELD_OPTION_TYPE_CREATED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType,
        optionsCount: fieldOption.options?.length || 0
      }
    });
    return createdResponse(res, fieldOption, 'Field option type created successfully');
  } catch (error) {
    console.error('Error creating field option type:', error);
    if (error.code === 11000) {
      return conflictResponse(res, 'Option type already exists');
    }
    return errorResponse(res, error.message || 'Failed to create field option type', 500);
  }
};

// Update field option type
exports.updateFieldOptionType = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const fieldOption = await FieldOption.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_TYPE_UPDATED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType
      }
    });
    
    return successResponse(res, fieldOption, 'Field option type updated successfully');
  } catch (error) {
    if (error.code === 11000) {
      return conflictResponse(res, 'Option type already exists');
    }
    return errorResponse(res, error.message || 'Failed to update field option type', 500);
  }
};

// Delete field option type
exports.deleteFieldOptionType = async (req, res) => {
  try {
    const { id } = req.params;
    
    const fieldOption = await FieldOption.findByIdAndDelete(id);
    
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_TYPE_DELETED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType
      }
    });
    
    return successResponse(res, null, 'Field option type deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to delete field option type', 500);
  }
};

// Add option to existing type
exports.addOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, value, parentValue, sortOrder, metadata } = req.body;
    
    if (!label || !value) {
      return validationError(res, 'label and value are required');
    }
    
    const fieldOption = await FieldOption.findById(id);
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }
    
    // Check if option already exists
    const existingOption = fieldOption.options.find(opt => opt.value === value);
    if (existingOption) {
      return conflictResponse(res, 'Option with this value already exists');
    }
    
    const newOption = {
      label,
      value,
      parentValue,
      sortOrder: sortOrder || fieldOption.options.length,
      metadata: metadata || {}
    };
    
    fieldOption.options.push(newOption);
    await fieldOption.save();

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_ADDED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType,
        optionValue: value
      }
    });
    
    return successResponse(res, fieldOption, 'Option added successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to add option', 500);
  }
};

// Update specific option
exports.updateOption = async (req, res) => {
  try {
    const { id, optionValue } = req.params;
    const updateData = req.body;
    
    const fieldOption = await FieldOption.findById(id);
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }
    
    const optionIndex = fieldOption.options.findIndex(opt => opt.value === optionValue);
    if (optionIndex === -1) {
      return notFoundResponse(res, 'Option not found');
    }
    
    // Update the option
    fieldOption.options[optionIndex] = {
      ...fieldOption.options[optionIndex],
      ...updateData
    };
    
    await fieldOption.save();

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_UPDATED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType,
        optionValue
      }
    });
    return successResponse(res, fieldOption, 'Option updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update option', 500);
  }
};

// Remove option from type
exports.removeOption = async (req, res) => {
  try {
    const { id, optionValue } = req.params;
    
    const fieldOption = await FieldOption.findById(id);
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }
    
    const optionIndex = fieldOption.options.findIndex(opt => opt.value === optionValue);
    if (optionIndex === -1) {
      return notFoundResponse(res, 'Option not found');
    }
    
    fieldOption.options.splice(optionIndex, 1);
    await fieldOption.save();

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_REMOVED',
      entityType: 'field_option',
      entityId: fieldOption._id.toString(),
      metadata: {
        optionType: fieldOption.optionType,
        optionValue
      }
    });
    
    return successResponse(res, fieldOption, 'Option removed successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to remove option', 500);
  }
};

// Bulk create field option types
exports.bulkCreateFieldOptionTypes = async (req, res) => {
  try {
    const { optionTypes } = req.body;
    
    if (!Array.isArray(optionTypes) || optionTypes.length === 0) {
      return validationError(res, 'optionTypes array is required and must not be empty');
    }
    
    const createdTypes = [];
    const errors = [];
    
    for (const optionTypeData of optionTypes) {
      try {
        if (!optionTypeData.optionType || !optionTypeData.options) {
          errors.push(`Invalid option type data: ${JSON.stringify(optionTypeData)}`);
          continue;
        }
        
        const fieldOption = new FieldOption({
          optionType: optionTypeData.optionType,
          options: optionTypeData.options,
          isActive: optionTypeData.isActive !== false,
          metadata: optionTypeData.metadata || {}
        });
        
        await fieldOption.save();
        createdTypes.push(fieldOption);
      } catch (error) {
        if (error.code === 11000) {
          errors.push(`Option type ${optionTypeData.optionType} already exists`);
        } else {
          errors.push(`Error creating option type ${optionTypeData.optionType}: ${error.message}`);
        }
      }
    }

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_BULK_CREATED',
      entityType: 'field_option',
      entityId: '',
      metadata: {
        createdCount: createdTypes.length,
        errorCount: errors.length
      }
    });
    
    return createdResponse(res, {
      created: createdTypes.length,
      createdTypes: createdTypes,
      errors: errors.length > 0 ? errors : undefined
    }, `${createdTypes.length} option types created successfully`);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to bulk create field option types', 500);
  }
};

// Get options for form schema
exports.getOptionsForSchema = async (req, res) => {
  try {
    const { schema } = req.body;
    
    if (!schema || !schema.sections) {
      return validationError(res, 'Schema with sections is required');
    }
    
    const optionTypes = new Set();
    
    // Extract option types from form schema
    schema.sections.forEach(section => {
      if (section.fields) {
        section.fields.forEach(field => {
          if (field.options && Array.isArray(field.options)) {
            // This is a select field with predefined options
            optionTypes.add(`form_${field.name}_options`);
          }
        });
      }
    });
    
    const options = {};
    for (const optionType of optionTypes) {
      const fieldOption = await FieldOption.findOne({ optionType, isActive: true });
      if (fieldOption) {
        options[optionType] = fieldOption.options;
      }
    }
    
    return successResponse(res, options, 'Options for schema retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to get options for schema', 500);
  }
};

// Import options from JSON
exports.importOptions = async (req, res) => {
  try {
    const { options } = req.body;
    
    if (!options || typeof options !== 'object') {
      return validationError(res, 'Options object is required');
    }
    
    const createdTypes = [];
    const errors = [];
    
    for (const [optionType, optionList] of Object.entries(options)) {
      if (Array.isArray(optionList)) {
        try {
          const fieldOption = new FieldOption({
            optionType,
            options: optionList,
            isActive: true,
            metadata: {
              description: `Imported options for ${optionType}`,
              category: 'imported',
              displayName: optionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }
          });
          
          await fieldOption.save();
          createdTypes.push(fieldOption);
        } catch (error) {
          if (error.code === 11000) {
            errors.push(`Option type ${optionType} already exists`);
          } else {
            errors.push(`Error creating option type ${optionType}: ${error.message}`);
          }
        }
      }
    }

    await logAuditEvent(req, {
      action: 'FIELD_OPTION_IMPORTED',
      entityType: 'field_option',
      entityId: '',
      metadata: {
        createdCount: createdTypes.length,
        errorCount: errors.length
      }
    });
    
    return successResponse(res, {
      created: createdTypes.length,
      createdTypes: createdTypes,
      errors: errors.length > 0 ? errors : undefined
    }, `${createdTypes.length} option types imported successfully`);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to import options', 500);
  }
}; 
