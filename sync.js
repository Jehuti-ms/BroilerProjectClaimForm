// sync.js - Complete rewrite for Firebase using Supabase pattern
const SYNC_CONFIG = {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3
};

// Initialize cloud sync
function initCloudSync() {
    updateLastSyncDisplay();
    startAutoSync();
    console.log('Cloud sync initialized for Firebase');
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
        // Sync to Firebase
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

// ================= FIREBASE FUNCTIONS =================

// Sync TO Firebase (like Supabase upsert)
async function syncToFirebase(username, data) {
    try {
        console.log('Syncing to Firebase for user:', username);
        
        // Check if Firebase is properly initialized
        if (!window.firebase || !window.firebase.firestore) {
            console.error('Firebase Firestore not initialized');
            return false;
        }
        
        const db = firebase.firestore();
        const userRef = db.collection('user_data').doc(username);
        
        // This is the Firebase equivalent of Supabase upsert
        await userRef.set({
            user_id: username,
            data: data,
            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
            last_sync: new Date().toISOString()
        }, { merge: true });  // {merge: true} = upsert (update or insert)
        
        console.log('✅ Firebase sync successful for:', username);
        return true;
        
    } catch (error) {
        console.error('❌ Firebase sync error:', error);
        return false;
    }
}

// Sync FROM Firebase (like Supabase select)
async function syncFromFirebase(username) {
    try {
        console.log('Loading from Firebase for user:', username);
        
        if (!window.firebase || !window.firebase.firestore) {
            console.error('Firebase Firestore not initialized');
            return null;
        }
        
        const db = firebase.firestore();
        const docRef = db.collection('user_data').doc(username);
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('✅ Firebase data loaded for:', username);
            return data;
        } else {
            console.log('ℹ️ No Firebase data found for:', username);
            return null;
        }
        
    } catch (error) {
        console.error('❌ Firebase retrieval error:', error);
        return null;
    }
}

// ================= LOCAL BACKUP FUNCTIONS =================

// Local backup functions (fallback)
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

// ================= AUTO-SYNC =================

let autoSyncInterval = null;

function startAutoSync() {
    // Stop any existing interval
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    // Auto-sync when online and app is active
    autoSyncInterval = setInterval(() => {
        if (navigator.onLine && !document.hidden) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const userData = localStorage.getItem(`userData_${user.username}`);
                if (userData) {
                    console.log('Auto-syncing data to Firebase...');
                    syncToFirebase(user.username, JSON.parse(userData))
                        .then(success => {
                            if (success) {
                                localStorage.setItem('lastCloudSync', new Date().toISOString());
                                updateLastSyncDisplay();
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
    }
}

// ================= DISPLAY FUNCTIONS =================

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
            if (diffMinutes < 5) {
                statusText += ' 🟢';
            } else if (diffMinutes < 60) {
                statusText += ' 🟡';
            } else {
                statusText += ' 🔴';
            }
            
            lastSyncElement.innerHTML = statusText;
        } else {
            lastSyncElement.innerHTML = 'Never synced 🔴';
        }
        lastSyncElement.style.display = 'block';
    }
}

function showSyncStatus(message, type) {
    const lastSyncElement = document.getElementById('last-sync');
    if (lastSyncElement) {
        lastSyncElement.innerHTML = message;
        lastSyncElement.style.display = 'block';
        lastSyncElement.style.padding = '10px';
        lastSyncElement.style.margin = '10px 0';
        lastSyncElement.style.borderRadius = '4px';
        lastSyncElement.style.textAlign = 'center';
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            loading: '#2196F3',
            info: '#FF9800'
        };
        
        lastSyncElement.style.background = colors[type] || colors.info;
        lastSyncElement.style.color = 'white';
    }
    
    // Also show notification
    showNotification(message, type);
}

// Enhanced notification function for sync
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'loading' ? '#2196F3' : '#4CAF50'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ================= FIREBASE DEBUG FUNCTIONS =================

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        console.log('=== FIREBASE DEBUG INFO ===');
        console.log('Firebase exists:', !!window.firebase);
        console.log('Firestore exists:', !!(window.firebase && window.firebase.firestore));
        
        if (!window.firebase) {
            console.error('Firebase not loaded');
            return false;
        }
        
        // Try a simple write/read test
        const db = firebase.firestore();
        const testRef = db.collection('_tests').doc('connection_test');
        
        const testData = {
            timestamp: new Date().toISOString(),
            test: 'connection_test'
        };
        
        // Write test
        await testRef.set(testData, { merge: true });
        console.log('✅ Firebase write test passed');
        
        // Read test
        const doc = await testRef.get();
        if (doc.exists) {
            console.log('✅ Firebase read test passed');
            return true;
        } else {
            console.error('❌ Firebase read test failed');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Firebase test failed:', error);
        return false;
    }
}

// Debug function to check sync status
function debugSyncStatus() {
    const currentUser = localStorage.getItem('currentUser');
    console.log('=== SYNC DEBUG ===');
    console.log('Current user:', currentUser ? JSON.parse(currentUser).username : 'None');
    console.log('Last sync:', localStorage.getItem('lastCloudSync'));
    console.log('Auto-sync enabled:', localStorage.getItem('autoSyncEnabled'));
    console.log('Firebase initialized:', !!(window.firebase && window.firebase.firestore));
    
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const hasLocalData = !!localStorage.getItem(`userData_${user.username}`);
        console.log('Local data exists:', hasLocalData);
    }
}

// ================= EXPORTS (for module support) =================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCloudSync,
        syncToCloud,
        syncFromCloud,
        startAutoSync,
        stopAutoSync,
        testFirebaseConnection,
        debugSyncStatus
    };
}

// Initialize on load if in browser context
if (typeof window !== 'undefined') {
    // Wait for Firebase to be loaded
    setTimeout(() => {
        if (window.firebase && typeof initCloudSync === 'function') {
            initCloudSync();
        }
    }, 1000);
}
