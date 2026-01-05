// config.js - SIMPLIFIED VERSION FOR COMPATIBILITY

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Simple initialization that waits for Firebase to load
function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded yet');
        return false;
    }
    
    try {
        // Initialize with compatibility API
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        
        // Get services (compatibility API)
        const db = firebase.firestore(app);
        const auth = firebase.auth(app);
        
        // Make available globally
        window.firebaseApp = app;
        window.firestore = db;
        window.firebaseAuth = auth;
        
        console.log('✅ Firebase initialized (compat mode)');
        
        // Test
        setTimeout(testFirebaseConnection, 1000);
        
        return true;
    } catch (error) {
        console.error('Firebase init error:', error);
        
        // If already initialized, just get references
        if (error.code === 'app/duplicate-app') {
            window.firestore = firebase.firestore();
            window.firebaseAuth = firebase.auth();
            console.log('Firebase already initialized');
            return true;
        }
        
        return false;
    }
}

// Test connection
async function testFirebaseConnection() {
    if (!window.firestore) {
        console.log('Firestore not ready');
        return;
    }
    
    try {
        const testRef = firestore.collection('_tests').doc('connection');
        await testRef.set({
            timestamp: new Date().toISOString(),
            status: 'connected'
        }, { merge: true });
        console.log('✅ Firebase connection test passed');
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
    }
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking Firebase...');
    
    if (typeof firebase !== 'undefined') {
        initFirebase();
    } else {
        // Wait for Firebase to load
        const checkInterval = setInterval(() => {
            if (typeof firebase !== 'undefined') {
                clearInterval(checkInterval);
                initFirebase();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 5000);
    }
});
