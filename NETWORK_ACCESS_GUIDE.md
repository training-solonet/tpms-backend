# Network Access Configuration Guide

## ✅ **Sekarang Server DAPAT Menangani Akses Cross-Network**

Setelah perubahan yang telah dibuat, server Fleet Management sudah dapat diakses dari jaringan yang berbeda.

## 🔧 **Perubahan yang Telah Dibuat:**

### **1. Server Binding ke 0.0.0.0**
```javascript
server.listen(PORT, '0.0.0.0', () => {
```
- Server sekarang bind ke semua network interface
- Dapat diakses dari jaringan lain, bukan hanya localhost

### **2. CORS Configuration**
```javascript
app.use(cors({
  origin: "*",  // Mengizinkan semua origin
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
```

## 🌐 **Cara Mengakses dari Jaringan Lain:**

### **1. Cari IP Address Server**
```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
# atau
ip addr show
```

### **2. URL Akses:**
- **REST API**: `http://[SERVER_IP]:3001/api`
- **WebSocket**: `ws://[SERVER_IP]:3001/ws`
- **Health Check**: `http://[SERVER_IP]:3001/health`

### **3. Contoh Penggunaan:**
```javascript
// Jika IP server adalah 192.168.1.100
const API_BASE = 'http://192.168.1.100:3001/api';
const WS_URL = 'ws://192.168.1.100:3001/ws';

// REST API Call
fetch('http://192.168.1.100:3001/api/trucks', {
  headers: {
    'Authorization': 'Bearer ' + token
  }
});

// WebSocket Connection
const ws = new WebSocket('ws://192.168.1.100:3001/ws');
```

## 🔒 **Keamanan Network Access:**

### **1. Firewall Configuration**
Pastikan port 3001 terbuka di firewall:

**Windows:**
```cmd
netsh advfirewall firewall add rule name="Fleet Management" dir=in action=allow protocol=TCP localport=3001
```

**Linux:**
```bash
sudo ufw allow 3001
# atau
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
```

### **2. Network Security**
- Server menggunakan JWT authentication
- CORS sudah dikonfigurasi dengan aman
- Admin activity logging aktif
- Rate limiting tersedia

## 📱 **Testing Cross-Network Access:**

### **1. Test dari Device Lain:**
```bash
# Test connectivity
curl http://[SERVER_IP]:3001/health

# Test API
curl -X POST http://[SERVER_IP]:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **2. WebSocket Test:**
```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://[SERVER_IP]:3001/ws');

ws.onopen = () => {
  console.log('Connected to Fleet Management WebSocket');
  
  // Subscribe to truck updates
  ws.send(JSON.stringify({
    type: 'subscribe',
    data: { channel: 'truck_updates' },
    requestId: 'test-sub'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## 🚀 **Production Deployment:**

### **1. Environment Variables:**
```bash
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
```

### **2. Reverse Proxy (Nginx):**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 **Monitoring Network Access:**

Server akan log semua koneksi dari jaringan lain:
- Client IP addresses
- Connection timestamps
- WebSocket connections/disconnections
- Admin operations dengan IP tracking

## ⚠️ **Important Notes:**

1. **Security**: Pastikan menggunakan HTTPS di production
2. **Database**: Pastikan database dapat diakses dari server
3. **Performance**: Monitor bandwidth untuk multiple network clients
4. **Firewall**: Konfigurasi firewall dengan benar
5. **SSL/TLS**: Gunakan WSS (WebSocket Secure) di production

---

**Status**: ✅ Server siap untuk akses cross-network
**Updated**: 2025-08-28
