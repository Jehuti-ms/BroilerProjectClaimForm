// Authentication functions
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

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name-auth').value;
    
    // Simple authentication
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

// Handle password reset form submission
document.getElementById('reset-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('reset-username').value;
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmNewPassword = document.getElementById('reset-confirm-password').value;
    
    // Validation
    if (newPassword !== confirmNewPassword) {
        alert('Passwords do not match');
        return;
    }
    
    if (newPassword.length < 4) {
        alert('Password must be at least 4 characters long');
        return;
    }
    
    // Get existing users
    const users = JSON.parse(localStorage.getItem('users') || '{}');
    
    // Check if username exists
    if (!users[username]) {
        alert('Username not found');
        return;
    }
    
    // Update password
    users[username].password = newPassword;
    users[username].passwordResetAt = new Date().toISOString();
    
    // Save updated users
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('Password reset successful! You can now login with your new password.');
    showLogin();
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        window.location.href = 'index.html';
    }
    
    // Add emergency reset button for development (remove in production)
    addEmergencyReset();
});

// Emergency reset function for development
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

// auth.js - Remember employee name until changed
function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const employeeName = document.getElementById('employee-name').value.trim();

    if (!username || !password || !employeeName) {
        alert('Please fill in all fields');
        return;
    }

    // Save user data
    const userData = {
        username: username,
        employeeName: employeeName,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    // Always remember the employee name
    localStorage.setItem('lastEmployeeName', employeeName);
    
    window.location.href = 'index.html';
}

// Auto-fill employee name on page load
document.addEventListener('DOMContentLoaded', function() {
    const lastEmployeeName = localStorage.getItem('lastEmployeeName');
    const employeeNameInput = document.getElementById('employee-name');
    
    if (lastEmployeeName && employeeNameInput) {
        employeeNameInput.value = lastEmployeeName;
    }
});
