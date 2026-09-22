const Form = require('../models/Form');
const Submission = require('../models/Submission');
const { buildScopedFormQuery } = require('../utils/workspaceHelper');
const { createFormVersion } = require('../utils/formVersionHelper');
const { logAuditEvent } = require('../utils/auditLogger');
const { parsePagination, buildPaginationMeta } = require('../utils/paginationHelper');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

const getChangedFields = (updates = {}) => (
  Object.keys(updates)
    .filter((key) => key !== 'changeSummary')
    .slice(0, 20)
);

// Get all forms (summary only - no schema for fast loading)
exports.getAllForms = async (req, res) => {
  try {
    const { type, isPublished, isTemplate } = req.query;
    const { page, limit, skip } = parsePagination(req.query);

    const query = buildScopedFormQuery(req, {});
    if (!req.userId) {
      query['status.isPublished'] = true;
    }

    if (type) query.type = type;
    if (isPublished !== undefined) query['status.isPublished'] = isPublished === 'true' || isPublished === true;
    if (isTemplate !== undefined) query['status.isTemplate'] = isTemplate === 'true' || isTemplate === true;

    const [formsWithSchema, total] = await Promise.all([
      Form.find(query)
        .select('id name description type status statistics createdAt updatedAt schema ui_part')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      Form.countDocuments(query)
    ]);

    const forms = formsWithSchema.map((form) => {
      const sections = form.schema?.sections || form.schema || [];
      const sectionsCount = Array.isArray(sections) ? sections.length : 0;
      const fieldsCount = Array.isArray(sections)
        ? sections.reduce((total, section) => total + (section.fields?.length || 0), 0)
        : 0;

      return {
        _id: form._id,
        id: form.id,
        name: form.name,
        description: form.description,
        type: form.type,
        status: form.status,
        statistics: form.statistics,
        ui_part: form.ui_part,
        createdAt: form.createdAt,
        updatedAt: form.updatedAt,
        sectionsCount,
        fieldsCount
      };
    });

    return successResponse(res, {
      forms,
      pagination: buildPaginationMeta({ page, limit, total })
    }, 'Forms retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve forms', 500);
  }
};

// Get form by custom ID (full data for edit/preview)
exports.getFormByCustomId = async (req, res) => {
  try {
    const query = buildScopedFormQuery(req, { id: req.params.id });
    const publicOnly = req.query.publicOnly === 'true';
    if (!req.userId || publicOnly) {
      query['status.isPublished'] = true;
    }
    
    const form = await Form.findOne(query)
      .populate('submissionCount');
    
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }
    
    return successResponse(res, form, 'Form retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve form', 500);
  }
};

// Create new form
exports.createForm = async (req, res) => {
  try {
    const formData = req.body;
    
    // Validate required fields
    if (!formData.name || !formData.schema) {
      return validationError(res, 'Name and schema are required');
    }
    
    // Multi-tenancy: Set user/workspace from authenticated user when present
    if (req.userId) {
      formData.userId = req.userId;
      if (req.user?.workspaceId) {
        formData.workspaceId = req.user.workspaceId;
      }
    }
    
    // Generate custom ID if not provided
    if (!formData.id) {
      formData.id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Set default values with new structure
    const now = new Date();
    formData.createdAt = formData.createdAt || now;
    formData.updatedAt = formData.updatedAt || now;
    
    // Ensure new structure objects exist with defaults
    formData.settings = {
      allowMultipleSubmissions: false,
      requireAuthentication: false,
      redirectUrl: '/thank-you',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Please check your form and try again.',
      ...formData.settings
    };
    
    formData.status = {
      isPublished: false,
      isTemplate: false,
      ...formData.status
    };
    
    formData.metadata = {
      createdBy: 'admin',
      version: '1.0.0',
      lastModifiedBy: 'admin',
      ...formData.metadata
    };
    
    formData.statistics = {
      totalSubmissions: 0,
      totalViews: 0,
      lastSubmissionDate: null,
      ...formData.statistics
    };
    
    const form = new Form(formData);
    await form.save();
    await createFormVersion({
      form,
      user: req.user,
      changeSummary: 'Initial version'
    });

    await logAuditEvent(req, {
      action: 'FORM_CREATED',
      entityType: 'form',
      entityId: form.id,
      metadata: {
        formName: form.name,
        formType: form.type || '',
        isPublished: Boolean(form.status?.isPublished),
        isTemplate: Boolean(form.status?.isTemplate)
      }
    });
    
    return createdResponse(res, form, 'Form created successfully');
  } catch (error) {
    if (error.code === 11000) {
      return conflictResponse(res, 'Form with this ID already exists');
    }
    return errorResponse(res, error.message || 'Failed to create form', 500);
  }
};

// Update form
exports.updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const query = buildScopedFormQuery(req, { id });
    
    // Update the updatedAt field
    updates.updatedAt = new Date();
    
    // Update lastModifiedBy in metadata
    if (updates.metadata) {
      updates.metadata.lastModifiedBy = updates.metadata.lastModifiedBy || (req.user?.name || 'admin');
    } else {
      updates.metadata = { lastModifiedBy: req.user?.name || 'admin' };
    }
    
    const form = await Form.findOneAndUpdate(
      query,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }
    
    await createFormVersion({
      form,
      user: req.user,
      changeSummary: updates.changeSummary || 'Form updated'
    });

    await logAuditEvent(req, {
      action: 'FORM_UPDATED',
      entityType: 'form',
      entityId: form.id,
      metadata: {
        formName: form.name,
        changedFields: getChangedFields(updates)
      }
    });

    return successResponse(res, form, 'Form updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update form', 500);
  }
};

