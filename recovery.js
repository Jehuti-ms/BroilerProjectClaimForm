// Add this to app.js or create a new recovery.js file
function emergencyDataRecovery() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        alert('Please log in first');
        return;
    }
    
    console.log('🔍 Emergency data recovery for user:', user.username);
    
    // Your data keys from the logs:
    const userKeys = [
        'prefs_dmoseley',
        'farm-profile-dmoseley@gams.edu.bb',
        'farm-production-data',
        'farm-profile',
        'farm-mortality-data'
    ];
    
    console.log('Checking user-related keys:', userKeys);
    
    let foundData = null;
    let foundKey = null;
    
    // Check each key
    for (const key of userKeys) {
        try {
            const data = localStorage.getItem(key);
            if (!data) continue;
            
            console.log(`Checking key: ${key}`);
            const parsed = JSON.parse(data);
            
            // Check if this is your production data
            if (key === 'farm-production-data' || key === 'farm-profile-dmoseley@gams.edu.bb') {
                console.log(`✅ Found potential data in ${key}:`, parsed);
                foundData = parsed;
                foundKey = key;
                break;
            }
        } catch (e) {
            console.log(`Key ${key} not JSON:`, e.message);
        }
    }
    
    if (foundData) {
        // Convert to your app's format
        const convertedData = convertFarmDataToForms(foundData, user);
        
        if (convertedData.length > 0) {
            const saveKey = `userData_${user.username}`;
            localStorage.setItem(saveKey, JSON.stringify(convertedData));
            
            alert(`✅ Found and converted ${convertedData.length} forms from ${foundKey}! Refreshing...`);
            setTimeout(() => location.reload(), 1000);
        } else {
            alert('Found data but could not convert it to forms format.');
        }
    } else {
        // Create sample data
        if (confirm('No data found. Create sample data?')) {
            createSampleData(user);
        }
    }
}

// Convert farm data to form format
function convertFarmDataToForms(farmData, user) {
    const forms = [];
    
    if (Array.isArray(farmData)) {
        // If it's already an array
        farmData.forEach((item, index) => {
            if (item.date || item.productionDate) {
                forms.push({
                    formId: `converted-${index}-${Date.now()}`,
                    date: item.date || item.productionDate,
                    amPm: item.amPm || 'AM',
                    inTime: item.inTime || '08:00',
                    outTime: item.outTime || '17:00',
                    hours: item.hours || '8:00',
                    employeeName: user.employeeName,
                    convertedAt: new Date().toISOString(),
                    originalData: item
                });
            }
        });
    } else if (typeof farmData === 'object') {
        // If it's an object, check for arrays inside
        Object.entries(farmData).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (item.date || item.productionDate) {
                        forms.push({
                            formId: `${key}-${index}-${Date.now()}`,
                            monthKey: key,
                            ...item,
                            employeeName: user.employeeName,
                            convertedAt: new Date().toISOString()
                        });
                    }
                });
            }
        });
    }
    
    console.log(`Converted ${forms.length} forms from farm data`);
    return forms;
}

// Create sample data
function createSampleData(user) {
    const sampleForms = [
        {
            formId: 'sample-1-' + Date.now(),
            date: '2025-11-01',
            amPm: 'AM',
            inTime: '08:00',
            outTime: '12:00',
            hours: '4:00',
            employeeName: user.employeeName
        },
        {
            formId: 'sample-2-' + Date.now(),
            date: '2025-11-01',
            amPm: 'PM',
            inTime: '13:00',
            outTime: '17:00',
            hours: '4:00',
            employeeName: user.employeeName
        }
    ];
    
    // Save to multiple formats for compatibility
    const saveKey = `userData_${user.username}`;
    localStorage.setItem(saveKey, JSON.stringify(sampleForms));
    localStorage.setItem(`forms_${user.username}`, JSON.stringify(sampleForms));
    localStorage.setItem('broilerForms', JSON.stringify(sampleForms));
    
    alert('Created sample data! Refreshing...');
    setTimeout(() => location.reload(), 1000);
}
