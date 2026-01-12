// config.js - Ensure this is correct
const firebaseConfig = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Initialize Firebase
let firebaseApp, auth, firestore;

try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    firestore = firebase.firestore();
    
    // Enable offline persistence (important!)
    firestore.enablePersistence()
        .then(() => console.log('✅ Firestore offline persistence enabled'))
        .catch(err => console.log('⚠️ Firestore offline persistence error:', err));
    
    window.firebaseAuth = auth;
    window.firestore = firestore;
    console.log('✅ Firebase initialized (Firestore + Auth)');
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    if (error.code === 'app/duplicate-app') {
        console.log('Firebase already initialized, using existing instance');
        auth = firebase.auth();
        firestore = firebase.firestore();
        window.firebaseAuth = auth;
        window.firestore = firestore;
    }
}
