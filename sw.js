// sw.js - Enhanced Service Worker for Firebase Sync
const CACHE_NAME = 'broiler-sync-v2';
const FIRESTORE_SYNC_TAG = 'firestore-sync';

self.addEventListener('install', (event) => {
    console.log('Service Worker installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker activated');
    event.waitUntil(self.clients.claim());
});

// Handle background sync
self.addEventListener('sync', (event) => {
    if (event.tag === FIRESTORE_SYNC_TAG) {
        console.log('Background sync triggered for Firestore');
        event.waitUntil(syncWithFirestore());
    }
});

// Main sync function
async function syncWithFirestore() {
    console.log('🔄 Service Worker syncing with Firestore...');
    
    try {
        // Get all clients (browser tabs)
        const clients = await self.clients.matchAll();
        
        // Get the current user from IndexedDB/localStorage
        const syncData = await getSyncData();
        
        if (!syncData || !syncData.userId) {
            console.log('No user data to sync');
            return;
        }
        
        // Notify clients that sync is starting
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_STARTED',
                timestamp: new Date().toISOString()
            });
        });

        // Perform Firebase sync
        const result = await performFirestoreSync(syncData);
        
        // Notify clients of sync completion
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETED',
                timestamp: new Date().toISOString(),
                success: result
            });
        });

        return result;
        
    } catch (error) {
        console.error('Background sync failed:', error);
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_FAILED',
                timestamp: new Date().toISOString(),
                error: error.message
            });
        });
        
        throw error;
    }
}

// Get sync data from IndexedDB
async function getSyncData() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BroilerSyncDB', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const items = getAllRequest.result;
                // Get the most recent sync data
                const latest = items.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                )[0];
                resolve(latest);
            };
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('monthYear', 'monthYear', { unique: false });
            }
        };
    });
}

// Perform Firestore sync
async function performFirestoreSync(syncData) {
    try {
        // This is where you'd sync with Firebase
        // Since we can't use Firebase SDK in Service Worker directly,
        // we'll use fetch to hit a Cloud Function or just trigger the main app
        
        const { userId, monthYear, entries } = syncData.data;
        
        // Store sync status
        await saveSyncStatus({
            lastSync: new Date().toISOString(),
            userId: userId,
            monthYear: monthYear,
            entriesCount: entries?.length || 0
        });
        
        return true;
        
    } catch (error) {
        console.error('Firestore sync error:', error);
        return false;
    }
}

// Save sync status to cache
async function saveSyncStatus(status) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/sync-status', new Response(JSON.stringify(status)));
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'REGISTER_SYNC':
            // Register for background sync
            event.waitUntil(
                self.registration.sync.register(FIRESTORE_SYNC_TAG)
                    .then(() => {
                        console.log('Background sync registered');
                        // Also queue the data
                        return queueForSync(payload);
                    })
                    .catch(err => console.log('Background sync not supported:', err))
            );
            break;
            
        case 'QUEUE_DATA':
            event.waitUntil(queueForSync(payload));
            break;
            
        case 'GET_SYNC_STATUS':
            event.waitUntil(
                (async () => {
                    const status = await getSyncStatus();
                    event.ports[0].postMessage(status);
                })()
            );
            break;
    }
});

// Queue data for background sync
async function queueForSync(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BroilerSyncDB', 2);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            
            const addRequest = store.add({
                data: data,
                timestamp: new Date().toISOString(),
                type: 'firestore_sync',
                userId: data.userId,
                monthYear: data.monthYear
            });
            
            addRequest.onsuccess = () => {
                // Try to trigger background sync
                if (self.registration.sync) {
                    self.registration.sync.register(FIRESTORE_SYNC_TAG)
                        .catch(err => console.log('Sync registration failed:', err));
                }
                resolve();
            };
            addRequest.onerror = () => reject(addRequest.error);
        };
    });
}

// Get latest sync status
async function getSyncStatus() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/sync-status');
    if (response) {
        return await response.json();
    }
    return { lastSync: null };
}
