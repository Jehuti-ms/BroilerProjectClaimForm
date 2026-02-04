// SIMPLE Broiler Claim Form - NO ERRORS
console.log('Simple App starting...');

console.log('app.js loading...');
console.log('Current page:', window.location.href);
console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));

// Basic data
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Save current month to localStorage
function saveCurrentMonth() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect && yearInput) {
        localStorage.setItem('lastViewedMonth', monthSelect.value);
        localStorage.setItem('lastViewedYear', yearInput.value);
        console.log('Saved month/year:', monthSelect.value, yearInput.value);
    }
}

// Update the date display in the header
function updateDateDisplayInHeader() {
    console.log('Updating date in header...');
    
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    const display = document.getElementById('month-year-display');
    
    if (!monthSelect || !yearInput || !display) {
        console.error('Date elements not found!');
        return;
    }
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    if (!isNaN(month) && month >= 0 && month <= 11 && !isNaN(year)) {
        display.textContent = monthNames[month] + ' ' + year;
        console.log('Updated date display:', display.textContent);
    } else {
        console.error('Invalid month or year values:', month, year);
    }
}

// ==================== EMPLOYEE NAME FIELD SETUP ====================
function setupEmployeeNameField() {
    console.log('Setting up employee name field...');
    
    // Get the input field
    const nameInput = document.getElementById('employee-name-input');
    if (!nameInput) {
        console.error('Employee name input field not found!');
        return;
    }
    
    // Load previously saved claim recipient name
    const savedClaimName = localStorage.getItem('claimEmployeeName');
    if (savedClaimName && savedClaimName.trim() !== '') {
        // Fill the input field with saved name
        nameInput.value = savedClaimName;
        console.log('Loaded saved claim recipient name:', savedClaimName);
        
        // Update the header display
        updateEmployeeDisplayInHeader();
    } else {
        console.log('No saved claim recipient name found');
    }
    
    // Add event listeners for auto-saving
    let saveTimeout;
    
    // Auto-save on input (with debouncing)
    nameInput.addEventListener('input', function() {
        // Clear previous timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set new timeout (save after 1 second of inactivity)
        saveTimeout = setTimeout(() => {
            saveClaimRecipientName(this.value);
        }, 1000);
        
        // Update header immediately for better UX
        updateEmployeeDisplayInHeaderWithName(this.value);
    });
    
    // Save on blur (when user leaves the field)
    nameInput.addEventListener('blur', function() {
        saveClaimRecipientName(this.value);
    });
    
    // Save on Enter key
    nameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveClaimRecipientName(this.value);
            this.blur(); // Remove focus
        }
    });
    
    console.log('Employee name field setup complete');
}

// Helper function to update header immediately (without saving)
function updateEmployeeDisplayInHeaderWithName(name) {
    const display = document.getElementById('employee-display');
    if (display) {
        display.textContent = name.trim() || 'Employee Name';
    }
}

// Save claim recipient name
function saveClaimRecipientName(name) {
    console.log('Saving claim recipient name:', name);
    
    const trimmedName = name ? name.trim() : '';
    
    // Save to localStorage
    localStorage.setItem('claimEmployeeName', trimmedName);
    
    // Update the header display
    updateEmployeeDisplayInHeader();
    
    // Update document title
    document.title = `Broiler Claim - ${trimmedName || 'Employee'}`;
    
    // Show notification if name is not empty
    if (trimmedName !== '') {
        showNotification(`Claim form updated for: ${trimmedName}`, 'success');
    }
    
    console.log('Claim recipient name saved');
}

// Update header display from saved name
function updateEmployeeDisplayInHeader() {
    console.log('Updating employee name in header...');
    
    const savedName = localStorage.getItem('claimEmployeeName');
    const display = document.getElementById('employee-display');
    
    if (!display) {
        console.error('Employee display element not found!');
        return;
    }
    
    if (savedName && savedName.trim() !== '') {
        display.textContent = savedName;
        console.log('Updated header with saved name:', savedName);
    } else {
        display.textContent = 'Employee Name';
        console.log('No saved name found, using default');
    }
}

// ==================== REMOVE DUPLICATE FUNCTIONS ====================
// REMOVE OR COMMENT OUT THESE DUPLICATE FUNCTIONS THAT CREATE DUPLICATE HEADERS:

/*
function updateClaimForDisplay(employeeName) {
    // THIS FUNCTION CREATES DUPLICATE HEADERS - REMOVE IT
}

function createClaimTitle(employeeName) {
    // THIS FUNCTION CREATES DUPLICATE HEADERS - REMOVE IT
}
*/

