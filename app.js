// Global variables
let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Initialize sample data for October 2025
const sampleData = [
    { date: '2025-10-04', amPm: 'AM', inTime: '07:00', outTime: '10:00', hours: '3:00' },
    { date: '2025-10-04', amPm: 'PM', inTime: '15:00', outTime: '17:00', hours: '2:00' },
    { date: '2025-10-05', amPm: 'AM', inTime: '08:00', outTime: '10:00', hours: '2:00' },
    { date: '2025-10-05', amPm: 'PM', inTime: '15:00', outTime: '17:00', hours: '2:00' },
    { date: '2025-10-11', amPm: 'AM', inTime: '08:00', outTime: '12:00', hours: '4:00' },
    { date: '2025-10-11', amPm: 'PM', inTime: '', outTime: '', hours: '0:00' },
    { date: '2025-10-12', amPm: 'AM', inTime: '09:00', outTime: '13:00', hours: '4:00' },
    { date: '2025-10-12', amPm: 'PM', inTime: '16:00', outTime: '18:00', hours: '2:00' },
    { date: '2025-10-18', amPm: 'AM', inTime: '08:00', outTime: '12:00', hours: '4:00' },
    { date: '2025-10-18', amPm: 'PM', inTime: '16:00', outTime: '18:00', hours: '2:00' },
    { date: '2025-10-19', amPm: 'AM', inTime: '07:30', outTime: '10:30', hours: '3:00' },
    { date: '2025-10-19', amPm: 'PM', inTime: '', outTime: '', hours: '0:00' },
    { date: '2025-10-25', amPm: 'AM', inTime: '07:00', outTime: '09:00', hours: '2:00' },
    { date: '2025-10-25', amPm: 'PM', inTime: '15:00', outTime: '17:00', hours: '2:00' },
    { date: '2025-10-26', amPm: 'AM', inTime: '08:00', outTime: '10:00', hours: '2:00' },
    { date: '2025-10-26', amPm: 'PM', inTime: '15:30', outTime: '17:30', hours: '2:00' }
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Starting authentication check');
    checkAuthentication();
});

