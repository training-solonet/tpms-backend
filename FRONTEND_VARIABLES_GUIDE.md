# Fleet Management - Frontend Variables & Constants Guide

## 🔧 Environment Variables

### Development Environment
```javascript
// .env.development
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_WS_URL=ws://localhost:3001/ws
REACT_APP_ENV=development
```

### Network/Production Environment
```javascript
// .env.production
REACT_APP_API_BASE_URL=http://192.168.21.14:3001/api
REACT_APP_WS_URL=ws://192.168.21.14:3001/ws
REACT_APP_ENV=production
```

---

## 📊 API Response Status Values

### Truck Status Values
```javascript
const TRUCK_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE', 
  MAINTENANCE: 'MAINTENANCE'
};
```

### Alert Severity Levels
```javascript
const ALERT_SEVERITY = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
};
```

### Alert Types
```javascript
const ALERT_TYPES = {
  TIRE_PRESSURE: 'TIRE_PRESSURE',
  ENGINE: 'ENGINE',
  FUEL: 'FUEL',
  MAINTENANCE: 'MAINTENANCE',
  LOW_FUEL: 'Low Fuel',
  TIRE_PRESSURE_LOW: 'Low Tire Pressure'
};
```

---

## 🔌 WebSocket Message Types

### Client-to-Server Messages
```javascript
const WS_CLIENT_MESSAGES = {
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  GET_TRUCKS: 'get_trucks',
  GET_DASHBOARD: 'get_dashboard',
  GET_TRUCK_DETAILS: 'get_truck_details',
  UPDATE_TRUCK_STATUS: 'update_truck_status',
  RESOLVE_ALERT: 'resolve_alert',
  HEALTH_CHECK: 'health_check',
  PING: 'ping'
};
```

### Server-to-Client Messages
```javascript
const WS_SERVER_MESSAGES = {
  CONNECTION_ACK: 'connection_ack',
  SUBSCRIPTION_ACK: 'subscription_ack',
  TRUCK_LOCATIONS_UPDATE: 'truck_locations_update',
  NEW_ALERTS: 'new_alerts',
  ALERT_RESOLVED: 'alert_resolved',
  DASHBOARD_UPDATE: 'dashboard_update',
  ADMIN_ACTIVITY: 'admin_activity',
  TRUCKS_DATA: 'trucks_data',
  DASHBOARD_DATA: 'dashboard_data',
  TRUCK_DETAILS: 'truck_details',
  TRUCK_STATUS_UPDATED: 'truck_status_updated',
  HEALTH_STATUS: 'health_status',
  PONG: 'pong',
  ERROR: 'error'
};
```

### WebSocket Channels
```javascript
const WS_CHANNELS = {
  TRUCK_UPDATES: 'truck_updates',
  ALERTS: 'alerts',
  DASHBOARD: 'dashboard',
  ADMIN_ACTIVITIES: 'admin_activities'
};
```

---

## 🗺️ GeoJSON Property Names

### Truck Feature Properties
```javascript
const TRUCK_GEOJSON_PROPERTIES = {
  ID: 'id',
  TRUCK_NUMBER: 'truckNumber',
  STATUS: 'status',
  SPEED: 'speed',
  FUEL_PERCENTAGE: 'fuelPercentage',
  HEADING: 'heading',
  DRIVER_NAME: 'driverName'
};
```

### Mining Area Properties
```javascript
const MINING_AREA_PROPERTIES = {
  ZONE_ID: 'zoneId',
  ZONE_NAME: 'zoneName',
  TYPE: 'type',
  STATUS: 'status',
  CAPACITY: 'capacity'
};
```

---

## 📱 API Endpoint Constants

### Authentication Endpoints
```javascript
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh'
};
```

### Truck Endpoints
```javascript
const TRUCK_ENDPOINTS = {
  GET_ALL: '/trucks',
  GET_REALTIME_LOCATIONS: '/trucks/realtime/locations',
  GET_BY_ID: (id) => `/trucks/${id}`,
  GET_TIRES: (id) => `/trucks/${id}/tires`,
  GET_HISTORY: (id) => `/trucks/${id}/history`,
  GET_ALERTS: (id) => `/trucks/${id}/alerts`,
  UPDATE_STATUS: (id) => `/trucks/${id}/status`,
  RESOLVE_ALERT: (id, alertId) => `/trucks/${id}/alerts/${alertId}/resolve`,
  BULK_UPDATE_STATUS: '/trucks/bulk/status'
};
```

### Dashboard Endpoints
```javascript
const DASHBOARD_ENDPOINTS = {
  STATS: '/dashboard/stats',
  FLEET_SUMMARY: '/dashboard/fleet-summary',
  ALERTS: '/dashboard/alerts',
  FUEL: '/dashboard/fuel',
  MAINTENANCE: '/dashboard/maintenance'
};
```

