// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initCloudSync();
});

// Add this at the top of app.js (after your existing variables)
const CLOUD_CONFIG = {
    url: SUPABASE_CONFIG.url,    // Uses your existing config
    key: SUPABASE_CONFIG.anonKey // Uses your existing config
};

// Cloud Sync using your Supabase configuration
const CLOUD_CONFIG = {
    url: SUPABASE_CONFIG.url,
    key: SUPABASE_CONFIG.anonKey
};

// Initialize cloud sync
function initCloudSync() {
    updateLastSyncDisplay();
    startAutoSync();
    console.log('Supabase cloud sync initialized');
}

// Main sync function - Push to Supabase
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
        const success = await syncToSupabase(user.username, JSON.parse(userData));
        
        if (success) {
            showSyncStatus('✅ Data synced to cloud!', 'success');
            localStorage.setItem('lastCloudSync', new Date().toISOString());
            updateLastSyncDisplay();
        } else {
            throw new Error('Supabase sync failed');
        }
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed: ' + error.message, 'error');
    }
}

// Pull from Supabase
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Loading from cloud...', 'loading');
    
    try {
        const cloudData = await syncFromSupabase(user.username);
        
        if (cloudData) {
            localStorage.setItem(`userData_${user.username}`, JSON.stringify(cloudData.data));
            loadUserData(user.username);
            showSyncStatus('✅ Cloud data loaded!', 'success');
            updateLastSyncDisplay();
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
        }
        
    } catch (error) {
        console.error('Cloud retrieval failed:', error);
        showSyncStatus('❌ Sync failed: ' + error.message, 'error');
    }
}

