# Fleet Management REST API Documentation

## Overview
Fleet Management System REST API provides comprehensive endpoints for managing mining truck operations, real-time tracking, alerts, and dashboard analytics.

**Base URL**: `http://localhost:3001/api`  
**WebSocket URL**: `ws://localhost:3001/ws`  
**Version**: 2.0.0  
**Environment**: Development

---

## Authentication

### Login
**POST** `/api/auth/login`

Authenticate admin user and receive JWT token.

#### Request Body
```json
{
  "username": "admin",
  "password": "admin123"
}
```

#### Response (Success)
```json
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

#### Response (Error)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### Logout
**POST** `/api/auth/logout`

Logout current session.

#### Response
```json
{
  "success": true,
  "message": "Logout successful"
}
```

### Token Refresh
**POST** `/api/auth/refresh`

Refresh JWT token (not implemented yet).

#### Response
```json
{
  "success": false,
  "message": "Token refresh not implemented yet"
}
```

---

## Trucks Management

### Get All Trucks
**GET** `/api/trucks`

Retrieve all trucks with optional filtering.

#### Query Parameters
- `status` (optional): Filter by truck status (`ACTIVE`, `INACTIVE`, `MAINTENANCE`)
- `zone` (optional): Filter by mining zone
- `limit` (optional): Limit number of results
- `offset` (optional): Pagination offset

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "truckNumber": "T001",
      "status": "ACTIVE",
      "model": "CAT 797F",
      "currentLocation": {
        "latitude": -6.2088,
        "longitude": 106.8456,
        "zone": "Zone A"
      },
      "alerts": [
        {
          "id": 1,
          "type": "TIRE_PRESSURE",
          "severity": "HIGH",
          "message": "Low tire pressure detected"
        }
      ]
    }
  ]
}
```

### Get Real-time Truck Locations
**GET** `/api/trucks/realtime/locations`

Get current locations of all trucks in GeoJSON format.

#### Response
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
          "coordinates": [106.8456, -6.2088]
        },
        "properties": {
          "truckId": 1,
          "truckNumber": "T001",
          "status": "ACTIVE",
          "speed": 25.5,
          "heading": 180
        }
      }
    ]
  }
}
```

### Get Truck Details
**GET** `/api/trucks/:id`

Get detailed information about a specific truck.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "truckNumber": "T001",
    "status": "ACTIVE",
    "model": "CAT 797F",
    "currentLocation": {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "zone": "Zone A",
      "timestamp": "2025-08-29T02:11:50.000Z"
    },
    "alerts": [],
    "maintenanceRecords": [
      {
        "id": 1,
        "type": "ROUTINE",
        "scheduledDate": "2025-08-30T00:00:00.000Z",
        "status": "SCHEDULED"
      }
    ]
  }
}
```

### Get Truck Tire Pressures
**GET** `/api/trucks/:id/tires`

Get current tire pressure readings for a truck.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "position": "FRONT_LEFT",
      "pressure": 85.5,
      "temperature": 45.2,
      "status": "NORMAL",
      "lastUpdated": "2025-08-29T02:11:50.000Z"
    }
  ]
}
```

### Get Truck Location History
**GET** `/api/trucks/:id/history`

Get location history for a truck.

#### Query Parameters
- `startDate`: Start date (ISO format)
- `endDate`: End date (ISO format)
- `limit`: Maximum number of records

#### Response
```json
{
  "success": true,
  "data": [
    {
      "latitude": -6.2088,
      "longitude": 106.8456,
      "speed": 25.5,
      "heading": 180,
      "timestamp": "2025-08-29T02:11:50.000Z"
    }
  ]
}
```

### Get Truck Alerts
**GET** `/api/trucks/:id/alerts`

Get all alerts for a specific truck.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "TIRE_PRESSURE",
      "severity": "HIGH",
      "message": "Low tire pressure detected on front left tire",
      "isResolved": false,
      "createdAt": "2025-08-29T02:11:50.000Z"
    }
  ]
}
```

### Update Truck Status
**PUT** `/api/trucks/:id/status`

Update the operational status of a truck.

#### Request Body
```json
{
  "status": "MAINTENANCE"
}
```

#### Response
```json
{
  "success": true,
  "message": "Truck status updated successfully",
  "data": {
    "id": 1,
    "truckNumber": "T001",
    "status": "MAINTENANCE"
  }
}
```

### Resolve Truck Alert
**PUT** `/api/trucks/:id/alerts/:alertId/resolve`

Mark a truck alert as resolved.

