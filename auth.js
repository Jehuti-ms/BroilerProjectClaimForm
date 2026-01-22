// Authentication functions
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
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    const errorElement = document.getElementById('auth-error');
    
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    try {
        // Sign in with Firebase
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Check if user profile exists in Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists) {
            // Create user profile if it doesn't exist
            await db.collection('users').doc(user.uid).set({
                email: user.email,
                employeeName: employeeName,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Update last login
            await db.collection('users').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        // Store user info in localStorage for quick access
        localStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            employeeName: employeeName
        }));
        
        // Redirect to main app
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        errorElement.textContent = getAuthErrorMessage(error);
        errorElement.style.display = 'block';
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const employeeName = document.getElementById('register-employee-name').value;
    const errorElement = document.getElementById('register-error');
    
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    // Validation
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
        // Create user with Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user profile in Firestore
        await db.collection('users').doc(user.uid).set({
            email: user.email,
            employeeName: employeeName,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Store user info in localStorage
        localStorage.setItem('currentUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            employeeName: employeeName
        }));
        
        // Redirect to main app
        window.location.href = 'index.html';
        
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
        default:
            return 'An error occurred. Please try again';
    }
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in, redirect to main app
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                localStorage.setItem('currentUser', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    employeeName: userDoc.data().employeeName
                }));
                window.location.href = 'index.html';
            }
        }
    });
});
