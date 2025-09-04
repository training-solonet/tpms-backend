# Fleet Management Backend API Documentation
## Frontend Integration Guide

### 🚀 **Server Information**
- **Base URL**: `http://connectis.my.id:3001/api`
- **WebSocket URL**: `ws://connectis.my.id:3001/ws`
- **Environment**: Development
- **Authentication**: JWT Bearer Token

---

## 🔐 **Authentication**

### Login
**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "b56a47c9-a54c-439a-bcae-20b4d102881a",
      "username": "admin",
      "email": "admin@fleet.com",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

**Usage in Frontend**:
```javascript
// Store token in localStorage or state management
const token = response.data.data.token;
localStorage.setItem('authToken', token);

// Usage in subsequent requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

---

## 🚛 **Truck Management**

### Get All Trucks
**Endpoint**: `GET /api/trucks`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `status` (optional): Filter by status (`active`, `inactive`, `maintenance`)
- `minFuel` (optional): Minimum fuel percentage
- `search` (optional): Search by truck number or plate

**Example Request**:
```javascript
const response = await fetch('http://connectis.my.id:3001/api/trucks?page=1&limit=10&status=active&minFuel=50', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "trucks": [
      {
        "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",
        "truckNumber": "B 1000 TR",
        "plateNumber": "B 7726 AC",
        "model": "Liebherr T 282C",
        "year": 2022,
        "status": "active",
        "fuel": 75.5,
        "location": {
          "latitude": -3.5234,
          "longitude": 115.6123
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total": 1103,
      "total_pages": 111
    },
    "summary": {
      "total_trucks": 1103,
      "active": 882,
      "inactive": 110,
      "maintenance": 111
    }
  }
}
```

### Get Specific Truck
**Endpoint**: `GET /api/trucks/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",
    "truckNumber": "B 1000 TR",
    "plateNumber": "B 7726 AC",
    "vin": "F30G375RVXFK30959",
    "model": "Liebherr T 282C",
    "year": 2022,
    "status": "active",
    "fuel": 75.5,
    "location": {
      "latitude": -3.5234,
      "longitude": 115.6123
    },
    "tirePressures": [
      {
        "position": "Tire 1",
        "pressure": 1014.476,
        "status": "normal",
        "temperature": 66.97988
      }
    ],
    "alerts": [
      {
        "type": "HIGH_TEMP",
        "severity": 5,
        "message": "High temperature detected",
        "occurredAt": "2025-09-04T03:30:50.342Z"
      }
    ]
  }
}
```

### Get Truck Tire Pressures
**Endpoint**: `GET /api/trucks/:id/tires`

**Response**:
```json
{
  "success": true,
  "data": {
    "truckId": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",
    "truckNumber": "B 1000 TR",
    "tirePressures": [
      {
        "position": "Tire 1",
        "tireNumber": 1,
        "pressure": 1014.476,
        "status": "normal",
        "temperature": 66.97988,
        "lastUpdated": "2025-09-04T03:05:08.221Z"
      }
    ],
    "lastUpdated": "2025-09-04T08:14:31.211Z"
  }
}
```

### Update Truck Status
**Endpoint**: `PUT /api/trucks/:id/status`

**Request Body**:
```json
{
  "status": "maintenance"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",
    "truckNumber": "B 1000 TR",
    "status": "maintenance",
    "updatedAt": "2025-09-04T10:48:35.000Z"
  }
}
```

---

## 📍 **Real-time Location & Mapping**

### Get Real-time Truck Locations (GeoJSON)
**Endpoint**: `GET /api/trucks/realtime/locations`

**Response**:
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [115.6123, -3.5234]
        },
        "properties": {
          "truckId": "1ed43a13-83a2-492b-8ef4-ddad12fb5cb5",
          "truckNumber": "B 1000 TR",
          "status": "active",
          "fuel": 75.5,
          "speed": 45.2,
          "lastUpdate": "2025-09-04T10:48:35.000Z"
        }
      }
    ]
  },
  "message": "Retrieved 1103 truck locations"
}
```

**Usage with Leaflet/MapBox**:
```javascript
// Add GeoJSON to map
map.addSource('trucks', {
  type: 'geojson',
  data: response.data.data
});

map.addLayer({
  id: 'truck-points',
  type: 'circle',
  source: 'trucks',
  paint: {
    'circle-radius': 8,
    'circle-color': [
      'case',
      ['==', ['get', 'status'], 'active'], '#22c55e',
      ['==', ['get', 'status'], 'maintenance'], '#f59e0b',
      '#ef4444'
    ]
  }
});
```

### Get Mining Area Boundaries
**Endpoint**: `GET /api/mining-area`

**Response**:
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": {
          "Name": "PT INDOBARA Main Mining Area",
          "description": "Main extraction zone",
          "zone_type": "extraction"
        },
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[115.604399949931505, -3.545400075547209]]]
        }
      }
    ]
  },
  "message": "Retrieved 5 mining areas"
}
```

---

## 📊 **Dashboard & Analytics**

### Get Dashboard Statistics
**Endpoint**: `GET /api/dashboard/stats`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalTrucks": 1103,
    "activeTrucks": 882,
    "inactiveTrucks": 110,
    "maintenanceTrucks": 111,
    "averageFuel": 52.7,
    "totalPayload": 0,
    "alertsCount": 1256,
    "lowTirePressureCount": 45,
    "metadata": {
      "dataFreshness": "real-time",
      "lastUpdated": "2025-09-04T10:48:35.082Z",
      "cacheStatus": "live"
    }
  }
}
```

