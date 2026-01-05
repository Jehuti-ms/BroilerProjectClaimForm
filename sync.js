// sync.js - Firebase Sync Integration

let isSyncing = false;

// Initialize sync system
function initFirebaseSync() {
    console.log('Initializing Firebase cloud sync...');
    
    // Wait for Firebase and auth to be ready
    const checkInterval = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            clearInterval(checkInterval);
            console.log('Firebase ready for sync');
            
            // Listen for auth changes
            firebase.auth().onAuthStateChanged((user) => {
                console.log('Sync: Auth state changed', user ? user.email : 'No user');
                if (user) {
                    // User signed in - setup sync
                    setupUserSync(user);
                }
            });
            
            // Check current auth state
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                setupUserSync(currentUser);
            }
        }
    }, 500);
}

// Setup sync for specific user
function setupUserSync(firebaseUser) {
    console.log('Setting up sync for user:', firebaseUser.email);
    
    // Check if auto-sync is enabled
    const autoSyncEnabled = localStorage.getItem('firebaseAutoSyncEnabled') === 'true';
    
    if (autoSyncEnabled) {
        startAutoSync();
    }
    
    // Do initial sync
    setTimeout(() => {
        syncFromCloud(); // Load cloud data first
        setTimeout(syncToCloud, 2000); // Then sync local changes
    }, 1000);
}

// Sync local data to Firebase
async function syncToCloud() {
    if (isSyncing) {
        console.log('Sync already in progress');
        return;
    }
    
    const firebaseUser = firebase.auth().currentUser;
    if (!firebaseUser) {
        console.log('No Firebase user for sync');
        return;
    }
    
    isSyncing = true;
    
    try {
        const userId = firebaseUser.uid;
        const userEmail = firebaseUser.email;
        
        // Get user data from localStorage
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) {
            throw new Error('No user data found');
        }
        
        const userData = JSON.parse(savedUser);
        const userDataKey = `userData_${userEmail}`;
        const allData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        // Sync to Firebase
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(userId);
        
        // Update user document
        await userRef.set({
            email: userEmail,
            displayName: userData.employeeName || userEmail,
            lastSynced: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        // Sync time data
        const timeDataRef = userRef.collection('timeData');
        
        for (const [monthYear, data] of Object.entries(allData)) {
            if (data && Array.isArray(data) && data.length > 0) {
                await timeDataRef.doc(monthYear).set({
                    userId: userId,
                    userEmail: userEmail,
                    monthYear: monthYear,
                    data: data,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                
                console.log(`Synced ${data.length} entries for ${monthYear}`);
            }
        }
        
        console.log('✅ All data synced to Firebase');
        
        // Update sync status in UI
        if (typeof showNotification === 'function') {
            showNotification('Data synced to cloud', 'success');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        
        if (typeof showNotification === 'function') {
            showNotification(`Sync failed: ${error.message}`, 'error');
        }
        
        return false;
        
    } finally {
        isSyncing = false;
    }
}

// Sync data from Firebase to local
async function syncFromCloud() {
    const firebaseUser = firebase.auth().currentUser;
    if (!firebaseUser) {
        console.log('No Firebase user for sync');
        return;
    }
    
    try {
        const userId = firebaseUser.uid;
        const userEmail = firebaseUser.email;
        
        const db = firebase.firestore();
        const timeDataRef = db.collection('users').doc(userId).collection('timeData');
        
        const snapshot = await timeDataRef.get();
        
        if (snapshot.empty) {
            console.log('No cloud data found');
            return null;
        }
        
        const cloudData = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            cloudData[data.monthYear] = data.data;
        });
        
        // Merge with local data (cloud takes precedence)
        const userDataKey = `userData_${userEmail}`;
        const localData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        const mergedData = { ...localData, ...cloudData };
        
        // Save merged data
        localStorage.setItem(userDataKey, JSON.stringify(mergedData));
        
        console.log('✅ Cloud data loaded and merged');
        
        // Update current view if on correct page
        if (typeof loadCurrentUserData === 'function') {
            loadCurrentUserData();
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Cloud data loaded', 'success');
        }
        
        return mergedData;
        
    } catch (error) {
        console.error('❌ Cloud load error:', error);
        
        if (typeof showNotification === 'function') {
            showNotification(`Cloud load failed: ${error.message}`, 'error');
        }
        
        return null;
    }
}

function startAutoSync() {
    console.log('Starting auto-sync (every 5 minutes)');
    
    // Periodic sync
    setInterval(() => {
        if (navigator.onLine && firebase.auth().currentUser) {
            syncToCloud();
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initFirebaseSync, 2000);
});

// Make functions available globally
window.syncToCloud = syncToCloud;
window.syncFromCloud = syncFromCloud;
window.startAutoSync = startAutoSync;
