// Update the initializeApp function to fix the month/year change issue
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
        reloadUserData(); // This should load data for the new month
    });
    
    document.getElementById('year-input').addEventListener('change', function() {
        updateFormDate();
        saveCurrentMonth();
        reloadUserData(); // This should load data for the new year
    });
    
    updateFormDate();
    
    // Load initial data for current month/year
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        loadUserData(user.username);
    }
}

// Update the reloadUserData function to properly load the correct month
function reloadUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        loadUserData(user.username);
    }
}

// Update the loadUserData function to ensure it loads the correct month
function loadUserData(username) {
    const userData = localStorage.getItem(`userData_${username}`);
    
    if (userData) {
        const allData = JSON.parse(userData);
        loadCurrentMonthData(allData);
    } else {
        loadCurrentMonthData(); // Load empty table if no data
    }
}

// Update the loadCurrentMonthData function to be more robust
function loadCurrentMonthData(allData = null) {
    const month = parseInt(document.getElementById('month-select').value);
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) {
        console.error('Table body not found');
        return;
    }
    
    // Clear the table
    tableBody.innerHTML = '';
    currentFormData = [];
    
    console.log('Loading data for:', monthYear, 'from:', allData);
    
    if (allData && allData[monthYear]) {
        // Load saved data for this month
        console.log('Found data for month:', allData[monthYear]);
        allData[monthYear].forEach(entry => {
            addRowToTable(entry);
            currentFormData.push(entry);
        });
    } else {
        console.log('No data found for month:', monthYear);
    }
    
    calculateTotal();
}

// Update the saveUserData function to ensure it saves to the correct structure
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
    
    console.log('Saved data for month:', monthYear, 'data:', currentFormData);
    
    // Show save confirmation
    showNotification('Form data saved successfully!');
}

// Add a debug function to check what's stored
function debugStorage() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        const userData = localStorage.getItem(`userData_${user.username}`);
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        const monthYear = `${month}-${year}`;
        
        console.log('=== DEBUG STORAGE ===');
        console.log('Current user:', user.username);
        console.log('Current month/year:', monthYear);
        console.log('All user data:', userData ? JSON.parse(userData) : 'No data');
        console.log('Current form data:', currentFormData);
        
        if (userData) {
            const allData = JSON.parse(userData);
            console.log('Data for current month:', allData[monthYear]);
        }
    }
}

// Test function to add sample data for testing
function addTestData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // Get existing user data
    const existingData = localStorage.getItem(`userData_${user.username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Add test data for current month
    allData[monthYear] = [
        {
            date: `${year}-${String(month).padStart(2, '0')}-01`,
            amPm: 'AM',
            inTime: '08:00',
            outTime: '12:00',
            hours: '4:00'
        },
        {
            date: `${year}-${String(month).padStart(2, '0')}-02`,
            amPm: 'PM',
            inTime: '13:00',
            outTime: '17:00',
            hours: '4:00'
        }
    ];
    
    // Save back to localStorage
    localStorage.setItem(`userData_${user.username}`, JSON.stringify(allData));
    
    // Reload the data
    loadUserData(user.username);
    
    showNotification('Test data added for current month!');
}

// Update the DOMContentLoaded to ensure proper initialization
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initCloudSync();
    
    // Add debug button for testing (remove in production)
    const debugButton = document.createElement('button');
    debugButton.textContent = 'Debug Storage';
    debugButton.style.position = 'fixed';
    debugButton.style.bottom = '10px';
    debugButton.style.right = '10px';
    debugButton.style.zIndex = '1000';
    debugButton.style.background = '#ff9800';
    debugButton.style.color = 'white';
    debugButton.style.border = 'none';
    debugButton.style.padding = '5px 10px';
    debugButton.style.borderRadius = '3px';
    debugButton.onclick = debugStorage;
    document.body.appendChild(debugButton);
    
    // Add test data button (remove in production)
    const testButton = document.createElement('button');
    testButton.textContent = 'Add Test Data';
    testButton.style.position = 'fixed';
    testButton.style.bottom = '10px';
    testButton.style.right = '120px';
    testButton.style.zIndex = '1000';
    testButton.style.background = '#4CAF50';
    testButton.style.color = 'white';
    testButton.style.border = 'none';
    testButton.style.padding = '5px 10px';
    testButton.style.borderRadius = '3px';
    testButton.onclick = addTestData;
    document.body.appendChild(testButton);
});
