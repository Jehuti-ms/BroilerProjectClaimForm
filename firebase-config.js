// firebase-config.js - Firebase Configuration Only
// Remove initialization logic since auth.js handles it

// Firebase configuration (same as in auth.js)
const firebaseConfig = {
    apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
    authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
    projectId: "broilerprojectclaimform-d6d51",
    storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
    messagingSenderId: "1069004689384",
    appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
};

console.log('Firebase config loaded (for other scripts)');

// Export config for other scripts to use
window.firebaseConfig = firebaseConfig;
