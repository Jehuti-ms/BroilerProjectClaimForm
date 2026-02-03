// SIMPLE Broiler Claim Form - NO ERRORS
console.log('Simple App starting...');

console.log('app.js loading...');
console.log('Current page:', window.location.href);
console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));
console.log('Firebase auth state:', auth.currentUser);

// Basic data
let currentFormData = [];
const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Check authentication - SIMPLE VERSION
// Check authentication - UPDATED to handle Firebase state
// Check authentication - SIMPLE DEBUG VERSION
function checkAuth() {
    console.log('=== CHECKING AUTH ===');
    console.log('Current URL:', window.location.href);
    console.log('localStorage.currentUser:', localStorage.getItem('currentUser'));
    
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.log('❌ NO USER DATA - Redirecting to auth.html');
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('✅ USER FOUND:', user.email);
        return true;
    } catch (error) {
        console.log('❌ ERROR parsing user data:', error);
        window.location.href = 'auth.html';
        return false;
    }
}

// Save current month
function saveCurrentMonth() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (monthSelect && yearInput) {
        localStorage.setItem('lastViewedMonth', monthSelect.value);
        localStorage.setItem('lastViewedYear', yearInput.value);
        console.log('Saved month/year:', monthSelect.value, yearInput.value);
    }
}

// Update form date display
function updateFormDate() {
    console.log('Updating form date display...');
    
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) {
        console.log('Month/year elements not found');
        return;
    }
    
    const month = parseInt(monthSelect.value);
    const year = parseInt(yearInput.value);
    
    if (isNaN(month) || isNaN(year)) {
        console.log('Invalid month or year values');
        return;
    }
    
    // Validate month range (0-11 for JavaScript months)
    if (month < 0 || month > 11) {
        console.log('Month out of range:', month);
        monthSelect.value = new Date().getMonth(); // Reset to current month
        return;
    }
    
    // Validate year range
    const currentYear = new Date().getFullYear();
    if (year < 2000 || year > currentYear + 5) {
        console.log('Year out of range:', year);
        yearInput.value = currentYear; // Reset to current year
        return;
    }
    
    // Update the date display in header if it exists
    const dateDisplay = document.getElementById('form-date-display') || 
                        document.getElementById('current-month-display') ||
                        document.getElementById('header-date');
    
    if (dateDisplay) {
        dateDisplay.textContent = `${monthNames[month]} ${year}`;
    }
    
    console.log(`Date display updated: ${monthNames[month]} ${year}`);
}

// Setup employee name field - this IS who the claim is for
function setupEmployeeNameField() {
    console.log('Setting up employee name field...');
    
    const nameInput = document.getElementById('employee-name');
    if (!nameInput) {
        console.log('Employee name input not found');
        return;
    }
    
    // Load previously saved CLAIM recipient name (separate from logged in user)
    const savedClaimName = localStorage.getItem('claimEmployeeName');
    if (savedClaimName && savedClaimName.trim() !== '') {
        nameInput.value = savedClaimName;
        console.log('Loaded saved claim recipient name:', savedClaimName);
        
        // Update claim for display
        updateClaimForDisplay(savedClaimName);
    }
    
    // Auto-save with debouncing
    let saveTimeout;
    
    nameInput.addEventListener('input', function() {
        // Clear previous timeout
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        
        // Set new timeout (save after 1 second of inactivity)
        saveTimeout = setTimeout(() => {
            saveClaimRecipientName(this.value);
        }, 1000);
    });
    
    nameInput.addEventListener('blur', function() {
        saveClaimRecipientName(this.value);
    });
}

// Save claim recipient name (separate from logged in user)
function saveClaimRecipientName(name) {
    const trimmedName = name ? name.trim() : '';
    
    // Save to separate key to avoid confusion
    localStorage.setItem('claimEmployeeName', trimmedName);
    console.log('Claim recipient name saved:', trimmedName);
    
    // Update claim for display in header
    updateClaimForDisplay(trimmedName);
}