// Check if user is authenticated
function checkAuthentication() {
    console.log('checkAuthentication called');
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log('No user found, redirecting to auth.html');
        window.location.href = 'auth.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        console.log('User authenticated:', user.email);
        
        // Get saved employee name or use default
        const savedName = localStorage.getItem('employeeName');
        const displayName = savedName || user.employeeName || user.email || 'User';
        
        // Update welcome message IMMEDIATELY
        const welcomeElement = document.getElementById('user-display');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome, ${displayName}`;
            console.log('Welcome message set to:', welcomeElement.textContent);
        }
        
        // Only pre-fill employee name if we have a saved name
        const nameInput = document.getElementById('employee-name');
        if (savedName && savedName.trim() !== '') {
            nameInput.value = savedName;
        } else {
            nameInput.value = '';
        }
        
        // Initialize app
        initializeApp();
        
        // Load user data
        if (user.username || user.email) {
            const username = user.username || user.email.split('@')[0];
            loadUserData(username);
        }
        
    } catch (error) {
        console.error('Authentication error:', error);
        localStorage.removeItem('currentUser');
        window.location.href = 'auth.html';
    }
}

// Initialize the application
function initializeApp() {
    console.log('initializeApp called');
    
    // Set current month/year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
       
    // Load last viewed month from localStorage or use current
    const lastMonth = localStorage.getItem('lastViewedMonth');
    const lastYear = localStorage.getItem('lastViewedYear');
    
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (lastMonth !== null && lastYear !== null) {
        monthSelect.value = lastMonth;
        yearInput.value = lastYear;
    } else {
        monthSelect.value = currentMonth;
        yearInput.value = currentYear;
        saveCurrentMonth();
    }
    
    // CRITICAL FIX: Add event listeners for date controls
    monthSelect.addEventListener('change', function() {
        console.log('Month changed to:', this.value);
        updateFormDate();
        saveCurrentMonth();
        
        // Load data for the new month
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username);
        }
    });
    
    yearInput.addEventListener('change', function() {
        console.log('Year changed to:', this.value);
        updateFormDate();
        saveCurrentMonth();
        
        // Load data for the new month/year
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            const user = JSON.parse(currentUser);
            loadUserData(user.username);
        }
    });
    
    // Set up name auto-save
    setupNameAutoSave();
    
    // Initial update of form date
    updateFormDate();
    
    console.log('App initialized. Current month:', monthSelect.value, 'Year:', yearInput.value);
}

// Add this to initializeApp or create a separate function
function setupNameAutoSave() {
    const nameInput = document.getElementById('employee-name');
    let saveTimeout;
    
    nameInput.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        
        saveTimeout = setTimeout(() => {
            const name = this.value.trim();
            if (name) {
                localStorage.setItem('employeeName', name);
                // Update welcome message in real-time
                document.getElementById('user-display').textContent = `Welcome, ${name}`;
                console.log('Auto-saved name:', name);
            }
        }, 1000); // Wait 1 second after typing stops
    });
    
    // Immediate save on blur
    nameInput.addEventListener('blur', function() {
        const name = this.value.trim();
        if (name) {
            localStorage.setItem('employeeName', name);
            document.getElementById('user-display').textContent = `Welcome, ${name}`;
        }
    });
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
        // For new users, check if we should load sample data
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
    } else if (month == 9 && year == 2025) {
        // Load sample data for October 2025 (only for new users in this specific month)
        sampleData.forEach(entry => {
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

// Update the form date display - FIXED VERSION
function updateFormDate() {
    try {
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        const formDateSpan = document.getElementById('form-date');
        
        if (!monthSelect || !yearInput || !formDateSpan) {
            console.error('Date elements not found');
            return;
        }
        
        const monthIndex = parseInt(monthSelect.value);
        const year = yearInput.value;
        
        // Validate
        if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
            console.error('Invalid month index:', monthIndex);
            return;
        }
        
        formDateSpan.textContent = `${monthNames[monthIndex]} ${year}`;
        console.log('✅ Form date updated to:', formDateSpan.textContent);
    } catch (error) {
        console.error('Error updating form date:', error);
    }
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
        
        // Set today's date as default
        const today = new Date();
        const year = document.getElementById('year-input').value;
        const month = parseInt(document.getElementById('month-select').value) + 1;
        const day = today.getDate();
        
        document.getElementById('entry-date').value = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
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
    let hours = calculateHours(inTime, outTime);
    
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
    saveUserData();
    closeModal();
}

// Calculate hours between two times
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
    
    if (dateString.includes('-')) {
        const [year, month, day] = dateString.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    } else if (dateString.includes('/')) {
        return dateString;
    }
    
    return dateString;
}

// Format date for input (YYYY-MM-DD format)
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    if (dateString.includes('/')) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (dateString.includes('-')) {
        return dateString;
    }
    
    return dateString;
}

// Format time for display (convert 24h to 12h format)
function formatTimeDisplay(time) {
    if (!time || time === '') return '';
    
    const [hours, minutes] = time.split(':');
    const hourNum = parseInt(hours);
    const amPm = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum % 12 || 12;
    
    return `${displayHour}:${minutes} ${amPm}`;
}

// Convert 12h time to 24h time
function convertTo24Hour(timeString) {
    if (!timeString || timeString === '') return '';
    
    if (timeString.includes(' ') === false && timeString.includes(':')) {
        return timeString;
    }
    
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
            
            const remainingRows = document.querySelectorAll('#time-table tbody tr');
            remainingRows.forEach((row, index) => {
                const buttonsCell = row.cells[5];
                buttonsCell.innerHTML = `
                    <button class="edit-btn" onclick="openModal(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
                `;
            });
            
            calculateTotal();
            saveUserData();
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

// Generate PDF - SINGLE VERSION (removed duplicate)
function generatePDF() {
    if (!window.jspdf) {
        alert('PDF library not loaded. Please check your internet connection.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Grantley Adams Memorial School', 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('Broiler Production Project', 105, 28, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('Claim Form', 105, 36, { align: 'center' });
    
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    doc.text(`${monthNames[month]} ${year}`, 105, 44, { align: 'center' });
    
    // Employee Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Employee: ${document.getElementById('employee-name').value}`, 20, 60);
    
    // Create table data
    const tableData = [];
    const rows = document.querySelectorAll('#time-table tbody tr');
    
    rows.forEach(row => {
        const date = row.cells[0].textContent;
        const amPm = row.cells[1].textContent;
        const timeIn = row.cells[2].textContent;
        const timeOut = row.cells[3].textContent;
        const hours = row.cells[4].textContent;
        
        tableData.push([date, amPm, timeIn, timeOut, hours]);
    });
    
    // Add table
    if (jsPDF.API.autoTable) {
        doc.autoTable({
            startY: 70,
            head: [['Date', 'AM/PM', 'Time IN', 'Time OUT', 'Hours']],
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
            margin: { left: 20, right: 20 }
        });
        
        // Total hours
        const finalY = doc.lastAutoTable.finalY + 10;
        const totalHours = document.getElementById('total-hours').textContent;
        doc.text(`Total Hours: ${totalHours}`, 160, finalY);
        
        // Signature lines
        const signatureY = finalY + 25;
        
        doc.text('Signature Claimant:', 25, signatureY);
        doc.line(25, signatureY + 10, 65, signatureY + 10);
        
        doc.text('Signature HOD:', 85, signatureY);
        doc.line(85, signatureY + 10, 125, signatureY + 10);
        
        doc.text('Signature Principal:', 145, signatureY);
        doc.line(145, signatureY + 10, 185, signatureY + 10);
        
        // Save PDF
        doc.save(`Broiler_Claim_${monthNames[month]}_${year}.pdf`);
    } else {
        alert('PDF table generation failed. Please refresh the page.');
    }
}

