const WebSocket = require('ws');

async function testWebSocketConnection() {
  try {
    console.log('🔌 Testing WebSocket connection...');
    
    const ws = new WebSocket('ws://localhost:3001/ws');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully');
      
      // Test subscription
      const subscribeMessage = {
        type: 'subscribe',
        channel: 'truck_updates',
        requestId: 'test-123'
      };
      
      ws.send(JSON.stringify(subscribeMessage));
      console.log('📡 Sent subscription message:', subscribeMessage);
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('📨 Received message:', message);
      } catch (error) {
        console.log('📨 Received raw message:', data.toString());
      }
    });
    
    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });
    
    ws.on('close', (code, reason) => {
      console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
    });
    
    // Keep connection alive for 10 seconds
    setTimeout(() => {
      console.log('⏰ Closing WebSocket connection...');
      ws.close();
    }, 10000);
    
  } catch (error) {
    console.error('❌ WebSocket test failed:', error.message);
  }
}

testWebSocketConnection();
