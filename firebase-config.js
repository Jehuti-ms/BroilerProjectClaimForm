// firebase-config.js
const firebaseConfig = {
   apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
  authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
  projectId: "broilerprojectclaimform-d6d51",
  storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
  messagingSenderId: "1069004689384",
  appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
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
