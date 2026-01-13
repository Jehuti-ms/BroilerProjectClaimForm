// auth.js - WITH FIREBASE
console.log('🔐 AUTH.JS LOADED - FIREBASE ENABLED');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM ready, setting up auth...');
    
    // Check if already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        console.log('User already logged in, redirecting...');
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize Firebase
    if (typeof initializeFirebase !== 'undefined') {
        const firebaseReady = initializeFirebase();
        console.log('Firebase initialization:', firebaseReady ? '✅ Success' : '❌ Failed');
    }
    
    setupAuthForms();
});

// Setup UI functions
function showRegister() {
    console.log('Showing register form');
    document.querySelector('.auth-card:first-child').style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
}

function showLogin() {
    console.log('Showing login form');
    document.getElementById('register-card').style.display = 'none';
    document.querySelector('.auth-card:first-child').style.display = 'block';
}

function setupAuthForms() {
    console.log('Setting up auth forms...');
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
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
    
    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted');
            
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
    
    // Make functions globally available
    window.showRegister = showRegister;
    window.showLogin = showLogin;
}

async function handleLogin(username, password, employeeName) {
    console.log('Firebase login attempt for:', username);
    
    const loginBtn = document.querySelector('#login-form button[type="submit"]');
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
    }
    
    try {
        // Try Firebase login first
        if (window.firebaseAuth) {
            const email = `${username}@broiler-project.com`;
            console.log('Attempting Firebase login with email:', email);
            
            try {
                const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
                
                // Firebase login successful
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    email: userCredential.user.email,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('✅ Firebase login successful');
                
                // Save to local users for future
                const users = JSON.parse(localStorage.getItem('users') || '{}');
                if (!users[username]) {
                    users[username] = {
                        password: password,
                        employeeName: employeeName,
                        createdAt: new Date().toISOString(),
                        firebaseLinked: true
                    };
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                // Redirect
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
                
                return;
                
            } catch (firebaseError) {
                console.log('Firebase login failed:', firebaseError.message);
                // Fall back to local authentication
            }
        }
        
        // Local authentication fallback
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        if (!users[username]) {
            alert('User not found. Please register first.');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
            return;
        }
        
        if (users[username].password !== password) {
            alert('Incorrect password');
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Sign In';
            }
            return;
        }
        
        // Local login successful
        const currentUser = {
            username: username,
            employeeName: employeeName,
            email: `${username}@broiler-project.com`,
            authType: 'local',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ Local login successful');
        
        // Redirect
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
        
        if (loginBtn) {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    }
}

async function handleRegister(username, password, employeeName) {
    console.log('Firebase registration attempt for:', username);
    
    const registerBtn = document.querySelector('#register-form button[type="submit"]');
    if (registerBtn) {
        registerBtn.disabled = true;
        registerBtn.textContent = 'Creating account...';
    }
    
    try {
        // Get existing users
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        
        // Check if username exists
        if (users[username]) {
            alert('Username already exists');
            if (registerBtn) {
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
            return;
        }
        
        // Try Firebase registration first
        if (window.firebaseAuth) {
            const email = `${username}@broiler-project.com`;
            console.log('Attempting Firebase registration with email:', email);
            
            try {
                const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
                
                // Firebase registration successful
                users[username] = {
                    password: password,
                    employeeName: employeeName,
                    createdAt: new Date().toISOString(),
                    firebaseLinked: true,
                    firebaseUid: userCredential.user.uid
                };
                
                localStorage.setItem('users', JSON.stringify(users));
                
                // Create user session
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    email: email,
                    authType: 'firebase',
                    firebaseUid: userCredential.user.uid,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('✅ Firebase registration successful');
                
                alert('Account created successfully!');
                
                // Redirect
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 500);
                
                return;
                
            } catch (firebaseError) {
                console.log('Firebase registration failed:', firebaseError.message);
                // Continue with local registration
            }
        }
        
        // Local registration only
        users[username] = {
            password: password,
            employeeName: employeeName,
            createdAt: new Date().toISOString(),
            firebaseLinked: false
        };
        
        localStorage.setItem('users', JSON.stringify(users));
        
        const currentUser = {
            username: username,
            employeeName: employeeName,
            email: `${username}@broiler-project.com`,
            authType: 'local',
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        console.log('✅ Local registration successful');
        
        alert('Account created successfully! (Local only)');
        
        // Redirect
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 500);
        
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
        
        if (registerBtn) {
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    }
}
