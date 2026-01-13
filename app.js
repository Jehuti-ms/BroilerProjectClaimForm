// app.js - COMPLETE VERSION WITH ALL FUNCTIONALITY
// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserPreferences();      // ADD THIS LINE
    initAutoSyncCheckbox();
    setupAutoSyncOnLogin();     // ADD THIS LINE
    
    // Add event listener for auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', toggleAutoSync);
    }
    
    // Set up employee name memory for MAIN FORM
    setupEmployeeNameMemory();
    
    // Initialize Firebase sync if available (optional)
    setTimeout(() => {
        if (typeof initCloudSync === 'function') {
            initCloudSync();
        }
    }, 1000);
});

// Check if user is authenticated - UPDATED for Firebase compatibility
function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        
        // Handle both old (username-based) and new (email/Firebase-based) user formats
        let displayName, username;
        
        if (user.employeeName) {
            // Old format or Firebase with employeeName
            displayName = user.employeeName;
            username = user.username || (user.email ? user.email.split('@')[0] : 'user');
        } else if (user.email) {
            // Firebase email format
            displayName = user.email.split('@')[0];
            username = displayName;
            
            // Update user object to include employeeName if missing
            user.employeeName = displayName;
            user.username = username;
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            // Fallback
            displayName = 'User';
            username = 'user';
        }
        
        // Update UI
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = `Welcome, ${displayName}`;
        }
        
        const employeeNameInput = document.getElementById('employee-name');
        if (employeeNameInput) {
            employeeNameInput.value = displayName;
        }
        
        // Initialize the app
        initializeApp();
        loadUserData(username);
        
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'auth.html';
    }
}

// Add this function to app.js (after checkAuthentication):
function loadUserPreferences() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    try {
        const user = JSON.parse(currentUser);
        const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
        
        // Load user-specific preferences
        const userPrefs = localStorage.getItem(`prefs_${username}`);
        if (userPrefs) {
            const prefs = JSON.parse(userPrefs);
            
            // Apply preferences
            const autoSyncCheckbox = document.getElementById('auto-sync');
            if (autoSyncCheckbox && prefs.autoSync !== undefined) {
                autoSyncCheckbox.checked = prefs.autoSync;
                localStorage.setItem('autoSyncEnabled', prefs.autoSync.toString());
            }
            
            console.log('Loaded user preferences:', prefs);
        }
        
        // Update last login
        localStorage.setItem(`prefs_${username}`, JSON.stringify({
            ...JSON.parse(userPrefs || '{}'),
            lastLogin: new Date().toISOString()
        }));
        
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}

// Update DOMContentLoaded in app.js:
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserPreferences(); // ADD THIS LINE
    initAutoSyncCheckbox();
    
    // Add event listener for auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', toggleAutoSync);
    }
    
    // Set up employee name memory for MAIN FORM
    setupEmployeeNameMemory();
});

// Add this function RIGHT AFTER loadUserPreferences() in app.js
function setupAutoSyncOnLogin() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log('No user logged in, skipping auto-sync setup');
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
        
        console.log('Setting up auto-sync for user:', username);
        
        // Load user preferences
        const userPrefs = localStorage.getItem(`prefs_${username}`);
        let autoSyncEnabled = false;
        
        if (userPrefs) {
            const prefs = JSON.parse(userPrefs);
            autoSyncEnabled = prefs.autoSync || false;
            console.log('User auto-sync preference:', autoSyncEnabled);
        } else {
            // Check global setting as fallback
            autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
            console.log('Using global auto-sync setting:', autoSyncEnabled);
        }
        
        // Auto-sync on login if preference is set
        if (autoSyncEnabled) {
            console.log('Auto-sync on login enabled for:', username);
            
            // Check if we have data to sync
            const userDataKey = `userData_${username}`;
            const userEmailKey = `userData_${user.email}`;
            const hasData = localStorage.getItem(userDataKey) || localStorage.getItem(userEmailKey);
            
            if (hasData) {
                console.log('User has data, will auto-sync in 5 seconds...');
                
                // Wait 5 seconds for app to fully load, then sync
                setTimeout(() => {
                    if (typeof syncToCloud === 'function') {
                        console.log('Starting auto-sync for user:', username);
                        syncToCloud();
                        
                        // Show notification
                        showNotification('Auto-syncing your data...', 'info');
                    } else {
                        console.log('syncToCloud function not available');
                    }
                }, 5000); // 5 second delay
            } else {
                console.log('No data to sync for user:', username);
            }
        } else {
            console.log('Auto-sync on login disabled for:', username);
        }
        
        // Update last login timestamp
        const updatedPrefs = userPrefs ? JSON.parse(userPrefs) : {};
        updatedPrefs.lastLogin = new Date().toISOString();
        updatedPrefs.lastAutoSyncCheck = new Date().toISOString();
        localStorage.setItem(`prefs_${username}`, JSON.stringify(updatedPrefs));
        
    } catch (error) {
        console.error('Error setting up auto-sync on login:', error);
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
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
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
                const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
                loadUserData(username);
            }
        });
    }
    
    updateFormDate();
}

