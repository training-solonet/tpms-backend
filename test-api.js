const axios = require('axios');
const WebSocket = require('ws');

// ==========================================
// API TESTING SCRIPT FOR FLEET MANAGEMENT
// ==========================================

const BASE_URL = 'http://localhost:3001';
const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

// Test data
const testSensorData = {
  tpdata: {
    sn: "3462682374",
    cmd: "tpdata",
    data: {
      tireNo: 1,
      tiprValue: 248.5,
      tempValue: 38.2,
      bat: 85,
      simNumber: "1234567890",
      exType: "normal"
    }
  },
  device: {
    sn: "3462682374", 
    cmd: "device",
    data: {
      lng: 115.604399,
      lat: -3.545400,
      bat1: 90,
      bat2: 85,
      bat3: 80,
      lock: 0,
      simNumber: "1234567890"
    }
  }
};

// ==========================================
// TEST FUNCTIONS
// ==========================================

async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🔐 Testing Authentication...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    if (response.data.success) {
      console.log('✅ Login successful');
      console.log('👤 User:', response.data.data.user.username);
      return response.data.data.token;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testSensorIngestion(token) {
  console.log('\n📡 Testing Sensor Data Ingestion...');
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  // Test tire pressure data
  try {
    const tpResponse = await axios.post(`${API_BASE_URL}/sensors/tpdata`, testSensorData.tpdata, { headers });
    console.log('✅ Tire pressure data ingested:', tpResponse.data.message);
  } catch (error) {
    console.log('❌ Tire pressure ingestion failed:', error.response?.data?.message || error.message);
  }
  
  // Test GPS/device data
  try {
    const deviceResponse = await axios.post(`${API_BASE_URL}/sensors/device`, testSensorData.device, { headers });
    console.log('✅ GPS/device data ingested:', deviceResponse.data.message);
  } catch (error) {
    console.log('❌ GPS/device ingestion failed:', error.response?.data?.message || error.message);
  }
}

async function testTruckEndpoints(token) {
  console.log('\n🚛 Testing Truck Endpoints...');
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_BASE_URL}/trucks`, { headers });
    console.log('✅ Trucks endpoint accessible');
    console.log(`📊 Found ${response.data.data?.trucks?.length || 0} trucks`);
  } catch (error) {
    console.log('❌ Trucks endpoint failed:', error.response?.data?.message || error.message);
  }
  
  // Test real-time locations
  try {
    const locResponse = await axios.get(`${API_BASE_URL}/trucks/realtime/locations`, { headers });
    console.log('✅ Real-time locations endpoint accessible');
    console.log(`📍 Found ${locResponse.data.data?.features?.length || 0} truck locations`);
  } catch (error) {
    console.log('❌ Real-time locations failed:', error.response?.data?.message || error.message);
  }
}

async function testQueueStats(token) {
  console.log('\n⚡ Testing Queue Statistics...');
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_BASE_URL}/sensors/queue/stats`, { headers });
    console.log('✅ Queue stats accessible');
    console.log('📊 Queue stats:', {
      pending: response.data.data?.queue?.pendingItems || 0,
      processed: response.data.data?.queue?.processedItems || 0
    });
  } catch (error) {
    console.log('❌ Queue stats failed:', error.response?.data?.message || error.message);
  }
}

function testWebSocket() {
  console.log('\n🔌 Testing WebSocket Connection...');
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let connected = false;
    
    const timeout = setTimeout(() => {
      if (!connected) {
        console.log('❌ WebSocket connection timeout');
        ws.close();
        resolve(false);
      }
    }, 5000);
    
    ws.on('open', () => {
      connected = true;
      clearTimeout(timeout);
      console.log('✅ WebSocket connected successfully');
      
      // Subscribe to truck updates
      ws.send(JSON.stringify({
        type: 'subscribe',
        channel: 'truck_updates'
      }));
      
      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 2000);
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      console.log('📨 WebSocket message:', message.type);
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      resolve(false);
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
  });
}

async function testMiningArea(token) {
  console.log('\n🏭 Testing Mining Area Endpoint...');
  
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  
  try {
    const response = await axios.get(`${API_BASE_URL}/mining-area`, { headers });
    console.log('✅ Mining area data accessible');
    console.log(`📍 Found ${response.data.data?.features?.length || 0} mining zones`);
  } catch (error) {
    console.log('❌ Mining area failed:', error.response?.data?.message || error.message);
  }
}

// ==========================================
// MAIN TEST RUNNER
// ==========================================

async function runAllTests() {
  console.log('🚀 ================================');
  console.log('🧪 Fleet Management API Tests');
  console.log('🚀 ================================');
  
  // Test basic connectivity
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    console.log('\n❌ Server not responding. Make sure the server is running on port 3001');
    return;
  }
  
  // Test authentication
  const token = await testLogin();
  
  // Test mining area (with auth)
  await testMiningArea(token);
  
  // Test sensor ingestion
  await testSensorIngestion(token);
  
  // Test truck endpoints
  await testTruckEndpoints(token);
  
  // Test queue stats
  await testQueueStats(token);
  
  // Test WebSocket
  await testWebSocket();
  
  console.log('\n🏁 ================================');
  console.log('✅ API Testing Complete');
  console.log('🏁 ================================');
}

// ==========================================
// PERFORMANCE TEST
// ==========================================

async function performanceTest() {
  console.log('\n⚡ Running Performance Test...');
  
  const startTime = Date.now();
  const promises = [];
  
  // Send 10 concurrent sensor data requests
  for (let i = 0; i < 10; i++) {
    const sensorData = {
      ...testSensorData.device,
      sn: `device_${i}`,
      data: {
        ...testSensorData.device.data,
        lng: 115.604399 + (Math.random() * 0.01),
        lat: -3.545400 + (Math.random() * 0.01)
      }
    };
    
    promises.push(
      axios.post(`${API_BASE_URL}/sensors/device`, sensorData)
        .catch(error => ({ error: error.message }))
    );
  }
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  const successful = results.filter(r => !r.error).length;
  const failed = results.filter(r => r.error).length;
  
  console.log(`⚡ Performance Test Results:`);
  console.log(`   • Total requests: 10`);
  console.log(`   • Successful: ${successful}`);
  console.log(`   • Failed: ${failed}`);
  console.log(`   • Total time: ${endTime - startTime}ms`);
  console.log(`   • Average: ${Math.round((endTime - startTime) / 10)}ms per request`);
}

// ==========================================
// RUN TESTS
// ==========================================

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--performance')) {
    performanceTest();
  } else {
    runAllTests();
  }
}

module.exports = {
  runAllTests,
  performanceTest,
  testHealthCheck,
  testLogin,
  testSensorIngestion,
  testWebSocket
};
