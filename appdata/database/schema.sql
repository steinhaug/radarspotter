-- RadarVarsler PWA Database Schema
-- PostgreSQL 14+ with PostGIS extensions for spatial data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set timezone
SET timezone = 'Europe/Oslo';

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    premium_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(premium_until) WHERE premium_until IS NOT NULL;

-- Radar/Police control PINs table
CREATE TABLE IF NOT EXISTS pins (
    id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
    type VARCHAR(20) NOT NULL CHECK (type IN ('radar', 'police', 'mobile', 'fixed')),
    speed_limit INTEGER CHECK (speed_limit > 0 AND speed_limit <= 200),
    bearing DECIMAL(5, 2) CHECK (bearing >= 0 AND bearing < 360),
    road_name VARCHAR(100),
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    verified_count INTEGER DEFAULT 0,
    reported_false_count INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add spatial and regular indexes for pins
CREATE INDEX IF NOT EXISTS idx_pins_location ON pins USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pins_type ON pins(type);
CREATE INDEX IF NOT EXISTS idx_pins_active ON pins(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_pins_trust_score ON pins(trust_score);
CREATE INDEX IF NOT EXISTS idx_pins_created_by ON pins(created_by);
CREATE INDEX IF NOT EXISTS idx_pins_expires_at ON pins(expires_at);

-- Votes on PINs table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(pin_id, user_id)
);

-- Add indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_pin_id ON votes(pin_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);

-- PIN chat messages table
CREATE TABLE IF NOT EXISTS pin_chat (
    id SERIAL PRIMARY KEY,
    pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (LENGTH(message) > 0 AND LENGTH(message) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for pin_chat
CREATE INDEX IF NOT EXISTS idx_pin_chat_pin_id ON pin_chat(pin_id);
CREATE INDEX IF NOT EXISTS idx_pin_chat_user_id ON pin_chat(user_id);
CREATE INDEX IF NOT EXISTS idx_pin_chat_created_at ON pin_chat(created_at);

-- Warnings sent to users table
CREATE TABLE IF NOT EXISTS warnings_sent (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    pin_id INTEGER REFERENCES pins(id) ON DELETE CASCADE,
    algorithm_used VARCHAR(20) NOT NULL CHECK (algorithm_used IN ('route', 'radius')),
    distance_km DECIMAL(6, 3) NOT NULL,
    user_speed_kmh INTEGER,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pin_id, DATE(sent_at))
);

-- Add indexes for warnings_sent
CREATE INDEX IF NOT EXISTS idx_warnings_user_id ON warnings_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_warnings_pin_id ON warnings_sent(pin_id);
CREATE INDEX IF NOT EXISTS idx_warnings_sent_at ON warnings_sent(sent_at);
CREATE INDEX IF NOT EXISTS idx_warnings_algorithm ON warnings_sent(algorithm_used);

-- User analytics and activity tracking
CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB,
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for analytics
CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_data ON analytics USING GIN(event_data);

-- Access logs for monitoring
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method VARCHAR(10),
    response_code INTEGER,
    response_time_ms INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Add indexes for access_logs
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip ON access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    data TEXT,
    ip_address INET,
    user_agent TEXT,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON user_sessions(last_activity);

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh_key TEXT NOT NULL,
    auth_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, endpoint)
);

-- Add indexes for push_subscriptions
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_active ON push_subscriptions(is_active) WHERE is_active = true;

-- Premium transactions table
CREATE TABLE IF NOT EXISTS premium_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    amount_nok INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'NOK',
    duration_months INTEGER NOT NULL,
    payment_method VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indexes for premium_transactions
CREATE INDEX IF NOT EXISTS idx_premium_trans_user_id ON premium_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_trans_status ON premium_transactions(status);
CREATE INDEX IF NOT EXISTS idx_premium_trans_created_at ON premium_transactions(created_at);

-- Functions and triggers

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER trigger_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_pins_updated_at 
    BEFORE UPDATE ON pins 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at();