// Simple update claim for display
function updateClaimForDisplay(employeeName) {
    if (!employeeName || employeeName.trim() === '') return;
    
    // Look for existing claim for display
    let claimDisplay = document.getElementById('claim-for-display');
    
    if (!claimDisplay) {
        // Create it in the header area
        const header = document.querySelector('header') || 
                       document.querySelector('.app-header') ||
                       document.querySelector('h1')?.parentElement ||
                       document.body;
        
        if (header) {
            claimDisplay = document.createElement('div');
            claimDisplay.id = 'claim-for-display';
            claimDisplay.className = 'claim-for-display';
            claimDisplay.style.cssText = `
                text-align: center;
                font-size: 18px;
                font-weight: bold;
                margin: 10px 0 20px 0;
                color: #2c3e50;
                padding: 5px;
                background-color: #f8f9fa;
                border-radius: 5px;
            `;
            
            // Insert after the main title or at top
            const title = header.querySelector('h1');
            if (title) {
                title.insertAdjacentElement('afterend', claimDisplay);
            } else {
                header.insertBefore(claimDisplay, header.firstChild);
            }
        }
    }
    
    if (claimDisplay) {
        claimDisplay.textContent = `Claim Form for: ${employeeName}`;
    }
}

// Save employee name (who the claim is for)
function saveEmployeeName(name) {
    const trimmedName = name ? name.trim() : '';
    
    // Only save if not empty
    if (trimmedName === '') {
        console.log('Empty employee name, not saving');
        return;
    }
    
    localStorage.setItem('employeeName', trimmedName);
    console.log('Employee name saved:', trimmedName);
    
    // Update claim for display in header
    updateClaimForDisplay(trimmedName);
    
    // Also update any welcome message that might show this
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
        userDisplay.textContent = `Welcome, ${trimmedName}`;
    }
}

// Update "Claim for" display in header
function updateClaimForDisplay(employeeName) {
    // Look for existing claim for display
    let claimDisplay = document.getElementById('claim-for-display');
    
    if (!claimDisplay) {
        // Create it near the header
        const header = document.querySelector('header') || 
                       document.querySelector('.header') ||
                       document.querySelector('h1')?.parentElement;
        
        if (header) {
            claimDisplay = document.createElement('div');
            claimDisplay.id = 'claim-for-display';
            claimDisplay.className = 'claim-for-display';
            claimDisplay.style.cssText = `
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 5px 0 15px 0;
                color: #333;
            `;
            
            // Insert after the main title
            const title = header.querySelector('h1');
            if (title && title.nextSibling) {
                header.insertBefore(claimDisplay, title.nextSibling);
            } else {
                header.appendChild(claimDisplay);
            }
        }
    }
    
    if (claimDisplay) {
        claimDisplay.textContent = `Claim for: ${employeeName}`;
        claimDisplay.title = `Employee: ${employeeName}`;
    }
}

// Update user display to show logged in user (discreetly)
function updateUserDisplay() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const userDisplay = document.getElementById('user-display');
        
        if (userDisplay) {
            // Get the name from signup or use email
            const displayName = user.employeeName || user.displayName || user.email || 'User';
            
            // Show it discreetly - maybe as a tooltip or small text
            userDisplay.textContent = displayName;
            userDisplay.title = `Logged in as: ${displayName}\nClick to logout`;
            userDisplay.style.cursor = 'pointer';
            
            // Add logout on click
            userDisplay.onclick = function() {
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            };
        }
        
    } catch (error) {
        console.log('Error updating user display:', error);
    }
}

// Setup date validation
function setupDateValidation() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) return;
    
    // Add validation on change
    monthSelect.addEventListener('change', function() {
        validateDateInputs();
        updateFormDate();
    });
    
    yearInput.addEventListener('change', function() {
        validateDateInputs();
        updateFormDate();
    });
    
    yearInput.addEventListener('blur', validateDateInputs);
}

