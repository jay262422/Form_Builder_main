/**
 * Authentication Test Script
 * 
 * Run: node test-auth.js
 * 
 * This script tests:
 * 1. User registration
 * 2. User login
 * 3. Get current user (protected)
 * 4. Create form (protected)
 * 5. Get forms (protected)
 * 6. Test without token (should fail)
 */

const axios = require('axios');

const BASE_URL = process.env.API_URL || 'http://localhost:3004';
let authToken = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test data
const testUser = {
  email: `test_${Date.now()}@example.com`,
  password: 'password123',
  name: 'Test User'
};

async function testRegister() {
  logInfo('\n=== Test 1: Register User ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, testUser);
    authToken = response.data.data.token;
    logSuccess(`User registered: ${response.data.data.user.email}`);
    logSuccess(`Token received: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
      logWarning('User already exists, trying login instead...');
      return await testLogin();
    }
    logError(`Registration failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testLogin() {
  logInfo('\n=== Test 2: Login User ===');
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    authToken = response.data.data.token;
    logSuccess(`Login successful: ${response.data.data.user.email}`);
    logSuccess(`Token received: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logError(`Login failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetCurrentUser() {
  logInfo('\n=== Test 3: Get Current User (Protected) ===');
  if (!authToken) {
    logError('No token available');
    return false;
  }
  try {
    const response = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logSuccess(`Current user: ${response.data.data.user.name} (${response.data.data.user.email})`);
    return true;
  } catch (error) {
    logError(`Get current user failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateForm() {
  logInfo('\n=== Test 4: Create Form (Protected) ===');
  if (!authToken) {
    logError('No token available');
    return false;
  }
  try {
    const formData = {
      name: 'Test Form',
      description: 'A test form created by the test script',
      schema: {
        sections: [
          {
            title: 'Personal Information',
            fields: [
              {
                type: 'text',
                label: 'Full Name',
                name: 'fullName',
                required: true
              },
              {
                type: 'email',
                label: 'Email',
                name: 'email',
                required: true
              }
            ]
          }
        ]
      }
    };
    const response = await axios.post(`${BASE_URL}/api/forms`, formData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const createdForm = response.data.data;
    logSuccess(`Form created: ${createdForm.name} (ID: ${createdForm.id})`);
    return createdForm;
  } catch (error) {
    logError(`Create form failed: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function testGetForms() {
  logInfo('\n=== Test 5: Get User Forms (Protected) ===');
  if (!authToken) {
    logError('No token available');
    return false;
  }
  try {
    const response = await axios.get(`${BASE_URL}/api/forms`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    const forms = response.data.data?.forms || [];
    logSuccess(`Found ${forms.length} forms`);
    if (forms.length > 0) {
      forms.forEach(form => {
        logInfo(`  - ${form.name} (${form.id})`);
      });
    }
    return true;
  } catch (error) {
    logError(`Get forms failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testWithoutToken() {
  logInfo('\n=== Test 6: Create Form Without Token (Should Fail) ===');
  try {
    await axios.post(`${BASE_URL}/api/forms`, {
      name: 'Should Fail',
      schema: {}
    });
    logError('Request succeeded but should have failed!');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      logSuccess('Correctly rejected request without token');
      return true;
    }
    logError(`Unexpected error: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testHealthCheck() {
  logInfo('\n=== Test 0: Health Check ===');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    logSuccess(`Server is running: ${response.data.status}`);
    return true;
  } catch (error) {
    logError(`Server not reachable: ${error.message}`);
    logError(`Make sure server is running on ${BASE_URL}`);
    return false;
  }
}

// Run all tests
async function runTests() {
  log('\n🚀 Starting Authentication Tests\n', 'blue');
  
  const results = {
    healthCheck: false,
    register: false,
    login: false,
    getCurrentUser: false,
    createForm: false,
    getForms: false,
    withoutToken: false
  };

  // Health check first
  results.healthCheck = await testHealthCheck();
  if (!results.healthCheck) {
    logError('\n❌ Server is not running. Please start the server first.');
    process.exit(1);
  }

  // Register user
  results.register = await testRegister();
  if (!results.register) {
    logError('\n❌ Authentication setup failed. Cannot continue.');
    process.exit(1);
  }

  // Test login separately (logout first by clearing token, then login)
  const savedToken = authToken;
  authToken = null;
  results.login = await testLogin();
  authToken = savedToken; // Restore token for subsequent tests

  // Get current user
  results.getCurrentUser = await testGetCurrentUser();

  // Create form
  results.createForm = await testCreateForm();

  // Get forms
  results.getForms = await testGetForms();

  // Test without token
  results.withoutToken = await testWithoutToken();

  // Summary
  log('\n=== Test Summary ===', 'blue');
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    if (result) {
      logSuccess(`${test}: PASSED`);
    } else {
      logError(`${test}: FAILED`);
    }
  });

  log(`\n${passed}/${total} tests passed\n`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    logSuccess('🎉 All tests passed!');
    process.exit(0);
  } else {
    logWarning('⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  logError(`\nFatal error: ${error.message}`);
  process.exit(1);
});
