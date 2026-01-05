// sync.js - Complete Firebase Synchronization (FIXED VERSION)

// Cloud Sync Configuration
const SYNC_CONFIG = {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    maxSyncSize: 1048576 // 1MB max sync size
};

// Sync status tracking
let isSyncing = false;
let lastSyncAttempt = null;
let syncRetryCount = 0;
let autoSyncInterval = null;

// Initialize cloud sync
function initCloudSync() {
    console.log('Initializing Firebase cloud sync...');
    updateLastSyncDisplay();
    
    // Start auto-sync if enabled
    const firebaseAutoSync = document.getElementById('firebase-auto-sync');
    if (firebaseAutoSync && firebaseAutoSync.checked) {
        startAutoSync();
    }
    
    // Check for pending syncs
    checkPendingSyncs();
}

// Main sync function - Push to Firebase
async function syncToCloud() {
    if (isSyncing) {
        showNotification('Sync already in progress', 'info');
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userId = user.username || user.email;
    const userData = localStorage.getItem(`userData_${userId}`);
    
    if (!userData) {
        showNotification('No data to sync', 'info');
        return;
    }
    
    // Check Firebase availability
    if (!window.firestore || !window.auth) {
        showNotification('Firebase not available. Check connection.', 'error');
        return;
    }
    
    // Check if user is authenticated with Firebase
    const firebaseUser = await getCurrentFirebaseUser();
    if (!firebaseUser) {
        showNotification('Please sign in with Firebase to sync', 'error');
        return;
    }
    
    isSyncing = true;
    lastSyncAttempt = new Date();
    showNotification('🔄 Syncing to Firebase...', 'loading');
    updateSyncStatus('🔄 Syncing to Firebase...', 'loading');
    
    try {
        const data = JSON.parse(userData);
        
        // Check data size
        const dataSize = new Blob([userData]).size;
        if (dataSize > SYNC_CONFIG.maxSyncSize) {
            throw new Error(`Data too large (${(dataSize / 1024).toFixed(2)}KB). Max: 1MB`);
        }
        
        // Try Firebase Firestore sync
        const firebaseSuccess = await syncToFirebase(userId, data);
        
        if (firebaseSuccess) {
            showNotification('✅ Data synced to Firebase!', 'success');
            updateSyncStatus('✅ Data synced to Firebase!', 'success');
            localStorage.setItem('lastCloudSync', new Date().toISOString());
            syncRetryCount = 0;
        } else {
            // Fallback to localStorage backup
            await syncToLocalBackup(userId, data);
            showNotification('⚠️ Synced to local backup (Firebase failed)', 'warning');
            updateSyncStatus('⚠️ Synced to local backup', 'warning');
        }
        
        updateLastSyncDisplay();
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        
        let errorMessage = 'Sync failed: ';
        if (error.message.includes('permission-denied')) {
            errorMessage += 'Permission denied. Check Firebase security rules.';
        } else if (error.message.includes('unavailable')) {
            errorMessage += 'Firebase unavailable. You may be offline.';
        } else {
            errorMessage += error.message;
        }
        
        showNotification(errorMessage, 'error');
        updateSyncStatus('❌ Sync failed', 'error');
        
        // Increment retry count
        syncRetryCount++;
        
        // Schedule retry if needed
        if (syncRetryCount < SYNC_CONFIG.retryAttempts) {
            setTimeout(() => {
                showNotification(`Retrying sync (${syncRetryCount}/${SYNC_CONFIG.retryAttempts})...`, 'info');
                syncToCloud();
            }, 5000);
        }
        
    } finally {
        isSyncing = false;
    }
}

// Pull from Firebase
async function syncFromCloud() {
    if (isSyncing) {
        showNotification('Sync already in progress', 'info');
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userId = user.username || user.email;
    
    // Check Firebase availability
    if (!window.firestore || !window.auth) {
        showNotification('Firebase not available. Check connection.', 'error');
        return;
    }
    
    // Check if user is authenticated with Firebase
    const firebaseUser = await getCurrentFirebaseUser();
    if (!firebaseUser) {
        showNotification('Please sign in with Firebase to sync', 'error');
        return;
    }
    
    isSyncing = true;
    showNotification('🔄 Loading from Firebase...', 'loading');
    updateSyncStatus('🔄 Loading from Firebase...', 'loading');
    
    try {
        let cloudData = await syncFromFirebase(userId);
        
        if (!cloudData) {
            // Try local backup
            cloudData = await syncFromLocalBackup(userId);
            if (cloudData) {
                showNotification('ℹ️ Loaded from local backup (no cloud data)', 'info');
                updateSyncStatus('ℹ️ Loaded from local backup', 'info');
            }
        }
        
        if (cloudData && cloudData.data) {
            // Parse data if it's a string
            const data = typeof cloudData.data === 'string' ? 
                JSON.parse(cloudData.data) : cloudData.data;
            
            localStorage.setItem(`userData_${userId}`, JSON.stringify(data));
            
            // Notify main app to reload data
            if (typeof loadUserData === 'function') {
                loadUserData(userId);
            }
            
            showNotification('✅ Cloud data loaded!', 'success');
            updateSyncStatus('✅ Cloud data loaded!', 'success');
            updateLastSyncDisplay();
            
            // Update last sync time from cloud data
            if (cloudData.lastSync) {
                localStorage.setItem('lastCloudSync', cloudData.lastSync);
            } else {
                localStorage.setItem('lastCloudSync', new Date().toISOString());
            }
            
        } else {
            showNotification('ℹ️ No cloud data found', 'info');
            updateSyncStatus('ℹ️ No cloud data found', 'info');
        }
        
    } catch (error) {
        console.error('Cloud retrieval failed:', error);
        showNotification('❌ Failed to load from cloud', 'error');
        updateSyncStatus('❌ Failed to load from cloud', 'error');
    } finally {
        isSyncing = false;
    }
}

// Firebase sync functions
async function syncToFirebase(userId, data) {
    if (!firestore) {
        console.warn('Firestore not available');
        return false;
    }
    
    try {
        // Convert data to string for storage
        const dataString = JSON.stringify(data);
        
        // Create or update user document
        await firestore.collection('userData').doc(userId).set({
            userId: userId,
            data: dataString,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSync: new Date().toISOString(),
            device: navigator.userAgent.substring(0, 100),
            dataSize: new Blob([dataString]).size
        }, { merge: true });
        
        console.log('✅ Data synced to Firebase for user:', userId);
        return true;
        
    } catch (error) {
        console.error('Firebase sync error:', error);
        
        // Check for common errors
        if (error.code === 'permission-denied') {
            console.warn('Permission denied - check Firebase security rules');
        } else if (error.code === 'unavailable') {
            console.warn('Firebase unavailable - offline mode');
        }
        
        return false;
    }
}

async function syncFromFirebase(userId) {
    if (!firestore) {
        console.warn('Firestore not available');
        return null;
    }
    
    try {
        // Get user document
        const docRef = firestore.collection('userData').doc(userId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.log('No Firebase data found for:', userId);
            return null;
        }
        
        const data = doc.data();
        console.log('✅ Data loaded from Firebase for user:', userId);
        return data;
        
    } catch (error) {
        console.error('Firebase retrieval error:', error);
        
        if (error.code === 'permission-denied') {
            console.warn('Permission denied - check Firebase security rules');
        } else if (error.code === 'unavailable') {
            console.warn('Firebase unavailable - offline mode');
        }
        
        return null;
    }
}

// Local backup functions (fallback)
async function syncToLocalBackup(userId, data) {
    const syncData = {
        userId: userId,
        data: data,
        timestamp: new Date().toISOString(),
        backupType: 'firebase_fallback'
    };
    
    localStorage.setItem(`firebase_backup_${userId}`, JSON.stringify(syncData));
    console.log('✅ Data backed up locally for user:', userId);
    return true;
}

async function syncFromLocalBackup(userId) {
    const backupData = localStorage.getItem(`firebase_backup_${userId}`);
    if (backupData) {
        console.log('✅ Data loaded from local backup for user:', userId);
        return JSON.parse(backupData);
    }
    return null;
}

// Auto-sync functionality
function startAutoSync() {
    // Stop any existing interval
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    console.log('Starting Firebase auto-sync...');
    
    // Auto-sync when online and app is active
    autoSyncInterval = setInterval(() => {
        if (navigator.onLine && !document.hidden) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const userId = user.username || user.email;
                const userData = localStorage.getItem(`userData_${userId}`);
                
                if (userData && firestore && auth) {
                    console.log('Auto-syncing to Firebase...');
                    
                    // Get Firebase user
                    getCurrentFirebaseUser().then(firebaseUser => {
                        if (firebaseUser) {
                            syncToFirebase(userId, JSON.parse(userData))
                                .then(success => {
                                    if (success) {
                                        localStorage.setItem('lastCloudSync', new Date().toISOString());
                                        updateLastSyncDisplay();
                                        console.log('✅ Auto-sync successful');
                                    }
                                })
                                .catch(error => {
                                    console.error('Auto-sync error:', error);
                                });
                        }
                    });
                }
            }
        }
    }, SYNC_CONFIG.autoSyncInterval);
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        console.log('Firebase auto-sync stopped');
    }
}

