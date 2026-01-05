// config.js - FOR INDEX.HTML ONLY (with Firestore)
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Initialize Firebase with all services
function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return false;
    }
    
    try {
        const app = firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore(app);
        const auth = firebase.auth(app);
        
        window.firebaseApp = app;
        window.firestore = db;
        window.firebaseAuth = auth;
        
        console.log('✅ Firebase initialized (Firestore + Auth)');
        
        // Test connection
        testFirebaseConnection();
        
        return true;
    } catch (error) {
        console.error('Firebase init error:', error);
        
        // If already initialized, get references
        if (error.code === 'app/duplicate-app') {
            window.firestore = firebase.firestore();
            window.firebaseAuth = firebase.auth();
            console.log('Firebase already initialized');
            return true;
        }
        
        return false;
    }
}

// Test Firestore connection
async function testFirebaseConnection() {
    if (!window.firestore) {
        console.log('Firestore not available');
        return;
    }
    
    try {
        const testRef = firestore.collection('_connection_tests').doc('firebase_init');
        await testRef.set({
            timestamp: new Date().toISOString(),
            status: 'connected',
            page: 'index.html'
        }, { merge: true });
        console.log('✅ Firestore connection test passed');
    } catch (error) {
        console.error('❌ Firestore test failed:', error);
    }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Firebase...');
    
    // Wait a bit for Firebase to load
    setTimeout(() => {
        initializeFirebase();
        
        // Initialize cloud sync after Firebase is ready
        setTimeout(() => {
            if (typeof initCloudSync === 'function') {
                initCloudSync();
            }
        }, 1000);
    }, 500);
});
