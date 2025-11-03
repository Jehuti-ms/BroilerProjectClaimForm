let currentEditingRow = null;
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    initializeApp();
});

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
    
    // Load user's saved data and last viewed month
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
        loadCurrentMonthData();
    });
    
    document.getElementById('year-input').addEventListener('change', function() {
        updateFormDate();
        saveCurrentMonth();
        loadCurrentMonthData();
    });
    
    updateFormDate();
    loadCurrentMonthData(); // Load data for current month
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
    console.log('Loading user data for:', username, userData);
    
    if (userData) {
        const allData = JSON.parse(userData);
        loadCurrentMonthData(allData);
    } else {
        // Initialize with empty data for new users
        console.log('No saved data found, starting with empty form');
        loadCurrentMonthData();
    }
}

// Load data for current month
function loadCurrentMonthData(allData = null) {
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    console.log('Loading data for month:', monthYear, 'Available data:', allData);
    
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = '';
    currentFormData = [];
    
    if (allData && allData[monthYear]) {
        // Load saved data for this month
        console.log('Found saved data for this month:', allData[monthYear]);
        allData[monthYear].forEach(entry => {
            addRowToTable(entry);
            currentFormData.push(entry);
        });
    } else {
        // No data for this month, start with empty form
        console.log('No data found for this month, starting with empty form');
    }
    
    calculateTotal();
}

// Save user data
function saveUserData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        console.log('No user logged in, cannot save data');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const monthYear = `${month}-${year}`;
    
    console.log('Saving data for user:', user.username, 'Month:', monthYear, 'Data:', currentFormData);
    
    // Get existing user data
    const existingData = localStorage.getItem(`userData_${user.username}`);
    let allData = existingData ? JSON.parse(existingData) : {};
    
    // Update data for current month
    allData[monthYear] = currentFormData;
    
    // Save back to localStorage
    localStorage.setItem(`userData_${user.username}`, JSON.stringify(allData));
    console.log('Data saved successfully');
    
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
// Save entry from modal - IMPROVED DATE HANDLING
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
    
    // Validate the date
    const selectedDate = new Date(date);
    if (isNaN(selectedDate.getTime())) {
        alert('Please select a valid date');
        return;
    }
    
    // Format the date consistently as YYYY-MM-DD
    const year = selectedDate.getFullYear();
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = selectedDate.getDate().toString().padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    
    console.log('Original date input:', date);
    console.log('Formatted date for storage:', formattedDate);
    
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
    
    const entryData = {
        date: formattedDate, // Use the consistently formatted date
        amPm: amPm,
        inTime: inTime,
        outTime: outTime,
        hours: hours
    };
    
    console.log('Saving entry:', entryData);
    
    if (currentEditingRow !== null) {
        // Update existing row
        updateRowInTable(currentEditingRow, entryData);
        currentFormData[currentEditingRow] = entryData;
        console.log('Updated row at index:', currentEditingRow);
    } else {
        // Add new row
        addRowToTable(entryData);
        currentFormData.push(entryData);
        console.log('Added new row, total entries:', currentFormData.length);
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
    console.log('Added row to table, index:', rowIndex);
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
        
        console.log('Updated row in table, index:', rowIndex);
    }
}

// Format date for display (DD/MM/YYYY format)
// Format date for display (DD/MM/YYYY format) - IMPROVED
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    
    // Handle both YYYY-MM-DD and other formats
    let date;
    if (dateString.includes('-')) {
        // It's already in YYYY-MM-DD format
        date = new Date(dateString);
    } else {
        // It's in DD/MM/YYYY format
        const [day, month, year] = dateString.split('/');
        date = new Date(`${year}-${month}-${day}`);
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return '';
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Format date for input (YYYY-MM-DD format) - FIXED
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('/');
    // Ensure proper formatting for Date object
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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
            
            console.log('Deleted row, remaining entries:', currentFormData.length);
            
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
    const signatureY = finalY + 25; // More space before signatures
    
    // Signature Claimant
    doc.text('Signature Claimant:', 25, signatureY);
    doc.line(25, signatureY + 10, 65, signatureY + 10); // Line below text with space
    
    // Signature HOD
    doc.text('Signature HOD:', 85, signatureY);
    doc.line(85, signatureY + 10, 125, signatureY + 10); // Line below text with space
    
    // Signature Principal
    doc.text('Signature Principal:', 145, signatureY);
    doc.line(145, signatureY + 10, 185, signatureY + 10); // Line below text with space
    
    // Save the PDF
    doc.save(`Broiler_Claim_Form_${monthNames[month]}_${year}.pdf`);
}

// Save form data
function saveForm() {
    saveUserData();
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'auth.html';
}
