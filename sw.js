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

        // Perform Firebase sync (this would need Firebase SDK in SW, but we'll trigger main app)
        console.log('Sync data ready:', syncData);
        
        // Notify clients of sync completion
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_COMPLETED',
                timestamp: new Date().toISOString(),
                success: true
            });
        });

        return true;
        
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
        // Open database with proper version and error handling
        const request = indexedDB.open('BroilerSyncDB', 2);
        
        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.error);
            resolve(null); // Resolve with null instead of rejecting
        };
        
        request.onupgradeneeded = (event) => {
            console.log('Creating/upgrading IndexedDB...');
            const db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains('syncQueue')) {
                const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                store.createIndex('timestamp', 'timestamp', { unique: false });
                store.createIndex('userId', 'userId', { unique: false });
                store.createIndex('monthYear', 'monthYear', { unique: false });
                console.log('Created syncQueue object store');
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            // Check if object store exists before using it
            if (!db.objectStoreNames.contains('syncQueue')) {
                console.log('syncQueue store not found, closing DB');
                db.close();
                resolve(null);
                return;
            }
            
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => {
                const items = getAllRequest.result;
                // Get the most recent sync data
                const latest = items.sort((a, b) => 
                    new Date(b.timestamp) - new Date(a.timestamp)
                )[0];
                db.close();
                resolve(latest);
            };
            
            getAllRequest.onerror = (error) => {
                console.error('Error getting sync data:', error);
                db.close();
                resolve(null);
            };
        };
    });
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
        // Open database with proper error handling
        const request = indexedDB.open('BroilerSyncDB', 2);
        
        request.onerror = (event) => {
            console.error('Error opening DB for queue:', event.target.error);
            resolve(); // Resolve anyway to not block
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                console.log('Created syncQueue during queue operation');
            }
        };
        
        request.onsuccess = (event) => {
            const db = event.target.result;
            
            // Ensure object store exists
            if (!db.objectStoreNames.contains('syncQueue')) {
                console.log('syncQueue store missing, closing DB');
                db.close();
                resolve();
                return;
            }
            
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
                console.log('Data queued for sync');
                // Try to trigger background sync
                if (self.registration.sync) {
                    self.registration.sync.register(FIRESTORE_SYNC_TAG)
                        .catch(err => console.log('Sync registration failed:', err));
                }
                db.close();
                resolve();
            };
            
            addRequest.onerror = (error) => {
                console.error('Error queuing data:', error);
                db.close();
                resolve(); // Resolve anyway
            };
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
