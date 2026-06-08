import { StorageAPI } from '../../shared/storage-api.js';
import { DataTable } from '../components/data-table.js';
import { CONSTANTS } from '../../shared/constants.js';

export class SnippetsTab {
    constructor(container) {
        this.container = container;
        this.snippets = [];
        this.table = null;
        this.render();
        this.loadData();
    }

    render() {
        this.container.innerHTML = `
            <div class="card form-card">
                <h3>Nuevo Snippet</h3>
                <div class="form-group" style="margin-top: 16px;">
                    <label>Comando (ej. /saludo)</label>
                    <input type="text" id="snippet-cmd" placeholder="/comando">
                </div>
                <div class="form-group">
                    <label>Texto a expandir</label>
                    <textarea id="snippet-text" rows="3" placeholder="¡Hola! ¿En qué puedo ayudarte?"></textarea>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="snippet-floating">
                    <label for="snippet-floating">Mostrar como botón flotante rápido (Máx 4)</label>
                </div>
                <button id="btn-save-snippet" class="btn primary">Guardar Snippet</button>
            </div>
            
            <div class="card">
                <h3>Mis Snippets</h3>
                <div id="snippets-table-container"></div>
            </div>
        `;

        this.container.querySelector('#btn-save-snippet').addEventListener('click', () => this.handleSave());

        const tableContainer = this.container.querySelector('#snippets-table-container');
        this.table = new DataTable({
            container: tableContainer,
            columns: ['Comando', 'Texto', 'Flotante'],
            actions: ['Eliminar'],
            onAction: (action, item) => this.handleAction(action, item)
        });
    }

    async loadData() {
        this.snippets = await StorageAPI.getSnippets();
        this.table.setData(this.snippets, (item) => [
            item.command,
            item.text,
            item.isFloating ? 'Sí' : 'No'
        ]);
    }

    async handleSave() {
        const cmdInput = this.container.querySelector('#snippet-cmd');
        const txtInput = this.container.querySelector('#snippet-text');
        const floatInput = this.container.querySelector('#snippet-floating');

        const command = cmdInput.value.trim();
        const text = txtInput.value;
        const isFloating = floatInput.checked;

        if (!command.startsWith('/')) {
            alert('El comando debe empezar con "/"');
            return;
        }

        if (!text) {
            alert('El texto no puede estar vacío');
            return;
        }

        if (isFloating) {
            const currentFloating = this.snippets.filter(s => s.isFloating).length;
            if (currentFloating >= CONSTANTS.LIMITS.MAX_FLOATING_SNIPPETS) {
                alert(`Máximo ${CONSTANTS.LIMITS.MAX_FLOATING_SNIPPETS} snippets flotantes permitidos.`);
                return;
            }
        }

        const snippet = {
            id: crypto.randomUUID(),
            command,
            text,
            isFloating,
            createdAt: Date.now()
        };

        await StorageAPI.addSnippet(snippet);
        
        // Reset form
        cmdInput.value = '';
        txtInput.value = '';
        floatInput.checked = false;

        this.loadData();
    }

    async handleAction(action, item) {
        if (action === 'Eliminar') {
            if (confirm(`¿Eliminar el snippet ${item.command}?`)) {
                const newSnippets = this.snippets.filter(s => s.id !== item.id);
                await StorageAPI.saveSnippets(newSnippets);
                this.loadData();
            }
        }
    }
}
