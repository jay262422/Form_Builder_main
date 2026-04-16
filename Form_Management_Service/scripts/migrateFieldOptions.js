/**
 * Field Options Migration Script
 * Migrates field options from frontend JSON file to backend database
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the FieldOption model
const FieldOption = require('../models/FieldOption');

// Configuration
const FRONTEND_FIELD_OPTIONS_FILE = path.join(__dirname, '../../../E-marketplace/src/app/Jay_2/data/fieldOptions.json');

// Database connection
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form_management');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

/**
 * Read field options from frontend JSON file
 */
function readFrontendFieldOptions() {
  try {
    if (!fs.existsSync(FRONTEND_FIELD_OPTIONS_FILE)) {
      throw new Error(`Field options file not found: ${FRONTEND_FIELD_OPTIONS_FILE}`);
    }

    const fileContent = fs.readFileSync(FRONTEND_FIELD_OPTIONS_FILE, 'utf8');
    const fieldOptionsData = JSON.parse(fileContent);
    
    console.log(`📁 Found field options file with ${Object.keys(fieldOptionsData.fieldOptions || {}).length} option types`);
    
    return fieldOptionsData.fieldOptions || {};
  } catch (error) {
    console.error('❌ Error reading field options file:', error.message);
    return {};
  }
}

/**
 * Normalize field option data for database
 */