#### Response
```json
{
  "success": true,
  "message": "Alert resolved successfully",
  "data": {
    "id": 1,
    "isResolved": true,
    "resolvedAt": "2025-08-29T02:11:50.000Z"
  }
}
```

### Bulk Update Truck Status
**PUT** `/api/trucks/bulk/status`

Update status for multiple trucks at once.

#### Request Body
```json
{
  "truckIds": [1, 2, 3],
  "status": "ACTIVE"
}
```

#### Response
```json
{
  "success": true,
  "message": "Bulk status update completed",
  "data": {
    "updated": 3,
    "failed": 0
  }
}
```

---

## Dashboard Analytics

### Get Dashboard Statistics
**GET** `/api/dashboard/stats`

Get basic dashboard statistics.

#### Response
```json
{
  "success": true,
  "data": {
    "fleet": {
      "total": 1000,
      "active": 850,
      "inactive": 100,
      "maintenance": 50
    },
    "alerts": {
      "total": 25,
      "high": 5,
      "medium": 15,
      "low": 5
    },
    "zones": {
      "total": 8,
      "active": 6
    }
  }
}
```

### Get Fleet Summary
**GET** `/api/dashboard/fleet-summary`

Get comprehensive fleet operational summary.

#### Response
```json
{
  "success": true,
  "data": {
    "operational": {
      "activeFleet": 850,
      "utilizationRate": 85.0,
      "averageSpeed": 28.5
    },
    "performance": {
      "totalDistance": 125000.5,
      "fuelConsumption": 45000.2,
      "efficiency": 2.78
    },
    "maintenance": {
      "scheduled": 15,
      "overdue": 3,
      "completed": 42
    }
  }
}
```

### Get Alert Summary
**GET** `/api/dashboard/alerts`

Get alert summary and trends.

#### Response
```json
{
  "success": true,
  "data": {
    "current": {
      "total": 25,
      "byType": {
        "TIRE_PRESSURE": 8,
        "ENGINE": 5,
        "FUEL": 7,
        "MAINTENANCE": 5
      }
    },
    "trends": {
      "last24h": 12,
      "last7days": 85,
      "resolved": 156
    }
  }
}
```

### Get Fuel Report
**GET** `/api/dashboard/fuel`

Get fuel consumption and efficiency report.

#### Response
```json
{
  "success": true,
  "data": {
    "consumption": {
      "total": 45000.2,
      "average": 45.0,
      "efficiency": 2.78
    },
    "trends": {
      "daily": [
        {
          "date": "2025-08-29",
          "consumption": 1850.5
        }
      ]
    }
  }
}
```

### Get Maintenance Report
**GET** `/api/dashboard/maintenance`

Get maintenance schedule and history report.

#### Response
```json
{
  "success": true,
  "data": {
    "scheduled": {
      "today": 5,
      "thisWeek": 15,
      "overdue": 3
    },
    "completed": {
      "thisMonth": 42,
      "lastMonth": 38
    },
    "costs": {
      "thisMonth": 125000.0,
      "average": 2500.0
    }
  }
}
```

---

## Mining Areas

### Get Mining Areas
**GET** `/api/mining-area`

Get all mining areas in GeoJSON format.

#### Response
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [[[106.8456, -6.2088], [106.8500, -6.2088], [106.8500, -6.2050], [106.8456, -6.2050], [106.8456, -6.2088]]]
        },
        "properties": {
          "zoneId": 1,
          "zoneName": "Zone A",
          "type": "MINING",
          "status": "ACTIVE"
        }
      }
    ]
  }
}
```

### Get Trucks in Zone
**GET** `/api/mining-area/:zoneName/trucks`

Get all trucks currently in a specific mining zone.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "truckNumber": "T001",
      "status": "ACTIVE",
      "entryTime": "2025-08-29T01:30:00.000Z",
      "currentLocation": {
        "latitude": -6.2088,
        "longitude": 106.8456
      }
    }
  ]
}
```

### Get Zone Statistics
**GET** `/api/mining-area/statistics`

Get operational statistics for all mining zones.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "zoneName": "Zone A",
      "trucksCount": 25,
      "averageTime": 45.5,
      "productivity": 85.2,
      "status": "ACTIVE"
    }
  ]
}
```

### Get Zone Activity Report
**GET** `/api/mining-area/activity`

Get activity report for mining zones.

#### Query Parameters
- `startDate`: Start date for report
- `endDate`: End date for report
- `zoneId`: Specific zone ID (optional)

#### Response
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalVisits": 156,
      "averageDuration": 42.5,
      "peakHours": "10:00-14:00"
    },
    "zones": [
      {
        "zoneName": "Zone A",
        "visits": 45,
        "duration": 38.2,
        "efficiency": 88.5
      }
    ]
  }
}
```

