// app.js - Complete Firebase Integration

// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Firebase variables
let firebaseUser = null;
let isOnline = navigator.onLine;

// Firebase helper functions
async function ensureFirebaseAuth() {
    console.log('🔐 Ensuring Firebase authentication...');
    
    if (!window.auth) {
        console.warn('Firebase Auth not available');
        return false;
    }
    
    // Check if already authenticated
    const user = await getCurrentFirebaseUser();
    if (user) {
        console.log('✅ Firebase user already authenticated:', user.email);
        return true;
    }
    
    // Try to sign in with localStorage credentials
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const userData = JSON.parse(currentUser);
        if (userData.username && userData.password) {
            try {
                console.log('Attempting Firebase sign-in...');
                const credential = await auth.signInWithEmailAndPassword(
                    userData.username, 
                    userData.password
                );
                console.log('✅ Firebase sign-in successful:', credential.user.email);
                return true;
            } catch (error) {
                console.warn('Firebase sign-in failed:', error.message);
            }
        }
    }
    
    console.log('⚠️ No Firebase authentication available');
    return false;
}

// Check Firebase authentication status
function checkFirebaseAuthStatus() {
    if (!window.auth) return 'not_loaded';
    
    const user = auth.currentUser;
    if (user) {
        return {
            status: 'authenticated',
            email: user.email,
            uid: user.uid
        };
    }
    
    return 'not_authenticated';
}

// =============== ADD THIS ERROR HANDLER HERE ===============
// Firebase error handler function
function handleFirebaseError(error) {
    console.error('Firebase error:', error.code, error.message);
    
    let userMessage = 'Firebase error occurred';
    let type = 'error';
    
    switch (error.code) {
        case 'permission-denied':
            userMessage = '❌ Firebase permission denied. Please check security rules.';
            type = 'error';
            break;
        case 'unavailable':
            userMessage = '📴 Firebase unavailable. Working in offline mode.';
            type = 'warning';
            break;
        case 'unauthenticated':
            userMessage = '🔐 Please sign in to use cloud sync features.';
            type = 'error';
            break;
        case 'failed-precondition':
            userMessage = '⚡ Firebase service not ready. Try again in a moment.';
            type = 'warning';
            break;
        default:
            userMessage = `⚠️ Firebase: ${error.message || 'Unknown error'}`;
            type = 'error';
    }
    
    showNotification(userMessage, type);
    return false;
}

// Safe Firebase wrapper functions
async function safeFirebaseOperation(operation, fallbackValue = false) {
    try {
        return await operation();
    } catch (error) {
        return handleFirebaseError(error);
    }
}

// Safe Firebase test function (prevents recursion)
async function performSafeFirebaseTest() {
    return await safeFirebaseOperation(async () => {
        console.log('Running safe Firebase test...');
        
        if (!window.firestore) {
            console.log('Firestore not available for testing');
            return false;
        }
        
        // Simple ping test - no recursion
        const testId = 'safetest_' + Date.now();
        const testRef = firestore.collection('safeTests').doc(testId);
        
        // Quick write test
        await testRef.set({
            test: 'safe_connection_check',
            timestamp: new Date().toISOString(),
            source: 'app.js'
        });
        
        console.log('✅ Safe test write successful');
        
        // Quick read test
        const doc = await testRef.get();
        if (!doc.exists) {
            console.warn('Test document not found');
            return false;
        }
        
        console.log('✅ Safe test read successful');
        
        // Clean up
        await testRef.delete();
        console.log('✅ Safe test cleanup successful');
        
        return true;
    });
}

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js loading...');
    
    // Initialize Firebase first
    initializeFirebase();
    
    // Check authentication after Firebase is ready
    setTimeout(() => {
        checkAuthentication();
    }, 1000);
    
    // Set up network monitoring
    setupNetworkMonitoring();
    
    // Set up auto-sync
    initAutoSyncCheckbox();
    
    // Add event listener for auto-sync checkbox
    const autoSyncCheckbox = document.getElementById('auto-sync');
    if (autoSyncCheckbox) {
        autoSyncCheckbox.addEventListener('change', toggleAutoSync);
    }
    
    // Add event listener for Firebase auto-sync
    const firebaseAutoSync = document.getElementById('firebase-auto-sync');
    if (firebaseAutoSync) {
        firebaseAutoSync.addEventListener('change', toggleFirebaseAutoSync);
        // Load saved preference
        const savedPref = localStorage.getItem('firebaseAutoSyncEnabled');
        firebaseAutoSync.checked = savedPref === 'true';
    }
    
    // Set up employee name memory
    setupEmployeeNameMemory();
});

