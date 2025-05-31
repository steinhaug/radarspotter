<?php
/**
 * RadarVarsler PWA - Database Connection and Management
 */

// Database connection is handled globally via $mysqli in credentials.php
// No need for Database class anymore - use global $mysqli directly

/**
 * User Management Functions
 */
class UserManager {
    
    public function authenticate($username, $password) {
        global $mysqli, $salt;
        
        $passwordHash = hash('sha256', $password . $salt);
        
        $sql = [
            'SELECT `id`, `username`, `email`, `trust_score`, `premium_until`, `created_at` 
             FROM `users` 
             WHERE `username` = ? AND `password_hash` = ?',
            'ss',
            [$username, $passwordHash]
        ];
        
        return $mysqli->prepared_query1($sql[0], $sql[1], $sql[2], true);
    }
    
    public function register($username, $password, $email = null) {
        global $mysqli, $salt;
        
        // Check if user exists
        $existingUser = $mysqli->prepared_query1(
            "SELECT `id` FROM `users` WHERE `username` = ?", 
            's', 
            [$username], 
            true
        );
        
        if ($existingUser !== null) {
            throw new Exception("Brukernavn allerede i bruk");
        }
        
        // Create user
        $passwordHash = hash('sha256', $password . $salt);
        $sql = [
            'INSERT INTO `users` (`username`, `password_hash`, `email`, `trust_score`, `created_at`) 
             VALUES (?, ?, ?, 50, NOW())',
            'sssi',
            [$username, $passwordHash, $email, 50]
        ];
        
        $userId = $mysqli->prepared_insert($sql);
        
        if (!$userId) {
            throw new Exception("Kunne ikke opprette bruker");
        }
        
        // Return the newly created user
        return $mysqli->prepared_query1(
            "SELECT `id`, `username`, `email`, `trust_score`, `created_at` FROM `users` WHERE `id` = ?",
            'i',
            [$userId],
            true
        );
    }
    
    public function updateTrustScore($userId, $change) {
        global $mysqli;
        
        $sql = [
            'UPDATE `users` 
             SET `trust_score` = GREATEST(0, LEAST(100, `trust_score` + ?))
             WHERE `id` = ?',
            'di',
            [$change, $userId]
        ];
        
        return $mysqli->prepared_insert($sql);
    }
    
    public function getUserStats($userId) {
        global $mysqli;
        
        return $mysqli->prepared_query1("
            SELECT 
                COUNT(DISTINCT p.id) as pins_created,
                COUNT(DISTINCT v.id) as verifications_given,
                u.trust_score,
                COALESCE(SUM(a.distance_km), 0) as distance_driven
            FROM `users` u
            LEFT JOIN `pins` p ON p.created_by = u.id
            LEFT JOIN `votes` v ON v.user_id = u.id
            LEFT JOIN `analytics` a ON a.user_id = u.id AND a.event_type = 'distance_driven'
            WHERE u.id = ?
            GROUP BY u.id, u.trust_score
        ", 'i', [$userId], true);
    }
}

/**
 * PIN Management Functions
 */
class PinManager {
    
    public function createPin($data) {
        global $mysqli;
        
        $sql = [
            'INSERT INTO `pins` (
                `latitude`, `longitude`, `type`, `speed_limit`, `bearing`, 
                `road_name`, `created_by`, `created_at`, `trust_score`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)',
            'ddsiisii',
            [
                $data['coordinates'][1], // latitude
                $data['coordinates'][0], // longitude
                $data['type'],
                $data['speed_limit'],
                $data['bearing'],
                $data['road_name'] ?? null,
                $data['created_by'],
                $data['trust_score'] ?? 50
            ]
        ];
        
        return $mysqli->prepared_insert($sql);
    }
    
