// auth.js - UPDATED VERSION

/**
 * Firebase/Local Authentication System
 */

// Add at the top of auth.js
console.log('=== AUTH.JS LOADED ===');
console.log('Current page:', window.location.pathname);
console.log('User in localStorage:', localStorage.getItem('currentUser'));

// Simplified initialization
function initializeAuth() {
    console.log('Initializing auth...');
    
    // Check if user is already logged in via localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        console.log('User already logged in:', JSON.parse(currentUser));
        
        // Redirect to main app if on auth page
        if (window.location.pathname.includes('auth.html')) {
            console.log('Redirecting to index.html...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
    
    // Set up auth forms
    setupAuthForms();
    
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

// Set up authentication forms
function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const resetForm = document.getElementById('reset-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const employeeName = document.getElementById('employee-name-auth').value;
            
            if (!username || !password || !employeeName) {
                alert('Please fill all fields');
                return;
            }
            
            await handleLogin(username, password, employeeName);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('new-username').value;
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const employeeName = document.getElementById('new-employee-name').value;
            
            if (!username || !password || !confirmPassword || !employeeName) {
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
            
            await handleRegister(username, password, employeeName);
        });
    }
    
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('reset-username').value;
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            
            if (!username || !newPassword || !confirmPassword) {
                alert('Please fill all fields');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            // Simple password reset (local only)
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            if (!users[username]) {
                alert('Username not found');
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

// Handle login (local + optional Firebase)
async function handleLogin(username, password, employeeName) {
    try {
        console.log('Attempting login for:', username);
        
        // Disable login button to prevent multiple clicks
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Signing in...';
        }
        
        // First try local authentication
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (users[username] && users[username].password === password) {
            // Local authentication successful
            const currentUser = {
                username: username,
                employeeName: users[username].employeeName || employeeName,
                authType: 'local',
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('Local login successful:', currentUser);
            
            // Try Firebase login if available (optional)
            if (window.firebaseAuth) {
                await tryFirebaseLogin(username, password, currentUser);
            } else {
                // Redirect to main app
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
            }
            
        } else {
            // Invalid credentials
            alert('Invalid username or password');
            
            // Re-enable button
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
        }
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
        
        // Re-enable button
        const loginBtn = document.querySelector('#login-form button[type="submit"]');
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
}

// Try Firebase login (optional)
async function tryFirebaseLogin(username, password, currentUser) {
    try {
        if (!window.firebaseAuth) return;
        
        const email = `${username}@broiler-project.com`;
        const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
        
        // Update user with Firebase info
        currentUser.firebaseUid = userCredential.user.uid;
        currentUser.authType = 'firebase';
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('Firebase login successful');
        
    } catch (error) {
        console.log('Firebase login failed, using local only:', error.message);
        // Continue with local authentication
    }
    
    // Redirect to main app
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Handle registration (local + optional Firebase)
async function handleRegister(username, password, employeeName) {
    try {
        console.log('Attempting registration for:', username);
        
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // Check if username already exists
        if (users[username]) {
            alert('Username already exists');
            return;
        }
        
        // Create local user
        users[username] = {
            password: password,
            employeeName: employeeName,
            createdAt: new Date().toISOString(),
            firebaseLinked: false
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        console.log('Local registration successful');
        
        // Try Firebase registration if available
        if (window.firebaseAuth) {
            await tryFirebaseRegister(username, password, employeeName, users);
        } else {
            // Auto-login after local registration
            const currentUser = {
                username: username,
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

// Try Firebase registration (optional)
async function tryFirebaseRegister(username, password, employeeName, users) {
    try {
        if (!window.firebaseAuth) return;
        
        const email = `${username}@broiler-project.com`;
        const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        
        // Update local user with Firebase info
        users[username].firebaseLinked = true;
        users[username].firebaseUid = userCredential.user.uid;
        localStorage.setItem('users', JSON.stringify(users));
        
        // Create user object
        const currentUser = {
            username: username,
            employeeName: employeeName,
            authType: 'firebase',
            firebaseUid: userCredential.user.uid,
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        console.log('Firebase registration successful');
        alert('Registration successful!');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Firebase registration failed:', error);
        
        // Fallback: still register locally
        const currentUser = {
            username: username,
            employeeName: employeeName,
            authType: 'local',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Local registration successful (Firebase failed)');
        window.location.href = 'index.html';
    }
}

// Keep existing UI functions (they should still work)
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'none';
    document.getElementById('login-form').parentElement.style.display = 'block';
}

function showReset() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('reset-card').style.display = 'block';
}

// Check for existing session on page load
function checkExistingSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        console.log('Existing session found for:', user.username);
        
        // Redirect to main app if on auth page
        if (window.location.pathname.includes('auth.html') && !window.location.pathname.includes('index.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    }
}

// Call on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing auth...');
    
    // Check for existing session
    checkExistingSession();
    
    // Initialize auth system
    initializeAuth();
    
    // Add emergency reset button for development
    addEmergencyReset();
});

// Emergency reset function for development (remove in production)
function addEmergencyReset() {
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

// Manual password reset function (can be called from browser console)
function manualPasswordReset(username, newPassword) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!users[username]) {
        console.error('User not found:', username);
        return false;
    }
    
    users[username].password = newPassword;
    users[username].manualResetAt = new Date().toISOString();
    
    localStorage.setItem('users', JSON.stringify(users));
    console.log('Password reset for user:', username);
    return true;
}

// List all users (for admin purposes)
function listAllUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    console.log('All registered users:');
    Object.keys(users).forEach(username => {
        console.log('Username:', username, 'Name:', users[username].employeeName);
    });
    return users;
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
