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

// In app.js - Update autoLoginToFirebase function
async function autoLoginToFirebase() {
    console.log('🔄 Attempting Firebase auto-login...');
    
    if (!window.auth) {
        console.warn('Firebase Auth not available');
        return false;
    }
    
    // Check if already logged in
    if (auth.currentUser) {
        console.log('✅ Already logged in to Firebase:', auth.currentUser.email);
        return true;
    }
    
    // Get credentials from localStorage
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.warn('No user in localStorage');
        return false;
    }
    
    const user = JSON.parse(currentUser);
    const email = user.username || user.email;
    const password = user.password;
    const employeeName = user.employeeName;
    
    if (!email || !password) {
        console.warn('No email/password in localStorage');
        return false;
    }
    
    try {
        console.log(`Signing in to Firebase with: ${email}`);
        
        // Use the same ensureFirebaseAccount function
        if (typeof ensureFirebaseAccount === 'function') {
            const firebaseUser = await ensureFirebaseAccount(email, password, employeeName);
            if (firebaseUser) {
                console.log('✅ Firebase login successful:', firebaseUser.email);
                return true;
            }
        } else {
            // Fallback to direct sign in
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('✅ Firebase login successful:', userCredential.user.email);
            return true;
        }
        
    } catch (error) {
        console.error('❌ Firebase auto-login failed:', error.code, error.message);
        return false;
    }
    
    return false;
}

// Create new Firebase user if doesn't exist
async function createFirebaseUser(email, password, displayName) {
    try {
        console.log(`Creating new Firebase user: ${email}`);
        
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const firebaseUser = userCredential.user;
        
        // Set display name
        if (displayName) {
            await firebaseUser.updateProfile({
                displayName: displayName
            });
        }
        
        console.log('✅ New Firebase user created:', firebaseUser.email);
        
        // Update localStorage
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        currentUser.uid = firebaseUser.uid;
        currentUser.firebaseAuthenticated = true;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to create Firebase user:', error.message);
        return false;
    }
}

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
    setTimeout(async () => {
        await checkAuthentication();
    }, 1500);
    
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

// Update authentication status display
function updateAuthStatusDisplay() {
    const statusElement = document.getElementById('auth-status');
    const statusText = document.getElementById('auth-status-text');
    
    if (!statusElement || !statusText) return;
    
    if (!window.auth) {
        statusText.textContent = '❌ Firebase not loaded';
        statusElement.style.background = '#f8d7da';
        statusElement.style.color = '#721c24';
    } else if (auth.currentUser) {
        statusText.textContent = `✅ ${auth.currentUser.email}`;
        statusElement.style.background = '#d4edda';
        statusElement.style.color = '#155724';
    } else {
        statusText.textContent = '⚠️ Using localStorage';
        statusElement.style.background = '#fff3cd';
        statusElement.style.color = '#856404';
    }
    
    statusElement.style.display = 'block';
}

// Call this after authentication check
setTimeout(updateAuthStatusDisplay, 2000);

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

// Check if user is authenticated - COMPLETE VERSION
async function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    try {
        // Check Firebase auth status with retry logic
        const firebaseStatus = await getFirebaseAuthStatus();
        console.log('Firebase auth status:', firebaseStatus);
        
        if (firebaseStatus.status === 'authenticated') {
            console.log('✅ Firebase authentication successful');
            currentUser = {
                email: firebaseStatus.email,
                uid: firebaseStatus.uid,
                firebaseAuth: true
            };
            
            // Ensure user data is loaded
            await ensureUserDataExists(firebaseStatus.uid, firebaseStatus.email);
            
            // Show UI for authenticated user
            showAuthenticatedUI(firebaseStatus.email);
            return true;
        }
        
        // Fallback to localStorage auth
        const localUser = getLocalUser();
        if (localUser) {
            console.log('⚠️ Using localStorage authentication (Firebase unavailable):', localUser.email);
            
            currentUser = {
                email: localUser.email,
                uid: localUser.uid || `local-${Date.now()}`,
                firebaseAuth: false
            };
            
            showAuthenticatedUI(localUser.email);
            
            // Try to re-authenticate with Firebase in background
            setTimeout(async () => {
                await autoLoginToFirebase();
            }, 1000);
            
            return true;
        }
        
        // Not authenticated
        console.log('👤 No user authenticated');
        showLoginUI();
        return false;
        
    } catch (error) {
        console.error('Authentication check error:', error);
        showLoginUI();
        return false;
    }
}

