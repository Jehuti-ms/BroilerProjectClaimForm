// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
  authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
  projectId: "broilerprojectclaimform-d6d51",
  storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
  messagingSenderId: "1069004689384",
  appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
  measurementId: "G-ST930670JC"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence
db.enablePersistence()
  .catch((err) => {
      console.log('Firebase persistence error:', err.code);
  });