// Initialize Firebase (with authentication check)
function initializeFirebase() {
    console.log('🔥 Initializing Firebase in app.js...');
    
    // Wait for Firebase to load
    const checkFirebase = setInterval(() => {
        if (typeof firestore !== 'undefined' && firestore) {
            clearInterval(checkFirebase);
            console.log('✅ Firebase services available in app.js');
            
            // Set up auth state listener
            if (auth) {
                auth.onAuthStateChanged((user) => {
                    firebaseUser = user;
                    console.log('🔐 Firebase auth state changed:', user ? user.email : 'No user');
                    
                    if (user) {
                        // Update user display
                        const userDisplay = document.getElementById('user-display');
                        if (userDisplay) {
                            userDisplay.textContent = `Welcome, ${user.displayName || user.email} (Firebase)`;
                        }
                        
                        // Store in localStorage for consistency
                        const currentUser = localStorage.getItem('currentUser');
                        if (currentUser) {
                            const userData = JSON.parse(currentUser);
                            userData.uid = user.uid;
                            userData.firebaseAuthenticated = true;
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                        }
                    }
                });
            }
            
            // Check authentication status
            setTimeout(async () => {
                console.log('🔐 Checking Firebase auth status...');
                const authStatus = checkFirebaseAuthStatus();
                console.log('Firebase auth status:', authStatus);
                
                // Update UI based on auth status
                if (typeof updateFirebaseStatus === 'function') {
                    if (authStatus === 'authenticated') {
                        updateFirebaseStatus('authenticated');
                    } else if (auth && auth.currentUser === null) {
                        updateFirebaseStatus('not_authenticated');
                    }
                }
            }, 1000);
            
        }
    }, 500);
}

// Set up network monitoring
function setupNetworkMonitoring() {
    window.addEventListener('online', () => {
        isOnline = true;
        console.log('App is online');
        showNotification('Back online - syncing data...', 'success');
        
        // Auto-sync when coming back online
        if (firebaseUser) {
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

// Check if user is authenticated
// Check if user is authenticated - UPDATED VERSION
async function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    // Wait a bit for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // First, try Firebase Authentication
    if (window.auth) {
        try {
            // Get current Firebase user (async)
            const firebaseUser = await getCurrentFirebaseUser();
            
            if (firebaseUser) {
                console.log('✅ User authenticated via Firebase:', firebaseUser.email);
                
                // Store user info in localStorage for fallback
                const currentUser = {
                    username: firebaseUser.email,
                    employeeName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                    uid: firebaseUser.uid,
                    firebaseAuthenticated: true
                };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                handleAuthenticatedUser(firebaseUser);
                return;
            }
        } catch (firebaseError) {
            console.warn('Firebase auth check failed:', firebaseError.message);
            // Continue to localStorage fallback
        }
    }
    
    // Fallback: Check localStorage (existing app authentication)
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log('❌ No user found, redirecting to auth page');
        window.location.href = 'auth.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    console.log('⚠️ User authenticated via localStorage (fallback):', user.username);
    
    // Try to sign in to Firebase with localStorage credentials
    if (window.auth && user.username && user.password) {
        try {
            console.log('Attempting Firebase sign-in with stored credentials...');
            const credential = await auth.signInWithEmailAndPassword(user.username, user.password);
            console.log('✅ Auto-signed into Firebase:', credential.user.email);
            
            // Update localStorage with Firebase info
            user.uid = credential.user.uid;
            user.firebaseAuthenticated = true;
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            handleAuthenticatedUser(credential.user);
            return;
            
        } catch (signInError) {
            console.warn('Firebase auto-signin failed:', signInError.message);
            // Continue with localStorage user
        }
    }
    
    handleAuthenticatedUser(user);
}

// Helper: Get Firebase user (async)
async function getCurrentFirebaseUser() {
    if (!window.auth) return null;
    
    return new Promise((resolve) => {
        // Check current user immediately
        const currentUser = auth.currentUser;
        if (currentUser) {
            resolve(currentUser);
            return;
        }
        
        // Wait for auth state change (timeout after 2 seconds)
        const timeout = setTimeout(() => {
            unsubscribe();
            resolve(null);
        }, 2000);
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
            clearTimeout(timeout);
            unsubscribe();
            resolve(user);
        });
    });
}

// Handle authenticated user
// Handle authenticated user - UPDATED VERSION
function handleAuthenticatedUser(user) {
    console.log('👤 Handling authenticated user:', user.email || user.username);
    
    // Update UI with user info
    const userDisplay = document.getElementById('user-display');
    const employeeNameInput = document.getElementById('employee-name');
    
    if (userDisplay) {
        const displayName = user.displayName || user.employeeName || user.email || user.username;
        userDisplay.textContent = `Welcome, ${displayName}`;
        
        // Add Firebase indicator if applicable
        if (user.uid || user.firebaseAuthenticated) {
            userDisplay.innerHTML += ' <span style="color: #4CAF50; font-size: 0.8em;">(Firebase)</span>';
        } else {
            userDisplay.innerHTML += ' <span style="color: #FF9800; font-size: 0.8em;">(Local)</span>';
        }
    }
    
    if (employeeNameInput) {
        // Try to get name from multiple sources
        const name = user.employeeName || 
                    user.displayName || 
                    localStorage.getItem('mainAppEmployeeName') || 
                    'Employee Name';
        employeeNameInput.value = name;
        
        // Save for future
        localStorage.setItem('mainAppEmployeeName', name);
    }
    
    // Update Firebase user variable
    if (user.uid) {
        firebaseUser = user;
    }
    
    // Initialize the app
    initializeApp();
    
    // Load user data
    loadUserData(user.username || user.email);
}

// Initialize the application
function initializeApp() {
    console.log('Initializing application...');
    
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
            loadUserData(user.username || user.email);
        }
    });
    
    document.getElementById('year-input').addEventListener('change', function() {
        updateFormDate();
        saveCurrentMonth();
        
        // Load data for the new month/year
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username || user.email);
        }
    });
    
    updateFormDate();
}

