import { SnippetsTab } from './tabs/snippets-tab.js';
import { CrmTab } from './tabs/crm-tab.js';
import { initSmsTab } from './tabs/sms-tab.js';
import { initEmailTab } from './tabs/email-tab.js';
import { StorageAPI } from '../shared/storage-api.js';
import { CONSTANTS } from '../shared/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
    
    // Inicializar vistas
    const snippetsContainer = document.getElementById('snippets-container');
    const crmContainer = document.getElementById('crm-container');
    
    new SnippetsTab(snippetsContainer);
    new CrmTab(crmContainer);
    initSmsTab();
    initEmailTab();

    // Navegación del Sidebar
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Actualizar botones
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Actualizar vistas
            const targetId = btn.dataset.target;
            views.forEach(view => {
                if (view.id === targetId) {
                    view.classList.remove('hidden');
                    view.classList.add('active');
                } else {
                    view.classList.remove('active');
                    view.classList.add('hidden');
                }
            });
        });
    });

    // Configuración General
    const configInvoice = document.getElementById('config-invoice');
    const configShipping = document.getElementById('config-shipping');
    const configWaMethod = document.getElementById('config-wa-method');
    const configWaMessage = document.getElementById('config-wa-message');
    const btnSaveConfig = document.getElementById('btn-save-config');

    // Cargar config
    const config = await StorageAPI.getConfig();
    configInvoice.value = config.invoice_template || 'Factura pendiente de pago...';
    configShipping.value = config.shipping_template || 'Su envío ha sido registrado...';
    configWaMethod.value = config.wa_open_method || 'web';
    configWaMessage.value = config.wa_prefilled_message || '';

    // Guardar config
    btnSaveConfig.addEventListener('click', async () => {
        const newConfig = {
            invoice_template: configInvoice.value,
            shipping_template: configShipping.value,
            wa_open_method: configWaMethod.value,
            wa_prefilled_message: configWaMessage.value
        };
        await chrome.storage.local.set({ [CONSTANTS.STORAGE_KEYS.CONFIG]: newConfig });
        alert('Configuración guardada correctamente.');
    });

});
