// Service Worker for Broiler App Sync
const CACHE_NAME = 'broiler-sync-v1';
const SYNC_TAG = 'broiler-background-sync';

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
    if (event.tag === SYNC_TAG) {
        console.log('Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

// Handle periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'broiler-periodic-sync') {
        console.log('Periodic sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

// Main sync function
async function doBackgroundSync() {
    try {
        // Get all clients (browser tabs)
        const clients = await self.clients.matchAll();
        
        // Notify all clients that sync is starting
        clients.forEach(client => {
            client.postMessage({
                type: 'SYNC_STARTED',
                timestamp: new Date().toISOString()
            });
        });

        // Perform the actual sync
        const result = await performSync();
        
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
        
        // Notify clients of sync failure
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

// Perform the actual data synchronization
async function performSync() {
    try {
        // Get sync data from IndexedDB
        const syncData = await getSyncDataFromIDB();
        
        if (!syncData || Object.keys(syncData).length === 0) {
            console.log('No data to sync');
            return true;
        }

        // Try to sync to cloud
        const cloudSuccess = await syncToCloud(syncData);
        
        if (cloudSuccess) {
            console.log('Cloud sync successful');
            // Clear sync queue after successful sync
            await clearSyncQueue();
        } else {
            console.log('Cloud sync failed, will retry later');
        }

        return cloudSuccess;
    } catch (error) {
        console.error('Sync operation failed:', error);
        return false;
    }
}

// Get data from IndexedDB
async function getSyncDataFromIDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BroilerSyncDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

// Sync to cloud storage
async function syncToCloud(syncData) {
    try {
        // Use jsonblob.com as cloud storage (free, no auth required)
        const blobId = await getBlobId();
        const syncPayload = {
            data: syncData,
            lastSync: new Date().toISOString(),
            device: 'service-worker'
        };

        const url = blobId ? 
            `https://jsonblob.com/api/jsonBlob/${blobId}` :
            'https://jsonblob.com/api/jsonBlob';

        const method = blobId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(syncPayload)
        });

        if (response.ok) {
            if (!blobId) {
                // Store the new blob ID
                const location = response.headers.get('Location');
                if (location) {
                    const newBlobId = location.split('/').pop();
                    await setBlobId(newBlobId);
                }
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Cloud sync error:', error);
        return false;
    }
}

// Get stored blob ID
async function getBlobId() {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/blob-id');
    if (response) {
        return await response.text();
    }
    return null;
}

// Store blob ID
async function setBlobId(blobId) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('/blob-id', new Response(blobId));
}

// Clear sync queue after successful sync
async function clearSyncQueue() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BroilerSyncDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const clearRequest = store.clear();
            
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        };
    });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'TRIGGER_SYNC':
            event.waitUntil(doBackgroundSync());
            break;
            
        case 'QUEUE_DATA':
            event.waitUntil(queueDataForSync(payload));
            break;
            
        case 'GET_SYNC_STATUS':
            event.ports[0].postMessage({ status: 'active' });
            break;
    }
});

// Queue data for background sync
async function queueDataForSync(data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BroilerSyncDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            
            const addRequest = store.add({
                data: data,
                timestamp: new Date().toISOString(),
                type: 'user_data'
            });
            
            addRequest.onsuccess = () => resolve();
            addRequest.onerror = () => reject(addRequest.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}
