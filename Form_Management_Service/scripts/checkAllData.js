const mongoose = require('mongoose');
require('dotenv').config();

const Form = require('../models/Form');
const FieldOption = require('../models/FieldOption');
const DynamicMapping = require('../models/DynamicMapping');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form_management');
    console.log('MongoDB connected for data verification');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Check all data
async function checkAllData() {
  try {
    await connectDB();
    
    console.log('\n=== DATABASE STATUS REPORT ===\n');
    
    // Check Forms
    const forms = await Form.find({}).sort({ name: 1 });
    console.log(`📋 FORMS: ${forms.length} total`);
    forms.forEach((form, index) => {
      const sectionCount = form.schema?.sections?.length || 0;
      const fieldCount = form.schema?.sections?.reduce((total, section) => {
        return total + (section.fields?.length || 0);
      }, 0) || 0;
      console.log(`   ${index + 1}. ${form.name} (${sectionCount} sections, ${fieldCount} fields)`);
    });
    
    // Check Field Options
    const fieldOptions = await FieldOption.find({}).sort({ optionType: 1 });
    console.log(`\n🔧 FIELD OPTIONS: ${fieldOptions.length} types`);
    fieldOptions.forEach((option, index) => {
      console.log(`   ${index + 1}. ${option.optionType} (${option.options?.length || 0} options)`);
    });
    
    // Check Dynamic Mappings
    const dynamicMappings = await DynamicMapping.find({}).sort({ name: 1 });
    console.log(`\n🔗 DYNAMIC MAPPINGS: ${dynamicMappings.length} mappings`);
    dynamicMappings.forEach((mapping, index) => {
      console.log(`   ${index + 1}. ${mapping.name} (${Object.keys(mapping.mapping || {}).length} parent options)`);
    });
    
    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`   • Forms: ${forms.length}`);
    console.log(`   • Field Option Types: ${fieldOptions.length}`);
    console.log(`   • Dynamic Mappings: ${dynamicMappings.length}`);
    console.log(`   • Total Records: ${forms.length + fieldOptions.length + dynamicMappings.length}`);
    
    console.log('\n✅ Database verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run if this file is executed directly
if (require.main === module) {
  checkAllData();
}

module.exports = { checkAllData };
