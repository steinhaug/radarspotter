<?php
/**
 * RadarVarsler PWA - Configuration File
 * Contains all application constants, database settings, and security configurations
 */

// Prevent direct access
if (!defined('RADARVARSLER_APP')) {
    define('RADARVARSLER_APP', true);
}

// Error reporting for development
if ($_ENV['APP_ENV'] ?? 'production' === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Timezone
date_default_timezone_set('Europe/Oslo');

// Application Constants
define('APP_NAME', 'RadarVarsler');
define('APP_VERSION', '1.0.0');
define('APP_URL', $_ENV['APP_URL'] ?? 'https://radarvarsler.no');

// Security Constants
define('SALT', $_ENV['SESSION_SECRET'] ?? 'default_salt_change_in_production');
define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? $_ENV['SESSION_SECRET'] ?? 'jwt_secret_key');
define('SESSION_LIFETIME', 3600 * 24 * 30); // 30 days

// Database Configuration
$db_config = [
    'host' => $_ENV['PGHOST'] ?? 'localhost',
    'port' => $_ENV['PGPORT'] ?? '5432',
    'database' => $_ENV['PGDATABASE'] ?? 'radarvarsler',
    'username' => $_ENV['PGUSER'] ?? 'postgres',
    'password' => $_ENV['PGPASSWORD'] ?? '',
    'charset' => 'utf8'
];

// Redis Configuration (for caching and sessions)
$redis_config = [
    'host' => $_ENV['REDIS_HOST'] ?? 'localhost',
    'port' => $_ENV['REDIS_PORT'] ?? 6379,
    'password' => $_ENV['REDIS_PASSWORD'] ?? null,
    'database' => $_ENV['REDIS_DB'] ?? 0
];

// MapBox Configuration
define('MAPBOX_ACCESS_TOKEN', $_ENV['MAPBOX_ACCESS_TOKEN'] ?? 'pk.eyJ1IjoicmFkYXJ2YXJzbGVyIiwiYSI6ImNsczY4eGhuZDBraXUycXM1aG1hZW8wemcifQ.demo_token');
define('MAPBOX_STYLE_URL', 'mapbox://styles/mapbox/streets-v12');

// Push Notification Configuration
define('VAPID_PUBLIC_KEY', $_ENV['VAPID_PUBLIC_KEY'] ?? '');
define('VAPID_PRIVATE_KEY', $_ENV['VAPID_PRIVATE_KEY'] ?? '');
define('VAPID_SUBJECT', $_ENV['VAPID_SUBJECT'] ?? 'mailto:contact@radarvarsler.no');

// WebSocket Configuration
define('WEBSOCKET_HOST', $_ENV['WEBSOCKET_HOST'] ?? '0.0.0.0');
define('WEBSOCKET_PORT', $_ENV['WEBSOCKET_PORT'] ?? 8080);

// File Upload Limits
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'gif', 'webp']);

// Rate Limiting
define('RATE_LIMIT_REQUESTS', 100); // per hour
define('RATE_LIMIT_WINDOW', 3600); // 1 hour in seconds

// PIN System Configuration
define('MAX_PINS_PER_USER_PER_DAY', 10);
define('PIN_EXPIRY_DAYS', 30);
define('MIN_TRUST_SCORE_FOR_PIN_CREATION', 10);
define('INITIAL_USER_TRUST_SCORE', 50);

// Search Algorithm Configuration
define('ROUTE_SEARCH_DISTANCE_KM', 2); // Alert distance for route-based search
define('RADIUS_SEARCH_DISTANCE_KM', 3); // Alert distance for radius-based search
define('PIN_CLUSTERING_DISTANCE_M', 100); // Meters to cluster nearby PINs

// Trust Score Calculation
define('VOTE_UP_POINTS', 2);
define('VOTE_DOWN_POINTS', -3);
define('PIN_VERIFIED_BONUS', 5);
define('FALSE_PIN_PENALTY', -10);

// Premium Features
define('PREMIUM_MONTHLY_PRICE', 49); // NOK
define('PREMIUM_YEARLY_PRICE', 490); // NOK
define('FREE_WARNINGS_PER_DAY', 5);
define('PREMIUM_UNLIMITED_WARNINGS', true);

