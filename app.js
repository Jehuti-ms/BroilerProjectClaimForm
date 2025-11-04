// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Service Worker Sync Manager
const SW_SYNC = {
    registration: null,
    isSupported: 'serviceWorker' in navigator && 'SyncManager' in window,
    syncInProgress: false
};

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
    initServiceWorkerSync();
    addSyncControlsToUI();
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
    
    // Queue for Service Worker background sync
    if (SW_SYNC.isSupported && navigator.serviceWorker.controller) {
        queueDataForSync({
            username: user.username,
            data: allData,
            timestamp: new Date().toISOString(),
            type: 'full_sync'
        });
    }
    
    // Trigger immediate cloud sync if auto-sync is enabled
    const autoSync = localStorage.getItem('autoSyncEnabled');
    if (autoSync === 'true' && navigator.onLine) {
        setTimeout(() => syncToCloud(), 1000);
    }
    
    showNotification('Form data saved and queued for sync!');
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

// Service Worker Sync Functions
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

async function registerBackgroundSync() {
    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('broiler-background-sync');
        console.log('Background sync registered');
    } catch (error) {
        console.error('Background sync registration failed:', error);
    }
}

async function registerPeriodicSync() {
    try {
        const registration = await navigator.serviceWorker.ready;
        
        const status = await navigator.permissions.query({
            name: 'periodic-background-sync'
        });
        
        if (status.state === 'granted') {
            await registration.periodicSync.register('broiler-periodic-sync', {
                minInterval: 15 * 60 * 1000
            });
            console.log('Periodic sync registered');
        } else {
            console.log('Periodic sync permission denied');
        }
        
    } catch (error) {
        console.error('Periodic sync not supported:', error);
    }
}

async function triggerSync() {
    if (!SW_SYNC.registration || SW_SYNC.syncInProgress) {
        return;
    }

    try {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) return;
        
        const user = JSON.parse(currentUser);
        const userData = localStorage.getItem(`userData_${user.username}`);
        
        if (!userData) return;
        
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

function queueDataForSync(data) {
    if (!navigator.serviceWorker.controller) {
        return;
    }
    
    navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_DATA',
        payload: data
    });
}

// Cloud Sync Functions
function addSyncControlsToUI() {
    const syncControls = `
        <div class="sync-controls" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #f8f9fa;">
            <h3 style="margin: 0 0 15px 0; color: #333;">🔄 Data Synchronization</h3>
            
            <!-- Automatic Sync Section -->
            <div style="margin-bottom: 15px; padding: 10px; background: white; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px;">Automatic Sync</h4>
                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                    <button onclick="manualSync()" class="sync-btn" id="manual-sync-btn">
                        <span class="btn-icon">🔄</span> Sync Now
                    </button>
                    <span id="sync-status-display" style="font-size: 12px; color: #666;">
                        Checking sync status...
                    </span>
                </div>
                <div style="display: flex; align-items: center; margin-top: 10px;">
                    <input type="checkbox" id="auto-sync" onchange="toggleAutoSync()" style="margin-right: 8px;">
                    <label for="auto-sync" style="font-size: 12px; color: #666;">
                        Enable automatic background sync
                    </label>
                </div>
            </div>
            
            <!-- Manual Cloud Sync Section -->
            <div style="padding: 10px; background: white; border-radius: 5px;">
                <h4 style="margin: 0 0 10px 0; font-size: 14px;">Manual Cloud Sync</h4>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="manualSyncToCloud()" class="cloud-sync-btn" style="background: #2196F3;">
                        <span class="btn-icon">📤</span> Push to Cloud
                    </button>
                    <button onclick="manualSyncFromCloud()" class="cloud-sync-btn" style="background: #4CAF50;">
                        <span class="btn-icon">📥</span> Pull from Cloud
                    </button>
                    <button onclick="exportData()" class="cloud-sync-btn" style="background: #FF9800;">
                        <span class="btn-icon">💾</span> Export Backup
                    </button>
                </div>
                <div style="font-size: 11px; color: #888; margin-top: 8px;">
                    Use these buttons for manual cloud synchronization
                </div>
            </div>
        </div>
    `;
    
    const formSection = document.querySelector('.form-container') || 
                       document.querySelector('.container') || 
                       document.getElementById('main-content');
    
    if (formSection) {
        formSection.insertAdjacentHTML('afterend', syncControls);
        updateSyncStatusDisplay();
        initAutoSyncCheckbox();
    }
    
    // Add sync styles
    addSyncStyles();
}

