-- =========================
-- Fleet Management Database Schema
-- Complete schema from truck_tracking.md
-- =========================

-- Extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Fleet grouping (opsional, untuk site/region)
-- =========================
CREATE TABLE IF NOT EXISTS fleet_group (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  site        TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  created_by  UUID,
  updated_by  UUID
);

-- =========================
-- Master: Truck
-- =========================
CREATE TABLE IF NOT EXISTS truck (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_number      TEXT UNIQUE NOT NULL,
  vin               TEXT UNIQUE,
  name              TEXT,
  model             TEXT,
  year              INT,
  tire_config       TEXT, -- misalnya "10 ban"
  fleet_group_id    UUID REFERENCES fleet_group(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by        UUID,
  updated_by        UUID
);

-- =========================
-- Device (gateway IoT, bisa auto-register dari data sensor)
-- =========================
CREATE TABLE IF NOT EXISTS device (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id    UUID REFERENCES truck(id),  -- nullable, bisa di-assign nanti
  sn          TEXT UNIQUE NOT NULL,       -- SN device dari JSON
  sim_number  TEXT,                       -- dari JSON simNumber
  status      TEXT DEFAULT 'unregistered' CHECK (status IN ('registered','unregistered','inactive')),
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT now(),
  installed_at TIMESTAMPTZ,
  removed_at   TIMESTAMPTZ,
  created_by   UUID,
  updated_by   UUID
);
CREATE INDEX IF NOT EXISTS idx_device_sn ON device (sn);
CREATE INDEX IF NOT EXISTS idx_device_sim_number ON device (sim_number);
-- CREATE INDEX IF NOT EXISTS idx_device_status ON device (status);

-- =========================
-- Tire position mapping (untuk fleksibilitas tireNo)
-- =========================
CREATE TABLE IF NOT EXISTS tire_position_config (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  truck_id    UUID REFERENCES truck(id),
  tire_no     INT NOT NULL,               -- dari JSON tireNo
  position_name TEXT,                     -- "Front Left", "Rear Right 1", etc
  wheel_type  TEXT CHECK (wheel_type IN ('steer','drive','trailer')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(truck_id, tire_no)
);

-- =========================
-- Raw sensor data (semua data masuk sini dulu)
-- =========================
CREATE TABLE IF NOT EXISTS sensor_data_raw (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn     TEXT NOT NULL,             -- dari JSON sn
  cmd_type      TEXT NOT NULL,             -- "tpdata", "hubdata", "device", "state"
  truck_id      UUID REFERENCES truck(id), -- nullable, bisa di-assign nanti
  tire_no       INT,                       -- dari JSON tireNo
  raw_json      JSONB NOT NULL,            -- simpan semua data JSON
  processed     BOOLEAN DEFAULT FALSE,     -- flag untuk processing
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_device_sn ON sensor_data_raw (device_sn, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_cmd_type ON sensor_data_raw (cmd_type, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_raw_processed ON sensor_data_raw (processed, received_at DESC);

-- =========================
-- Tire pressure events (processed dari raw data)
-- =========================
CREATE TABLE IF NOT EXISTS tire_pressure_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  tire_no       INT NOT NULL,              -- nomor ban dari JSON
  pressure_kpa  REAL,                      -- tiprValue
  temp_celsius  REAL,                      -- tempValue
  ex_type       TEXT,                      -- "1,3" format
  battery_level SMALLINT,                  -- bat
  sim_number    TEXT,                      -- simNumber
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tire_pressure_event_truck_id ON tire_pressure_event (truck_id, changed_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_tire_pressure_event_device_sn ON tire_pressure_event (device_sn, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_tire_pressure_event_tire_no ON tire_pressure_event (tire_no, changed_at DESC);

-- =========================
-- Hub temperature events
-- =========================
CREATE TABLE IF NOT EXISTS hub_temperature_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  tire_no       INT NOT NULL,
  temp_celsius  REAL,
  ex_type       TEXT,
  battery_level SMALLINT,
  sim_number    TEXT,
  changed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hub_temperature_event_truck_id ON hub_temperature_event (truck_id, changed_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_hub_temperature_event_device_sn ON hub_temperature_event (device_sn, changed_at DESC);

-- =========================
-- Device status events (GPS + battery + lock)
-- =========================
CREATE TABLE IF NOT EXISTS device_status_event (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  longitude     DECIMAL(10,7),
  latitude      DECIMAL(10,7),
  host_bat      SMALLINT,                  -- bat1
  repeater1_bat SMALLINT,                  -- bat2
  repeater2_bat SMALLINT,                  -- bat3
  lock_state    SMALLINT,                  -- lock (0/1)
  reported_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_device_status_event_truck_id ON device_status_event (truck_id, reported_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_device_status_event_device_sn ON device_status_event (device_sn, reported_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_device_status_event_location ON device_status_event USING GIST (ST_Point(longitude, latitude));

-- =========================
-- Lock events
-- =========================
CREATE TABLE IF NOT EXISTS lock_event (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id UUID REFERENCES sensor_data_raw(id),
  device_sn   TEXT NOT NULL,
  truck_id    UUID REFERENCES truck(id),
  is_lock     SMALLINT,                    -- 0 atau 1
  reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lock_event_truck_id ON lock_event (truck_id, reported_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_lock_event_device_sn ON lock_event (device_sn, reported_at DESC);

-- =========================
-- GPS Position (partitioned by month for performance)
-- =========================
CREATE TABLE IF NOT EXISTS gps_position (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_sn     TEXT NOT NULL,
  truck_id      UUID REFERENCES truck(id),
  longitude     DECIMAL(10,7) NOT NULL,
  latitude      DECIMAL(10,7) NOT NULL,
  pos           GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_Point(longitude, latitude)::geography) STORED,
  accuracy_m    REAL,                     -- GPS accuracy in meters
  heading       REAL,                     -- 0-360 degrees
  speed_kmh     REAL,                     -- calculated or reported speed
  altitude_m    REAL,                     -- elevation
  is_valid      BOOLEAN DEFAULT TRUE,     -- GPS validation flag
  distance_m    REAL,                     -- distance from previous point
  calculated_speed REAL,                  -- calculated from distance/time
  recorded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
) PARTITION BY RANGE (recorded_at);

-- Create monthly partitions (example for current year)
CREATE TABLE IF NOT EXISTS gps_position_2025_01 PARTITION OF gps_position
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS gps_position_2025_02 PARTITION OF gps_position
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS gps_position_2025_03 PARTITION OF gps_position
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Indexes for GPS position
-- CREATE INDEX IF NOT EXISTS idx_gps_position_truck_id ON gps_position (truck_id, recorded_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_gps_position_device_sn ON gps_position (device_sn, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_gps_position_spatial ON gps_position USING GIST (pos);
-- CREATE INDEX IF NOT EXISTS idx_gps_position_time ON gps_position (recorded_at DESC);

-- =========================
-- Users table for authentication
-- =========================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@fleet.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- =========================
-- Device truck assignment history
-- =========================
CREATE TABLE IF NOT EXISTS device_truck_assignment (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   UUID REFERENCES device(id),
  truck_id    UUID REFERENCES truck(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  removed_at  TIMESTAMPTZ,
  removed_by  UUID REFERENCES users(id),
  is_active   BOOLEAN DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_device_truck_assignment_device_id ON device_truck_assignment (device_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_truck_assignment_truck_id ON device_truck_assignment (truck_id, assigned_at DESC);

-- =========================
-- FUNCTIONS AND TRIGGERS
-- =========================

-- Auto-register device function
CREATE OR REPLACE FUNCTION auto_register_device(device_sn TEXT, sim_number TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    device_uuid UUID;
BEGIN
    -- Cek apakah device sudah ada
    SELECT id INTO device_uuid FROM device WHERE sn = device_sn;
    
    IF device_uuid IS NULL THEN
        -- Insert device baru
        INSERT INTO device (sn, sim_number, status, first_seen, last_seen)
        VALUES (device_sn, sim_number, 'unregistered', now(), now())
        RETURNING id INTO device_uuid;
    ELSE
        -- Update last_seen dan sim_number jika ada
        UPDATE device 
        SET last_seen = now(),
            sim_number = COALESCE(auto_register_device.sim_number, device.sim_number)
        WHERE id = device_uuid;
    END IF;
    
    RETURN device_uuid;
END;
$$ LANGUAGE plpgsql;

-- GPS smoothing function
CREATE OR REPLACE FUNCTION validate_gps_point(
    longitude DECIMAL(10,7), 
    latitude DECIMAL(10,7),
    previous_longitude DECIMAL(10,7) DEFAULT NULL,
    previous_latitude DECIMAL(10,7) DEFAULT NULL,
    max_distance_m REAL DEFAULT 50000 -- 50km max jump
) RETURNS BOOLEAN AS $$
BEGIN
    -- Basic coordinate validation
    IF longitude IS NULL OR latitude IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF longitude < -180 OR longitude > 180 OR latitude < -90 OR latitude > 90 THEN
        RETURN FALSE;
    END IF;
    
    -- Distance validation if previous point exists
    IF previous_longitude IS NOT NULL AND previous_latitude IS NOT NULL THEN
        IF ST_Distance(
            ST_Point(longitude, latitude)::geography,
            ST_Point(previous_longitude, previous_latitude)::geography
        ) > max_distance_m THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Sensor processing queue table
CREATE TABLE IF NOT EXISTS sensor_processing_queue (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_data_id   UUID REFERENCES sensor_data_raw(id),
  priority      INT DEFAULT 1,              -- 1=high (GPS), 2=medium, 3=low
  attempts      INT DEFAULT 0,
  max_attempts  INT DEFAULT 3,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  processed_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sensor_processing_queue_priority ON sensor_processing_queue (priority, created_at);
CREATE INDEX IF NOT EXISTS idx_sensor_processing_queue_processed ON sensor_processing_queue (processed_at);

-- Lightweight queue trigger
CREATE OR REPLACE FUNCTION queue_sensor_processing()
RETURNS TRIGGER AS $$
BEGIN
    -- Determine priority based on cmd_type
    INSERT INTO sensor_processing_queue (raw_data_id, priority)
    VALUES (
        NEW.id,
        CASE NEW.cmd_type
            WHEN 'device' THEN 1  -- GPS data has highest priority
            WHEN 'tpdata' THEN 2  -- Tire pressure medium priority
            WHEN 'hubdata' THEN 2 -- Hub temp medium priority
            WHEN 'state' THEN 3   -- Lock state low priority
            ELSE 2
        END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for queue processing
DROP TRIGGER IF EXISTS trigger_queue_sensor_processing ON sensor_data_raw;
CREATE TRIGGER trigger_queue_sensor_processing
    AFTER INSERT ON sensor_data_raw
    FOR EACH ROW
    EXECUTE FUNCTION queue_sensor_processing();

-- Batch processing function
CREATE OR REPLACE FUNCTION process_sensor_queue_batch(batch_size INT DEFAULT 100)
RETURNS TABLE(processed_count INT, error_count INT) AS $$
DECLARE
    queue_item RECORD;
    processed INT := 0;
    errors INT := 0;
    json_data JSONB;
    device_uuid UUID;
    truck_uuid UUID;
BEGIN
    -- Process items from queue with SKIP LOCKED for concurrency
    FOR queue_item IN
        SELECT q.id as queue_id, q.raw_data_id, r.device_sn, r.cmd_type, r.raw_json
        FROM sensor_processing_queue q
        JOIN sensor_data_raw r ON q.raw_data_id = r.id
        WHERE q.processed_at IS NULL 
        AND q.attempts < q.max_attempts
        ORDER BY q.priority, q.created_at
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    LOOP
        BEGIN
            json_data := queue_item.raw_json;
            
            -- Auto-register device
            SELECT auto_register_device(
                queue_item.device_sn, 
                json_data->'data'->>'simNumber'
            ) INTO device_uuid;
            
            -- Get truck_id if device is assigned
            SELECT truck_id INTO truck_uuid FROM device WHERE sn = queue_item.device_sn;
            
            -- Update truck_id in raw data if found
            IF truck_uuid IS NOT NULL THEN
                UPDATE sensor_data_raw SET truck_id = truck_uuid WHERE id = queue_item.raw_data_id;
            END IF;
            
            -- Process based on cmd_type
            CASE queue_item.cmd_type
                WHEN 'device' THEN
                    -- Insert device status event
                    INSERT INTO device_status_event (
                        raw_data_id, device_sn, truck_id, longitude, latitude,
                        host_bat, repeater1_bat, repeater2_bat, lock_state, reported_at
                    ) VALUES (
                        queue_item.raw_data_id, queue_item.device_sn, truck_uuid,
                        (json_data->'data'->>'lng')::DECIMAL(10,7),
                        (json_data->'data'->>'lat')::DECIMAL(10,7),
                        (json_data->'data'->>'bat1')::SMALLINT,
                        (json_data->'data'->>'bat2')::SMALLINT,
                        (json_data->'data'->>'bat3')::SMALLINT,
                        (json_data->'data'->>'lock')::SMALLINT,
                        now()
                    );
                    
                    -- Insert GPS position if coordinates are valid
                    IF validate_gps_point(
                        (json_data->'data'->>'lng')::DECIMAL(10,7),
                        (json_data->'data'->>'lat')::DECIMAL(10,7)
                    ) THEN
                        INSERT INTO gps_position (
                            device_sn, truck_id, longitude, latitude, recorded_at
                        ) VALUES (
                            queue_item.device_sn, truck_uuid,
                            (json_data->'data'->>'lng')::DECIMAL(10,7),
                            (json_data->'data'->>'lat')::DECIMAL(10,7),
                            now()
                        );
                    END IF;
                    
                WHEN 'tpdata' THEN
                    INSERT INTO tire_pressure_event (
                        raw_data_id, device_sn, truck_id, tire_no, pressure_kpa,
                        temp_celsius, ex_type, battery_level, sim_number, changed_at
                    ) VALUES (
                        queue_item.raw_data_id, queue_item.device_sn, truck_uuid,
                        (json_data->'data'->>'tireNo')::INT,
                        (json_data->'data'->>'tiprValue')::REAL,
                        (json_data->'data'->>'tempValue')::REAL,
                        json_data->'data'->>'exType',
                        (json_data->'data'->>'bat')::SMALLINT,
                        json_data->'data'->>'simNumber',
                        now()
                    );
                    
                WHEN 'hubdata' THEN
                    INSERT INTO hub_temperature_event (
                        raw_data_id, device_sn, truck_id, tire_no, temp_celsius,
                        ex_type, battery_level, sim_number, changed_at
                    ) VALUES (
                        queue_item.raw_data_id, queue_item.device_sn, truck_uuid,
                        (json_data->'data'->>'tireNo')::INT,
                        (json_data->'data'->>'tempValue')::REAL,
                        json_data->'data'->>'exType',
                        (json_data->'data'->>'bat')::SMALLINT,
                        json_data->'data'->>'simNumber',
                        now()
                    );
                    
                WHEN 'state' THEN
                    INSERT INTO lock_event (
                        raw_data_id, device_sn, truck_id, is_lock, reported_at
                    ) VALUES (
                        queue_item.raw_data_id, queue_item.device_sn, truck_uuid,
                        (json_data->'data'->>'is_lock')::SMALLINT,
                        now()
                    );
            END CASE;
            
            -- Mark as processed
            UPDATE sensor_data_raw SET processed = TRUE, processed_at = now() 
            WHERE id = queue_item.raw_data_id;
            
            UPDATE sensor_processing_queue SET processed_at = now()
            WHERE id = queue_item.queue_id;
            
            processed := processed + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Handle errors
            UPDATE sensor_processing_queue 
            SET attempts = attempts + 1, error_message = SQLERRM
            WHERE id = queue_item.queue_id;
            
            errors := errors + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT processed, errors;
END;
$$ LANGUAGE plpgsql;

-- Queue statistics function
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE(
    pending_items BIGINT,
    processed_items BIGINT,
    error_items BIGINT,
    avg_processing_time_ms NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE processed_at IS NULL) as pending_items,
        COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed_items,
        COUNT(*) FILTER (WHERE attempts >= max_attempts) as error_items,
        AVG(EXTRACT(EPOCH FROM (processed_at - created_at)) * 1000)::NUMERIC as avg_processing_time_ms
    FROM sensor_processing_queue
    WHERE created_at >= NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- =========================
-- VIEWS FOR REAL-TIME DATA
-- =========================

-- Latest truck positions
CREATE OR REPLACE VIEW latest_truck_position AS
SELECT DISTINCT ON (truck_id)
    truck_id,
    device_sn,
    longitude,
    latitude,
    pos,
    heading,
    speed_kmh,
    recorded_at
FROM gps_position
WHERE truck_id IS NOT NULL
ORDER BY truck_id, recorded_at DESC;

-- Real-time truck tracking with device info
CREATE OR REPLACE VIEW real_time_truck_tracking AS
SELECT 
    t.id as truck_id,
    t.plate_number,
    t.name as truck_name,
    d.sn as device_sn,
    'registered' as device_status,
    ltp.longitude,
    ltp.latitude,
    ltp.heading,
    ltp.speed_kmh,
    ltp.recorded_at as last_position_at,
    CASE 
        WHEN ltp.recorded_at > NOW() - INTERVAL '5 minutes' THEN 'online'
        WHEN ltp.recorded_at > NOW() - INTERVAL '30 minutes' THEN 'idle'
        ELSE 'offline'
    END as connection_status
FROM truck t
LEFT JOIN device d ON t.id = d.truck_id
LEFT JOIN latest_truck_position ltp ON t.id = ltp.truck_id;

-- Performance monitoring view
CREATE OR REPLACE VIEW processing_performance AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as total_items,
    COUNT(*) FILTER (WHERE processed_at IS NOT NULL) as processed_items,
    COUNT(*) FILTER (WHERE attempts >= max_attempts) as failed_items,
    AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM sensor_processing_queue
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- =========================
-- SAMPLE DATA
-- =========================

-- Insert sample fleet group
INSERT INTO fleet_group (name, site, description) 
VALUES ('PT Borneo Indobara', 'Kalimantan', 'Main mining fleet')
ON CONFLICT DO NOTHING;

-- Insert sample trucks
DO $$
DECLARE
    fleet_id UUID;
BEGIN
    SELECT id INTO fleet_id FROM fleet_group WHERE name = 'PT Borneo Indobara' LIMIT 1;
    
    INSERT INTO truck (plate_number, name, model, year, tire_config, fleet_group_id) VALUES
    ('B 1234 AB', 'Truck 001', 'Caterpillar 797F', 2020, '6 tires', fleet_id),
    ('B 1235 AB', 'Truck 002', 'Caterpillar 797F', 2021, '6 tires', fleet_id),
    ('B 1236 AB', 'Truck 003', 'Komatsu 980E-4', 2019, '6 tires', fleet_id)
    ON CONFLICT (plate_number) DO NOTHING;
END $$;

-- Insert sample devices (will be assigned to trucks later)
-- Temporarily insert with NULL truck_id, will be updated in assignment section

-- Insert and assign devices to trucks
DO $$
DECLARE
    truck_rec RECORD;
    fleet_id UUID;
BEGIN
    SELECT id INTO fleet_id FROM fleet_group WHERE name = 'PT Borneo Indobara' LIMIT 1;
    
    -- Insert devices with truck assignments
    FOR truck_rec IN SELECT id, plate_number FROM truck WHERE fleet_group_id = fleet_id ORDER BY plate_number LOOP
        INSERT INTO device (sn, sim_number, truck_id) VALUES
        (CASE 
            WHEN truck_rec.plate_number = 'B 1234 AB' THEN '3462682374'
            WHEN truck_rec.plate_number = 'B 1235 AB' THEN '3462682375'
            WHEN truck_rec.plate_number = 'B 1236 AB' THEN '3462682376'
        END,
        CASE 
            WHEN truck_rec.plate_number = 'B 1234 AB' THEN '1234567890'
            WHEN truck_rec.plate_number = 'B 1235 AB' THEN '1234567891'
            WHEN truck_rec.plate_number = 'B 1236 AB' THEN '1234567892'
        END,
        truck_rec.id)
        ON CONFLICT (sn) DO UPDATE SET truck_id = EXCLUDED.truck_id;
    END LOOP;
END $$;

COMMIT;
