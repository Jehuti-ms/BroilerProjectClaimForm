// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Configuration
const CONFIG = {
    SYNC: {
        STORAGE_KEY: 'broiler_cloud_sync_data',
        SYNC_INTERVAL: 300000 // 5 minutes
    }
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initCloudSync();
});

// Authentication
function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'auth.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    document.getElementById('user-display').textContent = `Welcome, ${user.employeeName}`;
    document.getElementById('employee-name').value = user.employeeName;
    
    initializeApp();
    loadUserData(user.username);
}

// App Initialization
function initializeApp() {
    loadLastViewedMonth();
    setupEventListeners();
    updateFormDate();
}

function loadLastViewedMonth() {
    const lastMonth = localStorage.getItem('lastViewedMonth');
    const lastYear = localStorage.getItem('lastViewedYear');
    
    if (lastMonth !== null && lastYear !== null) {
        document.getElementById('month-select').value = lastMonth;
        document.getElementById('year-input').value = lastYear;
    }
}

function setupEventListeners() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    [monthSelect, yearInput].forEach(element => {
        element.addEventListener('change', () => {
            updateFormDate();
            saveCurrentMonth();
            reloadUserData();
        });
    });
}

function reloadUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        loadUserData(user.username);
    }
}

function saveCurrentMonth() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    localStorage.setItem('lastViewedMonth', month);
    localStorage.setItem('lastViewedYear', year);
}

// Data Management
function loadUserData(username) {
    const userData = localStorage.getItem(`userData_${username}`);
    loadCurrentMonthData(userData ? JSON.parse(userData) : null);
}

function loadCurrentMonthData(allData = null) {
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (allData && allData[monthYear]) {
        allData[monthYear].forEach(entry => {
            addRowToTable(entry);
            currentFormData.push(entry);
        });
    }
    
    calculateTotal();
}

function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    const existingData = localStorage.getItem(`userData_${user.username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    allData[monthYear] = currentFormData;
    localStorage.setItem(`userData_${user.username}`, JSON.stringify(allData));
    
    showNotification('Form data saved successfully!');
}

// Notification System
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : '#4CAF50'};
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

// Date and Time Utilities
function updateFormDate() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    document.getElementById('form-date').textContent = `${monthNames[month]} ${year}`;
}

function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    
    const displayDay = date.getDate().toString().padStart(2, '0');
    const displayMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const displayYear = date.getFullYear();
    
    return `${displayDay}/${displayMonth}/${displayYear}`;
}

function formatDateForInput(dateString) {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    
    const date = new Date(year, month - 1, day);
    const inputYear = date.getFullYear();
    const inputMonth = (date.getMonth() + 1).toString().padStart(2, '0');
    const inputDay = date.getDate().toString().padStart(2, '0');
    
    return `${inputYear}-${inputMonth}-${inputDay}`;
}

function formatTimeDisplay(time) {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

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

// Table Operations
function clearForm() {
    if (confirm('Are you sure you want to clear all entries for this month?')) {
        const tableBody = document.querySelector('#time-table tbody');
        tableBody.innerHTML = '';
        currentFormData = [];
        document.getElementById('total-hours').textContent = '0:00';
        saveUserData();
    }
}

function openModal(rowIndex = null) {
    const modal = document.getElementById('entry-modal');
    const modalTitle = document.getElementById('modal-title');
    
    if (rowIndex !== null) {
        modalTitle.textContent = 'Edit Time Entry';
        currentEditingRow = rowIndex;
        populateModalWithRowData(rowIndex);
    } else {
        modalTitle.textContent = 'Add New Time Entry';
        currentEditingRow = null;
        clearModalFields();
    }
    
    modal.style.display = 'block';
}

function populateModalWithRowData(rowIndex) {
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
}

function clearModalFields() {
    document.getElementById('entry-date').value = '';
    document.getElementById('entry-am-pm').value = 'AM';
    document.getElementById('entry-time-in').value = '';
    document.getElementById('entry-time-out').value = '';
}

function closeModal() {
    document.getElementById('entry-modal').style.display = 'none';
    currentEditingRow = null;
}

function saveEntry() {
    const formData = getModalFormData();
    
    if (!validateFormData(formData)) {
        return;
    }
    
    const entryData = createEntryData(formData);
    
    if (currentEditingRow !== null) {
        updateRowInTable(currentEditingRow, entryData);
        currentFormData[currentEditingRow] = entryData;
    } else {
        addRowToTable(entryData);
        currentFormData.push(entryData);
    }
    
    calculateTotal();
    saveUserData();
    closeModal();
}

function getModalFormData() {
    return {
        date: document.getElementById('entry-date').value,
        amPm: document.getElementById('entry-am-pm').value,
        inTime: document.getElementById('entry-time-in').value,
        outTime: document.getElementById('entry-time-out').value
    };
}

function validateFormData(formData) {
    if (!formData.date) {
        alert('Please select a date');
        return false;
    }
    
    if (!formData.inTime || !formData.outTime) {
        alert('Please enter both IN and OUT times');
        return false;
    }
    
    return true;
}

function createEntryData(formData) {
    const hours = calculateHours(formData.inTime, formData.outTime);
    
    return {
        date: formData.date,
        amPm: formData.amPm,
        inTime: formData.inTime,
        outTime: formData.outTime,
        hours: hours
    };
}

function calculateHours(inTime, outTime) {
    const inDate = new Date(`2000-01-01T${inTime}`);
    const outDate = new Date(`2000-01-01T${outTime}`);
    
    if (outDate < inDate) {
        outDate.setDate(outDate.getDate() + 1);
    }
    
    const diffMs = outDate - inDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}:${diffMinutes.toString().padStart(2, '0')}`;
}

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
            updateRowIndices();
            calculateTotal();
            saveUserData();
        }
    }
}