// Improved Firebase auth status check
async function getFirebaseAuthStatus() {
    try {
        // Ensure Firebase is initialized
        await ensureFirebaseInitialized();
        
        // Wait a moment for auth state to settle
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const auth = firebase.auth();
        const user = auth.currentUser;
        
        if (user) {
            return {
                status: 'authenticated',
                email: user.email,
                uid: user.uid,
                provider: user.providerId
            };
        }
        
        // Check if auth state changes might be pending
        return new Promise((resolve) => {
            const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
                unsubscribe();
                
                if (firebaseUser) {
                    resolve({
                        status: 'authenticated',
                        email: firebaseUser.email,
                        uid: firebaseUser.uid,
                        provider: firebaseUser.providerId
                    });
                } else {
                    resolve({
                        status: 'not_authenticated',
                        email: null,
                        uid: null
                    });
                }
            });
            
            // Timeout after 2 seconds
            setTimeout(() => {
                unsubscribe();
                resolve({
                    status: 'not_authenticated',
                    email: null,
                    uid: null
                });
            }, 2000);
        });
        
    } catch (error) {
        console.error('getFirebaseAuthStatus error:', error);
        return {
            status: 'error',
            email: null,
            uid: null,
            error: error.message
        };
    }
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
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] ? values[index].trim() : '';
        });
        
        data.push(row);
    }
    
    return data;
}

async function handleCSVImport(csvData) {
    // Example: Convert CSV rows to your data structure
    const convertedData = csvData.map(row => ({
        id: row.id || generateId(),
        title: row.title || row.subject || '',
        description: row.description || row.notes || '',
        // Map other fields as needed
    }));
    
    // Save to localStorage
    localStorage.setItem('gradebookData', JSON.stringify(convertedData));
    
    // Update UI
    await loadData();
    renderTable();
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

function importData() {
    console.log('Broiler Project Claim Form Import');
    
    // Create file input
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
                
                if (fileName.endsWith('.json')) {
                    // Import JSON for Broiler Project
                    const claims = JSON.parse(content);
                    await saveClaimsToFirebase(claims);
                    alert(`Imported ${claims.length} claim records from JSON.`);
                    
                } else if (fileName.endsWith('.csv')) {
                    // Import CSV for Broiler Project
                    const claims = parseCSVClaims(content);
                    await saveClaimsToFirebase(claims);
                    alert(`Imported ${claims.length} claim records from CSV.`);
                    
                }
                
                // Refresh the table/data display
                if (typeof loadData === 'function') {
                    loadData();
                }
                
            } catch (error) {
                console.error('Import error:', error);
                alert(`Import failed: ${error.message}`);
            }
        };
        
        reader.readAsText(file);
    };
    
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// Parse CSV for Broiler Project Claims
function parseCSVClaims(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const claims = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const claim = {};
        
        headers.forEach((header, index) => {
            claim[header] = values[index] || '';
        });
        
        // Add metadata
        claim.importDate = new Date().toISOString();
        claim.importSource = 'csv';
        
        claims.push(claim);
    }
    
    return claims;
}

// Save claims to Firebase
async function saveClaimsToFirebase(claims) {
    console.log('💾 Attempting to save', claims.length, 'claims to Firebase');
    
    try {
        // Ensure user is authenticated with Firebase
        const auth = firebase.auth();
        const user = auth.currentUser;
        
        if (!user) {
            console.warn('No Firebase user, checking auth state...');
            
            // Try to get current user with retry
            await new Promise(resolve => setTimeout(resolve, 500));
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('User not authenticated with Firebase. Please login again.');
            }
        }
        
        const currentUser = auth.currentUser;
        console.log('Using Firebase user:', currentUser.email, currentUser.uid);
        
        // Use Firestore with error handling
        const db = firebase.firestore();
        const batch = db.batch();
        const claimsRef = db.collection('claims');
        
        // Prepare claims with user data
        claims.forEach((claim, index) => {
            const claimId = claim.id || `imported-${Date.now()}-${index}`;
            const docRef = claimsRef.doc(claimId);
            
            // Add metadata
            const claimData = {
                ...claim,
                userId: currentUser.uid,
                userEmail: currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                importDate: new Date().toISOString(),
                importSource: 'csv'
            };
            
            batch.set(docRef, claimData);
        });
        
        // Commit batch
        console.log('Committing batch of', claims.length, 'claims...');
        await batch.commit();
        console.log('✅ Successfully saved', claims.length, 'claims to Firebase');
        
        return true;
        
    } catch (error) {
        console.error('❌ Firebase save error:', error);
        
        // Check error type
        if (error.code === 'permission-denied') {
            console.error('Firestore permissions error. Please check:');
            console.error('1. Firestore security rules');
            console.error('2. User authentication status');
            console.error('3. Collection name is correct');
            
            // Fallback to localStorage
            await saveClaimsToLocalStorage(claims);
            return false;
        }
        
        throw error;
    }
}