// Update the logged-in user display
function updateLoggedInUserDisplay() {
    console.log('Updating logged-in user display...');
    
    const userData = localStorage.getItem('currentUser');
    const usernameElement = document.getElementById('username');
    
    if (!usernameElement) {
        console.error('Username element not found!');
        return;
    }
    
    if (!userData) {
        usernameElement.textContent = 'Not logged in';
        console.log('No user data found');
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('User data found:', user);
        
        // Get display name in order of preference
        let displayName = '';
        
        if (user.employeeName && user.employeeName.trim() !== '') {
            displayName = user.employeeName;
        } else if (user.displayName && user.displayName.trim() !== '') {
            displayName = user.displayName;
        } else if (user.email) {
            // Extract username from email
            const username = user.email.split('@')[0];
            displayName = username.charAt(0).toUpperCase() + username.slice(1);
        } else {
            displayName = 'User';
        }
        
        usernameElement.textContent = displayName;
        console.log('Updated logged-in user display to:', displayName);
        
    } catch (error) {
        console.error('Error updating user display:', error);
        usernameElement.textContent = 'Error loading';
    }
}

// Setup date controls event listeners
function setupDateControls() {
    console.log('Setting up date controls...');
    
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) {
        console.error('Date controls not found!');
        return;
    }
    
    // Add event listeners
    monthSelect.addEventListener('change', function() {
        console.log('Month changed to:', this.value);
        updateDateDisplayInHeader();
        saveCurrentMonth();
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
    });
    
    yearInput.addEventListener('change', function() {
        console.log('Year changed to:', this.value);
        updateDateDisplayInHeader();
        saveCurrentMonth();
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
    });
    
    console.log('Date controls setup complete');
}

// Setup header updates on page load
function setupHeader() {
    console.log('Setting up header...');
    
    // Update all header displays
    updateEmployeeDisplayInHeader();
    updateDateDisplayInHeader();
    updateLoggedInUserDisplay();
    
    // Setup date controls
    setupDateControls();
    
    console.log('Header setup complete');
}

// Check Authentication
function checkAuth() {
    console.log('=== APP.JS CHECKAUTH CALLED ===');
    console.log('URL:', window.location.href);
    console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));
    
    // Force a 5-second delay to see what happens
    return new Promise((resolve) => {
        setTimeout(() => {
            const userData = localStorage.getItem('currentUser');
            if (!userData) {
                console.log('❌ NO USER DATA IN LOCALSTORAGE');
                console.log('Full localStorage:', JSON.stringify(localStorage, null, 2));
                console.log('Redirecting to auth.html...');
                window.location.href = 'auth.html';
                resolve(false);
                return;
            }
            
            try {
                const user = JSON.parse(userData);
                console.log('✅ USER FOUND:', user.email);
                console.log('Will initialize app now...');
                resolve(true);
            } catch (error) {
                console.log('❌ ERROR parsing user data:', error);
                console.log('User data that failed:', userData);
                window.location.href = 'auth.html';
                resolve(false);
            }
        }, 5000); // 5 second delay
    });
}

// Update your DOMContentLoaded to handle the promise
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== APP.JS DOM LOADED ===');
    
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        console.log('Authentication successful, calling initializeApp...');
        try {
            initializeApp();
        } catch (error) {
            console.error('ERROR in initializeApp:', error);
            // Show a user-friendly error instead of the technical one
            alert('There was an error loading the application. Please refresh the page.');
            console.log('Full error details:', error);
        }
    } else {
        console.log('Authentication failed - should have redirected already');
    }
});

