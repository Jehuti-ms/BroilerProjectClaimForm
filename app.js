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

// Service Worker Sync Manager
const SW_SYNC = {
    registration: null,
    isSupported: 'serviceWorker' in navigator && 'SyncManager' in window,
    syncInProgress: false
};

// Initialize Service Worker Sync
async function initServiceWorkerSync() {
    if (!SW_SYNC.isSupported) {
        console.log('Service Worker sync not supported');
        initFallbackSync();
        return;
    }

    try {
        // Register Service Worker
        SW_SYNC.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered');

        // Wait for Service Worker to be ready
        await navigator.serviceWorker.ready;
        
        // Setup sync event listeners
        setupSyncListeners();
        
        // Register background sync
        await registerBackgroundSync();
        
        // Register periodic sync if supported
        if ('periodicSync' in SW_SYNC.registration) {
            await registerPeriodicSync();
        }
        
        // Start sync on load
        setTimeout(() => triggerSync(), 3000);
        
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        initFallbackSync();
    }
}

// Setup message listeners for Service Worker
function setupSyncListeners() {
    // Listen for messages from Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
        const { type, timestamp, success, error } = event.data;
        
        switch (type) {
            case 'SYNC_STARTED':
                SW_SYNC.syncInProgress = true;
                showSyncStatus('🔄 Background sync started...', 'loading');
                break;
                
            case 'SYNC_COMPLETED':
                SW_SYNC.syncInProgress = false;
                if (success) {
                    showSyncStatus('✅ Sync completed!', 'success');
                    updateLastSyncTime();
                } else {
                    showSyncStatus('❌ Sync failed', 'error');
                }
                break;
                
            case 'SYNC_FAILED':
                SW_SYNC.syncInProgress = false;
                showSyncStatus(`❌ Sync error: ${error}`, 'error');
                break;
        }
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Service Worker controller changed');
        triggerSync();
    });
}

// Register background sync
async function registerBackgroundSync() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Register for background sync
        await registration.sync.register('broiler-background-sync');
        console.log('Background sync registered');
        
    } catch (error) {
        console.error('Background sync registration failed:', error);
    }
}

// Register periodic background sync
async function registerPeriodicSync() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        // Check if periodic sync is supported and allowed
        const status = await navigator.permissions.query({
            name: 'periodic-background-sync'
        });
        
        if (status.state === 'granted') {
            await registration.periodicSync.register('broiler-periodic-sync', {
                minInterval: 15 * 60 * 1000 // 15 minutes minimum
            });
            console.log('Periodic sync registered');
        } else {
            console.log('Periodic sync permission denied');
        }
        
    } catch (error) {
        console.error('Periodic sync not supported:', error);
    }
}

// Trigger immediate sync
async function triggerSync() {
    if (!SW_SYNC.registration || SW_SYNC.syncInProgress) {
        return;
    }

    try {
        // Get current user data
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const user = JSON.parse(currentUser);
        const userData = localStorage.getItem(`userData_${user.username}`);
        
        if (!userData) return;
        
        // Prepare sync data
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo()
        };
        
        // Send data to Service Worker for queuing
        if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'QUEUE_DATA',
                payload: syncData
            });
        }
        
        // Trigger background sync
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('broiler-background-sync');
        
        showSyncStatus('🔄 Triggering background sync...', 'loading');
        
    } catch (error) {
        console.error('Trigger sync failed:', error);
        showSyncStatus('❌ Failed to trigger sync', 'error');
    }
}

// Queue data changes for sync
function queueDataForSync(data) {
    if (!navigator.serviceWorker.controller) {
        return;
    }
    
    navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_DATA',
        payload: data
    });
    
    // Trigger sync after short delay
    setTimeout(() => triggerSync(), 1000);
}

// Enhanced saveUserData that triggers sync
function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
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
    
    // Queue for background sync
    queueDataForSync({
        username: user.username,
        data: allData,
        timestamp: new Date().toISOString(),
        type: 'full_sync'
    });
    
    // Show save confirmation
    showNotification('Form data saved and queued for sync!');
}

// Manual sync function
async function manualSync() {
    if (SW_SYNC.syncInProgress) {
        showSyncStatus('🔄 Sync already in progress...', 'loading');
        return;
    }
    
    showSyncStatus('🔄 Starting manual sync...', 'loading');
    await triggerSync();
}

// Update last sync time
function updateLastSyncTime() {
    localStorage.setItem('lastSyncTime', new Date().toISOString());
    updateSyncStatusDisplay();
}

// Update sync status display
function updateSyncStatusDisplay() {
    const lastSync = localStorage.getItem('lastSyncTime');
    const statusElement = document.getElementById('sync-status-display');
    
    if (statusElement) {
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            statusElement.textContent = `Last sync: ${lastSyncDate.toLocaleTimeString()}`;
            statusElement.style.color = '#4CAF50';
        } else {
            statusElement.textContent = 'Never synced';
            statusElement.style.color = '#f44336';
        }
    }
}

// Fallback sync for unsupported browsers
function initFallbackSync() {
    console.log('Using fallback sync');
    
    // Sync every 5 minutes
    setInterval(() => {
        if (navigator.onLine) {
            autoSyncData();
        }
    }, 5 * 60 * 1000);
    
    // Sync when coming online
    window.addEventListener('online', () => {
        setTimeout(() => autoSyncData(), 2000);
    });
}

// Enhanced autoSyncData for fallback
async function autoSyncData() {
    // Your existing autoSyncData implementation
    console.log('Fallback auto-sync running');
}

// Update your existing cloud sync functions to use Service Worker
async function syncToCloud() {
    await triggerSync();
}

async function syncFromCloud() {
    await triggerSync();
}

// Update DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initServiceWorkerSync(); // Replace initCloudSync() with this
    
    // Add sync status display to UI
    addSyncStatusToUI();
});

// Add sync status to UI
function addSyncStatusToUI() {
    const syncControls = `
        <div class="sync-controls" style="margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
            <h3>🔄 Automatic Sync</h3>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                <button onclick="manualSync()" class="sync-btn">Sync Now</button>
                <span id="sync-status-display" style="font-size: 12px; color: #666;">
                    Checking sync status...
                </span>
            </div>
            <div style="font-size: 11px; color: #888; margin-top: 5px;">
                Data syncs automatically in background
            </div>
        </div>
    `;
    
    // Insert into your UI
    const formSection = document.querySelector('.form-container');
    if (formSection) {
        formSection.insertAdjacentHTML('afterend', syncControls);
        updateSyncStatusDisplay();
    }
}

// Add some CSS for sync controls
const syncStyles = `
    .sync-btn {
        background: #2196F3;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
    }
    
    .sync-btn:hover {
        background: #1976D2;
    }
    
    .sync-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
    }
    
    .sync-controls {
        background: #f9f9f9;
    }
`;

// Add styles to document
const styleSheet = document.createElement('style');
styleSheet.textContent = syncStyles;
document.head.appendChild(styleSheet);

// Utility Functions
function saveForm() {
    saveUserData();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}