// Sync status display
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastCloudSync');
    const lastSyncElement = document.getElementById('last-sync');
    
    if (lastSyncElement) {
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSyncDate) / (1000 * 60));
            
            let statusText = `Last synced: ${lastSyncDate.toLocaleString()}`;
            let statusClass = 'sync-error';
            
            if (diffMinutes < 5) {
                statusText += ' 🟢';
                statusClass = 'sync-success';
            } else if (diffMinutes < 60) {
                statusText += ' 🟡';
                statusClass = 'sync-warning';
            } else {
                statusText += ' 🔴';
                statusClass = 'sync-error';
            }
            
            lastSyncElement.innerHTML = statusText;
            lastSyncElement.className = `last-sync ${statusClass}`;
        } else {
            lastSyncElement.innerHTML = 'Never synced 🔴';
            lastSyncElement.className = 'last-sync sync-error';
        }
        lastSyncElement.style.display = 'block';
    }
}

function showSyncStatus(message, type) {
    updateSyncStatus(message, type);
    showNotification(message, type);
}

// Check for pending syncs
function checkPendingSyncs() {
    const lastSync = localStorage.getItem('lastCloudSync');
    if (!lastSync) return;
    
    const lastSyncDate = new Date(lastSync);
    const now = new Date();
    const diffHours = Math.floor((now - lastSyncDate) / (1000 * 60 * 60));
    
    if (diffHours > 24) {
        showNotification('Last sync was over 24 hours ago. Consider syncing now.', 'warning');
    }
}

