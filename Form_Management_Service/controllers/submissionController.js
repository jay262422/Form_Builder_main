const Submission = require('../models/Submission');
const Form = require('../models/Form');
const { buildScopedFormQuery, userCanAccessForm } = require('../utils/workspaceHelper');
const { parsePagination, buildPaginationMeta } = require('../utils/paginationHelper');
const {
  validateSubmissionAgainstForm,
  canSubmitToForm
} = require('../utils/submissionValidator');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

const syncFormSubmissionStatistics = async (formId) => {
  if (!formId) return;

  const totalSubmissions = await Submission.countDocuments({ formId });
  const latestSubmission = await Submission.findOne({ formId }).sort({ submittedAt: -1 }).select('submittedAt').lean();

  await Form.findOneAndUpdate(
    { id: formId },
    {
      $set: {
        'statistics.totalSubmissions': totalSubmissions,
        'statistics.lastSubmissionDate': latestSubmission?.submittedAt || null
      }
    }
  );
};

const getAccessibleFormIds = async (req) => {
  const forms = await Form.find(buildScopedFormQuery(req, {}))
    .select('id')
    .lean()
    .exec();

  return forms.map((form) => form.id).filter(Boolean);
};

const getOwnedFormByCustomId = async (formId, reqUserId, reqWorkspaceId) => {
  const form = await Form.findOne({ id: formId }).lean();

  if (!form) {
    return { form: null, error: { type: 'not_found' } };
  }

  if (!userCanAccessForm(form, { _id: reqUserId, workspaceId: reqWorkspaceId })) {
    return { form: null, error: { type: 'unauthorized' } };
  }

  return { form, error: null };
};

const getOwnedSubmissionById = async (submissionId, reqUserId, reqWorkspaceId) => {
  const submission = await Submission.findOne({ submissionId }).lean();

  if (!submission) {
    return { submission: null, form: null, error: { type: 'not_found' } };
  }

  const { form, error } = await getOwnedFormByCustomId(submission.formId, reqUserId, reqWorkspaceId);
  if (error) {
    return { submission: null, form: null, error };
  }

  return { submission, form, error: null };
};

const hasOwnedFormAccess = (form, reqUserId, reqWorkspaceId) => (
  userCanAccessForm(form, { _id: reqUserId, workspaceId: reqWorkspaceId })
);

const normalizeForStorage = (value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeForStorage(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const plainValue = typeof value.toObject === 'function'
      ? value.toObject()
      : { ...value };

    return Object.entries(plainValue).reduce((accumulator, [key, item]) => {
      accumulator[key] = normalizeForStorage(item);
      return accumulator;
    }, {});
  }

  return value;
};

// Get all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { formId, dateFrom, dateTo } = req.query;
    const query = {};
    const accessibleFormIds = await getAccessibleFormIds(req);

    if (formId) {
      if (!accessibleFormIds.includes(formId)) {
        return unauthorizedResponse(res, 'You do not have access to this form');
      }
      query.formId = formId;
    } else {
      query.formId = { $in: accessibleFormIds };
    }

    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    const total = await Submission.countDocuments(query);

    return successResponse(res, {
      submissions,
      pagination: buildPaginationMeta({ page, limit, total })
    }, 'Submissions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve submissions', 500);
  }
};

// Get submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const { submission, error } = await getOwnedSubmissionById(
      req.params.id,
      req.userId,
      req.user?.workspaceId
    );

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Submission not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this submission');
    }

    return successResponse(res, submission, 'Submission retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve submission', 500);
  }
};

