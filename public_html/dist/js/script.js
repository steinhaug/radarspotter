/**
 * RadarVarsler PWA - Main Application Script
 * Norwegian radar warning app with dual search algorithms and PIN trust system
 */

class RadarVarslerApp {
    constructor() {
        this.map = null;
        this.currentPosition = null;
        this.isNavigating = false;
        this.navigationRoute = null;
        this.userPins = [];
        this.currentUser = null;
        this.websocket = null;
        this.lastWarningCheck = Date.now();
        this.warnedPinsToday = new Set();
        this.watchId = null;
        this.lastSpeed = 0;
        
        // Default locations
        this.locations = {
            kristiansand: [8.10114, 58.12816],
            oslo: [10.77059, 59.92081],
            grimstadPin: [8.58086, 58.34716]
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadUser();
            this.setupEventListeners();
            this.initializeMap();
            this.setupWebSocket();
            this.requestNotificationPermission();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showNotification('Kunne ikke starte applikasjonen', 'error');
            this.hideLoading();
        }
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.style.display = 'none', 300);
        }
    }

    async loadUser() {
        const savedUser = localStorage.getItem('radarvarsler_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMapScreen();
            this.updateUserDisplay();
        } else {
            this.showLoginScreen();
        }
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('toggle-theme')?.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Login form
        document.getElementById('login-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Register button
        document.getElementById('register-btn')?.addEventListener('click', () => {
            this.handleRegister();
        });

        // Navigation
        document.getElementById('nav-map')?.addEventListener('click', () => {
            this.showMapScreen();
        });

        document.getElementById('nav-analytics')?.addEventListener('click', () => {
            this.showAnalyticsScreen();
        });

        // Map controls
        document.getElementById('center-location')?.addEventListener('click', () => {
            this.centerOnLocation();
        });

        document.getElementById('start-navigation')?.addEventListener('click', () => {
            this.startNavigation();
        });

        document.getElementById('add-pin')?.addEventListener('click', () => {
            this.addPinAtLocation();
        });

        // PIN modal
        document.getElementById('close-pin-modal')?.addEventListener('click', () => {
            this.closePinModal();
        });

        document.getElementById('vote-up')?.addEventListener('click', () => {
            this.votePIN('up');
        });

        document.getElementById('vote-down')?.addEventListener('click', () => {
            this.votePIN('down');
        });

        document.getElementById('send-chat')?.addEventListener('click', () => {
            this.sendChatMessage();
        });

        document.getElementById('chat-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });

        // Bottom panel
        document.getElementById('close-panel')?.addEventListener('click', () => {
            this.closeBottomPanel();
        });

        // Load saved theme
        this.loadTheme();
    }

    async initializeMap() {
        if (!window.mapboxgl) {
            throw new Error('MapBox GL JS not loaded');
        }

        // Get MapBox token from environment or use default
        const mapboxToken = 'pk.eyJ1IjoicmFkYXJ2YXJzbGVyIiwiYSI6ImNsczY4eGhuZDBraXUycXM1aG1hZW8wemcifQ.demo_token';
        mapboxgl.accessToken = mapboxToken;

        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: this.locations.kristiansand,
            zoom: 10,
            bearing: 0,
            pitch: 0
        });

        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        this.map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserHeading: true
        }), 'top-right');

        // Wait for map to load
        this.map.on('load', () => {
            this.setupMapLayers();
            this.loadPINs();
            this.startLocationTracking();
        });

        // Map click handler
        this.map.on('click', (e) => {
            this.handleMapClick(e);
        });
    }

    setupMapLayers() {
        // Add PIN layer
        this.map.addSource('pins', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        this.map.addLayer({
            id: 'pins',
            type: 'circle',
            source: 'pins',
            paint: {
                'circle-radius': [
                    'case',
                    ['>=', ['get', 'trust_score'], 70], 8,
                    ['>=', ['get', 'trust_score'], 40], 6,
                    4
                ],
                'circle-color': [
                    'case',
                    ['>=', ['get', 'trust_score'], 70], '#22c55e',
                    ['>=', ['get', 'trust_score'], 40], '#eab308',
                    '#ef4444'
                ],
                'circle-stroke-width': 2,
                'circle-stroke-color': '#ffffff'
            }
        });

        // Add route layer
        this.map.addSource('route', {
            type: 'geojson',
            data: {
                type: 'FeatureCollection',
                features: []
            }
        });

        this.map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            paint: {
                'line-color': '#003d82',
                'line-width': 6,
                'line-opacity': 0.8
            }
        });

        // PIN click handler
        this.map.on('click', 'pins', (e) => {
            this.showPinDetails(e.features[0]);
        });

        // Change cursor on hover
        this.map.on('mouseenter', 'pins', () => {
            this.map.getCanvas().style.cursor = 'pointer';
        });

        this.map.on('mouseleave', 'pins', () => {
            this.map.getCanvas().style.cursor = '';
        });

        // Add test PIN in Grimstad
        this.addTestPin();
    }

    addTestPin() {
        const testPin = {
            id: 'test-grimstad',
            coordinates: this.locations.grimstadPin,
            type: 'radar',
            speed_limit: 80,
            bearing: 45,
            trust_score: 85,
            verified_count: 12,
            created_by: 'system',
            created_at: new Date().toISOString(),
            road_name: 'E18'
        };

        this.userPins.push(testPin);
        this.updatePinsOnMap();
    }

    async loadPINs() {
        try {
            const response = await fetch('/server/api.php?action=get_pins');
            if (response.ok) {
                const data = await response.json();
                this.userPins = data.pins || [];
                this.updatePinsOnMap();
            }
        } catch (error) {
            console.error('Failed to load PINs:', error);
            // Use offline data if available
            const offlinePins = localStorage.getItem('radarvarsler_pins');
            if (offlinePins) {
                this.userPins = JSON.parse(offlinePins);
                this.updatePinsOnMap();
            }
        }
    }

    updatePinsOnMap() {
        const features = this.userPins.map(pin => ({
            type: 'Feature',
            properties: {
                id: pin.id,
                type: pin.type,
                trust_score: pin.trust_score || 50,
                speed_limit: pin.speed_limit,
                road_name: pin.road_name
            },
            geometry: {
                type: 'Point',
                coordinates: pin.coordinates
            }
        }));

        this.map.getSource('pins').setData({
            type: 'FeatureCollection',
            features
        });

        // Cache offline
        localStorage.setItem('radarvarsler_pins', JSON.stringify(this.userPins));
    }

    startLocationTracking() {
        if (!navigator.geolocation) {
            this.showNotification('GPS ikke tilgjengelig', 'error');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.updatePosition(position);
            },
            (error) => {
                console.error('Location error:', error);
                this.showNotification('Kunne ikke hente posisjon', 'error');
            },
            options
        );
    }

    updatePosition(position) {
        const coords = [position.coords.longitude, position.coords.latitude];
        this.currentPosition = coords;
        
        // Update speed display
        const speed = position.coords.speed ? Math.round(position.coords.speed * 3.6) : 0;
        this.updateSpeedDisplay(speed);
        
        // Check for warnings
        this.checkForWarnings();
        
        // Update analytics
        this.updateDrivingStats(position);
    }

    updateSpeedDisplay(speed) {
        const speedElement = document.getElementById('current-speed');
        if (speedElement) {
            speedElement.textContent = speed;
            
            // Add warning class if speeding
            if (speed > 90) { // Example speed limit
                speedElement.classList.add('speed-warning');
            } else {
                speedElement.classList.remove('speed-warning');
            }
        }
        this.lastSpeed = speed;
    }

    checkForWarnings() {
        if (!this.currentPosition || Date.now() - this.lastWarningCheck < 5000) {
            return; // Check every 5 seconds max
        }

        this.lastWarningCheck = Date.now();

        // Algorithm 1: Route-based search (if navigating)
        if (this.isNavigating && this.navigationRoute) {
            this.checkRoutePINs();
        }

        // Algorithm 2: Radius-based search (always active)
        this.checkNearbyPINs();
    }

    checkRoutePINs() {
        if (!this.navigationRoute || !this.currentPosition) return;

        const routeCoordinates = this.navigationRoute.geometry.coordinates;
        const currentPos = turf.point(this.currentPosition);

        // Find closest point on route
        const line = turf.lineString(routeCoordinates);
        const snapped = turf.nearestPointOnLine(line, currentPos);
        
        // Check PINs within 2km along route
        this.userPins.forEach(pin => {
            if (this.warnedPinsToday.has(pin.id)) return;

            const pinPoint = turf.point(pin.coordinates);
            const distanceToRoute = turf.distance(pinPoint, snapped, { units: 'kilometers' });
            
            if (distanceToRoute <= 0.5) { // PIN is near route
                const distanceAlongRoute = this.calculateDistanceAlongRoute(pin.coordinates, routeCoordinates);
                
                if (distanceAlongRoute > 0 && distanceAlongRoute <= 2) {
                    this.triggerWarning(pin, 'route');
                }
            }
        });
    }

    checkNearbyPINs() {
        if (!this.currentPosition) return;

        const currentPos = turf.point(this.currentPosition);

        this.userPins.forEach(pin => {
            if (this.warnedPinsToday.has(pin.id)) return;

            const pinPoint = turf.point(pin.coordinates);
            const distance = turf.distance(currentPos, pinPoint, { units: 'kilometers' });

            if (distance <= 3) { // Within 3km radius
                // Check if PIN is in driving direction
                if (this.isPinInDrivingDirection(pin)) {
                    this.triggerWarning(pin, 'radius');
                }
            }
        });
    }

    isPinInDrivingDirection(pin) {
        // Simplified direction check - in production, use more sophisticated bearing calculation
        return true; // For demo, always return true
    }

    calculateDistanceAlongRoute(pinCoords, routeCoords) {
        // Simplified calculation - in production, use proper route distance calculation
        const pinPoint = turf.point(pinCoords);
        const currentPos = turf.point(this.currentPosition);
        return turf.distance(currentPos, pinPoint, { units: 'kilometers' });
    }

    triggerWarning(pin, algorithm) {
        this.warnedPinsToday.add(pin.id);
        
        const message = `Radarkontroll ${turf.distance(
            turf.point(this.currentPosition),
            turf.point(pin.coordinates),
            { units: 'kilometers' }
        ).toFixed(1)}km fremme på ${pin.road_name || 'veien'}`;

        this.showNotification(message, 'warning');
        
        // Send push notification if supported
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            this.sendPushNotification(pin, message);
        }

        // Update analytics
        this.updateAnalytics('warning_received', {
            pin_id: pin.id,
            algorithm: algorithm,
            distance: turf.distance(
                turf.point(this.currentPosition),
                turf.point(pin.coordinates),
                { units: 'kilometers' }
            )
        });
    }

    async startNavigation() {
        if (!this.currentPosition) {
            this.showNotification('Venter på GPS-posisjon...', 'info');
            return;
        }

        try {
            const response = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/driving/${this.currentPosition[0]},${this.currentPosition[1]};${this.locations.oslo[0]},${this.locations.oslo[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
            );

            if (!response.ok) {
                throw new Error('Failed to get directions');
            }

            const data = await response.json();
            const route = data.routes[0];

            this.navigationRoute = route;
            this.isNavigating = true;

            // Update map with route
            this.map.getSource('route').setData({
                type: 'FeatureCollection',
                features: [{
                    type: 'Feature',
                    geometry: route.geometry
                }]
            });

            // Fit map to route
            const coordinates = route.geometry.coordinates;
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

            this.map.fitBounds(bounds, { padding: 50 });

            this.showNotification('Navigasjon startet til Oslo', 'success');
            this.showBottomPanel('Navigasjon aktiv', this.formatNavigationInfo(route));

        } catch (error) {
            console.error('Navigation failed:', error);
            this.showNotification('Kunne ikke starte navigasjon', 'error');
        }
    }

    formatNavigationInfo(route) {
        const distance = (route.distance / 1000).toFixed(1);
        const duration = Math.round(route.duration / 60);
        
        return `
            <div class="space-y-3">
                <div class="flex justify-between">
                    <span>Distanse:</span>
                    <span class="font-semibold">${distance} km</span>
                </div>
                <div class="flex justify-between">
                    <span>Estimert tid:</span>
                    <span class="font-semibold">${duration} min</span>
                </div>
                <div class="flex justify-between">
                    <span>Destinasjon:</span>
                    <span class="font-semibold">Oslo</span>
                </div>
                <button onclick="app.stopNavigation()" class="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600">
                    Stopp navigasjon
                </button>
            </div>
        `;
    }

    stopNavigation() {
        this.isNavigating = false;
        this.navigationRoute = null;
        
        // Clear route from map
        this.map.getSource('route').setData({
            type: 'FeatureCollection',
            features: []
        });

        this.closeBottomPanel();
        this.showNotification('Navigasjon stoppet', 'info');
    }

    centerOnLocation() {
        if (this.currentPosition) {
            this.map.flyTo({
                center: this.currentPosition,
                zoom: 15,
                duration: 1000
            });
        } else {
            this.showNotification('Ingen GPS-posisjon tilgjengelig', 'error');
        }
    }

    async addPinAtLocation() {
        if (!this.currentPosition) {
            this.showNotification('Venter på GPS-posisjon...', 'info');
            return;
        }

        const pinData = {
            coordinates: this.currentPosition,
            type: 'radar',
            speed_limit: 80, // Default
            bearing: 0, // Calculate from movement
            created_by: this.currentUser.id,
            created_at: new Date().toISOString(),
            trust_score: this.currentUser.trust_score || 50
        };

        try {
            const response = await fetch('/server/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'create_pin',
                    ...pinData
                })
            });

            if (response.ok) {
                const result = await response.json();
                pinData.id = result.pin_id;
                this.userPins.push(pinData);
                this.updatePinsOnMap();
                this.showNotification('PIN registrert!', 'success');
                
                // Broadcast to other users via WebSocket
                if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                    this.websocket.send(JSON.stringify({
                        type: 'new_pin',
                        pin: pinData
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to create PIN:', error);
            
            // Save for offline sync
            pinData.tempId = Date.now().toString();
            this.savePendingPin(pinData);
            this.showNotification('PIN lagret for synkronisering', 'info');
        }
    }

    savePendingPin(pinData) {
        const request = indexedDB.open('RadarVarslerDB', 1);
        
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['pendingPins'], 'readwrite');
            const store = transaction.objectStore('pendingPins');
            store.add(pinData);
        };
    }

    showPinDetails(feature) {
        const pin = this.userPins.find(p => p.id === feature.properties.id);
        if (!pin) return;

        const modal = document.getElementById('pin-modal');
        const details = document.getElementById('pin-details');
        
        details.innerHTML = `
            <div class="space-y-3">
                <h4 class="font-semibold text-lg">Radarkontroll</h4>
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span class="text-gray-600 dark:text-gray-400">Type:</span>
                        <span class="ml-2 font-medium">${pin.type === 'radar' ? 'Radar' : 'Politikontroll'}</span>
                    </div>
                    <div>
                        <span class="text-gray-600 dark:text-gray-400">Fartsgrense:</span>
                        <span class="ml-2 font-medium">${pin.speed_limit} km/t</span>
                    </div>
                    <div>
                        <span class="text-gray-600 dark:text-gray-400">Vei:</span>
                        <span class="ml-2 font-medium">${pin.road_name || 'Ukjent'}</span>
                    </div>
                    <div>
                        <span class="text-gray-600 dark:text-gray-400">Tillitsscore:</span>
                        <span class="ml-2 font-medium">${pin.trust_score || 50}%</span>
                    </div>
                </div>
                <div class="text-xs text-gray-500">
                    Registrert ${new Date(pin.created_at).toLocaleDateString('no-NO')}
                </div>
            </div>
        `;

        // Load voting data
        this.loadPinVotes(pin.id);
        
        // Load chat messages
        this.loadPinChat(pin.id);
        
        modal.classList.remove('hidden');
    }

    async loadPinVotes(pinId) {
        try {
            const response = await fetch(`/server/api.php?action=get_votes&pin_id=${pinId}`);
            if (response.ok) {
                const data = await response.json();
                document.getElementById('upvotes').textContent = data.upvotes || 0;
                document.getElementById('downvotes').textContent = data.downvotes || 0;
            }
        } catch (error) {
            console.error('Failed to load votes:', error);
        }
    }

    async loadPinChat(pinId) {
        try {
            const response = await fetch(`/server/api.php?action=get_chat&pin_id=${pinId}`);
            if (response.ok) {
                const data = await response.json();
                this.displayChatMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to load chat:', error);
        }
    }

    displayChatMessages(messages) {
        const container = document.getElementById('chat-messages');
        container.innerHTML = messages.map(msg => `
            <div class="chat-message ${msg.user_id === this.currentUser.id ? 'own' : 'other'}">
                <div class="username">${msg.username}</div>
                <div>${msg.message}</div>
                <div class="timestamp">${new Date(msg.created_at).toLocaleTimeString('no-NO')}</div>
            </div>
        `).join('');
        
        container.scrollTop = container.scrollHeight;
    }

    async votePIN(direction) {
        const pinId = this.getCurrentPinId();
        if (!pinId) return;

        try {
            const response = await fetch('/server/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'vote_pin',
                    pin_id: pinId,
                    vote: direction,
                    user_id: this.currentUser.id
                })
            });

            if (response.ok) {
                this.loadPinVotes(pinId);
                this.showNotification('Stemme registrert', 'success');
            }
        } catch (error) {
            console.error('Vote failed:', error);
            this.showNotification('Kunne ikke registrere stemme', 'error');
        }
    }

    async sendChatMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        const pinId = this.getCurrentPinId();
        
        if (!message || !pinId) return;

        try {
            const response = await fetch('/server/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'send_chat',
                    pin_id: pinId,
                    message: message,
                    user_id: this.currentUser.id
                })
            });

            if (response.ok) {
                input.value = '';
                this.loadPinChat(pinId);
                
                // Send via WebSocket
                if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                    this.websocket.send(JSON.stringify({
                        type: 'chat_message',
                        pin_id: pinId,
                        message: message,
                        user: this.currentUser.username
                    }));
                }
            }
        } catch (error) {
            console.error('Chat failed:', error);
            this.showNotification('Kunne ikke sende melding', 'error');
        }
    }

    getCurrentPinId() {
        // Extract PIN ID from current modal context
        return this.currentModalPinId;
    }

    closePinModal() {
        document.getElementById('pin-modal').classList.add('hidden');
        this.currentModalPinId = null;
    }

    setupWebSocket() {
        // WebSocket disabled for now - using polling for real-time updates
        console.log('Using polling for real-time updates');
        
        // Poll for new PINs every 30 seconds
        if (this.currentUser) {
            setInterval(() => {
                this.loadPINs();
            }, 30000);
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'new_pin':
                this.userPins.push(data.pin);
                this.updatePinsOnMap();
                this.showNotification('Ny PIN registrert i området', 'info');
                break;
                
            case 'chat_message':
                if (this.getCurrentPinId() === data.pin_id) {
                    this.loadPinChat(data.pin_id);
                }
                break;
                
            case 'pin_update':
                const pinIndex = this.userPins.findIndex(p => p.id === data.pin.id);
                if (pinIndex !== -1) {
                    this.userPins[pinIndex] = data.pin;
                    this.updatePinsOnMap();
                }
                break;
        }
    }

    async handleLogin() {
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/server/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'login',
                    username,
                    password
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.currentUser = data.user;
                localStorage.setItem('radarvarsler_user', JSON.stringify(this.currentUser));
                this.showMapScreen();
                this.updateUserDisplay();
                this.showNotification('Innlogget!', 'success');
            } else {
                this.showNotification(data.message || 'Innlogging feilet', 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Tilkoblingsfeil', 'error');
        }
    }

    async handleRegister() {
        // Simple registration flow - in production, use proper form
        const username = prompt('Ønsket brukernavn:');
        const password = prompt('Ønsket passord:');
        
        if (!username || !password) return;

        try {
            const response = await fetch('/server/api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'register',
                    username,
                    password
                })
            });

            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('Konto opprettet! Logg inn.', 'success');
            } else {
                this.showNotification(data.message || 'Registrering feilet', 'error');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification('Tilkoblingsfeil', 'error');
        }
    }

    showLoginScreen() {
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('map-screen').classList.add('hidden');
        document.getElementById('analytics-screen').classList.add('hidden');
        document.getElementById('header').classList.add('hidden');
        document.getElementById('bottom-nav').classList.add('hidden');
    }

    showMapScreen() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('map-screen').classList.remove('hidden');
        document.getElementById('analytics-screen').classList.add('hidden');
        document.getElementById('header').classList.remove('hidden');
        document.getElementById('bottom-nav').classList.remove('hidden');
        
        this.updateNavigation('map');
        
        if (this.map) {
            this.map.resize();
        }
    }

    showAnalyticsScreen() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('map-screen').classList.add('hidden');
        document.getElementById('analytics-screen').classList.remove('hidden');
        document.getElementById('header').classList.remove('hidden');
        document.getElementById('bottom-nav').classList.remove('hidden');
        
        this.updateNavigation('analytics');
        this.loadAnalytics();
    }

    updateNavigation(active) {
        document.querySelectorAll('#bottom-nav button').forEach(btn => {
            btn.classList.remove('text-norway-blue', 'bg-blue-50', 'dark:bg-blue-900/30');
            btn.classList.add('text-gray-500');
        });

        const activeBtn = document.getElementById(`nav-${active}`);
        if (activeBtn) {
            activeBtn.classList.remove('text-gray-500');
            activeBtn.classList.add('text-norway-blue', 'bg-blue-50', 'dark:bg-blue-900/30');
        }
    }

    updateUserDisplay() {
        const usernameEl = document.getElementById('username');
        if (usernameEl && this.currentUser) {
            usernameEl.textContent = this.currentUser.username;
        }
    }

    async loadAnalytics() {
        try {
            const response = await fetch(`/server/api.php?action=get_analytics&user_id=${this.currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                this.displayAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.displayAnalytics({}); // Show empty state
        }
    }

    displayAnalytics(data) {
        document.getElementById('pins-created').textContent = data.pins_created || 0;
        document.getElementById('verifications-given').textContent = data.verifications_given || 0;
        document.getElementById('trust-score').textContent = data.trust_score || 50;
        document.getElementById('distance-driven').textContent = (data.distance_driven || 0).toFixed(1);
        
        // Recent activity
        const activity = document.getElementById('recent-activity');
        if (data.recent_activity && data.recent_activity.length > 0) {
            activity.innerHTML = data.recent_activity.map(item => `
                <div class="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <i data-feather="${this.getActivityIcon(item.type)}" class="w-4 h-4 text-gray-500"></i>
                    <div class="flex-1">
                        <p class="text-sm">${item.description}</p>
                        <p class="text-xs text-gray-500">${new Date(item.created_at).toLocaleDateString('no-NO')}</p>
                    </div>
                </div>
            `).join('');
        } else {
            activity.innerHTML = '<p class="text-gray-500 text-center py-4">Ingen aktivitet ennå</p>';
        }
        
        feather.replace();
    }

    getActivityIcon(type) {
        const icons = {
            'pin_created': 'map-pin',
            'vote_cast': 'thumbs-up',
            'chat_sent': 'message-circle',
            'warning_received': 'alert-triangle'
        };
        return icons[type] || 'activity';
    }

    showBottomPanel(title, content) {
        document.getElementById('panel-title').textContent = title;
        document.getElementById('panel-content').innerHTML = content;
        document.getElementById('bottom-panel').classList.add('show');
    }

    closeBottomPanel() {
        document.getElementById('bottom-panel').classList.remove('show');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex justify-between items-start">
                <p class="text-sm">${message}</p>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-gray-400 hover:text-gray-600">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    toggleTheme() {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark');
        
        if (isDark) {
            html.classList.remove('dark');
            localStorage.setItem('radarvarsler_theme', 'light');
        } else {
            html.classList.add('dark');
            localStorage.setItem('radarvarsler_theme', 'dark');
        }
    }

    loadTheme() {
        const theme = localStorage.getItem('radarvarsler_theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    }

    handleMapClick(e) {
        // Handle map interactions
        console.log('Map clicked at:', e.lngLat);
    }

    updateDrivingStats(position) {
        // Update analytics for driving distance
        if (this.lastPosition && this.lastSpeed > 5) { // Only count if moving
            const distance = turf.distance(
                turf.point([this.lastPosition.coords.longitude, this.lastPosition.coords.latitude]),
                turf.point([position.coords.longitude, position.coords.latitude]),
                { units: 'kilometers' }
            );
            
            // Update local storage
            const currentDistance = parseFloat(localStorage.getItem('radarvarsler_distance') || '0');
            localStorage.setItem('radarvarsler_distance', (currentDistance + distance).toString());
        }
        
        this.lastPosition = position;
    }

    updateAnalytics(eventType, data) {
        // Track analytics events
        const events = JSON.parse(localStorage.getItem('radarvarsler_events') || '[]');
        events.push({
            type: eventType,
            data: data,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 events
        if (events.length > 100) {
            events.splice(0, events.length - 100);
        }
        
        localStorage.setItem('radarvarsler_events', JSON.stringify(events));
    }

    async requestNotificationPermission() {
        if ('Notification' in window && navigator.serviceWorker) {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
    }

    async sendPushNotification(pin, message) {
        try {
            const registration = await navigator.serviceWorker.ready;
            if (registration.showNotification) {
                registration.showNotification('RadarVarsler', {
                    body: message,
                    icon: '/assets/icons/icon-192.svg',
                    badge: '/assets/icons/icon-192.svg',
                    tag: `pin-${pin.id}`,
                    data: { pinId: pin.id }
                });
            }
        } catch (error) {
            console.error('Push notification failed:', error);
        }
    }

    // Cleanup on page unload
    cleanup() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

// Initialize app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RadarVarslerApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});

// Export for global access
window.app = app;