function updateRowIndices() {
    const rows = document.querySelectorAll('#time-table tbody tr');
    rows.forEach((row, index) => {
        const buttonsCell = row.cells[5];
        buttonsCell.innerHTML = `
            <button class="edit-btn" onclick="openModal(${index})">Edit</button>
            <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
        `;
    });
}

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

// PDF Generation
function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
        title: 'Broiler Production Project - Claim Form',
        subject: 'Employee Time Claim',
        author: 'Grantley Adams Memorial School'
    });
    
    // Add header
    addPDFHeader(doc);
    
    // Add employee name
    doc.setFont(undefined, 'normal');
    doc.text(`Employee Name: ${document.getElementById('employee-name').value}`, 20, 60);
    
    // Create table data
    const tableData = currentFormData.map(entry => [
        formatDateForDisplay(entry.date),
        entry.amPm,
        formatTimeDisplay(entry.inTime),
        formatTimeDisplay(entry.outTime),
        entry.hours
    ]);
    
    // Add table
    addPDFTable(doc, tableData);
    
    // Add total hours and signatures
    addPDFFooter(doc);
    
    // Save the PDF
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    doc.save(`Broiler_Claim_Form_${monthNames[month]}_${year}.pdf`);
}

function addPDFHeader(doc) {
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
}

function addPDFTable(doc, tableData) {
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
}

function addPDFFooter(doc) {
    const finalY = doc.lastAutoTable.finalY + 10;
    const totalHours = document.getElementById('total-hours').textContent;
    doc.text(`Total Hours: ${totalHours}`, 160, finalY);
    
    const signatureY = finalY + 25;
    
    // Signature areas
    doc.text('Signature Claimant:', 25, signatureY);
    doc.line(25, signatureY + 10, 65, signatureY + 10);
    
    doc.text('Signature HOD:', 85, signatureY);
    doc.line(85, signatureY + 10, 125, signatureY + 10);
    
    doc.text('Signature Principal:', 145, signatureY);
    doc.line(145, signatureY + 10, 185, signatureY + 10);
}

// Replace the entire cloud sync section with this simplified version:

// Enhanced Cloud Sync with better mobile support
const CLOUD_SYNC = {
    STORAGE_KEY: 'broiler_cloud_data',
    MAX_RETRIES: 3,
    TIMEOUT: 10000
};

// Initialize cloud sync
function initCloudSync() {
    initAutoSyncCheckbox();
    
    // Check for auto-sync every 2 minutes (reduced for mobile)
    setInterval(() => {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            autoSyncData();
        }
    }, 120000);
    
    // Try to sync immediately on load if auto-sync is enabled
    const autoSync = localStorage.getItem('autoSyncEnabled');
    if (autoSync === 'true') {
        setTimeout(() => {
            autoSyncData();
        }, 2000);
    }
}

// Simple cloud sync that works on mobile
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return false;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showNotification('No data to sync', 'error');
        return false;
    }
    
    showSyncStatus('🔄 Syncing to cloud...', 'loading');
    
    try {
        // Create sync data
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo(),
            version: '2.0'
        };
        
        // Try multiple sync methods with timeout
        const success = await Promise.race([
            syncWithMultipleMethods(user.username, syncData),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Sync timeout')), CLOUD_SYNC.TIMEOUT)
            )
        ]);
        
        if (success) {
            showSyncStatus('✅ Data synced to cloud!', 'success');
            localStorage.setItem('lastCloudSync', new Date().toISOString());
            localStorage.setItem(`lastSync_${user.username}`, new Date().toISOString());
            return true;
        } else {
            throw new Error('All sync methods failed');
        }
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed - check connection', 'error');
        return false;
    }
}