### Check Truck in Zones
**GET** `/api/mining-area/trucks/:truckId/zones`

Check which zones a specific truck is currently in.

#### Response
```json
{
  "success": true,
  "data": [
    {
      "zoneId": 1,
      "zoneName": "Zone A",
      "entryTime": "2025-08-29T01:30:00.000Z",
      "type": "MINING"
    }
  ]
}
```

### Get Nearby Trucks
**GET** `/api/mining-area/nearby`

Get trucks near a specific location.

#### Query Parameters
- `latitude`: Latitude coordinate
- `longitude`: Longitude coordinate
- `radius`: Search radius in meters (default: 1000)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "truckNumber": "T001",
      "distance": 250.5,
      "bearing": 45.2,
      "status": "ACTIVE"
    }
  ]
}
```

### Create Mining Zone
**POST** `/api/mining-area`

Create a new mining zone.

#### Request Body
```json
{
  "zoneName": "Zone F",
  "type": "MINING",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[106.8456, -6.2088], [106.8500, -6.2088], [106.8500, -6.2050], [106.8456, -6.2050], [106.8456, -6.2088]]]
  },
  "properties": {
    "capacity": 50,
    "priority": "HIGH"
  }
}
```

### Update Mining Zone
**PUT** `/api/mining-area/:zoneId`

Update an existing mining zone.

### Delete Mining Zone
**DELETE** `/api/mining-area/:zoneId`

Delete or deactivate a mining zone.

---

## WebSocket API

### Connection
Connect to WebSocket server for real-time updates.

**URL**: `ws://localhost:3001/ws`

### Message Format
All WebSocket messages use JSON format:

```json
{
  "type": "message_type",
  "data": {},
  "requestId": "unique_id",
  "timestamp": "2025-08-29T02:11:50.000Z"
}
```

### Subscription Channels
- `truck_updates`: Real-time truck location and status updates
- `alerts`: New alerts and alert resolutions
- `dashboard`: Dashboard statistics updates
- `admin_activities`: Admin login and activity monitoring

### Subscribe to Channel
```json
{
  "type": "subscribe",
  "channel": "truck_updates",
  "requestId": "unique-request-id"
}
```

### Real-time Updates
#### Truck Location Update
```json
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
          "speed": 25.5,
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
  "timestamp": "2025-08-29T02:11:50.000Z"
}
```

#### New Alerts
```json
{
  "type": "new_alerts",
  "data": [
    {
      "id": 1,
      "type": "TIRE_PRESSURE",
      "severity": "HIGH",
      "message": "Low tire pressure detected",
      "truckNumber": "T001",
      "createdAt": "2025-08-29T02:11:50.000Z"
    }
  ],
  "timestamp": "2025-08-29T02:11:50.000Z"
}
```

#### Admin Activity
```json
{
  "type": "admin_activity",
  "data": {
    "type": "admin_login",
    "action": "ADMIN_LOGIN_SUCCESS",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    },
    "details": {
      "ip": "192.168.1.100",
      "loginTime": "2025-08-29T02:11:50.000Z"
    }
  },
  "timestamp": "2025-08-29T02:11:50.000Z"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": "Additional error information"
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `TOKEN_EXPIRED` - JWT token expired
- `VALIDATION_ERROR` - Request validation failed
- `RESOURCE_NOT_FOUND` - Requested resource not found
- `DATABASE_ERROR` - Database operation failed

---

## Rate Limiting
- **Authentication**: 5 requests per minute per IP
- **General API**: 100 requests per minute per IP
- **WebSocket**: 1000 messages per minute per connection

---

## Testing

### Health Check
**GET** `/health`

Check if the server is running.

#### Response
```json
{
  "success": true,
  "message": "Fleet Management Server is running",
  "timestamp": "2025-08-29T02:11:50.000Z",
  "server_ip": "127.0.0.1",
  "client_ip": "127.0.0.1"
}
```

### Test Admin Login
Use the provided test script:
```bash
node test-admin-login.js
```

---

## Development Notes

### Real-time Logging
All admin activities are logged in real-time to:
- Terminal console (development mode)
- Log file: `log/admin-activity.log`
- WebSocket broadcasts to subscribed clients

### Database
- **Engine**: PostgreSQL with Prisma ORM
- **Connection Pool**: 5 connections
- **Auto-optimization**: Enabled in development

### Security
- CORS enabled for all origins (development)
- Helmet.js security headers
- JWT authentication for protected routes
- Request logging and monitoring

---

*Last updated: August 29, 2025*
*API Version: 2.0.0*
