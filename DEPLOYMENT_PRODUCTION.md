# 🚀 Fleet Management Backend - Production Deployment Guide

Panduan lengkap untuk deploy backend Fleet Management ke server production.

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 7+ / RHEL 8+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: Minimum 2 cores
- **Storage**: Minimum 20GB SSD
- **Network**: Port 3001 terbuka untuk API, Port 80/443 untuk web

### Software Requirements
```bash
# Node.js 18+ dan npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 14+ dengan PostGIS
sudo apt-get install -y postgresql postgresql-contrib postgis

# PM2 untuk process management
sudo npm install -g pm2

# Nginx untuk reverse proxy
sudo apt-get install -y nginx

# Git untuk deployment
sudo apt-get install -y git
```

## 🔧 Step 1: Server Setup

### 1.1 Clone Repository
```bash
# Clone ke server
cd /opt
sudo git clone https://github.com/your-repo/fleet-management-backend.git
sudo chown -R $USER:$USER fleet-management-backend
cd fleet-management-backend

# Install dependencies
npm install --production
```

### 1.2 Database Setup (Sudah dikonfigurasi di connectis.my.id)
```bash
# Database sudah tersedia di:
# Host: connectis.my.id:5432
# Database: dummy_tracking
# User: postgres_tpms
# Password: postgis:14-3.5-alpine

# Test koneksi
psql -h connectis.my.id -U postgres_tpms -d dummy_tracking -c "SELECT version();"
```

### 1.3 Environment Configuration
```bash
# Copy dan edit environment file
cp .env.example .env.production
nano .env.production
```

## 📄 Step 2: Production Environment (.env.production)

```env
# Fleet Management Backend - Production Environment
NODE_ENV=production
PORT=3001

# Database Configuration (sudah dikonfigurasi sebelumnya)
DATABASE_URL=postgresql://postgres_tpms:postgis%3A14-3.5-alpine@connectis.my.id:5432/dummy_tracking?schema=public

# JWT Configuration
JWT_SECRET=fleet_mgmt_2024_super_secure_jwt_key_change_in_production_xyz789

# CORS Configuration
FRONTEND_URL=http://connectis.my.id:5173
ALLOWED_ORIGINS=http://connectis.my.id:5173,http://connectis.my.id:3001,http://localhost:5173

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=log/fleet-management.log

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=fleet_session_secret_key_2024_xyz

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# WebSocket Configuration
WS_HEARTBEAT_INTERVAL=30000
WS_MAX_CONNECTIONS=1000

# Performance Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_IDLE_TIMEOUT=30000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./upload
```

## 🔄 Step 3: PM2 Process Management

### 3.1 PM2 Configuration
```bash
# Buat file ecosystem.config.js
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'fleet-management-backend',
    script: 'server.js',
    env_file: '.env.production',
    instances: 2, // Sesuaikan dengan CPU cores
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    error_file: 'log/pm2-error.log',
    out_file: 'log/pm2-out.log',
    log_file: 'log/pm2-combined.log',
    time: true,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### 3.2 Start dengan PM2
```bash
# Buat direktori log
mkdir -p log

# Start aplikasi
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Jalankan command yang diberikan PM2

# Monitor aplikasi
pm2 status
pm2 logs fleet-management-backend
pm2 monit
```

## 🌐 Step 4: Nginx Reverse Proxy

### 4.1 Nginx Configuration
```bash
# Buat file konfigurasi Nginx
sudo nano /etc/nginx/sites-available/fleet-management
```

```nginx
# Fleet Management Backend Nginx Configuration
upstream fleet_backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

