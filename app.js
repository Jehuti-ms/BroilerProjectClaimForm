// app.js - COMPLETE FIXED VERSION

// Global variables
let currentEditingRow = null;
let currentFormData = [];
let isOnline = navigator.onLine; // Track online status
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initAutoSyncCheckbox();
    setupEventListeners();
    setupEmployeeNameMemory();
    setupNetworkMonitoring();
    
    // Add event listener for auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', toggleAutoSync);
    }
});

// Check if user is authenticated - FIXED VERSION
function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    
    // If no user, redirect to auth page
    if (!currentUser) {
        console.log('No user found, redirecting to auth.html');
        window.location.href = 'auth.html';
        return; // Exit function
    }
    
    try {
        const user = JSON.parse(currentUser);
        console.log('User authenticated:', user);
        
        // Set global currentUser
        window.currentUser = user;
        
        // Update user display - handle both old and new formats
        const displayName = user.employeeName || user.email || 'User';
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = `Welcome, ${displayName}`;
        }
        
        // Set employee name in form
        const employeeNameInput = document.getElementById('employee-name');
        if (employeeNameInput) {
            employeeNameInput.value = user.employeeName || displayName;
        }
        
        // Initialize the app
        initializeApp();
        
        // Load user data
        const username = user.username || (user.email ? user.email.split('@')[0] : 'default');
        loadUserData(username);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'auth.html';
    }
}

// Initialize the application
function initializeApp() {
    // Load last viewed month from localStorage
    const lastMonth = localStorage.getItem('lastViewedMonth');
    const lastYear = localStorage.getItem('lastViewedYear');
    
    if (lastMonth !== null && lastYear !== null) {
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        
        if (monthSelect) monthSelect.value = lastMonth;
        if (yearInput) yearInput.value = lastYear;
    }
    
    // Add event listeners for date controls
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect) {
        monthSelect.addEventListener('change', function() {
            updateFormDate();
            saveCurrentMonth();
            
            // Load data for the new month
            if (window.currentUser) {
                const username = window.currentUser.username || 
                               (window.currentUser.email ? window.currentUser.email.split('@')[0] : 'default');
                loadUserData(username);
            }
        });
    }
    
    if (yearInput) {
        yearInput.addEventListener('change', function() {
            updateFormDate();
            saveCurrentMonth();
            
            // Load data for the new month/year
            if (window.currentUser) {
                const username = window.currentUser.username || 
                               (window.currentUser.email ? window.currentUser.email.split('@')[0] : 'default');
                loadUserData(username);
            }
        });
    }
    
    updateFormDate();
    calculateTotal(); // Initial calculation
}

function saveCurrentMonth() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect && yearInput) {
        const month = monthSelect.value;
        const year = yearInput.value;
        
        localStorage.setItem('lastViewedMonth', month);
        localStorage.setItem('lastViewedYear', year);
    }
}

function updateFormDate() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    const formDate = document.getElementById('form-date');
    
    if (monthSelect && yearInput && formDate) {
        const month = monthSelect.value;
        const year = yearInput.value;
        formDate.textContent = `${monthNames[month]} ${year}`;
    }
}

// ==================== DATA LOADING ====================

function loadUserData(userId) {
    console.log('Loading data for user:', userId);
    loadCurrentUserData();
}

function loadCurrentUserData() {
    if (!window.currentUser) {
        console.log('No current user for data loading');
        return;
    }
    
    const userId = window.currentUser.email;
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) return;
    
    const month = parseInt(monthSelect.value);
    const year = yearInput.value;
    const monthYear = `${month}-${year}`;
    
    const userData = localStorage.getItem(`userData_${userId}`);
    
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (userData) {
        const allData = JSON.parse(userData);
        if (allData[monthYear]) {
            allData[monthYear].forEach(entry => {
                addRowToTable(entry);
                currentFormData.push(entry);
            });
            console.log(`Loaded ${currentFormData.length} entries for ${monthYear}`);
        } else {
            console.log(`No data found for ${monthYear}`);
        }
    }
    
    calculateTotal();
}