// ================== Initialization ===================
// Initialize app
function initializeApp() {
    console.log('initializeApp called');
    
    // Set current month/year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Get elements
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    // Ensure elements exist
    if (!monthSelect || !yearInput) {
        console.error('Month or year elements not found');
        return;
    }
    
    // Load last viewed month from localStorage or use current
    const lastMonth = localStorage.getItem('lastViewedMonth');
    const lastYear = localStorage.getItem('lastViewedYear');
    
    if (lastMonth !== null && lastYear !== null) {
        // Parse and validate stored values
        const storedMonth = parseInt(lastMonth);
        const storedYear = parseInt(lastYear);
        
        if (!isNaN(storedMonth) && storedMonth >= 0 && storedMonth <= 11 &&
            !isNaN(storedYear) && storedYear >= 2000 && storedYear <= 2100) {
            monthSelect.value = storedMonth;
            yearInput.value = storedYear;
        } else {
            // Invalid stored values, use current
            monthSelect.value = currentMonth;
            yearInput.value = currentYear;
            saveCurrentMonth();
        }
    } else {
        // No stored values, use current
        monthSelect.value = currentMonth;
        yearInput.value = currentYear;
        saveCurrentMonth();
    }
    
    // Add event listeners for date controls
    monthSelect.addEventListener('change', function() {
        console.log('Month changed to:', this.value);
        updateDateDisplayInHeader();
        saveCurrentMonth();
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
    });
    
    yearInput.addEventListener('change', function() {
        console.log('Year changed to:', this.value);
        updateDateDisplayInHeader();
        saveCurrentMonth();
        if (typeof loadUserData === 'function') {
            loadUserData();
        }
    });

    // Setup header
    setupHeader();
    
    // Set up name auto-save
    setupEmployeeNameField();
    
    // Load user data if function exists
    if (typeof loadUserData === 'function') {
        loadUserData();
    }
    
    // Initialize auto-sync if needed
    if (typeof initAutoSync === 'function') {
        initAutoSync();
    }
    
    console.log('App initialized. Current month:', monthSelect.value, 'Year:', yearInput.value);
}