// Create new submission
exports.createSubmission = async (req, res) => {
  try {
    const { submissionId, formId, formData, metadata } = req.body;

    const normalizedFormData = normalizeForStorage(formData || {});
    const normalizedMetadata = normalizeForStorage(metadata || {});

    const finalSubmissionId = submissionId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const existingSubmission = await Submission.findOne({ submissionId: finalSubmissionId });
    if (existingSubmission) {
      return conflictResponse(res, 'Submission ID already exists');
    }

    const form = await Form.findOne({ id: formId }).lean();
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    const ownsForm = hasOwnedFormAccess(form, req.userId, req.user?.workspaceId);
    const submitCheck = canSubmitToForm(form, req.userId);

    if (!ownsForm && !submitCheck.allowed) {
      return unauthorizedResponse(res, submitCheck.reason || 'You do not have access to this form');
    }

    const fieldErrors = validateSubmissionAgainstForm(form, normalizedFormData);
    if (fieldErrors.length > 0) {
      return validationError(res, 'Submission validation failed', fieldErrors);
    }

    if (form.settings?.allowMultipleSubmissions === false) {
      const duplicateQuery = { formId };

      if (req.userId) {
        duplicateQuery.userId = req.userId;
      } else {
        duplicateQuery['metadata.ipAddress'] = req.ip;
      }

      const existingSubmission = await Submission.findOne(duplicateQuery).select('submissionId submittedAt').lean();
      if (existingSubmission) {
        return conflictResponse(res, 'Multiple submissions are not allowed for this form');
      }
    }
    
    const submission = new Submission({
      submissionId: finalSubmissionId,
      formId,
      userId: req.userId || null, // Set userId if authenticated
      formData: normalizedFormData,
      submittedAt: new Date(),
      metadata: {
        userAgent: normalizedMetadata.userAgent || req.get('User-Agent'),
        ipAddress: normalizedMetadata.ipAddress || req.ip || null,
        referrer: req.headers.referer || null,
        formName: normalizedMetadata.formName || form.name,
        formType: normalizedMetadata.formType || form.type || form.schema?.formType || 'multi-section',
        fieldCount: normalizedMetadata.fieldCount ?? form.schema?.sections?.reduce((total, section) => total + (section.fields?.length || 0), 0) ?? 0,
        submissionMode: normalizedMetadata.submissionMode || normalizedMetadata.source || 'form-page',
        submitterEmail: normalizedMetadata.submitterEmail || req.user?.email || null,
        submittedBy: normalizedMetadata.submittedBy || req.user?.name || null
      }
    });
    
    await submission.save();
    await syncFormSubmissionStatistics(formId);

    const savedSubmission = await Submission.findOne({ submissionId: finalSubmissionId }).lean();
    
    return createdResponse(
      res,
      savedSubmission || {
        submissionId: finalSubmissionId,
        formId,
        formData: normalizedFormData,
        submittedAt: submission.submittedAt,
        metadata: submission.metadata
      },
      'Submission created successfully'
    );
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to create submission', 500);
  }
};

// Update submission
exports.updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Don't allow updating submissionId, formId, or submittedAt
    delete updateData.submissionId;
    delete updateData.formId;
    delete updateData.submittedAt;
    
    const { submission: existingSubmission, error } = await getOwnedSubmissionById(
      id,
      req.userId,
      req.user?.workspaceId
    );

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Submission not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this submission');
    }

    const submission = await Submission.findOneAndUpdate(
      { _id: existingSubmission._id },
      updateData, 
      { new: true, runValidators: true, lean: true }
    );
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
    }
    
    return successResponse(res, submission, 'Submission updated successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to update submission', 500);
  }
};

// Delete submission
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { submission, error } = await getOwnedSubmissionById(
      id,
      req.userId,
      req.user?.workspaceId
    );

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Submission not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this submission');
    }

    await Submission.findByIdAndDelete(submission._id);

    await syncFormSubmissionStatistics(submission.formId);
    
    return successResponse(res, null, 'Submission deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to delete submission', 500);
  }
};

// Get submissions by form
exports.getSubmissionsByForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { page, limit, skip } = parsePagination(req.query);
    const { dateFrom, dateTo } = req.query;
    const { form, error } = await getOwnedFormByCustomId(formId, req.userId, req.user?.workspaceId);

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Form not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }
    
    const query = { formId };
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();

    const total = await Submission.countDocuments(query);

    return successResponse(res, {
      submissions,
      pagination: buildPaginationMeta({ page, limit, total })
    }, 'Submissions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve submissions', 500);
  }
};

// Get submission statistics
exports.getSubmissionStats = async (req, res) => {
  try {
    const { formId } = req.params;
    const { form, error } = await getOwnedFormByCustomId(formId, req.userId, req.user?.workspaceId);

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Form not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }
    
    const query = { formId };
    
    const totalSubmissions = await Submission.countDocuments(query);
    const latestSubmission = await Submission.findOne(query).sort({ submittedAt: -1 }).lean();
    
    const stats = {
      formId,
      formName: form.name,
      totalSubmissions,
      lastSubmissionDate: latestSubmission?.submittedAt || null
    };
    
    return successResponse(res, stats, 'Submission statistics retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to get submission statistics', 500);
  }
};

// Export submissions
exports.exportSubmissions = async (req, res) => {
  try {
    const { formId } = req.params;
    const { format = 'json', dateFrom, dateTo } = req.query;
    const { form, error } = await getOwnedFormByCustomId(formId, req.userId, req.user?.workspaceId);

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Form not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }
    
    const query = { formId };
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .lean();
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(submissions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="submissions_${formId}.csv"`);
      return res.send(csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="submissions_${formId}.json"`);
      return successResponse(res, submissions, 'Submissions exported successfully');
    }
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to export submissions', 500);
  }
};



// Convert submissions to CSV format
function convertToCSV(submissions) {
  if (submissions.length === 0) return '';
  
  const headers = ['Submission ID', 'Form ID', 'Form Name', 'Submitted At'];
  const rows = [headers.join(',')];
  
  for (const submission of submissions) {
    const row = [
      submission.submissionId,
      submission.formId,
      submission.metadata?.formName || '',
      submission.submittedAt.toISOString()
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
    
    rows.push(row);
  }
  
  return rows.join('\n');
} 
