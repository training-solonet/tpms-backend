# Fleet Management System - Complete Code Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Server & WebSocket Implementation](#server--websocket-implementation)
3. [Route Handlers](#route-handlers)
4. [Controllers](#controllers)
5. [Middleware](#middleware)
6. [Services](#services)
7. [Database Models](#database-models)
8. [Utilities](#utilities)
9. [Configuration Files](#configuration-files)

---

## System Architecture

### Overview
Fleet Management System adalah aplikasi backend Node.js yang menggunakan:
- **Express.js** - Web framework untuk REST API
- **Native WebSocket** - Real-time communication
- **Prisma ORM** - Database management
- **PostgreSQL + PostGIS** - Database dengan spatial data support
- **JWT** - Authentication system

### Project Structure
```
src/
├── controllers/        # Business logic handlers
├── middleware/        # Authentication & logging middleware
├── models/           # Database models (Prisma-based)
├── routes/           # API route definitions
├── services/         # Core services (database, websocket)
├── utils/           # Helper functions & utilities
└── app.js           # Express app configuration
```

---

## Server & WebSocket Implementation

### File: `server.js`
**Fungsi Utama:** Server utama yang menggabungkan HTTP API dan WebSocket server

#### Class: `WebSocketServer`
```javascript
class WebSocketServer {
  constructor() {
    this.clients = new Map();           // Menyimpan semua client yang terhubung
    this.subscriptions = {              // Mengelola subscription channels
      truckUpdates: new Set(),
      alerts: new Set(),
      dashboard: new Set()
    };
    this.isReady = false;              // Status database connection
  }
}
```

**Fungsi-fungsi Utama:**

#### `initialize()`
- **Tujuan:** Inisialisasi server HTTP dan WebSocket
- **Proses:**
  1. Menginisialisasi koneksi database
  2. Membuat HTTP server dengan Express app
  3. Membuat WebSocket server di path `/ws`
  4. Setup event handlers untuk WebSocket
  5. Memulai real-time broadcasting

#### `initializeDatabase()`
- **Tujuan:** Setup dan optimasi koneksi database
- **Proses:**
  1. Connect ke Prisma database
  2. Health check database
  3. Optimasi database performance
  4. Error handling untuk production

#### `setupWebSocketHandlers()`
- **Tujuan:** Setup event handlers untuk WebSocket connections
- **Events yang dihandle:**
  - `connection` - Client baru terhubung
  - `message` - Pesan dari client
  - `close` - Client disconnect
  - `error` - Error handling
  - `pong` - Health check response

#### `handleMessage(clientId, message)`
- **Tujuan:** Memproses pesan dari WebSocket clients
- **Message Types:**
  - `ping` - Health check
  - `subscribe` - Subscribe ke channel
  - `unsubscribe` - Unsubscribe dari channel
  - `get_trucks` - Request truck data
  - `get_dashboard` - Request dashboard data
  - `update_truck_status` - Update status truck
  - `resolve_alert` - Resolve alert

#### `startRealtimeBroadcast()`
- **Tujuan:** Memulai broadcasting data real-time
- **Intervals:**
  - Truck locations: setiap 30 detik
  - Alerts: setiap 15 detik
  - Dashboard: setiap 60 detik
  - Health check: setiap 30 detik

---

## Route Handlers

### File: `src/routes/index.js`
**Fungsi:** Router utama yang menggabungkan semua route modules

```javascript
router.use('/auth', authRoutes);           // Authentication routes
router.use('/trucks', truckRoutes);        // Truck management routes  
router.use('/dashboard', dashboardRoutes); // Dashboard & analytics routes
router.use('/mining-area', miningAreaRoutes); // Mining zone routes
```

### File: `src/routes/auth.js`
**Fungsi:** Route handlers untuk authentication

#### Routes:
- `POST /api/auth/login` - User login dengan JWT token
- `POST /api/auth/refresh` - Token refresh (belum diimplementasi)
- `POST /api/auth/logout` - User logout

### File: `src/routes/trucks.js`
**Fungsi:** Route handlers untuk truck management

#### Routes:
- `GET /api/trucks` - Get semua trucks dengan filtering
- `GET /api/trucks/realtime/locations` - Get lokasi real-time (GeoJSON)
- `GET /api/trucks/:id` - Get detail truck spesifik
- `GET /api/trucks/:id/tires` - Get data tekanan ban
- `GET /api/trucks/:id/history` - Get riwayat lokasi truck
- `GET /api/trucks/:id/alerts` - Get alerts truck
- `PUT /api/trucks/:id/status` - Update status truck
- `PUT /api/trucks/:id/alerts/:alertId/resolve` - Resolve alert
- `PUT /api/trucks/bulk/status` - Bulk update status trucks

### File: `src/routes/dashboard.js`
**Fungsi:** Route handlers untuk dashboard analytics

#### Routes:
- `GET /api/dashboard/stats` - Statistik dasar dashboard
- `GET /api/dashboard/fleet-summary` - Summary lengkap fleet
- `GET /api/dashboard/alerts` - Summary alerts
- `GET /api/dashboard/fuel` - Laporan bahan bakar
- `GET /api/dashboard/maintenance` - Laporan maintenance

### File: `src/routes/miningarea.js`
**Fungsi:** Route handlers untuk mining zone management

#### Routes:
- `GET /api/mining-area` - Get semua mining areas (GeoJSON)
- `GET /api/mining-area/:zoneName/trucks` - Get trucks dalam zone
- `GET /api/mining-area/statistics` - Statistik zone
- `GET /api/mining-area/activity` - Laporan aktivitas zone
- `GET /api/mining-area/trucks/:truckId/zones` - Check truck dalam zones
- `GET /api/mining-area/nearby` - Get nearby trucks
- `POST /api/mining-area` - Create mining zone baru
- `PUT /api/mining-area/:zoneId` - Update mining zone
- `DELETE /api/mining-area/:zoneId` - Deactivate mining zone

---

## Controllers

### File: `src/controllers/authController.js`
**Fungsi:** Business logic untuk authentication

#### Functions:

#### `login(req, res)`
- **Tujuan:** Authenticate user dan generate JWT token
- **Proses:**
  1. Validasi input (username/password)
  2. Query user dari database
  3. Verify password (support demo password 'admin123')
  4. Generate JWT token dengan payload user info
  5. Log admin activity untuk security monitoring
  6. Broadcast login activity via WebSocket
- **Response:** JWT token dan user info

#### `verifyToken(req, res, next)`
- **Tujuan:** Middleware untuk verify JWT token
- **Proses:**
  1. Extract token dari Authorization header
  2. Verify token dengan JWT_SECRET
  3. Add user info ke req.user
  4. Continue ke next middleware

#### `getCurrentUser(req, res)`
- **Tujuan:** Get current user info dari token
- **Response:** User profile data

### File: `src/controllers/truckController.js`
**Fungsi:** Business logic untuk truck management

#### Functions:

#### `getAllTrucks(req, res)`
- **Tujuan:** Get semua trucks dengan filtering dan pagination
- **Filters:**
  - `status` - Filter berdasarkan status truck
  - `page` & `limit` - Pagination
  - `search` - Search berdasarkan truck number
  - `minFuel` & `maxFuel` - Filter berdasarkan fuel level
  - `hasAlerts` - Filter trucks yang memiliki alerts
- **Response:** Array trucks dengan pagination info

#### `getTruckById(req, res)`
- **Tujuan:** Get detail truck spesifik
- **Proses:**
  1. Validasi truck ID
  2. Query truck dengan relasi (model, alerts, maintenance)
  3. Format response data
- **Response:** Detail lengkap truck

#### `getTruckTires(req, res)`
- **Tujuan:** Get data tekanan ban truck
- **Response:** Array tire pressure data dengan status

#### `getRealtimeLocations(req, res)`
- **Tujuan:** Get lokasi real-time semua trucks dalam format GeoJSON
- **Features:**
  - Set cache headers untuk real-time data
  - Filter berdasarkan status
  - Format GeoJSON untuk mapping
- **Response:** GeoJSON FeatureCollection

#### `updateTruckStatus(req, res)`
- **Tujuan:** Update status truck
- **Proses:**
  1. Validasi truck ID dan status
  2. Update database
  3. Broadcast update via WebSocket
- **Valid Statuses:** active, inactive, maintenance

#### `getTruckLocationHistory(req, res)`
- **Tujuan:** Get riwayat lokasi truck
- **Parameters:**
  - `hours` - Time range (default: 24 jam)
  - `limit` - Max records (default: 100)
- **Response:** GeoJSON LineString untuk tracking + array points

#### `getTruckAlerts(req, res)`
- **Tujuan:** Get alerts truck
- **Parameters:**
  - `resolved` - Filter resolved/unresolved alerts
  - `limit` - Max records
- **Response:** Array alerts dengan detail

#### `resolveAlert(req, res)`
- **Tujuan:** Resolve alert truck
- **Proses:**
  1. Validasi truck ID dan alert ID
  2. Update alert status ke resolved
  3. Set resolvedAt timestamp

#### `bulkUpdateTruckStatus(req, res)`
- **Tujuan:** Update status multiple trucks sekaligus
- **Input:** Array truck IDs dan status baru
- **Response:** Count trucks yang berhasil diupdate

### File: `src/controllers/dashboardController.js`
**Fungsi:** Business logic untuk dashboard analytics

#### Functions:

#### `getDashboardStats(req, res)`
- **Tujuan:** Get statistik dasar dashboard
- **Data yang dikumpulkan:**
  - Total trucks dan breakdown berdasarkan status
  - Total alerts dan breakdown berdasarkan severity
  - Fuel statistics
  - Performance metrics
- **Response:** Object dengan semua statistik

#### `getFleetSummary(req, res)`
- **Tujuan:** Get summary lengkap fleet
- **Proses:** Parallel execution untuk:
  1. Dashboard stats
  2. Recent alerts
  3. Fuel analytics
  4. Performance metrics
- **Response:** Comprehensive fleet overview

#### `getAlertSummary(req, res)`
- **Tujuan:** Get summary alerts dengan time range
- **Parameters:**
  - `timeRange` - 1h, 24h, 7d, 30d
- **Data yang dikumpulkan:**
  - Total alerts dalam time range
  - Breakdown berdasarkan severity
  - Top alert types
- **Response:** Alert analytics data

#### `getFuelReport(req, res)`
- **Tujuan:** Generate laporan bahan bakar
- **Data yang dikumpulkan:**
  - Overall fuel statistics (avg, min, max)
  - Fuel distribution by ranges
  - Low fuel trucks list
  - Fuel consumption trends
- **Response:** Comprehensive fuel report

#### `getMaintenanceReport(req, res)`
- **Tujuan:** Generate laporan maintenance
- **Data yang dikumpulkan:**
  - Overdue maintenance (> 30 hari)
  - Upcoming maintenance (berdasarkan engine hours)
  - Status breakdown
- **Response:** Maintenance analytics

#### Helper Functions:

#### `getRecentAlerts()`
- **Tujuan:** Get unresolved alerts dalam 24 jam terakhir
- **Limit:** 10 alerts terbaru

#### `getFuelAnalytics()`
- **Tujuan:** Calculate fuel analytics menggunakan raw SQL
- **Metrics:** Average fuel, low fuel count, critical fuel count

#### `getFleetPerformanceMetrics()`
- **Tujuan:** Calculate performance metrics
- **Metrics:** Average speed, max speed, payload statistics

### File: `src/controllers/miningAreaController.js`
**Fungsi:** Business logic untuk mining zone management

#### Functions:

#### `getMiningAreas(req, res)`
- **Tujuan:** Get semua mining areas dalam format GeoJSON
- **Response:** GeoJSON FeatureCollection dengan geometry zones

#### `getTrucksInZone(req, res)`
- **Tujuan:** Get trucks yang berada dalam zone tertentu
- **Proses:** Menggunakan PostGIS spatial query ST_Within
- **Response:** Array trucks dalam zone

#### `getZoneStatistics(req, res)`
- **Tujuan:** Get statistik untuk semua zones
- **Data yang dikumpulkan:**
  - Truck count per zone
  - Active trucks per zone
  - Average fuel dan payload per zone
- **Menggunakan:** PostGIS spatial queries

#### `getZoneActivityReport(req, res)`
- **Tujuan:** Generate laporan aktivitas zone
- **Parameters:**
  - `timeRange` - 1h, 24h, 7d
- **Data yang dikumpulkan:**
  - Location records per zone
  - Unique trucks per zone
  - Average speed dalam zone
  - Activity level classification

#### `checkTruckInZones(req, res)`
- **Tujuan:** Check zones mana saja yang mengandung truck tertentu
- **Proses:**
  1. Get truck location
  2. PostGIS spatial query untuk find containing zones
  3. Calculate distance to zone centers
- **Response:** Array zones yang mengandung truck

#### `getNearbyTrucks(req, res)`
- **Tujuan:** Find trucks dalam radius tertentu dari koordinat
- **Parameters:**
  - `latitude`, `longitude` - Center point
  - `radius` - Radius dalam meters (default: 1000m)
- **Menggunakan:** PostGIS ST_DWithin untuk geographic distance
- **Response:** Array nearby trucks dengan distance

#### `createMiningZone(req, res)`
- **Tujuan:** Create mining zone baru
- **Input:** Name, zone type, GeoJSON boundary
- **Proses:**
  1. Validasi GeoJSON Polygon
  2. Insert ke database dengan PostGIS geometry
  3. Handle unique constraint violations
- **Response:** Created zone info

#### `updateMiningZone(req, res)`
- **Tujuan:** Update mining zone
- **Features:**
  - Dynamic query building
  - Partial updates (name, type, boundary, status)
  - PostGIS geometry updates
- **Response:** Updated zone info

#### `deleteMiningZone(req, res)`
- **Tujuan:** Soft delete mining zone
- **Proses:** Set is_active = false instead of hard delete
- **Response:** Deactivation confirmation

#### Helper Functions:

#### `getActivityLevel(recordCount)`
- **Tujuan:** Classify activity level berdasarkan record count
- **Levels:**
  - high: > 100 records
  - medium: 50-100 records
  - low: 10-50 records
  - minimal: < 10 records

---

## Middleware

### File: `src/middleware/auth.js`
**Fungsi:** Authentication middleware untuk protect API endpoints

#### `authMiddleware(req, res, next)`
- **Tujuan:** Verify JWT token untuk semua protected routes
- **Proses:**
  1. Extract token dari Authorization header (Bearer format)
  2. Verify token dengan JWT_SECRET
  3. Decode user info dan add ke req.user
  4. Handle berbagai error types:
     - TokenExpiredError
     - JsonWebTokenError
     - General errors
- **User Info yang di-extract:**
  - userId
  - username
  - role

#### `requireRole(roles)`
- **Tujuan:** Role-based access control middleware
- **Parameters:** Array atau string roles yang diizinkan
- **Proses:**
  1. Check apakah user sudah authenticated
  2. Check apakah user role sesuai dengan required roles
  3. Allow atau deny access

### File: `src/middleware/logger.js`
**Fungsi:** Request logging middleware

#### `requestLogger(req, res, next)`
- **Tujuan:** Log semua HTTP requests
- **Data yang di-log:**
  - HTTP method dan URL
  - Request timestamp
  - Client IP address
  - User agent
  - Response status code
  - Response time

### File: `src/middleware/errorhandler.js`
**Fungsi:** Global error handling middleware

#### `errorHandler(error, req, res, next)`
- **Tujuan:** Handle semua unhandled errors
- **Features:**
  - Different error handling untuk development vs production
  - Structured error responses
  - Error logging
  - Security-aware error messages

---

## Services

### File: `src/services/prismaService.js`
**Fungsi:** Database service layer dengan Prisma ORM

#### Core Functions:

#### `connect()`
- **Tujuan:** Establish database connection
- **Features:** Connection retry logic

#### `disconnect()`
- **Tujuan:** Close database connections gracefully

#### `healthCheck()`
- **Tujuan:** Check database health status
- **Returns:** Status dan connection info

#### `getConnectionInfo()`
- **Tujuan:** Get database connection metadata
- **Returns:** Database name, active connections, etc.

#### `optimizeDatabase()`
- **Tujuan:** Run database optimization queries
- **Operations:** ANALYZE tables untuk query performance

#### Data Access Functions:

#### `getAllTrucks(filters)`
- **Tujuan:** Get trucks dengan advanced filtering
- **Features:**
  - Status filtering
  - Fuel range filtering
  - Search functionality
  - Pagination
  - Include related data (model, alerts)

#### `getTruckById(truckId)`
- **Tujuan:** Get single truck dengan semua relasi
- **Includes:** Model, alerts, maintenance records, tire pressures

#### `getTruckTires(truckId)`
- **Tujuan:** Get tire pressure data untuk truck
- **Returns:** Current tire pressures dengan status

#### `getRealtimeLocations(status)`
- **Tujuan:** Get truck locations dalam GeoJSON format
- **Features:**
  - Optional status filtering
  - GeoJSON Point geometries
  - Optimized untuk mapping

#### `getDashboardStats()`
- **Tujuan:** Get comprehensive dashboard statistics
- **Data:** Fleet counts, alert counts, fuel stats, performance metrics

#### `getMiningAreasWithGeometry()`
- **Tujuan:** Get mining areas dengan PostGIS geometry
- **Returns:** GeoJSON FeatureCollection

#### `getTrucksInZone(zoneName)`
- **Tujuan:** Get trucks dalam mining zone menggunakan spatial query
- **Uses:** PostGIS ST_Within function

#### `updateTruckStatus(truckId, status)`
- **Tujuan:** Update truck status dengan validation
- **Features:** Timestamp update, error handling

### File: `src/services/websocketService.js`
**Fungsi:** WebSocket service untuk real-time communication

#### Core Functions:

#### `initialize(webSocketServer)`
- **Tujuan:** Initialize service dengan WebSocket server instance

#### `addClient(clientId, clientInfo)`
- **Tujuan:** Register client baru
- **ClientInfo:** ID, WebSocket connection, subscriptions, metadata

#### `removeClient(clientId)`
- **Tujuan:** Remove client dan cleanup subscriptions

#### `addSubscription(clientId, channel)`
- **Tujuan:** Subscribe client ke channel tertentu
- **Channels:** truck_updates, alerts, dashboard, admin_activities

#### `removeSubscription(clientId, channel)`
- **Tujuan:** Unsubscribe client dari channel

#### Broadcasting Functions:

#### `broadcastTruckLocationUpdate(data)`
- **Tujuan:** Broadcast truck location updates ke subscribed clients
- **Channel:** truck_updates

#### `broadcastTruckStatusUpdate(data)`
- **Tujuan:** Broadcast truck status changes
- **Channel:** truck_updates

#### `broadcastNewAlert(alert)`
- **Tujuan:** Broadcast alert baru ke subscribed clients
- **Channel:** alerts

#### `broadcastAlertResolved(alert)`
- **Tujuan:** Broadcast alert resolution
- **Channel:** alerts

#### `broadcastAdminActivity(activity)`
- **Tujuan:** Broadcast admin activities untuk monitoring
- **Channel:** admin_activities

#### Utility Functions:

#### `getConnectedClients()`
- **Returns:** Total connected clients count

#### `getSubscriptions()`
- **Returns:** Subscription counts per channel

#### `sendMessage(ws, message)`
- **Tujuan:** Send message ke specific WebSocket connection
- **Features:** Connection state checking

---

## Database Models

### Prisma Schema (`prisma/schema.prisma`)

#### Core Models:

#### `User`
- **Tujuan:** User management untuk authentication
- **Fields:**
  - id, username, email (unique)
  - passwordHash, role, isActive
  - timestamps (createdAt, updatedAt)

#### `Truck`
- **Tujuan:** Main truck entity dengan location dan status
- **Fields:**
  - Basic info: truckNumber, modelId, status
  - Location: latitude, longitude, speed, heading
  - Operational: fuelPercentage, payloadTons, engineHours
  - Maintenance: lastMaintenance, odometer
  - Driver: driverName
- **Relations:** TruckModel, TirePressures, Alerts, LocationHistory, MaintenanceRecords
- **Indexes:** Coordinates, status, updatedAt untuk performance

#### `TruckModel`
- **Tujuan:** Truck model reference data
- **Fields:** name, manufacturer, capacityTons, fuelTankCapacity, tireCount

#### `TirePressure`
- **Tujuan:** Real-time tire pressure monitoring
- **Fields:**
  - tirePosition, tireNumber, pressurePsi
  - status (NORMAL, LOW, HIGH)
  - temperature, recordedAt
- **Relations:** Truck (with cascade delete)
- **Indexes:** truckId + recordedAt untuk time-series queries

#### `TruckAlert`
- **Tujuan:** Alert dan notification system
- **Fields:**
  - alertType, severity (LOW, MEDIUM, HIGH, CRITICAL)
  - message, isResolved
  - timestamps (createdAt, resolvedAt)
- **Relations:** Truck (with cascade delete)
- **Indexes:** truckId + isResolved, createdAt untuk filtering

#### `LocationHistory`
- **Tujuan:** GPS tracking dan location history
- **Fields:**
  - latitude, longitude, speed, heading
  - fuelPercentage, recordedAt
- **Relations:** Truck (with cascade delete)
- **Indexes:** truckId + recordedAt untuk time-series queries

#### `MiningZone`
- **Tujuan:** Mining zones dengan PostGIS geometry
- **Fields:**
  - name, zoneType, isActive
  - boundary (PostGIS GEOMETRY field - handled via raw SQL)
- **Note:** PostGIS geometry field dihandle dengan raw SQL queries

#### `MaintenanceRecord`
- **Tujuan:** Maintenance tracking dan scheduling
- **Fields:**
  - maintenanceType, description
  - startDate, endDate, cost
  - technicianName, isCompleted
- **Relations:** Truck (with cascade delete)

#### Enums:

#### `TruckStatus`
- ACTIVE, INACTIVE, MAINTENANCE

#### `TireStatus`
- NORMAL, LOW, HIGH

#### `AlertSeverity`
- LOW, MEDIUM, HIGH, CRITICAL

---

## Utilities

### File: `src/utils/adminLogger.js`
**Fungsi:** Comprehensive logging system untuk admin activities

#### Logging Functions:

#### `logServerStartup(data)`
- **Tujuan:** Log server startup events
- **Data:** Port, environment, database status, startup time

#### `logServerShutdown(signal)`
- **Tujuan:** Log server shutdown events
- **Data:** Shutdown signal, timestamp

#### `logDatabaseConnection(status, data)`
- **Tujuan:** Log database connection events
- **Statuses:** CONNECTING, CONNECTED, OPTIMIZING, OPTIMIZED

#### `logWebSocketConnection(data)`
- **Tujuan:** Log WebSocket client connections
- **Data:** Client ID, IP, user agent

#### `logWebSocketDisconnection(data)`
- **Tujuan:** Log WebSocket client disconnections
- **Data:** Client ID, connection duration, reason

#### `logAdminOperation(operation, adminId, data)`
- **Tujuan:** Log admin operations untuk audit trail
- **Operations:** USER_LOGIN, UPDATE_TRUCK_STATUS, RESOLVE_ALERT, etc.

#### `logAdminActivity(action, data)`
- **Tujuan:** Log general admin activities
- **Features:** Structured logging dengan metadata

#### `logSystemHealth(healthData)`
- **Tujuan:** Log system health checks
- **Data:** Database status, WebSocket connections, server metrics

#### `logError(error, context)`
- **Tujuan:** Log errors dengan context information
- **Features:** Stack trace, environment info, request context

#### `logSecurityEvent(event, data)`
- **Tujuan:** Log security-related events
- **Events:** FAILED_LOGIN_ATTEMPT, INVALID_TOKEN, etc.

#### `logPerformanceMetric(metric, data)`
- **Tujuan:** Log performance metrics
- **Metrics:** Response times, database query performance, etc.

---

## Configuration Files

### File: `src/app.js`
**Fungsi:** Express application configuration

#### Middleware Setup:
1. **Security:** Helmet untuk security headers
2. **Compression:** Response compression
3. **CORS:** Cross-origin resource sharing
4. **Body Parsing:** JSON dan URL-encoded
5. **Request Logging:** Custom logging middleware
6. **Routes:** API routes mounting
7. **Error Handling:** Global error handler

#### Endpoints:
- `GET /health` - Health check endpoint
- `GET /` - Root endpoint dengan API info
- `*` - 404 handler untuk unknown endpoints

### File: `package.json`
**Dependencies:**
- **Core:** express, prisma, jsonwebtoken
- **Database:** @prisma/client, pg
- **WebSocket:** ws
- **Security:** bcryptjs, helmet, cors
- **Utilities:** dotenv, compression, express-validator

### File: `.env.example`
**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

### File: `nodemon.json`
**Development Configuration:**
- File watching patterns
- Environment variables
- Restart delays
- Ignored files/directories

---

## Key Features & Functionality

### Real-time Communication
- Native WebSocket implementation
- Subscription-based messaging
- Automatic reconnection handling
- Health monitoring dengan ping/pong

### Spatial Data Processing
- PostGIS integration untuk geographic queries
- GeoJSON format untuk mapping compatibility
- Spatial relationships (ST_Within, ST_Distance)
- Mining zone management dengan geometry

### Performance Optimization
- Database indexing strategy
- Connection pooling
- Query optimization
- Caching headers untuk real-time data

### Security Implementation
- JWT-based authentication
- Role-based access control
- Request validation
- Security headers dengan Helmet
- Admin activity logging

### Error Handling
- Comprehensive error handling
- Environment-aware error messages
- Structured error responses
- Global error middleware

### Monitoring & Logging
- Admin activity logging
- Performance metrics
- Security event logging
- System health monitoring
- WebSocket connection tracking

---

## Development Guidelines

### Code Organization
- Separation of concerns (routes, controllers, services)
- Consistent error handling patterns
- Structured response formats
- Comprehensive input validation

### Database Best Practices
- Proper indexing untuk performance
- Cascade deletes untuk data integrity
- Time-series data handling
- Spatial data optimization

### API Design
- RESTful endpoint design
- Consistent response formats
- Proper HTTP status codes
- Comprehensive documentation

### Security Considerations
- JWT token management
- Input sanitization
- SQL injection prevention
- Rate limiting considerations
- CORS configuration

---

## Deployment Considerations

### Production Setup
- Environment variable configuration
- Database connection pooling
- Error logging setup
- Performance monitoring
- Security hardening

### Scaling Considerations
- WebSocket connection limits
- Database query optimization
- Memory usage monitoring
- Load balancing strategies

### Maintenance
- Database backup strategies
- Log rotation
- Health check endpoints
- Graceful shutdown handling
