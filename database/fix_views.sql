-- Fix SQL errors in complete_schema.sql
-- Error 1: Line 508 - device_sn column doesn't exist, should be device_id
-- Error 2: Line 530 - longitude column reference issue in view

-- Drop existing problematic views
DROP VIEW IF EXISTS latest_truck_position CASCADE;
DROP VIEW IF EXISTS real_time_truck_tracking CASCADE;
DROP VIEW IF EXISTS processing_performance CASCADE;

-- Check actual gps_position table structure
CREATE OR REPLACE VIEW debug_gps_columns AS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'gps_position' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Fixed latest_truck_position view
-- Based on truck_trackingdummy_schema.sql: gps_position has device_id, not device_sn
CREATE OR REPLACE VIEW latest_truck_position AS
SELECT DISTINCT ON (truck_id)
    truck_id,
    device_id,
    ST_X(pos::geometry) as longitude,
    ST_Y(pos::geometry) as latitude,
    pos,
    heading_deg as heading,
    speed_kph as speed_kmh,
    ts as recorded_at
FROM gps_position
WHERE truck_id IS NOT NULL
ORDER BY truck_id, ts DESC;

-- Fixed real-time truck tracking view
CREATE OR REPLACE VIEW real_time_truck_tracking AS
SELECT 
    t.id as truck_id,
    t.plate_number,
    t.name as truck_name,
    d.sn as device_sn,
    'registered' as device_status,
    ST_X(ltp.pos::geometry) as longitude,
    ST_Y(ltp.pos::geometry) as latitude,
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

-- Fixed performance monitoring view
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