// Delete form
exports.deleteForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = buildScopedFormQuery(req, { id });
    
    const form = await Form.findOneAndDelete(query);
    
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    await logAuditEvent(req, {
      action: 'FORM_DELETED',
      entityType: 'form',
      entityId: form.id,
      metadata: {
        formName: form.name
      }
    });
    
    // Return confirmation message (consistent with frontend)
    return successResponse(res, {
      deletedFormId: form.id,
      deletedFormName: form.name
    }, 'Form deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to delete form', 500);
  }
};

// Duplicate form
exports.duplicateForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = buildScopedFormQuery(req, { id });
    
    const originalForm = await Form.findOne(query);
    
    if (!originalForm) {
      return notFoundResponse(res, 'Form not found');
    }
    
    // Create duplicate with new ID and name
    const duplicateData = originalForm.toObject();
    delete duplicateData._id;
    delete duplicateData.id;
    
    // Set user/workspace for duplicate
    duplicateData.userId = req.userId || originalForm.userId;
    duplicateData.workspaceId = req.user?.workspaceId || originalForm.workspaceId || null;
    
    duplicateData.id = `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    duplicateData.name = `${originalForm.name} (Copy)`;
    duplicateData.createdAt = new Date();
    duplicateData.updatedAt = new Date();
    
    // Reset statistics for duplicate
    duplicateData.statistics = {
      totalSubmissions: 0,
      totalViews: 0,
      lastSubmissionDate: null
    };
    
    // Update metadata
    duplicateData.metadata = {
      ...duplicateData.metadata,
      lastModifiedBy: req.user?.name || 'admin'
    };
    
    const duplicateForm = new Form(duplicateData);
    await duplicateForm.save();
    await createFormVersion({
      form: duplicateForm,
      user: req.user,
      changeSummary: 'Initial version (duplicate)'
    });

    await logAuditEvent(req, {
      action: 'FORM_DUPLICATED',
      entityType: 'form',
      entityId: duplicateForm.id,
      metadata: {
        sourceFormId: originalForm.id,
        sourceFormName: originalForm.name,
        duplicatedFormName: duplicateForm.name
      }
    });
    
    return createdResponse(res, duplicateForm, 'Form duplicated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to duplicate form', 500);
  }
};

// Get form statistics
exports.getFormStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = buildScopedFormQuery(req, { id });
    
    const form = await Form.findOne(query);
    
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }
    
    // Get submission count
    const submissionCount = await Submission.countDocuments({ formId: form.id });
    
    const stats = {
      formId: form.id,
      formName: form.name,
      totalSubmissions: submissionCount,
      totalViews: form.statistics.totalViews || 0,
      lastSubmissionDate: form.statistics.lastSubmissionDate,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      isPublished: form.status.isPublished,
      isTemplate: form.status.isTemplate
    };
    
    return successResponse(res, stats, 'Form statistics retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to get form statistics', 500);
  }
};

// Export form as JSON
exports.exportForm = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = buildScopedFormQuery(req, { id });
    
    const form = await Form.findOne(query);
    
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }
    
    // Convert to plain object and remove MongoDB-specific fields
    const exportData = form.toObject();
    delete exportData.__v;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${form.name}.json"`);
    res.json(exportData);
    return;
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to export form', 500);
  }
};

 
