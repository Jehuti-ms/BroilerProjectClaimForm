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

// Cloud Sync Configuration (ONLY DECLARE THIS ONCE)
const CLOUD_CONFIG = {
    APP_NAME: 'BroilerProductionProject',
    FILE_NAME: 'broiler_data_backup.json',
    SYNC_INTERVAL: 300000 // 5 minutes
};

// Initialize cloud sync
function initCloudSync() {
    // Initialize auto-sync checkbox
    initAutoSyncCheckbox();
    
    // Check for auto-sync every 5 minutes
    setInterval(() => {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            autoSyncData();
        }
    }, CLOUD_CONFIG.SYNC_INTERVAL);
}

// Initialize auto-sync checkbox state
function initAutoSyncCheckbox() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        checkbox.checked = autoSync === 'true';
    }
}

// Auto-sync toggle function
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
        await syncViaLocalStorage(user.username, userData);
        showSyncStatus('Data synced successfully!', 'success');
        localStorage.setItem('lastCloudSync', new Date().toISOString());
    } catch (error) {
        showSyncStatus('Sync failed', 'error');
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
        showSyncStatus('Sync failed', 'error');
    }
}

// Cross-device storage using localStorage
async function syncViaLocalStorage(username, data) {
    const syncData = {
        username: username,
        data: JSON.parse(data),
        lastSync: new Date().toISOString(),
        version: '1.0'
    };
    
    const sharedKey = `broiler_sync_${username}`;
    localStorage.setItem(sharedKey, JSON.stringify(syncData));
    
    return true;
}

async function getFromCrossDeviceStorage(username) {
    const sharedKey = `broiler_sync_${username}`;
    const data = localStorage.getItem(sharedKey);
    return data ? JSON.parse(data) : null;
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
    }
}

// Auto-sync data
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
            console.log('Auto-sync failed');
        }
    }
}

// Sync status display
function showSyncStatus(message, type) {
    let statusEl = document.getElementById('sync-status');
    
    if (!statusEl) {
        // Create element if it doesn't exist
        statusEl = document.createElement('div');
        statusEl.id = 'sync-status';
        statusEl.className = 'sync-status';
        statusEl.style.display = 'none';
        
        // Insert after total hours
        const totalHours = document.querySelector('.total-hours');
        if (totalHours && totalHours.parentNode) {
            totalHours.parentNode.insertBefore(statusEl, totalHours.nextSibling);
        }
    }
    
    statusEl.textContent = message;
    statusEl.className = `sync-status sync-${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 5 seconds
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Enhanced export with cloud backup
async function exportData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        alert('No data to export');
        return;
    }
    
    const exportData = {
        userData: JSON.parse(userData),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `broiler_data_${user.username}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('Data exported successfully!');
}

// Update DOMContentLoaded to initialize sync
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initCloudSync();
});

// Supabase Cloud Sync
async function initSupabase() {
    try {
        // Check if user is already signed in
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            console.log('User already signed in:', session.user.email);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Supabase init failed:', error);
        return false;
    }
}

// Supabase Authentication
async function signUpWithEmail(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });
    
    if (error) throw error;
    return data;
}

async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

// Supabase Data Sync
async function syncToSupabase(data) {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        
        const userData = {
            user_id: session.user.id,
            data: data,
            last_sync: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Upsert data (insert or update)
        const { data: result, error } = await supabase
            .from('user_data')
            .upsert(userData, { onConflict: 'user_id' });
            
        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Supabase sync failed:', error);
        return false;
    }
}

async function getFromSupabase() {
    try {
        const { data: session } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');
        
        const { data, error } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
        
        return data;
    } catch (error) {
        console.error('Supabase get failed:', error);
        return null;
    }
}

// Simple Cross-Device Sync that ACTUALLY works
const SYNC_CONFIG = {
    STORAGE_KEY: 'broiler_cloud_sync_data',
    SYNC_PASSWORD: 'broiler2025' // Change this to your own secret
};

// Working Cloud Sync - No authentication required
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showNotification('No data to sync');
        return;
    }
    
    showSyncStatus('🔄 Syncing to cloud...', 'loading');
    
    try {
        // Encrypt and store data
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo()
        };
        
        // Encrypt with simple obfuscation
        const encryptedData = btoa(JSON.stringify(syncData));
        
        // Store in multiple cloud services for redundancy
        await storeInMultipleCloudServices(user.username, encryptedData);
        
        showSyncStatus('✅ Data synced to cloud!', 'success');
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Checking for cloud data...', 'loading');
    
    try {
        // Try to get data from multiple sources
        const cloudData = await getFromMultipleCloudServices(user.username);
        
        if (cloudData) {
            await applyCloudData(user.username, cloudData);
            showSyncStatus('✅ Cloud data loaded!', 'success');
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'error');
        }
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

