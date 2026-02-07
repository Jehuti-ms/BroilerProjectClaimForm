// SIMPLE Broiler Claim Form - NO ERRORS
console.log('Simple App starting...');

console.log('app.js loading...');
console.log('Current page:', window.location.href);
console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));

// Basic data
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Initialize current form data
let currentFormData = [];

// Make it globally accessible
window.currentFormData = currentFormData;

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

    // Load data
    if (typeof loadUserData === 'function') {
        setTimeout(() => {
            loadUserData();
        }, 1000); // Small delay to ensure DOM is ready
    }
    
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

     // Add button event listeners
    setupButtonListeners();
    
    console.log('App initialized completely');
    
    console.log('App initialized. Current month:', monthSelect.value, 'Year:', yearInput.value);
}

function setupButtonListeners() {
    console.log('Setting up button listeners...');
    
    // Add Entry button
    const addBtn = document.getElementById('add-entry-btn');
    if (addBtn) {
        addBtn.addEventListener('click', openModal);
    }
    
    // Save Entry button (in modal)
    const saveBtn = document.getElementById('save-entry-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveEntry);
    }
    
    // Close Modal button
    const closeBtn = document.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // Generate PDF button
    const pdfBtn = document.getElementById('generate-pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', generatePDF);
    }
    
    // Print button
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', printForm);
    }
    
    // Clear button
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearForm);
    }
    
    // Save button
    const saveFormBtn = document.getElementById('save-btn');
    if (saveFormBtn) {
        saveFormBtn.addEventListener('click', saveData);
    }
    
    // Sync button
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncToCloud);
    }
    
    // Load from cloud button
    const loadCloudBtn = document.getElementById('load-cloud-btn');
    if (loadCloudBtn) {
        loadCloudBtn.addEventListener('click', syncFromCloud);
    }
    
    // Update claim name button
    const updateNameBtn = document.getElementById('update-name-btn');
    if (updateNameBtn) {
        updateNameBtn.addEventListener('click', updateClaimName);
    }
    
    console.log('Button listeners setup complete');
}

// Update claim recipient name
function updateClaimName() {
    console.log('Updating claim name...');
    
    const nameInput = document.getElementById('employee-name-input');
    if (!nameInput) {
        console.error('Employee name input not found');
        return;
    }
    
    const name = nameInput.value.trim();
    if (!name) {
        alert('Please enter a name');
        return;
    }
    
    // Save to localStorage
    localStorage.setItem('claimEmployeeName', name);
    
    // Update display
    updateEmployeeDisplayInHeader();
    
    // Update document title
    document.title = `Broiler Claim - ${name}`;
    
    showNotification(`Claim form updated for: ${name}`, 'success');
    
    console.log('Claim name updated to:', name);
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

// ==================== UPDATE FUNCTION FOR THE "UPDATE" BUTTON ====================
function updateClaimName() {
    const nameInput = document.getElementById('employee-name-input');
    if (!nameInput) return;
    
    saveClaimRecipientName(nameInput.value);
}

// Open modal with better focus management
function openModal() {
    console.log('Opening modal...');
    
    // Clear editing state
    window.editingIndex = undefined;
    document.getElementById('modal-title').textContent = 'Add New Time Entry';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('entry-date').value = today;
    
    // Set default times
    document.getElementById('entry-am-pm').value = 'AM';
    document.getElementById('entry-time-in').value = '08:00';
    document.getElementById('entry-time-out').value = '12:00';
    
    // Show modal
    const modal = document.getElementById('entry-modal');
    modal.style.display = 'block';
    
    // Focus on date field after a short delay
    setTimeout(() => {
        document.getElementById('entry-date').focus();
    }, 50);
}

// Close modal with smooth animation
function closeModal() {
    console.log('Closing modal...');
    const modal = document.getElementById('entry-modal');
    
    // Add fade-out animation
    modal.style.animation = 'fadeOut 0.2s ease';
    const content = modal.querySelector('.modal-content');
    content.style.animation = 'slideOut 0.2s ease';
    
    setTimeout(() => {
        modal.style.display = 'none';
        modal.style.animation = '';
        content.style.animation = '';
    }, 200);
    
    window.editingIndex = undefined;
}

// Add these CSS animations for closing
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    @keyframes slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(-20px); opacity: 0; }
    }
`;
document.head.appendChild(style);
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

// Edit row function for your HTML structure
function editRow(index) {
    const entry = window.currentFormData[index];
    if (!entry) return;
    
    // Fill form with entry data
    document.getElementById('entry-date').value = entry.date;
    document.getElementById('entry-am-pm').value = entry.amPm;
    document.getElementById('entry-time-in').value = entry.inTime;
    document.getElementById('entry-time-out').value = entry.outTime;
    
    // Set editing mode
    window.editingIndex = index;
    document.getElementById('modal-title').textContent = 'Edit Time Entry';
    
    // Show modal
    const modal = document.getElementById('entry-modal');
    modal.style.display = 'block';
    
    // Focus on time in field
    setTimeout(() => {
        document.getElementById('entry-time-in').focus();
    }, 50);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('entry-modal');
    if (event.target === modal) {
        closeModal();
    }
};

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('entry-modal');
        if (modal.style.display === 'block') {
            closeModal();
        }
    }
});

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

// Calculate total hours
function calculateTotal() {
    let total = 0;
    
    if (window.currentFormData && window.currentFormData.length > 0) {
        window.currentFormData.forEach(entry => {
            if (entry.hours) {
                const [h, m] = entry.hours.split(':').map(Number);
                total += h * 60 + m;
            }
        });
    }
    
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    
    const totalElement = document.getElementById('total-hours');
    if (totalElement) {
        totalElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
}

// Clear all entries
function clearForm() {
    if (confirm('Clear all entries for this month?')) {
        window.currentFormData = [];
        renderTable();
        if (typeof saveData === 'function') {
            saveData();
        }
    }
}

// Logout
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeName');
    window.location.href = 'auth.html';
}

// Close modal with escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// Close modal when clicking outside
window.onclick = function(e) {
    const modal = document.getElementById('entry-modal');
    if (e.target === modal) closeModal();
};

// ==================== NOTIFICATION FUNCTION ====================
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style based on type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ==================== SYNC FUNCTIONS (KEEP YOUR EXISTING ONES) ====================
// ==================== ENHANCED LOAD USER DATA ====================
function loadUserData() {
    console.log('=== loadUserData() called ===');
    
    try {
        // Get current user
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            console.log('No user found');
            return;
        }
        
        const user = JSON.parse(userData);
        const username = user.uid || user.email.split('@')[0];
        console.log('Loading data for user:', username);
        
        // Get current month/year
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        
        if (!monthSelect || !yearInput) {
            console.error('Month/Year elements not found');
            return;
        }
        
        const month = monthSelect.value;
        const year = yearInput.value;
        const monthYear = `${month}-${year}`;
        console.log('Loading data for period:', monthYear);
        
        // Try multiple data sources in order
        let loadedData = null;
        
        // 1. Try main storage
        const dataKey = `userData_${username}`;
        const savedData = localStorage.getItem(dataKey);
        
        if (savedData) {
            console.log('Found data in main storage');
            try {
                const allData = JSON.parse(savedData);
                loadedData = allData[monthYear] || [];
                console.log(`Loaded ${loadedData.length} entries from main storage`);
            } catch (e) {
                console.error('Error parsing main data:', e);
                loadedData = [];
            }
        } else {
            console.log('No data in main storage');
        }
        
        // 2. If no data, try recent backup
        if (!loadedData || loadedData.length === 0) {
            console.log('Trying backups...');
            loadedData = tryLoadFromBackups(username, monthYear);
        }
        
        // 3. If still no data, check Firebase
        if ((!loadedData || loadedData.length === 0) && window.firebase) {
            console.log('Trying Firebase...');
            // We'll try async Firebase load, but for now set empty
            loadedData = loadedData || [];
        }
        
        // Update global variable
        window.currentFormData = loadedData || [];
        console.log('Final currentFormData:', window.currentFormData);
        
        // Render table
        renderTable();
        
        // Calculate total
        calculateTotal();
        
        // Show notification if data loaded
        if (window.currentFormData.length > 0) {
            showNotification(`Loaded ${window.currentFormData.length} entries for ${monthNames[month]} ${year}`, 'success');
        } else {
            console.log('No data loaded for this period');
        }
        
    } catch (error) {
        console.error('Error in loadUserData:', error);
        showNotification('Error loading data', 'error');
    }
}

// Helper to try loading from backups
function tryLoadFromBackups(username, monthYear) {
    const allKeys = Object.keys(localStorage);
    
    // Look for backup keys
    const backupKeys = allKeys.filter(key => 
        key.includes('backup') || 
        key.includes('cloud_backup') ||
        key.includes(username)
    ).sort().reverse(); // Newest first
    
    for (const key of backupKeys) {
        try {
            const data = localStorage.getItem(key);
            if (!data) continue;
            
            const parsed = JSON.parse(data);
            console.log(`Checking backup ${key}:`, typeof parsed);
            
            // Try different backup formats
            let monthData = null;
            
            if (parsed.data && parsed.data[monthYear]) {
                // Format: {data: {[monthYear]: [...]}}
                monthData = parsed.data[monthYear];
            } else if (parsed[monthYear]) {
                // Format: {[monthYear]: [...]}
                monthData = parsed[monthYear];
            } else if (Array.isArray(parsed) && parsed[0] && parsed[0].date) {
                // Direct array (old format)
                monthData = parsed;
            }
            
            if (monthData && monthData.length > 0) {
                console.log(`✅ Found ${monthData.length} entries in backup ${key}`);
                return monthData;
            }
        } catch (e) {
            console.log(`Error parsing backup ${key}:`, e.message);
        }
    }
    
    console.log('No data found in backups');
    return [];
}

// Save data
// ==================== ENHANCED SAVE FORM ====================
function saveForm() {
    console.log('=== SAVE FORM ===');
    
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            alert('Please log in first');
            return;
        }
        
        const user = JSON.parse(userData);
        const username = user.uid || user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        // Get current month/year
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        const month = monthSelect.value;
        const year = yearInput.value;
        const monthYear = `${month}-${year}`;
        
        console.log(`Saving data for ${monthNames[month]} ${year} (${monthYear})`);
        console.log('Current form data:', window.currentFormData);
        
        // Get existing data
        const existingData = localStorage.getItem(dataKey);
        let allData = existingData ? JSON.parse(existingData) : {};
        
        // Update current month's data
        allData[monthYear] = window.currentFormData || [];
        
        // Save back to localStorage
        localStorage.setItem(dataKey, JSON.stringify(allData));
        
        console.log('Saved to main storage:', allData);
        
        // Create timestamped backup
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupKey = `backup_${username}_${timestamp}`;
        localStorage.setItem(backupKey, JSON.stringify(allData));
        
        // Also create cloud backup
        const cloudBackup = {
            username: username,
            data: allData,
            timestamp: new Date().toISOString(),
            source: 'manual_save'
        };
        localStorage.setItem(`cloud_backup_${username}`, JSON.stringify(cloudBackup));
        
        console.log(`✅ Form saved: ${window.currentFormData.length} entries for ${monthNames[month]} ${year}`);
        console.log(`✅ Backup created: ${backupKey}`);
        
        // Update last saved timestamp
        localStorage.setItem('lastSaved', new Date().toISOString());
        
        showNotification(`Saved ${window.currentFormData.length} entries`, 'success');
        
        // Auto-sync if enabled
        if (localStorage.getItem('autoSyncEnabled') === 'true') {
            console.log('Auto-sync enabled, syncing to cloud...');
            syncToCloud();
        }
        
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Error saving form', 'error');
    }
}

// ==================== UTILITIES =====================

// ==================== CALCULATE TOTAL ====================
function calculateTotal() {
    console.log('Calculating total hours...');
    
    const rows = document.querySelectorAll('#time-table tbody tr');
    let totalMinutes = 0;
    
    rows.forEach(row => {
        const hoursText = row.cells[4].textContent;
        if (hoursText && hoursText !== '') {
            const [hours, minutes] = hoursText.split(':').map(Number);
            if (!isNaN(hours)) totalMinutes += hours * 60;
            if (!isNaN(minutes)) totalMinutes += minutes;
        }
    });
    
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    
    const totalDisplay = `${totalHours}:${remainingMinutes.toString().padStart(2, '0')}`;
    document.getElementById('total-hours').textContent = totalDisplay;
    
    showNotification(`Total calculated: ${totalDisplay} hours`);
    return totalDisplay;
}

function loadPDFLibrary() {
    return new Promise((resolve, reject) => {
        console.log('Loading PDF library...');
        
        // Check if already loaded
        if (window.jspdf && window.jspdf.jsPDF) {
            console.log('PDF library already loaded');
            resolve();
            return;
        }
        
        let loadedCount = 0;
        const totalScripts = 2;
        
        const checkAllLoaded = () => {
            loadedCount++;
            if (loadedCount === totalScripts) {
                console.log('✅ All PDF scripts loaded');
                // Wait a bit for initialization
                setTimeout(resolve, 500);
            }
        };
        
        // Load jsPDF
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script1.onload = checkAllLoaded;
        script1.onerror = () => {
            console.error('Failed to load jsPDF');
            reject(new Error('Failed to load PDF library'));
        };
        
        // Load autoTable plugin
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        script2.onload = checkAllLoaded;
        script2.onerror = () => {
            console.error('Failed to load autoTable plugin');
            // Still resolve if main library loaded
            checkAllLoaded();
        };
        
        // Add to document
        document.head.appendChild(script1);
        document.head.appendChild(script2);
        
        // Set timeout for safety
        setTimeout(() => {
            if (window.jspdf) {
                resolve();
            }
        }, 5000);
    });
}

// ==================== GENERATE PDF - A4 OPTIMIZED ====================
function generatePDF() {
    console.log('Generating A4 PDF...');
    
    // Check if jsPDF is loaded
    if (!window.jspdf) {
        alert('PDF library not loaded. Please ensure you have internet connection.');
        loadPDFLibrary().then(() => generatePDF());
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
        const employeeName = document.getElementById('employee-name').value || 'Employee Name';
        const totalHours = document.getElementById('total-hours').textContent;
        
        const month = parseInt(monthSelect.value);
        const year = parseInt(yearInput.value);
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
            const date = row.cells[0].textContent;
            const amPm = row.cells[1].textContent;
            const timeIn = row.cells[2].textContent;
            const timeOut = row.cells[3].textContent;
            const hours = row.cells[4].textContent;
            
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

// Load PDF library dynamically
function loadPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) {
            resolve();
            return;
        }
        
        // Load jsPDF
        const script1 = document.createElement('script');
        script1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        
        // Load autoTable plugin
        const script2 = document.createElement('script');
        script2.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        
        script1.onload = () => {
            script2.onload = () => resolve();
            document.head.appendChild(script2);
        };
        
        script1.onerror = reject;
        document.head.appendChild(script1);
    });
}

// ==================== PRINT FORM ====================
function printForm() {
    console.log('Printing form...');
    
    // Create a print-friendly window
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
        alert('Please allow popups to print the form.');
        return;
    }
    
    // Get data
    const month = document.getElementById('month-select').value;
    const year = document.getElementById('year-input').value;
    const employeeName = document.getElementById('employee-name').value;
    const totalHours = document.getElementById('total-hours').textContent;
    
    // Get table data
    let tableRows = '';
    const rows = document.querySelectorAll('#time-table tbody tr');
    
    rows.forEach(row => {
        const date = row.cells[0].textContent;
        const amPm = row.cells[1].textContent;
        const timeIn = row.cells[2].textContent;
        const timeOut = row.cells[3].textContent;
        const hours = row.cells[4].textContent;
        
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

// ==================== CLEAR FORM ====================
function clearForm() {
    if (confirm('Are you sure you want to clear ALL entries for this month?\nThis action cannot be undone.')) {
        console.log('Clearing form...');
        
        const tableBody = document.querySelector('#time-table tbody');
        if (tableBody) {
            tableBody.innerHTML = '';
        }
        
        currentFormData = [];
        document.getElementById('total-hours').textContent = '0:00';
        
        // Clear from localStorage
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                const username = user.email.split('@')[0];
                const dataKey = `userData_${username}`;
                
                const month = document.getElementById('month-select').value;
                const year = document.getElementById('year-input').value;
                const monthYear = `${month}-${year}`;
                
                const existingData = localStorage.getItem(dataKey);
                if (existingData) {
                    const allData = JSON.parse(existingData);
                    // Only clear current month
                    allData[monthYear] = [];
                    localStorage.setItem(dataKey, JSON.stringify(allData));
                }
            } catch (error) {
                console.error('Error clearing from storage:', error);
            }
        }
        
        showNotification('Form cleared successfully');
    }
}

// ==================== SAVE FORM ====================
function saveForm() {
    console.log('Saving form...');
    
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            alert('Please log in first');
            return;
        }
        
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        // Get current month/year
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        const monthYear = `${month}-${year}`;
        
        // Get existing data
        const existingData = localStorage.getItem(dataKey);
        let allData = existingData ? JSON.parse(existingData) : {};
        
        // Update current month's data
        allData[monthYear] = currentFormData;
        
        // Save back to localStorage
        localStorage.setItem(dataKey, JSON.stringify(allData));
        
        // Also save to a backup key
        localStorage.setItem(`${dataKey}_backup_${Date.now()}`, JSON.stringify(allData));
        
        console.log(`Form saved: ${currentFormData.length} entries for ${monthNames[month]} ${year}`);
        
        // Update last saved timestamp
        localStorage.setItem('lastSaved', new Date().toISOString());
        
        showNotification('Form saved successfully!');
        
        // Auto-sync if enabled
        if (localStorage.getItem('autoSyncEnabled') === 'true') {
            syncToCloud();
        }
        
    } catch (error) {
        console.error('Save error:', error);
        showNotification('Error saving form', 'error');
    }
}

// ==================== ENHANCED SYNC TO CLOUD ====================
async function syncToCloud() {
    console.log('=== SYNC TO CLOUD ===');
    
    // Show syncing status
    const statusElement = document.getElementById('sync-status') || createSyncStatusElement();
    statusElement.innerHTML = '<span style="color: #2196F3;">🔄 Syncing...</span>';
    
    try {
        // Check current user
        const userInfo = checkCurrentUser();
        if (!userInfo) {
            throw new Error('Please log in first');
        }
        
        const { username } = userInfo;
        const dataKey = `userData_${username}`;
        
        // Get all user data
        const allData = localStorage.getItem(dataKey);
        if (!allData) {
            console.warn('No local data found for sync');
            statusElement.innerHTML = '<span style="color: #FF9800;">ℹ️ No data to sync</span>';
            showNotification('No data to sync. Save some entries first.', 'warning');
            return;
        }
        
        console.log('Data to sync:', JSON.parse(allData));
        
        // Check Firebase availability
        if (!window.firebase || !window.firebase.firestore) {
            console.warn('Firebase not available, using local backup');
            return fallbackCloudSync(username, allData, statusElement);
        }
        
        if (!firebase.apps.length) {
            console.error('Firebase not initialized');
            return fallbackCloudSync(username, allData, statusElement);
        }
        
        // Test Firebase connection first
        try {
            await testFirebaseConnection();
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            return fallbackCloudSync(username, allData, statusElement);
        }
        
        // Try Firebase sync
        const success = await syncToFirebase(username, JSON.parse(allData));
        
        if (success) {
            // Firebase sync successful
            statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Synced to Firebase</span>';
            showNotification('Data synced to cloud!', 'success');
            
            // Update last sync time
            localStorage.setItem('lastCloudSync', new Date().toISOString());
            updateLastSyncDisplay();
        } else {
            // Fallback to localStorage backup
            fallbackCloudSync(username, allData, statusElement);
        }
        
    } catch (error) {
        console.error('Sync error:', error);
        statusElement.innerHTML = `<span style="color: #f44336;">❌ ${error.message}</span>`;
        showNotification('Sync failed: ' + error.message, 'error');
    }
}

// ==================== FIREBASE DATA REPAIR FUNCTIONS ====================
async function quickFirebaseCheck() {
    console.log('=== QUICK FIREBASE CHECK ===');
    
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        alert('Please log in first');
        return;
    }
    
    const user = JSON.parse(userData);
    const username = user.uid || user.email.split('@')[0];
    
    console.log('User UID:', user.uid);
    console.log('User email:', user.email);
    console.log('Username for lookup:', username);
    
    if (!window.firebase || !firebase.firestore) {
        alert('Firebase not available');
        return;
    }
    
    const db = firebase.firestore();
    
    // Try both possible document IDs
    const possibleIds = [
        username, // UID
        user.email.split('@')[0], // dmoseley
        user.email // dmoseley@gams.edu.bb
    ];
    
    for (const docId of possibleIds) {
        console.log(`Checking document: ${docId}`);
        const userRef = db.collection('user_data').doc(docId);
        
        try {
            const doc = await userRef.get();
            
            if (doc.exists) {
                const data = doc.data();
                console.log(`✅ Found document with ID: ${docId}`);
                console.log('Document data:', data);
                
                let message = `Firebase Data (found with ID: ${docId}):\n\n`;
                
                if (data.data) {
                    message += `Data field type: ${typeof data.data}\n`;
                    
                    if (typeof data.data === 'string') {
                        message += `⚠️ PROBLEM: Data is stored as string, not object!\n`;
                        message += `Sample: ${data.data.substring(0, 100)}...\n\n`;
                        message += `Click "Repair Firebase Data" to fix this.`;
                    } else {
                        message += `✅ Data is proper object\n`;
                        message += `Months: ${Object.keys(data.data).join(', ')}\n`;
                    }
                } else {
                    message += `❌ No data field found\n`;
                }
                
                alert(message);
                return;
            } else {
                console.log(`❌ No document with ID: ${docId}`);
            }
        } catch (error) {
            console.error(`Error checking ${docId}:`, error);
        }
    }
    
    alert(`No Firebase data found for any of these IDs:\n${possibleIds.join('\n')}`);
}

async function repairFirebaseData() {
    console.log('🔧 Attempting to repair Firebase data...');
    
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            alert('Please log in first');
            return;
        }
        
        const user = JSON.parse(userData);
        
        if (!window.firebase || !firebase.firestore) {
            alert('Firebase not available');
            return;
        }
        
        const db = firebase.firestore();
        
        // Try both document IDs
        const possibleIds = [
            user.uid, // Kr2EAmQ97vP0gouIF0ULpj4EhB63
            user.email.split('@')[0] // dmoseley
        ];
        
        let targetDocId = null;
        let firebaseData = null;
        
        // Find which document exists
        for (const docId of possibleIds) {
            const userRef = db.collection('user_data').doc(docId);
            const doc = await userRef.get();
            
            if (doc.exists) {
                targetDocId = docId;
                firebaseData = doc.data();
                console.log(`Found data in document: ${docId}`);
                break;
            }
        }
        
        if (!targetDocId || !firebaseData) {
            alert('No Firebase data found to repair');
            return;
        }
        
        console.log('Current Firebase data:', firebaseData);
        
        // Check if data field is a string (malformed)
        if (typeof firebaseData.data === 'string') {
            console.log('⚠️ Data field is a string, attempting to parse...');
            
            try {
                // Try to parse the string
                const fixedString = firebaseData.data
                    .replace(/""/g, '"') // Replace "" with "
                    .replace(/\\"/g, '"') // Replace \" with "
                    .replace(/\\n/g, '')  // Remove \n
                    .replace(/\\r/g, '')  // Remove \r
                    .trim();
                
                console.log('Fixed string:', fixedString.substring(0, 200) + '...');
                
                // Try to parse
                let parsedData;
                
                // Remove outer quotes if present
                let jsonStr = fixedString;
                if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
                    jsonStr = jsonStr.slice(1, -1);
                }
                
                parsedData = JSON.parse(jsonStr);
                console.log('✅ Successfully parsed data');
                console.log('Parsed data:', parsedData);
                
                if (confirm(`Found ${Object.keys(parsedData).length} months of data in malformed format.\n\nRepair Firebase data in document ${targetDocId}?`)) {
                    // Update Firebase with proper JSON
                    const userRef = db.collection('user_data').doc(targetDocId);
                    
                    await userRef.set({
                        user_id: user.uid,
                        user_email: user.email,
                        username: user.email.split('@')[0],
                        data: parsedData, // Now proper JSON object
                        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                        last_repaired: new Date().toISOString(),
                        repair_note: 'Fixed malformed JSON string'
                    }, { merge: true });
                    
                    alert(`✅ Firebase data repaired in document ${targetDocId}!`);
                    
                    // Also save to localStorage with correct key
                    const localStorageKey = `userData_${user.uid}`;
                    localStorage.setItem(localStorageKey, JSON.stringify(parsedData));
                    
                    console.log('Saved to localStorage with key:', localStorageKey);
                    
                    // Reload the page
                    setTimeout(() => location.reload(), 1000);
                }
                
            } catch (parseError) {
                console.error('Failed to parse data:', parseError);
                console.error('Original string start:', firebaseData.data.substring(0, 200));
                
                // Try to manually extract data
                const extracted = manuallyExtractData(firebaseData.data);
                if (extracted) {
                    if (confirm('Found data through manual extraction. Repair?')) {
                        const userRef = db.collection('user_data').doc(targetDocId);
                        await userRef.set({
                            data: extracted,
                            updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                            repair_note: 'Manual extraction'
                        }, { merge: true });
                        
                        alert('✅ Data repaired with manual extraction!');
                        setTimeout(() => location.reload(), 1000);
                    }
                } else {
                    alert('Could not parse the malformed data. Manual intervention required.');
                }
            }
        } else {
            console.log('✅ Data field is already a proper object');
            alert('Firebase data appears to be in proper format already.');
        }
        
    } catch (error) {
        console.error('Repair error:', error);
        alert('Error during repair: ' + error.message);
    }
}

function manuallyExtractData(malformedString) {
    console.log('Attempting manual extraction...');
    
    try {
        // Look for patterns like "8-2025":[{...}]
        const monthPattern = /"(\d+-\d+)":\s*\[/g;
        const matches = [...malformedString.matchAll(monthPattern)];
        
        if (matches.length > 0) {
            const result = {};
            
            matches.forEach((match, index) => {
                const monthYear = match[1];
                const start = match.index + match[0].length - 1; // Position after [
                
                // Find the closing bracket for this array
                let bracketCount = 1;
                let end = start;
                
                while (bracketCount > 0 && end < malformedString.length) {
                    end++;
                    if (malformedString[end] === '[') bracketCount++;
                    if (malformedString[end] === ']') bracketCount--;
                }
                
                if (end > start) {
                    const arrayContent = malformedString.substring(start, end);
                    // Try to parse individual entries
                    const entryMatches = arrayContent.match(/{[^}]+}/g);
                    if (entryMatches) {
                        const entries = entryMatches.map(entryStr => {
                            try {
                                // Clean up the entry string
                                const cleaned = entryStr
                                    .replace(/""/g, '"')
                                    .replace(/"(\w+)":/g, '"$1":') // Ensure proper keys
                                    .replace(/:""/g, ':"') // Fix values
                                    .replace(/",/g, '",');
                                return JSON.parse(cleaned);
                            } catch (e) {
                                return null;
                            }
                        }).filter(entry => entry);
                        
                        result[monthYear] = entries;
                    }
                }
            });
            
            console.log('Manually extracted:', result);
            return Object.keys(result).length > 0 ? result : null;
        }
    } catch (error) {
        console.error('Manual extraction failed:', error);
    }
    
    return null;
}

async function forceCloudSync() {
    console.log('=== FORCE CLOUD SYNC ===');
    
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        alert('Please log in first');
        return;
    }
    
    const user = JSON.parse(userData);
    const userId = user.uid; // Use UID, not email
    const localStorageKey = `userData_${userId}`;
    
    // Get local data
    const localData = localStorage.getItem(localStorageKey);
    if (!localData) {
        alert('No local data to sync');
        return;
    }
    
    try {
        const parsedData = JSON.parse(localData);
        
        if (!window.firebase || !firebase.firestore) {
            alert('Firebase not available');
            return;
        }
        
        const db = firebase.firestore();
        
        // Save to both possible documents to ensure data is accessible
        const docsToUpdate = [
            { id: userId, note: 'uid_document' },
            { id: user.email.split('@')[0], note: 'username_document' }
        ];
        
        for (const docInfo of docsToUpdate) {
            const userRef = db.collection('user_data').doc(docInfo.id);
            
            try {
                await userRef.set({
                    user_id: userId,
                    user_email: user.email,
                    username: user.email.split('@')[0],
                    data: parsedData, // Proper JSON object
                    updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                    last_sync: new Date().toISOString(),
                    sync_type: 'force_sync',
                    format: 'proper_json',
                    note: docInfo.note
                }, { merge: true });
                
                console.log(`✅ Saved to ${docInfo.id} (${docInfo.note})`);
            } catch (error) {
                console.error(`Error saving to ${docInfo.id}:`, error);
            }
        }
        
        alert('✅ Force sync complete! Data saved to both UID and username documents.');
        
        // Update display
        const statusElement = document.getElementById('sync-status') || createSyncStatusElement();
        statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Force sync complete</span>';
        updateLastSyncDisplay();
        
    } catch (error) {
        console.error('Force sync error:', error);
        alert('Error: ' + error.message);
    }
}

// ==================== FIX DATA KEY MISMATCH ====================
// Update your loadUserData function to use UID consistently
function loadUserData() {
    console.log('=== loadUserData() called ===');
    
    try {
        // Get current user
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            console.log('No user found');
            return;
        }
        
        const user = JSON.parse(userData);
        const userId = user.uid; // Use UID, not email username
        console.log('Loading data for user UID:', userId);
        
        // Get current month/year
        const monthSelect = document.getElementById('month-select');
        const yearInput = document.getElementById('year-input');
        
        if (!monthSelect || !yearInput) {
            console.error('Month/Year elements not found');
            return;
        }
        
        const month = monthSelect.value;
        const year = yearInput.value;
        const monthYear = `${month}-${year}`;
        console.log('Loading data for period:', monthYear);
        
        // Try multiple data sources in order
        let loadedData = null;
        
        // 1. Try main storage with UID key
        const dataKey = `userData_${userId}`;
        const savedData = localStorage.getItem(dataKey);
        
        if (savedData) {
            console.log('Found data in main storage with UID key');
            try {
                const allData = JSON.parse(savedData);
                loadedData = allData[monthYear] || [];
                console.log(`Loaded ${loadedData.length} entries from main storage`);
            } catch (e) {
                console.error('Error parsing main data:', e);
                loadedData = [];
            }
        } else {
            console.log('No data in main storage with UID key');
            
            // Try old username key for backward compatibility
            const oldKey = `userData_${user.email.split('@')[0]}`;
            const oldData = localStorage.getItem(oldKey);
            if (oldData) {
                console.log('Found data with old username key, migrating...');
                try {
                    const allData = JSON.parse(oldData);
                    loadedData = allData[monthYear] || [];
                    // Migrate to UID key
                    localStorage.setItem(dataKey, oldData);
                    console.log('Migrated data from username to UID key');
                } catch (e) {
                    console.error('Error migrating old data:', e);
                }
            }
        }
        
        // 2. If no data, try recent backup
        if (!loadedData || loadedData.length === 0) {
            console.log('Trying backups...');
            loadedData = tryLoadFromBackups(userId, monthYear);
        }
        
        // Update global variable
        window.currentFormData = loadedData || [];
        console.log('Final currentFormData:', window.currentFormData);
        
        // Render table
        renderTable();
        
        // Calculate total
        calculateTotal();
        
        // Show notification if data loaded
        if (window.currentFormData.length > 0) {
            showNotification(`Loaded ${window.currentFormData.length} entries for ${monthNames[month]} ${year}`, 'success');
        } else {
            console.log('No data loaded for this period');
        }
        
    } catch (error) {
        console.error('Error in loadUserData:', error);
        showNotification('Error loading data', 'error');
    }
}

// Update tryLoadFromBackups to use UID
function tryLoadFromBackups(userId, monthYear) {
    const allKeys = Object.keys(localStorage);
    
    // Look for backup keys with UID first, then username
    const username = localStorage.getItem('currentUser') ? 
        JSON.parse(localStorage.getItem('currentUser')).email.split('@')[0] : '';
    
    const backupKeys = allKeys.filter(key => 
        key.includes(userId) || 
        key.includes(username) ||
        key.includes('backup') || 
        key.includes('cloud_backup')
    ).sort().reverse(); // Newest first
    
    console.log('Backup keys found:', backupKeys);
    
    for (const key of backupKeys) {
        try {
            const data = localStorage.getItem(key);
            if (!data) continue;
            
            const parsed = JSON.parse(data);
            console.log(`Checking backup ${key}:`, typeof parsed);
            
            // Try different backup formats
            let monthData = null;
            
            if (parsed.data && parsed.data[monthYear]) {
                // Format: {data: {[monthYear]: [...]}}
                monthData = parsed.data[monthYear];
            } else if (parsed[monthYear]) {
                // Format: {[monthYear]: [...]}
                monthData = parsed[monthYear];
            } else if (Array.isArray(parsed) && parsed[0] && parsed[0].date) {
                // Direct array (old format)
                monthData = parsed;
            }
            
            if (monthData && monthData.length > 0) {
                console.log(`✅ Found ${monthData.length} entries in backup ${key}`);
                return monthData;
            }
        } catch (e) {
            console.log(`Error parsing backup ${key}:`, e.message);
        }
    }
    
    console.log('No data found in backups');
    return [];
}

// Test Firebase connection
async function testFirebaseConnection() {
    return new Promise((resolve, reject) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                reject(new Error('Firebase not available'));
                return;
            }
            
            const db = firebase.firestore();
            const testRef = db.collection('_test_connection').doc('test');
            
            // Try to write and read a test document
            testRef.set({
                test: true,
                timestamp: new Date().toISOString()
            }, { merge: true })
            .then(() => testRef.get())
            .then(doc => {
                if (doc.exists) {
                    console.log('✅ Firebase connection test passed');
                    resolve(true);
                } else {
                    reject(new Error('Test document not found'));
                }
            })
            .catch(error => {
                console.error('Firebase test error:', error);
                reject(error);
            });
            
        } catch (error) {
            reject(error);
        }
    });
}

// Enhanced Firebase sync
async function syncToFirebase(username, data) {
    console.log('Attempting Firebase sync for user:', username);
    
    return new Promise((resolve) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                console.log('Firebase not available');
                resolve(false);
                return;
            }
            
            const db = firebase.firestore();
            
            // Use the UID from localStorage
            const userData = localStorage.getItem('currentUser');
            const user = userData ? JSON.parse(userData) : null;
            const userId = user ? user.uid : username;
            
            const userRef = db.collection('user_data').doc(userId);
            
            const syncData = {
                user_id: userId,
                user_email: user ? user.email : '',
                username: user ? user.email.split('@')[0] : '',
                data: data,
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                last_sync: new Date().toISOString(),
                device: navigator.userAgent,
                sync_type: 'manual',
                app_version: '1.0'
            };
            
            userRef.set(syncData, { merge: true })
            .then(() => {
                console.log('✅ Firebase sync successful for', userId);
                resolve(true);
            })
            .catch(error => {
                console.error('❌ Firebase set error:', error);
                resolve(false);
            });
            
        } catch (error) {
            console.error('Firebase sync error:', error);
            resolve(false);
        }
    });
}

// ==================== ENHANCED SYNC FROM CLOUD ====================
async function syncFromCloud() {
    console.log('=== SYNC FROM CLOUD ===');
    
    const statusElement = document.getElementById('sync-status') || createSyncStatusElement();
    statusElement.innerHTML = '<span style="color: #2196F3;">🔄 Loading from cloud...</span>';
    
    try {
        // Check current user
        const userInfo = checkCurrentUser();
        if (!userInfo) {
            throw new Error('Please log in first');
        }
        
        const { username } = userInfo;
        
        console.log('Loading cloud data for:', username);
        
        // Check Firebase availability
        if (!window.firebase || !window.firebase.firestore || !firebase.apps.length) {
            console.log('Firebase not available, using backup');
            return loadFromBackup(username, statusElement);
        }
        
        // Try to load from Firebase
        const cloudData = await loadFromFirebase(username);
        
        if (cloudData && cloudData.data) {
            // Save to localStorage
            const dataKey = `userData_${username}`;
            localStorage.setItem(dataKey, JSON.stringify(cloudData.data));
            
            console.log('✅ Loaded from Firebase:', cloudData.data);
            
            // Reload the data
            if (typeof loadUserData === 'function') {
                loadUserData();
            }
            
            statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Loaded from Firebase</span>';
            showNotification('Data loaded from cloud!', 'success');
            
            // Update last sync time
            localStorage.setItem('lastCloudSync', new Date().toISOString());
            updateLastSyncDisplay();
            
            return true;
        } else {
            // No Firebase data, try backup
            console.log('No Firebase data found, trying backup');
            return loadFromBackup(username, statusElement);
        }
        
    } catch (error) {
        console.error('Load from cloud error:', error);
        statusElement.innerHTML = `<span style="color: #f44336;">❌ ${error.message}</span>`;
        showNotification('Load failed: ' + error.message, 'error');
        return false;
    }
}

// Enhanced load from Firebase
async function loadFromFirebase(username) {
    console.log('Loading from Firebase for user:', username);
    
    return new Promise((resolve) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                console.log('Firebase not available');
                resolve(null);
                return;
            }
            
            const db = firebase.firestore();
            const userRef = db.collection('user_data').doc(username);
            
            userRef.get()
            .then(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    console.log('✅ Firebase data found:', data);
                    resolve(data);
                } else {
                    console.log('No Firebase data found for', username);
                    resolve(null);
                }
            })
            .catch(error => {
                console.error('Firebase get error:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                resolve(null);
            });
            
        } catch (error) {
            console.error('Firebase load error:', error);
            resolve(null);
        }
    });
}

// Enhanced load from backup
function loadFromBackup(username, statusElement) {
    console.log('Loading from backup for user:', username);
    
    try {
        // Check multiple backup keys
        const backupKeys = [
            `cloud_backup_${username}`,
            `backup_${username}`,
            `userData_${username}`,
            `userData_backup_${username}`,
            `backup_${username}_${new Date().toISOString().split('T')[0]}`
        ];
        
        let backupData = null;
        let backupKey = null;
        
        for (const key of backupKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`Found backup at: ${key}`);
                backupData = data;
                backupKey = key;
                break;
            }
        }
        
        if (backupData) {
            try {
                const parsed = JSON.parse(backupData);
                console.log('Backup data:', parsed);
                
                // Handle different backup formats
                let userData = null;
                
                if (parsed.data) {
                    // Firebase format: { data: {...} }
                    userData = parsed.data;
                } else if (parsed.username === username && parsed.data) {
                    // Local backup format: { username: ..., data: ... }
                    userData = parsed.data;
                } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Direct data object
                    userData = parsed;
                }
                
                if (userData) {
                    const dataKey = `userData_${username}`;
                    localStorage.setItem(dataKey, JSON.stringify(userData));
                    
                    console.log('✅ Restored from backup:', userData);
                    
                    // Reload the data
                    if (typeof loadUserData === 'function') {
                        loadUserData();
                    }
                    
                    statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Loaded from backup</span>';
                    showNotification('Data loaded from local backup', 'success');
                    return true;
                }
            } catch (parseError) {
                console.error('Error parsing backup:', parseError);
            }
        }
        
        console.log('❌ No backup data found');
        statusElement.innerHTML = '<span style="color: #FF9800;">ℹ️ No cloud data found</span>';
        showNotification('No cloud data available', 'info');
        return false;
        
    } catch (error) {
        console.error('Backup load error:', error);
        statusElement.innerHTML = '<span style="color: #f44336;">❌ Backup load failed</span>';
        showNotification('Backup load failed', 'error');
        return false;
    }
}

// Fallback cloud sync (localStorage backup)
function fallbackCloudSync(username, data, statusElement) {
    try {
        // Create cloud backup in localStorage
        const cloudBackup = {
            username: username,
            data: JSON.parse(data),
            timestamp: new Date().toISOString(),
            source: 'local_backup'
        };
        
        localStorage.setItem(`cloud_backup_${username}`, JSON.stringify(cloudBackup));
        
        // Also create a dated backup
        const backupKey = `backup_${username}_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, data);
        
        // Keep only last 7 backups
        cleanupOldBackups(username);
        
        statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Backed up locally</span>';
        showNotification('Data backed up locally', 'success');
        
        // Update last sync time
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        updateLastSyncDisplay();
        
    } catch (error) {
        console.error('Fallback sync error:', error);
        statusElement.innerHTML = '<span style="color: #f44336;">❌ Backup failed</span>';
        showNotification('Backup failed', 'error');
    }
}

// Create sync status element if it doesn't exist
function createSyncStatusElement() {
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return null;
    
    const statusElement = document.createElement('div');
    statusElement.id = 'sync-status';
    statusElement.style.marginLeft = '10px';
    statusElement.style.fontSize = '12px';
    userInfo.appendChild(statusElement);
    
    return statusElement;
}

// Update last sync display
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastCloudSync');
    const statusElement = document.getElementById('sync-status');
    
    if (statusElement && lastSync) {
        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const diffHours = Math.floor((now - lastSyncDate) / (1000 * 60 * 60));
        
        let statusText = `Last sync: ${lastSyncDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        let color = '#666';
        
        if (diffHours < 1) {
            color = '#4CAF50';
            statusText += ' 🟢';
        } else if (diffHours < 24) {
            color = '#FF9800';
            statusText += ' 🟡';
        } else {
            color = '#f44336';
            statusText += ' 🔴';
        }
        
        statusElement.innerHTML = `<span style="color: ${color}; font-size: 11px;">${statusText}</span>`;
    }
}

// Cleanup old backups
function cleanupOldBackups(username) {
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => key.startsWith('backup_') || key.startsWith('cloud_backup_'));
    
    // Sort by timestamp (newest first)
    backupKeys.sort((a, b) => {
        const timeA = localStorage.getItem(a) ? JSON.parse(localStorage.getItem(a)).timestamp : '';
        const timeB = localStorage.getItem(b) ? JSON.parse(localStorage.getItem(b)).timestamp : '';
        return new Date(timeB) - new Date(timeA);
    });
    
    // Remove old backups (keep only 7 most recent)
    if (backupKeys.length > 7) {
        for (let i = 7; i < backupKeys.length; i++) {
            localStorage.removeItem(backupKeys[i]);
        }
    }
}

// ==================== AUTO-SYNC ====================
let autoSyncInterval = null;
const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize auto-sync on app start
function initAutoSync() {
    console.log('Initializing auto-sync...');
    
    // Check if auto-sync is enabled
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
    
    // Create control if needed
    if (!document.getElementById('auto-sync-checkbox')) {
        createAutoSyncControl();
    }
    
    // Set checkbox state
    const checkbox = document.getElementById('auto-sync-checkbox');
    if (checkbox) {
        checkbox.checked = autoSyncEnabled;
    }
    
    // Start/stop sync
    if (autoSyncEnabled) {
        startAutoSync();
        console.log('Auto-sync enabled');
    } else {
        stopAutoSync();
        console.log('Auto-sync disabled');
    }
    
    // Update last sync display
    updateLastSyncDisplay();
}

function createAutoSyncControl() {
    // Add to user info section
    const userInfo = document.querySelector('.user-info');
    if (!userInfo) return;
    
    const autoSyncContainer = document.createElement('div');
    autoSyncContainer.className = 'auto-sync-container';
    autoSyncContainer.style.marginTop = '5px';
    autoSyncContainer.style.fontSize = '11px';
    
    autoSyncContainer.innerHTML = `
        <label>
            <input type="checkbox" id="auto-sync-checkbox" onchange="toggleAutoSync(this.checked)">
            Auto-sync every 5 min
        </label>
    `;
    
    userInfo.appendChild(autoSyncContainer);
}

function toggleAutoSync(enabled) {
    console.log('Auto-sync:', enabled ? 'ENABLED' : 'DISABLED');
    
    localStorage.setItem('autoSyncEnabled', enabled.toString());
    
    if (enabled) {
        startAutoSync();
        showNotification('Auto-sync enabled', 'success');
    } else {
        stopAutoSync();
        showNotification('Auto-sync disabled', 'info');
    }
}

function startAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    autoSyncInterval = setInterval(() => {
        // Only sync if user is online and app is active
        if (navigator.onLine && !document.hidden) {
            console.log('Auto-sync triggered');
            syncToCloud();
        }
    }, AUTO_SYNC_INTERVAL);
    
    console.log('Auto-sync started');
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
    
    console.log('Auto-sync stopped');
}

// Sync from cloud (load data)
function syncFromCloud() {
    console.log('Loading from cloud...');
    
    const statusElement = document.getElementById('sync-status') || createSyncStatusElement();
    statusElement.innerHTML = '<span style="color: #2196F3;">🔄 Loading from cloud...</span>';
    
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            throw new Error('Not logged in');
        }
        
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        
        // Try Firebase first
        if (window.firebase && window.firebase.firestore) {
            loadFromFirebase(username)
                .then(cloudData => {
                    if (cloudData) {
                        // Save to localStorage
                        const dataKey = `userData_${username}`;
                        localStorage.setItem(dataKey, JSON.stringify(cloudData.data));
                        
                        // Reload the data
                        loadUserData();
                        
                        statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Loaded from Firebase</span>';
                        showNotification('Data loaded from cloud!', 'success');
                    } else {
                        // Try fallback
                        loadFromBackup(username, statusElement);
                    }
                })
                .catch(error => {
                    console.error('Firebase load error:', error);
                    loadFromBackup(username, statusElement);
                });
        } else {
            loadFromBackup(username, statusElement);
        }
        
    } catch (error) {
        console.error('Load from cloud error:', error);
        statusElement.innerHTML = `<span style="color: #f44336;">❌ ${error.message}</span>`;
        showNotification('Load failed: ' + error.message, 'error');
    }
}

async function loadFromFirebase(username) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                resolve(null);
                return;
            }
            
            const db = firebase.firestore();
            const userRef = db.collection('user_data').doc(username);
            
            userRef.get()
                .then(doc => {
                    if (doc.exists) {
                        console.log('✅ Loaded from Firebase');
                        resolve(doc.data());
                    } else {
                        console.log('No Firebase data found');
                        resolve(null);
                    }
                })
                .catch(error => {
                    console.error('Firebase get error:', error);
                    resolve(null);
                });
                
        } catch (error) {
            console.error('Firebase load error:', error);
            resolve(null);
        }
    });
}

function loadFromBackup(username, statusElement) {
    try {
        const backupKey = `cloud_backup_${username}`;
        const backupData = localStorage.getItem(backupKey);
        
        if (backupData) {
            const parsed = JSON.parse(backupData);
            
            // Save to main storage
            const dataKey = `userData_${username}`;
            localStorage.setItem(dataKey, JSON.stringify(parsed.data));
            
            // Reload the data
            loadUserData();
            
            statusElement.innerHTML = '<span style="color: #4CAF50;">✅ Loaded from backup</span>';
            showNotification('Data loaded from backup', 'success');
        } else {
            statusElement.innerHTML = '<span style="color: #FF9800;">ℹ️ No cloud data found</span>';
            showNotification('No cloud data available', 'info');
        }
        
    } catch (error) {
        console.error('Backup load error:', error);
        statusElement.innerHTML = '<span style="color: #f44336;">❌ Backup load failed</span>';
        showNotification('Backup load failed', 'error');
    }
}

// ==================== NOTIFICATION FUNCTION ====================
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style based on type
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3',
        warning: '#FF9800'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ========= Simple Data Recovery Function =============
/*function recoverLostData() {
    console.log('🔍 Searching for lost data...');
    
    // Get current user
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        alert('Please log in first');
        return;
    }
    
    try {
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        
        console.log('Looking for data for user:', username);
        
        // Try different possible keys
        const possibleKeys = [
            `userData_${username}`,
            `userData_${username.toLowerCase()}`,
            'userData_demo',
            'broilerForms',
            'forms',
            'userData_test'
        ];
        
        let foundData = null;
        let foundKey = null;
        
        for (const key of possibleKeys) {
            const data = localStorage.getItem(key);
            if (data) {
                console.log(`Found data with key: ${key}`);
                try {
                    const parsed = JSON.parse(data);
                    
                    // Check if it's valid data
                    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].date) {
                        // Convert array to object format
                        const month = document.getElementById('month-select').value;
                        const year = document.getElementById('year-input').value;
                        const monthYear = `${month}-${year}`;
                        
                        const convertedData = {};
                        convertedData[monthYear] = parsed;
                        
                        foundData = convertedData;
                        foundKey = key;
                        break;
                    } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                        // Already in object format
                        foundData = parsed;
                        foundKey = key;
                        break;
                    }
                } catch (e) {
                    console.log(`Error parsing ${key}:`, e);
                }
            }
        }
        
        if (foundData) {
            // Save with correct key
            localStorage.setItem(`userData_${username}`, JSON.stringify(foundData));
            
            alert(`✅ Recovered data from ${foundKey}! Page will reload.`);
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            if (confirm('No data found. Create sample data?')) {
                const month = document.getElementById('month-select').value;
                const year = document.getElementById('year-input').value;
                const monthYear = `${month}-${year}`;
                
                // Create sample data structure
                const sampleData = [
                    {
                        date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`,
                        amPm: 'AM',
                        inTime: '08:00',
                        outTime: '12:00',
                        hours: '4:00'
                    },
                    {
                        date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`,
                        amPm: 'PM',
                        inTime: '13:00',
                        outTime: '17:00',
                        hours: '4:00'
                    }
                ];
                
                const allData = {};
                allData[monthYear] = sampleData;
                
                localStorage.setItem(`userData_${username}`, JSON.stringify(allData));
                
                alert('✅ Created sample data! Page will reload.');
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }
        
    } catch (error) {
        console.error('Recovery error:', error);
        alert('Error during recovery. Check console for details.');
    }
} */

async function recoverLostData() {
    console.log('🔍 Attempting comprehensive data recovery...');
    
    try {
        // Get current user
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            alert('Please log in first');
            return;
        }
        
        const user = JSON.parse(userData);
        const username = user.uid || user.email.split('@')[0];
        
        // Show recovery status
        showNotification('Searching for lost data...', 'info');
        
        // ===== STEP 1: Check Firebase FIRST =====
        let recoveredFromFirebase = false;
        let firebaseData = null;
        
        if (window.firebase && window.firebase.firestore) {
            console.log('Checking Firebase for data...');
            
            try {
                firebaseData = await recoverFromFirebase(username);
                if (firebaseData) {
                    recoveredFromFirebase = true;
                    console.log('✅ Found data in Firebase');
                }
            } catch (firebaseError) {
                console.error('Firebase recovery failed:', firebaseError);
            }
        }
        
        // ===== STEP 2: Check localStorage backups =====
        let localStorageData = null;
        if (!recoveredFromFirebase) {
            console.log('Checking localStorage backups...');
            localStorageData = recoverFromLocalStorage(username);
        }
        
        // ===== STEP 3: Combine results =====
        let recoveredData = null;
        let source = '';
        
        if (recoveredFromFirebase && firebaseData) {
            recoveredData = firebaseData;
            source = 'Firebase Cloud';
        } else if (localStorageData) {
            recoveredData = localStorageData;
            source = 'Local Backup';
        }
        
        // ===== STEP 4: Process recovered data =====
        if (recoveredData) {
            // Save with correct user key
            const userId = user.uid || user.email.split('@')[0];
            localStorage.setItem(`userData_${userId}`, JSON.stringify(recoveredData));
            
            // Create additional backup
            const timestamp = new Date().toISOString();
            const backupKey = `recovery_backup_${userId}_${timestamp}`;
            localStorage.setItem(backupKey, JSON.stringify({
                data: recoveredData,
                source: source,
                timestamp: timestamp
            }));
            
            alert(`✅ Recovered data from ${source}! Refreshing page...`);
            showNotification(`Data recovered from ${source}`, 'success');
            
            // Reload the page
            setTimeout(() => {
                location.reload();
            }, 1500);
            
        } else {
            // No data found anywhere
            console.log('No data found in Firebase or local backups');
            
            // Offer to create sample data
            if (confirm('No data found in cloud or backups. Create sample data for this month?')) {
                const month = document.getElementById('month-select')?.value || new Date().getMonth();
                const year = document.getElementById('year-input')?.value || new Date().getFullYear();
                const monthYear = `${month}-${year}`;
                
                const userId = user.uid || user.email.split('@')[0];
                const sampleData = createSampleData(month, year);
                
                localStorage.setItem(`userData_${userId}`, JSON.stringify(sampleData));
                
                alert('✅ Created sample data! Refreshing...');
                showNotification('Sample data created', 'success');
                
                setTimeout(() => {
                    location.reload();
                }, 1500);
            }
        }
        
    } catch (error) {
        console.error('Recovery error:', error);
        alert('Error during recovery: ' + error.message);
        showNotification('Recovery failed', 'error');
    }
}

// ===== HELPER FUNCTIONS =====

// Check Firebase for data
async function recoverFromFirebase(username) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                resolve(null);
                return;
            }
            
            const db = firebase.firestore();
            
            // Try multiple possible document locations
            const possibleDocRefs = [
                db.collection('user_data').doc(username),
                db.collection('broiler_claims').doc(username),
                db.collection('users').doc(username).collection('data').doc('broiler'),
                db.collection('timesheets').doc(username)
            ];
            
            let dataFound = false;
            let attempts = 0;
            const totalAttempts = possibleDocRefs.length;
            
            const tryNextDoc = () => {
                if (attempts >= totalAttempts) {
                    resolve(null);
                    return;
                }
                
                const docRef = possibleDocRefs[attempts];
                attempts++;
                
                docRef.get().then(doc => {
                    if (doc.exists) {
                        console.log(`Found data at ${docRef.path}`);
                        const data = doc.data();
                        
                        // Extract the form data
                        let formData = null;
                        
                        if (data.data) {
                            // Firebase format: { data: {...} }
                            formData = data.data;
                        } else if (Array.isArray(data.forms) || Array.isArray(data.entries)) {
                            // Alternative formats
                            formData = data.forms || data.entries;
                        } else {
                            // Try to use the whole document
                            formData = data;
                        }
                        
                        resolve(formData);
                        dataFound = true;
                    } else {
                        if (attempts < totalAttempts) {
                            tryNextDoc();
                        } else {
                            resolve(null);
                        }
                    }
                }).catch(error => {
                    console.error(`Error checking ${docRef.path}:`, error);
                    if (attempts < totalAttempts) {
                        tryNextDoc();
                    } else {
                        resolve(null);
                    }
                });
            };
            
            tryNextDoc();
            
        } catch (error) {
            console.error('Firebase recovery error:', error);
            resolve(null);
        }
    });
}

// Check localStorage for backups
function recoverFromLocalStorage(username) {
    console.log('Searching localStorage for backups...');
    
    const allKeys = Object.keys(localStorage);
    
    // Look for various backup patterns
    const backupPatterns = [
        `userData_${username}`,
        `userData_${username.toLowerCase()}`,
        `cloud_backup_${username}`,
        `backup_${username}_`,
        'broilerForms',
        'forms_',
        'userData_demo',
        'userData_test'
    ];
    
    for (const pattern of backupPatterns) {
        const matchingKeys = allKeys.filter(key => key.includes(pattern));
        
        for (const key of matchingKeys) {
            try {
                const data = localStorage.getItem(key);
                if (!data) continue;
                
                const parsed = JSON.parse(data);
                console.log(`Checking ${key}:`, typeof parsed);
                
                // Check if it contains valid form data
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].date) {
                    // Array of form entries
                    console.log(`✅ Found array data in ${key}: ${parsed.length} entries`);
                    return parsed;
                } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Object with month keys
                    for (const monthKey in parsed) {
                        if (Array.isArray(parsed[monthKey]) && parsed[monthKey].length > 0) {
                            console.log(`✅ Found object data in ${key}: ${parsed[monthKey].length} entries for ${monthKey}`);
                            return parsed;
                        }
                    }
                } else if (parsed.data && typeof parsed.data === 'object') {
                    // Nested data structure
                    console.log(`✅ Found nested data in ${key}`);
                    return parsed.data;
                }
            } catch (e) {
                console.log(`Error parsing ${key}:`, e.message);
            }
        }
    }
    
    return null;
}

// Create sample data
function createSampleData(month, year) {
    const monthYear = `${month}-${year}`;
    const monthName = monthNames[month] || 'Month';
    
    const sampleData = [
        {
            date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`,
            amPm: 'AM',
            inTime: '08:00',
            outTime: '12:00',
            hours: '4:00'
        },
        {
            date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`,
            amPm: 'PM',
            inTime: '13:00',
            outTime: '17:00',
            hours: '4:00'
        },
        {
            date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-15`,
            amPm: 'AM',
            inTime: '07:30',
            outTime: '11:45',
            hours: '4:15'
        }
    ];
    
    const allData = {};
    allData[monthYear] = sampleData;
    
    return allData;
}

// ==================== DEBUG FUNCTIONS ====================
function debugFirebase() {
    console.log('=== FIREBASE DEBUG ===');
    console.log('Firebase available:', typeof firebase !== 'undefined');
    console.log('Firestore available:', typeof firebase.firestore !== 'undefined');
    console.log('Firebase apps:', firebase.apps?.length || 0);
    
    // Check current user
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        const user = JSON.parse(userData);
        console.log('Current user:', user);
        console.log('Username for sync:', user.uid || user.email?.split('@')[0]);
    }
}

function checkCurrentUser() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.error('❌ No user data in localStorage');
        return null;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('✅ User found:', user);
        
        // Try different username formats
        const username = user.uid || user.email?.split('@')[0] || 'unknown';
        console.log('Username:', username);
        
        return { user, username };
    } catch (error) {
        console.error('❌ Error parsing user data:', error);
        return null;
    }
}

// ==================== COMPREHENSIVE DATA CHECK ====================
function checkAllData() {
    console.log('🔍 ===== COMPREHENSIVE DATA CHECK =====');
    
    // 1. Check current user
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.error('❌ No user logged in');
        alert('Please log in first');
        return;
    }
    
    const user = JSON.parse(userData);
    const username = user.uid || user.email.split('@')[0];
    console.log('✅ User:', user.email);
    console.log('✅ Username for data:', username);
    
    // 2. Check current month/year
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    const month = monthSelect?.value || new Date().getMonth();
    const year = yearInput?.value || new Date().getFullYear();
    const monthYear = `${month}-${year}`;
    console.log('✅ Current period:', monthNames[month], year, `(${monthYear})`);
    
    // 3. Check main data storage
    const mainKey = `userData_${username}`;
    const mainData = localStorage.getItem(mainKey);
    console.log(`✅ Main data key: ${mainKey}`);
    console.log(`✅ Main data exists: ${!!mainData}`);
    
    if (mainData) {
        try {
            const parsed = JSON.parse(mainData);
            console.log('✅ Main data structure:', typeof parsed);
            
            if (typeof parsed === 'object') {
                console.log('✅ Months in main data:', Object.keys(parsed));
                
                if (parsed[monthYear]) {
                    console.log(`✅ Data for ${monthYear}:`, parsed[monthYear]);
                    console.log(`✅ Entries for current month: ${parsed[monthYear].length}`);
                } else {
                    console.log(`❌ No data for current month (${monthYear})`);
                }
            }
        } catch (e) {
            console.error('❌ Error parsing main data:', e);
        }
    }
    
    // 4. Check backups
    console.log('\n📂 Checking backups...');
    const allKeys = Object.keys(localStorage);
    const backupKeys = allKeys.filter(key => 
        key.includes('backup') || 
        key.includes('cloud_backup') ||
        key.includes('recovery') ||
        key.includes(username)
    );
    
    console.log(`✅ Found ${backupKeys.length} backup keys`);
    backupKeys.forEach(key => {
        console.log(`   📁 ${key}`);
    });
    
    // 5. Check current form data
    console.log('\n📋 Current form data in memory:');
    console.log('✅ window.currentFormData:', window.currentFormData);
    console.log('✅ Type:', typeof window.currentFormData);
    console.log('✅ Length:', window.currentFormData ? window.currentFormData.length : 0);
    
    // 6. Check Firebase connection
    console.log('\n☁️ Firebase status:');
    console.log('✅ Firebase available:', !!window.firebase);
    console.log('✅ Firestore available:', !!window.firebase?.firestore);
    console.log('✅ Firebase initialized:', firebase?.apps?.length > 0);
    
    // 7. Try to get data from Firebase
    if (window.firebase && firebase.firestore) {
        console.log('\n🔄 Checking Firebase data...');
        checkFirebaseData(username).then(firebaseData => {
            if (firebaseData) {
                console.log('✅ Firebase data found:', firebaseData);
            } else {
                console.log('❌ No data in Firebase');
            }
        });
    }
    
    // 8. Show summary
    console.log('\n📊 SUMMARY:');
    console.log('1. User authenticated:', !!userData);
    console.log('2. Main data exists:', !!mainData);
    console.log('3. Current form data:', window.currentFormData?.length || 0, 'entries');
    console.log('4. Backups found:', backupKeys.length);
    console.log('5. Firebase available:', !!(window.firebase && firebase.firestore));
    
    // Alert summary
    alert(`Data Check Complete!\n\n` +
          `User: ${username}\n` +
          `Main Data: ${mainData ? 'Found' : 'Missing'}\n` +
          `Current Entries: ${window.currentFormData?.length || 0}\n` +
          `Backups: ${backupKeys.length}\n` +
          `Firebase: ${window.firebase ? 'Available' : 'Not Available'}\n\n` +
          `Check console (F12) for details.`);
}

// Helper to check Firebase data
async function checkFirebaseData(username) {
    try {
        if (!window.firebase || !firebase.firestore) return null;
        
        const db = firebase.firestore();
        const docRef = db.collection('user_data').doc(username);
        const doc = await docRef.get();
        
        if (doc.exists) {
            return doc.data();
        }
        return null;
    } catch (error) {
        console.error('Error checking Firebase:', error);
        return null;
    }
}

