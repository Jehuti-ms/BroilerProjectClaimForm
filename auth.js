// auth.js - Complete Firebase Authentication

// Navigation functions
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
    document.getElementById('reset-card').style.display = 'none';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'none';
    document.getElementById('login-form').parentElement.style.display = 'block';
}

function showReset() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'block';
}

// Initialize Firebase auth when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loading...');
    
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        console.log('User already logged in via localStorage, redirecting...');
        window.location.href = 'index.html';
        return;
    }
    
    // Wait for Firebase to load
    setTimeout(() => {
        if (window.auth) {
            console.log('Firebase Auth loaded in auth.js');
            
            // Check if user is already signed in with Firebase
            auth.onAuthStateChanged((user) => {
                if (user) {
                    console.log('Firebase user already signed in:', user.email);
                    
                    // Store user info
                    const currentUser = {
                        username: user.email,
                        employeeName: user.displayName || user.email.split('@')[0],
                        uid: user.uid
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Also save to localStorage users for fallback
                    const users = JSON.parse(localStorage.getItem('users') || '{}');
                    users[user.email] = {
                        email: user.email,
                        employeeName: user.displayName || user.email.split('@')[0],
                        uid: user.uid,
                        firebase: true
                    };
                    localStorage.setItem('users', JSON.stringify(users));
                    
                    // Redirect to main app
                    window.location.href = 'index.html';
                }
            });
        } else {
            console.warn('Firebase Auth not loaded - using fallback authentication');
        }
        
        // Add emergency reset button for development
        addEmergencyReset();
    }, 1000);
});

