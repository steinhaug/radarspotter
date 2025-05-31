<?php
/**
 * RadarVarsler PWA - Utility Functions
 * Contains all helper functions used throughout the application
 */

// Prevent direct access
if (!defined('RADARVARSLER_APP')) {
    exit('Direct access not allowed');
}

/**
 * Environment Detection
 */
function isProduction() {
    return ($_ENV['APP_ENV'] ?? 'production') === 'production';
}

function isDevelopment() {
    return ($_ENV['APP_ENV'] ?? 'production') === 'development';
}

function getBaseUrl() {
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return "$protocol://$host";
}

/**
 * Logging Functions
 */
function logMessage($level, $message, $context = []) {
    $levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'];
    $currentLevel = array_search(LOG_LEVEL, $levels);
    $messageLevel = array_search($level, $levels);
    
    if ($messageLevel >= $currentLevel) {
        $timestamp = date('Y-m-d H:i:s');
        $contextStr = !empty($context) ? ' ' . json_encode($context) : '';
        $logEntry = "[$timestamp] $level: $message$contextStr\n";
        
        error_log($logEntry, 3, LOG_FILE);
    }
}

/**
 * Input Validation and Sanitization
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function validateCoordinates($latitude, $longitude) {
    return is_numeric($latitude) && 
           is_numeric($longitude) && 
           $latitude >= -90 && 
           $latitude <= 90 && 
           $longitude >= -180 && 
           $longitude <= 180;
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Geographic Calculations
 */
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // kilometers
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) + 
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * 
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    
    return $earthRadius * $c;
}

/**
 * Security Functions
 */
function hashPassword($password) {
    global $salt;
    return hash('sha256', $password . $salt);
}

function verifyPassword($password, $hash) {
    return hash_equals($hash, hashPassword($password));
}

/**
 * Utility Functions
 */
function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * JSON Response Helper
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Error Response Helper
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

/**
 * Success Response Helper
 */
function successResponse($data = [], $message = 'Success') {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}
?>