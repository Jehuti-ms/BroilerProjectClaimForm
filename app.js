// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Firebase state
let firebaseUser = null;
let isOnline = navigator.onLine;
let currentUser = null;

// ==================== AUTHENTICATION INTEGRATION ====================

// This function is called after successful login from auth.html
function handleUserLogin(userData) {
    console.log('Handling user login:', userData.email);
    
    currentUser = {
        email: userData.email,
        uid: userData.uid || `local-${Date.now()}`,
        firebaseAuth: userData.firebaseAuth || false,
        employeeName: userData.employeeName || userData.displayName || ''
    };
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    if (userData.password) {
        localStorage.setItem('userPassword', userData.password);
    }
    
    // Initialize Firebase if not already
    if (typeof initializeFirebase === 'function') {
        initializeFirebase();
    }
    
    // Setup Firebase auth listener
    setupFirebaseAuthListener();
    
    // Show authenticated UI
    showAuthenticatedUI(currentUser.email);
    
    // Load user data
    loadUserData(currentUser.email);
}

// Setup Firebase auth listener
function setupFirebaseAuthListener() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.log('Firebase not available for auth listener');
        return;
    }
    
    firebase.auth().onAuthStateChanged((user) => {
        firebaseUser = user;
        console.log('Firebase auth state changed:', user ? user.email : 'No user');
        
        if (user && currentUser && currentUser.email === user.email) {
            // Update current user with Firebase info
            currentUser.uid = user.uid;
            currentUser.firebaseAuth = true;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update UI
            const userDisplay = document.getElementById('user-display');
            if (userDisplay) {
                userDisplay.innerHTML = `Welcome, ${user.displayName || user.email} <span style="color: #4CAF50;">(Firebase)</span>`;
            }
        }
    });
}

// Check authentication on page load
function checkAuthOnLoad() {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
        try {
            const userData = JSON.parse(savedUser);
            currentUser = userData;
            
            // If user has Firebase auth, try to initialize
            if (userData.firebaseAuth && typeof initializeFirebase === 'function') {
                initializeFirebase();
            }
            
            showAuthenticatedUI(userData.email);
            return true;
            
        } catch (error) {
            console.error('Error parsing saved user:', error);
        }
    }
    
    // No user found
    console.log('No authenticated user found');
    return false;
}

// ==================== MAIN APP INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('App.js loading...');
    
    // Check authentication first
    const isAuthenticated = checkAuthOnLoad();
    
    if (isAuthenticated) {
        // Initialize Firebase auth listener
        setTimeout(setupFirebaseAuthListener, 1000);
        
        // Setup network monitoring
        setupNetworkMonitoring();
        
        // Setup employee name memory
        setupEmployeeNameMemory();
        
        // Initialize app
        initializeApp();
    } else {
        // Not authenticated - check if we should redirect
        if (!window.location.pathname.includes('auth.html')) {
            console.log('Redirecting to auth page...');
            setTimeout(() => {
                window.location.href = 'auth.html';
            }, 1000);
        }
    }
});

// ==================== FIREBASE SYNC INTEGRATION ====================

// This function saves data and triggers Firebase sync if available
function saveDataWithSync() {
    saveUserData(); // Your existing save function
    
    // Trigger Firebase sync if available and enabled
    if (isOnline && firebaseUser) {
        const autoSyncCheckbox = document.getElementById('firebase-auto-sync');
        if (autoSyncCheckbox && autoSyncCheckbox.checked) {
            // Use sync.js function if available
            if (typeof syncToCloud === 'function') {
                setTimeout(() => {
                    syncToCloud();
                }, 1000);
            } else {
                // Fallback direct sync
                syncDataToFirebaseDirect();
            }
        }
    }
}

