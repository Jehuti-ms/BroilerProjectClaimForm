// firebase-config.js - COMPLETE FIREBASE CONFIGURATION
const firebaseConfig = {
    // ⚠️ REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG VALUES
     apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
  authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
  projectId: "broilerprojectclaimform-d6d51",
  storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
  messagingSenderId: "1069004689384",
  appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
};

// Global Firebase variables
let firebaseApp;
let firestore;
let auth;
let isFirebaseInitialized = false;

// Initialize Firebase when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Firebase...');
    
    // Check if Firebase SDK is loaded
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK not loaded. Check script tags in HTML.');
        updateFirebaseStatus('sdk_error');
        return;
    }
    
    try {
        // Initialize Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        
        // Get Firestore and Auth services
        firestore = firebase.firestore();
        auth = firebase.auth();
        
        isFirebaseInitialized = true;
        console.log('✅ Firebase initialized successfully');
        
        // Set up offline persistence
        setupOfflinePersistence();
        
        // Update UI status
        updateFirebaseStatus('initializing');
        
        // Set up auth state listener
        setupAuthListener();
        
        // Test connection after a brief delay
        setTimeout(() => {
            testFirebaseConnection().then(success => {
                if (success) {
                    console.log('✅ Firebase fully operational');
                    updateFirebaseStatus('connected');
                } else {
                    console.warn('⚠️ Firebase connection test failed');
                    updateFirebaseStatus('connection_error');
                }
            });
        }, 1000);
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        isFirebaseInitialized = false;
        updateFirebaseStatus('init_error');
    }
});

// Set up offline persistence
function setupOfflinePersistence() {
    if (!firestore) return;
    
    firestore.enablePersistence()
        .then(() => {
            console.log('📱 Firebase offline persistence enabled');
            
            // Monitor sync state
            firestore.onSnapshotsInSync(() => {
                console.log('🔄 Firestore synced with server');
            });
        })
        .catch(err => {
            console.warn('Offline persistence error:', err.code);
            
            if (err.code === 'failed-precondition') {
                console.log('Multiple tabs open - persistence limited to one tab');
            } else if (err.code === 'unimplemented') {
                console.log('Browser does not support offline persistence');
            }
        });
}

// Set up auth state listener
function setupAuthListener() {
    if (!auth) return;
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Firebase auth state: User signed in', user.email);
            // User is signed in
            updateFirebaseStatus('connected');
        } else {
            console.log('👤 Firebase auth state: No user signed in');
            // User is signed out
        }
    }, (error) => {
        console.error('Auth state error:', error);
    });
}

// Update Firebase connection status display
function updateFirebaseStatus(status) {
    const statusElement = document.getElementById('firebase-status');
    const statusText = document.getElementById('firebase-status-text');
    
    if (!statusElement || !statusText) {
        // Elements might not exist yet
        setTimeout(() => updateFirebaseStatus(status), 100);
        return;
    }
    
    statusElement.style.display = 'block';
    statusElement.style.padding = '6px 10px';
    statusElement.style.borderRadius = '4px';
    statusElement.style.fontSize = '12px';
    statusElement.style.fontWeight = 'bold';
    
    switch(status) {
        case 'initializing':
            statusText.innerHTML = 'Firebase: 🔄 Initializing...';
            statusElement.style.background = '#fff3cd';
            statusElement.style.color = '#856404';
            statusElement.style.border = '1px solid #ffeaa7';
            break;
            
        case 'connected':
            statusText.innerHTML = 'Firebase: ✅ Connected';
            statusElement.style.background = '#d4edda';
            statusElement.style.color = '#155724';
            statusElement.style.border = '1px solid #c3e6cb';
            break;
            
        case 'connection_error':
            statusText.innerHTML = 'Firebase: ⚠️ Connection Error';
            statusElement.style.background = '#fff3cd';
            statusElement.style.color = '#856404';
            statusElement.style.border = '1px solid #ffeaa7';
            break;
            
        case 'init_error':
            statusText.innerHTML = 'Firebase: ❌ Init Failed';
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
            statusElement.style.border = '1px solid #f5c6cb';
            break;
            
        case 'sdk_error':
            statusText.innerHTML = 'Firebase: ❌ SDK Not Loaded';
            statusElement.style.background = '#f8d7da';
            statusElement.style.color = '#721c24';
            statusElement.style.border = '1px solid #f5c6cb';
            break;
            
        case 'offline':
            statusText.innerHTML = 'Firebase: 📴 Offline Mode';
            statusElement.style.background = '#e2e3e5';
            statusElement.style.color = '#383d41';
            statusElement.style.border = '1px solid #d6d8db';
            break;
            
        default:
            statusText.innerHTML = 'Firebase: 🔄 Unknown';
            statusElement.style.background = '#e2e3e5';
            statusElement.style.color = '#383d41';
            statusElement.style.border = '1px solid #d6d8db';
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    if (!firestore || !isFirebaseInitialized) {
        console.error('Firebase not initialized');
        updateFirebaseStatus('init_error');
        return false;
    }
    
    try {
        updateFirebaseStatus('initializing');
        
        // Create a unique test document ID
        const testId = 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const testRef = firestore.collection('connectionTests').doc(testId);
        
        // Test write operation
        await testRef.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            test: 'connection_test',
            userAgent: navigator.userAgent.substring(0, 100),
            testId: testId
        });
        
        console.log('✅ Firebase write test successful');
        
        // Test read operation
        const docSnapshot = await testRef.get();
        if (!docSnapshot.exists) {
            throw new Error('Test document not found after write');
        }
        
        console.log('✅ Firebase read test successful');
        
        // Clean up test document
        await testRef.delete();
        console.log('✅ Firebase cleanup successful');
        
        updateFirebaseStatus('connected');
        return true;
        
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        
        let errorMessage = 'Firebase Error: ';
        switch (error.code) {
            case 'permission-denied':
                errorMessage += 'Permission denied. Check security rules.';
                updateFirebaseStatus('connection_error');
                break;
                
            case 'unavailable':
                errorMessage += 'Service unavailable. You may be offline.';
                updateFirebaseStatus('offline');
                break;
                
            case 'failed-precondition':
                errorMessage += 'Database not ready.';
                updateFirebaseStatus('connection_error');
                break;
                
            default:
                errorMessage += error.message || 'Unknown error';
                updateFirebaseStatus('connection_error');
        }
        
        console.warn(errorMessage);
        return false;
    }
}

// Check if Firebase is available
function isFirebaseAvailable() {
    return isFirebaseInitialized && firestore && auth;
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

// Show notification (compatible with existing app)
function showFirebaseNotification(message, type = 'info') {
    // Use existing notification system if available
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }
    
    // Fallback notification
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Create simple notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : 
                     type === 'success' ? '#4CAF50' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Export Firebase services to global scope
window.firebaseApp = firebaseApp;
window.firestore = firestore;
window.auth = auth;
window.isFirebaseAvailable = isFirebaseAvailable;
window.testFirebaseConnection = testFirebaseConnection;
window.getCurrentFirebaseUser = getCurrentFirebaseUser;
window.updateFirebaseStatus = updateFirebaseStatus;
window.showFirebaseNotification = showFirebaseNotification;

// Auto-update status based on network connectivity
window.addEventListener('online', () => {
    console.log('Browser online - checking Firebase connection');
    if (isFirebaseAvailable()) {
        testFirebaseConnection();
    }
});

window.addEventListener('offline', () => {
    console.log('Browser offline');
    updateFirebaseStatus('offline');
});

console.log('🔥 Firebase config loaded');
