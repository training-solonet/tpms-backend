let io = null;

const initialize = (socketIo) => {
  io = socketIo;
  console.log('📡 WebSocket service initialized');
};

const broadcastTruckLocationUpdate = (data) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  io.to('truck-updates').emit('trucksLocationUpdate', {
    type: 'location_update',
    data: data,
    timestamp: new Date().toISOString()
  });
};

const broadcastTruckStatusUpdate = (data) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  io.to('truck-updates').emit('truckStatusUpdate', {
    type: 'status_update',
    data: data,
    timestamp: new Date().toISOString()
  });
};

const broadcastNewAlert = (alert) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  io.to('alerts').emit('newAlert', {
    type: 'new_alert',
    data: alert,
    timestamp: new Date().toISOString()
  });
};

const broadcastAlertResolved = (alert) => {
  if (!io) {
    console.warn('WebSocket not initialized');
    return;
  }

  io.to('alerts').emit('alertResolved', {
    type: 'alert_resolved',
    data: alert,
    timestamp: new Date().toISOString()
  });
};

const getConnectedClients = () => {
  if (!io) return 0;
  return io.engine.clientsCount;
};

const getRooms = () => {
  if (!io) return [];
  return Object.keys(io.sockets.adapter.rooms);
};

module.exports = {
  initialize,
  broadcastTruckLocationUpdate,
  broadcastTruckStatusUpdate,
  broadcastNewAlert,
  broadcastAlertResolved,
  getConnectedClients,
  getRooms
};