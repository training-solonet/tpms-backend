const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

let authToken = null;

// Test authentication first
async function testLogin() {
  try {
    console.log('🔐 Testing admin login...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_CREDENTIALS);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Login successful');
      console.log('📋 User info:', response.data.data.user);
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

// Test protected endpoints
async function testProtectedEndpoints() {
  if (!authToken) {
    console.log('❌ No auth token available');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  const endpoints = [
    { method: 'GET', url: '/trucks', name: 'Get all trucks' },
    { method: 'GET', url: '/trucks/realtime/locations', name: 'Get realtime locations' },
    { method: 'GET', url: '/dashboard/stats', name: 'Get dashboard stats' },
    { method: 'GET', url: '/dashboard/fleet-summary', name: 'Get fleet summary' },
    { method: 'GET', url: '/dashboard/alerts', name: 'Get alert summary' },
    { method: 'GET', url: '/mining-area', name: 'Get mining areas' },
    { method: 'GET', url: '/mining-area/statistics', name: 'Get zone statistics' }
  ];

  console.log('\n🧪 Testing protected API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing: ${endpoint.name}`);
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.url}`,
        headers
      });

      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        if (response.data.data) {
          console.log(`   📊 Data count: ${Array.isArray(response.data.data) ? response.data.data.length : 'Object'}`);
        }
      } else {
        console.log(`⚠️  ${endpoint.name}: Unexpected status ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint.name}: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else {
        console.log(`❌ ${endpoint.name}: ${error.message}`);
      }
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Test without authentication
async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing unauthorized access...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/trucks`);
    console.log('⚠️  Unauthorized access succeeded (this should not happen)');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access properly blocked');
    } else {
      console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
    }
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  
  // Test login
  const loginSuccess = await testLogin();
  
  if (loginSuccess) {
    // Test protected endpoints
    await testProtectedEndpoints();
  }
  
  // Test unauthorized access
  await testUnauthorizedAccess();
  
  console.log('\n✨ API endpoint tests completed!');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run tests
runTests().catch(console.error);
