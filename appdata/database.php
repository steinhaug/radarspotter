<?php
/**
 * RadarVarsler PWA - Database Connection and Management
 */

class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        $this->connect();
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance->connection;
    }
    
    private function connect() {
        try {
            $this->connection = Mysqli2::getInstance(
                DB_HOST,
                3306,
                DB_USER,
                DB_PASS,
                DB_NAME
            );
            
            // Set timezone and charset
            $this->connection->query("SET time_zone = '+01:00'");
            $this->connection->query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
            
        } catch (Exception $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    // Prevent cloning
    private function __clone() {}
    
    // Prevent unserialization
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * User Management Functions
 */
class UserManager {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function authenticate($username, $password) {
        $sql = "SELECT id, username, email, trust_score, premium_until, created_at 
                FROM users 
                WHERE username = ? AND password_hash = ?";
        
        $stmt = $this->db->prepare($sql);
        $passwordHash = hash('sha256', $password . ($salt ?? ''));
        $stmt->bind_param('ss', $username, $passwordHash);
        $stmt->execute();
        
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    public function register($username, $password, $email = null) {
        // Check if user exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute([$username]);
        
        if ($stmt->fetch()) {
            throw new Exception("Brukernavn allerede i bruk");
        }
        
        // Create user
        $stmt = $this->db->prepare("
            INSERT INTO users (username, password_hash, email, trust_score, created_at) 
            VALUES (?, ?, ?, 50, NOW()) 
            RETURNING id, username, email, trust_score, created_at
        ");
        
        $stmt->execute([
            $username,
            hash('sha256', $password . SALT),
            $email
        ]);
        
        return $stmt->fetch();
    }
    
    public function updateTrustScore($userId, $change) {
        $stmt = $this->db->prepare("
            UPDATE users 
            SET trust_score = GREATEST(0, LEAST(100, trust_score + ?))
            WHERE id = ?
        ");
        
        return $stmt->execute([$change, $userId]);
    }
    
    public function getUserStats($userId) {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(DISTINCT p.id) as pins_created,
                COUNT(DISTINCT v.id) as verifications_given,
                u.trust_score,
                COALESCE(SUM(a.distance_km), 0) as distance_driven
            FROM users u
            LEFT JOIN pins p ON p.created_by = u.id
            LEFT JOIN votes v ON v.user_id = u.id
            LEFT JOIN analytics a ON a.user_id = u.id AND a.event_type = 'distance_driven'
            WHERE u.id = ?
            GROUP BY u.id, u.trust_score
        ");
        
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
}

/**
 * PIN Management Functions
 */
class PinManager {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function createPin($data) {
        $stmt = $this->db->prepare("
            INSERT INTO pins (
                latitude, longitude, type, speed_limit, bearing, 
                road_name, created_by, created_at, trust_score
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?) 
            RETURNING id
        ");
        
        $stmt->execute([
            $data['coordinates'][1], // latitude
            $data['coordinates'][0], // longitude
            $data['type'],
            $data['speed_limit'],
            $data['bearing'],
            $data['road_name'] ?? null,
            $data['created_by'],
            $data['trust_score'] ?? 50
        ]);
        
        $result = $stmt->fetch();
        return $result['id'];
    }
    
    public function getPinsInArea($latitude, $longitude, $radiusKm = 50) {
        $stmt = $this->db->prepare("
            SELECT 
                id, latitude, longitude, type, speed_limit, bearing,
                road_name, trust_score, verified_count, created_at,
                ST_Distance(
                    ST_MakePoint(longitude, latitude)::geography,
                    ST_MakePoint(?, ?)::geography
                ) / 1000 as distance_km
            FROM pins 
            WHERE ST_DWithin(
                ST_MakePoint(longitude, latitude)::geography,
                ST_MakePoint(?, ?)::geography,
                ? * 1000
            )
            AND active = true
            ORDER BY distance_km
        ");
        
        $stmt->execute([$longitude, $latitude, $longitude, $latitude, $radiusKm]);
        $pins = $stmt->fetchAll();
        
        // Convert to expected format
        foreach ($pins as &$pin) {
            $pin['coordinates'] = [(float)$pin['longitude'], (float)$pin['latitude']];
            unset($pin['latitude'], $pin['longitude']);
        }
        
        return $pins;
    }
    
    public function votePin($pinId, $userId, $vote) {
        // Check if user already voted
        $stmt = $this->db->prepare("
            SELECT id FROM votes WHERE pin_id = ? AND user_id = ?
        ");
        $stmt->execute([$pinId, $userId]);
        
        if ($stmt->fetch()) {
            throw new Exception("Du har allerede stemt på denne PIN-en");
        }
        
        // Insert vote
        $stmt = $this->db->prepare("
            INSERT INTO votes (pin_id, user_id, vote_type, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        
        $stmt->execute([$pinId, $userId, $vote]);
        
        // Update PIN trust score
        $this->updatePinTrustScore($pinId);
        
        // Update user trust score
        $userManager = new UserManager();
        $trustChange = ($vote === 'up') ? 1 : -0.5;
        $userManager->updateTrustScore($userId, $trustChange);
        
        return true;
    }
    
    private function updatePinTrustScore($pinId) {
        $stmt = $this->db->prepare("
            UPDATE pins 
            SET trust_score = (
                SELECT GREATEST(0, LEAST(100, 
                    50 + (COUNT(CASE WHEN vote_type = 'up' THEN 1 END) * 10) - 
                    (COUNT(CASE WHEN vote_type = 'down' THEN 1 END) * 15)
                ))
                FROM votes 
                WHERE pin_id = ?
            ),
            verified_count = (
                SELECT COUNT(*) FROM votes WHERE pin_id = ? AND vote_type = 'up'
            )
            WHERE id = ?
        ");
        
        $stmt->execute([$pinId, $pinId, $pinId]);
    }
    
    public function getPinVotes($pinId) {
        $stmt = $this->db->prepare("
            SELECT 
                COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
                COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
            FROM votes 
            WHERE pin_id = ?
        ");
        
        $stmt->execute([$pinId]);
        return $stmt->fetch();
    }
    
    public function deactivatePin($pinId) {
        $stmt = $this->db->prepare("
            UPDATE pins SET active = false WHERE id = ?
        ");
        
        return $stmt->execute([$pinId]);
    }
}

/**
 * Chat Management Functions
 */
class ChatManager {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function sendMessage($pinId, $userId, $message) {
        $stmt = $this->db->prepare("
            INSERT INTO pin_chat (pin_id, user_id, message, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        
        return $stmt->execute([$pinId, $userId, $message]);
    }
    
    public function getMessages($pinId, $limit = 50) {
        $stmt = $this->db->prepare("
            SELECT 
                pc.message, pc.created_at,
                u.username, u.id as user_id
            FROM pin_chat pc
            JOIN users u ON pc.user_id = u.id
            WHERE pc.pin_id = ?
            ORDER BY pc.created_at DESC
            LIMIT ?
        ");
        
        $stmt->execute([$pinId, $limit]);
        $messages = $stmt->fetchAll();
        
        // Reverse to show oldest first
        return array_reverse($messages);
    }
}

/**
 * Analytics Functions
 */
class Analytics {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function logEvent($userId, $eventType, $data = null) {
        $stmt = $this->db->prepare("
            INSERT INTO analytics (user_id, event_type, event_data, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $userId,
            $eventType,
            $data ? json_encode($data) : null
        ]);
    }
    
    public function getUserAnalytics($userId) {
        $userManager = new UserManager();
        $stats = $userManager->getUserStats($userId);
        
        // Get recent activity
        $stmt = $this->db->prepare("
            SELECT event_type, event_data, created_at
            FROM analytics 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 10
        ");
        
        $stmt->execute([$userId]);
        $recentActivity = $stmt->fetchAll();
        
        // Format activity descriptions
        foreach ($recentActivity as &$activity) {
            $activity['description'] = $this->formatActivityDescription($activity);
        }
        
        return [
            'pins_created' => $stats['pins_created'] ?? 0,
            'verifications_given' => $stats['verifications_given'] ?? 0,
            'trust_score' => $stats['trust_score'] ?? 50,
            'distance_driven' => $stats['distance_driven'] ?? 0,
            'recent_activity' => $recentActivity
        ];
    }
    
    private function formatActivityDescription($activity) {
        switch ($activity['event_type']) {
            case 'pin_created':
                return 'Registrerte ny radarkontroll';
            case 'vote_cast':
                return 'Stemte på en PIN';
            case 'chat_sent':
                return 'Sendte melding i chat';
            case 'warning_received':
                return 'Mottok radarvarsling';
            case 'distance_driven':
                return 'Kjørte ' . round($activity['event_data']['distance'] ?? 0, 1) . ' km';
            default:
                return 'Ukjent aktivitet';
        }
    }
}

/**
 * Warning System
 */
class WarningSystem {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function logWarning($userId, $pinId, $algorithm, $distance) {
        $stmt = $this->db->prepare("
            INSERT INTO warnings_sent (user_id, pin_id, algorithm_used, distance_km, sent_at) 
            VALUES (?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([$userId, $pinId, $algorithm, $distance]);
    }
    
    public function hasBeenWarnedToday($userId, $pinId) {
        $stmt = $this->db->prepare("
            SELECT id FROM warnings_sent 
            WHERE user_id = ? AND pin_id = ? 
            AND sent_at >= CURRENT_DATE
        ");
        
        $stmt->execute([$userId, $pinId]);
        return $stmt->fetch() !== false;
    }
    
    public function getWarningStats() {
        $stmt = $this->db->prepare("
            SELECT 
                algorithm_used,
                COUNT(*) as warning_count,
                AVG(distance_km) as avg_distance
            FROM warnings_sent 
            WHERE sent_at >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY algorithm_used
        ");
        
        $stmt->execute();
        return $stmt->fetchAll();
    }
}
?>
