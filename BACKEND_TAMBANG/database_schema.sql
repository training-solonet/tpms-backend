-- Fleet Management Database Schema
-- Requires PostgreSQL with PostGIS extension

-- Create database (run as superuser)
-- CREATE DATABASE fleet_management;
-- \c fleet_management;

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'operator',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Truck models table
CREATE TABLE truck_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    capacity_tons INTEGER NOT NULL,
    fuel_tank_capacity INTEGER NOT NULL,
    tire_count INTEGER DEFAULT 6,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trucks table
CREATE TABLE trucks (
    id SERIAL PRIMARY KEY,
    truck_number VARCHAR(20) UNIQUE NOT NULL,
    model_id INTEGER REFERENCES truck_models(id),
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'maintenance')) DEFAULT 'active',
    current_location GEOMETRY(POINT, 4326),
    speed DECIMAL(5,2) DEFAULT 0,
    heading INTEGER DEFAULT 0,
    fuel_percentage DECIMAL(5,2) DEFAULT 100,
    payload_tons DECIMAL(6,2) DEFAULT 0,
    driver_name VARCHAR(100),
    engine_hours INTEGER DEFAULT 0,
    odometer INTEGER DEFAULT 0,
    last_maintenance DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on truck locations
CREATE INDEX idx_trucks_location ON trucks USING GIST (current_location);

-- Tire pressures table
CREATE TABLE tire_pressures (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
    tire_position VARCHAR(20) NOT NULL,
    tire_number INTEGER NOT NULL,
    pressure_psi DECIMAL(5,1) NOT NULL,
    status VARCHAR(10) CHECK (status IN ('normal', 'low', 'high')) DEFAULT 'normal',
    temperature DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(truck_id, tire_number)
);