// Validate date inputs
function validateDateInputs() {
    const monthSelect = document.getElementById('month-select');
    const yearInput = document.getElementById('year-input');
    
    if (!monthSelect || !yearInput) return;
    
    const currentYear = new Date().getFullYear();
    let year = parseInt(yearInput.value);
    
    // Validate year range
    if (isNaN(year) || year < 2020 || year > currentYear + 1) {
        year = currentYear;
        yearInput.value = currentYear;
        console.log('Year reset to:', currentYear);
    }
    
    // Month validation
    const month = parseInt(monthSelect.value);
    if (isNaN(month) || month < 0 || month > 11) {
        monthSelect.value = new Date().getMonth();
        console.log('Month reset to current month');
    }
}

// Get current employee name (who claim is for)
function getCurrentEmployeeName() {
    const nameInput = document.getElementById('employee-name');
    if (nameInput && nameInput.value.trim() !== '') {
        return nameInput.value.trim();
    }
    
    const savedName = localStorage.getItem('employeeName');
    return savedName || 'Employee';
}

// Also update your checkAuth function to use the signup name properly
// In your checkAuth() function, change lines 26-27 from:
// const displayName = localStorage.getItem('employeeName') || user.employeeName || user.email || 'User';
// document.getElementById('user-display').textContent = `Welcome, ${displayName}`;

// To:
function checkAuth() {
    console.log('Checking auth...');
    
    // Check for user in localStorage
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        console.log('No user, going to auth page');
        window.location.href = 'auth.html';
        return false;
    }
    
    try {
        const user = JSON.parse(userData);
        console.log('User found:', user.email);
        
        // Get the name from signup (stored as employeeName during signup)
        const signupName = user.employeeName || user.displayName || user.email || 'User';
        
        // Update user display (logged in user)
        const userDisplay = document.getElementById('user-display');
        if (userDisplay) {
            userDisplay.textContent = signupName;
            userDisplay.title = `Logged in as: ${signupName}\nClick to logout`;
            userDisplay.style.cursor = 'pointer';
            userDisplay.onclick = function() {
                if (confirm('Are you sure you want to logout?')) {
                    logout();
                }
            };
        }
        
        // Set employee name input to saved claim recipient name (separate!)
        const nameInput = document.getElementById('employee-name');
        if (nameInput) {
            const claimRecipientName = localStorage.getItem('employeeName') || '';
            if (claimRecipientName) {
                nameInput.value = claimRecipientName;
                // Also update the claim for display
                updateClaimForDisplay(claimRecipientName);
            }
        }
        
        return true;
    } catch (error) {
        console.log('Auth error, redirecting:', error);
        window.location.href = 'auth.html';
        return false;
    }
}

// ================== Initialization ===================
// Initialize when page loads
document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded');
    
    const isAuthenticated = await checkAuth();
    
    if (isAuthenticated) {
        initializeApp();
    }
    // Note: checkAuth() handles redirect to auth.html if not authenticated
});

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
        updateFormDate();
        saveCurrentMonth();
        loadUserData();
    });
    
    yearInput.addEventListener('change', function() {
        console.log('Year changed to:', this.value);
        updateFormDate();
        saveCurrentMonth();
        loadUserData();
    });

    // Add date validation
    setupDateValidation();
    
    // Validate initial date inputs
    validateDateInputs();
    
    // Initial update of form date
    updateFormDate();

     // Save the current month selection
    saveCurrentMonth();
    
    // Set up name auto-save
    setupEmployeeNameField();
    
    // Load user data
    loadUserData();
    
    // Initialize auto-sync if needed
    if (typeof initAutoSync === 'function') {
        initAutoSync();
    }
    
    console.log('App initialized. Current month:', monthSelect.value, 'Year:', yearInput.value);
}

// Setup all listeners
function setupListeners() {
    // Month/year changes
    document.getElementById('month-select').addEventListener('change', updateFormDate);
    document.getElementById('year-input').addEventListener('change', updateFormDate);
    
    // Employee name auto-save
    const nameInput = document.getElementById('employee-name');
    nameInput.addEventListener('change', function() {
        localStorage.setItem('employeeName', this.value);
        document.getElementById('user-display').textContent = `Welcome, ${this.value}`;
    });
}

