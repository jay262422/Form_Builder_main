const mongoose = require('mongoose');
require('dotenv').config();

async function testSetup() {
  try {
    console.log('Testing Form Management Service setup...');
    
    // Test MongoDB connection
    console.log('1. Testing MongoDB connection...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/form_management');
    console.log('✅ MongoDB connected successfully');
    
    // Test models
    console.log('2. Testing models...');
    const Form = require('./models/Form');
    const FieldOption = require('./models/FieldOption');
    const DynamicMapping = require('./models/DynamicMapping');
    const Submission = require('./models/Submission');
    console.log('✅ All models loaded successfully');
    
    // Test database operations
    console.log('3. Testing database operations...');
    
    // Test form creation
    const testForm = new Form({
      name: 'Test Form',
      description: 'Test form for setup verification',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true
        }
      ],
      metadata: {
        createdBy: 'test-setup',
        category: 'test'
      }
    });
    
    await testForm.save();
    console.log('✅ Form creation test passed');
    
    // Test field option creation
    const testOption = new FieldOption({
      optionType: 'test_type',
      label: 'Test Option',
      value: 'test_value'
    });
    
    await testOption.save();
    console.log('✅ Field option creation test passed');
    
    // Clean up test data
    await Form.deleteOne({ name: 'Test Form' });
    await FieldOption.deleteOne({ optionType: 'test_type' });
    console.log('✅ Test data cleaned up');
    
    // Test server startup
    console.log('4. Testing server startup...');
    const app = require('./server');
    console.log('✅ Server can be started');
    
    console.log('\n🎉 All tests passed! Form Management Service is ready.');
    console.log('\nNext steps:');
    console.log('1. Run: npm install');
    console.log('2. Run: node scripts/migrateData.js (to migrate existing data)');
    console.log('3. Run: npm start (to start the service)');
    console.log('4. Test health check: http://localhost:3004/health');
    
  } catch (error) {
    console.error('❌ Setup test failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MongoDB is running on localhost:27017');
    console.log('2. Check if all dependencies are installed: npm install');
    console.log('3. Verify environment variables in .env file');
  } finally {
    await mongoose.connection.close();
  }
}

testSetup(); 