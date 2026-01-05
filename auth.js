/**
 * Firebase Authentication System
 * Handles login, signup, and Firebase user auto-creation
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAagSPJW2RxyG28Og54ftYd8MGvPPKO_SE",
  authDomain: "broilerprojectclaimform-d6d51.firebaseapp.com",
  projectId: "broilerprojectclaimform-d6d51",
  storageBucket: "broilerprojectclaimform-d6d51.firebasestorage.app",
  messagingSenderId: "1069004689384",
  appId: "1:1069004689384:web:ab7e2e4063e2ee864c5e5d",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const authContainer = document.getElementById('auth-container');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginLink = document.getElementById('login-link');
const signupLink = document.getElementById('signup-link');
const logoutBtn = document.getElementById('logout-btn');
const userEmailSpan = document.getElementById('user-email');
const authError = document.getElementById('auth-error');

// Current user state
let currentUser = null;

// Initialize authentication system
function initAuth() {
    console.log('Initializing authentication system...');
    
    // Check for existing session
    checkExistingSession();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check Firebase auth state
    auth.onAuthStateChanged(handleAuthStateChange);
}

// Check for existing session in localStorage
function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    const savedPassword = localStorage.getItem('userPassword');
    
    if (savedUser && savedPassword) {
        try {
            currentUser = JSON.parse(savedUser);
            console.log('Found saved user:', currentUser.email);
            
            // Try to re-authenticate with Firebase
            if (!currentUser.firebaseAuth) {
                console.log('User needs Firebase authentication');
                reauthenticateWithFirebase(currentUser.email, savedPassword);
            }
        } catch (error) {
            console.error('Error parsing saved user:', error);
            clearAuthData();
        }
    }
}

// Re-authenticate with Firebase using saved credentials
async function reauthenticateWithFirebase(email, password) {
    try {
        console.log('Re-authenticating with Firebase:', email);
        
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('Firebase re-authentication successful');
        
        // Update user object with Firebase auth info
        currentUser = {
            ...currentUser,
            uid: firebaseUser.uid,
            firebaseAuth: true,
            password: password // Store password for future use
        };
        
        // Save updated user
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userPassword', password);
        
        // Update UI
        showDashboard();
        
    } catch (error) {
        console.error('Firebase re-authentication failed:', error);
        
        // If user doesn't exist in Firebase, create account
        if (error.code === 'auth/user-not-found') {
            console.log('Creating Firebase account for existing user');
            await createFirebaseAccount(email, password);
        } else {
            // For other errors, show login page
            showLogin();
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            await handleLogin(email, password);
        });
    }
    
    // Signup form submission
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            await handleSignup(email, password);
        });
    }
    
    // Navigation links
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLogin();
        });
    }
    
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            showSignup();
        });
    }
    
    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

// Handle login
async function handleLogin(email, password) {
    try {
        clearError();
        console.log('Attempting login for:', email);
        
        // First, try Firebase authentication
        let firebaseUser = null;
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            firebaseUser = userCredential.user;
            console.log('Firebase login successful');
        } catch (firebaseError) {
            console.log('Firebase login failed, checking local auth...');
            
            // Check if this is a known local user
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                const localUser = JSON.parse(savedUser);
                if (localUser.email === email) {
                    // This is a local user without Firebase account
                    console.log('Found local user, creating Firebase account...');
                    await createFirebaseAccount(email, password);
                } else {
                    throw new Error('Invalid credentials');
                }
            } else {
                throw new Error('Invalid credentials');
            }
        }
        
        // Create or update user object
        currentUser = {
            email: email,
            password: password, // Store password
            uid: firebaseUser ? firebaseUser.uid : await getFirebaseUid(email),
            firebaseAuth: true,
            timestamp: new Date().toISOString()
        };
        
        // Save user data
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password); // CRITICAL: Save password
        
        console.log('Login successful:', currentUser);
        showDashboard();
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message);
    }
}

// Handle signup
async function handleSignup(email, password) {
    try {
        clearError();
        console.log('Attempting signup for:', email);
        
        // Create Firebase account
        await createFirebaseAccount(email, password);
        
        // Create user object
        currentUser = {
            email: email,
            password: password, // Store password
            uid: await getFirebaseUid(email),
            firebaseAuth: true,
            timestamp: new Date().toISOString()
        };
        
        // Save user data
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password); // CRITICAL: Save password
        
        console.log('Signup successful:', currentUser);
        showDashboard();
        
    } catch (error) {
        console.error('Signup error:', error);
        showError(error.message);
    }
}

// Create Firebase account
async function createFirebaseAccount(email, password) {
    try {
        console.log('Creating Firebase account for:', email);
        
        // Create user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        console.log('Firebase account created successfully');
        
        // Create user document in Firestore
        await db.collection('users').doc(userCredential.user.uid).set({
            email: email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            localDataMigrated: false
        });
        
        console.log('Firestore user document created');
        
    } catch (error) {
        console.error('Firebase account creation error:', error);
        
        // If user already exists, just sign in
        if (error.code === 'auth/email-already-in-use') {
            console.log('User already exists, signing in...');
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            throw error;
        }
    }
}

// Get Firebase UID for email
async function getFirebaseUid(email) {
    try {
        // Try to get current user's UID
        const user = auth.currentUser;
        if (user && user.email === email) {
            return user.uid;
        }
        
        // If not available, we need to sign in
        console.log('Getting UID for email:', email);
        const password = localStorage.getItem('userPassword');
        if (password) {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return userCredential.user.uid;
        }
        
        throw new Error('Cannot retrieve UID');
        
    } catch (error) {
        console.error('Error getting UID:', error);
        return null;
    }
}

// Handle Firebase auth state changes
function handleAuthStateChange(firebaseUser) {
    if (firebaseUser) {
        console.log('Firebase user state changed:', firebaseUser.email);
        
        // Update current user with Firebase info
        if (currentUser) {
            currentUser = {
                ...currentUser,
                uid: firebaseUser.uid,
                firebaseAuth: true
            };
            
            // Save updated user
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        // Ensure password is saved
        const savedPassword = localStorage.getItem('userPassword');
        if (!savedPassword && currentUser && currentUser.password) {
            localStorage.setItem('userPassword', currentUser.password);
        }
        
    } else {
        console.log('Firebase user signed out');
    }
}

// Handle logout
async function handleLogout() {
    try {
        // Sign out from Firebase
        await auth.signOut();
        
        // Clear local data (but keep email for convenience)
        const email = localStorage.getItem('userEmail');
        localStorage.clear();
        
        // Restore email for login form
        if (email) {
            localStorage.setItem('userEmail', email);
        }
        
        currentUser = null;
        
        console.log('Logout successful');
        
        // Redirect to auth page if not already there
        if (!window.location.pathname.includes('auth.html')) {
            window.location.href = 'auth.html';
        } else {
            showLogin();
        }
        
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Clear authentication data
function clearAuthData() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    console.log('Authentication data cleared');
}

// Show dashboard
function showDashboard() {
    if (authContainer) authContainer.style.display = 'none';
    if (dashboard) {
        dashboard.style.display = 'block';
        if (userEmailSpan && currentUser) {
            userEmailSpan.textContent = currentUser.email;
        }
    }
    
    // Dispatch auth success event for other modules
    window.dispatchEvent(new CustomEvent('auth-success', { 
        detail: { user: currentUser }
    }));
}

// Show login form
function showLogin() {
    if (authContainer) authContainer.style.display = 'block';
    if (dashboard) dashboard.style.display = 'none';
    
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    
    if (loginSection) loginSection.style.display = 'block';
    if (signupSection) signupSection.style.display = 'none';
    
    // Pre-fill email if available
    const savedEmail = localStorage.getItem('userEmail');
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput && savedEmail) {
        loginEmailInput.value = savedEmail;
    }
}

// Show signup form
function showSignup() {
    const loginSection = document.getElementById('login-section');
    const signupSection = document.getElementById('signup-section');
    
    if (loginSection) loginSection.style.display = 'none';
    if (signupSection) signupSection.style.display = 'block';
}

// Show error message
function showError(message) {
    if (authError) {
        authError.textContent = message;
        authError.style.display = 'block';
    }
}

// Clear error message
function clearError() {
    if (authError) {
        authError.textContent = '';
        authError.style.display = 'none';
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null && currentUser.firebaseAuth === true;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Export functions for use in other files
window.authModule = {
    getCurrentUser,
    isAuthenticated,
    handleLogout,
    reauthenticateWithFirebase,
    getFirebaseUid
};