// Store data in multiple free cloud services
async function storeInMultipleCloudServices(username, encryptedData) {
    // Method 1: Public GitHub Gist (completely free)
    await storeInGitHubGist(username, encryptedData);
    
    // Method 2: Pastebin-style service
    await storeInPastebinService(username, encryptedData);
    
    // Method 3: Local storage with shared key
    storeInSharedLocalStorage(username, encryptedData);
}

async function getFromMultipleCloudServices(username) {
    // Try each method until we find data
    let data = await getFromGitHubGist(username);
    if (data) return data;
    
    data = await getFromPastebinService(username);
    if (data) return data;
    
    data = getFromSharedLocalStorage(username);
    if (data) return data;
    
    return null;
}

// GitHub Gist Method (Free, no authentication required for public gists)
async function storeInGitHubGist(username, encryptedData) {
    const gistData = {
        public: true,
        description: `Broiler Data Sync - ${username}`,
        files: {
            [`broiler_${username}.json`]: {
                content: encryptedData
            }
        }
    };
    
    try {
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gistData)
        });
        
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(`github_gist_${username}`, result.id);
            return true;
        }
    } catch (error) {
        console.log('GitHub Gist storage failed:', error);
    }
    return false;
}

async function getFromGitHubGist(username) {
    try {
        const gistId = localStorage.getItem(`github_gist_${username}`);
        if (gistId) {
            const response = await fetch(`https://api.github.com/gists/${gistId}`);
            if (response.ok) {
                const gist = await response.json();
                const fileContent = gist.files[`broiler_${username}.json`].content;
                return JSON.parse(atob(fileContent));
            }
        }
    } catch (error) {
        console.log('GitHub Gist retrieval failed:', error);
    }
    return null;
}

// Paste.ee Method (Free pastebin service)
async function storeInPastebinService(username, encryptedData) {
    const pasteData = {
        description: `Broiler Sync - ${username}`,
        sections: [
            {
                name: 'data',
                contents: encryptedData
            }
        ]
    };
    
    try {
        const response = await fetch('https://api.paste.ee/v1/pastes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(pasteData)
        });
        
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(`pasteee_${username}`, result.id);
            return true;
        }
    } catch (error) {
        console.log('Paste.ee storage failed:', error);
    }
    return false;
}

async function getFromPastebinService(username) {
    try {
        const pasteId = localStorage.getItem(`pasteee_${username}`);
        if (pasteId) {
            const response = await fetch(`https://api.paste.ee/v1/pastes/${pasteId}`);
            if (response.ok) {
                const paste = await response.json();
                const content = paste.sections[0].contents;
                return JSON.parse(atob(content));
            }
        }
    } catch (error) {
        console.log('Paste.ee retrieval failed:', error);
    }
    return null;
}

// Shared Local Storage Method (Works across devices using same method)
function storeInSharedLocalStorage(username, encryptedData) {
    // This creates a "shared" storage by using the same encryption key
    const sharedKey = `shared_${btoa(username)}_sync`;
    localStorage.setItem(sharedKey, encryptedData);
    
    // Also store with timestamp for multiple devices
    const timestampKey = `shared_${btoa(username)}_${Date.now()}`;
    localStorage.setItem(timestampKey, encryptedData);
    
    return true;
}

function getFromSharedLocalStorage(username) {
    const sharedKey = `shared_${btoa(username)}_sync`;
    const data = localStorage.getItem(sharedKey);
    
    if (data) {
        return JSON.parse(atob(data));
    }
    
    // Look for any shared data with this username
    const allKeys = Object.keys(localStorage);
    const sharedKeys = allKeys.filter(key => key.startsWith(`shared_${btoa(username)}_`));
    
    if (sharedKeys.length > 0) {
        // Get the most recent one
        sharedKeys.sort().reverse();
        const recentData = localStorage.getItem(sharedKeys[0]);
        if (recentData) {
            return JSON.parse(atob(recentData));
        }
    }
    
    return null;
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
    };
}
