<?php
/**
 * RadarVarsler PWA - WebSocket Server for Real-time Updates
 * Handles real-time PIN updates, chat messages, and user notifications
 */

require_once 'config.php';
require_once 'database.php';

// Simple WebSocket implementation for PHP
class WebSocketServer {
    private $clients = [];
    private $userSockets = [];
    private $server;
    
    public function __construct($host = '0.0.0.0', $port = 8080) {
        $this->server = stream_socket_server("tcp://$host:$port", $errno, $errstr);
        if (!$this->server) {
            die("Failed to create server: $errstr ($errno)\n");
        }
        
        echo "WebSocket server started on $host:$port\n";
    }
    
    public function run() {
        while (true) {
            $read = array_merge([$this->server], $this->clients);
            $write = null;
            $except = null;
            
            if (stream_select($read, $write, $except, 0, 200000) < 1) {
                continue;
            }
            
            if (in_array($this->server, $read)) {
                $this->handleNewConnection();
                unset($read[array_search($this->server, $read)]);
            }
            
            foreach ($read as $client) {
                $this->handleClientMessage($client);
            }
        }
    }
    
    private function handleNewConnection() {
        $client = stream_socket_accept($this->server);
        if ($client) {
            $this->performHandshake($client);
            $this->clients[] = $client;
            echo "New client connected\n";
        }
    }
    
    private function performHandshake($client) {
        $request = stream_get_contents($client, 1024);
        
        if (preg_match('/Sec-WebSocket-Key: (.*)/', $request, $matches)) {
            $key = trim($matches[1]);
            $acceptKey = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
            
            $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                       "Upgrade: websocket\r\n" .
                       "Connection: Upgrade\r\n" .
                       "Sec-WebSocket-Accept: $acceptKey\r\n\r\n";
            
            fwrite($client, $response);
        }
    }
    
    private function handleClientMessage($client) {
        $data = $this->unmask($client);
        
        if ($data === false) {
            $this->disconnect($client);
            return;
        }
        
        if (empty($data)) {
            return;
        }
        
        try {
            $message = json_decode($data, true);
            if (!$message) {
                return;
            }
            
            $this->processMessage($client, $message);
            
        } catch (Exception $e) {
            error_log("WebSocket message error: " . $e->getMessage());
        }
    }
    
    private function processMessage($client, $message) {
        switch ($message['type'] ?? '') {
            case 'auth':
                $this->handleAuth($client, $message);
                break;
                
            case 'new_pin':
                $this->broadcastNewPin($message['pin']);
                break;
                
            case 'chat_message':
                $this->handleChatMessage($message);
                break;
                
            case 'ping':
                $this->sendToClient($client, ['type' => 'pong']);
                break;
                
            default:
                error_log("Unknown message type: " . ($message['type'] ?? 'null'));
        }
    }
    
    private function handleAuth($client, $message) {
        $userId = $message['user_id'] ?? null;
        if ($userId) {
            $this->userSockets[$userId] = $client;
            $this->sendToClient($client, [
                'type' => 'auth_success',
                'message' => 'Authenticated successfully'
            ]);
            echo "User $userId authenticated\n";
        }
    }
    
    private function broadcastNewPin($pin) {
        $message = [
            'type' => 'new_pin',
            'pin' => $pin,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->broadcast($message);
        echo "Broadcasted new PIN: " . $pin['id'] . "\n";
    }
    
    private function handleChatMessage($message) {
        $pinId = $message['pin_id'] ?? null;
        if (!$pinId) {
            return;
        }
        
        // Store in database
        try {
            $db = Database::getInstance();
            $stmt = $db->prepare("
                INSERT INTO pin_chat (pin_id, user_id, message, created_at) 
                VALUES (?, ?, ?, NOW())
            ");
            
            // Get user ID from authenticated sessions (simplified for demo)
            $userId = $this->getUserIdFromMessage($message);
            if ($userId) {
                $stmt->execute([$pinId, $userId, $message['message']]);
            }
            
        } catch (Exception $e) {
            error_log("Failed to store chat message: " . $e->getMessage());
        }
        
        // Broadcast to all clients
        $broadcastMessage = [
            'type' => 'chat_message',
            'pin_id' => $pinId,
            'message' => $message['message'],
            'user' => $message['user'] ?? 'Anonymous',
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        $this->broadcast($broadcastMessage);
    }
    
    private function getUserIdFromMessage($message) {
        // In a real implementation, extract from authenticated session
        // For now, return null to prevent database errors
        return null;
    }
    
    private function broadcast($message) {
        $data = $this->mask(json_encode($message));
        
        foreach ($this->clients as $client) {
            if (is_resource($client)) {
                @fwrite($client, $data);
            }
        }
    }
    
    private function sendToClient($client, $message) {
        if (is_resource($client)) {
            $data = $this->mask(json_encode($message));
            @fwrite($client, $data);
        }
    }
    
    private function unmask($client) {
        $data = @fread($client, 1024);
        
        if (strlen($data) < 2) {
            return false;
        }
        
        $firstByte = ord($data[0]);
        $secondByte = ord($data[1]);
        
        $opcode = $firstByte & 0x0f;
        $masked = ($secondByte & 0x80) === 0x80;
        $payloadLength = $secondByte & 0x7f;
        
        if ($opcode === 0x8) { // Close frame
            return false;
        }
        
        if (!$masked) {
            return false;
        }
        
        $maskingKey = substr($data, 2, 4);
        $payload = substr($data, 6, $payloadLength);
        
        $unmaskedPayload = '';
        for ($i = 0; $i < strlen($payload); $i++) {
            $unmaskedPayload .= $payload[$i] ^ $maskingKey[$i % 4];
        }
        
        return $unmaskedPayload;
    }
    
    private function mask($data) {
        $length = strlen($data);
        $firstByte = 0x81; // Text frame
        
        if ($length < 126) {
            $header = pack('CC', $firstByte, $length);
        } elseif ($length < 65536) {
            $header = pack('CCn', $firstByte, 126, $length);
        } else {
            $header = pack('CCNN', $firstByte, 127, 0, $length);
        }
        
        return $header . $data;
    }
    
    private function disconnect($client) {
        // Remove from clients array
        $key = array_search($client, $this->clients);
        if ($key !== false) {
            unset($this->clients[$key]);
        }
        
        // Remove from user sockets
        foreach ($this->userSockets as $userId => $socket) {
            if ($socket === $client) {
                unset($this->userSockets[$userId]);
                echo "User $userId disconnected\n";
                break;
            }
        }
        
        @fclose($client);
    }
}

// Start WebSocket server if called directly
if (php_sapi_name() === 'cli') {
    $host = $_ENV['WEBSOCKET_HOST'] ?? '0.0.0.0';
    $port = $_ENV['WEBSOCKET_PORT'] ?? 8080;
    
    $server = new WebSocketServer($host, $port);
    $server->run();
} else {
    // HTTP request - return WebSocket endpoint info
    header('Content-Type: application/json');
    echo json_encode([
        'websocket_url' => 'ws://' . $_SERVER['HTTP_HOST'] . ':8080',
        'status' => 'WebSocket server info'
    ]);
}
?>
