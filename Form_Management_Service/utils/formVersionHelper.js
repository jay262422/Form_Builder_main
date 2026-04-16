const FormVersion = require('../models/FormVersion');

const buildFormSnapshot = (formDoc) => {
  const source = typeof formDoc.toObject === 'function' ? formDoc.toObject() : formDoc;

  return {
    id: source.id,
    name: source.name,
    description: source.description,
    type: source.type,
    schema: source.schema,
    settings: source.settings,
    status: source.status,
    metadata: source.metadata,
    statistics: source.statistics,
    ui_part: source.ui_part
  };
};

const getNextVersionNumber = async (formId) => {
  const latest = await FormVersion.findOne({ formId }).sort({ versionNumber: -1 }).lean();
  return latest ? latest.versionNumber + 1 : 1;
};

const createFormVersion = async ({ form, user, changeSummary = 'Form update' }) => {
  const versionNumber = await getNextVersionNumber(form.id);
  const snapshot = buildFormSnapshot(form);

  const version = new FormVersion({
    formId: form.id,
    workspaceId: form.workspaceId || null,
    versionNumber,
    changeSummary,
    snapshot,
    createdBy: {
      userId: user?._id || null,
      name: user?.name || 'system',
      email: user?.email || ''
    }
  });

  await version.save();
  return version;
};

module.exports = {
  buildFormSnapshot,
  createFormVersion
};
