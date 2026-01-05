// firebase-config.js
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let firebaseApp;
let firestore;
let auth;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    firestore = firebase.firestore();
    auth = firebase.auth();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Export Firebase services
window.firebaseApp = firebaseApp;
window.firestore = firestore;
window.auth = auth;

// Test connection
async function testFirebaseConnection() {
    try {
        // Try to write a test document
        const testRef = firestore.collection('testConnection').doc('ping');
        await testRef.set({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'connected'
        });
        
        // Clean up test document
        await testRef.delete();
        
        console.log('✅ Firebase connection successful');
        return true;
    } catch (error) {
        console.error('❌ Firebase connection failed:', error);
        return false;
    }
}

// Export test function
window.testFirebaseConnection = testFirebaseConnection;
