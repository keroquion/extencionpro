export class DataTable {
    constructor(config) {
        this.container = config.container;
        this.columns = config.columns;
        this.data = [];
        this.actions = config.actions || [];
        this.onAction = config.onAction || (() => {});
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        
        // Contenedor scrollable
        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';
        wrapper.style.marginTop = '16px';
        
        this.table = document.createElement('table');
        this.table.style.width = '100%';
        this.table.style.borderCollapse = 'collapse';
        this.table.style.fontSize = '14px';

        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.style.backgroundColor = 'var(--bg-color)';
        headerRow.style.textAlign = 'left';
        
        this.columns.forEach(col => {
            const th = document.createElement('th');
            th.textContent = col;
            th.style.padding = '12px';
            th.style.borderBottom = '2px solid var(--border)';
            headerRow.appendChild(th);
        });

        if (this.actions.length > 0) {
            const th = document.createElement('th');
            th.textContent = 'Acciones';
            th.style.padding = '12px';
            th.style.borderBottom = '2px solid var(--border)';
            headerRow.appendChild(th);
        }

        thead.appendChild(headerRow);
        this.table.appendChild(thead);

        // Body
        this.tbody = document.createElement('tbody');
        this.table.appendChild(this.tbody);
        
        wrapper.appendChild(this.table);
        this.container.appendChild(wrapper);
    }

    setData(data, mappingFn) {
        this.data = data;
        this.tbody.innerHTML = '';

        if (data.length === 0) {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.colSpan = this.columns.length + (this.actions.length > 0 ? 1 : 0);
            td.textContent = 'No hay registros.';
            td.style.padding = '24px';
            td.style.textAlign = 'center';
            td.style.color = 'var(--text-muted)';
            tr.appendChild(td);
            this.tbody.appendChild(tr);
            return;
        }

        data.forEach(item => {
            const rowData = mappingFn(item);
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid var(--border)';
            
            // Celdas de datos
            rowData.forEach(cellValue => {
                const td = document.createElement('td');
                td.style.padding = '12px';
                // Soporte básico para truncar texto largo
                if (typeof cellValue === 'string' && cellValue.length > 50) {
                     td.textContent = cellValue.substring(0, 47) + '...';
                     td.title = cellValue;
                } else {
                     td.textContent = cellValue;
                }
                tr.appendChild(td);
            });

            // Acciones
            if (this.actions.length > 0) {
                const td = document.createElement('td');
                td.style.padding = '12px';
                td.style.display = 'flex';
                td.style.gap = '8px';

                this.actions.forEach(actionName => {
                    const btn = document.createElement('button');
                    btn.textContent = actionName;
                    btn.className = actionName === 'Eliminar' ? 'btn small danger' : 'btn small secondary';
                    btn.addEventListener('click', () => this.onAction(actionName, item));
                    td.appendChild(btn);
                });
                tr.appendChild(td);
            }

            this.tbody.appendChild(tr);
        });
    }
}
