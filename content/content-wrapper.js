(async () => {
    try {
        const src = chrome.runtime.getURL('content/content.js');
        await import(src);
    } catch (e) {
        console.error('[WA-CRM] Error cargando content.js como módulo:', e);
    }
})();
