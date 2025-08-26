const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

let io;

const initializeWebSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // WebSocket authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return next(new Error('Authentication error'));
      }
      socket.user = user;
      next();
    });
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected from ${socket.handshake.address}`);
    
    socket.on('subscribeToTruckUpdates', () => {
      socket.join('truckUpdates');
      console.log(`User ${socket.user.username} subscribed to truck updates`);
    });
    
    socket.on('unsubscribeFromTruckUpdates', () => {
      socket.leave('truckUpdates');
      console.log(`User ${socket.user.username} unsubscribed from truck updates`);
    });
    
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized');
  }
  return io;
};

const broadcastTruckUpdate = (data) => {
  if (io) {
    io.to('truckUpdates').emit('trucksLocationUpdate', data);
  }
};

const broadcastTruckStatusUpdate = (data) => {
  if (io) {
    io.emit('truckStatusUpdate', data);
  }
};

module.exports = {
  initializeWebSocket,
  getIO,
  broadcastTruckUpdate,
  broadcastTruckStatusUpdate
};