// config.js - Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Initialize Firebase
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is already initialized
    if (typeof firebase !== 'undefined' && !firebase.apps.length) {
        // Initialize Firebase
        firebase.initializeApp(FIREBASE_CONFIG);
        
        // Make Firebase available globally
        window.firebaseApp = firebase.app();
        window.firestore = firebase.firestore();
        window.firebaseAuth = firebase.auth();
        
        console.log('Firebase initialized successfully');
        
        // Test connection
        testFirebaseConnection();
    } else if (firebase.apps.length > 0) {
        console.log('Firebase already initialized');
        window.firestore = firebase.firestore();
        window.firebaseAuth = firebase.auth();
    }
});

// Test Firebase connection
async function testFirebaseConnection() {
    try {
        const db = firebase.firestore();
        const testRef = db.collection('_connection_tests').doc('firebase_init_test');
        
        await testRef.set({
            timestamp: new Date().toISOString(),
            status: 'connected'
        }, { merge: true });
        
        console.log('✅ Firebase connection test passed');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection test failed:', error);
        return false;
    }
}