function normalizeFieldOption(optionType, options) {
  const normalizedOptions = [];
  
  if (Array.isArray(options)) {
    // Handle array format
    options.forEach((option, index) => {
      if (typeof option === 'string') {
        normalizedOptions.push({
          label: option,
          value: option.toLowerCase().replace(/\s+/g, '_'),
          sortOrder: index
        });
      } else if (typeof option === 'object') {
        normalizedOptions.push({
          label: option.label || option.name || option,
          value: option.value || option.id || option.toLowerCase().replace(/\s+/g, '_'),
          parentValue: option.parentValue || null,
          sortOrder: option.sortOrder || index,
          metadata: {
            description: option.description || null,
            icon: option.icon || null,
            color: option.color || null,
            category: option.category || null
          }
        });
      }
    });
  } else if (typeof options === 'object') {
    // Handle object format
    Object.entries(options).forEach(([key, value], index) => {
      if (typeof value === 'string') {
        normalizedOptions.push({
          label: value,
          value: key,
          sortOrder: index
        });
      } else if (typeof value === 'object') {
        normalizedOptions.push({
          label: value.label || value.name || key,
          value: value.value || key,
          parentValue: value.parentValue || null,
          sortOrder: value.sortOrder || index,
          metadata: {
            description: value.description || null,
            icon: value.icon || null,
            color: value.color || null,
            category: value.category || null
          }
        });
      }
    });
  }

  return {
    optionType,
    options: normalizedOptions,
    isActive: true,
    metadata: {
      description: `Field options for ${optionType}`,
      category: 'migrated',
      displayName: optionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
  };
}

/**
 * Migrate field options to database
 */
async function migrateFieldOptions() {
  console.log('🔄 Starting field options migration...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Read field options from frontend
    console.log('📖 Reading field options from frontend...');
    const fieldOptions = readFrontendFieldOptions();
    
    if (Object.keys(fieldOptions).length === 0) {
      console.log('❌ No field options found to migrate');
      return;
    }
    
    console.log(`📋 Found ${Object.keys(fieldOptions).length} field option types to migrate\n`);
    
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: []
    };

    // Migrate each field option type
    for (const [optionType, options] of Object.entries(fieldOptions)) {
      try {
        const normalizedData = normalizeFieldOption(optionType, options);
        
        // Check if field option type already exists
        const existingFieldOption = await FieldOption.findOne({ optionType });
        
        if (existingFieldOption) {
          // Update existing field option
          const updatedFieldOption = await FieldOption.findOneAndUpdate(
            { optionType },
            { $set: normalizedData },
            { new: true, runValidators: true }
          );
          
          results.updated++;
          results.details.push({
            optionType,
            action: 'updated',
            status: 'success',
            optionsCount: normalizedData.options.length
          });
          
          console.log(`  ✅ Updated: ${optionType} (${normalizedData.options.length} options)`);
        } else {
          // Create new field option
          const newFieldOption = new FieldOption(normalizedData);
          await newFieldOption.save();
          
          results.created++;
          results.details.push({
            optionType,
            action: 'created',
            status: 'success',
            optionsCount: normalizedData.options.length
          });
          
          console.log(`  ✅ Created: ${optionType} (${normalizedData.options.length} options)`);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          optionType,
          action: 'failed',
          status: 'error',
          error: error.message
        });
        
        console.error(`  ❌ Error migrating ${optionType}:`, error.message);
      }
    }

    // Print results
    console.log('\n📊 Migration Results:');
    console.log(`  ✅ Created: ${results.created} field option types`);
    console.log(`  ✅ Updated: ${results.updated} field option types`);
    console.log(`  ❌ Errors: ${results.errors} field option types`);
    
    if (results.errors > 0) {
      console.log('\n❌ Failed migrations:');
      results.details
        .filter(detail => detail.status === 'error')
        .forEach(detail => {
          console.log(`  - ${detail.optionType}: ${detail.error}`);
        });
    }

    // Validate migration
    await validateMigration();
    
    console.log('\n🎉 Field options migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Validate migrated field options
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  const totalFieldOptions = await FieldOption.countDocuments();
  const activeFieldOptions = await FieldOption.countDocuments({ isActive: true });
  
  console.log(`  📊 Total field option types in database: ${totalFieldOptions}`);
  console.log(`  📊 Active field option types: ${activeFieldOptions}`);
  
  // Get option types
  const optionTypes = await FieldOption.find({ isActive: true }, 'optionType metadata.displayName');
  console.log(`  📊 Available option types: ${optionTypes.length}`);
  
  optionTypes.forEach(option => {
    console.log(`    - ${option.optionType} (${option.metadata?.displayName || 'No display name'})`);
  });
  
  return {
    totalFieldOptions,
    activeFieldOptions,
    optionTypes: optionTypes.length
  };
}

/**
 * Clean up function to remove all field options (for testing)
 */
async function cleanupFieldOptions() {
  console.log('🧹 Cleaning up all field options...');
  
  try {
    await connectDB();
    const result = await FieldOption.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} field option types`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * List all field options in database
 */
async function listFieldOptions() {
  console.log('📋 Listing all field options in database...');
  
  try {
    await connectDB();
    const fieldOptions = await FieldOption.find({}, 'optionType options.length isActive createdAt');
    
    console.log(`\nFound ${fieldOptions.length} field option types:\n`);
    fieldOptions.forEach(fieldOption => {
      console.log(`  📄 ${fieldOption.optionType} (${fieldOption.options.length} options)`);
      console.log(`     Active: ${fieldOption.isActive}, Created: ${fieldOption.createdAt.toISOString().split('T')[0]}\n`);
    });
  } catch (error) {
    console.error('❌ Error listing field options:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateFieldOptions();
    break;
  case 'cleanup':
    cleanupFieldOptions();
    break;
  case 'list':
    listFieldOptions();
    break;
  default:
    console.log(`
📋 Field Options Migration Script

Usage:
  node migrateFieldOptions.js migrate     - Migrate field options from frontend to backend
  node migrateFieldOptions.js cleanup     - Remove all field options from database
  node migrateFieldOptions.js list        - List all field options in database

Examples:
  node migrateFieldOptions.js migrate
  node migrateFieldOptions.js cleanup
  node migrateFieldOptions.js list
    `);
}

// Export functions for testing
module.exports = {
  normalizeFieldOption,
  readFrontendFieldOptions,
  migrateFieldOptions,
  cleanupFieldOptions,
  listFieldOptions
};
