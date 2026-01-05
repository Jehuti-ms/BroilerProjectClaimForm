// sync.js - Firebase version
const SYNC_CONFIG = {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3
};

// Initialize cloud sync
function initCloudSync() {
    updateLastSyncDisplay();
    startAutoSync();
    console.log('Firebase cloud sync initialized');
}

// Main sync function - Push to Firebase
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showNotification('No data to sync', 'error');
        return;
    }
    
    showSyncStatus('🔄 Syncing to Firebase...', 'loading');
    
    try {
        // Try Firebase Firestore
        const firebaseSuccess = await syncToFirebase(user.username, JSON.parse(userData));
        
        if (firebaseSuccess) {
            showSyncStatus('✅ Data synced to Firebase!', 'success');
        } else {
            // Fallback to localStorage backup
            await syncToLocalBackup(user.username, JSON.parse(userData));
            showSyncStatus('✅ Data backed up locally', 'success');
        }
        
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        updateLastSyncDisplay();
        
    } catch (error) {
        console.error('Firebase sync failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

// Pull from Firebase
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Loading from Firebase...', 'loading');
    
    try {
        let cloudData = await syncFromFirebase(user.username);
        
        if (!cloudData) {
            cloudData = await syncFromLocalBackup(user.username);
        }
        
        if (cloudData && cloudData.data) {
            localStorage.setItem(`userData_${user.username}`, JSON.stringify(cloudData.data));
            
            // Notify main app to reload data
            if (typeof loadUserData === 'function') {
                loadUserData(user.username);
            }
            
            showSyncStatus('✅ Firebase data loaded!', 'success');
            updateLastSyncDisplay();
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
        }
        
    } catch (error) {
        console.error('Firebase retrieval failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

// Firebase sync functions
async function syncToFirebase(userId, data) {
    try {
        if (!firestore) {
            throw new Error('Firebase not initialized');
        }

        // Convert data to string for storage
        const dataString = JSON.stringify(data);
        
        // Create or update user document
        await firestore.collection('userData').doc(userId).set({
            userId: userId,
            data: dataString,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSync: new Date().toISOString()
        }, { merge: true });
        
        return true;
    } catch (error) {
        console.error('Firebase sync error:', error);
        return false;
    }
}

async function syncFromFirebase(userId) {
    try {
        if (!firestore) {
            throw new Error('Firebase not initialized');
        }

        // Get user document
        const docRef = firestore.collection('userData').doc(userId);
        const doc = await docRef.get();
        
        if (!doc.exists) {
            console.log('No Firebase data found for user:', userId);
            return null;
        }
        
        const data = doc.data();
        
        // Parse the data string back to object
        if (data.data) {
            data.data = JSON.parse(data.data);
        }
        
        return data;
    } catch (error) {
        console.error('Firebase retrieval error:', error);
        return null;
    }
}

// Local backup functions (fallback - keep existing)
async function syncToLocalBackup(username, data) {
    const syncData = {
        username: username,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`cloud_backup_${username}`, JSON.stringify(syncData));
    return true;
}

async function syncFromLocalBackup(username) {
    const backupData = localStorage.getItem(`cloud_backup_${username}`);
    if (backupData) {
        return JSON.parse(backupData);
    }
    return null;
}

// Auto-sync with Firebase
let autoSyncInterval = null;

function startAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    autoSyncInterval = setInterval(() => {
        if (navigator.onLine && !document.hidden && firestore) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const userData = localStorage.getItem(`userData_${user.username}`);
                if (userData) {
                    console.log('Auto-syncing to Firebase...');
                    syncToFirebase(user.username, JSON.parse(userData))
                        .then(success => {
                            if (success) {
                                localStorage.setItem('lastCloudSync', new Date().toISOString());
                                updateLastSyncDisplay();
                            }
                        })
                        .catch(error => {
                            console.error('Auto-sync error:', error);
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
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    console.log('=== FIREBASE DEBUG INFO ===');
    console.log('Firestore exists:', !!firestore);
    console.log('Auth exists:', !!auth);
    console.log('Current user:', localStorage.getItem('currentUser'));
    
    if (firestore) {
        try {
            // Test write and read
            const testRef = firestore.collection('connectionTests').doc('test');
            await testRef.set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                test: 'connection'
            });
            
            const doc = await testRef.get();
            console.log('Firebase test write successful:', doc.exists);
            
            // Clean up
            await testRef.delete();
            
            console.log('✅ Firebase connection successful!');
            showNotification('Firebase connected!', 'success');
            return true;
        } catch (error) {
            console.error('Firebase test failed:', error);
            showNotification('Firebase test failed: ' + error.message, 'error');
            return false;
        }
    } else {
        console.error('Firebase not initialized');
        showNotification('Firebase not loaded - check firebase-config.js', 'error');
        return false;
    }
}

// Keep existing utility functions (updateLastSyncDisplay, showSyncStatus, showNotification)
// These remain the same
