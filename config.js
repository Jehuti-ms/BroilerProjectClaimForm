// config.js - Using DOMContentLoaded
const SUPABASE_CONFIG = {
    url: 'https://wjzkiceausyejnmnlqvg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqemtpY2VhdXN5ZWpubW5scXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzg3ODEsImV4cCI6MjA3NzgxNDc4MX0.uqX0SA5Wa52yPvRkSxxrkDvC8YkIEpO5MNndAC_IrHQ'
};

// Wait for the page and Supabase to load
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        window.supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase initialized:', !!window.supabase);
        
        // Test the connection
        testSupabaseConnection();
    } else {
        console.error('Supabase library not loaded');
    }
});

// Test function
async function testSupabaseConnection() {
    if (window.supabase) {
        try {
            const { data, error } = await window.supabase
                .from('user_data')
                .select('user_id')
                .limit(1);
                
            if (error) {
                console.error('Supabase test failed:', error);
            } else {
                console.log('✅ Supabase connection test passed!');
            }
        } catch (error) {
            console.error('Supabase test error:', error);
        }
    }
}
