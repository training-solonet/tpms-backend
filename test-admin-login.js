const axios = require('axios');

// Test admin login to verify real-time logging
async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login real-time logging...');
    
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0 (Admin-Login-Test)'
      }
    });

    if (response.data.success) {
      console.log('✅ Admin login successful!');
      console.log('👤 User:', response.data.data.user.username);
      console.log('🔑 Role:', response.data.data.user.role);
      console.log('📝 Check your terminal for real-time admin activity logs');
    } else {
      console.log('❌ Login failed:', response.data.message);
    }

  } catch (error) {
    if (error.response) {
      console.log('❌ Login error:', error.response.data.message);
    } else {
      console.log('❌ Network error:', error.message);
      console.log('💡 Make sure your server is running on port 3001');
    }
  }
}

// Test failed login attempt
async function testFailedLogin() {
  try {
    console.log('\n🧪 Testing failed login attempt logging...');
    
    await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'wrongpassword'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0 (Failed-Login-Test)'
      }
    });

  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Failed login attempt logged successfully');
      console.log('📝 Check your terminal for security event logs');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Admin Login Real-time Logging Tests');
  console.log('=' .repeat(50));
  
  await testAdminLogin();
  
  // Wait a moment before testing failed login
  setTimeout(async () => {
    await testFailedLogin();
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Tests completed! Check your server terminal for:');
    console.log('   • 🔐 [ADMIN] Admin Activity: ADMIN_LOGIN_SUCCESS');
    console.log('   • 🔐 [ADMIN] Security Event: FAILED_LOGIN_ATTEMPT');
    console.log('   • 📡 WebSocket broadcasts for admin activities');
  }, 2000);
}

runTests();