-- Truck locations history (for tracking)
CREATE TABLE location_history (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
    location GEOMETRY(POINT, 4326) NOT NULL,
    speed DECIMAL(5,2) DEFAULT 0,
    heading INTEGER DEFAULT 0,
    fuel_percentage DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on location history
CREATE INDEX idx_location_history_location ON location_history USING GIST (location);
CREATE INDEX idx_location_history_truck_time ON location_history (truck_id, recorded_at DESC);

-- Mining areas/zones table
CREATE TABLE mining_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on mining zones
CREATE INDEX idx_mining_zones_boundary ON mining_zones USING GIST (boundary);

-- Alerts/notifications table
CREATE TABLE truck_alerts (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- Maintenance records table
CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    truck_id INTEGER REFERENCES trucks(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    cost DECIMAL(10,2),
    technician_name VARCHAR(100),
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample truck models
INSERT INTO truck_models (name, manufacturer, capacity_tons, fuel_tank_capacity, tire_count) VALUES
('797F', 'Caterpillar', 400, 4540, 6),
('980E-4', 'Komatsu', 360, 4000, 6),
('T284', 'Liebherr', 400, 4730, 6),
('789D', 'Caterpillar', 195, 2650, 6),
('830E', 'Komatsu', 220, 3030, 6);

-- Insert default user
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@fleet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('operator', 'operator@fleet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator');

-- Insert sample mining zones
INSERT INTO mining_zones (name, zone_type, boundary) VALUES
('Main Pit Area', 'extraction', ST_GeomFromText('POLYGON((107.1000 -6.8000, 107.2000 -6.8000, 107.2000 -6.7000, 107.1000 -6.7000, 107.1000 -6.8000))', 4326)),
('Processing Plant', 'processing', ST_GeomFromText('POLYGON((107.1200 -6.7800, 107.1800 -6.7800, 107.1800 -6.7200, 107.1200 -6.7200, 107.1200 -6.7800))', 4326)),
('Waste Dump', 'disposal', ST_GeomFromText('POLYGON((107.0800 -6.7900, 107.1100 -6.7900, 107.1100 -6.7600, 107.0800 -6.7600, 107.0800 -6.7900))', 4326)),
('Maintenance Area', 'maintenance', ST_GeomFromText('POLYGON((107.1900 -6.7500, 107.1950 -6.7500, 107.1950 -6.7450, 107.1900 -6.7450, 107.1900 -6.7500))', 4326));

-- Create functions for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating timestamps
CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to check if truck is within mining area
CREATE OR REPLACE FUNCTION is_truck_in_zone(truck_location GEOMETRY, zone_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mining_zones 
        WHERE name = zone_name 
        AND is_active = true 
        AND ST_Within(truck_location, boundary)
    );
END;
$$ LANGUAGE plpgsql;

-- View for truck summary with location info
CREATE VIEW truck_summary AS
SELECT 
    t.id,
    t.truck_number,
    tm.name as model_name,
    tm.manufacturer,
    t.status,
    ST_X(t.current_location) as longitude,
    ST_Y(t.current_location) as latitude,
    t.speed,
    t.heading,
    t.fuel_percentage,
    t.payload_tons,
    t.driver_name,
    t.engine_hours,
    t.odometer,
    t.last_maintenance,
    t.updated_at as last_update,
    (SELECT COUNT(*) FROM truck_alerts ta WHERE ta.truck_id = t.id AND ta.is_resolved = false) as active_alerts_count
FROM trucks t
LEFT JOIN truck_models tm ON t.model_id = tm.id;

-- View for tire pressure summary
CREATE VIEW tire_pressure_summary AS
SELECT 
    tp.truck_id,
    t.truck_number,
    COUNT(*) as total_tires,
    COUNT(CASE WHEN tp.status = 'normal' THEN 1 END) as normal_tires,
    COUNT(CASE WHEN tp.status = 'low' THEN 1 END) as low_pressure_tires,
    COUNT(CASE WHEN tp.status = 'high' THEN 1 END) as high_pressure_tires,
    AVG(tp.pressure_psi) as avg_pressure,
    MIN(tp.pressure_psi) as min_pressure,
    MAX(tp.pressure_psi) as max_pressure,
    MAX(tp.recorded_at) as last_reading
FROM tire_pressures tp
JOIN trucks t ON tp.truck_id = t.id
GROUP BY tp.truck_id, t.truck_number;

-- View for dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    COUNT(*) as total_trucks,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_trucks,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_trucks,
    COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_trucks,
    AVG(fuel_percentage) as avg_fuel,
    SUM(payload_tons) as total_payload,
    (SELECT COUNT(*) FROM truck_alerts WHERE is_resolved = false) as total_alerts
FROM trucks;

-- Indexes for performance optimization
CREATE INDEX idx_trucks_status ON trucks (status);
CREATE INDEX idx_trucks_updated_at ON trucks (updated_at DESC);
CREATE INDEX idx_truck_alerts_truck_resolved ON truck_alerts (truck_id, is_resolved);
CREATE INDEX idx_tire_pressures_truck_recorded ON tire_pressures (truck_id, recorded_at DESC);
CREATE INDEX idx_location_history_recorded_at ON location_history (recorded_at DESC);

-- Sample data insertion procedure for 1000 trucks
CREATE OR REPLACE FUNCTION insert_sample_trucks()
RETURNS void AS $
DECLARE
    truck_counter INTEGER := 1;
    random_model_id INTEGER;
    random_status VARCHAR(20);
    random_lat DECIMAL(10, 8);
    random_lng DECIMAL(11, 8);
    truck_location GEOMETRY;
    status_options VARCHAR(20)[] := ARRAY['active', 'inactive', 'maintenance'];
BEGIN
    -- Insert 1000 sample trucks
    WHILE truck_counter <= 1000 LOOP
        -- Random model
        SELECT id INTO random_model_id FROM truck_models ORDER BY RANDOM() LIMIT 1;
        
        -- Random status (70% active, 20% inactive, 10% maintenance)
        CASE 
            WHEN RANDOM() < 0.7 THEN random_status := 'active';
            WHEN RANDOM() < 0.9 THEN random_status := 'inactive';
            ELSE random_status := 'maintenance';
        END CASE;
        
        -- Random location within mining area bounds
        random_lat := -6.8000 + RANDOM() * 0.1000;  -- -6.8 to -6.7
        random_lng := 107.1000 + RANDOM() * 0.1000; -- 107.1 to 107.2
        truck_location := ST_SetSRID(ST_MakePoint(random_lng, random_lat), 4326);
        
        -- Insert truck
        INSERT INTO trucks (
            truck_number,
            model_id,
            status,
            current_location,
            speed,
            heading,
            fuel_percentage,
            payload_tons,
            driver_name,
            engine_hours,
            odometer,
            last_maintenance
        ) VALUES (
            'T' || LPAD(truck_counter::text, 4, '0'),
            random_model_id,
            random_status,
            truck_location,
            CASE WHEN random_status = 'active' THEN RANDOM() * 60 ELSE 0 END,
            FLOOR(RANDOM() * 360),
            20 + RANDOM() * 80, -- 20-100% fuel
            CASE WHEN random_status = 'active' THEN RANDOM() * 400 ELSE 0 END,
            CASE WHEN random_status = 'active' THEN 'Driver ' || truck_counter ELSE NULL END,
            FLOOR(RANDOM() * 10000),
            FLOOR(RANDOM() * 100000),
            CURRENT_DATE - INTERVAL '1 day' * FLOOR(RANDOM() * 30)
        );
        
        truck_counter := truck_counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Inserted % trucks successfully', truck_counter - 1;
END;
$ LANGUAGE plpgsql;

-- Procedure to insert tire pressure data for all trucks
CREATE OR REPLACE FUNCTION insert_tire_pressures()
RETURNS void AS $
DECLARE
    truck_record RECORD;
    tire_positions VARCHAR(20)[] := ARRAY['front_left', 'front_right', 'middle_left', 'middle_right', 'rear_left', 'rear_right'];
    tire_pos VARCHAR(20);
    tire_num INTEGER := 1;
    pressure_value DECIMAL(5,1);
    pressure_status VARCHAR(10);
BEGIN
    -- Insert tire pressure data for each truck
    FOR truck_record IN SELECT id FROM trucks LOOP
        tire_num := 1;
        
        FOREACH tire_pos IN ARRAY tire_positions LOOP
            -- Generate realistic tire pressure (80-120 PSI, mostly normal)
            pressure_value := 80 + RANDOM() * 40;
            
            -- Determine status based on pressure
            IF pressure_value < 85 THEN
                pressure_status := 'low';
            ELSIF pressure_value > 115 THEN
                pressure_status := 'high';
            ELSE
                pressure_status := 'normal';
            END IF;
            
            INSERT INTO tire_pressures (
                truck_id,
                tire_position,
                tire_number,
                pressure_psi,
                status,
                temperature,
                recorded_at
            ) VALUES (
                truck_record.id,
                tire_pos,
                tire_num,
                ROUND(pressure_value, 1),
                pressure_status,
                60 + RANDOM() * 40, -- 60-100°C temperature
                CURRENT_TIMESTAMP - INTERVAL '1 minute' * FLOOR(RANDOM() * 60)
            );
            
            tire_num := tire_num + 1;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Inserted tire pressure data for all trucks';
END;
$ LANGUAGE plpgsql;

-- Procedure to generate some sample alerts
CREATE OR REPLACE FUNCTION insert_sample_alerts()
RETURNS void AS $
DECLARE
    truck_record RECORD;
    alert_types VARCHAR(50)[] := ARRAY['Low Fuel', 'Engine Warning', 'Tire Pressure Low', 'Scheduled Maintenance', 'GPS Signal Lost', 'Overload Warning'];
    severities VARCHAR(20)[] := ARRAY['low', 'medium', 'high'];
    alert_type VARCHAR(50);
    severity VARCHAR(20);
BEGIN
    -- Insert random alerts for about 20% of trucks
    FOR truck_record IN 
        SELECT id FROM trucks 
        WHERE RANDOM() < 0.2 -- 20% of trucks will have alerts
    LOOP
        -- Random alert type and severity
        alert_type := alert_types[1 + FLOOR(RANDOM() * array_length(alert_types, 1))];
        severity := severities[1 + FLOOR(RANDOM() * array_length(severities, 1))];
        
        INSERT INTO truck_alerts (
            truck_id,
            alert_type,
            severity,
            message,
            is_resolved,
            created_at
        ) VALUES (
            truck_record.id,
            alert_type,
            severity,
            'Alert: ' || alert_type || ' detected on truck',
            RANDOM() < 0.3, -- 30% chance alert is already resolved
            CURRENT_TIMESTAMP - INTERVAL '1 hour' * FLOOR(RANDOM() * 24)
        );
    END LOOP;
    
    RAISE NOTICE 'Inserted sample alerts';
END;
$ LANGUAGE plpgsql;

-- Execute the sample data insertion
-- Uncomment the lines below to populate with sample data:
-- SELECT insert_sample_trucks();
-- SELECT insert_tire_pressures();
-- SELECT insert_sample_alerts();

-- Performance monitoring queries
-- Query to find trucks with low tire pressure
CREATE OR REPLACE VIEW trucks_with_tire_issues AS
SELECT 
    t.id,
    t.truck_number,
    t.status,
    COUNT(tp.id) as problematic_tires
FROM trucks t
JOIN tire_pressures tp ON t.id = tp.truck_id
WHERE tp.status IN ('low', 'high')
GROUP BY t.id, t.truck_number, t.status
ORDER BY problematic_tires DESC;

-- Query to find trucks that haven't moved recently (potential issues)
CREATE OR REPLACE VIEW stationary_trucks AS
SELECT 
    t.id,
    t.truck_number,
    t.status,
    t.speed,
    t.updated_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - t.updated_at))/60 as minutes_since_update
FROM trucks t
WHERE t.status = 'active' 
    AND (t.speed = 0 OR t.updated_at < CURRENT_TIMESTAMP - INTERVAL '30 minutes')
ORDER BY t.updated_at ASC;

-- Spatial query to find trucks in specific mining zones
CREATE OR REPLACE FUNCTION get_trucks_in_zone(zone_name VARCHAR)
RETURNS TABLE (
    truck_id INTEGER,
    truck_number VARCHAR(20),
    status VARCHAR(20),
    distance_from_center DECIMAL
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.truck_number,
        t.status,
        ST_Distance(t.current_location, ST_Centroid(mz.boundary))::DECIMAL as distance_from_center
    FROM trucks t
    JOIN mining_zones mz ON ST_Within(t.current_location, mz.boundary)
    WHERE mz.name = zone_name AND mz.is_active = true
    ORDER BY distance_from_center ASC;
END;
$ LANGUAGE plpgsql;