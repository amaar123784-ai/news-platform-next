// public/sw.js
self.importScripts('https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js');

const CACHE_NAME = 'voice-of-tihama-v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/offline',
                '/images/logo.webp',
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    // Basic offline support
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/offline') || caches.match('/');
            })
        );
    }
});

self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-articles') {
        event.waitUntil(syncArticles());
    }
});

async function syncArticles() {
    const keys = await localforage.keys();
    const syncKeys = keys.filter(k => k.startsWith('sync_queue_'));
    
    for (const key of syncKeys) {
        const payload = await localforage.getItem(key);
        const idempotencyKey = key.replace('sync_queue_', '');
        
        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Idempotency-Key': idempotencyKey 
                },
                body: JSON.stringify(payload)
            });
            
            if (response.ok) {
                await localforage.removeItem(key);
                // Notify user if possible
                self.registration.showNotification('تم نشر المقال بنجاح', {
                    body: payload.title,
                    icon: '/images/logo.webp'
                });
            } else if (response.status >= 400 && response.status < 500) {
                // Client error, remove from queue and maybe notify
                await localforage.removeItem(key);
            }
        } catch (e) {
            console.error('Background sync failed for', key, e);
            // Will retry on next sync event
        }
    }
}