function saveUserData() {
    if (!window.currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const userId = window.currentUser.email;
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) return;
    
    const month = parseInt(monthSelect.value);
    const year = yearInput.value;
    const monthYear = `${month}-${year}`;
    
    // Get existing user data
    const existingData = localStorage.getItem(`userData_${userId}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Update data for current month
    allData[monthYear] = currentFormData;
    
    // Save back to localStorage
    localStorage.setItem(`userData_${userId}`, JSON.stringify(allData));
    
    // Try to sync with Firebase if user has Firebase auth
    if (window.currentUser.firebaseAuth && isOnline) {
        // Check if sync.js is available
        if (typeof syncToCloud === 'function') {
            setTimeout(() => {
                syncToCloud();
            }, 1000);
        }
    }
    
    showNotification('Form data saved successfully!', 'success');
}

// ==================== TABLE FUNCTIONS ====================

function addRowToTable(data) {
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) return;
    
    const rowIndex = tableBody.children.length;
    
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${formatDateForDisplay(data.date)}</td>
        <td>${data.amPm}</td>
        <td>${formatTimeDisplay(data.inTime)}</td>
        <td>${formatTimeDisplay(data.outTime)}</td>
        <td>${data.hours}</td>
        <td>
            <button class="edit-btn" onclick="openModal(${rowIndex})">Edit</button>
            <button class="delete-btn" onclick="deleteRow(${rowIndex})">Delete</button>
        </td>
    `;
    
    tableBody.appendChild(newRow);
}

function updateRowInTable(rowIndex, data) {
    const rows = document.querySelectorAll('#time-table tbody tr');
    if (rows[rowIndex]) {
        const row = rows[rowIndex];
        
        row.cells[0].textContent = formatDateForDisplay(data.date);
        row.cells[1].textContent = data.amPm;
        row.cells[2].textContent = formatTimeDisplay(data.inTime);
        row.cells[3].textContent = formatTimeDisplay(data.outTime);
        row.cells[4].textContent = data.hours;
    }
}

function deleteRow(rowIndex) {
    if (confirm('Are you sure you want to delete this entry?')) {
        const rows = document.querySelectorAll('#time-table tbody tr');
        if (rows[rowIndex]) {
            rows[rowIndex].remove();
            currentFormData.splice(rowIndex, 1);
            
            // Update row indices for remaining rows
            const remainingRows = document.querySelectorAll('#time-table tbody tr');
            remainingRows.forEach((row, index) => {
                const buttonsCell = row.cells[5];
                if (buttonsCell) {
                    buttonsCell.innerHTML = `
                        <button class="edit-btn" onclick="openModal(${index})">Edit</button>
                        <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
                    `;
                }
            });
            
            calculateTotal();
            saveUserData();
        }
    }
}

// ==================== MODAL FUNCTIONS ====================

function openModal(rowIndex = null) {
    const modal = document.getElementById('entry-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalTitle) return;
    
    if (rowIndex !== null) {
        modalTitle.textContent = 'Edit Time Entry';
        currentEditingRow = rowIndex;
        
        const rows = document.querySelectorAll('#time-table tbody tr');
        const row = rows[rowIndex];
        
        if (row) {
            const date = row.cells[0].textContent;
            const amPm = row.cells[1].textContent;
            const inTime = convertTo24Hour(row.cells[2].textContent);
            const outTime = convertTo24Hour(row.cells[3].textContent);
            
            document.getElementById('entry-date').value = formatDateForInput(date);
            document.getElementById('entry-am-pm').value = amPm;
            document.getElementById('entry-time-in').value = inTime;
            document.getElementById('entry-time-out').value = outTime;
        }
    } else {
        modalTitle.textContent = 'Add New Time Entry';
        currentEditingRow = null;
        
        document.getElementById('entry-date').value = '';
        document.getElementById('entry-am-pm').value = 'AM';
        document.getElementById('entry-time-in').value = '';
        document.getElementById('entry-time-out').value = '';
    }
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'none';
        currentEditingRow = null;
    }
}

function saveEntry() {
    const dateInput = document.getElementById('entry-date');
    const amPmSelect = document.getElementById('entry-am-pm');
    const inTimeInput = document.getElementById('entry-time-in');
    const outTimeInput = document.getElementById('entry-time-out');
    
    if (!dateInput || !amPmSelect || !inTimeInput || !outTimeInput) return;
    
    const date = dateInput.value;
    const amPm = amPmSelect.value;
    const inTime = inTimeInput.value;
    const outTime = outTimeInput.value;
    
    if (!date || !inTime || !outTime) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    // Calculate hours
    const inDate = new Date(`2000-01-01T${inTime}`);
    const outDate = new Date(`2000-01-01T${outTime}`);
    
    if (outDate < inDate) {
        outDate.setDate(outDate.getDate() + 1);
    }
    
    const diffMs = outDate - inDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const hours = `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
    
    const entryData = {
        date: date,
        amPm: amPm,
        inTime: inTime,
        outTime: outTime,
        hours: hours
    };
    
    if (currentEditingRow !== null) {
        updateRowInTable(currentEditingRow, entryData);
        currentFormData[currentEditingRow] = entryData;
        showNotification('Entry updated successfully', 'success');
    } else {
        addRowToTable(entryData);
        currentFormData.push(entryData);
        showNotification('Entry added successfully', 'success');
    }
    
    calculateTotal();
    saveUserData();
    closeModal();
}

// ==================== UTILITY FUNCTIONS ====================

function calculateTotal() {
    const rows = document.querySelectorAll('#time-table tbody tr');
    let totalMinutes = 0;
    
    rows.forEach(row => {
        const hoursText = row.cells[4].textContent;
        if (hoursText) {
            const [hours, minutes] = hoursText.split(':').map(Number);
            totalMinutes += hours * 60 + (minutes || 0);
        }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const totalHoursElement = document.getElementById('total-hours');
    if (totalHoursElement) {
        totalHoursElement.textContent = `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    // Handle YYYY-MM-DD format
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }
    
    // Handle DD/MM/YYYY format (already formatted)
    return dateString;
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Handle DD/MM/YYYY format
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Handle YYYY-MM-DD format (already correct)
    return dateString;
}