// Get current Firebase user
async function getCurrentFirebaseUser() {
    if (!auth) return null;
    
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

// Test Firebase connection - FIXED VERSION (no recursion)
async function testFirebaseConnection() {
    console.log('Testing Firebase connection from sync.js...');
    
    // Use the testFirebaseConnection from firebase-config.js if available
    if (typeof window.testFirebaseConnection === 'function') {
        console.log('Using firebase-config.js test function');
        return await window.testFirebaseConnection();
    }
    
    // Fallback test if firebase-config.js function not available
    if (!firestore) {
        console.error('Firestore not available for testing');
        return false;
    }
    
    try {
        console.log('Running basic Firebase test...');
        
        // Create a unique test document ID
        const testId = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const testRef = firestore.collection('connectionTests').doc(testId);
        
        // Test write operation
        await testRef.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            test: 'connection_test_from_syncjs',
            testId: testId
        });
        
        console.log('✅ Basic Firebase write test successful');
        
        // Test read operation
        const docSnapshot = await testRef.get();
        if (!docSnapshot.exists) {
            throw new Error('Test document not found after write');
        }
        
        console.log('✅ Basic Firebase read test successful');
        
        // Clean up test document
        await testRef.delete();
        console.log('✅ Basic Firebase cleanup successful');
        
        return true;
        
    } catch (error) {
        console.error('❌ Basic Firebase connection test failed:', error);
        return false;
    }
}

// Debug function
async function debugFirebaseSync() {
    console.log('=== FIREBASE SYNC DEBUG ===');
    console.log('Firestore available:', !!firestore);
    console.log('Auth available:', !!auth);
    console.log('Current user:', localStorage.getItem('currentUser'));
    console.log('Is syncing:', isSyncing);
    console.log('Last sync attempt:', lastSyncAttempt);
    console.log('Sync retry count:', syncRetryCount);
    console.log('Auto-sync interval:', autoSyncInterval ? 'Running' : 'Stopped');
    
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userId = user.username || user.email;
        console.log('User ID:', userId);
        
        const userData = localStorage.getItem(`userData_${userId}`);
        console.log('Local data size:', userData ? new Blob([userData]).size + ' bytes' : 'No data');
        
        // Test Firebase connection
        if (firestore) {
            try {
                const docRef = firestore.collection('userData').doc(userId);
                const doc = await docRef.get();
                console.log('Firestore document exists:', doc.exists);
                
                if (doc.exists) {
                    const data = doc.data();
                    console.log('Cloud data size:', data?.data ? new Blob([data.data]).size + ' bytes' : 'No data');
                    console.log('Last cloud update:', data?.updatedAt);
                }
            } catch (error) {
                console.error('Firestore debug error:', error);
            }
        }
    }
}

// Initialize sync when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initCloudSync, 3000);
});

// Export functions for use in other files
window.syncToCloud = syncToCloud;
window.syncFromCloud = syncFromCloud;
window.startAutoSync = startAutoSync;
window.stopAutoSync = stopAutoSync;
window.testFirebaseConnection = testFirebaseConnection;
window.debugFirebaseSync = debugFirebaseSync;
