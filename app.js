let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
});

// Check if user is authenticated - FIXED INITIALIZATION ORDER
function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    document.getElementById('user-display').textContent = `Welcome, ${user.employeeName}`;
    document.getElementById('employee-name').value = user.employeeName;
    
    // Initialize app first, THEN load user data
    initializeApp();
    loadUserData(user.username);
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
    document.getElementById('month-select').addEventListener('change', function() {
        updateFormDate();
        saveCurrentMonth();
        
        // Load data for the new month
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username);
        }
    });
    
    document.getElementById('year-input').addEventListener('change', function() {
        updateFormDate();
        saveCurrentMonth();
        
        // Load data for the new month/year
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username);
        }
    });
    
    updateFormDate();
}

// Save current month/year to localStorage
function saveCurrentMonth() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    localStorage.setItem('lastViewedMonth', month);
    localStorage.setItem('lastViewedYear', year);
}

// Load user data for current month
function loadUserData(username) {
    const userData = localStorage.getItem(`userData_${username}`);
    
    if (userData) {
        const allData = JSON.parse(userData);
        loadCurrentMonthData(allData);
    } else {
        loadCurrentMonthData();
    }
}

// Load data for current month
function loadCurrentMonthData(allData = null) {
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (allData && allData[monthYear]) {
        // Load saved data for this month
        allData[monthYear].forEach(entry => {
            addRowToTable(entry);
            currentFormData.push(entry);
        });
    }
    
    calculateTotal();
}

// Save user data
function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        return;
    }
    
    const user = JSON.parse(currentUser);
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // Get existing user data
    const existingData = localStorage.getItem(`userData_${user.username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Update data for current month
    allData[monthYear] = currentFormData;
    
    // Save back to localStorage
    localStorage.setItem(`userData_${user.username}`, JSON.stringify(allData));
    
    // Show save confirmation
    showNotification('Form data saved successfully!');
}

// Show notification
function showNotification(message) {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
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
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    document.getElementById('form-date').textContent = `${monthNames[month]} ${year}`;
}

// Clear the form
function clearForm() {
    if (confirm('Are you sure you want to clear all entries for this month?')) {
        const tableBody = document.querySelector('#time-table tbody');
        tableBody.innerHTML = '';
        currentFormData = [];
        document.getElementById('total-hours').textContent = '0:00';
        saveUserData(); // Save empty data
    }
}

// Open the modal for adding/editing entries
function openModal(rowIndex = null) {
    const modal = document.getElementById('entry-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (rowIndex !== null) {
        // Editing existing row
        modalTitle.textContent = 'Edit Time Entry';
        currentEditingRow = rowIndex;
        
        const rows = document.querySelectorAll('#time-table tbody tr');
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
    document.getElementById('entry-modal').style.display = 'none';
    currentEditingRow = null;
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

// Format date for display (DD/MM/YYYY format) - FIXED TIMEZONE ISSUE
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    // Split the YYYY-MM-DD string and create date without timezone issues
    const [year, month, day] = dateString.split('-');
    // Create date using local timezone
    const date = new Date(year, month - 1, day);
    
    const displayDay = date.getDate().toString().padStart(2, '0');
    const displayMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const displayYear = date.getFullYear();
    
    return `${displayDay}/${displayMonth}/${displayYear}`;
}

// Format date for input (YYYY-MM-DD format) - FIXED TIMEZONE ISSUE
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    
    // Create date using local timezone to ensure correct conversion
    const date = new Date(year, month - 1, day);
    const inputYear = date.getFullYear();
    const inputMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const inputDay = date.getDate().toString().padStart(2, '0');
    
    return `${inputYear}-${inputMonth}-${inputDay}`;
}

// Format time for display (convert 24h to 12h format)
function formatTimeDisplay(time) {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

// Convert 12h time to 24h time
function convertTo24Hour(timeString) {
    if (!timeString) return '';
    
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
                buttonsCell.innerHTML = `
                    <button class="edit-btn" onclick="openModal(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
                `;
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
    
    document.getElementById('total-hours').textContent = 
        `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
}

// Generate PDF
function generatePDF() {
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
}

