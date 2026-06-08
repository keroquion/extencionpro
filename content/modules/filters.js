import { StorageAPI } from '../../shared/storage-api.js';

export const CrmFilters = {
    async render(container) {
        container.innerHTML = 'Cargando filtros...';
        
        const citas = await StorageAPI.getCrmRecords('citas');
        const facturas = await StorageAPI.getCrmRecords('facturas');
        const envios = await StorageAPI.getCrmRecords('envios');

        container.innerHTML = '';

        const style = document.createElement('style');
        style.textContent = `
            .filter-list { max-height: 150px; overflow-y: auto; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 4px; }
            .filter-item { padding: 6px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 13px; display: flex; flex-direction: column; }
            .filter-item:last-child { border-bottom: none; }
            .filter-item:hover { background-color: #f0f0f0; }
            .filter-name { font-weight: bold; color: #333; }
            .filter-date { font-size: 11px; color: #666; }
            .filter-header { font-size: 13px; font-weight: bold; margin-bottom: 4px; color: #075E54; }
        `;
        container.appendChild(style);

        const createList = (title, records, color) => {
            if (records.length === 0) return;
            const header = document.createElement('div');
            header.className = 'filter-header';
            header.style.color = color;
            header.textContent = `${title} (${records.length})`;
            container.appendChild(header);

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
                date.textContent = new Date(r.fechaHora).toLocaleDateString();

                item.appendChild(name);
                item.appendChild(date);
                
                item.addEventListener('click', () => {
                    // Enviar orden a wa-bridge.js para abrir el chat
                    window.postMessage({ source: 'wa-crm-content', action: 'OPEN_CHAT', phone: r.telefono }, '*');
                });
                
                list.appendChild(item);
            });
            container.appendChild(list);
        };

        createList('Envíos', envios, '#4caf50');
        createList('Facturas', facturas, '#2196f3');
        createList('Citas', citas, '#ffc107');

        if (citas.length === 0 && facturas.length === 0 && envios.length === 0) {
            container.textContent = 'No hay registros en el CRM.';
        }
    }
};
