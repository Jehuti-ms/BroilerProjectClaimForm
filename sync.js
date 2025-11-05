// sync.js - All cloud synchronization logic

// Cloud Sync Configuration
const SYNC_CONFIG = {
    autoSyncInterval: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3
};

// Initialize cloud sync
function initCloudSync() {
    updateLastSyncDisplay();
    startAutoSync();
    console.log('Cloud sync initialized');
}

// Main sync function - Push to cloud
async function syncToCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    const userData = localStorage.getItem(`userData_${user.username}`);
    
    if (!userData) {
        showNotification('No data to sync', 'error');
        return;
    }
    
    showSyncStatus('🔄 Syncing to cloud...', 'loading');
    
    try {
        // Try Supabase first
        const supabaseSuccess = await syncToSupabase(user.username, JSON.parse(userData));
        
        if (supabaseSuccess) {
            showSyncStatus('✅ Data synced to cloud!', 'success');
        } else {
            // Fallback to localStorage backup
            await syncToLocalBackup(user.username, JSON.parse(userData));
            showSyncStatus('✅ Data backed up locally', 'success');
        }
        
        localStorage.setItem('lastCloudSync', new Date().toISOString());
        updateLastSyncDisplay();
        
    } catch (error) {
        console.error('Cloud sync failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

// Pull from cloud
async function syncFromCloud() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        showNotification('Please sign in first', 'error');
        return;
    }
    
    const user = JSON.parse(currentUser);
    showSyncStatus('🔄 Loading from cloud...', 'loading');
    
    try {
        let cloudData = await syncFromSupabase(user.username);
        
        if (!cloudData) {
            cloudData = await syncFromLocalBackup(user.username);
        }
        
        if (cloudData && cloudData.data) {
            localStorage.setItem(`userData_${user.username}`, JSON.stringify(cloudData.data));
            
            // Notify main app to reload data
            if (typeof loadUserData === 'function') {
                loadUserData(user.username);
            }
            
            showSyncStatus('✅ Cloud data loaded!', 'success');
            updateLastSyncDisplay();
        } else {
            showSyncStatus('ℹ️ No cloud data found', 'info');
        }
        
    } catch (error) {
        console.error('Cloud retrieval failed:', error);
        showSyncStatus('❌ Sync failed', 'error');
    }
}

// Supabase sync functions
async function syncToSupabase(username, data) {
    try {
        if (!window.supabase) {
            throw new Error('Supabase not initialized');
        }

        const { error } = await supabase
            .from('user_data')
            .upsert({
                user_id: username,
                data: data,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Supabase error:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Supabase sync failed:', error);
        return false;
    }
}

async function syncFromSupabase(username) {
    try {
        if (!window.supabase) {
            throw new Error('Supabase not initialized');
        }

        const { data, error } = await supabase
            .from('user_data')
            .select('*')
            .eq('user_id', username)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Supabase retrieval failed:', error);
        return null;
    }
}

// Local backup functions (fallback)
async function syncToLocalBackup(username, data) {
    const syncData = {
        username: username,
        data: data,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(`cloud_backup_${username}`, JSON.stringify(syncData));
    return true;
}

async function syncFromLocalBackup(username) {
    const backupData = localStorage.getItem(`cloud_backup_${username}`);
    if (backupData) {
        return JSON.parse(backupData);
    }
    return null;
}

// Auto-sync functionality
let autoSyncInterval = null;

function startAutoSync() {
    // Stop any existing interval
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
    }
    
    // Auto-sync when online and app is active
    autoSyncInterval = setInterval(() => {
        if (navigator.onLine && !document.hidden) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
                const user = JSON.parse(currentUser);
                const userData = localStorage.getItem(`userData_${user.username}`);
                if (userData) {
                    console.log('Auto-syncing data...');
                    syncToSupabase(user.username, JSON.parse(userData))
                        .then(success => {
                            if (success) {
                                localStorage.setItem('lastCloudSync', new Date().toISOString());
                                updateLastSyncDisplay();
                            }
                        });
                }
            }
        }
    }, SYNC_CONFIG.autoSyncInterval);
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}

// Sync status display
function updateLastSyncDisplay() {
    const lastSync = localStorage.getItem('lastCloudSync');
    const lastSyncElement = document.getElementById('last-sync');
    
    if (lastSyncElement) {
        if (lastSync) {
            const lastSyncDate = new Date(lastSync);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSyncDate) / (1000 * 60));
            
            let statusText = `Last synced: ${lastSyncDate.toLocaleString()}`;
            if (diffMinutes < 5) {
                statusText += ' 🟢';
            } else if (diffMinutes < 60) {
                statusText += ' 🟡';
            } else {
                statusText += ' 🔴';
            }
            
            lastSyncElement.innerHTML = statusText;
        } else {
            lastSyncElement.innerHTML = 'Never synced 🔴';
        }
        lastSyncElement.style.display = 'block';
    }
}

function showSyncStatus(message, type) {
    const lastSyncElement = document.getElementById('last-sync');
    if (lastSyncElement) {
        lastSyncElement.innerHTML = message;
        lastSyncElement.style.display = 'block';
        lastSyncElement.style.padding = '10px';
        lastSyncElement.style.margin = '10px 0';
        lastSyncElement.style.borderRadius = '4px';
        lastSyncElement.style.textAlign = 'center';
        
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            loading: '#2196F3',
            info: '#FF9800'
        };
        
        lastSyncElement.style.background = colors[type] || colors.info;
        lastSyncElement.style.color = 'white';
    }
    
    // Also show notification
    showNotification(message, type);
}

// Enhanced notification function for sync
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f44336' : type === 'loading' ? '#2196F3' : '#4CAF50'};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 10000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Test Supabase connection
async function testSupabaseConnection() {
    try {
        if (!window.supabase) {
            return false;
        }

        const { data, error } = await supabase
            .from('user_data')
            .select('count')
            .limit(1);

        return !error;
    } catch (error) {
        console.error('Supabase test failed:', error);
        return false;
    }
}

// Export functions for use in other files (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initCloudSync,
        syncToCloud,
        syncFromCloud,
        startAutoSync,
        stopAutoSync,
        testSupabaseConnection
    };
}

// Add this to sync.js - Debug function
async function debugSupabaseConnection() {
    console.log('=== SUPABASE DEBUG INFO ===');
    console.log('Supabase client exists:', !!window.supabase);
    console.log('Supabase URL:', SUPABASE_CONFIG?.url);
    console.log('Current user:', localStorage.getItem('currentUser'));
    
    if (window.supabase) {
        try {
            // Test simple query
            const { data, error } = await supabase
                .from('user_data')
                .select('user_id')
                .limit(1);

            console.log('Supabase test query - Error:', error);
            console.log('Supabase test query - Data:', data);
            
            if (error) {
                console.error('Supabase error details:', error);
                showNotification('Supabase error: ' + error.message, 'error');
            } else {
                console.log('✅ Supabase connection successful!');
                showNotification('Supabase connected!', 'success');
            }
        } catch (error) {
            console.error('Supabase test failed:', error);
            showNotification('Supabase test failed: ' + error.message, 'error');
        }
    } else {
        console.error('Supabase client not loaded');
        showNotification('Supabase not loaded - check config.js', 'error');
    }
}

// Call this to test - add to your console or create a button
// debugSupabaseConnection();