// Sync data to Supabase
async function syncToSupabase(username, data) {
    try {
        // Using the supabase client from your config
        const { error } = await supabase
            .from('user_data')
            .upsert({
                user_id: username,
                data: data,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Supabase error:', error);
            // Fallback to REST API if client fails
            return await syncToSupabaseRest(username, data);
        }
        
        return true;
    } catch (error) {
        console.error('Supabase client sync failed:', error);
        // Fallback to REST API
        return await syncToSupabaseRest(username, data);
    }
}

// REST API fallback for Supabase
async function syncToSupabaseRest(username, data) {
    try {
        const response = await fetch(`${CLOUD_CONFIG.url}/rest/v1/user_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': CLOUD_CONFIG.key,
                'Authorization': `Bearer ${CLOUD_CONFIG.key}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: username,
                data: data,
                updated_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            return true;
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Supabase REST sync failed:', error);
        throw error;
    }
}

// Get data from Supabase
async function syncFromSupabase(username) {
    try {
        // Using the supabase client from your config
        const { data, error } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', username)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            // Fallback to REST API
            return await syncFromSupabaseRest(username);
        }
        
        return data;
    } catch (error) {
        console.error('Supabase client retrieval failed:', error);
        // Fallback to REST API
        return await syncFromSupabaseRest(username);
    }
}

// REST API fallback for Supabase retrieval
async function syncFromSupabaseRest(username) {
    try {
        const response = await fetch(
            `${CLOUD_CONFIG.url}/rest/v1/user_data?user_id=eq.${username}&select=*`, 
            {
                headers: {
                    'apikey': CLOUD_CONFIG.key,
                    'Authorization': `Bearer ${CLOUD_CONFIG.key}`
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            return data[0];
        } else {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Supabase REST retrieval failed:', error);
        throw error;
    }
}

// Update last sync display in your HTML
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastCloudSync');
    const lastSyncElement = document.getElementById('last-sync');
    
    if (lastSyncElement) {
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            lastSyncElement.innerHTML = `
                <span class="sync-icon">🕒</span>
                Last synced: ${lastSyncDate.toLocaleString()}
            `;
            lastSyncElement.style.display = 'block';
            lastSyncElement.style.color = '#4CAF50';
        } else {
            lastSyncElement.innerHTML = `
                <span class="sync-icon">⚠️</span>
                Never synced - Click "Sync to Cloud" to backup your data
            `;
            lastSyncElement.style.display = 'block';
            lastSyncElement.style.color = '#FF9800';
        }
    }
}

// Show sync status in the cloud sync section
function showSyncStatus(message, type) {
    // Create or update status element
    let statusElement = document.getElementById('sync-status');
    
    if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'sync-status';
        statusElement.className = 'sync-status';
        
        const cloudSection = document.querySelector('.cloud-sync-section');
        if (cloudSection) {
            const buttons = cloudSection.querySelector('.cloud-sync-buttons');
            if (buttons && buttons.nextSibling) {
                cloudSection.insertBefore(statusElement, buttons.nextSibling);
            } else {
                cloudSection.appendChild(statusElement);
            }
        }
    }
    
    statusElement.textContent = message;
    statusElement.className = `sync-status sync-${type}`;
    statusElement.style.display = 'block';
    statusElement.style.padding = '10px';
    statusElement.style.margin = '10px 0';
    statusElement.style.borderRadius = '4px';
    statusElement.style.textAlign = 'center';
    statusElement.style.fontSize = '14px';
    
    // Set colors based on type
    if (type === 'success') {
        statusElement.style.background = '#4CAF50';
        statusElement.style.color = 'white';
    } else if (type === 'error') {
        statusElement.style.background = '#f44336';
        statusElement.style.color = 'white';
    } else if (type === 'loading') {
        statusElement.style.background = '#2196F3';
        statusElement.style.color = 'white';
    } else if (type === 'info') {
        statusElement.style.background = '#FF9800';
        statusElement.style.color = 'white';
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success' || type === 'info') {
        setTimeout(() => {
            if (statusElement && statusElement.textContent === message) {
                statusElement.style.display = 'none';
            }
        }, 5000);
    }
}

// Auto-sync functionality
function startAutoSync() {
    // Auto-sync every 5 minutes if user is active
    setInterval(() => {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser && navigator.onLine && !document.hidden) {
            const user = JSON.parse(currentUser);
            const userData = localStorage.getItem(`userData_${user.username}`);
            
            if (userData) {
                console.log('Auto-syncing data to Supabase...');
                syncToSupabase(user.username, JSON.parse(userData))
                    .then(success => {
                        if (success) {
                            localStorage.setItem('lastCloudSync', new Date().toISOString());
                            updateLastSyncDisplay();
                        }
                    })
                    .catch(error => {
                        console.log('Auto-sync failed:', error);
                    });
            }
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Enhanced save function with auto-sync
const originalSaveUserData = saveUserData;
saveUserData = function() {
    originalSaveUserData.apply(this, arguments);
    
    // Auto-sync after saving if online
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && navigator.onLine) {
        setTimeout(() => {
            const user = JSON.parse(currentUser);
            const userData = localStorage.getItem(`userData_${user.username}`);
            if (userData) {
                syncToSupabase(user.username, JSON.parse(userData))
                    .then(success => {
                        if (success) {
                            console.log('Auto-saved to Supabase');
                            localStorage.setItem('lastCloudSync', new Date().toISOString());
                            updateLastSyncDisplay();
                        }
                    })
                    .catch(error => {
                        console.log('Auto-save failed:', error);
                    });
            }
        }, 1000);
    }
};

// Update DOMContentLoaded to initialize cloud sync
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    // Wait a bit for Supabase to initialize, then init cloud sync
    setTimeout(() => initCloudSync(), 1000);
});

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('user_data')
            .select('count')
            .limit(1);

        if (error) {
            console.error('Supabase test failed:', error);
            return false;
        }
        
        console.log('✅ Supabase connection successful!');
        return true;
    } catch (error) {
        console.error('Supabase test failed:', error);
        return false;
    }
}

// Run connection test on load
setTimeout(() => {
    testSupabaseConnection().then(success => {
        if (success) {
            console.log('Supabase cloud sync ready!');
        } else {
            console.log('Supabase connection issues - sync may not work');
        }
    });
}, 2000);

// Check if user is authenticated
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

// Format date for display (DD/MM/YYYY format)
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

// Format date for input (YYYY-MM-DD format)
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

// Simple Cloud Sync Functions ================================================//
function addSyncControls() {
    const syncHTML = `
        <div class="sync-controls" style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px;">
            <h3>🔄 Cloud Sync</h3>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <button onclick="syncToCloud()" class="sync-btn" style="background: #2196F3; color: white; padding: 10px; border: none; border-radius: 4px;">
                    📤 Push to Cloud
                </button>
                <button onclick="syncFromCloud()" class="sync-btn" style="background: #4CAF50; color: white; padding: 10px; border: none; border-radius: 4px;">
                    📥 Pull from Cloud
                </button>
                <button onclick="exportData()" class="sync-btn" style="background: #FF9800; color: white; padding: 10px; border: none; border-radius: 4px;">
                    💾 Export Backup
                </button>
            </div>
            <div id="sync-status" style="font-size: 12px; color: #666;"></div>
        </div>
    `;
    
    const formSection = document.querySelector('.form-container') || document.querySelector('.container');
    if (formSection) {
        formSection.insertAdjacentHTML('afterend', syncHTML);
    }
}

