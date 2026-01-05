// config.js - Traditional Firebase 10.7.1 (compatibility version)

// Firebase configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Initialize Firebase when it's loaded
function initializeFirebase() {
    try {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.error('Firebase not loaded yet');
            return false;
        }
        
        // Initialize Firebase app
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        
        // Get Firestore and Auth instances
        const db = firebase.firestore(app);
        const auth = firebase.auth(app);
        
        // Make available globally (matching your architecture)
        window.firebaseApp = app;
        window.firestore = db;
        window.firebaseAuth = auth;
        
        console.log('✅ Firebase initialized successfully');
        
        // Test connection
        testFirebaseConnection();
        
        return true;
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        
        // Check if already initialized
        if (error.code === 'app/duplicate-app') {
            console.log('Firebase already initialized, getting references...');
            window.firestore = firebase.firestore();
            window.firebaseAuth = firebase.auth();
            return true;
        }
        
        return false;
    }
}

// Test Firebase connection
async function testFirebaseConnection() {
    if (!window.firestore) {
        console.log('Firestore not available for testing');
        return false;
    }
    
    try {
        const testRef = firestore.collection('_connection_tests').doc('test');
        await testRef.set({
            test: 'connection_test',
            timestamp: new Date().toISOString()
        }, { merge: true });
        
        console.log('✅ Firebase connection test passed');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
}

// Wait for DOM and Firebase to load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Firebase...');
    
    // Check if Firebase scripts are loaded
    if (typeof firebase !== 'undefined') {
        // Firebase already loaded, initialize immediately
        initializeFirebase();
    } else {
        // Wait for Firebase to load
        const firebaseCheckInterval = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(firebaseCheckInterval);
                initializeFirebase();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(firebaseCheckInterval);
            if (!window.firestore) {
                console.warn('⚠️ Firebase not loaded after 10 seconds');
            }
        }, 10000);
    }
});

// Make functions available globally
window.initializeFirebase = initializeFirebase;
window.testFirebaseConnection = testFirebaseConnection;
