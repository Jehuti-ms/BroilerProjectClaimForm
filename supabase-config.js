// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://your-project-ref.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqemtpY2VhdXN5ZWpubW5scXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyMzg3ODEsImV4cCI6MjA3NzgxNDc4MX0.uqX0SA5Wa52yPvRkSxxrkDvC8YkIEpO5MNndAC_IrHQ'
};

// Initialize Supabase
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
