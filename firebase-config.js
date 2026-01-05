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

// Make functions globally available
window.importData = importData;
window.parseCSV = parseCSV;
window.saveImportedData = saveImportedData;
