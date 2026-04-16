const Form = require('../models/Form');
const FormVersion = require('../models/FormVersion');
const {
  successResponse,
  errorResponse,
  notFoundResponse
} = require('../utils/responseHelper');
const { buildScopedFormQuery } = require('../utils/workspaceHelper');
const { createFormVersion } = require('../utils/formVersionHelper');

const getScopedForm = async (req, formId) => {
  const query = buildScopedFormQuery(req, { id: formId });
  return Form.findOne(query);
};

exports.getFormVersions = async (req, res) => {
  try {
    const form = await getScopedForm(req, req.params.id);
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    const versions = await FormVersion.find({ formId: form.id })
      .select('formId versionNumber changeSummary createdAt createdBy')
      .sort({ versionNumber: -1 })
      .lean();

    return successResponse(res, { versions }, 'Form versions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve form versions', 500);
  }
};

exports.getFormVersionByNumber = async (req, res) => {
  try {
    const form = await getScopedForm(req, req.params.id);
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    const versionNumber = parseInt(req.params.versionNumber, 10);
    const version = await FormVersion.findOne({ formId: form.id, versionNumber }).lean();

    if (!version) {
      return notFoundResponse(res, 'Form version not found');
    }

    return successResponse(res, { version }, 'Form version retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve form version', 500);
  }
};

exports.restoreFormVersion = async (req, res) => {
  try {
    const form = await getScopedForm(req, req.params.id);
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    const versionNumber = parseInt(req.params.versionNumber, 10);
    const version = await FormVersion.findOne({ formId: form.id, versionNumber }).lean();

    if (!version) {
      return notFoundResponse(res, 'Form version not found');
    }

    const snapshot = version.snapshot || {};
    form.name = snapshot.name || form.name;
    form.description = snapshot.description || form.description;
    form.type = snapshot.type || form.type;
    form.schema = snapshot.schema || form.schema;
    form.settings = snapshot.settings || form.settings;
    form.status = snapshot.status || form.status;
    form.statistics = snapshot.statistics || form.statistics;
    form.ui_part = snapshot.ui_part || form.ui_part;
    form.metadata = {
      ...(snapshot.metadata || form.metadata || {}),
      lastModifiedBy: req.user?.name || 'system'
    };
    form.updatedAt = new Date();

    await form.save();

    await createFormVersion({
      form,
      user: req.user,
      changeSummary: `Restored from v${versionNumber}`
    });

    return successResponse(res, { form }, `Form restored from version ${versionNumber}`);
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to restore form version', 500);
  }
};
