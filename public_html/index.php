<?php
/**
 * RadarVarsler PWA - Main Server Entry Point
 * Norwegian radar warning app backend
 */

require_once '../vendor/autoload.php';
require_once '../appdata/config.php';
require_once '../appdata/database.php';

// CORS headers for PWA
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Basic routing
$requestUri = $_SERVER['REQUEST_URI'];
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove /server prefix if present
$path = preg_replace('#^/server#', '', $path);

switch ($path) {
    case '/':
    case '/index.php':
        serveApp();
        break;
        
    case '/api.php':
        include '../appdata/api.php';
        break;
        
    case '/websocket.php':
        include '../appdata/websocket.php';
        break;
        
    default:
        // Serve static files or 404
        if (file_exists('..' . $path)) {
            serveStaticFile('..' . $path);
        } else {
            http_response_code(404);
            echo json_encode(['error' => 'Not found']);
        }
        break;
}

function serveApp() {
    // For PWA, always serve the main app
    $indexPath = '../index.html';
    if (file_exists($indexPath)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($indexPath);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'App not found']);
    }
}

function serveStaticFile($filePath) {
    $mimeTypes = [
        'css' => 'text/css',
        'js' => 'application/javascript',
        'json' => 'application/json',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'svg' => 'image/svg+xml',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'eot' => 'application/vnd.ms-fontobject'
    ];
    
    $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
    $mimeType = $mimeTypes[$ext] ?? 'application/octet-stream';
    
    header("Content-Type: $mimeType");
    
    // Cache headers for static assets
    if (in_array($ext, ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf'])) {
        header('Cache-Control: public, max-age=31536000'); // 1 year
        header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');
    }
    
    readfile($filePath);
}

// Log access for analytics
function logAccess() {
    $logData = [
        'timestamp' => date('Y-m-d H:i:s'),
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'path' => $_SERVER['REQUEST_URI'] ?? 'unknown',
        'method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown'
    ];
    
    // Log to database or file
    try {
        $db = Database::getInstance();
        $stmt = $db->prepare("
            INSERT INTO access_logs (timestamp, ip_address, user_agent, request_path, request_method) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $logData['timestamp'],
            $logData['ip'],
            $logData['user_agent'],
            $logData['path'],
            $logData['method']
        ]);
    } catch (Exception $e) {
        error_log("Failed to log access: " . $e->getMessage());
    }
}

// Call logging function
logAccess();
?>
