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

    // Respaldos (Exportar/Importar)
    const btnExportData = document.getElementById('btn-export-data');
    const inputImportData = document.getElementById('input-import-data');

    if (btnExportData) {
        btnExportData.addEventListener('click', async () => {
            const allData = await chrome.storage.local.get(null);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `wacrm_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    if (inputImportData) {
        inputImportData.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    if (confirm('⚠️ ATENCIÓN: Esto reemplazará TODOS tus datos actuales (snippets, clientes, historiales, colores). ¿Estás seguro de que quieres continuar?')) {
                        await chrome.storage.local.clear();
                        await chrome.storage.local.set(importedData);
                        alert('¡Copia de seguridad restaurada con éxito! La página se recargará ahora.');
                        window.location.reload();
                    }
                } catch (error) {
                    alert('El archivo no es válido o está corrupto.');
                    console.error('Error importando backup:', error);
                }
            };
            reader.readAsText(file);
        });
    }

});
