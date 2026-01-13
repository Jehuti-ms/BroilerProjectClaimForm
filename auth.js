// auth.js - SIMPLE VERSION
console.log('🔐 SIMPLE AUTH.JS');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready for auth');
    
    // Check if already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        console.log('User already logged in');
        window.location.href = 'index.html';
        return;
    }
    
    setupSimpleAuth();
});

function setupSimpleAuth() {
    console.log('Setting up simple auth...');
    
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const employeeName = document.getElementById('employee-name-auth').value;
            
            if (!username || !password || !employeeName) {
                alert('Please fill all fields');
                return;
            }
            
            // Simple login
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username] && users[username].password === password) {
                // Login successful
                const currentUser = {
                    username: username,
                    employeeName: employeeName,
                    timestamp: new Date().toISOString()
                };
                
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                console.log('Login successful');
                window.location.href = 'index.html';
                
            } else {
                alert('Invalid credentials. Please register first.');
            }
        });
    }
    
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
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
                alert('Password must be at least 4 characters');
                return;
            }
            
            // Simple registration
            const users = JSON.parse(localStorage.getItem('users') || '{}');
            
            if (users[username]) {
                alert('Username already exists');
                return;
            }
            
            users[username] = {
                password: password,
                employeeName: employeeName,
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('users', JSON.stringify(users));
            
            // Auto-login
            const currentUser = {
                username: username,
                employeeName: employeeName,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            console.log('Registration successful');
            
            alert('Account created!');
            window.location.href = 'index.html';
        });
    }
    
    // Simple UI functions
    window.showRegister = function() {
        document.querySelector('.auth-card:first-child').style.display = 'none';
        document.getElementById('register-card').style.display = 'block';
    };
    
    window.showLogin = function() {
        document.getElementById('register-card').style.display = 'none';
        document.querySelector('.auth-card:first-child').style.display = 'block';
    };
}

console.log('✅ Simple auth.js loaded');
