import { StorageAPI } from '../../shared/storage-api.js';
import { TabManager } from '../components/tab-manager.js';
import { DataTable } from '../components/data-table.js';
import { CSVHandler } from '../components/csv-handler.js';
import { CONSTANTS } from '../../shared/constants.js';

export class CrmTab {
    constructor(container) {
        this.container = container;
        this.currentSubTab = 'citas';
        this.table = null;
        this.records = [];
        this.render();
    }

    render() {
        this.container.innerHTML = `
            <div class="card">
                <div class="top-actions">
                    <div id="crm-subtabs"></div>
                    <div style="display: flex; gap: 8px;">
                        <input type="file" id="csv-file-input" accept=".csv" style="display: none;">
                        <button id="btn-import-csv" class="btn secondary">📥 Importar CSV</button>
                        <button id="btn-export-csv" class="btn primary">📤 Exportar CSV</button>
                    </div>
                </div>
                <div id="crm-table-container"></div>
            </div>
        `;

        const subTabsContainer = this.container.querySelector('#crm-subtabs');
        const tabManager = new TabManager(subTabsContainer, [
            { id: 'citas', label: '📅 Citas' },
            { id: 'facturas', label: '🧾 Facturas' },
            { id: 'envios', label: '📦 Envíos' }
        ]);

        tabManager.onTabChange = (tabId) => {
            this.currentSubTab = tabId;
            this.loadData();
        };

        const tableContainer = this.container.querySelector('#crm-table-container');
        this.table = new DataTable({
            container: tableContainer,
            columns: ['Contacto', 'Teléfono', 'Fecha/Hora', 'Tipo', 'Notas', 'Estado'],
            actions: ['Abrir en WA', 'Eliminar'],
            onAction: (action, item) => this.handleAction(action, item)
        });

        // Event Listeners CSV
        this.container.querySelector('#btn-export-csv').addEventListener('click', () => {
            CSVHandler.exportCSV(this.records, `crm_${this.currentSubTab}_${new Date().toISOString().slice(0,10)}.csv`);
        });

        const fileInput = this.container.querySelector('#csv-file-input');
        this.container.querySelector('#btn-import-csv').addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                CSVHandler.importCSV(e.target.files[0], (parsedRecords) => this.handleImportedData(parsedRecords));
                e.target.value = ''; // Reset
            }
        });

        this.loadData();
    }

    async loadData() {
        this.records = await StorageAPI.getCrmRecords(this.currentSubTab);
        this.table.setData(this.records, (item) => [
            item.contacto,
            item.telefono,
            new Date(item.fechaHora).toLocaleString(),
            item.tipo,
            item.notas || '-',
            item.estado
        ]);
    }

    async handleAction(action, item) {
        if (action === 'Abrir en WA') {
            chrome.tabs.query({ url: "*://web.whatsapp.com/*" }, (tabs) => {
               if (tabs.length > 0) {
                  chrome.tabs.sendMessage(tabs[0].id, { action: 'OPEN_CHAT_IN_WA', phone: item.telefono });
                  chrome.tabs.update(tabs[0].id, { active: true });
               } else {
                  alert("Por favor abre WhatsApp Web primero en otra pestaña.");
               }
            });
        } else if (action === 'Eliminar') {
            if (confirm(`¿Eliminar registro de ${item.contacto}?`)) {
                // Remove using the background script to keep it consistent
                chrome.runtime.sendMessage({
                    action: CONSTANTS.MESSAGES.CRM_DELETE_RECORD,
                    tab: this.currentSubTab,
                    id: item.id
                }, (response) => {
                    if (response && response.success) {
                        this.loadData();
                    }
                });
            }
        }
    }

    handleImportedData(newRecords) {
        if (confirm(`Se encontraron ${newRecords.length} registros. ¿Deseas agregarlos a la pestaña actual (${this.currentSubTab})?`)) {
            // Add one by one or batch. Here we just batch them via direct storage for simplicity in UI side,
            // though ideally we'd send them to the SW.
            const key = `crm_${this.currentSubTab}`;
            chrome.storage.local.get(key).then(data => {
                const current = data[key] || [];
                const merged = [...current, ...newRecords];
                chrome.storage.local.set({ [key]: merged }).then(() => {
                    alert('Importación completada');
                    this.loadData();
                });
            });
        }
    }
}
