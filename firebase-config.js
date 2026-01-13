// firebase-config.js - SINGLE SOURCE OF TRUTH
console.log('🔥 FIREBASE CONFIG LOADED');

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Global variables for Firebase services
let firebaseApp = null;
let auth = null;
let firestore = null;

// Initialize Firebase ONCE
function initializeFirebase() {
    try {
        // Check if Firebase is loaded
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            return false;
        }
        
        // Check if already initialized
        if (firebase.apps.length > 0) {
            console.log('Firebase already initialized, using existing app');
            firebaseApp = firebase.apps[0];
        } else {
            // Initialize new app
            firebaseApp = firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        }
        
        // Get services
        auth = firebase.auth();
        firestore = firebase.firestore();
        
        // Enable offline persistence for Firestore
        if (firestore) {
            firestore.enablePersistence()
                .then(() => console.log('Firestore offline persistence enabled'))
                .catch(err => {
                    if (err.code === 'failed-precondition') {
                        console.log('Multiple tabs open, persistence disabled');
                    } else if (err.code === 'unimplemented') {
                        console.log('Browser doesn\'t support persistence');
                    }
                });
        }
        
        // Store globally
        window.firebaseApp = firebaseApp;
        window.firebaseAuth = auth;
        window.firestore = firestore;
        
        return true;
        
    } catch (error) {
        console.error('Firebase initialization error:', error);
        return false;
    }
}

// Export functions
window.initializeFirebase = initializeFirebase;
window.getFirebaseAuth = () => auth;
window.getFirestore = () => firestore;