function addSyncStyles() {
    if (!document.querySelector('#sync-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'sync-styles';
        styleSheet.textContent = `
            .sync-controls {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .sync-btn, .cloud-sync-btn {
                color: white;
                border: none;
                padding: 10px 16px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .sync-btn:hover, .cloud-sync-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .sync-btn:active, .cloud-sync-btn:active {
                transform: translateY(0);
            }
            
            .sync-btn:disabled {
                background: #ccc !important;
                cursor: not-allowed;
                transform: none;
            }
            
            .btn-icon {
                font-size: 16px;
            }
            
            #sync-status-display {
                padding: 4px 8px;
                border-radius: 4px;
                background: #f5f5f5;
                font-family: monospace;
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

async function manualSync() {
    if (SW_SYNC.isSupported && SW_SYNC.registration) {
        showSyncStatus('🔄 Starting background sync...', 'loading');
        await triggerSync();
    } else {
        showSyncStatus('🔄 Starting manual sync...', 'loading');
        await manualSyncToCloud();
        await manualSyncFromCloud();
    }
}

async function manualSyncToCloud() {
    showSyncStatus('📤 Pushing data to cloud...', 'loading');
    
    try {
        const success = await syncToCloud();
        if (success) {
            showSyncStatus('✅ Data pushed to cloud successfully!', 'success');
        } else {
            showSyncStatus('❌ Failed to push to cloud', 'error');
        }
    } catch (error) {
        console.error('Manual sync to cloud failed:', error);
        showSyncStatus('❌ Cloud push failed', 'error');
    }
}

async function manualSyncFromCloud() {
    showSyncStatus('📥 Pulling data from cloud...', 'loading');
    
    try {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            showSyncStatus('❌ Please sign in first', 'error');
            return;
        }
        
        const user = JSON.parse(currentUser);
        const cloudData = await getFromMultipleCloudServices(user.username);
        
        if (cloudData) {
            await applyCloudData(user.username, cloudData);
            showSyncStatus('✅ Cloud data loaded successfully!', 'success');
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
        }
    } catch (error) {
        console.error('Manual sync from cloud failed:', error);
        showSyncStatus('❌ Cloud pull failed', 'error');
    }
}

async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        return false;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        return false;
    }
    
    try {
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo()
        };
        
        const encryptedData = btoa(JSON.stringify(syncData));
        await storeInMultipleCloudServices(user.username, encryptedData);
        
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Cloud sync failed:', error);
        return false;
    }
}

async function storeInMultipleCloudServices(username, encryptedData) {
    await storeInGitHubGist(username, encryptedData);
    await storeInPastebinService(username, encryptedData);
    storeInSharedLocalStorage(username, encryptedData);
    return true;
}

async function getFromMultipleCloudServices(username) {
    let data = await getFromGitHubGist(username);
    if (data) return data;
    
    data = await getFromPastebinService(username);
    if (data) return data;
    
    data = getFromSharedLocalStorage(username);
    if (data) return data;
    
    return null;
}

async function storeInGitHubGist(username, encryptedData) {
    try {
        const gistData = {
            public: false,
            description: `Broiler Data Sync - ${username}`,
            files: {
                [`broiler_${username}.json`]: {
                    content: encryptedData
                }
            }
        };
        
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
        }
    } catch (error) {
        console.log('GitHub Gist storage failed:', error);
    }
    return false;
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
            return JSON.parse(atob(fileContent));
        }
    } catch (error) {
        console.log('GitHub Gist retrieval failed:', error);
    }
    return null;
}

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

function storeInSharedLocalStorage(username, encryptedData) {
    const sharedKey = `shared_${btoa(username)}_sync`;
    localStorage.setItem(sharedKey, encryptedData);
    return true;
}

function getFromSharedLocalStorage(username) {
    const sharedKey = `shared_${btoa(username)}_sync`;
    const data = localStorage.getItem(sharedKey);
    if (data) {
        return JSON.parse(atob(data));
    }
    return null;
}

async function applyCloudData(username, cloudData) {
    if (cloudData && cloudData.data) {
        localStorage.setItem(`userData_${username}`, JSON.stringify(cloudData.data));
        reloadUserData();
    }
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent.substring(0, 100),
        platform: navigator.platform,
        timestamp: new Date().toISOString()
    };
}

// Auto-sync functions
function initAutoSyncCheckbox() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        checkbox.checked = autoSync === 'true';
    }
}

function toggleAutoSync() {
    const checkbox = document.getElementById('auto-sync');
    const newState = checkbox.checked;
    
    localStorage.setItem('autoSyncEnabled', newState.toString());
    
    if (newState) {
        showSyncStatus('Auto-sync enabled', 'success');
        triggerSync();
    } else {
        showSyncStatus('Auto-sync disabled', 'error');
    }
}

function initFallbackSync() {
    console.log('Using fallback sync');
    
    setInterval(() => {
        if (navigator.onLine) {
            autoSyncData();
        }
    }, 5 * 60 * 1000);
    
    window.addEventListener('online', () => {
        setTimeout(() => autoSyncData(), 2000);
    });
}

async function autoSyncData() {
    if (!navigator.onLine) {
        return;
    }
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    
    try {
        const cloudData = await getFromMultipleCloudServices(user.username);
        if (cloudData) {
            await applyCloudData(user.username, cloudData);
        }
        await syncToCloud();
        console.log('Auto-sync completed');
    } catch (error) {
        console.log('Auto-sync failed:', error);
    }
}

// Sync status display
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
            text-align:
