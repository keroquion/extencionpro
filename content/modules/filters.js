import { StorageAPI } from '../../shared/storage-api.js';

import { StorageAPI } from '../../shared/storage-api.js';

export const CrmFilters = {
    container: null,

    init() {
        chrome.storage.onChanged.addListener((changes) => {
            if (changes['crm_citas'] || changes['crm_facturas'] || changes['crm_envios']) {
                if (this.container) this.render(this.container);
            }
        });
    },

    async render(container) {
        if (container) this.container = container;
        if (!this.container) return;
        
        this.container.innerHTML = 'Cargando filtros...';
        
        const citas = await StorageAPI.getCrmRecords('citas');
        const facturas = await StorageAPI.getCrmRecords('facturas');
        const envios = await StorageAPI.getCrmRecords('envios');

        this.container.innerHTML = '';

        // Solo agregar style si no existe
        if (!this.container.querySelector('#filters-style')) {
            const style = document.createElement('style');
            style.id = 'filters-style';
            style.textContent = `
                .filter-list { max-height: 150px; overflow-y: auto; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 4px; }
                .filter-item { padding: 6px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 13px; display: flex; flex-direction: column; }
                .filter-item:last-child { border-bottom: none; }
                .filter-item:hover { background-color: #f0f0f0; }
                .filter-name { font-weight: bold; color: #333; }
                .filter-date { font-size: 11px; color: #666; }
                .filter-header { font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #075E54; }
            `;
            this.container.appendChild(style);
        }

        const createList = (title, records, color) => {
            if (records.length === 0) return;
            const header = document.createElement('div');
            header.className = 'filter-header';
            header.style.color = color;
            header.textContent = `${title} (${records.length})`;
            this.container.appendChild(header);

            const list = document.createElement('div');
            list.className = 'filter-list';
            
            records.forEach(r => {
                const item = document.createElement('div');
                item.className = 'filter-item';
                
                const name = document.createElement('span');
                name.className = 'filter-name';
                name.textContent = r.contacto;
                
                const date = document.createElement('span');
                date.className = 'filter-date';
                date.textContent = new Date(r.fechaHora).toLocaleDateString() + ' - ' + r.estado;

                item.appendChild(name);
                item.appendChild(date);
                
                item.addEventListener('click', async () => {
                    const config = await StorageAPI.getConfig();
                    const method = config.wa_open_method || 'web';
                    const msg = encodeURIComponent(config.wa_prefilled_message || '');
                    const phone = r.telefono.replace(/[^0-9]/g, '');
                    
                    let url = '';
                    if (method === 'app') {
                        url = `https://wa.me/${phone}?text=${msg}`;
                    } else {
                        url = `https://web.whatsapp.com/send/?phone=${phone}&text=${msg}`;
                    }
                    window.open(url, '_blank');
                });
                
                list.appendChild(item);
            });
            this.container.appendChild(list);
        };

        createList('Envíos Pendientes', envios, '#4caf50');
        createList('Facturas Pendientes', facturas, '#2196f3');
        createList('Citas', citas, '#ffc107');

        if (citas.length === 0 && facturas.length === 0 && envios.length === 0) {
            const p = document.createElement('p');
            p.textContent = 'No hay registros activos en el CRM.';
            p.style.fontSize = '13px';
            this.container.appendChild(p);
        }
    }
};

CrmFilters.init();