server {
    listen 80;
    server_name connectis.my.id;
    
    # API routes
    location /api {
        proxy_pass http://fleet_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }
    
    # WebSocket routes
    location /ws {
        proxy_pass http://fleet_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Health check
    location /health {
        proxy_pass http://fleet_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Root endpoint
    location / {
        proxy_pass http://fleet_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.2 Enable Nginx Configuration
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fleet-management /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 🚀 Step 5: Quick Deployment Script

### 5.1 Create Deployment Script
```bash
nano deploy.sh
chmod +x deploy.sh
```

```bash
#!/bin/bash
# Fleet Management Backend Quick Deployment Script

set -e

echo "🚀 Starting Fleet Management Backend Deployment..."

# Variables
APP_DIR="/opt/fleet-management-backend"

# Navigate to app directory
cd $APP_DIR

# Pull latest code (if using git)
echo "📥 Pulling latest code..."
# git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Copy environment file
echo "⚙️ Setting up environment..."
cp .env.production .env

# Restart PM2 processes
echo "🔄 Restarting application..."
pm2 restart fleet-management-backend || pm2 start ecosystem.config.js

# Wait for startup
echo "⏳ Waiting for application startup..."
sleep 10

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health; then
    echo "✅ Deployment successful!"
    echo "🌐 API URL: http://connectis.my.id/api"
    echo "📡 WebSocket URL: ws://connectis.my.id/ws"
    echo "🏥 Health Check: http://connectis.my.id/health"
else
    echo "❌ Health check failed!"
    pm2 logs fleet-management-backend --lines 50
    exit 1
fi

echo "🎉 Deployment completed successfully!"
```

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Monitoring Commands
```bash
# System monitoring
htop
df -h
free -h

# Application monitoring
pm2 status
pm2 monit
pm2 logs fleet-management-backend --lines 100

# Database monitoring
psql -h connectis.my.id -U postgres_tpms -d dummy_tracking -c "SELECT COUNT(*) FROM truck;"

# Nginx monitoring
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 6.2 Performance Check
```bash
# Test API endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/trucks
curl http://localhost:3001/api/dashboard/stats

# Test WebSocket connection
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws');
ws.on('open', () => {
  console.log('✅ WebSocket connected');
  ws.close();
});
ws.on('error', (err) => console.error('❌ WebSocket error:', err));
"
```

## 🚨 Troubleshooting

### Common Issues
```bash
# Port sudah digunakan
sudo lsof -i :3001
sudo kill -9 <PID>

# Database connection error
psql -h connectis.my.id -U postgres_tpms -d dummy_tracking -c "SELECT version();"

# PM2 issues
pm2 delete all
pm2 start ecosystem.config.js

# Nginx issues
sudo nginx -t
sudo systemctl status nginx
sudo systemctl restart nginx

# Check logs
pm2 logs fleet-management-backend
sudo tail -f /var/log/nginx/error.log
```

## 📋 Post-Deployment Checklist

- [ ] ✅ Database connection ke `connectis.my.id` berhasil
- [ ] ✅ Environment variables dikonfigurasi (.env.production)
- [ ] ✅ PM2 berjalan dengan 2 instances
- [ ] ✅ Nginx reverse proxy aktif
- [ ] ✅ Health check endpoint responsif (`/health`)
- [ ] ✅ WebSocket connection berfungsi (`/ws`)
- [ ] ✅ API endpoints dapat diakses (`/api/*`)
- [ ] ✅ CORS dikonfigurasi untuk frontend
- [ ] ✅ Log monitoring aktif
- [ ] ✅ Auto-restart dengan PM2 startup

## 🌐 Production URLs

Setelah deployment berhasil:

- **API Base URL**: `http://connectis.my.id/api`
- **WebSocket URL**: `ws://connectis.my.id/ws`
- **Health Check**: `http://connectis.my.id/health`
- **Root Endpoint**: `http://connectis.my.id/`

## 🔧 Frontend Integration URLs

Update frontend configuration untuk production:

```javascript
// Production API configuration
const API_BASE_URL = 'http://connectis.my.id/api';
const WS_URL = 'ws://connectis.my.id/ws';

// Login credentials (demo)
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};
```

---

## 🎉 Deployment Complete!

Backend Fleet Management siap production dengan:
- ✅ High availability dengan PM2 cluster
- ✅ Reverse proxy dengan Nginx
- ✅ Database remote di `connectis.my.id`
- ✅ Monitoring dan logging
- ✅ Auto-restart dan recovery
- ✅ CORS dikonfigurasi untuk frontend
- ✅ 1,103 trucks dengan data lengkap
- ✅ Real-time WebSocket broadcasting

**Backend siap digunakan oleh frontend!** 🚀
