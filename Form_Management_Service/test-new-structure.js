/**
 * Test script for new form structure
 * Tests the backend API endpoints with the updated form structure
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3004/api';

// Test form data with new structure
const testForm = {
  id: 'test_form_new_structure',
  name: 'Test Form - New Structure',
  description: 'Testing the new form structure with settings, status, metadata, and statistics',
  type: 'test',
  schema: {
    formType: 'multi-section',
    formTheme: 'modern',
    sections: [
      {
        title: 'Test Section',
        description: 'A test section',
        fields: [
          {
            name: 'testField',
            label: 'Test Field',
            type: 'text',
            required: true,
            placeholder: 'Enter test data'
          }
        ]
      }
    ]
  },
  settings: {
    allowMultipleSubmissions: true,
    requireAuthentication: false,
    redirectUrl: '/test-success',
    successMessage: 'Test form submitted successfully!',
    errorMessage: 'Please check your test data and try again.'
  },
  status: {
    isPublished: false,
    isTemplate: true
  },
  metadata: {
    createdBy: 'test-user',
    version: '1.0.0',
    lastModifiedBy: 'test-user'
  },
  statistics: {
    totalSubmissions: 0,
    totalViews: 0,
    lastSubmissionDate: null
  }
};

async function testAPI() {
  console.log('🧪 Testing new form structure...\n');

  try {
    // Test 1: Create form with new structure
    console.log('1️⃣ Creating form with new structure...');
    const createResponse = await axios.post(`${BASE_URL}/forms`, testForm);
    console.log('✅ Form created successfully');
    console.log('   ID:', createResponse.data.id);
    console.log('   Status:', createResponse.data.status);
    console.log('   Settings:', createResponse.data.settings);
    console.log('   Statistics:', createResponse.data.statistics);
    console.log('');

    // Test 2: Get all forms
    console.log('2️⃣ Getting all forms...');
    const getAllResponse = await axios.get(`${BASE_URL}/forms`);
    console.log(`✅ Found ${getAllResponse.data.forms.length} forms`);
    console.log('');

    // Test 3: Get template forms
    console.log('3️⃣ Getting template forms...');
    const templatesResponse = await axios.get(`${BASE_URL}/forms/templates`);
    console.log(`✅ Found ${templatesResponse.data.forms.length} template forms`);
    console.log('');

    // Test 4: Get published forms
    console.log('4️⃣ Getting published forms...');
    const publishedResponse = await axios.get(`${BASE_URL}/forms/published`);
    console.log(`✅ Found ${publishedResponse.data.forms.length} published forms`);
    console.log('');

    // Test 5: Update form status
    console.log('5️⃣ Updating form status...');
    const updateResponse = await axios.put(`${BASE_URL}/forms/${testForm.id}`, {
      status: {
        isPublished: true,
        isTemplate: false
      }
    });
    console.log('✅ Form status updated');
    console.log('   New status:', updateResponse.data.status);
    console.log('');

    // Test 6: Get form by custom ID
    console.log('6️⃣ Getting form by custom ID...');
    const getByIdResponse = await axios.get(`${BASE_URL}/forms/custom/${testForm.id}`);
    console.log('✅ Form retrieved by custom ID');
    console.log('   Name:', getByIdResponse.data.name);
    console.log('   Status:', getByIdResponse.data.status);
    console.log('');

    // Test 7: Get form statistics
    console.log('7️⃣ Getting form statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/forms/${testForm.id}/stats`);
    console.log('✅ Form statistics retrieved');
    console.log('   Stats:', statsResponse.data);
    console.log('');

    // Test 8: Duplicate form
    console.log('8️⃣ Duplicating form...');
    const duplicateResponse = await axios.post(`${BASE_URL}/forms/${testForm.id}/duplicate`);
    console.log('✅ Form duplicated successfully');
    console.log('   New ID:', duplicateResponse.data.id);
    console.log('   New Name:', duplicateResponse.data.name);
    console.log('');

    // Test 9: Export form
    console.log('9️⃣ Exporting form...');
    const exportResponse = await axios.get(`${BASE_URL}/forms/${testForm.id}/export`);
    console.log('✅ Form exported successfully');
    console.log('   Export data keys:', Object.keys(exportResponse.data));
    console.log('');

    // Test 10: Clean up - Delete test forms
    console.log('🔟 Cleaning up test forms...');
    await axios.delete(`${BASE_URL}/forms/${testForm.id}`);
    await axios.delete(`${BASE_URL}/forms/${duplicateResponse.data.id}`);
    console.log('✅ Test forms deleted');
    console.log('');

    console.log('🎉 All tests passed! The new form structure is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('💡 Make sure the backend server is running on port 3004');
    }
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI, testForm };
