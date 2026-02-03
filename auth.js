// DEBUG: Track what's happening
console.log('=== AUTH.JS LOADING ===');
console.log('Current URL:', window.location.href);
console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));

// TEMPORARY: Add a button to clear everything
if (!document.getElementById('debug-clear')) {
    const debugBtn = document.createElement('button');
    debugBtn.id = 'debug-clear';
    debugBtn.textContent = 'DEBUG: Clear All & Restart';
    debugBtn.style.cssText = `
        position: fixed;
        bottom: 10px;
        right: 10px;
        background: #f44336;
        color: white;
        padding: 10px;
        z-index: 9999;
        border: none;
        border-radius: 5px;
        cursor: pointer;
    `;
    debugBtn.onclick = function() {
        localStorage.clear();
        sessionStorage.clear();
        console.log('DEBUG: All storage cleared');
        alert('Storage cleared. Refreshing...');
        location.reload();
    };
    document.body.appendChild(debugBtn);
}

// Authentication functions - SIMPLIFIED VERSION
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('reset-card').style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'none';
    document.getElementById('login-form').parentElement.style.display = 'block';
}

function showResetPassword() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('reset-card').style.display = 'block';
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('=== LOGIN ATTEMPT ===');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    const errorElement = document.getElementById('auth-error');
    
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    try {
        console.log('Attempting login with:', email);
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Firebase login successful:', user.email);
        
        // SIMPLE: Just save basic user info
        const userData = {
            uid: user.uid,
            email: user.email,
            employeeName: employeeName || user.displayName || 'User',
            username: user.email.split('@')[0]
        };
        
        console.log('Saving to localStorage:', userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('employeeName', employeeName || 'User');
        
        // TEST: Check what we saved
        console.log('Saved currentUser:', localStorage.getItem('currentUser'));
        
        // Wait 1 second then redirect
        console.log('Will redirect in 1 second...');
        setTimeout(() => {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = getAuthErrorMessage(error);
        errorElement.style.display = 'block';
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('=== REGISTRATION ATTEMPT ===');
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const employeeName = document.getElementById('register-employee-name').value;
    const errorElement = document.getElementById('register-error');
    
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    if (password !== confirmPassword) {
        errorElement.textContent = 'Passwords do not match';
        errorElement.style.display = 'block';
        return;
    }
    
    if (password.length < 6) {
        errorElement.textContent = 'Password must be at least 6 characters long';
        errorElement.style.display = 'block';
        return;
    }
    
    try {
        console.log('Attempting registration with:', email);
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('Firebase registration successful:', user.email);
        
        // SIMPLE: Just save basic user info
        const userData = {
            uid: user.uid,
            email: user.email,
            employeeName: employeeName || 'User',
            username: user.email.split('@')[0]
        };
        
        console.log('Saving to localStorage:', userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('employeeName', employeeName || 'User');
        
        // Wait 1 second then redirect
        console.log('Will redirect in 1 second...');
        setTimeout(() => {
            console.log('Redirecting to index.html...');
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        console.error('Registration error:', error);
        errorElement.textContent = getAuthErrorMessage(error);
        errorElement.style.display = 'block';
    }
});

// Handle password reset
document.getElementById('reset-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('reset-email').value;
    const errorElement = document.getElementById('reset-error');
    const successElement = document.getElementById('reset-success');
    
    errorElement.style.display = 'none';
    successElement.style.display = 'none';
    errorElement.textContent = '';
    successElement.textContent = '';
    
    try {
        await auth.sendPasswordResetEmail(email);
        successElement.textContent = 'Password reset email sent! Check your inbox.';
        successElement.style.display = 'block';
    } catch (error) {
        console.error('Reset error:', error);
        errorElement.textContent = getAuthErrorMessage(error);
        errorElement.style.display = 'block';
    }
});

// Helper function to get user-friendly error messages
function getAuthErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email address';
        case 'auth/user-disabled':
            return 'This account has been disabled';
        case 'auth/user-not-found':
            return 'No account found with this email';
        case 'auth/wrong-password':
            return 'Incorrect password';
        case 'auth/email-already-in-use':
            return 'Email already in use';
        case 'auth/weak-password':
            return 'Password is too weak';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection';
        case 'auth/invalid-api-key':
            return 'Firebase configuration error. Please contact support.';
        case 'auth/operation-not-allowed':
            return 'Email/password login is not enabled. Please contact support.';
        default:
            return `Error: ${error.code}. Please try again`;
    }
}

// NO AUTO-REDIRECT! Let user click login
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== AUTH PAGE LOADED ===');
    console.log('URL:', window.location.href);
    console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));
    
    // Just check Firebase state for display purposes
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Firebase says user is logged in:', user.email);
            console.log('But NOT auto-redirecting. User must click Login.');
            
            // Pre-fill the form for convenience
            document.getElementById('email').value = user.email || '';
            document.getElementById('employee-name-auth').value = user.displayName || '';
        } else {
            console.log('Firebase says no user logged in');
        }
    });
});