// Auto-sync functions
// Update toggleAutoSync in app.js:
function toggleAutoSync() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const isEnabled = checkbox.checked;
        
        // Save globally
        localStorage.setItem('autoSyncEnabled', isEnabled.toString());
        
        // Save per-user
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            try {
                const user = JSON.parse(currentUser);
                const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
                
                const userPrefs = localStorage.getItem(`prefs_${username}`);
                const prefs = userPrefs ? JSON.parse(userPrefs) : {};
                
                prefs.autoSync = isEnabled;
                prefs.autoSyncUpdated = new Date().toISOString();
                
                localStorage.setItem(`prefs_${username}`, JSON.stringify(prefs));
                
                console.log('Saved auto-sync preference for user:', username, isEnabled);
            } catch (error) {
                console.error('Error saving user preference:', error);
            }
        }
        
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

// Save current month/year to localStorage
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

// Load user data for current month - UPDATED for Firebase compatibility
// Load user data for current month
function loadUserData(username) {
    console.log('Loading data for user:', username);
    
    // Try multiple possible data locations
    let userData = localStorage.getItem(`userData_${username}`);
    
    // If not found, try alternative naming
    if (!userData) {
        userData = localStorage.getItem(`forms_${username}`);
    }
    
    if (!userData) {
        userData = localStorage.getItem('broilerForms');
    }
    
    if (userData) {
        try {
            const allData = JSON.parse(userData);
            console.log('Found user data:', allData);
            loadCurrentMonthData(allData);
            return;
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    console.log('No saved data found, starting fresh');
    loadCurrentMonthData();
}

// Load data for current month
function loadCurrentMonthData(allData = null) {
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    console.log('Loading data for:', monthYear);
    
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (allData) {
        // Check if allData is an object with month keys or an array
        if (typeof allData === 'object' && !Array.isArray(allData)) {
            // Object format: { "9-2025": [...] }
            if (allData[monthYear]) {
                console.log(`Found ${allData[monthYear].length} entries for ${monthYear}`);
                allData[monthYear].forEach(entry => {
                    addRowToTable(entry);
                    currentFormData.push(entry);
                });
            } else {
                console.log(`No data found for ${monthYear}`);
            }
        } else if (Array.isArray(allData)) {
            // Array format: direct array of entries
            console.log(`Found ${allData.length} entries`);
            allData.forEach(entry => {
                addRowToTable(entry);
                currentFormData.push(entry);
            });
        }
    }
    
    calculateTotal();
}

// Save user data
function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.error('No user logged in');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // Get existing user data
    const existingData = localStorage.getItem(`userData_${user.username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Ensure allData is an object
    if (Array.isArray(allData)) {
        allData = {};
    }
    
    // Update data for current month
    allData[monthYear] = currentFormData;
    
    // Save back to localStorage
    localStorage.setItem(`userData_${user.username}`, JSON.stringify(allData));
    
    console.log(`Saved ${currentFormData.length} entries for ${monthYear}`);
    showNotification('Form data saved successfully!');
}

// Show notification - ENHANCED with types
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : 
                     type === 'warning' ? '#FF9800' : '#4CAF50'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Update the form date display
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

// Clear the form
function clearForm() {
    if (confirm('Are you sure you want to clear all entries for this month?')) {
        const tableBody = document.querySelector('#time-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            currentFormData = [];
            document.getElementById('total-hours').textContent = '0:00';
            saveUserData(); // Save empty data
        }
    }
}

// Open the modal for adding/editing entries
function openModal(rowIndex = null) {
    const modal = document.getElementById('entry-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalTitle) return;
    
    if (rowIndex !== null) {
        // Editing existing row
        modalTitle.textContent = 'Edit Time Entry';
        currentEditingRow = rowIndex;
        
        const rows = document.querySelectorAll('#time-table tbody tr');
        if (rows[rowIndex]) {
            const row = rows[rowIndex];
            
            // Extract current values
            const date = row.cells[0].textContent;
            const amPm = row.cells[1].textContent;
            const inTime = convertTo24Hour(row.cells[2].textContent);
            const outTime = convertTo24Hour(row.cells[3].textContent);
            
            // Set values in modal
            document.getElementById('entry-date').value = formatDateForInput(date);
            document.getElementById('entry-am-pm').value = amPm;
            document.getElementById('entry-time-in').value = inTime;
            document.getElementById('entry-time-out').value = outTime;
        }
    } else {
        // Adding new row
        modalTitle.textContent = 'Add New Time Entry';
        currentEditingRow = null;
        
        // Clear modal fields
        document.getElementById('entry-date').value = '';
        document.getElementById('entry-am-pm').value = 'AM';
        document.getElementById('entry-time-in').value = '';
        document.getElementById('entry-time-out').value = '';
    }
    
    modal.style.display = 'block';
}

// Close the modal
function closeModal() {
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'none';
        currentEditingRow = null;
    }
}

// Save entry from modal
function saveEntry() {
    const date = document.getElementById('entry-date').value;
    const amPm = document.getElementById('entry-am-pm').value;
    const inTime = document.getElementById('entry-time-in').value;
    const outTime = document.getElementById('entry-time-out').value;
    
    if (!date) {
        alert('Please select a date');
        return;
    }
    
    if (!inTime || !outTime) {
        alert('Please enter both IN and OUT times');
        return;
    }
    
    // Calculate hours
    const inDate = new Date(`2000-01-01T${inTime}`);
    const outDate = new Date(`2000-01-01T${outTime}`);
    
    // Handle PM times that might cross midnight
    if (outDate < inDate) {
        outDate.setDate(outDate.getDate() + 1);
    }
    
    const diffMs = outDate - inDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    const hours = `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
    
    // Use the date exactly as the user entered it
    const entryData = {
        date: date,
        amPm: amPm,
        inTime: inTime,
        outTime: outTime,
        hours: hours
    };
    
    if (currentEditingRow !== null) {
        // Update existing row
        updateRowInTable(currentEditingRow, entryData);
        currentFormData[currentEditingRow] = entryData;
    } else {
        // Add new row
        addRowToTable(entryData);
        currentFormData.push(entryData);
    }
    
    calculateTotal();
    saveUserData(); // Auto-save after changes
    closeModal();
}

// Add a row to the table
function addRowToTable(data) {
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) return;
    
    const newRow = document.createElement('tr');
    const rowIndex = tableBody.children.length;
    
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

// Update an existing row in the table
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

// Format date for display (DD/MM/YYYY format)
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    // Check if already in DD/MM/YYYY format
    if (dateString.includes('/')) {
        return dateString;
    }
    
    // Assume YYYY-MM-DD format
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    
    const displayDay = date.getDate().toString().padStart(2, '0');
    const displayMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const displayYear = date.getFullYear();
    
    return `${displayDay}/${displayMonth}/${displayYear}`;
}

// Format date for input (YYYY-MM-DD format)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    // Check if already in YYYY-MM-DD format
    if (dateString.includes('-') && dateString.split('-')[0].length === 4) {
        return dateString;
    }
    
    // Assume DD/MM/YYYY format
    const [day, month, year] = dateString.split('/');
    
    const date = new Date(year, month - 1, day);
    const inputYear = date.getFullYear();
    const inputMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const inputDay = date.getDate().toString().padStart(2, '0');
    
    return `${inputYear}-${inputMonth}-${inputDay}`;
}