// Logging Configuration
define('LOG_LEVEL', $_ENV['LOG_LEVEL'] ?? 'INFO');
define('LOG_FILE', $_ENV['LOG_FILE'] ?? '/var/log/radarvarsler.log');
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10MB

// Email Configuration
$email_config = [
    'smtp_host' => $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com',
    'smtp_port' => $_ENV['SMTP_PORT'] ?? 587,
    'smtp_username' => $_ENV['SMTP_USERNAME'] ?? '',
    'smtp_password' => $_ENV['SMTP_PASSWORD'] ?? '',
    'from_email' => $_ENV['FROM_EMAIL'] ?? 'noreply@radarvarsler.no',
    'from_name' => $_ENV['FROM_NAME'] ?? 'RadarVarsler'
];

// Analytics Configuration
define('GOOGLE_ANALYTICS_ID', $_ENV['GOOGLE_ANALYTICS_ID'] ?? '');
define('TRACK_USER_LOCATIONS', $_ENV['TRACK_USER_LOCATIONS'] ?? 'false');

// External APIs
$external_apis = [
    'weather' => [
        'api_key' => $_ENV['WEATHER_API_KEY'] ?? '',
        'base_url' => 'https://api.openweathermap.org/data/2.5'
    ],
    'traffic' => [
        'api_key' => $_ENV['TRAFFIC_API_KEY'] ?? '',
        'base_url' => 'https://api.vegvesen.no'
    ]
];

// Cache Configuration
define('CACHE_ENABLED', $_ENV['CACHE_ENABLED'] ?? 'true');
define('CACHE_TTL_SHORT', 300); // 5 minutes
define('CACHE_TTL_MEDIUM', 1800); // 30 minutes
define('CACHE_TTL_LONG', 3600); // 1 hour

// Security Headers
$security_headers = [
    'X-Content-Type-Options' => 'nosniff',
    'X-Frame-Options' => 'DENY',
    'X-XSS-Protection' => '1; mode=block',
    'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy' => "default-src 'self'; " .
                                "script-src 'self' 'unsafe-inline' https://api.mapbox.com https://cdn.tailwindcss.com https://unpkg.com; " .
                                "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://cdn.tailwindcss.com; " .
                                "img-src 'self' data: https: blob:; " .
                                "connect-src 'self' https://api.mapbox.com wss: ws:; " .
                                "font-src 'self' data:; " .
                                "object-src 'none'; " .
                                "base-uri 'self'; " .
                                "form-action 'self';"
];

// Apply security headers
foreach ($security_headers as $header => $value) {
    header("$header: $value");
}

// Session Configuration
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) ? 1 : 0);
ini_set('session.cookie_samesite', 'Strict');
ini_set('session.gc_maxlifetime', SESSION_LIFETIME);

// Utility Functions
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

function generateUUID() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function hashPassword($password) {
    return hash('sha256', $password . SALT);
}

function verifyPassword($password, $hash) {
    return hash_equals($hash, hashPassword($password));
}

// Environment-specific configurations
if (isDevelopment()) {
    // Development settings
    ini_set('display_errors', 1);
    error_reporting(E_ALL);
    
    // Relaxed CORS for development
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Credentials: true');
}

// Global error handler
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    logMessage('ERROR', "PHP Error: $message in $file:$line", [
        'severity' => $severity,
        'file' => $file,
        'line' => $line
    ]);
    
    if (isDevelopment()) {
        echo "Error: $message in $file:$line\n";
    }
    
    return true;
});

// Global exception handler
set_exception_handler(function($exception) {
    logMessage('CRITICAL', 'Uncaught exception: ' . $exception->getMessage(), [
        'file' => $exception->getFile(),
        'line' => $exception->getLine(),
        'trace' => $exception->getTraceAsString()
    ]);
    
    if (isDevelopment()) {
        echo "Uncaught exception: " . $exception->getMessage() . "\n";
        echo $exception->getTraceAsString() . "\n";
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Internal server error']);
    }
});

// Autoload additional configuration files
$configDir = __DIR__ . '/config';
if (is_dir($configDir)) {
    foreach (glob("$configDir/*.php") as $configFile) {
        require_once $configFile;
    }
}
?>
