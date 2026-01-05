/**
 * Firebase Configuration & Initialization
 * Single source of truth for Firebase setup
 */

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDqoH0LgIIB2q4A8WH9f5RgopVEWqRKmAg",
    authDomain: "edumatrix-sync.firebaseapp.com",
    projectId: "edumatrix-sync",
    storageBucket: "edumatrix-sync.firebasestorage.app",
    messagingSenderId: "962108806962",
    appId: "1:962108806962:web:2d0bd9ba7fa5b55f1bd52e"
};

// Global flag - check if it already exists
if (typeof window.isFirebaseInitialized === 'undefined') {
    window.isFirebaseInitialized = false;
}

// Initialize Firebase (main function)
function initializeFirebase() {
    console.log('🚀 Initializing Firebase...');
    
    // Check if already initialized
    if (window.isFirebaseInitialized) {
        console.log('✅ Firebase already initialized, skipping');
        return firebase.app();
    }
    
    try {
        // Initialize Firebase app
        let app;
        if (firebase.apps.length === 0) {
            app = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } else {
            app = firebase.app();
            console.log('✅ Using existing Firebase app');
        }
        
        // Get services
        window.firestore = firebase.firestore();
        window.auth = firebase.auth();
        window.firebaseApp = app;
        
        // Mark as initialized
        window.isFirebaseInitialized = true;
        
        // Setup auth state listener
        setupAuthListener();
        
        // Setup offline persistence (non-blocking)
        setupOfflinePersistence();
        
        return app;
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
        
        // If duplicate app error, still mark as initialized
        if (error.code === 'app/duplicate-app') {
            window.isFirebaseInitialized = true;
            return firebase.app();
        }
        
        throw error;
    }
}

// Setup auth state listener
function setupAuthListener() {
    if (!window.auth) return;
    
    window.auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Firebase auth state: User signed in', user.email);
            // Dispatch event for other parts of the app
            window.dispatchEvent(new CustomEvent('firebase-auth-changed', {
                detail: { user: user, status: 'authenticated' }
            }));
        } else {
            console.log('👤 Firebase auth state: User signed out');
            window.dispatchEvent(new CustomEvent('firebase-auth-changed', {
                detail: { user: null, status: 'signed-out' }
            }));
        }
    });
}

// Setup offline persistence (with error handling)
function setupOfflinePersistence() {
    if (!window.firestore) return;
    
    // Skip if persistence already enabled
    if (window.firestore._persistenceEnabled) {
        console.log('📱 Persistence already enabled');
        return;
    }
    
    window.firestore.enablePersistence()
        .then(() => {
            console.log('📱 Firebase offline persistence enabled');
            
            // Sync with server
            window.firestore.enableNetwork().then(() => {
                console.log('🔄 Firestore synced with server');
            });
        })
        .catch((err) => {
            // Non-fatal errors - just log them
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Multiple tabs open, persistence disabled');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistence not supported in this browser');
            } else {
                console.warn('⚠️ Persistence setup failed:', err.code);
            }
        });
}

// Get Firebase services (lazy initialization)
function getFirebaseServices() {
    if (!window.isFirebaseInitialized) {
        initializeFirebase();
    }
    
    return {
        auth: window.auth || firebase.auth(),
        firestore: window.firestore || firebase.firestore(),
        app: window.firebaseApp || firebase.app()
    };
}

// Test Firebase connection
function testFirebaseConnection() {
    console.log('🔌 Testing Firebase connection...');
    
    const services = getFirebaseServices();
    
    return Promise.all([
        services.auth.currentUser ? 
            Promise.resolve(services.auth.currentUser.email) : 
            Promise.resolve('No user signed in'),
        
        services.firestore.collection('test').limit(1).get()
            .then(() => 'Firestore connected')
            .catch(err => `Firestore error: ${err.code}`)
    ]).then(results => {
        console.log('✅ Firebase test results:', results);
        return results;
    });
}

// Ensure Firebase is ready (for other scripts)
function ensureFirebaseReady() {
    return new Promise((resolve, reject) => {
        if (window.isFirebaseInitialized) {
            resolve(getFirebaseServices());
            return;
        }
        
        try {
            const services = getFirebaseServices();
            
            // Wait for auth to be ready
            const unsubscribe = services.auth.onAuthStateChanged(() => {
                unsubscribe();
                resolve(services);
            });
            
            // Timeout after 3 seconds
            setTimeout(() => {
                unsubscribe();
                resolve(services);
            }, 3000);
            
        } catch (error) {
            reject(error);
        }
    });
}

// Make functions available globally
window.initializeFirebase = initializeFirebase;
window.getFirebaseServices = getFirebaseServices;
window.testFirebaseConnection = testFirebaseConnection;
window.ensureFirebaseReady = ensureFirebaseReady;

// Auto-initialize when script loads
console.log('🔥 Firebase config loaded');
initializeFirebase();

// Debug info
console.log('=== FIREBASE DEBUG INFO ===');
console.log('Firebase SDK loaded:', typeof firebase !== 'undefined');
console.log('Firestore loaded:', typeof firebase.firestore !== 'undefined');
console.log('Auth loaded:', typeof firebase.auth !== 'undefined');