// Format time for display (convert 24h to 12h format)
function formatTimeDisplay(time) {
    if (!time) return '';
    
    // Check if already formatted
    if (time.includes('AM') || time.includes('PM')) {
        return time;
    }
    
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

// Convert 12h time to 24h time
function convertTo24Hour(timeString) {
    if (!timeString) return '';
    
    // Check if already in 24h format
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

// Delete a row from the table
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
            saveUserData(); // Auto-save after changes
        }
    }
}

// Calculate total hours
function calculateTotal() {
    const rows = document.querySelectorAll('#time-table tbody tr');
    let totalMinutes = 0;
    
    rows.forEach(row => {
        const hoursText = row.cells[4].textContent;
        const [hours, minutes] = hoursText.split(':').map(Number);
        totalMinutes += hours * 60 + (minutes || 0);
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const totalHoursElement = document.getElementById('total-hours');
    if (totalHoursElement) {
        totalHoursElement.textContent = 
            `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
}

// Generate PDF
function generatePDF() {
    // Check if jsPDF is loaded
    if (typeof jsPDF === 'undefined' || typeof window.jspdf === 'undefined') {
        showNotification('PDF library not loaded. Please refresh the page.', 'error');
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Set document properties
        doc.setProperties({
            title: 'Broiler Production Project - Claim Form',
            subject: 'Employee Time Claim',
            author: 'Grantley Adams Memorial School'
        });
        
        // Add header with better visibility
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('Grantley Adams Memorial School', 105, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text('Broiler Production Project', 105, 28, { align: 'center' });
        doc.setFontSize(12);
        doc.text('Claim Form', 105, 36, { align: 'center' });
        
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        doc.text(`${monthNames[month]} ${year}`, 105, 44, { align: 'center' });
        
        // Add employee name
        doc.setFont(undefined, 'normal');
        doc.text(`Employee Name: ${document.getElementById('employee-name').value}`, 20, 60);
        
        // Create table data
        const tableData = [];
        
        currentFormData.forEach(entry => {
            const date = formatDateForDisplay(entry.date);
            const amPm = entry.amPm;
            const timeIn = formatTimeDisplay(entry.inTime);
            const timeOut = formatTimeDisplay(entry.outTime);
            const hours = entry.hours;
            
            tableData.push([date, amPm, timeIn, timeOut, hours]);
        });
        
        // Check if autoTable plugin is available
        if (typeof doc.autoTable === 'undefined') {
            showNotification('PDF table plugin not available', 'error');
            return;
        }
        
        // Add table using autoTable plugin - centered on page
        const tableOptions = {
            startY: 70,
            head: [['Date', 'Am/Pm', 'Time IN', 'Time OUT', 'Hours']],
            body: tableData,
            theme: 'grid',
            styles: { 
                fontSize: 10, 
                cellPadding: 4,
                textColor: [0, 0, 0]
            },
            headStyles: { 
                fillColor: [220, 220, 220],
                textColor: [0, 0, 0],
                fontStyle: 'bold'
            },
            margin: { left: 25, right: 25 },
            tableWidth: 'auto'
        };
        
        doc.autoTable(tableOptions);
        
        // Add total hours
        const finalY = doc.lastAutoTable.finalY + 10;
        const totalHours = document.getElementById('total-hours').textContent;
        doc.text(`Total Hours: ${totalHours}`, 160, finalY);
        
        // Add signature areas with proper spacing
        const signatureY = finalY + 25;
        
        // Signature Claimant
        doc.text('Signature Claimant:', 25, signatureY);
        doc.line(25, signatureY + 10, 65, signatureY + 10);
        
        // Signature HOD
        doc.text('Signature HOD:', 85, signatureY);
        doc.line(85, signatureY + 10, 125, signatureY + 10);
        
        // Signature Principal
        doc.text('Signature Principal:', 145, signatureY);
        doc.line(145, signatureY + 10, 185, signatureY + 10);
        
        // Save the PDF
        doc.save(`Broiler_Claim_Form_${monthNames[month]}_${year}.pdf`);
        
        showNotification('PDF generated successfully!');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        showNotification('Error generating PDF: ' + error.message, 'error');
    }
}

// Export Data - UPDATED for Firebase compatibility
function exportData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        
        // Determine the key to use (username or email)
        let userKey = user.username;
        if (!userKey && user.email) {
            userKey = user.email;
        } else if (!userKey) {
            userKey = 'user';
        }
        
        const userData = localStorage.getItem(`userData_${userKey}`);
        
        if (!userData) {
            alert('No data to export');
            return;
        }
        
        const exportData = {
            userData: JSON.parse(userData),
            exportDate: new Date().toISOString(),
            employeeName: user.employeeName || user.email || 'User',
            username: userKey // Include username for backward compatibility
        };
        
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `broiler_data_${userKey}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        showNotification('Data exported successfully!');
        
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Error exporting data: ' + error.message, 'error');
    }
}

// Import Data Function - UPDATED for Firebase compatibility
function importData() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importData = JSON.parse(event.target.result);
                
                // Validate the import file structure
                if (!importData.userData) {
                    throw new Error('Invalid backup file format');
                }
                
                // Check if the imported user matches current user
                const currentUser = localStorage.getItem('currentUser');
                let usernameToUse = importData.username;
                
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    
                    // If imported data has different username, ask for confirmation
                    if (importData.username && importData.username !== user.username) {
                        if (!confirm(`This backup is for user "${importData.username}". Import anyway?`)) {
                            return;
                        }
                        usernameToUse = importData.username;
                    } else {
                        // Use current user's identifier
                        usernameToUse = user.username || (user.email ? user.email.split('@')[0] : 'user');
                    }
                }
                
                // Apply the imported data
                localStorage.setItem(`userData_${usernameToUse}`, JSON.stringify(importData.userData));
                
                // Reload the current view
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
                    loadUserData(username);
                }
                
                showNotification('Data imported successfully!');
                
                // Auto-sync the imported data to cloud
                setTimeout(() => {
                    if (typeof syncToCloud === 'function') {
                        syncToCloud();
                    }
                }, 1000);
                
            } catch (error) {
                console.error('Import error:', error);
                showNotification('Error importing file: ' + error.message, 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    fileInput.click();
}

// Utility Functions
function saveForm() {
    saveUserData();
}

function logout() {
    // Sign out from Firebase if available
    if (typeof firebase !== 'undefined' && window.firebaseAuth) {
        firebaseAuth.signOut();
    }
    
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

// Save employee name when it's typed in the main form
function setupEmployeeNameMemory() {
    const employeeNameInput = document.getElementById('employee-name');
    
    if (employeeNameInput) {
        // Load saved employee name on page load
        const savedName = localStorage.getItem('mainAppEmployeeName');
        if (savedName) {
            employeeNameInput.value = savedName;
        }
        
        // Save employee name whenever it changes
        employeeNameInput.addEventListener('input', function() {
            localStorage.setItem('mainAppEmployeeName', this.value);
        });
        
        // Also save when user leaves the field
        employeeNameInput.addEventListener('blur', function() {
            localStorage.setItem('mainAppEmployeeName', this.value);
        });
    }
}

// Make all functions globally available
window.openModal = openModal;
window.closeModal = closeModal;
window.saveEntry = saveEntry;
window.deleteRow = deleteRow;
window.clearForm = clearForm;
window.saveForm = saveUserData;
window.generatePDF = generatePDF;
window.exportData = exportData;
window.importData = importData;
window.calculateTotal = calculateTotal;
window.logout = logout;
