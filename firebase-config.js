// Firebase Configuration & Initialization
const firebaseConfig = {
    apiKey: "AIzaSyDqoH0LgIIB2q4A8WH9f5RgopVEWqRKmAg",
    authDomain: "edumatrix-sync.firebaseapp.com",
    projectId: "edumatrix-sync",
    storageBucket: "edumatrix-sync.firebasestorage.app",
    messagingSenderId: "962108806962",
    appId: "1:962108806962:web:2d0bd9ba7fa5b55f1bd52e"
};

// Initialize Firebase
let firebaseInitialized = false;

function initializeFirebase() {
    if (firebaseInitialized) {
        console.log('Firebase already initialized');
        return;
    }
    
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('✅ Firebase initialized successfully');
        } else {
            console.log('✅ Using existing Firebase app');
        }
        
        firebaseInitialized = true;
        
        // Setup persistence
        setupOfflinePersistence();
        
    } catch (error) {
        console.error('❌ Firebase initialization failed:', error);
    }
}

function setupOfflinePersistence() {
    const firestore = firebase.firestore();
    
    firestore.enablePersistence()
        .then(() => {
            console.log('📱 Firebase offline persistence enabled');
        })
        .catch((err) => {
            console.warn('⚠️ Persistence setup warning:', err.code);
        });
}

// Initialize on load
if (typeof firebase !== 'undefined') {
    initializeFirebase();
} else {
    console.warn('Firebase SDK not loaded yet');
}
