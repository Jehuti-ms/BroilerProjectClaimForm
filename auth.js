// auth.js - UPDATED TO MATCH HTML IDS

/**
 * Firebase/Local Authentication System
 */

// Add at the top of auth.js
console.log('=== AUTH.JS LOADED ===');
console.log('Current page:', window.location.pathname);
console.log('User in localStorage:', localStorage.getItem('currentUser'));

// Check for existing session IMMEDIATELY on load
(function checkExistingSessionOnLoad() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('Existing session found for:', user.email || user.username);
        
        // FORCE REDIRECT if on auth page
        if (window.location.pathname.includes('auth.html')) {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
            return; // Stop further execution
        }
    }
})();

// Hide loading and show auth forms
function showAuthForms() {
    const loading = document.getElementById('firebase-loading');
    const authContainer = document.querySelector('.auth-container');
    
    if (loading) loading.style.display = 'none';
    if (authContainer) authContainer.style.display = 'block';
}

// Simplified initialization
function initializeAuth() {
    console.log('Initializing auth...');
    
    // Show auth forms after a short delay
    setTimeout(showAuthForms, 500);
    
    // Already handled redirect above, but keep for other pages
    if (!window.location.pathname.includes('auth.html')) {
        // We're on a non-auth page, check if user exists
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            console.log('No user found, redirecting to auth page');
            window.location.href = 'auth.html';
            return;
        }
    }
    
    // Set up auth forms only if on auth page
    if (window.location.pathname.includes('auth.html')) {
        setupAuthForms();
    }
    
    // If Firebase Auth is available, use it
    if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        console.log('Firebase Auth available');
        // Set up Firebase auth state listener
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('Firebase user authenticated:', user.email);
            }
        });
    } else {
        console.log('Using local authentication only');
    }
}

// Set up authentication forms - UPDATED TO MATCH HTML IDS
function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const resetForm = document.getElementById('reset-form');
    
    // Show/hide buttons setup - ADD MISSING BUTTON REFERENCES
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // UPDATED: Using HTML IDs
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const employeeName = document.getElementById('employee-name-auth').value;
            
            if (!email || !password || !employeeName) {
                alert('Please fill all fields');
                return;
            }
            
            // Extract username from email (before @)
            const username = email.split('@')[0];
            
            await handleLogin(username, password, employeeName, email);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // UPDATED: Using HTML IDs
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const employeeName = document.getElementById('new-employee-name').value;
            
            if (!email || !password || !confirmPassword || !employeeName) {
                alert('Please fill all fields');
                return;
            }
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            if (password.length < 4) {
                alert('Password must be at least 4 characters long');
                return;
            }
            
            // Extract username from email (before @)
            const username = email.split('@')[0];
            
            await handleRegister(username, password, employeeName, email);
        });
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // UPDATED: Using HTML IDs
            const email = document.getElementById('reset-email').value;
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            
            if (!email || !newPassword || !confirmPassword) {
                alert('Please fill all fields');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Extract username from email (before @)
            const username = email.split('@')[0];
            
            // Simple password reset (local only)
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (!users[username]) {
                alert('Username/Email not found');
                return;
            }
            
            users[username].password = newPassword;
            users[username].passwordResetAt = new Date().toISOString();
            localStorage.setItem('users', JSON.stringify(users));
            
            alert('Password reset successful! You can now login with your new password.');
            showLogin();
        });
    }
}