**Frontend Dashboard Cards**:
```javascript
const DashboardCard = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>
    <div className="flex items-center">
      <div className={`text-${color}-500 text-2xl mr-4`}>{icon}</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className={`text-2xl font-bold text-${color}-600`}>{value}</p>
      </div>
    </div>
  </div>
);

// Usage
<DashboardCard title="Total Trucks" value={stats.totalTrucks} icon="🚛" color="blue" />
<DashboardCard title="Active Trucks" value={stats.activeTrucks} icon="✅" color="green" />
<DashboardCard title="Alerts" value={stats.alertsCount} icon="🚨" color="red" />
```

---

## 📡 **WebSocket Real-time Integration**

### Connection Setup
```javascript
class FleetWebSocket {
  constructor(token) {
    this.ws = new WebSocket('ws://connectis.my.id:3001/ws');
    this.token = token;
    this.subscriptions = new Set();
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
      // Authenticate if needed
      this.send({
        type: 'auth',
        data: { token: this.token }
      });
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Implement reconnection logic
      setTimeout(() => this.reconnect(), 5000);
    };
  }
  
  send(message) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  subscribe(channel) {
    this.subscriptions.add(channel);
    this.send({
      type: 'subscribe',
      data: { channel },
      requestId: `sub-${Date.now()}`
    });
  }
  
  handleMessage(message) {
    switch (message.type) {
      case 'truck_locations_update':
        this.onTruckLocationsUpdate(message.data);
        break;
      case 'alert_update':
        this.onAlertUpdate(message.data);
        break;
      case 'dashboard_update':
        this.onDashboardUpdate(message.data);
        break;
    }
  }
}
```

### Available Channels
- `truck_updates`: Real-time truck location and status updates
- `alerts`: New alerts and alert status changes
- `dashboard`: Dashboard statistics updates

### Usage Example
```javascript
const fleetWS = new FleetWebSocket(authToken);

// Subscribe to truck updates
fleetWS.subscribe('truck_updates');
fleetWS.onTruckLocationsUpdate = (data) => {
  // Update map with new truck positions
  updateTruckMarkers(data);
};

// Subscribe to alerts
fleetWS.subscribe('alerts');
fleetWS.onAlertUpdate = (alert) => {
  // Show notification
  showNotification(alert);
  // Update alerts list
  updateAlertsList(alert);
};

// Subscribe to dashboard updates
fleetWS.subscribe('dashboard');
fleetWS.onDashboardUpdate = (stats) => {
  // Update dashboard cards
  updateDashboardStats(stats);
};
```

---

## 🛠 **Error Handling**

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

### Frontend Error Handling
```javascript
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`http://connectis.my.id:3001/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      // Redirect to login
      redirectToLogin();
    }
    
    throw error;
  }
};
```

---

## 🔧 **Development Tools**

### API Testing
```bash
# Run comprehensive API tests
npm run test:api

# Test specific endpoints
node scripts/test-api.js
```

### Database Inspection
```bash
# Open Prisma Studio
npx prisma studio
```

### Logs
- **Server logs**: Console output
- **Admin logs**: `log/admin-activity.log`
- **Error logs**: Console error output

---

## 📱 **Frontend Integration Examples**

### React Hook for Truck Data
```javascript
import { useState, useEffect } from 'react';

export const useTrucks = (filters = {}) => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchTrucks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(filters).toString();
        const response = await apiCall(`/trucks?${queryParams}`);
        setTrucks(response.data.trucks);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTrucks();
  }, [filters]);
  
  return { trucks, loading, error };
};
```

### Vue.js Composition API
```javascript
import { ref, onMounted } from 'vue';

export function useDashboard() {
  const stats = ref({});
  const loading = ref(true);
  
  const fetchStats = async () => {
    try {
      const response = await apiCall('/dashboard/stats');
      stats.value = response.data;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(fetchStats);
  
  return { stats, loading, fetchStats };
}
```

---

## 🚀 **Performance Recommendations**

### Pagination
- Use pagination for large datasets (`page` and `limit` parameters)
- Default limit is 50, maximum recommended is 100

### Caching
- Dashboard stats are real-time but can be cached for 30 seconds
- Truck locations update every second via WebSocket
- Mining areas are static and can be cached indefinitely

### WebSocket Optimization
- Subscribe only to needed channels
- Implement connection pooling for multiple tabs
- Use heartbeat/ping to maintain connection

---

## 📋 **Quick Start Checklist**

- [ ] Set up authentication and store JWT token
- [ ] Implement error handling for API calls
- [ ] Connect to WebSocket for real-time updates
- [ ] Create truck listing with pagination
- [ ] Add map integration with GeoJSON data
- [ ] Implement dashboard with statistics
- [ ] Add real-time notifications for alerts
- [ ] Test all endpoints with provided examples

---

**Backend Server**: `http://connectis.my.id:3001`  
**API Documentation**: This file  
**WebSocket**: `ws://connectis.my.id:3001/ws`  
**Test Coverage**: 13/13 endpoints passing ✅
