const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_trucks,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trucks,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_trucks,
        COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_trucks,
        AVG(fuel_percentage)::DECIMAL(5,2) as avg_fuel,
        SUM(CASE WHEN status = 'active' THEN payload_tons ELSE 0 END) as total_payload
      FROM trucks
    `;
    
    const alertQuery = `
      SELECT COUNT(*) as active_alerts
      FROM truck_alerts 
      WHERE is_resolved = false
    `;
    
    const tireQuery = `
      SELECT COUNT(DISTINCT truck_id) as low_tire_trucks
      FROM tire_pressures 
      WHERE status = 'low'
    `;
    
    const [statsResult, alertResult, tireResult] = await Promise.all([
      pool.query(statsQuery),
      pool.query(alertQuery),
      pool.query(tireQuery)
    ]);
    
    const stats = statsResult.rows[0];
    const alerts = alertResult.rows[0];
    const tires = tireResult.rows[0];
    
    res.status(200).json({
      success: true,
      data: {
        totalTrucks: parseInt(stats.total_trucks),
        activeTrucks: parseInt(stats.active_trucks),
        inactiveTrucks: parseInt(stats.inactive_trucks),
        maintenanceTrucks: parseInt(stats.maintenance_trucks),
        averageFuel: parseFloat(stats.avg_fuel) || 0,
        totalPayload: parseFloat(stats.total_payload) || 0,
        alertsCount: parseInt(alerts.active_alerts),
        lowTirePressureCount: parseInt(tires.low_tire_trucks)
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats
};