// Handle login form submission with Firebase
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value.trim();
    
    if (!email || !password) {
        showAuthNotification('Please enter both email and password', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        if (window.auth) {
            // Try Firebase authentication
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Firebase login successful:', user.email);

            // Store user info WITH PASSWORD in localStorage
            const currentUser = {
                username: user.email,
                employeeName: employeeName || user.displayName || user.email.split('@')[0],
                password: password,  // ← THIS IS CRITICAL - STORE THE PASSWORD!
                uid: user.uid,
                firebaseAuthenticated: true
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Also save to localStorage users for fallback
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[email] = {
                email: email,
                password: password,  // ← ALSO STORE HERE
                employeeName: employeeName || user.displayName || email.split('@')[0],
                uid: user.uid,
                firebase: true,
                lastLogin: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
            // ============ END OF ADDED CODE ============
            
            // Show success message
            showAuthNotification('Login successful! Redirecting...', 'success');
            
            // Store user info
            const currentUser = {
                username: user.email,
                employeeName: employeeName || user.displayName || user.email.split('@')[0],
                uid: user.uid
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update display name if provided and different
            if (employeeName && (!user.displayName || user.displayName !== employeeName)) {
                try {
                    await user.updateProfile({
                        displayName: employeeName
                    });
                    console.log('Display name updated');
                } catch (updateError) {
                    console.warn('Could not update display name:', updateError);
                }
            }
            
            // Also save to localStorage users for fallback
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[email] = {
                email: email,
                password: password, // Note: Storing password in localStorage is insecure
                employeeName: employeeName || user.displayName || email.split('@')[0],
                uid: user.uid,
                firebase: true,
                lastLogin: new Date().toISOString()
            };
            localStorage.setItem('users', JSON.stringify(users));
            
            // Show success message
            showAuthNotification('Login successful! Redirecting...', 'success');
            
            // Create initial Firestore document if needed
            if (window.firestore) {
                try {
                    const userDoc = await firestore.collection('userData').doc(email).get();
                    if (!userDoc.exists) {
                        await firestore.collection('userData').doc(email).set({
                            userId: email,
                            data: '{}',
                            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                            displayName: employeeName || user.displayName || email.split('@')[0],
                            lastUpdated: new Date().toISOString()
                        });
                        console.log('Initial Firestore document created');
                    }
                } catch (firestoreError) {
                    console.warn('Could not create/check Firestore document:', firestoreError);
                }
            }
            
            // Redirect after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            // Firebase not available - fallback to localStorage
            console.warn('Firebase not available, using localStorage fallback');
            fallbackLocalStorageLogin(email, password, employeeName);
        }
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Handle specific Firebase errors
        let errorMessage = 'Login failed';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/user-disabled':
                errorMessage = 'Account disabled';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Try again later';
                break;
            default:
                errorMessage = error.message || 'Login failed';
        }
        
        // Try fallback
        const fallbackSuccess = fallbackLocalStorageLogin(email, password, employeeName);
        if (!fallbackSuccess) {
            showAuthNotification(errorMessage, 'error');
        }
        
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Fallback localStorage login
function fallbackLocalStorageLogin(email, password, employeeName) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email] && users[email].password === password) {
        // Successful login
        const currentUser = {
            username: email,
            employeeName: employeeName || users[email].employeeName || email.split('@')[0],
            uid: users[email].uid || 'local_' + Date.now()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showAuthNotification('Login successful! (Local storage)', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
        return true;
    }
    
    showAuthNotification('Invalid credentials', 'error');
    return false;
}

// Handle registration with Firebase
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const employeeName = document.getElementById('new-employee-name').value.trim();
    
    // Validation
    if (!email || !email.includes('@')) {
        showAuthNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthNotification('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    if (!employeeName) {
        showAuthNotification('Please enter your name', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    
    try {
        if (window.auth) {
            // Create user with Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('Firebase registration successful:', user.email);
            
            // Update profile with display name
            await user.updateProfile({
                displayName: employeeName
            });
            
            // Also save to localStorage for fallback
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[email] = {
                email: email,
                password: password,
                employeeName: employeeName,
                createdAt: new Date().toISOString(),
                uid: user.uid,
                firebase: true
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Store current user info
            const currentUser = {
                username: email,
                employeeName: employeeName,
                uid: user.uid
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Create initial user data in Firestore
            if (window.firestore) {
                try {
                    await firestore.collection('userData').doc(email).set({
                        userId: email,
                        data: '{}',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        displayName: employeeName,
                        lastUpdated: new Date().toISOString()
                    });
                    console.log('Initial Firestore document created');
                } catch (firestoreError) {
                    console.warn('Could not create Firestore document:', firestoreError);
                }
            }
            
            showAuthNotification('Registration successful!', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } else {
            // Firebase not available - fallback to localStorage
            console.warn('Firebase not available, using localStorage fallback');
            fallbackLocalStorageRegistration(email, password, employeeName);
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'Registration failed';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already registered';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Registration is currently disabled';
                break;
            default:
                errorMessage = error.message || 'Registration failed';
        }
        
        // Try fallback
        const fallbackSuccess = fallbackLocalStorageRegistration(email, password, employeeName);
        if (!fallbackSuccess) {
            showAuthNotification(errorMessage, 'error');
        }
        
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Fallback localStorage registration
function fallbackLocalStorageRegistration(email, password, employeeName) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[email]) {
        showAuthNotification('Email already registered in local storage', 'error');
        return false;
    }
    
    users[email] = {
        email: email,
        password: password,
        employeeName: employeeName,
        createdAt: new Date().toISOString(),
        uid: 'local_' + Date.now()
    };
    
    localStorage.setItem('users', JSON.stringify(users));
    
    const currentUser = {
        username: email,
        employeeName: employeeName,
        uid: users[email].uid
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    showAuthNotification('Registration successful! (Local storage)', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
    
    return true;
}

// Handle password reset with Firebase
document.getElementById('reset-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-username').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmNewPassword = document.getElementById('reset-confirm-password').value;
    
    if (!email || !email.includes('@')) {
        showAuthNotification('Please enter a valid email address', 'error');
        return;
    }
    
    if (newPassword !== confirmNewPassword) {
        showAuthNotification('Passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAuthNotification('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
    submitBtn.disabled = true;
    
    try {
        if (window.auth) {
            // Firebase requires user to be logged in to change password directly
            // Instead, we'll send a password reset email
            await auth.sendPasswordResetEmail(email);
            
            showAuthNotification('Password reset email sent! Check your inbox.', 'success');
            
            // Clear form
            this.reset();
            
            // Return to login after delay
            setTimeout(() => {
                showLogin();
            }, 3000);
            
        } else {
            // Fallback to localStorage reset
            fallbackLocalStoragePasswordReset(email, newPassword);
        }
        
    } catch (error) {
        console.error('Password reset error:', error);
        
        let errorMessage = 'Password reset failed';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address';
                break;
            default:
                errorMessage = error.message || 'Password reset failed';
        }
        
        // Try fallback
        const fallbackSuccess = fallbackLocalStoragePasswordReset(email, newPassword);
        if (!fallbackSuccess) {
            showAuthNotification(errorMessage, 'error');
        }
        
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Fallback localStorage password reset
function fallbackLocalStoragePasswordReset(email, newPassword) {
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (!users[email]) {
        showAuthNotification('Email not found in local storage', 'error');
        return false;
    }
    
    users[email].password = newPassword;
    users[email].passwordResetAt = new Date().toISOString();
    
    localStorage.setItem('users', JSON.stringify(users));
    
    showAuthNotification('Password reset successful! (Local storage)', 'success');
    
    setTimeout(() => {
        showLogin();
    }, 2000);
    
    return true;
}

// Notification function for auth pages
function showAuthNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.auth-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `auth-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : 
                     type === 'success' ? '#4CAF50' : 
                     type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Emergency reset function for development
function addEmergencyReset() {
    // Only add in development (localhost)
    if (!window.location.hostname.includes('localhost') && 
        !window.location.hostname.includes('127.0.0.1') &&
        !window.location.hostname.includes('0.0.0.0')) {
        return;
    }
    
    const emergencyReset = document.createElement('button');
    emergencyReset.textContent = 'Emergency Reset';
    emergencyReset.title = 'Clear all data (development only)';
    emergencyReset.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #ff4444;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        font-size: 12px;
        cursor: pointer;
        z-index: 10000;
        opacity: 0.7;
        transition: opacity 0.3s;
        font-family: Arial, sans-serif;
    `;
    
    emergencyReset.onmouseenter = () => emergencyReset.style.opacity = '1';
    emergencyReset.onmouseleave = () => emergencyReset.style.opacity = '0.7';
    
    emergencyReset.onclick = async function() {
        if (confirm('WARNING: This will clear ALL local data including forms, users, and settings. Continue?')) {
            try {
                // Sign out from Firebase if signed in
                if (window.auth) {
                    await auth.signOut();
                }
                
                // Clear localStorage (but keep Firebase config)
                const firebaseConfig = localStorage.getItem('firebaseConfig');
                localStorage.clear();
                
                if (firebaseConfig) {
                    localStorage.setItem('firebaseConfig', firebaseConfig);
                }
                
                // Clear IndexedDB if exists
                if (window.indexedDB) {
                    const databases = await indexedDB.databases();
                    databases.forEach(db => {
                        if (db.name) {
                            indexedDB.deleteDatabase(db.name);
                        }
                    });
                }
                
                showAuthNotification('All data cleared. Reloading...', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
                
            } catch (error) {
                console.error('Emergency reset error:', error);
                showAuthNotification('Reset partially failed', 'error');
            }
        }
    };
    
    document.body.appendChild(emergencyReset);
}

// Firebase helper functions
async function getCurrentFirebaseUser() {
    if (!window.auth) return null;
    
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

// Manual admin functions (for browser console)
window.authHelpers = {
    // List all users from localStorage
    listLocalUsers: function() {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        console.log('Local Storage Users:');
        Object.keys(users).forEach(email => {
            console.log(`- ${email}: ${users[email].employeeName} (${users[email].firebase ? 'Firebase' : 'Local'})`);
        });
        return users;
    },
    
    // Get current Firebase user
    getCurrentUser: async function() {
        const user = await getCurrentFirebaseUser();
        console.log('Current Firebase user:', user);
        return user;
    },
    
    // Create test user
    createTestUser: async function(email = 'test@example.com', password = 'test123', name = 'Test User') {
        try {
            if (!auth) {
                console.error('Firebase Auth not available');
                return null;
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            await user.updateProfile({
                displayName: name
            });
            
            // Save to localStorage
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            users[email] = {
                email: email,
                password: password,
                employeeName: name,
                uid: user.uid,
                firebase: true
            };
            localStorage.setItem('users', JSON.stringify(users));
            
            console.log('Test user created:', user);
            return user;
        } catch (error) {
            console.error('Test user creation failed:', error);
            return null;
        }
    },
    
    // Delete test user (from localStorage)
    deleteLocalUser: function(email) {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (users[email]) {
            delete users[email];
            localStorage.setItem('users', JSON.stringify(users));
            console.log('Local user deleted:', email);
            return true;
        }
        console.log('User not found:', email);
        return false;
    }
};

// Export functions
window.showAuthNotification = showAuthNotification;
window.getCurrentFirebaseUser = getCurrentFirebaseUser;
