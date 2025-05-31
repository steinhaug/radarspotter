<?php
/**
 * RadarVarsler PWA - WebSocket Server
 * Handles real-time communication for live chat and PIN updates
 */

define('RADARVARSLER_APP', true);
require_once '../environment.php';
require_once '../appdata/config.php';
require_once '../appdata/database.php';

// Simple WebSocket implementation for real-time features
class RadarWebSocket {
    private $clients = [];
    private $rooms = []; // pin_id => [client_ids]
    
    public function __construct() {
        // This is a simplified WebSocket handler
        // For production, consider using ReactPHP or Ratchet
    }
    
    public function handleConnection($clientId, $data) {
        $this->clients[$clientId] = [
            'id' => $clientId,
            'connected_at' => time(),
            'user_id' => null,
            'subscribed_pins' => []
        ];
        
        logMessage('INFO', "WebSocket client connected: $clientId");
    }
    
    public function handleMessage($clientId, $message) {
        $data = json_decode($message, true);
        
        if (!$data || !isset($data['type'])) {
            return;
        }
        
        switch ($data['type']) {
            case 'auth':
                $this->handleAuth($clientId, $data);
                break;
                
            case 'subscribe_pin':
                $this->handleSubscribePin($clientId, $data);
                break;
                
            case 'unsubscribe_pin':
                $this->handleUnsubscribePin($clientId, $data);
                break;
                
            case 'chat_message':
                $this->handleChatMessage($clientId, $data);
                break;
                
            case 'ping':
                $this->sendToClient($clientId, ['type' => 'pong']);
                break;
        }
    }
    
    private function handleAuth($clientId, $data) {
        if (!isset($data['user_id'])) {
            return;
        }
        
        $this->clients[$clientId]['user_id'] = $data['user_id'];
        
        $this->sendToClient($clientId, [
            'type' => 'auth_success',
            'user_id' => $data['user_id']
        ]);
    }
    
    private function handleSubscribePin($clientId, $data) {
        if (!isset($data['pin_id'])) {
            return;
        }
        
        $pinId = $data['pin_id'];
        
        // Add client to pin room
        if (!isset($this->rooms[$pinId])) {
            $this->rooms[$pinId] = [];
        }
        
        $this->rooms[$pinId][] = $clientId;
        $this->clients[$clientId]['subscribed_pins'][] = $pinId;
        
        $this->sendToClient($clientId, [
            'type' => 'subscribed',
            'pin_id' => $pinId
        ]);
    }
    
    private function handleUnsubscribePin($clientId, $data) {
        if (!isset($data['pin_id'])) {
            return;
        }
        
        $pinId = $data['pin_id'];
        
        // Remove client from pin room
        if (isset($this->rooms[$pinId])) {
            $this->rooms[$pinId] = array_filter($this->rooms[$pinId], function($id) use ($clientId) {
                return $id !== $clientId;
            });
        }
        
        $this->clients[$clientId]['subscribed_pins'] = array_filter(
            $this->clients[$clientId]['subscribed_pins'], 
            function($id) use ($pinId) {
                return $id !== $pinId;
            }
        );
        
        $this->sendToClient($clientId, [
            'type' => 'unsubscribed',
            'pin_id' => $pinId
        ]);
    }
    
    private function handleChatMessage($clientId, $data) {
        if (!isset($data['pin_id']) || !isset($data['message'])) {
            return;
        }
        
        $userId = $this->clients[$clientId]['user_id'];
        if (!$userId) {
            return;
        }
        
        // Save message to database
        try {
            $chatManager = new ChatManager();
            $chatManager->sendMessage($data['pin_id'], $userId, $data['message']);
            
            // Broadcast to all clients in this pin's room
            $this->broadcastToPin($data['pin_id'], [
                'type' => 'new_chat_message',
                'pin_id' => $data['pin_id'],
                'user_id' => $userId,
                'message' => $data['message'],
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            
        } catch (Exception $e) {
            logMessage('ERROR', 'WebSocket chat error: ' . $e->getMessage());
        }
    }
    
    private function broadcastToPin($pinId, $message) {
        if (!isset($this->rooms[$pinId])) {
            return;
        }
        
        foreach ($this->rooms[$pinId] as $clientId) {
            $this->sendToClient($clientId, $message);
        }
    }
    
    private function sendToClient($clientId, $message) {
        // In a real implementation, this would send via WebSocket connection
        // For now, this is a placeholder for the WebSocket sending logic
        logMessage('DEBUG', "Sending to client $clientId: " . json_encode($message));
    }
    
    public function handleDisconnection($clientId) {
        // Remove client from all rooms
        foreach ($this->rooms as $pinId => &$clients) {
            $clients = array_filter($clients, function($id) use ($clientId) {
                return $id !== $clientId;
            });
        }
        
        // Remove client record
        unset($this->clients[$clientId]);
        
        logMessage('INFO', "WebSocket client disconnected: $clientId");
    }
    
    // Public method to broadcast PIN updates from external sources
    public function broadcastPinUpdate($pinId, $updateType, $data) {
        $this->broadcastToPin($pinId, [
            'type' => 'pin_update',
            'pin_id' => $pinId,
            'update_type' => $updateType,
            'data' => $data
        ]);
    }
}

// For HTTP requests to this file, return WebSocket connection info
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header('Content-Type: application/json');
    
    $response = [
        'websocket_url' => 'ws://' . ($_SERVER['HTTP_HOST'] ?? 'localhost') . ':' . WEBSOCKET_PORT,
        'status' => 'WebSocket server info',
        'protocols' => ['radarvarsler-v1']
    ];
    
    echo json_encode($response);
    exit;
}

// Note: This is a simplified WebSocket implementation
// For production use, consider:
// - ReactPHP Socket with ReactPHP/Http for WebSocket server
// - Ratchet WebSocket library
// - Or a Node.js WebSocket server with Socket.IO
?>