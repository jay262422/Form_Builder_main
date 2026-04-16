const mongoose = require('mongoose');

const dynamicMappingSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true,
    trim: true,
    unique: true
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
  parentField: { 
    type: String, 
    required: true,
    trim: true 
  },
  childField: { 
    type: String, 
    required: true,
    trim: true 
  },
  parentOptionType: { 
    type: String,
    trim: true 
  },
  childOptionType: { 
    type: String,
    trim: true 
  },
  // Store the complete mapping object
  mapping: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  metadata: {
    createdBy: String,
    version: { type: String, default: '1.0.0' },
    category: String
  }
}, {
  timestamps: true
});

// Indexes
dynamicMappingSchema.index({ id: 1 }, { unique: true });
dynamicMappingSchema.index({ name: 1 });
dynamicMappingSchema.index({ parentField: 1, childField: 1 });
dynamicMappingSchema.index({ isActive: 1 });

// Pre-save middleware
dynamicMappingSchema.pre('save', function(next) {
  if (this.isModified('id')) {
    this.constructor.findOne({
      id: this.id,
      _id: { $ne: this._id }
    }).then(existing => {
      if (existing) {
        return next(new Error(`Mapping with id '${this.id}' already exists`));
      }
      next();
    }).catch(next);
  } else {
    next();
  }
});

// Static method to get mappings by parent-child relationship
dynamicMappingSchema.statics.getMappingsByParentChild = function(parentField, childField) {
  return this.find({ 
    parentField, 
    childField, 
    isActive: true 
  });
};

// Static method to get mappings by option types
dynamicMappingSchema.statics.getMappingsByOptionTypes = function(parentOptionType, childOptionType) {
  return this.find({ 
    parentOptionType, 
    childOptionType, 
    isActive: true 
  });
};

// Instance method to get mapped options for a parent value
dynamicMappingSchema.methods.getMappedOptions = function(parentValue) {
  if (this.mapping && this.mapping[parentValue]) {
    return this.mapping[parentValue];
  }
  return [];
};

// Static method to get all mappings
dynamicMappingSchema.statics.getAllMappings = function() {
  return this.find({ isActive: true }).sort({ name: 1 });
};

module.exports = mongoose.model('DynamicMapping', dynamicMappingSchema); 