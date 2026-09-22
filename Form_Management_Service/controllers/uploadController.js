const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Form = require('../models/Form');
const { userCanAccessForm } = require('../utils/workspaceHelper');
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

const hasOwnedFormAccess = (form, reqUserId, reqWorkspaceId) => (
  userCanAccessForm(form, { _id: reqUserId, workspaceId: reqWorkspaceId })
);

const EXTENSIONS_BY_MIME = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const extensionForUpload = (file) => {
  const allowedExtensions = EXTENSIONS_BY_MIME[file.mimetype] || [];
  const originalExtension = path.extname(file.originalname || '').toLowerCase();
  if (allowedExtensions.includes(originalExtension)) return originalExtension;
  return '';
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: appConfig.uploads.maxSizeMb * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    const allowedExtensions = EXTENSIONS_BY_MIME[file.mimetype];
    if (
      allowedExtensions &&
      appConfig.uploads.allowedMimeTypes.includes(file.mimetype) &&
      extensionForUpload(file)
    ) {
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

    const extension = extensionForUpload(req.file);
    if (!extension) {
      return validationError(res, 'File type not allowed');
    }

    const safeOriginalName = sanitizePathSegment(path.parse(req.file.originalname).name);
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeOriginalName}${extension}`;
    const formDirectory = path.join(uploadsRoot, 'forms', sanitizePathSegment(formId));
    ensureDirectory(formDirectory);
    fs.writeFileSync(path.join(formDirectory, filename), req.file.buffer);

    const storageKey = buildStorageKey(formId, filename);
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
