#!/bin/bash
# Fleet Management Backend Deployment Script

set -e

echo "🚀 Starting Fleet Management Backend Deployment..."

# Variables
APP_DIR="/opt/fleet-management-backend"
BACKUP_DIR="/opt/backups/fleet-$(date +%Y%m%d_%H%M%S)"

# Create backup if app exists
if [ -d "$APP_DIR" ]; then
    echo "📦 Creating backup..."
    sudo mkdir -p /opt/backups
    sudo cp -r $APP_DIR $BACKUP_DIR
fi

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Copy environment file
echo "⚙️ Setting up environment..."
cp env.production.example .env.production

# Create log directory
mkdir -p log

# Restart PM2 processes
echo "🔄 Starting/Restarting application..."
pm2 restart fleet-management-backend || pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Wait for startup
echo "⏳ Waiting for application startup..."
sleep 15

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost:3001/health; then
    echo "✅ Deployment successful!"
    echo "🌐 API URL: http://connectis.my.id/api"
    echo "📡 WebSocket URL: ws://connectis.my.id/ws"
    echo "🏥 Health Check: http://connectis.my.id/health"
    echo ""
    echo "📊 Application Status:"
    pm2 status
else
    echo "❌ Health check failed!"
    echo "📋 Recent logs:"
    pm2 logs fleet-management-backend --lines 20
    
    if [ -d "$BACKUP_DIR" ]; then
        echo "🔄 Rolling back to previous version..."
        pm2 stop fleet-management-backend
        sudo rm -rf $APP_DIR
        sudo mv $BACKUP_DIR $APP_DIR
        cd $APP_DIR
        pm2 start ecosystem.config.js
    fi
    exit 1
fi

echo "🎉 Deployment completed successfully!"
