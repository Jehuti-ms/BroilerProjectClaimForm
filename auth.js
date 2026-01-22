// Authentication functions
function showRegister() {
    document.getElementById('login-form').parentElement.style.display = 'none';
    document.getElementById('register-card').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-card').style.display = 'none';
    document.getElementById('login-form').parentElement.style.display = 'block';
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    
    // Simple authentication (in a real app, this would be server-side)
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    if (users[username] && users[username].password === password) {
        // Successful login
        const currentUser = {
            username: username,
            employeeName: users[username].employeeName
        };
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        window.location.href = 'index.html';
    } else {
        alert('Invalid username or password');
    }
});

// Handle registration form submission
document.getElementById('register-form').addEventListener('submit', function(e) {
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
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Check if username already exists
    if (users[username]) {
        alert('Username already exists');
        return;
    }
    
    // Create new user
    users[username] = {
        password: password,
        employeeName: employeeName,
        createdAt: new Date().toISOString()
    };
    
    // Save users
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto-login after registration
    const currentUser = {
        username: username,
        employeeName: employeeName
    };
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    alert('Registration successful!');
    window.location.href = 'index.html';
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
});
