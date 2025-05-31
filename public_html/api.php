<?php
/**
 * RadarVarsler PWA - REST API Endpoints
 * Handles all AJAX requests from the frontend
 */

define('RADARVARSLER_APP', true);
require_once '../environment.php';
require_once '../appdata/config.php';
require_once '../appdata/database.php';

// Set JSON response headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request data
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Session management
session_start();

try {
    // Route API requests
    switch ($path) {
        case '/auth/login':
            handleLogin($input);
            break;
            
        case '/auth/register':
            handleRegister($input);
            break;
            
        case '/auth/logout':
            handleLogout();
            break;
            
        case '/pins':
            if ($method === 'GET') {
                handleGetPins();
            } elseif ($method === 'POST') {
                handleCreatePin($input);
            }
            break;
            
        case '/pins/vote':
            handleVotePin($input);
            break;
            
        case '/pins/chat':
            if ($method === 'GET') {
                handleGetChat();
            } elseif ($method === 'POST') {
                handleSendMessage($input);
            }
            break;
            
        case '/user/stats':
            handleGetUserStats();
            break;
            
        case '/user/analytics':
            handleGetAnalytics();
            break;
            
        default:
            errorResponse('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    logMessage('ERROR', 'API Error: ' . $e->getMessage());
    errorResponse('Internal server error', 500);
}

/**
 * Authentication Handlers
 */
function handleLogin($input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        errorResponse('Username and password required');
    }
    
    $userManager = new UserManager();
    $user = $userManager->authenticate($input['username'], $input['password']);
    
    if (!$user) {
        errorResponse('Invalid credentials', 401);
    }
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    
    successResponse($user, 'Login successful');
}

function handleRegister($input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        errorResponse('Username and password required');
    }
    
    $userManager = new UserManager();
    
    try {
        $user = $userManager->register(
            $input['username'], 
            $input['password'], 
            $input['email'] ?? null
        );
        
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        
        successResponse($user, 'Registration successful');
        
    } catch (Exception $e) {
        errorResponse($e->getMessage());
    }
}

function handleLogout() {
    session_destroy();
    successResponse([], 'Logout successful');
}

/**
 * PIN Management Handlers
 */
function handleGetPins() {
    $latitude = $_GET['lat'] ?? null;
    $longitude = $_GET['lng'] ?? null;
    $radius = $_GET['radius'] ?? 50;
    
    if (!$latitude || !$longitude) {
        errorResponse('Latitude and longitude required');
    }
    
    if (!validateCoordinates($latitude, $longitude)) {
        errorResponse('Invalid coordinates');
    }
    
    $pinManager = new PinManager();
    $pins = $pinManager->getPinsInArea($latitude, $longitude, $radius);
    
    successResponse($pins);
}

function handleCreatePin($input) {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Authentication required', 401);
    }
    
    $required = ['coordinates', 'type', 'speed_limit'];
    foreach ($required as $field) {
        if (!isset($input[$field])) {
            errorResponse("Field '$field' is required");
        }
    }
    
    if (!validateCoordinates($input['coordinates'][1], $input['coordinates'][0])) {
        errorResponse('Invalid coordinates');
    }
    
    $pinManager = new PinManager();
    $input['created_by'] = $_SESSION['user_id'];
    
    try {
        $pinId = $pinManager->createPin($input);
        
        // Log analytics
        $analytics = new Analytics();
        $analytics->logEvent($_SESSION['user_id'], 'pin_created', ['pin_id' => $pinId]);
        
        successResponse(['pin_id' => $pinId], 'PIN created successfully');
        
    } catch (Exception $e) {
        errorResponse($e->getMessage());
    }
}

function handleVotePin($input) {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Authentication required', 401);
    }
    
    if (!isset($input['pin_id']) || !isset($input['vote'])) {
        errorResponse('PIN ID and vote required');
    }
    
    if (!in_array($input['vote'], ['up', 'down'])) {
        errorResponse('Vote must be "up" or "down"');
    }
    
    $pinManager = new PinManager();
    
    try {
        $pinManager->votePin($input['pin_id'], $_SESSION['user_id'], $input['vote']);
        
        // Log analytics
        $analytics = new Analytics();
        $analytics->logEvent($_SESSION['user_id'], 'vote_cast', [
            'pin_id' => $input['pin_id'],
            'vote' => $input['vote']
        ]);
        
        successResponse([], 'Vote recorded successfully');
        
    } catch (Exception $e) {
        errorResponse($e->getMessage());
    }
}

/**
 * Chat Handlers
 */
function handleGetChat() {
    $pinId = $_GET['pin_id'] ?? null;
    $limit = $_GET['limit'] ?? 50;
    
    if (!$pinId) {
        errorResponse('PIN ID required');
    }
    
    $chatManager = new ChatManager();
    $messages = $chatManager->getMessages($pinId, $limit);
    
    successResponse($messages);
}

function handleSendMessage($input) {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Authentication required', 401);
    }
    
    if (!isset($input['pin_id']) || !isset($input['message'])) {
        errorResponse('PIN ID and message required');
    }
    
    $chatManager = new ChatManager();
    
    try {
        $chatManager->sendMessage($input['pin_id'], $_SESSION['user_id'], $input['message']);
        
        // Log analytics
        $analytics = new Analytics();
        $analytics->logEvent($_SESSION['user_id'], 'chat_sent', ['pin_id' => $input['pin_id']]);
        
        successResponse([], 'Message sent successfully');
        
    } catch (Exception $e) {
        errorResponse($e->getMessage());
    }
}

/**
 * User Data Handlers
 */
function handleGetUserStats() {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Authentication required', 401);
    }
    
    $userManager = new UserManager();
    $stats = $userManager->getUserStats($_SESSION['user_id']);
    
    successResponse($stats);
}

function handleGetAnalytics() {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('Authentication required', 401);
    }
    
    $analytics = new Analytics();
    $data = $analytics->getUserAnalytics($_SESSION['user_id']);
    
    successResponse($data);
}
?>