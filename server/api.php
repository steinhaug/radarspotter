<?php
/**
 * RadarVarsler PWA - REST API Endpoints
 */

require_once 'config.php';
require_once 'database.php';

header('Content-Type: application/json; charset=utf-8');

// Get request method and data
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?? [];

// Get action from query params or POST data
$action = $_GET['action'] ?? $input['action'] ?? '';

try {
    switch ($action) {
        case 'login':
            handleLogin($input);
            break;
            
        case 'register':
            handleRegister($input);
            break;
            
        case 'get_pins':
            handleGetPins();
            break;
            
        case 'create_pin':
            handleCreatePin($input);
            break;
            
        case 'vote_pin':
            handleVotePin($input);
            break;
            
        case 'get_votes':
            handleGetVotes();
            break;
            
        case 'send_chat':
            handleSendChat($input);
            break;
            
        case 'get_chat':
            handleGetChat();
            break;
            
        case 'get_analytics':
            handleGetAnalytics();
            break;
            
        case 'log_warning':
            handleLogWarning($input);
            break;
            
        case 'update_location':
            handleUpdateLocation($input);
            break;
            
        default:
            throw new Exception('Invalid action');
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function handleLogin($input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        throw new Exception('Brukernavn og passord er påkrevd');
    }
    
    $userManager = new UserManager();
    $user = $userManager->authenticate($input['username'], $input['password']);
    
    if (!$user) {
        throw new Exception('Ugyldig brukernavn eller passord');
    }
    
    // Start session
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'trust_score' => $user['trust_score'],
            'premium_until' => $user['premium_until']
        ]
    ]);
}

function handleRegister($input) {
    if (!isset($input['username']) || !isset($input['password'])) {
        throw new Exception('Brukernavn og passord er påkrevd');
    }
    
    if (strlen($input['username']) < 3) {
        throw new Exception('Brukernavn må være minst 3 tegn');
    }
    
    if (strlen($input['password']) < 6) {
        throw new Exception('Passord må være minst 6 tegn');
    }
    
    $userManager = new UserManager();
    $user = $userManager->register(
        $input['username'], 
        $input['password'], 
        $input['email'] ?? null
    );
    
    echo json_encode([
        'success' => true,
        'message' => 'Bruker opprettet',
        'user_id' => $user['id']
    ]);
}

function handleGetPins() {
    $latitude = (float)($_GET['lat'] ?? 58.5);
    $longitude = (float)($_GET['lng'] ?? 8.5);
    $radius = (float)($_GET['radius'] ?? 50);
    
    $pinManager = new PinManager();
    $pins = $pinManager->getPinsInArea($latitude, $longitude, $radius);
    
    echo json_encode([
        'success' => true,
        'pins' => $pins
    ]);
}

function handleCreatePin($input) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    $requiredFields = ['coordinates', 'type'];
    foreach ($requiredFields as $field) {
        if (!isset($input[$field])) {
            throw new Exception("Mangler felt: $field");
        }
    }
    
    // Validate coordinates
    if (!is_array($input['coordinates']) || count($input['coordinates']) !== 2) {
        throw new Exception('Ugyldige koordinater');
    }
    
    $input['created_by'] = $_SESSION['user_id'];
    
    $pinManager = new PinManager();
    $pinId = $pinManager->createPin($input);
    
    // Log analytics
    $analytics = new Analytics();
    $analytics->logEvent($_SESSION['user_id'], 'pin_created', [
        'pin_id' => $pinId,
        'type' => $input['type']
    ]);
    
    echo json_encode([
        'success' => true,
        'pin_id' => $pinId,
        'message' => 'PIN opprettet'
    ]);
}

function handleVotePin($input) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    if (!isset($input['pin_id']) || !isset($input['vote'])) {
        throw new Exception('PIN ID og stemme er påkrevd');
    }
    
    if (!in_array($input['vote'], ['up', 'down'])) {
        throw new Exception('Ugyldig stemme');
    }
    
    $pinManager = new PinManager();
    $pinManager->votePin($input['pin_id'], $_SESSION['user_id'], $input['vote']);
    
    // Log analytics
    $analytics = new Analytics();
    $analytics->logEvent($_SESSION['user_id'], 'vote_cast', [
        'pin_id' => $input['pin_id'],
        'vote' => $input['vote']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Stemme registrert'
    ]);
}

function handleGetVotes() {
    $pinId = $_GET['pin_id'] ?? '';
    if (!$pinId) {
        throw new Exception('PIN ID er påkrevd');
    }
    
    $pinManager = new PinManager();
    $votes = $pinManager->getPinVotes($pinId);
    
    echo json_encode([
        'success' => true,
        'upvotes' => $votes['upvotes'] ?? 0,
        'downvotes' => $votes['downvotes'] ?? 0
    ]);
}

