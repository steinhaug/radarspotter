const CACHE_NAME = 'radarvarsler-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/assets/icons/icon-192.svg',
  '/assets/icons/icon-512.svg',
  'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css',
  'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js',
  'https://unpkg.com/@turf/turf@6/turf.min.js',
  'https://unpkg.com/feather-icons',
  'https://cdn.tailwindcss.com'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Cache addAll failed:', error);
      })
  );
});

// Fetch events
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }
        
        // Important: Clone the request before using it
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Important: Clone the response before using it
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Return offline fallback for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background Sync for offline PIN registration
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-pins') {
    event.waitUntil(syncPins());
  }
});

async function syncPins() {
  try {
    // Get pending PINs from IndexedDB
    const pendingPins = await getPendingPins();
    
    for (const pin of pendingPins) {
      try {
        const response = await fetch('/server/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_pin',
            ...pin
          })
        });
        
        if (response.ok) {
          // Remove from pending list
          await removePendingPin(pin.tempId);
        }
      } catch (error) {
        console.error('Failed to sync PIN:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message,
      icon: '/assets/icons/icon-192.svg',
      badge: '/assets/icons/icon-192.svg',
      vibrate: [200, 100, 200],
      tag: data.tag || 'radar-warning',
      actions: [
        {
          action: 'view',
          title: 'Vis detaljer',
          icon: '/assets/icons/icon-192.svg'
        },
        {
          action: 'dismiss',
          title: 'Lukk',
          icon: '/assets/icons/icon-192.svg'
        }
      ],
      data: data
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'RadarVarsler', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow(`/?pin=${event.notification.data.pinId}`)
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper functions for IndexedDB operations
async function getPendingPins() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RadarVarslerDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingPins'], 'readonly');
      const store = transaction.objectStore('pendingPins');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingPins')) {
        db.createObjectStore('pendingPins', { keyPath: 'tempId' });
      }
    };
  });
}

async function removePendingPin(tempId) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('RadarVarslerDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingPins'], 'readwrite');
      const store = transaction.objectStore('pendingPins');
      const deleteRequest = store.delete(tempId);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}