// Fallback localStorage save
async function saveClaimsToLocalStorage(claims) {
    console.log('💾 Saving to localStorage as fallback');
    
    const existing = JSON.parse(localStorage.getItem('broilerClaims') || '[]');
    const userEmail = localStorage.getItem('userEmail') || 'unknown';
    
    // Add metadata
    const claimsWithMeta = claims.map(claim => ({
        ...claim,
        userId: `local-${userEmail}`,
        userEmail: userEmail,
        createdAt: new Date().toISOString(),
        importSource: 'csv-localstorage',
        needsSync: true
    }));
    
    const updated = [...existing, ...claimsWithMeta];
    localStorage.setItem('broilerClaims', JSON.stringify(updated));
    
    // Store in pending sync
    const pending = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    pending.push(...claimsWithMeta);
    localStorage.setItem('pendingSync', JSON.stringify(pending));
    
    console.log('✅ Saved', claims.length, 'claims to localStorage');
    console.log('📋 Total claims in localStorage:', updated.length);
    
    // Notify user
    alert(`Imported ${claims.length} claims. Saved to local storage (Firebase sync pending).`);
    
    return true;
}

// ===== MISSING FUNCTIONS - ADD THESE TO app.js =====

// Helper: Get local user from localStorage
function getLocalUser() {
    try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            return JSON.parse(savedUser);
        }
        
        // Fallback to old format
        const email = localStorage.getItem('userEmail');
        if (email) {
            return {
                email: email,
                uid: localStorage.getItem('userUid') || `local-${Date.now()}`,
                firebaseAuth: localStorage.getItem('firebaseAuth') === 'true'
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error getting local user:', error);
        return null;
    }
}

// Helper: Show login UI
function showLoginUI() {
    console.log('Showing login UI');
    
    // Hide main content, show login form
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('login-form-container');
    
    if (mainContent) mainContent.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('show-login-ui'));
}

// Helper: Show authenticated UI
function showAuthenticatedUI(email) {
    console.log('Showing authenticated UI for:', email);
    
    // Show main content, hide login form
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('login-form-container');
    const userEmailSpan = document.getElementById('user-email');
    
    if (mainContent) mainContent.style.display = 'block';
    if (loginForm) loginForm.style.display = 'none';
    if (userEmailSpan) userEmailSpan.textContent = email;
    
    // Update any UI elements
    updateUIForUser(email);
}