// Sync from cloud with better mobile support
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return false;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Checking for cloud data...', 'loading');
    
    try {
        // Try multiple methods to get cloud data
        const cloudData = await Promise.race([
            getFromMultipleSources(user.username),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Sync timeout')), CLOUD_SYNC.TIMEOUT)
            )
        ]);
        
        if (cloudData) {
            // Check if cloud data is newer than local data
            const lastLocalSync = localStorage.getItem(`lastSync_${user.username}`);
            const cloudTimestamp = new Date(cloudData.timestamp);
            const localTimestamp = lastLocalSync ? new Date(lastLocalSync) : new Date(0);
            
            if (cloudTimestamp > localTimestamp) {
                await applyCloudData(user.username, cloudData);
                showSyncStatus('✅ Cloud data loaded!', 'success');
                return true;
            } else {
                showSyncStatus('ℹ️ Local data is up to date', 'info');
                return false;
            }
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
            return false;
        }
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed - check connection', 'error');
        return false;
    }
}

// Enhanced sync with multiple fallback methods
async function syncWithMultipleMethods(username, syncData) {
    const methods = [
        { name: 'localStorage', method: () => syncToLocalStorage(username, syncData) },
        { name: 'github', method: () => syncToGitHubGist(username, syncData) },
        { name: 'jsonbin', method: () => syncToJsonBin(username, syncData) }
    ];
    
    // Try each method until one works
    for (const method of methods) {
        try {
            console.log(`Trying sync method: ${method.name}`);
            const success = await method.method();
            if (success) {
                console.log(`Sync successful with ${method.name}`);
                return true;
            }
        } catch (error) {
            console.log(`Sync failed with ${method.name}:`, error);
            continue;
        }
    }
    
    return false;
}

// Get data from multiple sources
async function getFromMultipleSources(username) {
    const methods = [
        { name: 'localStorage', method: () => getFromLocalStorage(username) },
        { name: 'github', method: () => getFromGitHubGist(username) },
        { name: 'jsonbin', method: () => getFromJsonBin(username) }
    ];
    
    // Try each method until one returns data
    for (const method of methods) {
        try {
            console.log(`Trying get method: ${method.name}`);
            const data = await method.method();
            if (data) {
                console.log(`Data found with ${method.name}`);
                return data;
            }
        } catch (error) {
            console.log(`Get failed with ${method.name}:`, error);
            continue;
        }
    }
    
    return null;
}

// Method 1: Enhanced Local Storage (works offline)
function syncToLocalStorage(username, syncData) {
    try {
        const key = `cloud_${username}`;
        localStorage.setItem(key, JSON.stringify(syncData));
        
        // Also store in multiple keys for redundancy
        const timestampKey = `cloud_${username}_${Date.now()}`;
        localStorage.setItem(timestampKey, JSON.stringify(syncData));
        
        // Clean up old entries (keep last 5)
        cleanupOldSyncEntries(username);
        
        return true;
    } catch (error) {
        console.error('LocalStorage sync failed:', error);
        return false;
    }
}

function getFromLocalStorage(username) {
    try {
        const primaryKey = `cloud_${username}`;
        let data = localStorage.getItem(primaryKey);
        
        if (data) {
            return JSON.parse(data);
        }
        
        // Fallback: look for any cloud data for this user
        const allKeys = Object.keys(localStorage);
        const cloudKeys = allKeys.filter(key => key.startsWith(`cloud_${username}`));
        
        if (cloudKeys.length > 0) {
            // Get the most recent one
            cloudKeys.sort((a, b) => {
                const timeA = parseInt(a.split('_').pop()) || 0;
                const timeB = parseInt(b.split('_').pop()) || 0;
                return timeB - timeA;
            });
            
            const recentData = localStorage.getItem(cloudKeys[0]);
            if (recentData) {
                return JSON.parse(recentData);
            }
        }
        
        return null;
    } catch (error) {
        console.error('LocalStorage get failed:', error);
        return null;
    }
}

function cleanupOldSyncEntries(username) {
    try {
        const allKeys = Object.keys(localStorage);
        const cloudKeys = allKeys.filter(key => key.startsWith(`cloud_${username}_`));
        
        // Sort by timestamp (newest first)
        cloudKeys.sort((a, b) => {
            const timeA = parseInt(a.split('_').pop()) || 0;
            const timeB = parseInt(b.split('_').pop()) || 0;
            return timeB - timeA;
        });
        
        // Remove all but the 5 most recent entries
        if (cloudKeys.length > 5) {
            for (let i = 5; i < cloudKeys.length; i++) {
                localStorage.removeItem(cloudKeys[i]);
            }
        }
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Method 2: GitHub Gists with better error handling
async function syncToGitHubGist(username, syncData) {
    try {
        const gistData = {
            public: false, // Make private for security
            description: `Broiler Data Sync - ${username}`,
            files: {
                [`broiler_${username}.json`]: {
                    content: JSON.stringify(syncData, null, 2)
                }
            }
        };
        
        // Check if we have an existing gist
        const existingGistId = localStorage.getItem(`github_gist_${username}`);
        
        const url = existingGistId 
            ? `https://api.github.com/gists/${existingGistId}`
            : 'https://api.github.com/gists';
            
        const method = existingGistId ? 'PATCH' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(gistData)
        });
        
        if (response.ok) {
            const result = await response.json();
            localStorage.setItem(`github_gist_${username}`, result.id);
            return true;
        } else {
            throw new Error(`GitHub API error: ${response.status}`);
        }
    } catch (error) {
        console.log('GitHub Gist sync failed:', error);
        return false;
    }
}

