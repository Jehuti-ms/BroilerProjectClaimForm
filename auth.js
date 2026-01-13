// auth.js - UPDATED WITH FIREBASE INTEGRATION
// Authentication functions
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('login-form').parentElement.style.display = 'block';
}

// Initialize Firebase (add this to your HTML head)
const firebaseConfig = {
    apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
    authDomain: "broiler-project-e1f62.firebaseapp.com",
    projectId: "broiler-project-e1f62",
    storageBucket: "broiler-project-e1f62.appspot.com",
    messagingSenderId: "1084373471420",
    appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
};

// Initialize Firebase (only once)
let firebaseInitialized = false;
let auth = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded');
        return false;
    }
    
    if (!firebaseInitialized) {
        try {
            firebase.initializeApp(firebaseConfig);
            auth = firebase.auth();
            firebaseInitialized = true;
            console.log('✅ Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }
    return true;
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    
    // Validate input
    if (!username || !password || !employeeName) {
        alert('Please fill in all fields');
        return;
    }
    
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    
    try {
        // Try local authentication first
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (users[username] && users[username].password === password) {
            // Successful local login
            const currentUser = {
                username: username,
                employeeName: employeeName,
                email: `${username}@broiler-project.com`,
                authType: 'local',
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('✅ Local login successful');
            window.location.href = 'index.html';
            return;
        }
        
        // If local login failed, try Firebase
        if (initializeFirebase() && auth) {
            try {
                // Create email from username
                const email = `${username}@broiler-project.com`;
                
                // Sign in with Firebase
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                
                // Successful Firebase login
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    email: userCredential.user.email,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Also save to local users for future local login
                if (!users[username]) {
                    users[username] = {
                        password: password,
                        employeeName: employeeName,
                        createdAt: new Date().toISOString(),
                        firebaseLinked: true
                    };
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                console.log('✅ Firebase login successful');
                window.location.href = 'index.html';
                return;
                
            } catch (firebaseError) {
                console.log('Firebase login failed:', firebaseError.message);
                
                // If Firebase fails but credentials are correct locally, use local
                if (users[username] && users[username].password === password) {
                    const currentUser = {
                        username: username,
                        employeeName: employeeName,
                        email: `${username}@broiler-project.com`,
                        authType: 'local',
                        timestamp: new Date().toISOString()
                    };
                    
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    console.log('✅ Fallback to local login');
                    window.location.href = 'index.html';
                    return;
                }
            }
        }
        
        // If we get here, authentication failed
        alert('Invalid username or password');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const employeeName = document.getElementById('new-employee-name').value;
    
    // Validation
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }
    
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';
    
    try {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // Check if username already exists
        if (users[username]) {
            alert('Username already exists');
            return;
        }
        
        // Create local user first
        users[username] = {
            password: password,
            employeeName: employeeName,
            createdAt: new Date().toISOString(),
            firebaseLinked: false
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        
        // Try Firebase registration if available
        if (initializeFirebase() && auth) {
            try {
                const email = `${username}@broiler-project.com`;
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                // Update local user with Firebase info
                users[username].firebaseLinked = true;
                users[username].firebaseUid = userCredential.user.uid;
                localStorage.setItem('users', JSON.stringify(users));
                
                // Create user object
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    email: email,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                alert('Registration successful!');
                window.location.href = 'index.html';
                return;
                
            } catch (firebaseError) {
                console.log('Firebase registration failed:', firebaseError.message);
                // Continue with local registration only
            }
        }
        
        // Local registration only
        const currentUser = {
            username: username,
            employeeName: employeeName,
            email: `${username}@broiler-project.com`,
            authType: 'local',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        alert('Registration successful! (Local only)');
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration error: ' + error.message);
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Try to initialize Firebase
    initializeFirebase();
    
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
});
