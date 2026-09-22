const fs = require('fs');
const path = require('path');
const { appConfig } = require('../config/appConfig');

const uploadsRoot = path.join(__dirname, '..', 'uploads');

/**
 * Local storage adapter.
 * Swap implementation to S3/Cloudflare R2 when moving to SaaS production.
 */
const storageService = {
  provider: 'local',

  getUploadRoot() {
    return uploadsRoot;
  },

  ensureUploadDirectory(relativePath) {
    const target = path.join(uploadsRoot, relativePath);
    fs.mkdirSync(target, { recursive: true });
    return target;
  },

  buildPublicUrl(req, storageKey) {
    return `${req.protocol}://${req.get('host')}/uploads/${storageKey}`;
  },

  getMaxFileSizeBytes() {
    return appConfig.uploads.maxSizeMb * 1024 * 1024;
  },

  getAllowedMimeTypes() {
    return appConfig.uploads.allowedMimeTypes;
  }
};

module.exports = storageService;