### Mining Area Endpoints
```javascript
const MINING_AREA_ENDPOINTS = {
  GET_ALL: '/mining-area',
  GET_TRUCKS_IN_ZONE: (zoneName) => `/mining-area/${zoneName}/trucks`,
  GET_STATISTICS: '/mining-area/statistics',
  GET_ACTIVITY: '/mining-area/activity',
  CHECK_TRUCK_ZONES: (truckId) => `/mining-area/trucks/${truckId}/zones`,
  GET_NEARBY: '/mining-area/nearby',
  CREATE: '/mining-area',
  UPDATE: (zoneId) => `/mining-area/${zoneId}`,
  DELETE: (zoneId) => `/mining-area/${zoneId}`
};
```

---

## 🎨 UI Constants

### Map Configuration
```javascript
const MAP_CONFIG = {
  DEFAULT_CENTER: [-6.2088, 106.8456],
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 8,
  MAX_ZOOM: 18
};
```

### Refresh Intervals (milliseconds)
```javascript
const REFRESH_INTERVALS = {
  TRUCK_LOCATIONS: 30000,    // 30 seconds
  ALERTS: 15000,             // 15 seconds
  DASHBOARD: 60000,          // 1 minute
  HEALTH_CHECK: 30000        // 30 seconds
};
```

### Pagination Defaults
```javascript
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};
```

---

## 🔐 Authentication Constants

### JWT Token Storage
```javascript
const AUTH_STORAGE = {
  TOKEN_KEY: 'fleet_auth_token',
  USER_KEY: 'fleet_user_data',
  EXPIRES_KEY: 'fleet_token_expires'
};
```

### Default Credentials (Development)
```javascript
const DEFAULT_ADMIN = {
  USERNAME: 'admin',
  PASSWORD: 'admin123'
};
```

---

## 🚨 Error Codes

### HTTP Status Codes
```javascript
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
};
```

### WebSocket Error Codes
```javascript
const WS_ERROR_CODES = {
  INVALID_MESSAGE: 'INVALID_MESSAGE',
  UNKNOWN_MESSAGE_TYPE: 'UNKNOWN_MESSAGE_TYPE',
  MISSING_CHANNEL: 'MISSING_CHANNEL',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED'
};
```

---

## 📋 Example Usage in React

### Environment Variables Hook
```javascript
// hooks/useConfig.js
export const useConfig = () => {
  return {
    apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
    wsUrl: process.env.REACT_APP_WS_URL,
    isDevelopment: process.env.REACT_APP_ENV === 'development'
  };
};
```

### API Service Example
```javascript
// services/apiService.js
import { TRUCK_ENDPOINTS, HTTP_STATUS } from '../constants';

class ApiService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL;
  }

  async getTrucks(filters = {}) {
    const token = localStorage.getItem(AUTH_STORAGE.TOKEN_KEY);
    const response = await fetch(`${this.baseUrl}${TRUCK_ENDPOINTS.GET_ALL}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      // Handle token expiration
      this.handleAuthError();
      return null;
    }

    return response.json();
  }
}
```

### WebSocket Service Example
```javascript
// services/websocketService.js
import { WS_CHANNELS, WS_CLIENT_MESSAGES, WS_SERVER_MESSAGES } from '../constants';

class WebSocketService {
  subscribe(channel) {
    const message = {
      type: WS_CLIENT_MESSAGES.SUBSCRIBE,
      channel: channel,
      requestId: `sub-${Date.now()}`
    };
    
    this.ws.send(JSON.stringify(message));
  }

  handleMessage(message) {
    switch (message.type) {
      case WS_SERVER_MESSAGES.TRUCK_LOCATIONS_UPDATE:
        this.onTruckUpdate(message.data);
        break;
      case WS_SERVER_MESSAGES.NEW_ALERTS:
        this.onNewAlerts(message.data);
        break;
      // ... other cases
    }
  }
}
```

---

## 🔄 Data Transformation Helpers

### Truck Status Display
```javascript
const getTruckStatusDisplay = (status) => {
  const statusMap = {
    [TRUCK_STATUS.ACTIVE]: { label: 'Active', color: 'green' },
    [TRUCK_STATUS.INACTIVE]: { label: 'Inactive', color: 'gray' },
    [TRUCK_STATUS.MAINTENANCE]: { label: 'Maintenance', color: 'orange' }
  };
  return statusMap[status] || { label: 'Unknown', color: 'red' };
};
```

### Alert Severity Display
```javascript
const getAlertSeverityDisplay = (severity) => {
  const severityMap = {
    [ALERT_SEVERITY.HIGH]: { label: 'High', color: 'red', priority: 3 },
    [ALERT_SEVERITY.MEDIUM]: { label: 'Medium', color: 'orange', priority: 2 },
    [ALERT_SEVERITY.LOW]: { label: 'Low', color: 'yellow', priority: 1 }
  };
  return severityMap[severity] || { label: 'Unknown', color: 'gray', priority: 0 };
};
```

---

*Last updated: 2025-08-29 - Consistent with backend implementation v2.0.0*
