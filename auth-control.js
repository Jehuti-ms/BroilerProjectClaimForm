// Global variable to prevent redirect loops
let isRedirecting = false;
let redirectTimeout = null;

// Safe redirect function
function safeRedirect(url) {
    if (isRedirecting) {
        console.log('Already redirecting, skipping duplicate redirect to', url);
        return;
    }
    
    isRedirecting = true;
    console.log('Safe redirect to:', url);
    
    // Clear any existing timeout
    if (redirectTimeout) {
        clearTimeout(redirectTimeout);
    }
    
    // Set timeout for redirect
    redirectTimeout = setTimeout(() => {
        window.location.href = url;
    }, 300);
}

// Reset redirect flag when page loads
window.addEventListener('load', function() {
    isRedirecting = false;
    console.log('Page loaded, redirect flag reset');
});
