# 🚀 Fleet Management Backend - Deployment Guide

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

### 1.2 Database Setup
```bash
# Login ke PostgreSQL
sudo -u postgres psql

-- Buat database dan user
CREATE DATABASE dummy_tracking;
CREATE USER fleetapp WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dummy_tracking TO fleetapp;

-- Enable extensions
\c dummy_tracking
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
\q

# Import schema
psql -U fleetapp -d dummy_tracking -f database/complete_schema.sql
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

# Database Configuration (sesuai dengan setup sebelumnya)
DATABASE_URL=postgresql://postgres_tpms:postgis%3A14-3.5-alpine@connectis.my.id:5432/dummy_tracking?schema=public

# JWT Configuration
JWT_SECRET=fleet_mgmt_2024_super_secure_jwt_key_change_in_production_xyz789

# CORS Configuration
FRONTEND_URL=https://fleet.connectis.my.id
ALLOWED_ORIGINS=https://fleet.connectis.my.id,https://www.fleet.connectis.my.id,http://connectis.my.id:5173

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
