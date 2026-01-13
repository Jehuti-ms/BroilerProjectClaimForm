// app.js - SIMPLEST WORKING VERSION
console.log('📋 APP.JS LOADED - SIMPLE VERSION');

// Basic variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded, checking auth...');
    
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log('No user, redirecting to login...');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        console.log('User logged in:', user.username || user.email);
        
        // Update UI
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = `Welcome, ${user.employeeName || user.username || 'User'}`;
        }
        
        const employeeNameInput = document.getElementById('employee-name');
        if (employeeNameInput) {
            employeeNameInput.value = user.employeeName || user.username || '';
        }
        
        // Setup basic event listeners
        setupBasicApp();
        
        // Load any existing data
        loadBasicData(user);
        
    } catch (error) {
        console.error('Auth error:', error);
        window.location.href = 'auth.html';
    }
});

function setupBasicApp() {
    console.log('Setting up basic app...');
    
    // Month/year change
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect) {
        monthSelect.addEventListener('change', function() {
            updateFormDate();
        });
    }
    
    if (yearInput) {
        yearInput.addEventListener('change', function() {
            updateFormDate();
        });
    }
    
    // Load last viewed month
    const lastMonth = localStorage.getItem('lastViewedMonth');
    const lastYear = localStorage.getItem('lastViewedYear');
    
    if (lastMonth !== null && monthSelect) {
        monthSelect.value = lastMonth;
    }
    if (lastYear !== null && yearInput) {
        yearInput.value = lastYear;
    }
    
    updateFormDate();
}

function loadBasicData(user) {
    console.log('Loading data for user:', user.username || user.email);
    
    const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
    const userData = localStorage.getItem(`userData_${username}`);
    
    if (userData) {
        try {
            const allData = JSON.parse(userData);
            loadCurrentMonthBasic(allData);
        } catch (e) {
            console.log('Error parsing data, starting fresh');
            loadCurrentMonthBasic();
        }
    } else {
        console.log('No data found, starting fresh');
        loadCurrentMonthBasic();
    }
}

function loadCurrentMonthBasic(allData = null) {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    console.log('Loading data for:', monthYear);
    
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (allData && allData[monthYear]) {
        allData[monthYear].forEach(entry => {
            addBasicRow(entry);
            currentFormData.push(entry);
        });
    }
    
    calculateBasicTotal();
}

function addBasicRow(data) {
    const tableBody = document.querySelector('#time-table tbody');
    if (!tableBody) return;
    
    const rowIndex = tableBody.children.length;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${formatBasicDate(data.date)}</td>
        <td>${data.amPm || ''}</td>
        <td>${formatBasicTime(data.inTime)}</td>
        <td>${formatBasicTime(data.outTime)}</td>
        <td>${data.hours || '0:00'}</td>
        <td>
            <button class="edit-btn" onclick="editRow(${rowIndex})">Edit</button>
            <button class="delete-btn" onclick="deleteBasicRow(${rowIndex})">Delete</button>
        </td>
    `;
    
    tableBody.appendChild(row);
}

// BASIC FUNCTIONS THAT WILL WORK
function updateFormDate() {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const formDate = document.getElementById('form-date');
    
    if (formDate) {
        formDate.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Save current selection
    localStorage.setItem('lastViewedMonth', month);
    localStorage.setItem('lastViewedYear', year);
}

function formatBasicDate(dateString) {
    if (!dateString) return '';
    if (dateString.includes('/')) return dateString;
    
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatBasicTime(time) {
    if (!time) return '';
    if (time.includes('AM') || time.includes('PM')) return time;
    
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

function calculateBasicTotal() {
    const rows = document.querySelectorAll('#time-table tbody tr');
    let totalMinutes = 0;
    
    rows.forEach(row => {
        const hoursText = row.cells[4].textContent;
        if (hoursText && hoursText.includes(':')) {
            const [hours, minutes] = hoursText.split(':').map(Number);
            totalMinutes += hours * 60 + (minutes || 0);
        }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const totalHoursElement = document.getElementById('total-hours');
    if (totalHoursElement) {
        totalHoursElement.textContent = `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    }
}

function saveBasicData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;
    
    const user = JSON.parse(currentUser);
    const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    // Get existing data
    const existingData = localStorage.getItem(`userData_${username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Update current month
    allData[monthYear] = currentFormData;
    
    // Save
    localStorage.setItem(`userData_${username}`, JSON.stringify(allData));
    
    alert('✅ Form saved successfully!');
}

// Make functions available globally
window.openModal = function(rowIndex = null) {
    console.log('Opening modal for row:', rowIndex);
    // Simple modal - you can implement this
    alert('Modal would open here. For now, use Add New Entry button.');
};

window.closeModal = function() {
    console.log('Closing modal');
};

window.saveEntry = function() {
    // Simple entry saving
    const date = prompt('Enter date (YYYY-MM-DD):');
    if (!date) return;
    
    const entry = {
        date: date,
        amPm: 'AM',
        inTime: '08:00',
        outTime: '17:00',
        hours: '9:00'
    };
    
    addBasicRow(entry);
    currentFormData.push(entry);
    saveBasicData();
    calculateBasicTotal();
};

window.editRow = function(rowIndex) {
    alert(`Would edit row ${rowIndex}. For now, delete and add new.`);
};

window.deleteBasicRow = function(rowIndex) {
    if (confirm('Delete this entry?')) {
        const rows = document.querySelectorAll('#time-table tbody tr');
        if (rows[rowIndex]) {
            rows[rowIndex].remove();
            currentFormData.splice(rowIndex, 1);
            saveBasicData();
            calculateBasicTotal();
        }
    }
};

window.clearForm = function() {
    if (confirm('Clear all entries?')) {
        const tableBody = document.querySelector('#time-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
            currentFormData = [];
            document.getElementById('total-hours').textContent = '0:00';
            saveBasicData();
        }
    }
};

window.calculateTotal = calculateBasicTotal;
window.saveForm = saveBasicData;

window.generatePDF = function() {
    alert('PDF generation would work here with full app.');
};

window.exportData = function() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const username = user.username || (user.email ? user.email.split('@')[0] : 'user');
    const userData = localStorage.getItem(`userData_${username}`);
    
    if (!userData) {
        alert('No data to export');
        return;
    }
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(userData);
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `broiler_data_${username}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    alert('✅ Data exported!');
};

window.importData = function() {
    alert('Import would work here. For now, manually add entries.');
};

window.logout = function() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
};

console.log('✅ Basic app.js loaded successfully');