// Firebase auto-sync toggle
function toggleFirebaseAutoSync() {
    const checkbox = document.getElementById('firebase-auto-sync');
    if (checkbox) {
        const isEnabled = checkbox.checked;
        localStorage.setItem('firebaseAutoSyncEnabled', isEnabled.toString());
        
        if (isEnabled) {
            showNotification('Firebase auto-sync enabled', 'success');
            if (typeof startAutoSync === 'function') {
                startAutoSync();
            }
        } else {
            showNotification('Firebase auto-sync disabled', 'info');
            if (typeof stopAutoSync === 'function') {
                stopAutoSync();
            }
        }
    }
}

// Save current month/year to localStorage
function saveCurrentMonth() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    localStorage.setItem('lastViewedMonth', month);
    localStorage.setItem('lastViewedYear', year);
}

// Load user data for current month
function loadUserData(userId) {
    console.log('Loading data for user:', userId);
    
    const userData = localStorage.getItem(`userData_${userId}`);
    
    if (userData) {
        const allData = JSON.parse(userData);
        loadCurrentMonthData(allData);
    } else {
        loadCurrentMonthData();
    }
    
    // Try to load from Firebase if online
    if (isOnline && typeof syncFromCloud === 'function') {
        setTimeout(() => {
            syncFromCloud().then(cloudData => {
                if (cloudData) {
                    console.log('Cloud data loaded successfully');
                }
            });
        }, 2000);
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
        console.log(`Loaded ${currentFormData.length} entries for ${monthYear}`);
    } else {
        console.log(`No data found for ${monthYear}`);
    }
    
    calculateTotal();
}

// Save user data
function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userId = user.username || user.email;
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
    
    // Auto-sync to Firebase if enabled
    const firebaseAutoSync = document.getElementById('firebase-auto-sync');
    if (firebaseAutoSync && firebaseAutoSync.checked && isOnline) {
        if (typeof syncToCloud === 'function') {
            setTimeout(() => {
                syncToCloud().then(success => {
                    if (success) {
                        console.log('Auto-synced to Firebase after save');
                    }
                });
            }, 1000);
        }
    }
    
    // Show save confirmation
    showNotification('Form data saved successfully!', 'success');
}

// Show notification
function showNotification(message, type = 'info') {
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
                     type === 'success' ? '#4CAF50' : 
                     type === 'warning' ? '#FF9800' : '#2196F3'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
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
        
        showNotification('Form cleared successfully', 'success');
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
        showNotification('Please select a date', 'error');
        return;
    }
    
    if (!inTime || !outTime) {
        showNotification('Please enter both IN and OUT times', 'error');
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
        showNotification('Entry updated successfully', 'success');
    } else {
        // Add new row
        addRowToTable(entryData);
        currentFormData.push(entryData);
        showNotification('Entry added successfully', 'success');
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
            showNotification('Entry deleted successfully', 'success');
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
    showNotification('PDF generated successfully', 'success');
}

