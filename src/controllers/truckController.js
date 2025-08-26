const pool = require('../config/database');

const getAllTrucks = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 50, 
      search,
      minFuel,
      maxFuel,
      hasAlerts
    } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.engine_hours as "engineHours",
        t.odometer,
        t.last_maintenance as "lastMaintenance",
        t.updated_at as "lastUpdate",
        tm.name as model_name,
        tm.manufacturer,
        (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as alert_count
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `;
    
    const queryParams = [];
    let paramCount = 0;
    
    // Apply filters
    if (status && status !== 'all') {
      paramCount++;
      query += ` AND t.status = $${paramCount}`;
      queryParams.push(status);
    }
    
    if (search) {
      paramCount++;
      query += ` AND (t.truck_number ILIKE $${paramCount} OR tm.name ILIKE $${paramCount} OR t.driver_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }
    
    if (minFuel) {
      paramCount++;
      query += ` AND t.fuel_percentage >= $${paramCount}`;
      queryParams.push(parseInt(minFuel));
    }
    
    if (maxFuel) {
      paramCount++;
      query += ` AND t.fuel_percentage <= $${paramCount}`;
      queryParams.push(parseInt(maxFuel));
    }
    
    if (hasAlerts === 'true') {
      query += ` AND EXISTS (SELECT 1 FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false)`;
    }
    
    // Get total count before pagination
    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered_trucks`;
    const countResult = await pool.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` ORDER BY t.updated_at DESC`;
    const offset = (page - 1) * limit;
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    queryParams.push(parseInt(limit));
    
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    queryParams.push(offset);
    
    // Execute main query
    const result = await pool.query(query, queryParams);
    
    // Transform data to match frontend format
    const trucks = result.rows.map(row => ({
      id: row.id,
      truckNumber: row.truckNumber,
      model: row.model_name,
      manufacturer: row.manufacturer,
      status: row.status,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
      },
      speed: parseFloat(row.speed) || 0,
      heading: parseInt(row.heading) || 0,
      fuel: parseFloat(row.fuel) || 0,
      payload: parseFloat(row.payload) || 0,
      driver: row.driver,
      engineHours: parseInt(row.engineHours) || 0,
      odometer: parseInt(row.odometer) || 0,
      lastMaintenance: row.lastMaintenance,
      lastUpdate: row.lastUpdate,
      alerts: [],
      alertCount: parseInt(row.alert_count) || 0
    }));
    
    // Get summary stats
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance
      FROM trucks
    `);
    
    const summary = summaryResult.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        trucks: trucks,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total: totalCount,
          total_pages: Math.ceil(totalCount / limit)
        },
        summary: {
          total_trucks: parseInt(summary.total),
          active: parseInt(summary.active),
          inactive: parseInt(summary.inactive),
          maintenance: parseInt(summary.maintenance)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getTruckById = async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    
    const query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.engine_hours as "engineHours",
        t.odometer,
        t.last_maintenance as "lastMaintenance",
        t.updated_at as "lastUpdate",
        tm.name as model_name,
        tm.manufacturer,
        tm.capacity_tons as capacity,
        tm.fuel_tank_capacity as fuel_tank
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.id = $1
    `;
    
    const result = await pool.query(query, [truckId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    const row = result.rows[0];
    
    // Get tire pressures
    const tireQuery = `
      SELECT 
        tire_position as position,
        tire_number as "tireNumber",
        pressure_psi as pressure,
        status,
        temperature,
        recorded_at as "lastUpdated"
      FROM tire_pressures 
      WHERE truck_id = $1 
      ORDER BY tire_number
    `;
    
    const tireResult = await pool.query(tireQuery, [truckId]);
    
    // Get alerts
    const alertQuery = `
      SELECT 
        alert_type as type,
        severity,
        message,
        is_resolved as "isResolved",
        created_at as "createdAt"
      FROM truck_alerts 
      WHERE truck_id = $1 
      ORDER BY created_at DESC
    `;
    
    const alertResult = await pool.query(alertQuery, [truckId]);
    
    const truck = {
      id: row.id,
      truckNumber: row.truckNumber,
      model: row.model_name,
      manufacturer: row.manufacturer,
      capacity: row.capacity,
      fuelTank: row.fuel_tank,
      status: row.status,
      location: {
        type: 'Point',
        coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
      },
      speed: parseFloat(row.speed) || 0,
      heading: parseInt(row.heading) || 0,
      fuel: parseFloat(row.fuel) || 0,
      payload: parseFloat(row.payload) || 0,
      driver: row.driver,
      engineHours: parseInt(row.engineHours) || 0,
      odometer: parseInt(row.odometer) || 0,
      lastMaintenance: row.lastMaintenance,
      lastUpdate: row.lastUpdate,
      tirePressures: tireResult.rows,
      alerts: alertResult.rows
    };
    
    res.status(200).json({
      success: true,
      data: truck
    });
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getTruckTires = async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    
    // Get truck info
    const truckQuery = `
      SELECT truck_number as "truckNumber"
      FROM trucks 
      WHERE id = $1
    `;
    
    const truckResult = await pool.query(truckQuery, [truckId]);
    
    if (truckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    // Get tire pressures
    const tireQuery = `
      SELECT 
        tire_position as position,
        tire_number as "tireNumber",
        pressure_psi as pressure,
        status,
        temperature,
        recorded_at as "lastUpdated"
      FROM tire_pressures 
      WHERE truck_id = $1 
      ORDER BY tire_number
    `;
    
    const tireResult = await pool.query(tireQuery, [truckId]);
    
    res.status(200).json({
      success: true,
      data: {
        truckId: truckId,
        truckNumber: truckResult.rows[0].truckNumber,
        tirePressures: tireResult.rows,
        lastUpdated: new Date()
      }
    });
  } catch (error) {
    console.error('Error fetching tire pressures:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const getRealtimeLocations = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT 
        t.id,
        t.truck_number as "truckNumber",
        t.status,
        t.latitude,
        t.longitude,
        t.speed,
        t.heading,
        t.fuel_percentage as fuel,
        t.payload_tons as payload,
        t.driver_name as driver,
        t.updated_at as "lastUpdate",
        tm.name as model,
        (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as alert_count
      FROM trucks t
      LEFT JOIN truck_models tm ON t.model_id = tm.id
      WHERE t.latitude IS NOT NULL AND t.longitude IS NOT NULL
    `;
    
    const queryParams = [];
    
    if (status && status !== 'all') {
      query += ` AND t.status = $1`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY t.updated_at DESC`;
    
    const result = await pool.query(query, queryParams);
    
    const geoJsonData = {
      type: "FeatureCollection",
      features: result.rows.map(row => ({
        type: "Feature",
        properties: {
          id: row.id,
          truckNumber: row.truckNumber,
          model: row.model,
          status: row.status,
          speed: parseFloat(row.speed) || 0,
          heading: parseInt(row.heading) || 0,
          fuel: parseFloat(row.fuel) || 0,
          payload: parseFloat(row.payload) || 0,
          driver: row.driver,
          lastUpdate: row.lastUpdate,
          alertCount: parseInt(row.alert_count) || 0
        },
        geometry: {
          type: "Point",
          coordinates: [parseFloat(row.longitude || 0), parseFloat(row.latitude || 0)]
        }
      }))
    };
    
    res.status(200).json({
      success: true,
      data: geoJsonData
    });
  } catch (error) {
    console.error('Error fetching realtime locations:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

const updateTruckStatus = async (req, res) => {
  try {
    const truckId = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or maintenance'
      });
    }
    
    const updateQuery = `
      UPDATE trucks 
      SET status = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(updateQuery, [status, truckId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    const updatedTruck = result.rows[0];
    
    // Broadcast update to all connected clients via WebSocket
    try {
      const { broadcastTruckStatusUpdate } = require('../services/websocketService');
      broadcastTruckStatusUpdate({
        truckId: truckId,
        status: status,
        timestamp: new Date()
      });
    } catch (wsError) {
      console.log('WebSocket broadcast failed:', wsError.message);
      // Continue without WebSocket broadcast
    }
    
    res.status(200).json({
      success: true,
      message: 'Truck status updated successfully',
      data: {
        id: updatedTruck.id,
        truckNumber: updatedTruck.truck_number,
        status: updatedTruck.status,
        lastUpdate: updatedTruck.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating truck status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllTrucks,
  getTruckById,
  getTruckTires,
  getRealtimeLocations,
  updateTruckStatus
};