function handleSendChat($input) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    if (!isset($input['pin_id']) || !isset($input['message'])) {
        throw new Exception('PIN ID og melding er påkrevd');
    }
    
    $message = trim($input['message']);
    if (empty($message)) {
        throw new Exception('Meldingen kan ikke være tom');
    }
    
    if (strlen($message) > 500) {
        throw new Exception('Meldingen er for lang (maks 500 tegn)');
    }
    
    $chatManager = new ChatManager();
    $chatManager->sendMessage($input['pin_id'], $_SESSION['user_id'], $message);
    
    // Log analytics
    $analytics = new Analytics();
    $analytics->logEvent($_SESSION['user_id'], 'chat_sent', [
        'pin_id' => $input['pin_id']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Melding sendt'
    ]);
}

function handleGetChat() {
    $pinId = $_GET['pin_id'] ?? '';
    if (!$pinId) {
        throw new Exception('PIN ID er påkrevd');
    }
    
    $limit = min(100, (int)($_GET['limit'] ?? 50));
    
    $chatManager = new ChatManager();
    $messages = $chatManager->getMessages($pinId, $limit);
    
    echo json_encode([
        'success' => true,
        'messages' => $messages
    ]);
}

function handleGetAnalytics() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    $userId = $_GET['user_id'] ?? $_SESSION['user_id'];
    
    // Only allow users to see their own analytics unless admin
    if ($userId != $_SESSION['user_id']) {
        throw new Exception('Ingen tilgang');
    }
    
    $analytics = new Analytics();
    $data = $analytics->getUserAnalytics($userId);
    
    echo json_encode([
        'success' => true,
        ...$data
    ]);
}

function handleLogWarning($input) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    if (!isset($input['pin_id']) || !isset($input['algorithm']) || !isset($input['distance'])) {
        throw new Exception('Mangler påkrevde felt');
    }
    
    $warningSystem = new WarningSystem();
    
    // Check if already warned today
    if ($warningSystem->hasBeenWarnedToday($_SESSION['user_id'], $input['pin_id'])) {
        echo json_encode([
            'success' => false,
            'message' => 'Allerede varslet i dag'
        ]);
        return;
    }
    
    $warningSystem->logWarning(
        $_SESSION['user_id'],
        $input['pin_id'],
        $input['algorithm'],
        $input['distance']
    );
    
    // Log analytics
    $analytics = new Analytics();
    $analytics->logEvent($_SESSION['user_id'], 'warning_received', [
        'pin_id' => $input['pin_id'],
        'algorithm' => $input['algorithm'],
        'distance' => $input['distance']
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Varsling logget'
    ]);
}

function handleUpdateLocation($input) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        throw new Exception('Ikke innlogget');
    }
    
    if (!isset($input['latitude']) || !isset($input['longitude'])) {
        throw new Exception('Koordinater er påkrevd');
    }
    
    // Optional: Log user location for analytics (with privacy considerations)
    $analytics = new Analytics();
    $analytics->logEvent($_SESSION['user_id'], 'location_update', [
        'latitude' => $input['latitude'],
        'longitude' => $input['longitude'],
        'speed' => $input['speed'] ?? null,
        'accuracy' => $input['accuracy'] ?? null
    ]);
    
    // Optional: Update driving distance if moving
    if (isset($input['distance_since_last'])) {
        $analytics->logEvent($_SESSION['user_id'], 'distance_driven', [
            'distance' => $input['distance_since_last']
        ]);
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Posisjon oppdatert'
    ]);
}

// Rate limiting helper
function checkRateLimit($action, $limit = 60, $window = 3600) {
    session_start();
    $userId = $_SESSION['user_id'] ?? 'anonymous';
    $key = "rate_limit_{$action}_{$userId}";
    
    $current = apcu_fetch($key) ?: 0;
    if ($current >= $limit) {
        throw new Exception('For mange forespørsler. Prøv igjen senere.');
    }
    
    apcu_store($key, $current + 1, $window);
}

// Security helper
function validateInput($input, $rules) {
    foreach ($rules as $field => $rule) {
        if ($rule['required'] && !isset($input[$field])) {
            throw new Exception("Mangler påkrevd felt: $field");
        }
        
        if (isset($input[$field])) {
            $value = $input[$field];
            
            if (isset($rule['type'])) {
                switch ($rule['type']) {
                    case 'string':
                        if (!is_string($value)) {
                            throw new Exception("$field må være en tekst");
                        }
                        break;
                    case 'int':
                        if (!is_int($value)) {
                            throw new Exception("$field må være et tall");
                        }
                        break;
                    case 'float':
                        if (!is_numeric($value)) {
                            throw new Exception("$field må være et desimaltall");
                        }
                        break;
                }
            }
            
            if (isset($rule['min_length']) && strlen($value) < $rule['min_length']) {
                throw new Exception("$field må være minst {$rule['min_length']} tegn");
            }
            
            if (isset($rule['max_length']) && strlen($value) > $rule['max_length']) {
                throw new Exception("$field kan ikke være mer enn {$rule['max_length']} tegn");
            }
        }
    }
}
?>
