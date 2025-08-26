-- Update database schema to add missing tables and columns
-- This ensures compatibility with the existing controller code

-- First, add latitude and longitude columns if they don't exist
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add PostGIS geometry column for compatibility (optional but recommended)
ALTER TABLE trucks 
ADD COLUMN IF NOT EXISTS current_location GEOMETRY(POINT, 4326);

-- Create indexes on the new columns for better performance
CREATE INDEX IF NOT EXISTS idx_trucks_latitude ON trucks (latitude);
CREATE INDEX IF NOT EXISTS idx_trucks_longitude ON trucks (longitude);
CREATE INDEX IF NOT EXISTS idx_trucks_lat_lng ON trucks (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_trucks_location ON trucks USING GIST (current_location);

-- Update the location_history table as well
ALTER TABLE location_history 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add PostGIS geometry column for location_history
ALTER TABLE location_history 
ADD COLUMN IF NOT EXISTS location GEOMETRY(POINT, 4326);

-- Create indexes for location history
CREATE INDEX IF NOT EXISTS idx_location_history_latitude ON location_history (latitude);
CREATE INDEX IF NOT EXISTS idx_location_history_longitude ON location_history (longitude);
CREATE INDEX IF NOT EXISTS idx_location_history_location ON location_history USING GIST (location);

-- Create mining_zones table if it doesn't exist
CREATE TABLE IF NOT EXISTS mining_zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    boundary GEOMETRY(POLYGON, 4326) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on mining zones
CREATE INDEX IF NOT EXISTS idx_mining_zones_boundary ON mining_zones USING GIST (boundary);

-- Create a trigger to automatically update PostGIS geometry when lat/lng is updated
CREATE OR REPLACE FUNCTION update_truck_geometry()
RETURNS TRIGGER AS $$
BEGIN
    -- Update PostGIS geometry when latitude or longitude changes
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.current_location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS truck_geometry_update ON trucks;
CREATE TRIGGER truck_geometry_update
    BEFORE INSERT OR UPDATE ON trucks
    FOR EACH ROW
    EXECUTE FUNCTION update_truck_geometry();

-- Similar trigger for location_history
CREATE OR REPLACE FUNCTION update_location_history_geometry()
RETURNS TRIGGER AS $$
BEGIN
    -- Update PostGIS geometry when latitude or longitude changes
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists and recreate it
DROP TRIGGER IF EXISTS location_history_geometry_update ON location_history;
CREATE TRIGGER location_history_geometry_update
    BEFORE INSERT OR UPDATE ON location_history
    FOR EACH ROW
    EXECUTE FUNCTION update_location_history_geometry();

-- Update the truck_summary view to use lat/lng columns
DROP VIEW IF EXISTS truck_summary;
CREATE VIEW truck_summary AS
SELECT 
    t.id,
    t.truck_number,
    tm.name as model_name,
    tm.manufacturer,
    t.status,
    t.longitude,
    t.latitude,
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

-- Create function to check if truck is within mining area using lat/lng
CREATE OR REPLACE FUNCTION is_truck_in_zone_latlng(truck_lat DECIMAL, truck_lng DECIMAL, zone_name VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM mining_zones 
        WHERE name = zone_name 
        AND is_active = true 
        AND ST_Within(ST_SetSRID(ST_MakePoint(truck_lng, truck_lat), 4326), boundary)
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to get trucks in zone using lat/lng
CREATE OR REPLACE FUNCTION get_trucks_in_zone_latlng(zone_name VARCHAR)
RETURNS TABLE (
    truck_id INTEGER,
    truck_number VARCHAR(20),
    status VARCHAR(20),
    distance_from_center DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.truck_number,
        t.status,
        ST_Distance(
            ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326),
            ST_Centroid(mz.boundary)
        )::DECIMAL as distance_from_center
    FROM trucks t
    JOIN mining_zones mz ON ST_Within(
        ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326),
        mz.boundary
    )
    WHERE mz.name = zone_name 
        AND mz.is_active = true 
        AND t.latitude IS NOT NULL 
        AND t.longitude IS NOT NULL
    ORDER BY distance_from_center ASC;
END;
$$ LANGUAGE plpgsql;

-- Clear any existing PT INDOBARA zones
DELETE FROM mining_zones WHERE name LIKE '%PT INDOBARA%' OR name LIKE '%Main Pit%' OR name LIKE '%Processing Plant%';

-- Insert PT INDOBARA mining zones
INSERT INTO mining_zones (name, zone_type, boundary, is_active) VALUES
(
    'PT INDOBARA Main Mining Area',
    'extraction',
    ST_GeomFromText('POLYGON((
        115.604399949931505 -3.545400075547209,
        115.604399841131098 -3.608799574004828,
        115.649400029697503 -3.608799509217319,
        115.649400017089704 -3.663100293456181,
        115.617400059975793 -3.663099780174879,
        115.617399737213503 -3.685699156803738,
        115.649299960676103 -3.685699068800897,
        115.649300362663595 -3.699299673460462,
        115.617800049745696 -3.699300020057011,
        115.6177999530113 -3.717199908413447,
        115.658299919322602 -3.717200000114277,
        115.6582955763173 -3.473005894715275,
        115.568699602091598 -3.473001685807625,
        115.568700182646694 -3.464001541662113,
        115.555099828419003 -3.463999391784724,
        115.555099291465098 -3.473003271644793,
        115.532700208403895 -3.473001476768178,
        115.532699846387402 -3.463900605411753,
        115.550701359743002 -3.463902395098822,
        115.5507013482556 -3.454898213912309,
        115.568701230550005 -3.454902873855015,
        115.568700726908006 -3.445900276606981,
        115.577700266719404 -3.445900134950424,
        115.577700019488205 -3.431898966201222,
        115.559699638559096 -3.431899648314737,
        115.559699554334102 -3.437400397522957,
        115.550100512253806 -3.437398099998878,
        115.550099020797404 -3.450002211390146,
        115.532703272530895 -3.449999179807085,
        115.532700637088993 -3.454899270607867,
        115.523702194253303 -3.454899042442723,
        115.523699255391406 -3.463901335023041,
        115.517901076646893 -3.463899658740474,
        115.517900197349306 -3.467902281514015,
        115.514600138263603 -3.467902292826565,
        115.514601072048507 -3.50010155304351,
        115.496599227790597 -3.50009900533689,
        115.496599869340898 -3.518100005601176,
        115.466797471563495 -3.518103740087548,
        115.466801168336701 -3.550206921843847,
        115.442500430814604 -3.550203582815326,
        115.442497952207603 -3.563204681010987,
        115.432199323066001 -3.563200126588743,
        115.432199985374197 -3.575400350745974,
        115.4738011947736 -3.575400021250577,
        115.473797766754501 -3.667299052802766,
        115.478300326726696 -3.667298846101514,
        115.478299650158803 -3.699001512244875,
        115.473698702561805 -3.698999777578339,
        115.473698840205799 -3.706300548298581,
        115.481699037262302 -3.706400782574116,
        115.4817010345688 -3.717102490691376,
        115.505201004278504 -3.717098288779876,
        115.505299006694997 -3.635700209735227,
        115.487399266748895 -3.635701682784649,
        115.487397660302193 -3.545299693708786,
        115.5010009898878 -3.545299520128636,
        115.500999334020705 -3.536300365773843,
        115.514602134835499 -3.536297749737575,
        115.514599616947706 -3.518200242642467,
        115.532599668902606 -3.518200602467881,
        115.532599481961398 -3.509199349853453,
        115.541641655013905 -3.509228095023962,
        115.541599827827795 -3.500200339853857,
        115.577599166446404 -3.500199675893057,
        115.577599706645202 -3.509299212907206,
        115.604599070000702 -3.509301495077436,
        115.604600094546797 -3.518300046458291,
        115.613499987067996 -3.518300064005411,
        115.613499543131596 -3.54540116002996,
        115.604399949931505 -3.545400075547209
    ))', 4326),
    true
),
(
    'PT INDOBARA Processing Area',
    'processing',
    ST_GeomFromText('POLYGON((
        115.55 -3.65,
        115.60 -3.65,
        115.60 -3.60,
        115.55 -3.60,
        115.55 -3.65
    ))', 4326),
    true
),
(
    'PT INDOBARA Maintenance Area',
    'maintenance',
    ST_GeomFromText('POLYGON((
        115.62 -3.52,
        115.65 -3.52,
        115.65 -3.50,
        115.62 -3.50,
        115.62 -3.52
    ))', 4326),
    true
),
(
    'PT INDOBARA Waste Dump',
    'disposal',
    ST_GeomFromText('POLYGON((
        115.48 -3.70,
        115.52 -3.70,
        115.52 -3.68,
        115.48 -3.68,
        115.48 -3.70
    ))', 4326),
    true
),
(
    'PT INDOBARA Coal Stockpile',
    'storage',
    ST_GeomFromText('POLYGON((
        115.58 -3.55,
        115.62 -3.55,
        115.62 -3.53,
        115.58 -3.53,
        115.58 -3.55
    ))', 4326),
    true
);

-- Show summary of changes
SELECT 'Database schema updated successfully for PT INDOBARA' as status;
SELECT COUNT(*) as total_trucks FROM trucks;
SELECT COUNT(*) as total_zones FROM mining_zones WHERE name LIKE '%PT INDOBARA%';