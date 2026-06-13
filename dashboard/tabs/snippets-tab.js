import { StorageAPI } from '../../shared/storage-api.js';
import { DataTable } from '../components/data-table.js';
import { CONSTANTS } from '../../shared/constants.js';

export class SnippetsTab {
    constructor(container) {
        this.container = container;
        this.snippets = [];
        this.table = null;
        this.currentBase64Image = null;
        this.editingSnippetId = null;
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
                <div class="form-group">
                    <label>Adjuntar Imagen (Opcional - Selecciona o pega con Ctrl+V)</label>
                    <input type="file" id="snippet-image" accept="image/png, image/jpeg, image/webp" style="margin-bottom: 8px;">
                    <div id="snippet-image-preview" style="display: none; max-width: 150px; position: relative;">
                        <img src="" style="max-width: 100%; border-radius: 8px; border: 1px solid #ddd;" />
                        <button id="btn-remove-image" style="position: absolute; top: -10px; right: -10px; background: red; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-weight: bold;">✕</button>
                    </div>
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
        
        const fileInput = this.container.querySelector('#snippet-image');
        const removeBtn = this.container.querySelector('#btn-remove-image');
        
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e.target.files[0]));
        removeBtn.addEventListener('click', () => this.clearImagePreview());
        
        // Soporte para pegar imágenes
        this.container.addEventListener('paste', (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (let item of items) {
                if (item.type.indexOf('image') === 0) {
                    const blob = item.getAsFile();
                    this.handleFileSelect(blob);
                }
            }
        });

        const tableContainer = this.container.querySelector('#snippets-table-container');
        this.table = new DataTable({
            container: tableContainer,
            columns: ['Comando', 'Texto', 'Img', 'Flotante'],
            actions: ['Editar', 'Eliminar'],
            onAction: (action, item) => this.handleAction(action, item)
        });
    }

    async loadData() {
        this.snippets = await StorageAPI.getSnippets();
        this.table.setData(this.snippets, (item) => [
            item.command,
            item.text,
            item.imageUrl ? '🖼️' : '-',
            item.isFloating ? 'Sí' : 'No'
        ]);
    }

    handleFileSelect(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentBase64Image = e.target.result;
            const previewDiv = this.container.querySelector('#snippet-image-preview');
            previewDiv.querySelector('img').src = this.currentBase64Image;
            previewDiv.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    clearImagePreview() {
        this.currentBase64Image = null;
        this.container.querySelector('#snippet-image').value = '';
        this.container.querySelector('#snippet-image-preview').style.display = 'none';
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

        if (isFloating && (!this.editingSnippetId || !this.snippets.find(s => s.id === this.editingSnippetId)?.isFloating)) {
            const currentFloating = this.snippets.filter(s => s.isFloating).length;
            if (currentFloating >= CONSTANTS.LIMITS.MAX_FLOATING_SNIPPETS) {
                alert(`Máximo ${CONSTANTS.LIMITS.MAX_FLOATING_SNIPPETS} snippets flotantes permitidos.`);
                return;
            }
        }

        const snippet = {
            id: this.editingSnippetId || crypto.randomUUID(),
            command,
            text,
            isFloating,
            imageUrl: this.currentBase64Image || null,
            createdAt: this.editingSnippetId ? this.snippets.find(s => s.id === this.editingSnippetId).createdAt : Date.now()
        };

        if (this.editingSnippetId) {
            const index = this.snippets.findIndex(s => s.id === this.editingSnippetId);
            if (index !== -1) {
                this.snippets[index] = snippet;
                await StorageAPI.saveSnippets(this.snippets);
            }
            this.editingSnippetId = null;
            this.container.querySelector('#btn-save-snippet').textContent = 'Guardar Snippet';
        } else {
            await StorageAPI.addSnippet(snippet);
        }
        
        // Reset form
        cmdInput.value = '';
        txtInput.value = '';
        floatInput.checked = false;
        this.clearImagePreview();

        this.loadData();
    }

    async handleAction(action, item) {
        if (action === 'Editar') {
            this.editingSnippetId = item.id;
            this.container.querySelector('#snippet-cmd').value = item.command;
            this.container.querySelector('#snippet-text').value = item.text;
            this.container.querySelector('#snippet-floating').checked = item.isFloating;
            
            if (item.imageUrl) {
                this.currentBase64Image = item.imageUrl;
                const previewDiv = this.container.querySelector('#snippet-image-preview');
                previewDiv.querySelector('img').src = item.imageUrl;
                previewDiv.style.display = 'block';
            } else {
                this.clearImagePreview();
            }
            
            this.container.querySelector('#btn-save-snippet').textContent = 'Actualizar Snippet';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (action === 'Eliminar') {
            if (confirm(`¿Eliminar el snippet ${item.command}?`)) {
                const newSnippets = this.snippets.filter(s => s.id !== item.id);
                await StorageAPI.saveSnippets(newSnippets);
                this.loadData();
            }
        }
    }
}
