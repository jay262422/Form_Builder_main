const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Form = require('../models/Form');
const { appConfig } = require('../config/appConfig');
const {
  createdResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  validationError
} = require('../utils/responseHelper');

const uploadsRoot = path.join(__dirname, '..', 'uploads');

const sanitizePathSegment = (value = '') => (
  String(value)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'item'
);

const ensureDirectory = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const buildStorageKey = (formId, filename) => (
  path.posix.join('forms', sanitizePathSegment(formId), filename)
);

const buildPublicUrl = (req, storageKey) => (
  `${req.protocol}://${req.get('host')}/uploads/${storageKey}`
);

const hasOwnedFormAccess = (form, reqUserId, reqWorkspaceId) => {
  if (!form) return false;

  if (reqWorkspaceId && form.workspaceId) {
    return form.workspaceId.toString() === reqWorkspaceId.toString();
  }

  if (!form.workspaceId && reqUserId && form.userId) {
    return form.userId.toString() === reqUserId.toString();
  }

  return false;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const formId = sanitizePathSegment(req.params.formId || 'form');
    const targetDirectory = path.join(uploadsRoot, 'forms', formId);
    ensureDirectory(targetDirectory);
    cb(null, targetDirectory);
  },
  filename: (req, file, cb) => {
    const safeOriginalName = sanitizePathSegment(path.parse(file.originalname).name);
    const extension = path.extname(file.originalname || '').toLowerCase();
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${uniqueSuffix}_${safeOriginalName}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: appConfig.uploads.maxSizeMb * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if (appConfig.uploads.allowedMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error(`File type not allowed: ${file.mimetype}`));
  }
});

exports.uploadMiddleware = upload.single('file');

exports.uploadFile = async (req, res) => {
  try {
    const { formId } = req.params;
    const { fieldName } = req.body;

    if (!req.file) {
      return validationError(res, 'A file is required');
    }

    const form = await Form.findOne({ id: formId });
    if (!form) {
      return notFoundResponse(res, 'Form not found');
    }

    const ownsForm = hasOwnedFormAccess(form, req.userId, req.user?.workspaceId);
    const canUploadToPublishedForm = form.status?.isPublished === true;

    if (!ownsForm && !canUploadToPublishedForm) {
      return unauthorizedResponse(res, 'You do not have access to this form');
    }

    if (form.settings?.requireAuthentication && !req.userId) {
      return unauthorizedResponse(res, 'Authentication is required to submit this form');
    }

    const storageKey = buildStorageKey(formId, req.file.filename);
    const fileRecord = {
      name: req.file.originalname,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      url: buildPublicUrl(req, storageKey),
      storageKey,
      fieldName: fieldName || null,
      uploadedAt: new Date().toISOString(),
      processed: true
    };

    return createdResponse(res, fileRecord, 'File uploaded successfully');
  } catch (error) {
    return errorResponse(res, error.message || 'Failed to upload file', 500);
  }
};
