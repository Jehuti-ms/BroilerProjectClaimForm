// firebase-config.js - COMPLETE FIREBASE CONFIGURATION
// Add at the top of firebase-config.js
let isFirestoreInitialized = false;

// In setupOfflinePersistence function, add check:
function setupOfflinePersistence() {
    if (isFirestoreInitialized) {
        console.log('Firestore already initialized, skipping persistence setup');
        return Promise.resolve();
    }
    
    return firestore.enablePersistence()
        .then(() => {
            isFirestoreInitialized = true;
            console.log('📱 Firebase offline persistence enabled');
        })
        .catch((err) => {
            console.warn('⚠️ Offline persistence failed:', err.code);
            // Continue anyway
        });
}
const firebaseConfig = {
    // ⚠️ REPLACE THESE WITH YOUR ACTUAL FIREBASE CONFIG VALUES
     apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
  authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
  projectId: "broilerprojectclaimform-d6d51",
  storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
  messagingSenderId: "1069004689384",
  appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
};

// Prevent recursion by checking if function already exists
if (window.testFirebaseConnection && typeof window.testFirebaseConnection === 'function') {
    console.log('testFirebaseConnection already exists, renaming to avoid conflict');
    window._originalTestFirebaseConnection = window.testFirebaseConnection;
}

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
       /* setTimeout(() => {
            testFirebaseConnection().then(success => {
                if (success) {
                    console.log('✅ Firebase fully operational');
                    updateFirebaseStatus('connected');
                } else {
                    console.warn('⚠️ Firebase connection test failed');
                    updateFirebaseStatus('connection_error');
                }
            });
        }, 1000); */
        
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
    if (!firestore || !auth) {
        console.error('Firebase not initialized');
        return false;
    }
    
    try {
        updateFirebaseStatus('connecting');
        
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            console.log('No user signed in for test');
            updateFirebaseStatus('connected'); // Connection works, just no user
            return true;
        }
        
        console.log('Testing Firebase connection for user:', user.email);
        
        // Test with user's own document
        const userDocRef = firestore.collection('userData').doc(user.email);
        
        // Try to access (this should work with proper rules)
        await userDocRef.get();
        
        updateFirebaseStatus('connected');
        console.log('✅ Firebase connection working!');
        return true;
        
    } catch (error) {
        console.error('Firebase test failed:', error);
        
        if (error.code === 'permission-denied') {
            updateFirebaseStatus('permission_error');
            console.warn('Permission denied. Please update Firebase security rules.');
            showNotification('Firebase permissions issue. Update security rules.', 'error');
        } else if (error.code === 'unavailable') {
            updateFirebaseStatus('offline');
            console.warn('Firebase unavailable - offline mode');
        } else {
            updateFirebaseStatus('error');
        }
        
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

// ============ ADD THIS TO BOTTOM OF firebase-config.js ============

// Debug: Check what's available
console.log('=== FIREBASE DEBUG FROM CONFIG ===');
console.log('Firebase SDK loaded:', typeof firebase !== 'undefined');
console.log('Firestore loaded:', typeof firebase?.firestore !== 'undefined');
console.log('Auth loaded:', typeof firebase?.auth !== 'undefined');

// Force initialization if not done
// Global flag to track initialization
let isFirebaseInitialized = false;

// Modified ensureFirebaseInitialized function
function ensureFirebaseInitialized() {
    console.log('ensureFirebaseInitialized called, isFirebaseInitialized:', isFirebaseInitialized);
    
    if (isFirebaseInitialized) {
        console.log('✅ Firebase already initialized, skipping');
        return Promise.resolve();
    }
    
    if (firebase.apps.length > 0) {
        console.log('✅ Firebase app already exists, marking as initialized');
        isFirebaseInitialized = true;
        return Promise.resolve();
    }
    
    console.log('🔥 Initializing Firebase from ensureFirebaseInitialized...');
    
    try {
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase manually initialized');
        console.log('Project ID:', app.options.projectId);
        
        // Get services
        window.firestore = firebase.firestore();
        window.auth = firebase.auth();
        window.firebaseApp = app;
        
        isFirebaseInitialized = true;
        
        // Setup offline persistence without trying to enable it twice
        return setupOfflinePersistenceSafe();
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error.message);
        
        // If app already exists, use it
        if (error.code === 'app/duplicate-app') {
            console.log('Using existing Firebase app');
            window.firestore = firebase.firestore();
            window.auth = firebase.auth();
            window.firebaseApp = firebase.app();
            isFirebaseInitialized = true;
            return Promise.resolve();
        }
        
        return Promise.reject(error);
    }
}

// Safe persistence setup that won't fail if already enabled
function setupOfflinePersistenceSafe() {
    if (window.firestore._persistenceEnabled) {
        console.log('📱 Persistence already enabled, skipping');
        return Promise.resolve();
    }
    
    return window.firestore.enablePersistence()
        .then(() => {
            console.log('📱 Firebase offline persistence enabled');
        })
        .catch((err) => {
            // Don't fail if persistence can't be enabled
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Multiple tabs open, persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistence not supported in this browser');
            } else {
                console.warn('⚠️ Persistence setup failed:', err.code);
            }
            // Continue without persistence
        });
}

// Make sure functions are available
window.ensureFirebaseInitialized = ensureFirebaseInitialized;
