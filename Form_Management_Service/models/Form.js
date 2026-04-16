const mongoose = require('mongoose');

const formSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true
  },
  id: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    default: null,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: false,
    default: null,
    index: true
  },
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  description: { 
    type: String,
    trim: true 
  },
  type: { 
    type: String,
    trim: true 
  },
  // Store the complete schema as mixed type to avoid compilation issues
  schema: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  // Use Mixed type for complex settings to avoid validation issues
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      allowMultipleSubmissions: false,
      requireAuthentication: false,
      redirectUrl: '/thank-you',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Please check your form and try again.',
      postSubmission: {
        showSuccessPage: true,
        showSubmittedData: false,
        allowResubmit: true,
        resubmitText: 'Submit Another Request',
        successIcon: '✅',
        errorIcon: '⚠️',
        autoRedirect: {
          enabled: false,
          delay: 3000
        },
        notifications: {
          email: {
            enabled: false,
            recipients: []
          }
        }
      },
      buttons: {
        submit: {
          text: 'Submit',
          show: true,
          customApiEndpoint: null,
          customApiMethod: 'POST'
        },
        reset: {
          text: 'Reset',
          show: true
        },
        cancel: {
          text: 'Cancel',
          show: true
        }
      }
    }
  },
  // Status object
  status: {
    isPublished: { type: Boolean, default: false },
    isTemplate: { type: Boolean, default: false }
  },
  // Metadata object
  metadata: {
    createdBy: { type: String, default: 'admin' },
    version: { type: String, default: '1.0.0' },
    lastModifiedBy: { type: String, default: 'admin' }
  },
  // Statistics object
  statistics: {
    totalSubmissions: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    lastSubmissionDate: { type: Date, default: null }
  },
  // UI Configuration object
  ui_part: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      themeId: 'default',
      layout: {},
      sectionStyle: 'card',
      removeSectionBoxes: false
    }
  },
  // Legacy field for backward compatibility
  isExample: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
formSchema.index({ id: 1 }, { unique: true });
formSchema.index({ userId: 1 }); // Multi-tenancy support
formSchema.index({ workspaceId: 1 }); // Team workspace support
formSchema.index({ workspaceId: 1, createdAt: -1 }); // Team recent forms
formSchema.index({ userId: 1, 'status.isPublished': 1 }); // User's published forms
formSchema.index({ userId: 1, createdAt: -1 }); // User's recent forms
formSchema.index({ name: 1 });
formSchema.index({ type: 1 });
formSchema.index({ 'status.isPublished': 1 });
formSchema.index({ 'status.isTemplate': 1 });
formSchema.index({ createdAt: -1 });
formSchema.index({ updatedAt: -1 });

// Virtual for submission count
formSchema.virtual('submissionCount', {
  ref: 'Submission',
  localField: '_id',
  foreignField: 'formId',
  count: true
});

// Virtual for form sections
formSchema.virtual('sections', function() {
  return this.schema?.sections || [];
});

// Virtual for total fields count
formSchema.virtual('totalFields', function() {
  if (!this.schema?.sections) return 0;
  return this.schema.sections.reduce((total, section) => {
    return total + (section.fields?.length || 0);
  }, 0);
});

// Pre-save middleware
formSchema.pre('save', function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Ensure unique field names within each section
  if (this.schema?.sections) {
    for (const section of this.schema.sections) {
      if (section.fields) {
        const fieldNames = section.fields.map(field => field.name);
        const uniqueNames = new Set(fieldNames);
        
        if (fieldNames.length !== uniqueNames.size) {
          return next(new Error(`Field names must be unique within each section`));
        }
      }
    }
  }
  
  next();
});

// Static method to get published forms
formSchema.statics.getPublishedForms = function() {
  return this.find({ 
    'status.isPublished': true 
  }).sort({ createdAt: -1 });
};

// Static method to get template forms
formSchema.statics.getTemplateForms = function() {
  return this.find({ 
    'status.isTemplate': true 
  }).sort({ createdAt: -1 });
};

// Static method to get forms by type
formSchema.statics.getFormsByType = function(type) {
  return this.find({ 
    type
  }).sort({ createdAt: -1 });
};

// Static method to get popular forms
formSchema.statics.getPopularForms = function(limit = 10) {
  return this.find()
    .sort({ 'statistics.totalSubmissions': -1 })
    .limit(limit);
};

// Static method to get recent forms
formSchema.statics.getRecentForms = function(limit = 10) {
  return this.find()
    .sort({ createdAt: -1 })
    .limit(limit);
};

const Form = mongoose.model('Form', formSchema);
module.exports = Form; 