// Export Data
function exportData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userId = user.username || user.email;
    const userData = localStorage.getItem(`userData_${userId}`);
    
    if (!userData) {
        showNotification('No data to export', 'error');
        return;
    }
    
    const exportData = {
        userData: JSON.parse(userData),
        exportDate: new Date().toISOString(),
        employeeName: user.employeeName || user.displayName || userId,
        userId: userId
    };
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `broiler_data_${userId}_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    showNotification('Data exported successfully!', 'success');
}

// Import Data Function
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
                
                const currentUser = localStorage.getItem('currentUser');
                let userId;
                
                if (currentUser) {
                    const user = JSON.parse(currentUser);
                    userId = user.username || user.email;
                    
                    // Check if the imported user matches current user
                    if (importData.userId && importData.userId !== userId) {
                        if (!confirm(`This backup is for user "${importData.userId}". Import anyway?`)) {
                            return;
                        }
                        userId = importData.userId;
                    }
                } else {
                    userId = importData.userId || prompt('Please enter your user ID/email:');
                    if (!userId) return;
                }
                
                // Apply the imported data
                localStorage.setItem(`userData_${userId}`, JSON.stringify(importData.userData));
                
                // Reload the current view
                loadUserData(userId);
                
                showNotification('Data imported successfully!', 'success');
                
                // Auto-sync the imported data to Firebase
                setTimeout(() => {
                    if (typeof syncToCloud === 'function' && isOnline) {
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

// Backup to Local Storage
function backupToLocal() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userId = user.username || user.email;
    const userData = localStorage.getItem(`userData_${userId}`);
    
    if (!userData) {
        showNotification('No data to backup', 'error');
        return;
    }
    
    // Create backup with timestamp
    const backup = {
        userId: userId,
        data: JSON.parse(userData),
        backupDate: new Date().toISOString(),
        backupType: 'manual',
        employeeName: user.employeeName || user.displayName || userId
    };
    
    const backupKey = `backup_${userId}_${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    
    // List all backups
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('backup_')) {
            backups.push(key);
        }
    }
    
    showNotification(`Backup created! Total backups: ${backups.length}`, 'success');
}

// Auto-sync functions
function toggleAutoSync() {
    const checkbox = document.getElementById('auto-sync');
    if (checkbox) {
        const isEnabled = checkbox.checked;
        localStorage.setItem('autoSyncEnabled', isEnabled.toString());
        
        if (isEnabled) {
            showNotification('Auto-sync enabled', 'success');
        } else {
            showNotification('Auto-sync disabled', 'info');
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

// Utility Functions
function saveForm() {
    saveUserData();
}

// Logout function - UPDATED
function logout() {
    console.log('🚪 Logging out...');
    
    // Sign out from Firebase if available and authenticated
    if (auth && auth.currentUser) {
        auth.signOut()
            .then(() => {
                console.log('✅ Signed out from Firebase');
            })
            .catch(error => {
                console.error('Firebase sign out error:', error);
            });
    }
    
    // Clear local storage (but keep some preferences)
    const keepItems = ['firebaseAutoSyncEnabled', 'autoSyncEnabled', 'lastViewedMonth', 'lastViewedYear'];
    const itemsToKeep = {};
    
    keepItems.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) itemsToKeep[key] = value;
    });
    
    // Clear everything
    localStorage.clear();
    
    // Restore kept items
    Object.keys(itemsToKeep).forEach(key => {
        localStorage.setItem(key, itemsToKeep[key]);
    });
    
    console.log('✅ Local storage cleared');
    
    // Redirect to auth page
    window.location.href = 'auth.html';
}

// Employee name memory
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

// Sync status display (for use by sync.js)
function updateSyncStatus(message, type = 'info') {
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus) {
        syncStatus.textContent = message;
        syncStatus.className = `sync-status sync-${type}`;
        syncStatus.style.display = 'block';
        
        setTimeout(() => {
            syncStatus.style.display = 'none';
        }, 5000);
    }
}

// Export functions for sync.js
window.updateSyncStatus = updateSyncStatus;
window.showNotification = showNotification;
