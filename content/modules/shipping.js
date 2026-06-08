import { StorageAPI } from '../../shared/storage-api.js';

export const Shipping = {
  container: null,
  currentContact: null,

  init() {
    window.addEventListener('WA_CRM_CONTACT_CHANGED', async (e) => {
        this.currentContact = e.detail.contact;
        await this.render();
    });
    // Listen for storage changes to auto-update
    chrome.storage.onChanged.addListener((changes) => {
        if (changes['crm_envios']) this.render();
    });
  },

  async render(parentElement) {
    if (parentElement) this.container = parentElement;
    if (!this.container) return;
    
    this.container.innerHTML = '';
    
    if (!this.currentContact) {
        this.container.innerHTML = '<p style="font-size:12px; color:#666;">Abre un chat para gestionar envíos.</p>';
        return;
    }

    const envios = await StorageAPI.getCrmRecords('envios');
    const record = envios.find(r => r.telefono === this.currentContact.phone);

    if (!record) {
        // No hay envío pendiente, mostrar botón para registrar
        const btn = document.createElement('button');
        btn.textContent = '📦 Registrar Envío (Pendiente)';
        btn.className = 'primary-btn';
        btn.style.width = '100%';
        btn.addEventListener('click', (e) => {
            window.dispatchEvent(new CustomEvent('WA_CRM_ACTION_SHIPPING', { detail: { target: e.currentTarget } }));
        });
        this.container.appendChild(btn);
    } else {
        // Hay envío pendiente, mostrar estados
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
            const btnEnviado = document.createElement('button');
            btnEnviado.textContent = '🚚 Marcar como Enviado';
            btnEnviado.className = 'primary-btn';
            btnEnviado.style.backgroundColor = '#2196F3';
            btnEnviado.addEventListener('click', async () => {
                record.estado = 'enviado';
                await StorageAPI.updateCrmRecord('envios', record);
                window.dispatchEvent(new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Estado actualizado a Enviado' }));
            });
            flex.appendChild(btnEnviado);
        }

        const btnFinalizar = document.createElement('button');
        btnFinalizar.textContent = '✅ Marcar como Recogido (Finalizar)';
        btnFinalizar.className = 'primary-btn';
        btnFinalizar.style.backgroundColor = '#4CAF50';
        btnFinalizar.addEventListener('click', async () => {
            await StorageAPI.finalizeCrmRecord('envios', record.id);
            window.dispatchEvent(new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Envío Finalizado' }));
        });
        flex.appendChild(btnFinalizar);

        this.container.appendChild(flex);
    }
  }
};

Shipping.init();
