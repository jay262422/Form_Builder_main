const FieldOption = require('../models/FieldOption');
const {
  canShareTemplates,
  canEditSet,
  visibleSetsQuery,
  findReadableSet,
  stampOwner
} = require('../utils/fieldOptionAccess');
const { logAuditEvent } = require('../utils/auditLogger');
const {
  successResponse,
  errorResponse,
  validationError,
  notFoundResponse,
  forbiddenResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

// Get all field option types
exports.getAllFieldOptionTypes = async (req, res) => {
  try {
    const { isActive, category } = req.query;
    
    const query = visibleSetsQuery(req.user);
    
    // Only filter by isActive if explicitly provided
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (category) query['metadata.category'] = category;
    
    const optionTypes = await FieldOption.find(query)
      .sort({ isTemplate: -1, optionType: 1 });
    
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
    
    const fieldOption = await findReadableSet(optionType, req.user);
    
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
    const optionTypes = await FieldOption.find(visibleSetsQuery(req.user), 'optionType metadata isTemplate ownerId')
      .sort({ isTemplate: 1, optionType: 1 });
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
    const { optionType, options, metadata, isTemplate } = req.body;
    
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
    
    const asTemplate = isTemplate === true;
    if (asTemplate && !canShareTemplates(req.user)) {
      return forbiddenResponse(res, 'Only an admin can publish an example list');
    }

    const existingOption = await FieldOption.findOne(asTemplate
      ? { optionType, isTemplate: true }
      : { optionType, ownerId: req.userId, isTemplate: { $ne: true } });
    if (existingOption) {
      return conflictResponse(res, 'You already have an option set with this name');
    }
    
    const fieldOption = new FieldOption({
      optionType,
      options: options,
      isActive: true,
      ...stampOwner(req.user, asTemplate),
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
    const updateData = { ...req.body };
    delete updateData.ownerId;
    delete updateData.workspaceId;
    delete updateData.isTemplate;
    
    const existing = await FieldOption.findById(id);
    if (!existing) {
      return notFoundResponse(res, 'Field option type not found');
    }
    if (!canEditSet(existing, req.user)) {
      return forbiddenResponse(res, 'You can only edit your own option sets');
    }

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
    
    const fieldOption = await FieldOption.findById(id);
    
    if (!fieldOption) {
      return notFoundResponse(res, 'Field option type not found');
    }
    if (!canEditSet(fieldOption, req.user)) {
      return forbiddenResponse(res, 'You can only delete your own option sets');
    }
    await fieldOption.deleteOne();

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
    if (!canEditSet(fieldOption, req.user)) {
      return forbiddenResponse(res, 'You can only edit your own option sets');
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
    if (!canEditSet(fieldOption, req.user)) {
      return forbiddenResponse(res, 'You can only edit your own option sets');
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
    if (!canEditSet(fieldOption, req.user)) {
      return forbiddenResponse(res, 'You can only edit your own option sets');
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
          ...stampOwner(req.user, false),
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
      const fieldOption = await findReadableSet(optionType, req.user);
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
            ...stampOwner(req.user, false),
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

exports.getFieldOptionById = async (req, res) => {
  try {
    const fieldOption = await FieldOption.findById(req.params.id);
    if (!fieldOption || fieldOption.isActive === false) {
      return notFoundResponse(res, 'Option set not found');
    }
    const isOwner = fieldOption.ownerId && req.user?._id && String(fieldOption.ownerId) === String(req.user._id);
    if (!fieldOption.isTemplate && !isOwner) {
      return notFoundResponse(res, 'Option set not found');
    }
    return successResponse(res, {
      optionType: fieldOption.optionType,
      isTemplate: fieldOption.isTemplate,
      options: fieldOption.options || [],
      count: fieldOption.options?.length || 0
    }, 'Options retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve options', 500);
  }
};

exports.copyFieldOption = async (req, res) => {
  try {
    const source = await FieldOption.findById(req.params.id);
    if (!source) {
      return notFoundResponse(res, 'Option set not found');
    }
    if (!source.isTemplate && !canEditSet(source, req.user)) {
      return forbiddenResponse(res, 'You can only copy your own sets or a shared example');
    }

    const existing = await FieldOption.findOne({
      optionType: source.optionType,
      ownerId: req.userId,
      isTemplate: { $ne: true }
    });
    if (existing) {
      return conflictResponse(res, 'You already have an option set with this name');
    }

    const copy = new FieldOption({
      optionType: source.optionType,
      options: source.options,
      isActive: true,
      ...stampOwner(req.user, false),
      metadata: source.metadata
    });
    await copy.save();
    return createdResponse(res, copy, 'Option set copied to your lists');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to copy option set', 500);
  }
};

exports.publishTemplate = async (req, res) => {
  try {
    if (!canShareTemplates(req.user)) {
      return forbiddenResponse(res, 'Only an admin can publish an example list');
    }

    const source = await FieldOption.findById(req.params.id);
    if (!source) {
      return notFoundResponse(res, 'Option set not found');
    }
    if (source.isTemplate) {
      return successResponse(res, source, 'This list is already an example');
    }
    if (!canEditSet(source, req.user)) {
      return forbiddenResponse(res, 'You can only publish your own option sets');
    }

    const existing = await FieldOption.findOne({ optionType: source.optionType, isTemplate: true });
    if (existing) {
      return conflictResponse(res, 'An example with this name already exists');
    }

    const template = new FieldOption({
      optionType: source.optionType,
      options: source.options,
      isActive: true,
      ...stampOwner(req.user, true),
      metadata: source.metadata
    });
    await template.save();
    return createdResponse(res, template, 'Example published');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to publish example', 500);
  }
}; 
