const Submission = require('../models/Submission');
const Form = require('../models/Form');
const {
  successResponse,
  errorResponse,
  validationError,
  unauthorizedResponse,
  notFoundResponse,
  conflictResponse,
  createdResponse
} = require('../utils/responseHelper');

const getOwnedFormByCustomId = async (formId, reqUserId, reqWorkspaceId) => {
  const form = await Form.findOne({ id: formId });

  if (!form) {
    return { form: null, error: { type: 'not_found' } };
  }

  if (reqWorkspaceId && form.workspaceId && form.workspaceId.toString() !== reqWorkspaceId.toString()) {
    return { form: null, error: { type: 'unauthorized' } };
  }

  // Fallback check for records without workspace assignment.
  if (!form.workspaceId && reqUserId && form.userId && form.userId.toString() !== reqUserId.toString()) {
    return { form: null, error: { type: 'unauthorized' } };
  }

  return { form, error: null };
};

// Get all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const { 
      formId, 
      page = 1, 
      limit = 10, 
      dateFrom, 
      dateTo 
    } = req.query;
    
    const query = {};
    
    // Multi-tenancy: Filter by userId if authenticated
    if (req.userId) {
      query.userId = req.userId;
    }
    
    if (formId) query.formId = formId;
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Submission.countDocuments(query);
    
    return successResponse(res, {
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    }, 'Submissions retrieved successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to retrieve submissions', 500);
  }
};

// Get submission by ID
exports.getSubmissionById = async (req, res) => {
  try {
    const query = { submissionId: req.params.id };
    
    // Multi-tenancy: Filter by userId if authenticated
    if (req.userId) {
      query.userId = req.userId;
    }
    
    const submission = await Submission.findOne(query);
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
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
    
    if (!formId || !formData) {
      return validationError(res, 'formId and formData are required');
    }
    
    // Generate submissionId if not provided
    const finalSubmissionId = submissionId || `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Check if submission already exists
    const existingSubmission = await Submission.findOne({ submissionId: finalSubmissionId });
    if (existingSubmission) {
      return conflictResponse(res, 'Submission ID already exists');
    }

    // Ensure form exists by custom form ID.
    const form = await Form.findOne({ id: formId });
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    if (req.user?.workspaceId && form.workspaceId && form.workspaceId.toString() !== req.user.workspaceId.toString()) {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }

    if (!form.workspaceId && req.userId && form.userId && form.userId.toString() !== req.userId.toString()) {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }

    if (form.settings?.requireAuthentication && !req.userId) {
      return unauthorizedResponse(res, 'Authentication is required to submit this form');
    }
    
    const submission = new Submission({
      submissionId: finalSubmissionId,
      formId,
      userId: req.userId || null, // Set userId if authenticated
      formData,
      submittedAt: new Date(),
      metadata: {
        userAgent: metadata?.userAgent || req.get('User-Agent'),
        ipAddress: metadata?.ipAddress || req.ip,
        referrer: req.headers.referer || null,
        formName: metadata?.formName
      }
    });
    
    await submission.save();
    
    return createdResponse(res, submission, 'Submission created successfully');
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
    
    const query = { submissionId: id };
    
    // Multi-tenancy: Filter by userId if authenticated
    if (req.userId) {
      query.userId = req.userId;
    }
    
    const submission = await Submission.findOneAndUpdate(
      query, 
      updateData, 
      { new: true, runValidators: true }
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
    const query = { submissionId: id };

    if (req.userId) {
      query.userId = req.userId;
    }

    const submission = await Submission.findOneAndDelete(query);
    
    if (!submission) {
      return notFoundResponse(res, 'Submission not found');
    }
    
    return successResponse(res, null, 'Submission deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to delete submission', 500);
  }
};

// Get submissions by form
exports.getSubmissionsByForm = async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 10, dateFrom, dateTo } = req.query;
    const { form, error } = await getOwnedFormByCustomId(formId, req.userId, req.user?.workspaceId);

    if (error?.type === 'not_found') {
      return notFoundResponse(res, 'Form not found');
    }

    if (error?.type === 'unauthorized') {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }
    
    const query = { formId };
    if (req.userId) {
      query.userId = req.userId;
    }
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
    
    const total = await Submission.countDocuments(query);
    
    return successResponse(res, {
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
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
    if (req.userId) {
      query.userId = req.userId;
    }
    
    const totalSubmissions = await Submission.countDocuments(query);
    const latestSubmission = await Submission.findOne(query).sort({ submittedAt: -1 });
    
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
    if (req.userId) {
      query.userId = req.userId;
    }
    if (dateFrom || dateTo) {
      query.submittedAt = {};
      if (dateFrom) query.submittedAt.$gte = new Date(dateFrom);
      if (dateTo) query.submittedAt.$lte = new Date(dateTo);
    }
    
    const submissions = await Submission.find(query)
      .sort({ submittedAt: -1 });
    
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
