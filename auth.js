// auth.js - FIXED VERSION
// Wait for DOM to load before attaching event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, setting up authentication...');
    
    // Check if user is already logged in
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set up auth functions
    window.showRegister = function() {
        document.getElementById('login-form').parentElement.style.display = 'none';
        document.getElementById('register-card').style.display = 'block';
    };
    
    window.showLogin = function() {
        document.getElementById('register-card').style.display = 'none';
        document.getElementById('login-form').parentElement.style.display = 'block';
    };
    
    // Initialize Firebase
    initializeFirebase();
    
    // Set up login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Set up register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Firebase initialization
let firebaseInitialized = false;
let auth = null;

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        console.log('Firebase SDK not loaded');
        return false;
    }
    
    // Firebase config - MOVE THIS HERE TO AVOID DUPLICATION
    const firebaseConfig = {
        apiKey: "AIzaSyAJhRNUgsrvUvjKXXosS6YZLhbHhpBq0Zg",
        authDomain: "broiler-project-e1f62.firebaseapp.com",
        projectId: "broiler-project-e1f62",
        storageBucket: "broiler-project-e1f62.appspot.com",
        messagingSenderId: "1084373471420",
        appId: "1:1084373471420:web:f60bf8c5db75b9fe4f90c4"
    };
    
    if (!firebaseInitialized) {
        try {
            // Check if Firebase is already initialized
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            }
            auth = firebase.auth();
            firebaseInitialized = true;
            console.log('✅ Firebase Auth initialized');
            return true;
        } catch (error) {
            console.log('Firebase initialization error:', error.message);
            return false;
        }
    }
    return true;
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    
    if (!username || !password || !employeeName) {
        alert('Please fill in all fields');
        return;
    }
    
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
    }
    
    try {
        // Try local authentication
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (users[username] && users[username].password === password) {
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
        
        // Try Firebase if local fails
        if (initializeFirebase() && auth) {
            const email = `${username}@broiler-project.com`;
            
            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    email: userCredential.user.email,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                // Save to local users for future
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
            }
        }
        
        alert('Invalid username or password');
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login error: ' + error.message);
    } finally {
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
}

// Handle registration
async function handleRegister(e) {
    e.preventDefault();
    
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const employeeName = document.getElementById('new-employee-name').value;
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }
    
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';
    }
    
    try {
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
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
        
        // Try Firebase registration
        if (initializeFirebase() && auth) {
            const email = `${username}@broiler-project.com`;
            
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                
                users[username].firebaseLinked = true;
                users[username].firebaseUid = userCredential.user.uid;
                localStorage.setItem('users', JSON.stringify(users));
                
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
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    }
}