// Load user data
function loadUserData() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        const savedData = localStorage.getItem(dataKey);
        if (savedData) {
            const allData = JSON.parse(savedData);
            
            // Get current month
            const month = document.getElementById('month-select').value;
            const year = document.getElementById('year-input').value;
            const monthYear = `${month}-${year}`;
            
            if (allData[monthYear]) {
                currentFormData = allData[monthYear];
                renderTable();
            }
        }
    } catch (error) {
        console.log('Error loading data:', error);
    }
}

// Save data
function saveData() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) return;
    
    try {
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        // Get current month
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        const monthYear = `${month}-${year}`;
        
        // Get existing data
        const existing = localStorage.getItem(dataKey);
        let allData = existing ? JSON.parse(existing) : {};
        
        // Update current month
        allData[monthYear] = currentFormData;
        
        // Save
        localStorage.setItem(dataKey, JSON.stringify(allData));
        console.log('Data saved');
        
        // Show notification
        alert('Data saved successfully!');
    } catch (error) {
        console.log('Error saving:', error);
        alert('Error saving data');
    }
}

// Render table
function renderTable() {
    const tbody = document.querySelector('#time-table tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    currentFormData.forEach((entry, index) => {
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
    return `${displayHour}:${m} ${ampm}`;
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

// Calculate total hours
function calculateTotal() {
    let total = 0;
    
    currentFormData.forEach(entry => {
        if (entry.hours) {
            const [h, m] = entry.hours.split(':').map(Number);
            total += h * 60 + m;
        }
    });
    
    const hours = Math.floor(total / 60);
    const minutes = total % 60;
    
    const totalElement = document.getElementById('total-hours');
    if (totalElement) {
        totalElement.textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
}

// Open modal to add entry
function openModal() {
    // Clear any editing
    window.editingIndex = undefined;
    document.getElementById('modal-title').textContent = 'Add New Entry';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('entry-date').value = today;
    document.getElementById('entry-am-pm').value = 'AM';
    document.getElementById('entry-time-in').value = '';
    document.getElementById('entry-time-out').value = '';
    
    document.getElementById('entry-modal').style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('entry-modal').style.display = 'none';
    window.editingIndex = undefined;
}

// Save entry
function saveEntry() {
    const date = document.getElementById('entry-date').value;
    const amPm = document.getElementById('entry-am-pm').value;
    const inTime = document.getElementById('entry-time-in').value;
    const outTime = document.getElementById('entry-time-out').value;
    
    if (!date || !inTime || !outTime) {
        alert('Please fill all fields');
        return;
    }
    
    const hours = calculateHours(inTime, outTime);
    const entry = { date, amPm, inTime, outTime, hours };
    
    if (window.editingIndex !== undefined) {
        // Update existing
        currentFormData[window.editingIndex] = entry;
    } else {
        // Add new
        currentFormData.push(entry);
    }
    
    renderTable();
    saveData();
    closeModal();
}

// Edit row
function editRow(index) {
    const entry = currentFormData[index];
    
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
        currentFormData.splice(index, 1);
        renderTable();
        saveData();
    }
}

// Clear all entries
function clearForm() {
    if (confirm('Clear all entries for this month?')) {
        currentFormData = [];
        renderTable();
        saveData();
    }
}

// Logout
function logout() {
    console.log('Logging out...');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('employeeName');
    window.location.href = 'auth.html';
}

// Basic PDF
function generatePDF() {
    alert('PDF feature will be added later');
}

// Basic Print
function printForm() {
    alert('Print feature will be added later');
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

// ==================== GENERATE PDF ====================
function generatePDF() {
    console.log('Generating PDF...');
    
    // Check if jsPDF is loaded
    if (!window.jspdf) {
        alert('PDF library not loaded. Please ensure you have internet connection.');
        // Load jsPDF dynamically
        loadPDFLibrary().then(() => generatePDF());
        return;
    }
    
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Get data
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;
        const employeeName = document.getElementById('employee-name').value;
        const totalHours = document.getElementById('total-hours').textContent;
        
        // Header
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('Grantley Adams Memorial School', 105, 20, { align: 'center' });
        
        doc.setFontSize(16);
        doc.text('Broiler Production Project', 105, 30, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text('Claim Form', 105, 40, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`${monthNames[month]} ${year}`, 105, 50, { align: 'center' });
        
        // Employee Info
        doc.setFont('helvetica', 'normal');
        doc.text(`Employee: ${employeeName}`, 20, 65);
        
        // Create table data
        const tableData = [];
        const rows = document.querySelectorAll('#time-table tbody tr');
        
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
        
        // Add table if we have data
        if (tableData.length > 0 && jsPDF.API.autoTable) {
            doc.autoTable({
                startY: 75,
                head: [['Date', 'AM/PM', 'Time IN', 'Time OUT', 'Hours']],
                body: tableData,
                theme: 'grid',
                styles: { 
                    fontSize: 10, 
                    cellPadding: 3,
                    textColor: [0, 0, 0]
                },
                headStyles: { 
                    fillColor: [220, 220, 220],
                    textColor: [0, 0, 0],
                    fontStyle: 'bold'
                },
                margin: { left: 20, right: 20 }
            });
            
            // Add total hours
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(`Total Hours: ${totalHours}`, 160, finalY);
            
            // Add signature areas
            const signatureY = finalY + 25;
            
            doc.text('Signature Claimant:', 25, signatureY);
            doc.line(25, signatureY + 5, 75, signatureY + 5);
            
            doc.text('Signature HOD:', 85, signatureY);
            doc.line(85, signatureY + 5, 135, signatureY + 5);
            
            doc.text('Signature Principal:', 145, signatureY);
            doc.line(145, signatureY + 5, 185, signatureY + 5);
        } else {
            doc.text('No entries found', 20, 75);
        }
        
        // Set document properties
        doc.setProperties({
            title: `Broiler Claim Form - ${monthNames[month]} ${year}`,
            subject: 'Employee Time Claim',
            author: 'Grantley Adams Memorial School',
            keywords: 'broiler, claim, form, timesheet'
        });
        
        // Save the PDF
        const filename = `Broiler_Claim_${monthNames[month]}_${year}_${employeeName.replace(/\s+/g, '_')}.pdf`;
        doc.save(filename);
        
        showNotification('PDF generated successfully!');
        
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

// ==================== SYNC TO CLOUD ====================
function syncToCloud() {
    console.log('Syncing to cloud...');
    
    // Show syncing status
    const statusElement = document.getElementById('sync-status') || createSyncStatusElement();
    statusElement.innerHTML = '<span style="color: #2196F3;">🔄 Syncing...</span>';
    
    try {
        const userData = localStorage.getItem('currentUser');
        if (!userData) {
            throw new Error('Not logged in');
        }
        
        const user = JSON.parse(userData);
        const username = user.email.split('@')[0];
        const dataKey = `userData_${username}`;
        
        // Get all user data
        const allData = localStorage.getItem(dataKey);
        if (!allData) {
            throw new Error('No data to sync');
        }
        
        // Try Firebase sync first
        if (window.firebase && window.firebase.firestore) {
            syncToFirebase(username, JSON.parse(allData))
                .then(success => {
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
                })
                .catch(error => {
                    console.error('Firebase sync error:', error);
                    fallbackCloudSync(username, allData, statusElement);
                });
        } else {
            // Firebase not available, use fallback
            fallbackCloudSync(username, allData, statusElement);
        }
        
    } catch (error) {
        console.error('Sync error:', error);
        statusElement.innerHTML = `<span style="color: #f44336;">❌ ${error.message}</span>`;
        showNotification('Sync failed: ' + error.message, 'error');
    }
}

// Firebase sync function
async function syncToFirebase(username, data) {
    return new Promise((resolve, reject) => {
        try {
            if (!window.firebase || !window.firebase.firestore) {
                resolve(false);
                return;
            }
            
            const db = firebase.firestore();
            const userRef = db.collection('user_data').doc(username);
            
            userRef.set({
                user_id: username,
                data: data,
                updated_at: firebase.firestore.FieldValue.serverTimestamp(),
                last_sync: new Date().toISOString(),
                device: navigator.userAgent
            }, { merge: true })
            .then(() => {
                console.log('✅ Firebase sync successful');
                resolve(true);
            })
            .catch(error => {
                console.error('Firebase set error:', error);
                resolve(false);
            });
            
        } catch (error) {
            console.error('Firebase sync error:', error);
            resolve(false);
        }
    });
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

function initAutoSync() {
    console.log('Initializing auto-sync...');
    
    // Load auto-sync setting
    const autoSyncEnabled = localStorage.getItem('autoSyncEnabled') === 'true';
    
    // Create auto-sync checkbox if it doesn't exist
    if (!document.getElementById('auto-sync-checkbox')) {
        createAutoSyncControl();
    }
    
    // Set initial state
    document.getElementById('auto-sync-checkbox').checked = autoSyncEnabled;
    
    // Start/stop auto-sync based on setting
    if (autoSyncEnabled) {
        startAutoSync();
    } else {
        stopAutoSync();
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
function recoverLostData() {
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
} 

// Emergency data recovery function
/*function recoverLostData() {
    console.log('🔍 Attempting data recovery...');
    
    // Get current user
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Please log in first');
        return;
    }
    
    const user = JSON.parse(currentUser);
    
    // Look for data with any possible key
    const allKeys = Object.keys(localStorage);
    const userDataKeys = allKeys.filter(key => 
        key.includes('userData_') || 
        key.includes('forms_') || 
        key.includes('broilerForms')
    );
    
    console.log('Found potential data keys:', userDataKeys);
    
    let recoveredData = null;
    let recoveredKey = null;
    
    for (const key of userDataKeys) {
        try {
            const data = localStorage.getItem(key);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`Checking ${key}:`, typeof parsed, Array.isArray(parsed) ? `array with ${parsed.length} items` : 'object');
                
                // If it's an array of forms, we found our data
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].date) {
                    recoveredData = parsed;
                    recoveredKey = key;
                    break;
                }
                // If it's an object with month keys
                else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    // Check if any value is an array of forms
                    for (const monthKey in parsed) {
                        if (Array.isArray(parsed[monthKey]) && parsed[monthKey].length > 0) {
                            recoveredData = parsed;
                            recoveredKey = key;
                            console.log(`Found data in month: ${monthKey}`);
                            break;
                        }
                    }
                }
            }
        } catch (e) {
            console.log(`Error parsing ${key}:`, e.message);
        }
    }
    
    if (recoveredData) {
        // Save with correct user key
        const userId = user.uid || user.email.split('@')[0];
        localStorage.setItem(`userData_${userId}`, JSON.stringify(recoveredData));
        
        alert(`✅ Recovered data from ${recoveredKey}! Refreshing page...`);
        setTimeout(() => {
            location.reload();
        }, 1000);
    } else {
        // Create backup sample data
        if (confirm('No data found. Create sample data for this month?')) {
            const month = parseInt(document.getElementById('month-select').value);
            const year = document.getElementById('year-input').value;
            
            if (month == 9 && year == 2025) { // October 2025
                const userId = user.uid || user.email.split('@')[0];
                const monthYear = `${month}-${year}`;
                
                const allData = {};
                allData[monthYear] = sampleData;
                
                localStorage.setItem(`userData_${userId}`, JSON.stringify(allData));
                alert('Sample data created! Refreshing...');
                setTimeout(() => {
                    location.reload();
                }, 1000);
            } else {
                alert('Can only create sample data for October 2025. Please switch to October 2025 first.');
            }
        }
    }
} */

