const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  formId: { 
    type: String, // Keep as String to match current formId format
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Optional - for logged in users
    index: true
  },
  formData: { 
    type: mongoose.Schema.Types.Mixed, 
    required: true 
  },
  submittedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    formName: String,
    formType: String,
    fieldCount: Number,
    submissionMode: String,
    submitterEmail: String,
    submittedBy: String,
    referrer: String
  }
}, {
  timestamps: false // We don't need createdAt/updatedAt since we have submittedAt
});

// Indexes for better query performance
submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ userId: 1, submittedAt: -1 }); // User's submissions
submissionSchema.index({ formId: 1, userId: 1 }); // User's submissions to specific form
submissionSchema.index({ submissionId: 1 });
submissionSchema.index({ 'metadata.formName': 1 });
submissionSchema.index({ 'metadata.submitterEmail': 1 });

// Pre-save middleware
submissionSchema.pre('save', function(next) {
  // Auto-set submittedAt if not provided
  if (!this.submittedAt) {
    this.submittedAt = new Date();
  }
  
  next();
});

// Static method to get submissions by form
submissionSchema.statics.getSubmissionsByForm = function(formId, options = {}) {
  const query = { formId };
  
  if (options.dateFrom) {
    query.submittedAt = { $gte: new Date(options.dateFrom) };
  }
  
  if (options.dateTo) {
    query.submittedAt = { ...query.submittedAt, $lte: new Date(options.dateTo) };
  }
  
  return this.find(query)
    .sort({ submittedAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// Static method to get submission statistics
submissionSchema.statics.getSubmissionStats = function(formId) {
  return this.aggregate([
    { $match: { formId: formId } },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        lastSubmission: { $max: '$submittedAt' },
        firstSubmission: { $min: '$submittedAt' }
      }
    }
  ]);
};

// Instance method to validate submission data
submissionSchema.methods.validateSubmission = function() {
  const errors = [];
  const warnings = [];
  
  // Basic validation
  if (!this.formData || typeof this.formData !== 'object') {
    errors.push({
      field: 'formData',
      message: 'Form data is required and must be an object',
      code: 'INVALID_DATA'
    });
  }
  
  // Check for required fields (this would be validated against form schema)
  // Implementation would depend on form validation rules
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

module.exports = mongoose.model('Submission', submissionSchema); 
