// SIMPLE Broiler Claim Form - NO ERRORS
console.log('Simple App starting...');

// Basic data
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication - SIMPLE VERSION
function checkAuth() {
    console.log('Checking auth...');
    
    // Check for user in localStorage
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.log('No user, going to auth page');
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('User found:', user.email);
        
        // Update display
        const displayName = localStorage.getItem('employeeName') || user.employeeName || user.email || 'User';
        document.getElementById('user-display').textContent = `Welcome, ${displayName}`;
        
        // Set employee name
        const nameInput = document.getElementById('employee-name');
        if (displayName) {
            nameInput.value = displayName;
        }
        
        return true;
    } catch (error) {
        console.log('Auth error, redirecting:', error);
        window.location.href = 'auth.html';
        return false;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded');
    
    if (checkAuth()) {
        initializeApp();
    }
});

// Initialize app
function initializeApp() {
    console.log('Initializing app...');
    
    // Set current date
    const now = new Date();
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    monthSelect.value = now.getMonth();
    yearInput.value = now.getFullYear();
    
    // Update form date
    updateFormDate();
    
    // Setup event listeners
    setupListeners();
    
    // Load data
    loadUserData();
}

// Update form date
function updateFormDate() {
    try {
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        document.getElementById('form-date').textContent = `${monthNames[month]} ${year}`;
    } catch (error) {
        console.log('Error updating date:', error);
    }
}

// Setup all listeners
function setupListeners() {
    // Month/year changes
    document.getElementById('month-select').addEventListener('change', updateFormDate);
    document.getElementById('year-input').addEventListener('change', updateFormDate);
    
    // Employee name auto-save
    const nameInput = document.getElementById('employee-name');
    nameInput.addEventListener('change', function() {
        localStorage.setItem('employeeName', this.value);
        document.getElementById('user-display').textContent = `Welcome, ${this.value}`;
    });
}

// Load user data
function loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        const savedData = localStorage.getItem(dataKey);
        if (savedData) {
            const allData = JSON.parse(savedData);
            
            // Get current month
            const month = document.getElementById('month-select').value;
            const year = document.getElementById('year-input').value;
            const monthYear = `${month}-${year}`;
            
            if (allData[monthYear]) {
                currentFormData = allData[monthYear];
                renderTable();
            }
        }
    } catch (error) {
        console.log('Error loading data:', error);
    }
}

// Save data
function saveData() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        // Get current month
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        const monthYear = `${month}-${year}`;
        
        // Get existing data
        const existing = localStorage.getItem(dataKey);
        let allData = existing ? JSON.parse(existing) : {};
        
        // Update current month
        allData[monthYear] = currentFormData;
        
        // Save
        localStorage.setItem(dataKey, JSON.stringify(allData));
        console.log('Data saved');
        
        // Show notification
        alert('Data saved successfully!');
    } catch (error) {
        console.log('Error saving:', error);
        alert('Error saving data');
    }
}

// Render table
function renderTable() {
    const tbody = document.querySelector('#time-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    currentFormData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateDisplay(entry.date)}</td>
            <td>${entry.amPm}</td>
            <td>${formatTimeDisplay(entry.inTime)}</td>
            <td>${formatTimeDisplay(entry.outTime)}</td>
            <td>${entry.hours}</td>
            <td>
                <button class="edit-btn" onclick="editRow(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    calculateTotal();
}

// Format date for display
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

// Format time for display
function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
}

// Calculate hours
function calculateHours(inTime, outTime) {
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    
    let hours = outH - inH;
    let minutes = outM - inM;
    
    if (minutes < 0) {
        hours--;
        minutes += 60;
    }
    
    if (hours < 0) hours += 24;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Calculate total hours
function calculateTotal() {
    let total = 0;
    
    currentFormData.forEach(entry => {
        if (entry.hours) {
            const [h, m] = entry.hours.split(':').map(Number);
            total += h * 60 + m;
        }
    });
    
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    
    const totalElement = document.getElementById('total-hours');
    if (totalElement) {
        totalElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
}

// Open modal to add entry
function openModal() {
    // Clear any editing
    window.editingIndex = undefined;
    document.getElementById('modal-title').textContent = 'Add New Entry';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('entry-date').value = today;
    document.getElementById('entry-am-pm').value = 'AM';
    document.getElementById('entry-time-in').value = '';
    document.getElementById('entry-time-out').value = '';
    
    document.getElementById('entry-modal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('entry-modal').style.display = 'none';
    window.editingIndex = undefined;
}

// Save entry
function saveEntry() {
    const date = document.getElementById('entry-date').value;
    const amPm = document.getElementById('entry-am-pm').value;
    const inTime = document.getElementById('entry-time-in').value;
    const outTime = document.getElementById('entry-time-out').value;
    
    if (!date || !inTime || !outTime) {
        alert('Please fill all fields');
        return;
    }
    
    const hours = calculateHours(inTime, outTime);
    const entry = { date, amPm, inTime, outTime, hours };
    
    if (window.editingIndex !== undefined) {
        // Update existing
        currentFormData[window.editingIndex] = entry;
    } else {
        // Add new
        currentFormData.push(entry);
    }
    
    renderTable();
    saveData();
    closeModal();
}

// Edit row
function editRow(index) {
    const entry = currentFormData[index];
    
    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-am-pm').value = entry.amPm;
    document.getElementById('entry-time-in').value = entry.inTime;
    document.getElementById('entry-time-out').value = entry.outTime;
    
    window.editingIndex = index;
    document.getElementById('modal-title').textContent = 'Edit Entry';
    document.getElementById('entry-modal').style.display = 'block';
}

// Delete row
function deleteRow(index) {
    if (confirm('Delete this entry?')) {
        currentFormData.splice(index, 1);
        renderTable();
        saveData();
    }
}

// Clear all entries
function clearForm() {
    if (confirm('Clear all entries for this month?')) {
        currentFormData = [];
        renderTable();
        saveData();
    }
}

// Logout
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeName');
    window.location.href = 'auth.html';
}

// Basic PDF
function generatePDF() {
    alert('PDF feature will be added later');
}

// Basic Print
function printForm() {
    alert('Print feature will be added later');
}

// Close modal with escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// Close modal when clicking outside
window.onclick = function(e) {
    const modal = document.getElementById('entry-modal');
    if (e.target === modal) closeModal();
};