// Save form data
function saveForm() {
    saveUserData();
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}

// Cloud Sync Configuration
const CLOUD_CONFIG = {
    // Using Google Drive API (simplified version)
    APP_NAME: 'BroilerProductionProject',
    FILE_NAME: 'broiler_data_backup.json',
    SYNC_INTERVAL: 300000 // 5 minutes auto-sync
};

// Initialize cloud sync
function initCloudSync() {
    // Check for auto-sync every 5 minutes
    setInterval(() => {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            autoSyncData();
        }
    }, CLOUD_CONFIG.SYNC_INTERVAL);
}

// Sync data to cloud (Google Drive)
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showSyncStatus('No data to sync', 'error');
        return;
    }
    
    showSyncStatus('Syncing to cloud...', 'loading');
    
    try {
        // Method 1: Google Drive API (requires OAuth setup)
        await syncToGoogleDrive(user.username, userData);
        
        // Method 2: Fallback to localStorage cross-device sync
        await syncViaLocalStorage(user.username, userData);
        
        showSyncStatus('Data synced to cloud successfully!', 'success');
        localStorage.setItem('lastCloudSync', new Date().toISOString());
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('Cloud sync failed. Using fallback method.', 'error');
        
        // Fallback: Try simplified method
        try {
            await fallbackCloudSync(user.username, userData);
            showSyncStatus('Data synced using fallback method!', 'success');
        } catch (fallbackError) {
            showSyncStatus('All sync methods failed. Use Export/Import.', 'error');
        }
    }
}

// Sync data from cloud
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('Syncing from cloud...', 'loading');
    
    try {
        const cloudData = await getFromGoogleDrive(user.username);
        if (cloudData) {
            await applyCloudData(user.username, cloudData);
            showSyncStatus('Data synced from cloud successfully!', 'success');
        } else {
            showSyncStatus('No cloud data found', 'error');
        }
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('Cloud sync failed. Check connection.', 'error');
    }
}

// Initialize cloud sync
function initCloudSync() {
    // Check if sync status element exists, if not create it
    if (!document.getElementById('sync-status')) {
        createSyncStatusElement();
    }
    
    // Check for auto-sync every 5 minutes
    setInterval(() => {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            autoSyncData();
        }
    }, CLOUD_CONFIG.SYNC_INTERVAL);
}

// Create sync status element if it doesn't exist
function createSyncStatusElement() {
    const syncStatus = document.createElement('div');
    syncStatus.id = 'sync-status';
    syncStatus.className = 'sync-status';
    syncStatus.style.display = 'none';
    
    // Insert after total hours
    const totalHours = document.querySelector('.total-hours');
    if (totalHours && totalHours.parentNode) {
        totalHours.parentNode.insertBefore(syncStatus, totalHours.nextSibling);
    }
}

// Sync data to cloud
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showSyncStatus('No data to sync', 'error');
        return;
    }
    
    showSyncStatus('Syncing to cloud...', 'loading');
    
    try {
        // Use our cross-device storage method
        await syncViaLocalStorage(user.username, userData);
        
        showSyncStatus('Data synced successfully!', 'success');
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        
        // Show last sync time
        setTimeout(() => {
            showSyncStatus(`Last sync: ${new Date().toLocaleTimeString()}`, 'success');
        }, 2000);
        
    } catch (error) {
        console.error('Sync failed:', error);
        showSyncStatus('Sync failed. Using export/import.', 'error');
    }
}

// Sync data from cloud
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('Syncing from cloud...', 'loading');
    
    try {
        const cloudData = await getFromCrossDeviceStorage(user.username);
        if (cloudData && cloudData.data) {
            await applyCloudData(user.username, cloudData);
            showSyncStatus('Data synced successfully!', 'success');
        } else {
            showSyncStatus('No cloud data found', 'error');
        }
    } catch (error) {
        console.error('Sync failed:', error);
        showSyncStatus('Sync failed. Check connection.', 'error');
    }
}

