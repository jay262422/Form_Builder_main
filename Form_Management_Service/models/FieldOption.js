const mongoose = require('mongoose');

const fieldOptionSchema = new mongoose.Schema({
  optionType: { 
    type: String, 
    required: true,
    trim: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null
  },
  isTemplate: {
    type: Boolean,
    default: false,
    index: true
  },
  // Store all options for this type in a single array
  options: [{
    label: { 
      type: String, 
      required: true,
      trim: true 
    },
    value: { 
      type: String, 
      required: true,
      trim: true 
    },
    parentValue: { 
      type: String,
      trim: true 
    },
    sortOrder: { 
      type: Number, 
      default: 0 
    },
    metadata: {
      description: String,
      icon: String,
      color: String,
      category: String
    }
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  metadata: {
    description: String,
    category: String,
    displayName: String
  }
}, {
  timestamps: true
});

fieldOptionSchema.index({ optionType: 1, isActive: 1 });
fieldOptionSchema.index(
  { ownerId: 1, optionType: 1 },
  { unique: true, partialFilterExpression: { isTemplate: false, ownerId: { $type: 'objectId' } } }
);
fieldOptionSchema.index(
  { optionType: 1 },
  { unique: true, partialFilterExpression: { isTemplate: true } }
);

// Static method to get options by type
fieldOptionSchema.statics.getOptionsByType = function(optionType, parentValue = null) {
  return this.findOne({ optionType, isActive: true }).then(fieldOption => {
    if (!fieldOption) return [];
    
    if (parentValue) {
      return fieldOption.options.filter(option => option.parentValue === parentValue);
    }
    
    return fieldOption.options.filter(option => !option.parentValue);
  });
};

// Static method to get all option types
fieldOptionSchema.statics.getOptionTypes = function() {
  return this.find({ isActive: true }, 'optionType metadata.displayName');
};

// Instance method to add option
fieldOptionSchema.methods.addOption = function(option) {
  this.options.push(option);
  return this.save();
};

// Instance method to remove option
fieldOptionSchema.methods.removeOption = function(value) {
  this.options = this.options.filter(option => option.value !== value);
  return this.save();
};

module.exports = mongoose.model('FieldOption', fieldOptionSchema); 