-- Function to calculate PIN trust score
CREATE OR REPLACE FUNCTION calculate_pin_trust_score(pin_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    up_votes INTEGER;
    down_votes INTEGER;
    base_score INTEGER := 50;
    trust_score INTEGER;
BEGIN
    SELECT 
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END),
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END)
    INTO up_votes, down_votes
    FROM votes 
    WHERE votes.pin_id = calculate_pin_trust_score.pin_id;
    
    trust_score := base_score + (up_votes * 10) - (down_votes * 15);
    trust_score := GREATEST(0, LEAST(100, trust_score));
    
    RETURN trust_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update PIN trust score when votes change
CREATE OR REPLACE FUNCTION update_pin_trust_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE pins 
    SET 
        trust_score = calculate_pin_trust_score(NEW.pin_id),
        verified_count = (
            SELECT COUNT(*) 
            FROM votes 
            WHERE pin_id = NEW.pin_id AND vote_type = 'up'
        )
    WHERE id = NEW.pin_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pin_trust_score
    AFTER INSERT OR UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_pin_trust_score();

-- Function to clean expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS VOID AS $$
BEGIN
    -- Delete expired PINs
    DELETE FROM pins 
    WHERE expires_at < NOW() AND active = false;
    
    -- Delete old analytics data (keep 1 year)
    DELETE FROM analytics 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Delete old access logs (keep 3 months)
    DELETE FROM access_logs 
    WHERE timestamp < NOW() - INTERVAL '3 months';
    
    -- Delete expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW();
    
    -- Delete old warning records (keep 6 months)
    DELETE FROM warnings_sent 
    WHERE sent_at < NOW() - INTERVAL '6 months';
    
END;
$$ LANGUAGE plpgsql;

-- Function to get nearby PINs using spatial index
CREATE OR REPLACE FUNCTION get_nearby_pins(
    user_lat DECIMAL(10, 8),
    user_lng DECIMAL(11, 8),
    radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE (
    pin_id INTEGER,
    pin_latitude DECIMAL(10, 8),
    pin_longitude DECIMAL(11, 8),
    pin_type VARCHAR(20),
    trust_score INTEGER,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.latitude,
        p.longitude,
        p.type,
        p.trust_score,
        (ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography
        ) / 1000)::DECIMAL as distance_km
    FROM pins p
    WHERE 
        p.active = true 
        AND p.expires_at > NOW()
        AND ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
            radius_km * 1000
        )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Views for common queries

-- View for active high-trust PINs
CREATE OR REPLACE VIEW high_trust_pins AS
SELECT 
    id, uuid, latitude, longitude, type, speed_limit, 
    bearing, road_name, trust_score, verified_count,
    created_at
FROM pins 
WHERE active = true 
    AND expires_at > NOW() 
    AND trust_score >= 70;

-- View for user statistics
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    u.id,
    u.username,
    u.trust_score,
    COUNT(DISTINCT p.id) as pins_created,
    COUNT(DISTINCT v.id) as votes_cast,
    COUNT(DISTINCT w.id) as warnings_received,
    COALESCE(SUM(
        CASE WHEN a.event_type = 'distance_driven' 
        THEN (a.event_data->>'distance')::DECIMAL 
        ELSE 0 END
    ), 0) as total_distance_km
FROM users u
LEFT JOIN pins p ON p.created_by = u.id
LEFT JOIN votes v ON v.user_id = u.id
LEFT JOIN warnings_sent w ON w.user_id = u.id
LEFT JOIN analytics a ON a.user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.trust_score;

-- Insert default data (only if tables are empty)

-- Insert system user
INSERT INTO users (username, email, password_hash, trust_score, is_verified)
SELECT 'system', 'system@radarvarsler.no', 'system_hash', 100, true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'system');

-- Insert demo PIN in Grimstad (only if no PINs exist)
INSERT INTO pins (latitude, longitude, type, speed_limit, bearing, road_name, trust_score, created_by)
SELECT 58.34716, 8.58086, 'radar', 80, 45.0, 'E18', 85, 1
WHERE NOT EXISTS (SELECT 1 FROM pins) 
    AND EXISTS (SELECT 1 FROM users WHERE username = 'system');

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO radarvarsler_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO radarvarsler_app;

-- Create scheduled job for cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-data', '0 2 * * *', 'SELECT cleanup_expired_data();');

COMMIT;