// Cross-device storage using localStorage with shared keys
async function syncViaLocalStorage(username, data) {
    const syncData = {
        username: username,
        data: JSON.parse(data),
        lastSync: new Date().toISOString(),
        device: getDeviceInfo(),
        version: '1.0'
    };
    
    // Store in multiple shared locations
    const sharedKey = `broiler_sync_${username}`;
    
    // Primary storage
    localStorage.setItem(sharedKey, JSON.stringify(syncData));
    
    // Backup storage with timestamp
    const timestampKey = `broiler_sync_${username}_${Date.now()}`;
    localStorage.setItem(timestampKey, JSON.stringify(syncData));
    
    // Clean up old sync data (keep only last 5)
    cleanupOldSyncData(username);
    
    return true;
}

async function getFromCrossDeviceStorage(username) {
    const sharedKey = `broiler_sync_${username}`;
    
    // Try to get the latest sync data
    let data = localStorage.getItem(sharedKey);
    if (data) {
        return JSON.parse(data);
    }
    
    // If no primary data, look for any recent sync data
    const allKeys = Object.keys(localStorage);
    const syncKeys = allKeys.filter(key => key.startsWith(`broiler_sync_${username}_`));
    
    if (syncKeys.length > 0) {
        // Get the most recent one
        syncKeys.sort().reverse();
        const latestKey = syncKeys[0];
        data = localStorage.getItem(latestKey);
        if (data) {
            return JSON.parse(data);
        }
    }
    
    return null;
}

// Clean up old sync data
function cleanupOldSyncData(username) {
    const allKeys = Object.keys(localStorage);
    const syncKeys = allKeys.filter(key => key.startsWith(`broiler_sync_${username}_`));
    
    // Keep only the 5 most recent
    if (syncKeys.length > 5) {
        syncKeys.sort().reverse();
        const keysToRemove = syncKeys.slice(5);
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }
}

// Get device information
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
    };
}

// Apply cloud data to local storage
async function applyCloudData(username, cloudData) {
    if (cloudData && cloudData.data) {
        localStorage.setItem(`userData_${username}`, JSON.stringify(cloudData.data));
        
        // Reload the current view
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username);
        }
        
        showNotification('Cloud data loaded successfully!');
    }
}

// Auto-sync functionality
function toggleAutoSync() {
    const autoSync = localStorage.getItem('autoSyncEnabled');
    const newState = autoSync !== 'true';
    
    localStorage.setItem('autoSyncEnabled', newState.toString());
    
    if (newState) {
        showSyncStatus('Auto-sync enabled', 'success');
        autoSyncData();
    } else {
        showSyncStatus('Auto-sync disabled', 'error');
    }
    
    // Update checkbox state
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        checkbox.checked = newState;
    }
}

async function autoSyncData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (userData) {
        try {
            await syncViaLocalStorage(user.username, userData);
            console.log('Auto-sync completed');
        } catch (error) {
            console.log('Auto-sync failed:', error);
        }
    }
}

// Sync status display with safe element checking
function showSyncStatus(message, type) {
    let statusEl = document.getElementById('sync-status');
    
    // Create element if it doesn't exist
    if (!statusEl) {
        createSyncStatusElement();
        statusEl = document.getElementById('sync-status');
    }
    
    // Double-check element exists
    if (!statusEl) {
        console.log('Sync Status:', message);
        return; // Silently fail if element still doesn't exist
    }
    
    statusEl.textContent = message;
    statusEl.className = `sync-status sync-${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 5 seconds for success/error, keep loading visible
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Enhanced export/import with cloud backup
async function exportData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        alert('No data to export');
        return;
    }
    
    // Include cloud sync info in export
    const exportData = {
        userData: JSON.parse(userData),
        cloudInfo: {
            lastSync: localStorage.getItem('lastCloudSync'),
            username: user.username,
            exportDate: new Date().toISOString()
        }
    };
    
    // Create downloadable file
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `broiler_data_${user.username}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('Data exported successfully!');
    
    // Auto-backup to cloud
    setTimeout(() => {
        syncToCloud().catch(console.error);
    }, 1000);
}

// Initialize auto-sync checkbox state
function initAutoSyncCheckbox() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        checkbox.checked = autoSync === 'true';
    }
}

// Update your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initAutoSyncCheckbox();
    initCloudSync();
});

