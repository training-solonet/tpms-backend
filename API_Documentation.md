<!-- API Documentation -->

<!-- GET -->
{
    "name": "Fleet Management API",
    "version": "2.0.0",
    "description": "Mining truck fleet management system with Prisma integration",
    "status": "running",
    "database": "connected",
    "endpoints": {
        "health": "/health",
        "status": "/api/status",
        "auth": "/api/auth",
        "trucks": "/api/trucks",
        "dashboard": "/api/dashboard",
        "miningArea": "/api/mining-area"
    },
    "websocket": {
        "enabled": true,
        "events": [
            "trucksLocationUpdate",
            "newAlerts",
            "truckStatusUpdate"
        ]
    },
    "documentation": "https://github.com/your-repo/fleet-management-api"
}