async function getFromGitHubGist(username) {
    try {
        const gistId = localStorage.getItem(`github_gist_${username}`);
        if (!gistId) return null;
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.ok) {
            const gist = await response.json();
            const fileContent = gist.files[`broiler_${username}.json`].content;
            return JSON.parse(fileContent);
        } else {
            throw new Error(`GitHub API error: ${response.status}`);
        }
    } catch (error) {
        console.log('GitHub Gist retrieval failed:', error);
        return null;
    }
}

// Method 3: JSONBin.io (free JSON storage)
async function syncToJsonBin(username, syncData) {
    try {
        const binId = localStorage.getItem(`jsonbin_${username}`);
        const url = binId 
            ? `https://api.jsonbin.io/v3/b/${binId}`
            : 'https://api.jsonbin.io/v3/b';
            
        const method = binId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': '$2a$10$YourMasterKeyHere', // Replace with actual key
                'X-Bin-Name': `BroilerData_${username}`
            },
            body: JSON.stringify(syncData)
        });
        
        if (response.ok) {
            const result = await response.json();
            if (!binId) {
                localStorage.setItem(`jsonbin_${username}`, result.metadata.id);
            }
            return true;
        } else {
            throw new Error(`JSONBin API error: ${response.status}`);
        }
    } catch (error) {
        console.log('JSONBin sync failed:', error);
        return false;
    }
}

async function getFromJsonBin(username) {
    try {
        const binId = localStorage.getItem(`jsonbin_${username}`);
        if (!binId) return null;
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
            headers: {
                'X-Master-Key': '$2a$10$YourMasterKeyHere' // Replace with actual key
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            return result.record;
        } else {
            throw new Error(`JSONBin API error: ${response.status}`);
        }
    } catch (error) {
        console.log('JSONBin retrieval failed:', error);
        return null;
    }
}

// Enhanced auto-sync with network detection
async function autoSyncData() {
    // Check if online
    if (!navigator.onLine) {
        console.log('Auto-sync skipped: offline');
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) return;
    
    try {
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo(),
            version: '2.0'
        };
        
        // Use only the most reliable method for auto-sync
        const success = await syncToLocalStorage(user.username, syncData);
        
        if (success) {
            console.log('Auto-sync completed');
            // Update sync timestamp
            localStorage.setItem(`lastSync_${user.username}`, new Date().toISOString());
        }
    } catch (error) {
        console.log('Auto-sync failed:', error);
    }
}

// Network status detection
function setupNetworkDetection() {
    window.addEventListener('online', () => {
        showNotification('Connection restored', 'success');
        // Auto-sync when coming back online
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            setTimeout(() => autoSyncData(), 1000);
        }
    });
    
    window.addEventListener('offline', () => {
        showNotification('You are offline', 'error');
    });
}

// Update device info for better tracking
function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent.substring(0, 100), // Limit length
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString(),
        screen: `${screen.width}x${screen.height}`,
        touch: 'ontouchstart' in window
    };
}

// Enhanced sync status with better mobile styling
function showSyncStatus(message, type) {
    let statusEl = document.getElementById('sync-status');
    
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'sync-status';
        statusEl.className = 'sync-status';
        statusEl.style.cssText = `
            position: fixed;
            top: 70px;
            right: 10px;
            left: 10px;
            background: ${getStatusColor(type)};
            color: white;
            padding: 12px 15px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            text-align: center;
            font-size: 14px;
            font-weight: 500;
            display: none;
        `;
        
        document.body.appendChild(statusEl);
    }
    
    statusEl.textContent = message;
    statusEl.style.background = getStatusColor(type);
    statusEl.style.display = 'block';
    
    // Auto-hide after 4 seconds for mobile (slightly longer)
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl && statusEl.parentNode) {
                statusEl.style.display = 'none';
            }
        }, 4000);
    }
}

function getStatusColor(type) {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        loading: '#2196F3',
        info: '#FF9800'
    };
    return colors[type] || colors.info;
}

// Update DOMContentLoaded to include network detection
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initCloudSync();
    setupNetworkDetection();
});

// Utility Functions
function saveForm() {
    saveUserData();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}
