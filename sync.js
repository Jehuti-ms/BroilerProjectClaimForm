// sync.js - Firebase Sync Integration

let isSyncing = false;

function initFirebaseSync() {
    console.log('Initializing Firebase cloud sync...');
    
    // Wait for Firebase to be ready
    const checkInterval = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
            clearInterval(checkInterval);
            console.log('Firebase ready for sync');
            
            // Setup sync interval if auto-sync enabled
            const autoSync = localStorage.getItem('firebaseAutoSyncEnabled');
            if (autoSync === 'true') {
                startAutoSync();
            }
        }
    }, 500);
}

async function syncToCloud() {
    if (isSyncing) {
        console.log('Sync already in progress');
        return;
    }
    
    if (!firebase.auth().currentUser) {
        console.log('No Firebase user for sync');
        return;
    }
    
    isSyncing = true;
    
    try {
        const user = firebase.auth().currentUser;
        const userId = user.uid;
        
        // Get current data from app.js
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userEmail = currentUser.email || user.email;
        
        if (!userEmail) {
            throw new Error('No user email found');
        }
        
        const userDataKey = `userData_${userEmail}`;
        const allData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        // Sync each month
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(userId);
        
        // Ensure user document exists
        await userRef.set({
            email: userEmail,
            lastSynced: firebase.firestore.FieldValue.serverTimestamp(),
            displayName: currentUser.employeeName || user.displayName || ''
        }, { merge: true });
        
        // Sync time data
        const timeDataRef = userRef.collection('timeData');
        
        for (const [monthYear, data] of Object.entries(allData)) {
            await timeDataRef.doc(monthYear).set({
                userId: userId,
                userEmail: userEmail,
                monthYear: monthYear,
                data: data,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log(`Synced data for ${monthYear}`);
        }
        
        console.log('✅ All data synced to Firebase');
        
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus('Data synced to cloud', 'success');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Sync error:', error);
        
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus(`Sync failed: ${error.message}`, 'error');
        }
        
        return false;
        
    } finally {
        isSyncing = false;
    }
}

async function syncFromCloud() {
    if (!firebase.auth().currentUser) {
        console.log('No Firebase user for sync');
        return;
    }
    
    try {
        const user = firebase.auth().currentUser;
        const userId = user.uid;
        const userEmail = user.email;
        
        if (!userEmail) {
            throw new Error('No user email found');
        }
        
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
        
        // Merge with local data
        const userDataKey = `userData_${userEmail}`;
        const localData = JSON.parse(localStorage.getItem(userDataKey) || '{}');
        
        // Cloud data takes precedence
        const mergedData = { ...localData, ...cloudData };
        
        // Save merged data
        localStorage.setItem(userDataKey, JSON.stringify(mergedData));
        
        console.log('✅ Cloud data loaded and merged');
        
        // Update current view if needed
        if (typeof loadUserData === 'function') {
            loadUserData(userEmail);
        }
        
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus('Cloud data loaded', 'success');
        }
        
        return mergedData;
        
    } catch (error) {
        console.error('❌ Cloud load error:', error);
        
        if (typeof updateSyncStatus === 'function') {
            updateSyncStatus(`Cloud load failed: ${error.message}`, 'error');
        }
        
        return null;
    }
}

function startAutoSync() {
    console.log('Starting auto-sync (every 5 minutes)');
    
    // Initial sync
    setTimeout(syncToCloud, 5000);
    
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