// Print function
function printForm() {
    // Create a print-friendly version
    const printWindow = window.open('', '_blank');
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    
    printWindow.document.write(`
        <html>
        <head>
            <title>Broiler Production Claim Form - ${monthNames[month]} ${year}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header h2 { margin: 5px 0; font-size: 18px; font-style: italic; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; }
                .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 20px; }
                .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
                .signature-box { width: 30%; }
                .signature-line { border-top: 1px solid #000; margin-top: 40px; }
                @media print {
                    .no-print { display: none; }
                    button { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Grantley Adams Memorial School</h1>
                <h2>Broiler Production Project</h2>
                <h2>Claim Form - ${monthNames[month]} ${year}</h2>
            </div>
            
            <div>Employee: ${document.getElementById('employee-name').value}</div>
            
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>AM/PM</th>
                        <th>Time IN</th>
                        <th>Time OUT</th>
                        <th>Hours</th>
                    </tr>
                </thead>
                <tbody>
                    ${Array.from(document.querySelectorAll('#time-table tbody tr')).map(row => `
                        <tr>
                            <td>${row.cells[0].textContent}</td>
                            <td>${row.cells[1].textContent}</td>
                            <td>${row.cells[2].textContent}</td>
                            <td>${row.cells[3].textContent}</td>
                            <td>${row.cells[4].textContent}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">Total Hours: ${document.getElementById('total-hours').textContent}</div>
            
            <div class="signature-section">
                <div class="signature-box">
                    <div>Signature Claimant:</div>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-box">
                    <div>Signature HOD:</div>
                    <div class="signature-line"></div>
                </div>
                <div class="signature-box">
                    <div>Signature Principal:</div>
                    <div class="signature-line"></div>
                </div>
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 1000);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Utility Functions
function saveForm() {
    saveUserData();
}

// FIXED logout function
function logout() {
    console.log('Logging out...');
    
    // Sign out from Firebase
    if (typeof auth !== 'undefined' && auth) {
        auth.signOut().then(() => {
            console.log('Firebase signout successful');
        }).catch((error) => {
            console.log('Firebase signout error:', error);
        });
    }
    
    // Clear ALL localStorage data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeName');
    localStorage.removeItem('lastViewedMonth');
    localStorage.removeItem('lastViewedYear');
    
    // Clear any user-specific data
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        try {
            const user = JSON.parse(currentUser);
            if (user.email) {
                const username = user.username || user.email.split('@')[0];
                localStorage.removeItem(`userData_${username}`);
            }
        } catch (e) {
            console.log('Error clearing user data:', e);
        }
    }
    
    // Force redirect with cache busting
    window.location.href = 'auth.html?t=' + new Date().getTime();
}

// Add event listener for Escape key to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('entry-modal');
    if (event.target === modal) {
        closeModal();
    }
};