    public function getPinsInArea($latitude, $longitude, $radiusKm = 50) {
        global $mysqli;
        
        // Using MySQL spatial functions instead of PostGIS
        $pins = $mysqli->prepared_query("
            SELECT 
                `id`, `latitude`, `longitude`, `type`, `speed_limit`, `bearing`,
                `road_name`, `trust_score`, `verified_count`, `created_at`,
                (6371 * acos(cos(radians(?)) * cos(radians(`latitude`)) * 
                 cos(radians(`longitude`) - radians(?)) + 
                 sin(radians(?)) * sin(radians(`latitude`)))) as distance_km
            FROM `pins` 
            WHERE `active` = 1
            HAVING distance_km <= ?
            ORDER BY distance_km
        ", 'dddd', [$latitude, $longitude, $latitude, $radiusKm]);
        
        // Convert to expected format
        foreach ($pins as &$pin) {
            $pin['coordinates'] = [(float)$pin['longitude'], (float)$pin['latitude']];
            unset($pin['latitude'], $pin['longitude']);
        }
        
        return $pins;
    }
    
    public function votePin($pinId, $userId, $vote) {
        global $mysqli;
        
        // Check if user already voted
        $existingVote = $mysqli->prepared_query1(
            "SELECT `id` FROM `votes` WHERE `pin_id` = ? AND `user_id` = ?",
            'ii',
            [$pinId, $userId],
            true
        );
        
        if ($existingVote !== null) {
            throw new Exception("Du har allerede stemt på denne PIN-en");
        }
        
        // Insert vote
        $sql = [
            'INSERT INTO `votes` (`pin_id`, `user_id`, `vote_type`, `created_at`) 
             VALUES (?, ?, ?, NOW())',
            'iis',
            [$pinId, $userId, $vote]
        ];
        
        $mysqli->prepared_insert($sql);
        
        // Update PIN trust score
        $this->updatePinTrustScore($pinId);
        
        // Update user trust score
        $userManager = new UserManager();
        $trustChange = ($vote === 'up') ? 1 : -0.5;
        $userManager->updateTrustScore($userId, $trustChange);
        
        return true;
    }
    
    private function updatePinTrustScore($pinId) {
        global $mysqli;
        
        $sql = [
            'UPDATE `pins` 
             SET `trust_score` = (
                 SELECT GREATEST(0, LEAST(100, 
                     50 + (COUNT(CASE WHEN `vote_type` = "up" THEN 1 END) * 10) - 
                     (COUNT(CASE WHEN `vote_type` = "down" THEN 1 END) * 15)
                 ))
                 FROM `votes` 
                 WHERE `pin_id` = ?
             ),
             `verified_count` = (
                 SELECT COUNT(*) FROM `votes` WHERE `pin_id` = ? AND `vote_type` = "up"
             )
             WHERE `id` = ?',
            'iii',
            [$pinId, $pinId, $pinId]
        ];
        
        $mysqli->prepared_insert($sql);
    }
    
    public function getPinVotes($pinId) {
        global $mysqli;
        
        return $mysqli->prepared_query1("
            SELECT 
                COUNT(CASE WHEN `vote_type` = 'up' THEN 1 END) as upvotes,
                COUNT(CASE WHEN `vote_type` = 'down' THEN 1 END) as downvotes
            FROM `votes` 
            WHERE `pin_id` = ?
        ", 'i', [$pinId], true);
    }
    
    public function deactivatePin($pinId) {
        global $mysqli;
        
        $sql = [
            'UPDATE `pins` SET `active` = 0 WHERE `id` = ?',
            'i',
            [$pinId]
        ];
        
        return $mysqli->prepared_insert($sql);
    }
}

/**
 * Chat Management Functions
 */
class ChatManager {
    
    public function sendMessage($pinId, $userId, $message) {
        global $mysqli;
        
        $sql = [
            'INSERT INTO `pin_chat` (`pin_id`, `user_id`, `message`, `created_at`) 
             VALUES (?, ?, ?, NOW())',
            'iis',
            [$pinId, $userId, $message]
        ];
        
        return $mysqli->prepared_insert($sql);
    }
    
    public function getMessages($pinId, $limit = 50) {
        global $mysqli;
        
        $messages = $mysqli->prepared_query("
            SELECT 
                pc.message, pc.created_at,
                u.username, u.id as user_id
            FROM `pin_chat` pc
            JOIN `users` u ON pc.user_id = u.id
            WHERE pc.pin_id = ?
            ORDER BY pc.created_at DESC
            LIMIT ?
        ", 'ii', [$pinId, $limit]);
        
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
