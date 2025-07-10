// LEAP Recovery App Service Worker
const CACHE_NAME = 'leap-recovery-v1';
const STATIC_CACHE = 'leap-static-v1';
const DYNAMIC_CACHE = 'leap-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png',
  '/lovable-uploads/119b2322-45f6-44de-b789-4c906de98f49.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('LEAP Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('LEAP Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('LEAP Service Worker: Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('LEAP Service Worker: Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('LEAP Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            if (cache !== STATIC_CACHE && cache !== DYNAMIC_CACHE) {
              console.log('LEAP Service Worker: Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('LEAP Service Worker: Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external requests (different origin)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('LEAP Service Worker: Serving from cache:', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                console.log('LEAP Service Worker: Caching dynamic content:', event.request.url);
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(error => {
            console.log('LEAP Service Worker: Fetch failed, serving offline fallback');
            
            // Serve offline fallback for navigation requests
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            throw error;
          });
      })
  );
});

// Background sync for data persistence
self.addEventListener('sync', (event) => {
  console.log('LEAP Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'leap-data-sync') {
    event.waitUntil(syncUserData());
  }
});

// Sync user data when back online
async function syncUserData() {
  try {
    console.log('LEAP Service Worker: Syncing user data...');
    
    // Get pending data from IndexedDB or localStorage
    const clients = await self.clients.matchAll();
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_DATA',
        message: 'Syncing recovery data...'
      });
    });
    
    console.log('LEAP Service Worker: Data sync completed');
  } catch (error) {
    console.error('LEAP Service Worker: Data sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('LEAP Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Keep up your recovery journey!',
    icon: '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png',
    badge: '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png',
    vibrate: [200, 100, 200],
    tag: 'leap-recovery',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: 'Open LEAP',
        icon: '/lovable-uploads/5a09c9b4-51a6-4dce-9f67-dd8de1db52dd.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('LEAP Recovery', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('LEAP Service Worker: Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then(clientList => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Otherwise open new window
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});
