/**
 * Service Worker for Career Guidance Platform PWA
 * Enables offline functionality and background sync
 */

const CACHE_NAME = 'career-guidance-v1';
const OFFLINE_CACHE = 'career-guidance-offline-v1';

// Assets to cache immediately on install
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// API responses to cache
const API_CACHE_PATTERNS = [
  /\/api\/careers/,
  /\/api\/scholarships/,
  /\/api\/skills/,
  /\/api\/study-abroad/,
];

// ============================================================================
// INSTALL EVENT - Cache static assets
// ============================================================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS.map((url) => new Request(url, { cache: 'reload' })))
          .catch((err) => {
            console.warn('[SW] Some assets failed to cache:', err);
            // Continue even if some assets fail
          });
      }),
      caches.open(OFFLINE_CACHE).then((cache) => {
        console.log('[SW] Offline cache ready');
      }),
    ]).then(() => {
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// ============================================================================
// ACTIVATE EVENT - Clean up old caches
// ============================================================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control immediately
    })
  );
});

// ============================================================================
// FETCH EVENT - Network first, fallback to cache, then offline
// ============================================================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets - cache first, network fallback
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Handle navigation requests - network first, cache fallback, offline fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful navigation responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          // Return offline page for HTML requests
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }
          // Return cached error for other requests
          return new Response('Offline - No cached data available', {
            status: 503,
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        });
      })
  );
});

// ============================================================================
// API REQUEST HANDLER - Smart caching for API responses
// ============================================================================

async function handleApiRequest(request) {
  const url = new URL(request.url);

  // Check if this API should be cached
  const shouldCache = API_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));

  if (shouldCache) {
    // Network first, cache fallback
    try {
      const response = await fetch(request);

      if (response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }

      return response;
    } catch {
      // Network failed, try cache
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      return new Response(JSON.stringify({
        error: 'Offline - No cached data available',
        offline: true,
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // For non-cached APIs, try network only
  return fetch(request).catch(() => {
    return new Response(JSON.stringify({
      error: 'Network request failed',
      offline: true,
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

// ============================================================================
// MESSAGE EVENT - Handle messages from clients
// ============================================================================

self.addEventListener('message', (event) => {
  const { data } = event;

  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(data.urls))
    );
  }

  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        return caches.open(CACHE_NAME);
      }).then((cache) => cache.addAll(STATIC_CACHE_URLS))
    );
  }
});

// ============================================================================
// BACKGROUND SYNC - Sync offline actions when back online
// ============================================================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-assessment-results') {
    event.waitUntil(syncAssessmentResults());
  }

  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
});

// Sync assessment results saved offline
async function syncAssessmentResults() {
  try {
    // Get offline data from IndexedDB
    const offlineData = await getOfflineData('assessment-results');

    for (const data of offlineData) {
      await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    // Clear synced data
    await clearOfflineData('assessment-results');
  } catch (error) {
    console.error('[SW] Failed to sync assessment results:', error);
  }
}

// Sync attendance marked offline
async function syncAttendance() {
  try {
    const offlineData = await getOfflineData('attendance');

    for (const data of offlineData) {
      await fetch('/api/student/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    }

    await clearOfflineData('attendance');
  } catch (error) {
    console.error('[SW] Failed to sync attendance:', error);
  }
}

// Helper functions for offline data management
async function getOfflineData(key) {
  // In production, use IndexedDB
  return [];
}

async function clearOfflineData(key) {
  // In production, clear from IndexedDB
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

self.addEventListener('push', (event) => {
  // Default notification data
  let notificationData = {
    title: 'Bhutan EduSkill',
    body: 'You have a new notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    tag: `notification-${Date.now()}`,
    requireInteraction: false,
    silent: false,
    data: {
      url: '/',
      timestamp: Date.now(),
    },
  };

  // Parse incoming data
  if (event.data) {
    try {
      const parsedData = event.data.json();
      notificationData = {
        ...notificationData,
        ...parsedData,
        data: {
          ...notificationData.data,
          ...parsedData.data,
        },
      };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
      // If JSON parse fails, try text content
      try {
        const textData = event.data.text();
        if (textData) {
          notificationData.body = textData;
        }
      } catch (textError) {
        console.error('[SW] Failed to read push data as text:', textError);
      }
    }
  }

  // Log for debugging
  console.log('[SW] Push notification received:', {
    title: notificationData.title,
    body: notificationData.body,
    tag: notificationData.tag,
  });

  // Show notification with parsed data
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon || '/icon-192.png',
      badge: notificationData.badge || '/badge-72.png',
      vibrate: notificationData.vibrate || [200, 100, 200],
      tag: notificationData.tag || `notification-${Date.now()}`,
      requireInteraction: notificationData.requireInteraction || false,
      silent: notificationData.silent || false,
      data: notificationData.data || {},
      actions: notificationData.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png',
        },
        {
          action: 'close',
          title: 'Dismiss',
          icon: '/icons/close.png',
        },
      ],
      // Notification timestamp
      timestamp: notificationData.data.timestamp || Date.now(),
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  // Close the notification
  event.notification.close();

  const notificationData = event.notification.data || {};

  // Handle action buttons
  if (event.action === 'close') {
    return; // Just close the notification
  }

  // Determine target URL
  let targetUrl = '/';

  if (event.action === 'view' && notificationData.url) {
    targetUrl = notificationData.url;
  } else if (notificationData.url) {
    targetUrl = notificationData.url;
  }

  // Handle notification click - focus existing window or open new one
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if there's already a window open with the target URL
      for (const client of clientList) {
        const clientUrl = new URL(client.url);
        const targetUrlObj = new URL(targetUrl, self.location.origin);

        if (clientUrl.pathname === targetUrlObj.pathname && 'focus' in client) {
          return client.focus();
        }
      }

      // Try to focus any existing window and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus().then(() => {
            // Navigate to the target URL
            if ('navigate' in client) {
              return client.navigate(targetUrl);
            }
          });
        }
      }

      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Track notification dismissal
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);

  const notificationData = event.notification.data || {};

  // Send analytics for dismissed notification
  if (self.navigator.sendBeacon) {
    const data = JSON.stringify({
      type: 'notification_dismissed',
      tag: event.notification.tag,
      title: event.notification.title,
      timestamp: Date.now(),
      data: notificationData,
    });

    // Try to send analytics
    self.navigator.sendBeacon('/api/analytics/events', data).catch((err) => {
      console.error('[SW] Failed to send analytics:', err);
    });
  }

  // Optionally, sync notification read status with server
  if (notificationData.deliveryId) {
    // Mark as read via API
    fetch('/api/notifications/my-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryIds: [notificationData.deliveryId] }),
      keepalive: true,
    }).catch((err) => {
      console.error('[SW] Failed to mark notification as read:', err);
    });
  }
});

// ============================================================================
// PUSH NOTIFICATION ERROR HANDLING
// ============================================================================

self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');

  // Handle subscription change (resubscribe if needed)
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: event.oldSubscription
        ? event.oldSubscription.options.applicationServerKey
        : null,
    })
    .then((newSubscription) => {
      // Send new subscription to server
      return fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: newSubscription.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')),
            auth: arrayBufferToBase64(newSubscription.getKey('auth')),
          },
        }),
      });
    })
    .catch((err) => {
      console.error('[SW] Failed to resubscribe:', err);
    })
  );
});

// Helper: Convert ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return self.btoa(binary);
}
