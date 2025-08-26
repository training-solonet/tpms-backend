const pool = require('../config/database');
const { broadcastTruckUpdate } = require('./websocketservice');

const startRealTimeSimulation = (io) => {
  setInterval(async () => {
    try {
      // Get random active trucks to update
      const trucksQuery = `
        SELECT 
          id, 
          longitude, 
          latitude, 
          fuel_percentage, 
          speed, 
          heading
        FROM trucks 
        WHERE status = 'active' 
        AND latitude IS NOT NULL 
        AND longitude IS NOT NULL
        ORDER BY RANDOM() 
        LIMIT $1
      `;
      
      const trucksToUpdate = Math.floor(Math.random() * 50) + 10; // Update 10-60 trucks
      const result = await pool.query(trucksQuery, [trucksToUpdate]);
      
      for (const truck of result.rows) {
        // Ensure all values are properly parsed and within bounds
        const currentLng = parseFloat(truck.longitude) || 107.15;
        const currentLat = parseFloat(truck.latitude) || -6.75;
        const currentFuel = parseFloat(truck.fuel_percentage) || 50;
        const currentSpeed = parseFloat(truck.speed) || 0;
        const currentHeading = parseInt(truck.heading) || 0;
        
        // Simulate movement (small random displacement)
        const newLng = Math.round((currentLng + (Math.random() - 0.5) * 0.001) * 100000) / 100000;
        const newLat = Math.round((currentLat + (Math.random() - 0.5) * 0.001) * 100000) / 100000;
        
        // Ensure bounds are within mining area
        const boundedLng = Math.max(107.1, Math.min(107.2, newLng));
        const boundedLat = Math.max(-6.8, Math.min(-6.7, newLat));
        
        // Generate new values with proper bounds and types
        const newSpeed = Math.round(Math.random() * 60); // 0-60 km/h as integer
        const newHeading = Math.round((currentHeading + (Math.random() - 0.5) * 30) % 360); // Keep within 0-359
        const newFuel = Math.round((Math.max(0, currentFuel - Math.random() * 0.5)) * 100) / 100; // Decimal with 2 places
        
        // Ensure heading is positive
        const finalHeading = newHeading < 0 ? newHeading + 360 : newHeading;
        
        // Update truck in database with proper data types
        await pool.query(`
          UPDATE trucks 
          SET 
            longitude = $1,
            latitude = $2,
            speed = $3, 
            heading = $4, 
            fuel_percentage = $5, 
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $6
        `, [
          boundedLng,           // DECIMAL longitude
          boundedLat,           // DECIMAL latitude  
          newSpeed,             // INTEGER speed
          finalHeading,         // INTEGER heading (0-359)
          newFuel,              // DECIMAL fuel percentage
          truck.id              // INTEGER truck id
        ]);
        
        // Occasionally update tire pressures (10% chance)
        if (Math.random() < 0.1) {
          const pressureChange = Math.round((Math.random() - 0.5) * 4 * 10) / 10; // -2.0 to +2.0 PSI
          
          await pool.query(`
            UPDATE tire_pressures 
            SET 
              pressure_psi = GREATEST(50, LEAST(150, pressure_psi + $1)),
              status = CASE 
                WHEN pressure_psi + $1 < 80 THEN 'low'
                WHEN pressure_psi + $1 > 120 THEN 'high'
                ELSE 'normal'
              END,
              recorded_at = CURRENT_TIMESTAMP
            WHERE truck_id = $2
          `, [pressureChange, truck.id]);
        }
      }
      
      // Broadcast updates to subscribed clients
      broadcastTruckUpdate({
        timestamp: new Date(),
        updatedCount: result.rows.length
      });
      
    } catch (error) {
      console.error('Error updating real-time data:', error);
      // Log detailed error for debugging
      if (error.code) {
        console.error(`Database Error Code: ${error.code}`);
        console.error(`Error Detail: ${error.detail}`);
      }
    }
  }, 5000); // Update every 5 seconds
};

module.exports = {
  startRealTimeSimulation
};