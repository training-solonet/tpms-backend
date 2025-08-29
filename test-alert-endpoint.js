const axios = require('axios');

async function testAlertEndpoint() {
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test alert summary endpoint
    console.log('📊 Testing alert summary endpoint...');
    const response = await axios.get('http://localhost:3001/api/dashboard/alerts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Alert summary successful');
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error details:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Message:', error.message);
    }
  }
}

testAlertEndpoint();