// Helper: Update UI for authenticated user
function updateUIForUser(email) {
    // Update welcome message
    const welcomeMsg = document.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Welcome, ${email}`;
    }
    
    // Enable buttons
    const actionButtons = document.querySelectorAll('button:not(.logout-btn)');
    actionButtons.forEach(btn => {
        btn.disabled = false;
    });
}

// Helper: Ensure Firebase is initialized
async function ensureFirebaseInitialized() {
    if (typeof window.initializeFirebase === 'function') {
        return window.initializeFirebase();
    }
    
    // Manual initialization
    if (firebase.apps.length === 0) {
        console.log('Manually initializing Firebase...');
        
        const firebaseConfig = {
            apiKey: "AIzaSyDqoH0LgIIB2q4A8WH9f5RgopVEWqRKmAg",
            authDomain: "edumatrix-sync.firebaseapp.com",
            projectId: "edumatrix-sync",
            storageBucket: "edumatrix-sync.firebasestorage.app",
            messagingSenderId: "962108806962",
            appId: "1:962108806962:web:2d0bd9ba7fa5b55f1bd52e"
        };
        
        const app = firebase.initializeApp(firebaseConfig);
        console.log('✅ Firebase manually initialized');
        return { 
            app, 
            firestore: firebase.firestore(), 
            auth: firebase.auth() 
        };
    }
    
    return { 
        app: firebase.app(), 
        firestore: firebase.firestore(), 
        auth: firebase.auth() 
    };
}

// Updated checkAuthentication function
async function checkAuthentication() {
    console.log('🔐 Checking authentication...');
    
    try {
        // First check localStorage
        const localUser = getLocalUser();
        if (localUser && localUser.email) {
            console.log('✅ Found local user:', localUser.email);
            
            currentUser = {
                email: localUser.email,
                uid: localUser.uid || `local-${Date.now()}`,
                firebaseAuth: localUser.firebaseAuth || false
            };
            
            showAuthenticatedUI(localUser.email);
            
            // Try Firebase in background
            setTimeout(async () => {
                try {
                    await ensureFirebaseInitialized();
                    const auth = firebase.auth();
                    const firebaseUser = auth.currentUser;
                    
                    if (firebaseUser && firebaseUser.email === localUser.email) {
                        console.log('✅ Firebase also authenticated');
                        currentUser.firebaseAuth = true;
                        currentUser.uid = firebaseUser.uid;
                    }
                } catch (error) {
                    console.log('Firebase background check failed:', error.message);
                }
            }, 1000);
            
            return true;
        }
        
        // No local user, show login
        console.log('👤 No user found, showing login');
        showLoginUI();
        return false;
        
    } catch (error) {
        console.error('Authentication check error:', error);
        showLoginUI();
        return false;
    }
}

// ===== FIXED IMPORT FUNCTION =====

function importData() {
    console.log('📁 Import button clicked');
    
    // Create file input
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
                
                // Save data
                await saveImportedData(data);
                
                alert(`✅ Successfully imported ${data.length} items`);
                
                // Refresh display
                if (typeof loadData === 'function') {
                    loadData();
                }
                
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

// Parse CSV
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

// Save imported data
async function saveImportedData(data) {
    console.log('💾 Saving imported data...');
    
    // Get current data
    const existingData = JSON.parse(localStorage.getItem('broilerData') || '[]');
    
    // Add metadata to imported data
    const dataWithMeta = data.map(item => ({
        ...item,
        importedAt: new Date().toISOString(),
        importedBy: currentUser?.email || 'unknown'
    }));
    
    // Combine with existing data
    const combinedData = [...existingData, ...dataWithMeta];
    
    // Save to localStorage
    localStorage.setItem('broilerData', JSON.stringify(combinedData));
    
    console.log('✅ Saved', dataWithMeta.length, 'items to localStorage');
    console.log('📊 Total items now:', combinedData.length);
    
    // Try to sync with Firebase if available
    if (currentUser?.firebaseAuth && typeof firebase !== 'undefined') {
        try {
            await syncToFirebase(dataWithMeta);
        } catch (error) {
            console.log('Firebase sync optional, continuing:', error.message);
        }
    }
    
    return combinedData;
}

// Sync to Firebase (optional)
async function syncToFirebase(data) {
    if (!firebase.apps.length || !firebase.auth().currentUser) {
        console.log('Firebase not available for sync');
        return;
    }
    
    const user = firebase.auth().currentUser;
    const db = firebase.firestore();
    const batch = db.batch();
    const collectionRef = db.collection('broilerClaims');
    
    data.forEach((item, index) => {
        const docId = item.id || `import-${Date.now()}-${index}`;
        const docRef = collectionRef.doc(docId);
        
        const firebaseItem = {
            ...item,
            userId: user.uid,
            userEmail: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        batch.set(docRef, firebaseItem);
    });
    
    await batch.commit();
    console.log('✅ Synced', data.length, 'items to Firebase');
}

// ===== LOGIN SYSTEM =====

// Initialize login system
function initLoginSystem() {
    console.log('🔐 Initializing login system...');
    
    // Check if we're on auth.html or main page
    const isAuthPage = window.location.pathname.includes('auth.html');
    
    if (isAuthPage) {
        setupAuthPage();
    } else {
        setupMainPageLogin();
    }
}

// Setup auth.html page
function setupAuthPage() {
    console.log('Setting up auth page...');
    
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginLink = document.getElementById('login-link');
    const signupLink = document.getElementById('signup-link');
    const authError = document.getElementById('auth-error');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('signup-section').style.display = 'none';
        });
    }
    
    if (signupLink) {
        signupLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('signup-section').style.display = 'block';
        });
    }
    
    // Pre-fill email if available
    const savedEmail = localStorage.getItem('userEmail');
    const loginEmailInput = document.getElementById('login-email');
    if (loginEmailInput && savedEmail) {
        loginEmailInput.value = savedEmail;
    }
}

// Setup main page login
function setupMainPageLogin() {
    console.log('Setting up main page login...');
    
    // Create login form if it doesn't exist
    if (!document.getElementById('login-form-container')) {
        createLoginForm();
    }
    
    // Check if user is already logged in
    checkExistingLogin();
}

// Create login form for main page
function createLoginForm() {
    const container = document.createElement('div');
    container.id = 'login-form-container';
    container.className = 'login-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
    `;
    
    container.innerHTML = `
        <div class="login-box" style="
            background: white;
            padding: 30px;
            border-radius: 10px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        ">
            <h2 style="margin-top: 0; color: #333;">Login Required</h2>
            <p style="color: #666; margin-bottom: 20px;">Please login to access the Broiler Project Claim Form</p>
            
            <form id="quick-login-form">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Email</label>
                    <input type="email" id="quick-email" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; color: #333;">Password</label>
                    <input type="password" id="quick-password" required 
                           style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                </div>
                
                <div style="display: flex; gap: 10px;">
                    <button type="submit" style="
                        flex: 1;
                        padding: 12px;
                        background: #4CAF50;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Login</button>
                    
                    <button type="button" id="quick-signup-btn" style="
                        flex: 1;
                        padding: 12px;
                        background: #2196F3;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Sign Up</button>
                </div>
                
                <div id="quick-auth-error" style="
                    margin-top: 15px;
                    padding: 10px;
                    background: #ffebee;
                    color: #c62828;
                    border-radius: 5px;
                    display: none;
                "></div>
                
                <p style="margin-top: 20px; font-size: 12px; color: #888;">
                    <a href="auth.html" style="color: #2196F3; text-decoration: none;">
                        Go to full authentication page
                    </a>
                </p>
            </form>
        </div>
    `;
    
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('quick-login-form').addEventListener('submit', handleQuickLogin);
    document.getElementById('quick-signup-btn').addEventListener('click', handleQuickSignup);
    
    // Pre-fill email
    const savedEmail = localStorage.getItem('userEmail');
    const emailInput = document.getElementById('quick-email');
    if (emailInput && savedEmail) {
        emailInput.value = savedEmail;
    }
}

