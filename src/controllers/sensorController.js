const pool = require('../config/database');
const { broadcastSensorUpdate } = require('../services/websocketService');

// ==========================================
// SENSOR DATA INGESTION CONTROLLER
// ==========================================

const ingestTirePressureData = async (req, res) => {
  try {
    const sensorData = req.body;
    
    // Insert raw sensor data first
    const rawDataQuery = `
      INSERT INTO sensor_data_raw (device_sn, cmd_type, raw_json, received_at)
      VALUES ($1, 'tpdata', $2, NOW())
      RETURNING id
    `;
    
    const rawResult = await pool.query(rawDataQuery, [
      sensorData.sn,
      JSON.stringify(sensorData)
    ]);

    // Broadcast real-time update via WebSocket
    try {
      broadcastSensorUpdate({
        type: 'tire_pressure',
        deviceSn: sensorData.sn,
        data: {
          tireNo: sensorData.data.tireNo,
          pressure: sensorData.data.tiprValue,
          temperature: sensorData.data.tempValue,
          battery: sensorData.data.bat
        },
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      console.log('WebSocket broadcast failed:', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Tire pressure data received successfully',
      data: {
        rawDataId: rawResult.rows[0].id,
        deviceSn: sensorData.sn,
        processingStatus: 'queued'
      }
    });

  } catch (error) {
    console.error('Error ingesting tire pressure data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest tire pressure data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const ingestHubTemperatureData = async (req, res) => {
  try {
    const sensorData = req.body;
    
    // Insert raw sensor data
    const rawDataQuery = `
      INSERT INTO sensor_data_raw (device_sn, cmd_type, raw_json, received_at)
      VALUES ($1, 'hubdata', $2, NOW())
      RETURNING id
    `;
    
    const rawResult = await pool.query(rawDataQuery, [
      sensorData.sn,
      JSON.stringify(sensorData)
    ]);

    // Broadcast real-time update
    try {
      broadcastSensorUpdate({
        type: 'hub_temperature',
        deviceSn: sensorData.sn,
        data: {
          tireNo: sensorData.data.tireNo,
          temperature: sensorData.data.tempValue,
          battery: sensorData.data.bat
        },
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      console.log('WebSocket broadcast failed:', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Hub temperature data received successfully',
      data: {
        rawDataId: rawResult.rows[0].id,
        deviceSn: sensorData.sn,
        processingStatus: 'queued'
      }
    });

  } catch (error) {
    console.error('Error ingesting hub temperature data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest hub temperature data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const ingestDeviceStatusData = async (req, res) => {
  try {
    const sensorData = req.body;
    
    // Insert raw sensor data
    const rawDataQuery = `
      INSERT INTO sensor_data_raw (device_sn, cmd_type, raw_json, received_at)
      VALUES ($1, 'device', $2, NOW())
      RETURNING id
    `;
    
    const rawResult = await pool.query(rawDataQuery, [
      sensorData.sn,
      JSON.stringify(sensorData)
    ]);

    // Broadcast GPS update immediately for real-time tracking
    try {
      broadcastSensorUpdate({
        type: 'gps_update',
        deviceSn: sensorData.sn,
        data: {
          longitude: sensorData.data.lng,
          latitude: sensorData.data.lat,
          batteryLevels: {
            host: sensorData.data.bat1,
            repeater1: sensorData.data.bat2,
            repeater2: sensorData.data.bat3
          },
          lockState: sensorData.data.lock
        },
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      console.log('WebSocket broadcast failed:', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Device status data received successfully',
      data: {
        rawDataId: rawResult.rows[0].id,
        deviceSn: sensorData.sn,
        processingStatus: 'queued'
      }
    });

  } catch (error) {
    console.error('Error ingesting device status data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest device status data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const ingestLockStateData = async (req, res) => {
  try {
    const sensorData = req.body;
    
    // Insert raw sensor data
    const rawDataQuery = `
      INSERT INTO sensor_data_raw (device_sn, cmd_type, raw_json, received_at)
      VALUES ($1, 'state', $2, NOW())
      RETURNING id
    `;
    
    const rawResult = await pool.query(rawDataQuery, [
      sensorData.sn,
      JSON.stringify(sensorData)
    ]);

    // Broadcast lock state update
    try {
      broadcastSensorUpdate({
        type: 'lock_state',
        deviceSn: sensorData.sn,
        data: {
          isLocked: sensorData.data.is_lock
        },
        timestamp: new Date().toISOString()
      });
    } catch (wsError) {
      console.log('WebSocket broadcast failed:', wsError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Lock state data received successfully',
      data: {
        rawDataId: rawResult.rows[0].id,
        deviceSn: sensorData.sn,
        processingStatus: 'queued'
      }
    });

  } catch (error) {
    console.error('Error ingesting lock state data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest lock state data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const ingestRawSensorData = async (req, res) => {
  try {
    const { deviceSn, cmdType, data } = req.body;
    
    // Validate required fields
    if (!deviceSn || !cmdType || !data) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: deviceSn, cmdType, data'
      });
    }

    // Insert raw sensor data
    const rawDataQuery = `
      INSERT INTO sensor_data_raw (device_sn, cmd_type, raw_json, received_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id
    `;
    
    const rawResult = await pool.query(rawDataQuery, [
      deviceSn,
      cmdType,
      JSON.stringify({ sn: deviceSn, cmd: cmdType, data })
    ]);

    res.status(201).json({
      success: true,
      message: 'Raw sensor data received successfully',
      data: {
        rawDataId: rawResult.rows[0].id,
        deviceSn: deviceSn,
        cmdType: cmdType,
        processingStatus: 'queued'
      }
    });

  } catch (error) {
    console.error('Error ingesting raw sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ingest raw sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==========================================
// QUEUE MANAGEMENT
// ==========================================

const getQueueStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_items,
        COUNT(*) FILTER (WHERE processed = false) as pending_items,
        COUNT(*) FILTER (WHERE processed = true) as processed_items,
        COUNT(*) FILTER (WHERE cmd_type = 'device') as gps_items,
        COUNT(*) FILTER (WHERE cmd_type = 'tpdata') as tire_pressure_items,
        COUNT(*) FILTER (WHERE cmd_type = 'hubdata') as hub_temp_items,
        COUNT(*) FILTER (WHERE cmd_type = 'state') as lock_state_items,
        MIN(received_at) as oldest_item,
        MAX(received_at) as newest_item
      FROM sensor_data_raw
      WHERE received_at >= NOW() - INTERVAL '24 hours'
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];

    // Get processing performance stats
    const performanceQuery = `
      SELECT * FROM get_queue_stats()
    `;
    
    let performanceStats = {};
    try {
      const perfResult = await pool.query(performanceQuery);
      performanceStats = perfResult.rows[0] || {};
    } catch (perfError) {
      console.log('Performance stats not available:', perfError.message);
    }

    res.status(200).json({
      success: true,
      data: {
        queue: {
          totalItems: parseInt(stats.total_items),
          pendingItems: parseInt(stats.pending_items),
          processedItems: parseInt(stats.processed_items),
          oldestItem: stats.oldest_item,
          newestItem: stats.newest_item
        },
        breakdown: {
          gpsItems: parseInt(stats.gps_items),
          tirePressureItems: parseInt(stats.tire_pressure_items),
          hubTempItems: parseInt(stats.hub_temp_items),
          lockStateItems: parseInt(stats.lock_state_items)
        },
        performance: performanceStats
      },
      message: 'Queue statistics retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const processQueue = async (req, res) => {
  try {
    const { batchSize = 100 } = req.body;
    
    // Validate batch size
    if (batchSize > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Batch size cannot exceed 1000'
      });
    }

    // Process queue batch
    const processQuery = `SELECT * FROM process_sensor_queue_batch($1)`;
    const result = await pool.query(processQuery, [batchSize]);
    
    const processResult = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        processedCount: processResult.processed_count,
        errorCount: processResult.error_count,
        batchSize: batchSize
      },
      message: `Processed ${processResult.processed_count} sensor data items`
    });

  } catch (error) {
    console.error('Error processing queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process sensor queue',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  ingestTirePressureData,
  ingestHubTemperatureData,
  ingestDeviceStatusData,
  ingestLockStateData,
  ingestRawSensorData,
  getQueueStats,
  processQueue
};
