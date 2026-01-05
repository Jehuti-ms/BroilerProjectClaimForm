// app.js - FIXED VERSION

// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initAutoSyncCheckbox();
    
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
        
        // Update user display - handle both old and new formats
        const displayName = user.employeeName || user.email || 'User';
        document.getElementById('user-display').textContent = `Welcome, ${displayName}`;
        
        // Set employee name in form
        const employeeNameInput = document.getElementById('employee-name');
        if (employeeNameInput) {
            employeeNameInput.value = user.employeeName || displayName;
        }
        
        // Initialize the app
        initializeApp();
        
        // Load user data
        const username = user.username || user.email?.split('@')[0] || 'default';
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
        document.getElementById('month-select').value = lastMonth;
        document.getElementById('year-input').value = lastYear;
    }
    
    // Add event listeners for date controls
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect) {
        monthSelect.addEventListener('change', function() {
            updateFormDate();
            saveCurrentMonth();
            
            // Load data for the new month
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const username = user.username || user.email?.split('@')[0] || 'default';
                loadUserData(username);
            }
        });
    }
    
    if (yearInput) {
        yearInput.addEventListener('change', function() {
            updateFormDate();
            saveCurrentMonth();
            
            // Load data for the new month/year
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const username = user.username || user.email?.split('@')[0] || 'default';
                loadUserData(username);
            }
        });
    }
    
    updateFormDate();
}

function saveCurrentMonth() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    localStorage.setItem('lastViewedMonth', month);
    localStorage.setItem('lastViewedYear', year);
}

function updateFormDate() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    document.getElementById('form-date').textContent = `${monthNames[month]} ${year}`;
}

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
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    const userData = localStorage.getItem(`userData_${userId}`);
    
    const tableBody = document.querySelector('#time-table tbody');
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
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
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

// ==================== IMPORT/EXPORT INTEGRATION ====================

function importData() {
    console.log('📁 Import button clicked');
    
    if (!window.currentUser) {
        alert('Please login first!');
        window.location.href = 'auth.html';
        return;
    }
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,.csv';
    fileInput.style.display = 'none';
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const content = event.target.result;
                const fileName = file.name.toLowerCase();
                
                let data;
                if (fileName.endsWith('.json')) {
                    data = JSON.parse(content);
                    console.log('📊 JSON imported:', data.length, 'items');
                } else if (fileName.endsWith('.csv')) {
                    data = parseCSV(content);
                    console.log('📋 CSV imported:', data.length, 'rows');
                } else {
                    alert('Please select .json or .csv file');
                    return;
                }
                
                // Save imported data
                await saveImportedData(data);
                
                alert(`✅ Successfully imported ${data.length} items`);
                
                // Refresh display
                loadCurrentUserData();
                
            } catch (error) {
                console.error('Import error:', error);
                alert(`❌ Import failed: ${error.message}`);
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }
    
    return data;
}

async function saveImportedData(data) {
    if (!window.currentUser) return;
    
    console.log('💾 Saving imported data for user:', window.currentUser.email);
    
    // Add metadata to imported data
    const dataWithMeta = data.map(item => ({
        ...item,
        importedBy: window.currentUser.email,
        importedAt: new Date().toISOString()
    }));
    
    // Get current data
    const userId = window.currentUser.email;
    const existingData = JSON.parse(localStorage.getItem(`userData_${userId}`) || '{}');
    
    // Combine data (you might want to merge or replace based on your needs)
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // For now, append to current month's data
    const currentMonthData = existingData[monthYear] || [];
    existingData[monthYear] = [...currentMonthData, ...dataWithMeta];
    
    // Save to localStorage
    localStorage.setItem(`userData_${userId}`, JSON.stringify(existingData));
    
    console.log('✅ Saved imported data');
    
    // Update current form data
    currentFormData = existingData[monthYear];
    
    // Try Firebase sync if available
    if (window.currentUser.firebaseAuth && typeof syncToCloud === 'function') {
        try {
            await syncToCloud();
        } catch (error) {
            console.log('Firebase sync optional:', error.message);
        }
    }
}

// ==================== TABLE FUNCTIONS (Keep your existing) ====================

function addRowToTable(data) {
    const tableBody = document.querySelector('#time-table tbody');
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

function openModal(rowIndex = null) {
    const modal = document.getElementById('entry-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (rowIndex !== null) {
        modalTitle.textContent = 'Edit Time Entry';
        currentEditingRow = rowIndex;
        
        const rows = document.querySelectorAll('#time-table tbody tr');
        const row = rows[rowIndex];
        
        const date = row.cells[0].textContent;
        const amPm = row.cells[1].textContent;
        const inTime = convertTo24Hour(row.cells[2].textContent);
        const outTime = convertTo24Hour(row.cells[3].textContent);
        
        document.getElementById('entry-date').value = formatDateForInput(date);
        document.getElementById('entry-am-pm').value = amPm;
        document.getElementById('entry-time-in').value = inTime;
        document.getElementById('entry-time-out').value = outTime;
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
    document.getElementById('entry-modal').style.display = 'none';
    currentEditingRow = null;
}

function saveEntry() {
    const date = document.getElementById('entry-date').value;
    const amPm = document.getElementById('entry-am-pm').value;
    const inTime = document.getElementById('entry-time-in').value;
    const outTime = document.getElementById('entry-time-out').value;
    
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

// ... Keep all your existing table helper functions ...

// ==================== UTILITY FUNCTIONS ====================

function setupEventListeners() {
    // Employee name input
    const employeeNameInput = document.getElementById('employee-name');
    if (employeeNameInput) {
        employeeNameInput.addEventListener('input', function() {
            localStorage.setItem('mainAppEmployeeName', this.value);
        });
    }
    
    // Auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('firebase-auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', toggleFirebaseAutoSync);
        const savedPref = localStorage.getItem('firebaseAutoSyncEnabled');
        autoSyncCheckbox.checked = savedPref === 'true';
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

function toggleFirebaseAutoSync() {
    const checkbox = document.getElementById('firebase-auto-sync');
    if (checkbox) {
        const isEnabled = checkbox.checked;
        localStorage.setItem('firebaseAutoSyncEnabled', isEnabled.toString());
        
        if (isEnabled) {
            showNotification('Firebase auto-sync enabled', 'success');
        } else {
            showNotification('Firebase auto-sync disabled', 'info');
        }
    }
}

function showNotification(message, type = 'info') {
    // Your existing notification code
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // Simple alert for now - you can replace with your notification system
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

// ==================== GLOBAL EXPORTS ====================

// Make functions globally available
window.importData = importData;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveEntry = saveEntry;
window.deleteRow = deleteRow;
window.clearForm = clearForm;
window.saveForm = saveUserData;
window.generatePDF = generatePDF;
window.logout = function() {
    // Use auth.js logout function if available
    if (window.authModule && window.authModule.handleLogout) {
        window.authModule.handleLogout();
    } else {
        // Fallback logout
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    }
};