// Handle quick login
async function handleQuickLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('quick-email').value;
    const password = document.getElementById('quick-password').value;
    const errorDiv = document.getElementById('quick-auth-error');
    
    errorDiv.style.display = 'none';
    
    try {
        console.log('Quick login attempt:', email);
        
        // Try Firebase login
        let firebaseUser = null;
        try {
            const auth = firebase.auth();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            firebaseUser = userCredential.user;
            console.log('Firebase login successful');
        } catch (firebaseError) {
            console.log('Firebase login failed, using local auth');
        }
        
        // Create user object
        currentUser = {
            email: email,
            password: password,
            uid: firebaseUser ? firebaseUser.uid : `local-${Date.now()}`,
            firebaseAuth: !!firebaseUser,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        
        console.log('Login successful:', currentUser);
        
        // Hide login form
        document.getElementById('login-form-container').style.display = 'none';
        
        // Show main content
        showAuthenticatedUI(email);
        
        // Refresh data
        if (typeof loadData === 'function') {
            loadData();
        }
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

// Handle quick signup
async function handleQuickSignup() {
    const email = document.getElementById('quick-email').value;
    const password = document.getElementById('quick-password').value;
    const errorDiv = document.getElementById('quick-auth-error');
    
    if (!email || !password) {
        errorDiv.textContent = 'Please enter email and password';
        errorDiv.style.display = 'block';
        return;
    }
    
    errorDiv.style.display = 'none';
    
    try {
        console.log('Quick signup attempt:', email);
        
        // Try Firebase signup
        let firebaseUser = null;
        try {
            const auth = firebase.auth();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            firebaseUser = userCredential.user;
            console.log('Firebase signup successful');
        } catch (firebaseError) {
            console.log('Firebase signup failed, using local auth:', firebaseError.message);
        }
        
        // Create user object
        currentUser = {
            email: email,
            password: password,
            uid: firebaseUser ? firebaseUser.uid : `local-${Date.now()}`,
            firebaseAuth: !!firebaseUser,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        
        console.log('Signup successful:', currentUser);
        
        // Hide login form
        document.getElementById('login-form-container').style.display = 'none';
        
        // Show main content
        showAuthenticatedUI(email);
        
        // Refresh data
        if (typeof loadData === 'function') {
            loadData();
        }
        
    } catch (error) {
        console.error('Signup error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

// Check existing login
function checkExistingLogin() {
    const savedUser = localStorage.getItem('currentUser');
    const savedEmail = localStorage.getItem('userEmail');
    
    if (savedUser || savedEmail) {
        try {
            const user = savedUser ? JSON.parse(savedUser) : { email: savedEmail };
            console.log('Found existing user:', user.email);
            
            currentUser = {
                email: user.email,
                uid: user.uid || `local-${Date.now()}`,
                firebaseAuth: user.firebaseAuth || false
            };
            
            showAuthenticatedUI(user.email);
            return true;
        } catch (error) {
            console.error('Error parsing saved user:', error);
        }
    }
    
    return false;
}

// Handle login form submission (auth.html)
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    errorDiv.style.display = 'none';
    
    try {
        console.log('Login attempt:', email);
        
        // Try Firebase login
        let firebaseUser = null;
        try {
            const auth = firebase.auth();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            firebaseUser = userCredential.user;
            console.log('Firebase login successful');
        } catch (firebaseError) {
            console.log('Firebase login failed, using local auth');
        }
        
        // Create user object
        currentUser = {
            email: email,
            password: password,
            uid: firebaseUser ? firebaseUser.uid : `local-${Date.now()}`,
            firebaseAuth: !!firebaseUser,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        
        console.log('Login successful:', currentUser);
        
        // Redirect to main page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

// Handle signup form submission (auth.html)
async function handleSignup(e) {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const errorDiv = document.getElementById('auth-error');
    
    errorDiv.style.display = 'none';
    
    try {
        console.log('Signup attempt:', email);
        
        // Try Firebase signup
        let firebaseUser = null;
        try {
            const auth = firebase.auth();
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            firebaseUser = userCredential.user;
            console.log('Firebase signup successful');
        } catch (firebaseError) {
            console.log('Firebase signup failed, using local auth:', firebaseError.message);
        }
        
        // Create user object
        currentUser = {
            email: email,
            password: password,
            uid: firebaseUser ? firebaseUser.uid : `local-${Date.now()}`,
            firebaseAuth: !!firebaseUser,
            timestamp: new Date().toISOString()
        };
        
        // Save to localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userPassword', password);
        
        console.log('Signup successful:', currentUser);
        
        // Redirect to main page
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Signup error:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}

// Logout function
function logout() {
    console.log('Logging out...');
    
    // Sign out from Firebase if available
    if (firebase.auth) {
        firebase.auth().signOut().catch(console.error);
    }
    
    // Clear local data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    
    currentUser = null;
    
    // Show login form
    const loginContainer = document.getElementById('login-form-container');
    if (loginContainer) {
        loginContainer.style.display = 'flex';
    } else {
        createLoginForm();
    }
    
    // Clear UI
    showLoginUI();
    
    console.log('Logout complete');
}

// Make logout available globally
window.logout = logout;

// Make functions globally available
window.importData = importData;
window.parseCSV = parseCSV;
window.saveImportedData = saveImportedData;

// Make functions globally available
window.importData = importData;
window.parseCSVClaims = parseCSVClaims;
window.saveClaimsToFirebase = saveClaimsToFirebase;

// Export functions for sync.js
window.updateSyncStatus = updateSyncStatus;
window.showNotification = showNotification;
