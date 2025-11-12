// Simple Admin Configuration
const ADMIN_CONFIG = {
    // Admin password
    password: 'drahmedmabrouk##777',
    
    // Session timeout in minutes
    sessionTimeout: 60,
    
    // UI settings
    hideAdminButtons: true, // Admin buttons are completely hidden
    showFloatingButton: false, // No floating admin button
    
    // Hidden access methods
    hiddenAccess: {
        // Method 1: Secret click sequence (5 clicks on logo)
        secretClick: {
            enabled: true,
            requiredClicks: 5,
            resetTimeout: 3000,
            accessAreas: ['logo', 'secretArea']
        },
        
        // Method 2: Keyboard shortcut (Ctrl+Shift+A)
        keyboardShortcut: {
            enabled: true,
            key: 'a',
            modifiers: ['ctrl', 'shift']
        },
        
        // Method 3: URL parameter (?admin=secret)
        urlParameter: {
            enabled: true,
            parameter: 'admin',
            value: 'secret'
        }
    }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ADMIN_CONFIG;
} else {
    window.ADMIN_CONFIG = ADMIN_CONFIG;
}