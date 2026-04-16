/**
 * Dynamic Mappings Migration Script
 * Migrates dynamic mappings from frontend JSON file to backend database
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import the DynamicMapping model
const DynamicMapping = require('../models/DynamicMapping');

// Configuration
const FRONTEND_DYNAMIC_MAPPINGS_FILE = path.join(__dirname, '../../../E-marketplace/src/app/Jay_2/data/dynamicMappings.json');

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
 * Read dynamic mappings from frontend JSON file
 */
function readFrontendDynamicMappings() {
  try {
    if (!fs.existsSync(FRONTEND_DYNAMIC_MAPPINGS_FILE)) {
      throw new Error(`Dynamic mappings file not found: ${FRONTEND_DYNAMIC_MAPPINGS_FILE}`);
    }

    const fileContent = fs.readFileSync(FRONTEND_DYNAMIC_MAPPINGS_FILE, 'utf8');
    const dynamicMappingsData = JSON.parse(fileContent);
    
    console.log(`📁 Found dynamic mappings file with ${Object.keys(dynamicMappingsData.dynamicMappings || {}).length} mappings`);
    
    return dynamicMappingsData.dynamicMappings || {};
  } catch (error) {
    console.error('❌ Error reading dynamic mappings file:', error.message);
    return {};
  }
}

/**
 * Normalize dynamic mapping data for database
 */
function normalizeDynamicMapping(mappingId, mappingData) {
  // Extract mapping information
  const {
    name,
    description,
    parentField,
    childField,
    parentOptionType,
    childOptionType,
    mapping,
    metadata = {}
  } = mappingData;

  return {
    id: mappingId,
    name: name || mappingId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: description || `Dynamic mapping for ${mappingId}`,
    parentField: parentField || 'parent',
    childField: childField || 'child',
    parentOptionType: parentOptionType || null,
    childOptionType: childOptionType || null,
    mapping: mapping || {},
    isActive: true,
    metadata: {
      createdBy: metadata.createdBy || 'admin',
      version: metadata.version || '1.0.0',
      category: metadata.category || 'migrated'
    }
  };
}

/**
 * Migrate dynamic mappings to database
 */
async function migrateDynamicMappings() {
  console.log('🔄 Starting dynamic mappings migration...\n');
  
  try {
    // Connect to database
    await connectDB();
    
    // Read dynamic mappings from frontend
    console.log('📖 Reading dynamic mappings from frontend...');
    const dynamicMappings = readFrontendDynamicMappings();
    
    if (Object.keys(dynamicMappings).length === 0) {
      console.log('❌ No dynamic mappings found to migrate');
      return;
    }
    
    console.log(`📋 Found ${Object.keys(dynamicMappings).length} dynamic mappings to migrate\n`);
    
    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: []
    };

    // Migrate each dynamic mapping
    for (const [mappingId, mappingData] of Object.entries(dynamicMappings)) {
      try {
        const normalizedData = normalizeDynamicMapping(mappingId, mappingData);
        
        // Check if dynamic mapping already exists
        const existingMapping = await DynamicMapping.findOne({ id: mappingId });
        
        if (existingMapping) {
          // Update existing mapping
          const updatedMapping = await DynamicMapping.findOneAndUpdate(
            { id: mappingId },
            { $set: normalizedData },
            { new: true, runValidators: true }
          );
          
          results.updated++;
          results.details.push({
            mappingId,
            name: normalizedData.name,
            action: 'updated',
            status: 'success'
          });
          
          console.log(`  ✅ Updated: ${normalizedData.name} (${mappingId})`);
        } else {
          // Create new mapping
          const newMapping = new DynamicMapping(normalizedData);
          await newMapping.save();
          
          results.created++;
          results.details.push({
            mappingId,
            name: normalizedData.name,
            action: 'created',
            status: 'success'
          });
          
          console.log(`  ✅ Created: ${normalizedData.name} (${mappingId})`);
        }
      } catch (error) {
        results.errors++;
        results.details.push({
          mappingId,
          name: mappingId,
          action: 'failed',
          status: 'error',
          error: error.message
        });
        
        console.error(`  ❌ Error migrating ${mappingId}:`, error.message);
      }
    }

    // Print results
    console.log('\n📊 Migration Results:');
    console.log(`  ✅ Created: ${results.created} dynamic mappings`);
    console.log(`  ✅ Updated: ${results.updated} dynamic mappings`);
    console.log(`  ❌ Errors: ${results.errors} dynamic mappings`);
    
    if (results.errors > 0) {
      console.log('\n❌ Failed migrations:');
      results.details
        .filter(detail => detail.status === 'error')
        .forEach(detail => {
          console.log(`  - ${detail.mappingId}: ${detail.error}`);
        });
    }

    // Validate migration
    await validateMigration();
    
    console.log('\n🎉 Dynamic mappings migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

/**
 * Validate migrated dynamic mappings
 */
async function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  const totalMappings = await DynamicMapping.countDocuments();
  const activeMappings = await DynamicMapping.countDocuments({ isActive: true });
  
  console.log(`  📊 Total dynamic mappings in database: ${totalMappings}`);
  console.log(`  📊 Active dynamic mappings: ${activeMappings}`);
  
  // Get mappings
  const mappings = await DynamicMapping.find({ isActive: true }, 'id name description parentField childField');
  console.log(`  📊 Available mappings: ${mappings.length}`);
  
  mappings.forEach(mapping => {
    console.log(`    - ${mapping.name} (${mapping.id})`);
    console.log(`      Parent: ${mapping.parentField} → Child: ${mapping.childField}`);
  });
  
  return {
    totalMappings,
    activeMappings,
    mappings: mappings.length
  };
}

/**
 * Clean up function to remove all dynamic mappings (for testing)
 */
async function cleanupDynamicMappings() {
  console.log('🧹 Cleaning up all dynamic mappings...');
  
  try {
    await connectDB();
    const result = await DynamicMapping.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} dynamic mappings`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

/**
 * List all dynamic mappings in database
 */
async function listDynamicMappings() {
  console.log('📋 Listing all dynamic mappings in database...');
  
  try {
    await connectDB();
    const mappings = await DynamicMapping.find({}, 'id name description parentField childField isActive createdAt');
    
    console.log(`\nFound ${mappings.length} dynamic mappings:\n`);
    mappings.forEach(mapping => {
      console.log(`  📄 ${mapping.name} (${mapping.id})`);
      console.log(`     Parent: ${mapping.parentField} → Child: ${mapping.childField}`);
      console.log(`     Active: ${mapping.isActive}, Created: ${mapping.createdAt.toISOString().split('T')[0]}\n`);
    });
  } catch (error) {
    console.error('❌ Error listing dynamic mappings:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'migrate':
    migrateDynamicMappings();
    break;
  case 'cleanup':
    cleanupDynamicMappings();
    break;
  case 'list':
    listDynamicMappings();
    break;
  default:
    console.log(`
📋 Dynamic Mappings Migration Script

Usage:
  node migrateDynamicMappings.js migrate     - Migrate dynamic mappings from frontend to backend
  node migrateDynamicMappings.js cleanup     - Remove all dynamic mappings from database
  node migrateDynamicMappings.js list        - List all dynamic mappings in database

Examples:
  node migrateDynamicMappings.js migrate
  node migrateDynamicMappings.js cleanup
  node migrateDynamicMappings.js list
    `);
}

// Export functions for testing
module.exports = {
  normalizeDynamicMapping,
  readFrontendDynamicMappings,
  migrateDynamicMappings,
  cleanupDynamicMappings,
  listDynamicMappings
};
