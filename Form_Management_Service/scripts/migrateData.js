/**
 * Data Migration Script
 * Migrates forms from frontend JSON files to backend database
 * Converts old structure to new structure with settings, status, metadata, statistics
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the Form model
const Form = require('../models/Form');

// Configuration
const FRONTEND_FORMS_DIR = path.join(__dirname, '../../../E-marketplace/src/app/Jay_2/data/all_forms');
const BACKEND_URL = 'http://localhost:3004/api/forms';

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
 * Normalize form data to match new backend structure
 */
function normalizeFormData(rawForm) {
  if (!rawForm || typeof rawForm !== 'object') {
    throw new Error('Invalid form data');
  }

  // Default values for new structure
  const defaultSettings = {
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
  };

  const defaultStatus = {
    isPublished: false,
    isTemplate: false
  };

  const defaultMetadata = {
    createdBy: 'admin',
    version: '1.0.0',
    lastModifiedBy: 'admin'
  };

  const defaultStatistics = {
    totalSubmissions: 0,
    totalViews: 0,
    lastSubmissionDate: null
  };

  const defaultUI = {
    themeId: 'default',
    layout: {},
    sectionStyle: 'card',
    removeSectionBoxes: false
  };

  // Map legacy fields to new structure
  const legacyIsTemplate = rawForm.isTemplate || false;
  const legacyIsExample = rawForm.isExample || false;

  return {
    _id: rawForm._id || new mongoose.Types.ObjectId(),
    id: rawForm.id,
    name: rawForm.name,
    description: rawForm.description,
    type: rawForm.type,
    schema: rawForm.schema,

    // Enhanced settings with deep merge
    settings: {
      ...defaultSettings,
      ...(rawForm.settings || {}),
      postSubmission: {
        ...defaultSettings.postSubmission,
        ...(rawForm.settings?.postSubmission || {})
      },
      buttons: {
        ...defaultSettings.buttons,
        ...(rawForm.settings?.buttons || {})
      }
    },
    status: { 
      ...defaultStatus, 
      ...(rawForm.status || {}), 
      isTemplate: (rawForm.status?.isTemplate ?? (legacyIsTemplate || legacyIsExample))
    },
    metadata: { ...defaultMetadata, ...(rawForm.metadata || {}) },
    statistics: { ...defaultStatistics, ...(rawForm.statistics || {}) },
    ui_part: { ...defaultUI, ...(rawForm.ui_part || {}) },
    isExample: legacyIsExample,

    // Timestamps
    createdAt: rawForm.createdAt || new Date().toISOString(),
    updatedAt: rawForm.updatedAt || new Date().toISOString()
  };
}

/**
 * Read all form files from frontend directory
 */
