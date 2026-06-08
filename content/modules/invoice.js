import { StorageAPI } from '../../shared/storage-api.js';

export const Invoice = {
  container: null,
  currentContact: null,

  init() {
    window.addEventListener('WA_CRM_CONTACT_CHANGED', async (e) => {
        this.currentContact = e.detail.contact;
        await this.render();
    });
    chrome.storage.onChanged.addListener((changes) => {
        if (changes['crm_facturas']) this.render();
    });
  },

  async render(parentElement) {
    if (parentElement) this.container = parentElement;
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    if (!this.currentContact) {
        this.container.innerHTML = '<p style="font-size:12px; color:#666;">Abre un chat para gestionar facturas.</p>';
        return;
    }

    const facturas = await StorageAPI.getCrmRecords('facturas');
    const record = facturas.find(r => r.telefono === this.currentContact.phone);

    if (!record) {
        const btn = document.createElement('button');
        btn.textContent = '🧾 Registrar Factura Pendiente';
        btn.className = 'primary-btn';
        btn.style.width = '100%';
        btn.addEventListener('click', (e) => {
            window.dispatchEvent(new CustomEvent('WA_CRM_ACTION_INVOICE', { detail: { target: e.currentTarget } }));
        });
        this.container.appendChild(btn);
    } else {
        const p = document.createElement('p');
        p.style.fontSize = '13px';
        p.style.margin = '0 0 10px 0';
        p.innerHTML = `Estado actual: <strong>${record.estado.toUpperCase()}</strong>`;
        this.container.appendChild(p);

        const flex = document.createElement('div');
        flex.style.display = 'flex';
        flex.style.gap = '8px';
        flex.style.flexDirection = 'column';

        if (record.estado === 'pendiente') {
            const inputRuc = document.createElement('input');
            inputRuc.type = 'text';
            inputRuc.placeholder = 'Ingresar RUC del cliente';
            inputRuc.style.marginBottom = '8px';
            
            const btnFinalizar = document.createElement('button');
            btnFinalizar.textContent = '✅ Factura Enviada (Finalizar)';
            btnFinalizar.className = 'primary-btn';
            btnFinalizar.style.backgroundColor = '#4CAF50';
            btnFinalizar.addEventListener('click', async () => {
                if (!inputRuc.value.trim()) {
                    window.dispatchEvent(new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Por favor, ingresa el RUC primero.' }));
                    return;
                }
                record.notas = 'RUC: ' + inputRuc.value;
                // update first to save notes, then finalize
                await StorageAPI.updateCrmRecord('facturas', record);
                await StorageAPI.finalizeCrmRecord('facturas', record.id);
                window.dispatchEvent(new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Factura Finalizada' }));
            });
            
            flex.appendChild(inputRuc);
            flex.appendChild(btnFinalizar);
        }

        this.container.appendChild(flex);
    }
  }
};

Invoice.init();