// Initialize sync controls after authentication
setTimeout(() => {
    addSyncControls();
}, 1000);

// Simple cloud sync using localStorage as backup
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
        // Simple sync using localStorage as cloud storage
        const syncData = {
            username: user.username,
            data: JSON.parse(userData),
            timestamp: new Date().toISOString()
        };
        
        // Store in cloud storage (using localStorage for now)
        localStorage.setItem(`cloud_backup_${user.username}`, JSON.stringify(syncData));
        
        showSyncStatus('Data synced successfully!', 'success');
        localStorage.setItem('lastCloudSync', new Date().toISOString());
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('Sync failed', 'error');
    }
}

async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('Syncing from cloud...', 'loading');
    
    try {
        const cloudData = localStorage.getItem(`cloud_backup_${user.username}`);
        if (cloudData) {
            const parsedData = JSON.parse(cloudData);
            await applyCloudData(user.username, parsedData);
            showSyncStatus('Data synced successfully!', 'success');
        } else {
            showSyncStatus('No cloud data found', 'error');
        }
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('Sync failed', 'error');
    }
}

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

function showSyncStatus(message, type) {
    const statusEl = document.getElementById('sync-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';
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
        exportDate: new Date().toISOString(),
        employeeName: user.employeeName
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `broiler_data_${user.username}_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('Data exported successfully!');
}
/*======================================================================
         SupaBase
=========================================================================*/
// Supabase Sync - FREE forever, no expiration
const SUPABASE_CONFIG = {
    url: 'https://wjzkiceausyejnmnlqvg.supabase.co', // Replace with your URL
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqemtpY2VhdXN5ZWpubW5scXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzg3ODEsImV4cCI6MjA3NzgxNDc4MX0.uqX0SA5Wa52yPvRkSxxrkDvC8YkIEpO5MNndAC_IrHQ' // Replace with your anon key
};

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
    
    showSyncStatus('🔄 Syncing to cloud...', 'loading');
    
    try {
        const success = await syncToSupabase(user.username, JSON.parse(userData));
        
        if (success) {
            showSyncStatus('✅ Data synced to cloud!', 'success');
            localStorage.setItem('lastCloudSync', new Date().toISOString());
        } else {
            throw new Error('Cloud sync failed');
        }
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

async function syncToSupabase(username, data) {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/user_data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_CONFIG.key,
                'Authorization': `Bearer ${SUPABASE_CONFIG.key}`,
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                user_id: username,
                data: data,
                updated_at: new Date().toISOString()
            })
        });
        
        return response.ok;
    } catch (error) {
        console.error('Supabase sync failed:', error);
        return false;
    }
}

async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showSyncStatus('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Loading from cloud...', 'loading');
    
    try {
        const cloudData = await syncFromSupabase(user.username);
        
        if (cloudData) {
            localStorage.setItem(`userData_${user.username}`, JSON.stringify(cloudData.data));
            loadUserData(user.username);
            showSyncStatus('✅ Cloud data loaded!', 'success');
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
        }
        
    } catch (error) {
        console.error('Cloud retrieval failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

async function syncFromSupabase(username) {
    try {
        const response = await fetch(
            `${SUPABASE_CONFIG.url}/rest/v1/user_data?user_id=eq.${username}&select=*`, 
            {
                headers: {
                    'apikey': SUPABASE_CONFIG.key,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.key}`
                }
            }
        );
        
        if (response.ok) {
            const data = await response.json();
            return data[0]; // Return first record
        }
        return null;
    } catch (error) {
        console.error('Supabase retrieval failed:', error);
        return null;
    }
}

// Initialize on app start
function initCloudSync() {
    // Supabase is always ready - no token needed
    console.log('Supabase sync ready');
}
//==================================================//

// Utility Functions
function saveForm() {
    saveUserData();
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}
