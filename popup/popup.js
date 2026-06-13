document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('extensionToggle');
    const dashboardBtn = document.getElementById('openDashboard');

    // Get current state
    chrome.storage.local.get(['isExtensionEnabled'], (result) => {
        // Default to true if not set
        const isEnabled = result.isExtensionEnabled !== false;
        toggle.checked = isEnabled;
    });

    // Listen to changes
    toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ isExtensionEnabled: isEnabled });
    });

    dashboardBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });
});