// Direct Firebase sync (fallback if sync.js not available)
async function syncDataToFirebaseDirect() {
    if (!firebaseUser || !firebase.firestore) {
        console.log('Firebase not available for sync');
        return;
    }
    
    try {
        const userId = firebaseUser.uid;
        const month = parseInt(document.getElementById('month-select').value);
        const year = document.getElementById('year-input').value;
        const monthYear = `${month}-${year}`;
        
        const db = firebase.firestore();
        const userRef = db.collection('users').doc(userId);
        const dataRef = userRef.collection('timeData').doc(monthYear);
        
        const dataToSave = {
            userId: userId,
            userEmail: firebaseUser.email,
            monthYear: monthYear,
            data: currentFormData,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await dataRef.set(dataToSave, { merge: true });
        console.log('✅ Data synced to Firebase');
        showNotification('Data synced to cloud', 'success');
        
    } catch (error) {
        console.error('Firebase sync error:', error);
        showNotification('Cloud sync failed - saved locally', 'warning');
    }
}

// ==================== IMPORT/EXPORT INTEGRATION ====================

function importData() {
    console.log('📁 Import button clicked');
    
    if (!currentUser) {
        alert('Please login first!');
        window.location.href = 'auth.html';
        return;
    }
    
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
                
                let importedData;
                if (fileName.endsWith('.json')) {
                    importedData = JSON.parse(content);
                } else if (fileName.endsWith('.csv')) {
                    importedData = parseCSV(content);
                } else {
                    alert('Please select .json or .csv file');
                    return;
                }
                
                // Process imported data
                await processImportedData(importedData);
                
                alert(`✅ Successfully imported ${importedData.length} items`);
                
                // Refresh display
                loadUserData(currentUser.email);
                
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

async function processImportedData(data) {
    // Process based on your data structure
    const processedData = data.map(item => {
        // Transform to your time entry format
        return {
            date: item.date || item.Date || '',
            amPm: item.amPm || item['AM/PM'] || 'AM',
            inTime: item.inTime || item['Time In'] || '',
            outTime: item.outTime || item['Time Out'] || '',
            hours: item.hours || item.Hours || '0:00'
        };
    });
    
    // Add to current data
    currentFormData = [...currentFormData, ...processedData];
    
    // Save to localStorage
    saveUserData();
    
    // Sync to Firebase if available
    if (firebaseUser) {
        try {
            await syncDataToFirebaseDirect();
        } catch (error) {
            console.log('Firebase sync optional:', error.message);
        }
    }
}

// ==================== INTEGRATION WITH EXISTING FUNCTIONS ====================

// Update your existing saveUserData function to include sync
function saveUserData() {
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const userId = currentUser.email;
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // Get existing user data
    const userDataKey = `userData_${userId}`;
    const existingData = localStorage.getItem(userDataKey);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Update data for current month
    allData[monthYear] = currentFormData;
    
    // Save back to localStorage
    localStorage.setItem(userDataKey, JSON.stringify(allData));
    
    showNotification('Form data saved successfully!', 'success');
    
    // Return the saved data for potential sync
    return allData;
}

// Update your existing loadUserData to check Firebase
function loadUserData(userId) {
    console.log('Loading data for user:', userId);
    
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // First try localStorage
    const userDataKey = `userData_${userId}`;
    const userData = localStorage.getItem(userDataKey);
    
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (userData) {
        const allData = JSON.parse(userData);
        if (allData[monthYear]) {
            allData[monthYear].forEach(entry => {
                addRowToTable(entry);
                currentFormData.push(entry);
            });
            console.log(`Loaded ${currentFormData.length} entries from localStorage`);
        }
    }
    
    calculateTotal();
    
    // Then try Firebase if available and online
    if (isOnline && firebaseUser) {
        // Check sync.js for cloud sync, or use direct method
        if (typeof syncFromCloud === 'function') {
            setTimeout(() => {
                syncFromCloud();
            }, 2000);
        }
    }
}

// ==================== NETWORK MONITORING ====================

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
                } else {
                    syncDataToFirebaseDirect();
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

// ==================== GLOBAL EXPORTS ====================

// Make functions available for other scripts
window.handleUserLogin = handleUserLogin;
window.importData = importData;
window.saveDataWithSync = saveDataWithSync;
window.checkAuthOnLoad = checkAuthOnLoad;

// Keep your existing exports
window.openModal = openModal;
window.closeModal = closeModal;
window.saveEntry = saveEntry;
window.deleteRow = deleteRow;
window.clearForm = clearForm;
window.saveForm = saveUserData; // This now uses the updated version
window.generatePDF = generatePDF;
window.logout = logout;