// UPDATED handleLogin function to accept email parameter
async function handleLogin(username, password, employeeName, email) {
    let loginBtn = null;
    
    try {
        console.log('Attempting login for:', username, 'Email:', email);
        
        // Disable login button
        loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
        }
        
        // Check credentials against stored users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        const userData = users[username];
        
        if (!userData) {
            alert('Username/Email not found. Please register first.');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
            return;
        }
        
        if (userData.password !== password) {
            alert('Incorrect password');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
            return;
        }
        
        // Create user object with sync preferences
        const currentUser = {
            username: username,
            email: email,
            employeeName: employeeName,
            timestamp: new Date().toISOString(),
            authType: 'local',
            preferences: {
                autoSync: localStorage.getItem('autoSyncEnabled') === 'true',
                lastSyncMethod: localStorage.getItem('lastSyncMethod') || 'local',
                syncFrequency: localStorage.getItem('syncFrequency') || '5'
            }
        };
        
        // Save user
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Save user-specific preferences
        localStorage.setItem(`prefs_${username}`, JSON.stringify({
            autoSync: currentUser.preferences.autoSync,
            lastLogin: new Date().toISOString()
        }));
        
        console.log('Login successful:', currentUser);
        
        // Optional: Try Firebase login
        if (window.firebaseAuth) {
            try {
                const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
                currentUser.firebaseUid = userCredential.user.uid;
                currentUser.authType = 'firebase';
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('Firebase login successful');
            } catch (firebaseError) {
                console.log('Firebase login failed, using local only:', firebaseError.message);
            }
        }
        
        // Redirect after successful login
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
}

// UPDATED handleRegister function to accept email parameter
async function handleRegister(username, password, employeeName, email) {
    try {
        console.log('Attempting registration for:', username, 'Email:', email);
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // Check if username already exists
        if (users[username]) {
            alert('Username/Email already exists');
            return;
        }
        
        // Create local user
        users[username] = {
            password: password,
            email: email,
            employeeName: employeeName,
            createdAt: new Date().toISOString(),
            firebaseLinked: false
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Local registration successful');
        
        // Try Firebase registration if available
        if (window.firebaseAuth) {
            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                
                // Update local user with Firebase info
                users[username].firebaseLinked = true;
                users[username].firebaseUid = userCredential.user.uid;
                localStorage.setItem('users', JSON.stringify(users));
                
                // Create user object
                const currentUser = {
                    username: username,
                    email: email,
                    employeeName: employeeName,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                console.log('Firebase registration successful');
                alert('Registration successful!');
                window.location.href = 'index.html';
                
            } catch (firebaseError) {
                console.error('Firebase registration failed:', firebaseError);
                
                // Fallback: still register locally
                const currentUser = {
                    username: username,
                    email: email,
                    employeeName: employeeName,
                    authType: 'local',
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                alert('Local registration successful (Firebase failed)');
                window.location.href = 'index.html';
            }
        } else {
            // Auto-login after local registration
            const currentUser = {
                username: username,
                email: email,
                employeeName: employeeName,
                authType: 'local',
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            alert('Registration successful!');
            window.location.href = 'index.html';
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration error: ' + error.message);
    }
}

// Keep existing UI functions
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
    document.getElementById('reset-card').style.display = 'none';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'none';
    document.querySelector('.auth-card:first-child').style.display = 'block';
}

function showReset() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'block';
}

// Emergency reset function for development
function addEmergencyReset() {
    // Only add on auth page
    if (!window.location.pathname.includes('auth.html')) return;
    
    const emergencyReset = document.createElement('button');
    emergencyReset.textContent = 'Emergency Reset (Clear All Data)';
    emergencyReset.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10000;
    `;
    emergencyReset.onclick = function() {
        if (confirm('WARNING: This will clear ALL user data including forms and passwords. Continue?')) {
            localStorage.clear();
            alert('All data cleared. Page will reload.');
            location.reload();
        }
    };
    document.body.appendChild(emergencyReset);
}

// Export functions for use in other files
window.authModule = {
    getCurrentUser: function() {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    },
    isAuthenticated: function() {
        const savedUser = localStorage.getItem('currentUser');
        return !!savedUser;
    },
    logout: function() {
        localStorage.removeItem('currentUser');
        if (window.firebaseAuth) {
            firebaseAuth.signOut();
        }
        window.location.href = 'auth.html';
    }
};

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    if (window.location.pathname.includes('auth.html')) {
        addEmergencyReset();
    }
});

// Make functions available globally for debugging
window.showLogin = showLogin;
window.showRegister = showRegister;
window.showReset = showReset;