// ==================== FIXED PDF FUNCTION ====================
function generatePDF() {
    console.log('Generating A4 PDF...');
    
    // Check if jsPDF is loaded
    if (!window.jspdf) {
        alert('PDF library not loaded. Please ensure you have internet connection.');
        if (typeof loadPDFLibrary === 'function') {
            loadPDFLibrary().then(() => generatePDF());
        }
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Page dimensions
        const pageWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const margin = 15; // Margin in mm
        
        // Get data
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        
        // Get employee name from localStorage or input field
        const employeeName = localStorage.getItem('claimEmployeeName') || 
                            document.getElementById('employee-name-input')?.value || 
                            'Employee Name';
        
        const totalHours = document.getElementById('total-hours')?.textContent || '0:00';
        
        const month = parseInt(monthSelect?.value || 0);
        const year = parseInt(yearInput?.value || 2026);
        const monthName = monthNames[month] || 'Month';
        
        // Header section - Compact
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Grantley Adams Memorial School', pageWidth / 2, margin, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Broiler Production Project', pageWidth / 2, margin + 8, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Claim Form', pageWidth / 2, margin + 16, { align: 'center' });
        
        // Employee and date info
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Employee: ${employeeName}`, margin, margin + 25);
        doc.text(`${monthName} ${year}`, pageWidth - margin, margin + 25, { align: 'right' });
        
        // Line separator
        doc.setLineWidth(0.5);
        doc.line(margin, margin + 30, pageWidth - margin, margin + 30);
        
        // Get table data
        const tableData = [];
        const rows = document.querySelectorAll('#time-table tbody tr');
        
        let yPos = margin + 40; // Starting position for table
        
        rows.forEach(row => {
            const date = row.cells[0]?.textContent;
            const amPm = row.cells[1]?.textContent;
            const timeIn = row.cells[2]?.textContent;
            const timeOut = row.cells[3]?.textContent;
            const hours = row.cells[4]?.textContent;
            
            if (date && date !== '') {
                tableData.push([date, amPm, timeIn, timeOut, hours]);
            }
        });
        
        // Create table with autoTable
        if (tableData.length > 0 && jsPDF.API.autoTable) {
            doc.autoTable({
                startY: yPos,
                head: [['Date', 'AM/PM', 'Time IN', 'Time OUT', 'Hours']],
                body: tableData,
                theme: 'grid',
                styles: { 
                    fontSize: 9, 
                    cellPadding: 3,
                    textColor: [0, 0, 0],
                    lineWidth: 0.1
                },
                headStyles: { 
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold',
                    fontSize: 10
                },
                margin: { left: margin, right: margin },
                tableWidth: pageWidth - (margin * 2),
                columnStyles: {
                    0: { cellWidth: 30 }, // Date
                    1: { cellWidth: 20 }, // AM/PM
                    2: { cellWidth: 25 }, // Time IN
                    3: { cellWidth: 25 }, // Time OUT
                    4: { cellWidth: 20 }  // Hours
                }
            });
            
            // Update position after table
            yPos = doc.lastAutoTable.finalY + 10;
        } else {
            doc.text('No entries found', margin, yPos);
            yPos += 10;
        }
        
        // Add total hours
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Total Hours: ${totalHours}`, pageWidth - margin, yPos, { align: 'right' });
        
        // Add signature section - Optimized for A4
        const signatureY = Math.min(yPos + 40, pageHeight - 50); // Ensure it fits on page
        
        // Add "Approved by:" text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Approved by:', margin, signatureY);
        
        // Signature boxes
        const boxWidth = 50;
        const boxSpacing = 10;
        const totalWidth = (boxWidth * 3) + (boxSpacing * 2);
        const startX = (pageWidth - totalWidth) / 2;
        
        // Signature lines
        const lineY = signatureY + 20;
        
        doc.setLineWidth(0.5);
        
        // Box 1: Claimant
        doc.text('Signature Claimant:', startX, signatureY + 10);
        doc.line(startX, lineY, startX + boxWidth, lineY);
        
        // Box 2: HOD
        doc.text('Signature HOD:', startX + boxWidth + boxSpacing, signatureY + 10);
        doc.line(startX + boxWidth + boxSpacing, lineY, startX + (boxWidth * 2) + boxSpacing, lineY);
        
        // Box 3: Principal
        doc.text('Signature Principal:', startX + (boxWidth * 2) + (boxSpacing * 2), signatureY + 10);
        doc.line(startX + (boxWidth * 2) + (boxSpacing * 2), lineY, startX + (boxWidth * 3) + (boxSpacing * 2), lineY);
        
        // Add date line at bottom
        const currentDate = new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        
        doc.text(`Generated on: ${currentDate}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Set document properties
        doc.setProperties({
            title: `Broiler Claim - ${employeeName} - ${monthName} ${year}`,
            subject: 'Employee Time Claim Form',
            author: 'Grantley Adams Memorial School',
            keywords: 'broiler, chicken, claim, form, timesheet'
        });
        
        // Save the PDF
        const filename = `Broiler_Claim_${monthName}_${year}_${employeeName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
        doc.save(filename);
        
        showNotification('A4 PDF generated successfully!');
        
    } catch (error) {
        console.error('PDF generation error:', error);
        alert('Error generating PDF. Please try again.');
    }
}

// ==================== FIXED PRINT FUNCTION ====================
function printForm() {
    console.log('Printing form...');
    
    // Create a print-friendly window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Please allow popups to print the form.');
        return;
    }
    
    // Get data
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) {
        alert('Cannot print: Month/Year not found');
        return;
    }
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    // Get employee name from localStorage or input field
    const employeeName = localStorage.getItem('claimEmployeeName') || 
                        document.getElementById('employee-name-input')?.value || 
                        'Employee Name';
    
    const totalHours = document.getElementById('total-hours')?.textContent || '0:00';
    
    // Get table data
    let tableRows = '';
    const rows = document.querySelectorAll('#time-table tbody tr');
    
    rows.forEach(row => {
        const date = row.cells[0]?.textContent;
        const amPm = row.cells[1]?.textContent;
        const timeIn = row.cells[2]?.textContent;
        const timeOut = row.cells[3]?.textContent;
        const hours = row.cells[4]?.textContent;
        
        if (date && date !== '') {
            tableRows += `
                <tr>
                    <td>${date}</td>
                    <td>${amPm}</td>
                    <td>${timeIn}</td>
                    <td>${timeOut}</td>
                    <td>${hours}</td>
                </tr>
            `;
        }
    });
    
    // Create print document
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Broiler Claim Form - ${monthNames[month]} ${year}</title>
            <style>
                @media print {
                    @page { margin: 20mm; }
                    body { font-family: Arial, sans-serif; margin: 0; }
                }
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 24px; }
                .header h2 { margin: 5px 0; font-size: 18px; font-style: italic; }
                .info { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                th { background-color: #f2f2f2; font-weight: bold; }
                .total { text-align: right; font-weight: bold; font-size: 16px; margin: 20px 0; }
                .signature-section { display: flex; justify-content: space-between; margin-top: 60px; }
                .signature-box { width: 30%; }
                .signature-line { border-top: 2px solid #000; margin-top: 40px; padding-top: 5px; }
                .no-print { display: none; }
                .footer { margin-top: 50px; font-size: 12px; color: #666; text-align: center; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Grantley Adams Memorial School</h1>
                <h2>Broiler Production Project</h2>
                <h2>Claim Form - ${monthNames[month]} ${year}</h2>
            </div>
            
            <div class="info">
                <div><strong>Employee:</strong> ${employeeName}</div>
                <div><strong>Period:</strong> ${monthNames[month]} ${year}</div>
            </div>
            
            ${tableRows ? `
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
                    ${tableRows}
                </tbody>
            </table>
            
            <div class="total">
                Total Hours: ${totalHours}
            </div>
            ` : '<p>No entries to display</p>'}
            
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
            
            <div class="footer">
                Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
            </div>
            
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() {
                        window.close();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    showNotification('Opening print preview...');
}

// ==================== KEEP OTHER FUNCTIONS AS IS ====================
// Keep all your existing functions like:
// openModal, closeModal, saveEntry, calculateHours, renderTable, etc.
// Just make sure you don't have duplicate function declarations

// Open modal to add entry
function openModal() {
    // Clear any editing
    window.editingIndex = undefined;
    const modalTitle = document.getElementById('modal-title');
    if (modalTitle) {
        modalTitle.textContent = 'Add New Entry';
    }
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const entryDate = document.getElementById('entry-date');
    if (entryDate) {
        entryDate.value = today;
    }
    
    // Set default values
    const amPmSelect = document.getElementById('entry-am-pm');
    const timeIn = document.getElementById('entry-time-in');
    const timeOut = document.getElementById('entry-time-out');
    
    if (amPmSelect) amPmSelect.value = 'AM';
    if (timeIn) timeIn.value = '';
    if (timeOut) timeOut.value = '';
    
    // Show modal
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Close modal
function closeModal() {
    console.log('Closing modal...');
    const modal = document.getElementById('entry-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    window.editingIndex = undefined;
}

// Save entry
function saveEntry() {
    console.log('Saving entry...');
    
    // Get form values
    const date = document.getElementById('entry-date')?.value;
    const amPm = document.getElementById('entry-am-pm')?.value;
    const inTime = document.getElementById('entry-time-in')?.value;
    const outTime = document.getElementById('entry-time-out')?.value;
    
    if (!date || !inTime || !outTime) {
        alert('Please fill all fields');
        return;
    }
    
    // Calculate hours (simplified version)
    const hours = calculateHours(inTime, outTime);
    
    // Add to current form data
    if (!window.currentFormData) {
        window.currentFormData = [];
    }
    
    const entry = { date, amPm, inTime, outTime, hours };
    
    if (window.editingIndex !== undefined) {
        // Update existing
        window.currentFormData[window.editingIndex] = entry;
    } else {
        // Add new
        window.currentFormData.push(entry);
    }
    
    // Render table and save
    renderTable();
    if (typeof saveData === 'function') {
        saveData();
    }
    closeModal();
}

// Calculate hours
function calculateHours(inTime, outTime) {
    const [inH, inM] = inTime.split(':').map(Number);
    const [outH, outM] = outTime.split(':').map(Number);
    
    let hours = outH - inH;
    let minutes = outM - inM;
    
    if (minutes < 0) {
        hours--;
        minutes += 60;
    }
    
    if (hours < 0) hours += 24;
    
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

// Render table
function renderTable() {
    const tbody = document.querySelector('#time-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!window.currentFormData || window.currentFormData.length === 0) {
        return;
    }
    
    window.currentFormData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateDisplay(entry.date)}</td>
            <td>${entry.amPm}</td>
            <td>${formatTimeDisplay(entry.inTime)}</td>
            <td>${formatTimeDisplay(entry.outTime)}</td>
            <td>${entry.hours}</td>
            <td>
                <button class="edit-btn" onclick="editRow(${index})">Edit</button>
                <button class="delete-btn" onclick="deleteRow(${index})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    calculateTotal();
}

// Format date for display
function formatDateDisplay(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }
    return dateStr;
}

// Format time for display
function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m.padStart(2, '0')} ${ampm}`;
}

// Edit row
function editRow(index) {
    const entry = window.currentFormData[index];
    
    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-am-pm').value = entry.amPm;
    document.getElementById('entry-time-in').value = entry.inTime;
    document.getElementById('entry-time-out').value = entry.outTime;
    
    window.editingIndex = index;
    document.getElementById('modal-title').textContent = 'Edit Entry';
    document.getElementById('entry-modal').style.display = 'block';
}

// Delete row
function deleteRow(index) {
    if (confirm('Delete this entry?')) {
        window.currentFormData.splice(index, 1);
        renderTable();
        if (typeof saveData === 'function') {
            saveData();
        }
    }
}

// ==================== UPDATE FUNCTION FOR THE "UPDATE" BUTTON ====================
function updateClaimName() {
    const nameInput = document.getElementById('employee-name-input');
    if (!nameInput) return;
    
    saveClaimRecipientName(nameInput.value);
}

// Logout
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeName');
    window.location.href = 'auth.html';
}
