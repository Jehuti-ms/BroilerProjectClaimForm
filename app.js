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

// Cloud Sync Functions
function initCloudSync() {
    initAutoSyncCheckbox();
    
    setInterval(() => {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        if (autoSync === 'true') {
            autoSyncData();
        }
    }, CONFIG.SYNC.SYNC_INTERVAL);
}

function initAutoSyncCheckbox() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const autoSync = localStorage.getItem('autoSyncEnabled');
        checkbox.checked = autoSync === 'true';
    }
}

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
    
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        checkbox.checked = newState;
    }
}

async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showNotification('No data to sync', 'error');
        return;
    }
    
    showSyncStatus('🔄 Syncing to cloud...', 'loading');
    
    try {
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString(),
            device: getDeviceInfo()
        };
        
        const encryptedData = btoa(JSON.stringify(syncData));
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
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Checking for cloud data...', 'loading');
    
    try {
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

async function storeInMultipleCloudServices(username, encryptedData) {
    await storeInGitHubGist(username, encryptedData);
    await storeInPastebinService(username, encryptedData);
    storeInSharedLocalStorage(username, encryptedData);
}

async function getFromMultipleCloudServices(username) {
    const methods = [
        () => getFromGitHubGist(username),
        () => getFromPastebinService(username),
        () => getFromSharedLocalStorage(username)
    ];
    
    for (const method of methods) {
        const data = await method();
        if (data) return data;
    }
    
    return null;
}

// Cloud Storage Methods
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
    
    const allKeys = Object.keys(localStorage);
    const sharedKeys = allKeys.filter(key => key.startsWith(`shared_${btoa(username)}_`));
    
    if (sharedKeys.length > 0) {
        sharedKeys.sort().reverse();
        const recentData = localStorage.getItem(sharedKeys[0]);
        if (recentData) {
            return JSON.parse(atob(recentData));
        }
    }
    
    return null;
}

async function applyCloudData(username, cloudData) {
    if (cloudData && cloudData.data) {
        localStorage.setItem(`userData_${username}`, JSON.stringify(cloudData.data));
        reloadUserData();
    }
}

async function autoSyncData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (userData) {
        try {
            const syncData = {
                username: user.username,
                data: JSON.parse(userData),
                timestamp: new Date().toISOString(),
                device: getDeviceInfo()
            };
            
            const encryptedData = btoa(JSON.stringify(syncData));
            await storeInMultipleCloudServices(user.username, encryptedData);
            console.log('Auto-sync completed');
        } catch (error) {
            console.log('Auto-sync failed');
        }
    }
}

function getDeviceInfo() {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        timestamp: new Date().toISOString()
    };
}

function showSyncStatus(message, type) {
    let statusEl = document.getElementById('sync-status');
    
    if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.id = 'sync-status';
        statusEl.className = 'sync-status';
        statusEl.style.display = 'none';
        
        const totalHours = document.querySelector('.total-hours');
        if (totalHours && totalHours.parentNode) {
            totalHours.parentNode.insertBefore(statusEl, totalHours.nextSibling);
        }
    }
    
    statusEl.textContent = message;
    statusEl.className = `sync-status sync-${type}`;
    statusEl.style.display = 'block';
    
    if (type !== 'loading') {
        setTimeout(() => {
            if (statusEl) {
                statusEl.style.display = 'none';
            }
        }, 5000);
    }
}

// Export Data
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

// Utility Functions
function saveForm() {
    saveUserData();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}
