# Fleet Management Backend - Frontend Integration Guide

## 🚀 Quick Start for Frontend Developers

### Server Information
- **Backend URL**: `http://localhost:3001` or `http://192.168.21.14:3001`
- **API Base URL**: `http://localhost:3001/api`
- **WebSocket URL**: `ws://localhost:3001/ws`
- **Environment**: Development
- **CORS**: Enabled for all origins (`*`)

---

## 🔐 Authentication

### Login Endpoint
```javascript
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

### Response Format
```javascript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@fleet.com",
      "role": "admin"
    }
  }
}
```

### Using JWT Token
Include the token in all subsequent requests:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## 📡 API Endpoints (All Protected)

### Trucks
```javascript
GET /api/trucks                           // Get all trucks
GET /api/trucks/realtime/locations        // Get real-time locations (GeoJSON)
GET /api/trucks/:id                       // Get specific truck
GET /api/trucks/:id/tires                 // Get truck tire pressures
GET /api/trucks/:id/history               // Get location history
GET /api/trucks/:id/alerts                // Get truck alerts
PUT /api/trucks/:id/status                // Update truck status
PUT /api/trucks/:id/alerts/:alertId/resolve // Resolve alert
PUT /api/trucks/bulk/status               // Bulk update status
```

### Dashboard
```javascript
GET /api/dashboard/stats                  // Basic dashboard statistics
GET /api/dashboard/fleet-summary          // Comprehensive fleet summary
GET /api/dashboard/alerts                 // Alert summary
GET /api/dashboard/fuel                   // Fuel report
GET /api/dashboard/maintenance            // Maintenance report
```

### Mining Areas
```javascript
GET /api/mining-area                      // Get all mining areas (GeoJSON)
GET /api/mining-area/:zoneName/trucks     // Get trucks in zone
GET /api/mining-area/statistics           // Get zone statistics
GET /api/mining-area/activity             // Get zone activity report
POST /api/mining-area                     // Create mining zone
PUT /api/mining-area/:zoneId              // Update mining zone
DELETE /api/mining-area/:zoneId           // Delete mining zone
```

---

## 🔌 WebSocket Real-Time Communication

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  console.log('Connected to Fleet Management WebSocket');
};
```

### Subscription Channels
Available channels:
- `truck_updates` - Real-time truck locations and status
- `alerts` - New alerts and alert updates
- `dashboard` - Dashboard statistics updates
- `admin_activities` - Admin activity monitoring

### Subscribe to Channel
```javascript
const subscribeMessage = {
  type: 'subscribe',
  channel: 'truck_updates',
  requestId: 'unique-request-id'
};

ws.send(JSON.stringify(subscribeMessage));
```

### Message Formats

#### Connection Acknowledgment
```javascript
{
  "type": "connection_ack",
  "data": {
    "clientId": "uuid-client-id",
    "serverTime": "2025-08-29T03:13:15.058Z",
    "availableSubscriptions": ["truck_updates", "alerts", "dashboard"]
  }
}
```

#### Subscription Acknowledgment
```javascript
{
  "type": "subscription_ack",
  "requestId": "unique-request-id",
  "data": {
    "channel": "truck_updates",
    "status": "subscribed"
  }
}
```

#### Real-Time Truck Updates
```javascript
{
  "type": "truck_locations_update",
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "id": 1,
          "truckNumber": "T001",
          "status": "ACTIVE",
          "speed": 45.5,
          "fuelPercentage": 78.2,
          "heading": 180
        },
        "geometry": {
          "type": "Point",
          "coordinates": [106.8456, -6.2088]
        }
      }
    ]
  },
  "timestamp": "2025-08-29T03:13:15.058Z"
}
```

---

## 🛠️ Frontend Implementation Examples

### React/JavaScript Login
```javascript
const login = async (username, password) => {
  try {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return data;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Authenticated API Call
```javascript
const fetchTrucks = async () => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch('http://localhost:3001/api/trucks', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch trucks:', error);
    throw error;
  }
};
```

### WebSocket Integration
```javascript
class FleetWebSocket {
  constructor() {
    this.ws = null;
    this.subscribers = new Map();
  }

  connect() {
    this.ws = new WebSocket('ws://localhost:3001/ws');
    
    this.ws.onopen = () => {
      console.log('✅ Connected to Fleet Management WebSocket');
    };

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('🔌 WebSocket connection closed');
      // Implement reconnection logic here
    };
  }

  subscribe(channel, callback) {
    // Store callback for this channel
    this.subscribers.set(channel, callback);
    
    // Send subscription message
    const message = {
      type: 'subscribe',
      channel: channel,
      requestId: `sub-${Date.now()}`
    };
    
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(message) {
    const { type, data } = message;
    
    switch (type) {
      case 'truck_locations_update':
        const callback = this.subscribers.get('truck_updates');
        if (callback) callback(data);
        break;
      case 'new_alerts':
        const alertCallback = this.subscribers.get('alerts');
        if (alertCallback) alertCallback(data);
        break;
      case 'alert_resolved':
        const resolvedCallback = this.subscribers.get('alerts');
        if (resolvedCallback) resolvedCallback(data);
        break;
      case 'dashboard_update':
        const dashCallback = this.subscribers.get('dashboard');
        if (dashCallback) dashCallback(data);
        break;
      case 'admin_activity':
        const adminCallback = this.subscribers.get('admin_activities');
        if (adminCallback) adminCallback(data);
        break;
      // Handle other message types...
    }
  }
}

// Usage
const fleetWS = new FleetWebSocket();
fleetWS.connect();

fleetWS.subscribe('truck_updates', (truckData) => {
  console.log('Received truck updates:', truckData);
  // Update your map/UI with new truck positions
});
```

---

## 🌐 Network Configuration

### Multi-IP Access
The backend server is configured to accept connections from any IP address:
- **Server binding**: `0.0.0.0:3001`
- **CORS**: Wildcard origin (`*`) enabled
- **Local access**: `http://localhost:3001`
- **Network access**: `http://192.168.21.14:3001` (or your server's IP)

### Environment Variables for Frontend
```javascript
// Development
const API_BASE_URL = 'http://localhost:3001/api';
const WS_URL = 'ws://localhost:3001/ws';

// Network deployment (replace with actual server IP)
const API_BASE_URL = 'http://192.168.21.14:3001/api';
const WS_URL = 'ws://192.168.21.14:3001/ws';
```

---

## 🔍 Testing & Debugging

### Health Check
```javascript
GET /health
// Returns: { status: 'healthy', timestamp: '...' }
```

### API Status
```javascript
GET /api/status
// Returns server status and configuration
```

### Test Credentials
```javascript
{
  "username": "admin",
  "password": "admin123"
}
```

### WebSocket Test
Use browser console or WebSocket testing tools:
```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => ws.send(JSON.stringify({type: 'subscribe', channel: 'truck_updates'}));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

---

## 📊 Data Formats

### Truck Object
```javascript
{
  "id": 1,
  "truckNumber": "T001",
  "status": "ACTIVE",
  "model": "CAT 797F",
  "currentLocation": {
    "latitude": -6.2088,
    "longitude": 106.8456,
    "zone": "Zone A",
    "timestamp": "2025-08-29T03:13:15Z"
  },
  "speed": 45.5,
  "heading": 180,
  "fuelPercentage": 78.2,
  "payloadTons": 25.5,
  "driverName": "John Doe",
  "engineHours": 8500,
  "updatedAt": "2025-08-29T03:13:15Z"
}
```

### Alert Object
```javascript
{
  "id": 1,
  "truckId": 1,
  "alertType": "Low Fuel",
  "severity": "HIGH",
  "message": "Fuel level below 20%",
  "isResolved": false,
  "createdAt": "2025-08-29T03:13:15Z",
  "resolvedAt": null
}
```

### GeoJSON Format (Locations)
```javascript
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": 1,
        "truckNumber": "T001",
        "status": "active",
        "speed": 45.5,
        "fuelPercentage": 78.2
      },
      "geometry": {
        "type": "Point",
        "coordinates": [106.8456, -6.2088]
      }
    }
  ]
}
```

---

## ⚠️ Error Handling

### HTTP Error Responses
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### WebSocket Error Messages
```javascript
{
  "type": "error",
  "requestId": "request-id",
  "error": {
    "code": "MISSING_CHANNEL",
    "message": "Channel is required for subscription"
  }
}
```

---

## 🚀 Ready to Connect!

Your backend is fully operational and ready for frontend integration:

✅ **Authentication**: JWT-based login system  
✅ **API Endpoints**: All protected routes working  
✅ **Real-time Data**: WebSocket broadcasting active  
✅ **Database**: 1000 trucks, 510 alerts ready  
✅ **CORS**: Multi-IP access configured  
✅ **Documentation**: Complete API reference  

**Start developing your frontend with confidence!** 🎯