function formatTimeDisplay(time) {
    if (!time) return '';
    
    // If already formatted (contains AM/PM), return as is
    if (time.includes('AM') || time.includes('PM')) {
        return time;
    }
    
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

function convertTo24Hour(timeString) {
    if (!timeString) return '';
    
    // If already in 24h format (no AM/PM)
    if (!timeString.includes('AM') && !timeString.includes('PM')) {
        return timeString;
    }
    
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (modifier === 'PM' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
    }
    if (modifier === 'AM' && hours === '12') {
        hours = '00';
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

function clearForm() {
    if (confirm('Are you sure you want to clear all entries for this month?')) {
        const tableBody = document.querySelector('#time-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            currentFormData = [];
            calculateTotal();
            saveUserData();
        }
    }
}

// ==================== SETUP FUNCTIONS ====================

function setupEventListeners() {
    // Employee name input
    const employeeNameInput = document.getElementById('employee-name');
    if (employeeNameInput) {
        employeeNameInput.addEventListener('input', function() {
            localStorage.setItem('mainAppEmployeeName', this.value);
        });
    }
}

function setupEmployeeNameMemory() {
    const employeeNameInput = document.getElementById('employee-name');
    if (employeeNameInput) {
        const savedName = localStorage.getItem('mainAppEmployeeName');
        if (savedName) {
            employeeNameInput.value = savedName;
        }
    }
}

function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('App is online');
        showNotification('Back online - syncing data...', 'success');
        
        // Auto-sync when coming back online
        if (window.currentUser && window.currentUser.firebaseAuth) {
            setTimeout(() => {
                if (typeof syncToCloud === 'function') {
                    syncToCloud();
                }
            }, 3000);
        }
    });
    
    window.addEventListener('offline', () => {
        isOnline = false;
        console.log('App is offline');
        showNotification('You are offline - changes saved locally', 'info');
    });
}

// ==================== OTHER FUNCTIONS ====================

function showNotification(message, type = 'info') {
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Simple notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ==================== AUTO-SYNC FUNCTIONS ====================

function toggleAutoSync() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const isEnabled = checkbox.checked;
        localStorage.setItem('autoSyncEnabled', isEnabled.toString());
        
        if (isEnabled) {
            showNotification('Auto-sync enabled');
            if (typeof startAutoSync === 'function') {
                startAutoSync();
            }
        } else {
            showNotification('Auto-sync disabled');
            if (typeof stopAutoSync === 'function') {
                stopAutoSync();
            }
        }
    }
}

function initAutoSyncCheckbox() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        checkbox.checked = autoSync === 'true';
    }
}

// ==================== GLOBAL EXPORTS ====================

// Make functions globally available
window.openModal = openModal;
window.closeModal = closeModal;
window.saveEntry = saveEntry;
window.deleteRow = deleteRow;
window.clearForm = clearForm;
window.saveForm = saveUserData;
window.logout = function() {
    // Sign out from Firebase if available
    if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        firebaseAuth.signOut();
    }
    
    // Clear user data
    localStorage.removeItem('currentUser');
    
    // Redirect to auth page
    window.location.href = 'auth.html';
};

// Note: generatePDF and exportData/importData functions would need to be added separately
// if you want to keep those features
