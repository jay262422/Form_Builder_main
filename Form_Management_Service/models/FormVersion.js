const mongoose = require('mongoose');

const formVersionSchema = new mongoose.Schema({
  formId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
    index: true
  },
  versionNumber: {
    type: Number,
    required: true
  },
  changeSummary: {
    type: String,
    trim: true,
    default: 'Form update'
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  createdBy: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    name: {
      type: String,
      default: 'system'
    },
    email: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

formVersionSchema.index({ formId: 1, versionNumber: -1 }, { unique: true });
formVersionSchema.index({ workspaceId: 1, createdAt: -1 });

const FormVersion = mongoose.model('FormVersion', formVersionSchema);
module.exports = FormVersion;