function readFrontendForms() {
  try {
    if (!fs.existsSync(FRONTEND_FORMS_DIR)) {
      throw new Error(`Frontend forms directory not found: ${FRONTEND_FORMS_DIR}`);
    }

    const files = fs.readdirSync(FRONTEND_FORMS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(FRONTEND_FORMS_DIR, file));

    console.log(`📁 Found ${files.length} form files in frontend directory`);

    const forms = [];
    const errors = [];

    files.forEach(filePath => {
      try {
        const formData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const normalizedForm = normalizeFormData(formData);
        forms.push(normalizedForm);
        console.log(`  ✅ Loaded: ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`  ❌ Error loading ${path.basename(filePath)}:`, error.message);
        errors.push({ file: path.basename(filePath), error: error.message });
      }
    });

    return { forms, errors };
      } catch (error) {
    console.error('❌ Error reading frontend forms:', error.message);
    return { forms: [], errors: [error.message] };
  }
}

/**
 * Migrate forms using API endpoints
 */
async function migrateFormsViaAPI(forms) {
  console.log('\n🚀 Starting API migration...');
  
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: []
  };

  for (const form of forms) {
    try {
      // Check if form already exists
      const existingForm = await Form.findOne({ id: form.id });
      
      if (existingForm) {
        // Update existing form - exclude _id from update
        const { _id, ...updateData } = form;
        const updatedForm = await Form.findOneAndUpdate(
          { id: form.id },
          { $set: updateData },
          { new: true, runValidators: true }
        );
        
        results.updated++;
        results.details.push({
          id: form.id,
          name: form.name,
          action: 'updated',
          status: 'success'
        });
        
        console.log(`  ✅ Updated: ${form.name} (${form.id})`);
      } else {
        // Create new form
        const newForm = new Form(form);
        await newForm.save();
        
        results.created++;
        results.details.push({
          id: form.id,
          name: form.name,
          action: 'created',
          status: 'success'
        });
        
        console.log(`  ✅ Created: ${form.name} (${form.id})`);
      }
  } catch (error) {
      results.errors++;
      results.details.push({
        id: form.id,
        name: form.name,
        action: 'failed',
        status: 'error',
        error: error.message
      });
      
      console.error(`  ❌ Error migrating ${form.name}:`, error.message);
    }
  }

  return results;
}

/**
 * Migrate forms using direct database operations
 */
async function migrateFormsDirect(forms) {
  console.log('\n🚀 Starting direct database migration...');
  
  const results = {
    created: 0,
    updated: 0,
    errors: 0,
    details: []
  };

  for (const form of forms) {
    try {
      // Check if form already exists
      const existingForm = await Form.findOne({ id: form.id });
      
      if (existingForm) {
        // Update existing form - exclude _id from update
        const { _id, ...updateData } = form;
        const updatedForm = await Form.findOneAndUpdate(
          { id: form.id },
          { $set: updateData },
          { new: true, runValidators: true }
        );
        
        results.updated++;
        results.details.push({
          id: form.id,
          name: form.name,
          action: 'updated',
          status: 'success'
        });
        
        console.log(`  ✅ Updated: ${form.name} (${form.id})`);
      } else {
        // Create new form
        const newForm = new Form(form);
        await newForm.save();
        
        results.created++;
        results.details.push({
          id: form.id,
          name: form.name,
          action: 'created',
          status: 'success'
        });
        
        console.log(`  ✅ Created: ${form.name} (${form.id})`);
      }
    } catch (error) {
      results.errors++;
      results.details.push({
        id: form.id,
        name: form.name,
        action: 'failed',
        status: 'error',
        error: error.message
      });
      
      console.error(`  ❌ Error migrating ${form.name}:`, error.message);
    }
  }

  return results;
}

/**
 * Validate migrated forms
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  const totalForms = await Form.countDocuments();
  const publishedForms = await Form.countDocuments({ 'status.isPublished': true });
  const templateForms = await Form.countDocuments({ 'status.isTemplate': true });
  
  console.log(`  📊 Total forms in database: ${totalForms}`);
  console.log(`  📊 Published forms: ${publishedForms}`);
  console.log(`  📊 Template forms: ${templateForms}`);
  
  // Check for forms with new structure
  const formsWithNewStructure = await Form.countDocuments({
    $and: [
      { settings: { $exists: true } },
      { status: { $exists: true } },
      { metadata: { $exists: true } },
      { statistics: { $exists: true } }
    ]
  });
  
  console.log(`  📊 Forms with new structure: ${formsWithNewStructure}`);
  
  if (formsWithNewStructure === totalForms) {
    console.log('  ✅ All forms have the new structure!');
  } else {
    console.log('  ⚠️  Some forms may not have the new structure');
  }
  
  return {
    totalForms,
    publishedForms,
    templateForms,
    formsWithNewStructure
  };
}

/**
 * Main migration function
 */
async function migrateForms() {
  console.log('🔄 Starting form migration process...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Read forms from frontend
    console.log('📖 Reading forms from frontend...');
    const { forms, errors } = readFrontendForms();
    
    if (errors.length > 0) {
      console.log(`⚠️  Found ${errors.length} errors while reading forms:`);
      errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (forms.length === 0) {
      console.log('❌ No forms found to migrate');
      return;
    }
    
    console.log(`📋 Found ${forms.length} forms to migrate\n`);
    
    // Choose migration method
    const useAPI = process.argv.includes('--api');
    const results = useAPI 
      ? await migrateFormsViaAPI(forms)
      : await migrateFormsDirect(forms);
    
    // Print results
    console.log('\n📊 Migration Results:');
    console.log(`  ✅ Created: ${results.created} forms`);
    console.log(`  ✅ Updated: ${results.updated} forms`);
    console.log(`  ❌ Errors: ${results.errors} forms`);
    
    if (results.errors > 0) {
      console.log('\n❌ Failed migrations:');
      results.details
        .filter(detail => detail.status === 'error')
        .forEach(detail => {
          console.log(`  - ${detail.name} (${detail.id}): ${detail.error}`);
        });
    }
    
    // Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration completed successfully!');
    
          } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Clean up function to remove all forms (for testing)
 */
async function cleanupForms() {
  console.log('🧹 Cleaning up all forms...');
  
  try {
    await connectDB();
    const result = await Form.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} forms`);
    } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * List all forms in database
 */
async function listForms() {
  console.log('📋 Listing all forms in database...');
  
  try {
    await connectDB();
    const forms = await Form.find({}, 'id name status.isPublished status.isTemplate createdAt');
    
    console.log(`\nFound ${forms.length} forms:\n`);
    forms.forEach(form => {
      console.log(`  📄 ${form.name} (${form.id})`);
      console.log(`     Published: ${form.status.isPublished}, Template: ${form.status.isTemplate}`);
      console.log(`     Created: ${form.createdAt.toISOString().split('T')[0]}\n`);
    });
  } catch (error) {
    console.error('❌ Error listing forms:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateForms();
    break;
  case 'cleanup':
    cleanupForms();
    break;
  case 'list':
    listForms();
    break;
  default:
    console.log(`
📋 Form Migration Script

Usage:
  node migrateData.js migrate     - Migrate forms from frontend to backend
  node migrateData.js migrate --api - Use API endpoints for migration
  node migrateData.js cleanup     - Remove all forms from database
  node migrateData.js list        - List all forms in database

Examples:
  node migrateData.js migrate
  node migrateData.js migrate --api
  node migrateData.js cleanup
  node migrateData.js list
    `);
}

// Export functions for testing
module.exports = {
  normalizeFormData,
  readFrontendForms,
  migrateForms,
  cleanupForms,
  listForms
}; 