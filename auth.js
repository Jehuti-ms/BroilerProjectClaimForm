/**
 * Firebase Authentication System
 */
// Add at the top of auth.js
console.log('=== AUTH.JS LOADED ===');
console.log('Current page:', window.location.pathname);
console.log('User in localStorage:', localStorage.getItem('currentUser'));

// Wait for Firebase to load
function initializeAuth() {
    console.log('Initializing authentication...');
    
    // Check if Firebase is loaded
    if (!window.firebaseLoaded || !window.firebaseAuth) {
        console.log('Waiting for Firebase...');
        setTimeout(initializeAuth, 100);
        return;
    }
    
    console.log('✅ Firebase ready, setting up auth system');
    setupAuthSystem();
}

function setupAuthSystem() {
    const auth = window.firebaseAuth;
    const db = window.firebaseFirestore;
    
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const resetForm = document.getElementById('reset-form');
    const authError = document.getElementById('auth-error');
    const authErrorRegister = document.getElementById('auth-error-register');
    const authErrorReset = document.getElementById('auth-error-reset');

    // Show error message
    function showError(message, type = 'login') {
        let errorElement;
        switch(type) {
            case 'register': errorElement = authErrorRegister; break;
            case 'reset': errorElement = authErrorReset; break;
            default: errorElement = authError;
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            alert('Error: ' + message);
        }
    }

    // Clear error message
    function clearError(type = 'login') {
        let errorElement;
        switch(type) {
            case 'register': errorElement = authErrorRegister; break;
            case 'reset': errorElement = authErrorReset; break;
            default: errorElement = authError;
        }
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    // Handle login
   // Handle login
async function handleLogin(email, password, employeeName) {
    try {
        clearError();
        console.log('Attempting login:', email);
        
        // Prevent multiple clicks
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
        }
        
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        console.log('Firebase login successful');
        
        // Create user object
        const currentUser = {
            email: email,
            password: password,
            uid: firebaseUser.uid,
            firebaseAuth: true,
            employeeName: employeeName,
            timestamp: new Date().toISOString()
        };
        
        // Save user data
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        localStorage.setItem('mainAppEmployeeName', employeeName);
        
        console.log('Login successful:', currentUser);
        
        // Show success message
        showError('Login successful! Redirecting...', 'login');
        
        // Force redirect after short delay
        setTimeout(() => {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showError(error.message, 'login');
        
        // Re-enable button
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
}
    
    // Handle register
    async function handleRegister(email, password, employeeName) {
        try {
            clearError('register');
            console.log('Attempting register:', email);
            
            // Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const firebaseUser = userCredential.user;
            
            console.log('Firebase account created successfully');
            
            // Create user document in Firestore
            await db.collection('users').doc(firebaseUser.uid).set({
                email: email,
                employeeName: employeeName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('Firestore user document created');
            
            // Create user object
            const currentUser = {
                email: email,
                password: password,
                uid: firebaseUser.uid,
                firebaseAuth: true,
                employeeName: employeeName,
                timestamp: new Date().toISOString()
            };
            
            // Save user data
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userPassword', password);
            localStorage.setItem('mainAppEmployeeName', employeeName);
            
            console.log('Register successful:', currentUser);
            
            // Redirect to main page
            window.location.href = 'index.html';
            
        } catch (error) {
            console.error('Register error:', error);
            showError(error.message, 'register');
        }
    }

    // Setup event listeners
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const employeeName = document.getElementById('employee-name-auth').value;
            
            if (!email || !password || !employeeName) {
                showError('Please fill all fields', 'login');
                return;
            }
            
            await handleLogin(email, password, employeeName);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const employeeName = document.getElementById('new-employee-name').value;
            
            if (!email || !password || !confirmPassword || !employeeName) {
                showError('Please fill all fields', 'register');
                return;
            }
            
            if (password !== confirmPassword) {
                showError('Passwords do not match', 'register');
                return;
            }
            
            await handleRegister(email, password, employeeName);
        });
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value;
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            
            if (!email || !newPassword || !confirmPassword) {
                showError('Please fill all fields', 'reset');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showError('Passwords do not match', 'reset');
                return;
            }
            
            // Note: Firebase requires reauthentication for password reset
            // For simplicity, we'll create a new account or show message
            showError('Please use "Forgot Password" in Firebase or create a new account', 'reset');
        });
    }
    
    // Check for existing session
    checkExistingSession();
}

// Check for existing session
function checkExistingSession() {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            console.log('Found saved user:', user.email);
            
            // If we have password, try auto-login
            const savedPassword = localStorage.getItem('userPassword');
            if (savedPassword && window.firebaseAuth) {
                // Try to sign in silently
                setTimeout(() => {
                    tryAutoLogin(user.email, savedPassword);
                }, 1000);
            }
        } catch (error) {
            console.error('Error parsing saved user:', error);
        }
    }
}

// Try auto-login
async function tryAutoLogin(email, password) {
    try {
        const auth = window.firebaseAuth;
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Auto-login successful:', email);
        
        // Redirect to main page
        window.location.href = 'index.html';
    } catch (error) {
        console.log('Auto-login failed (user needs to sign in manually):', error.message);
    }
}

// Start initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing auth...');
    setTimeout(initializeAuth, 500);
});

// Export functions for use in other files
window.authModule = {
    getCurrentUser: function() {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    },
    isAuthenticated: function() {
        const savedUser = localStorage.getItem('currentUser');
        if (!savedUser) return false;
        const user = JSON.parse(savedUser);
        return user !== null && user.firebaseAuth === true;
    },
    handleLogout: async function() {
        try {
            if (window.firebaseAuth) {
                await window.firebaseAuth.signOut();
            }
            
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.href = 'auth.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
};
