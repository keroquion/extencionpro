import { ContactNotes } from './contact-notes.js';
import { Scheduler } from './scheduler.js';
import { Invoice } from './invoice.js';
import { Shipping } from './shipping.js';
import { CrmFilters } from './filters.js';

export const FloatingMenu = {
  isOpen: false,
  state: null,
  toastEl: null,
  snippetsBar: null,
  crmIconsColumn: null,
  crmPopover: null,
  popoverContent: null,
  popoverHeader: null,
  activeCrmModule: null,

  init(shadowRoot, state) {
    this.state = state;
    const container = shadowRoot.container;
    
    // Toast
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'toast';
    container.appendChild(this.toastEl);

    // Barra de Snippets Horizontal
    this.snippetsBar = document.createElement('div');
    this.snippetsBar.id = 'snippets-bar';
    container.appendChild(this.snippetsBar);
    this.makeDraggable(this.snippetsBar);

    // FAB Principal
    const fab = document.createElement('button');
    fab.id = 'wa-crm-fab';
    fab.innerHTML = '⚡';
    fab.addEventListener('click', () => this.toggleMenu());
    container.appendChild(fab);

    // Lógica Específica de WhatsApp
    if (window.location.hostname === 'web.whatsapp.com') {
        // Columna de Iconos Vertical
        this.crmIconsColumn = document.createElement('div');
        this.crmIconsColumn.id = 'crm-icons-column';
        this.crmIconsColumn.className = 'icons-hidden';
        
        // Popover del CRM
        this.crmPopover = document.createElement('div');
        this.crmPopover.id = 'crm-popover';
        
        this.popoverHeader = document.createElement('div');
        this.popoverHeader.id = 'menu-header';
        this.popoverHeader.textContent = 'Abre un chat para comenzar';
        
        this.popoverContent = document.createElement('div');
        this.popoverContent.className = 'crm-panel-content';
        
        this.crmPopover.appendChild(this.popoverHeader);
        this.crmPopover.appendChild(this.popoverContent);

        // Crear botones de iconos
        this.addCrmIcon('🔍', 'Filtros CRM', 'filtros', CrmFilters.render);
        this.addCrmIcon('👤', 'Contacto', 'contacto', ContactNotes.render);
        this.addCrmIcon('📅', 'Agendar', 'agendar', (c) => Scheduler.render(c));
        this.addCrmIcon('🧾', 'Factura', 'factura', (c) => Invoice.render(c));
        this.addCrmIcon('📦', 'Envío', 'envio', (c) => Shipping.render(c));
        this.addCrmIcon('📝', 'Reporte CRM', 'reporte', this.renderReportGenerator.bind(this));

        container.appendChild(this.crmIconsColumn);
        container.appendChild(this.crmPopover);
    }

    // Escuchar eventos custom
    window.addEventListener('WA_CRM_SHOW_TOAST', (e) => this.showToast(e.detail));
  },

  makeDraggable(el) {
      let isDragging = false;
      let startX, startY, initialLeft, initialTop;

      const controls = document.createElement('div');
      controls.style.display = 'flex';
      controls.style.alignItems = 'center';
      controls.style.gap = '8px';

      const handle = document.createElement('div');
      handle.className = 'drag-handle';
      handle.innerHTML = '⣿';
      handle.title = 'Arrastrar';

      const minBtn = document.createElement('div');
      minBtn.className = 'min-btn';
      minBtn.innerHTML = '−';
      minBtn.title = 'Minimizar / Restaurar';
      minBtn.onclick = () => {
          el.classList.toggle('snippets-minimized');
          minBtn.innerHTML = el.classList.contains('snippets-minimized') ? '➕' : '−';
      };

      controls.appendChild(handle);
      controls.appendChild(minBtn);

      const onMouseDown = (e) => {
          if (e.target !== handle) return;
          isDragging = true;
          startX = e.clientX;
          startY = e.clientY;
          const rect = el.getBoundingClientRect();
          
          el.style.transform = 'none';
          el.style.left = rect.left + 'px';
          el.style.top = rect.top + 'px';
          el.style.bottom = 'auto';
          
          initialLeft = rect.left;
          initialTop = rect.top;
          
          e.preventDefault();
      };

      const onMouseMove = (e) => {
          if (!isDragging) return;
          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          el.style.left = `${initialLeft + dx}px`;
          el.style.top = `${initialTop + dy}px`;
      };

      const onMouseUp = () => {
          if (isDragging) isDragging = false;
      };

      el.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      
      el._controls = controls;
  },

  toggleMenu() {
    this.isOpen = !this.isOpen;
    if (this.crmIconsColumn) {
        this.crmIconsColumn.className = this.isOpen ? 'icons-visible' : 'icons-hidden';
    }
    // Si se cierra el menú, esconder también el popover
    if (!this.isOpen && this.crmPopover) {
        this.crmPopover.classList.remove('popover-visible');
        this.activeCrmModule = null;
        this.updateActiveIcon();
    }
  },

  addCrmIcon(emoji, tooltip, id, renderFn) {
    const btn = document.createElement('div');
    btn.className = 'crm-icon-btn';
    btn.textContent = emoji;
    btn.setAttribute('data-tooltip', tooltip);
    btn.dataset.id = id;

    btn.addEventListener('click', () => {
        if (this.activeCrmModule === id) {
            // Cerrar popover si se clickea el mismo icono
            this.crmPopover.classList.remove('popover-visible');
            this.activeCrmModule = null;
        } else {
            // Abrir popover con el contenido nuevo
            this.activeCrmModule = id;
            this.popoverContent.innerHTML = '';
            
            const title = document.createElement('div');
            title.className = 'crm-panel-title';
            title.textContent = tooltip;
            this.popoverContent.appendChild(title);

            const body = document.createElement('div');
            renderFn(body);
            this.popoverContent.appendChild(body);
            
            this.crmPopover.classList.add('popover-visible');
        }
        this.updateActiveIcon();
    });

    this.crmIconsColumn.appendChild(btn);
  },

  updateActiveIcon() {
      if (!this.crmIconsColumn) return;
      const icons = this.crmIconsColumn.querySelectorAll('.crm-icon-btn');
      icons.forEach(icon => {
          if (icon.dataset.id === this.activeCrmModule) {
              icon.classList.add('active');
          } else {
              icon.classList.remove('active');
          }
      });
  },

  autoOpenCrmModule(type) {
      if (!this.crmIconsColumn) return;
      
      // Si el menú está cerrado, lo abrimos para mostrar el estado pendiente
      if (!this.isOpen) {
          this.toggleMenu();
      }

      const mapTypeToId = { 'cita': 'agendar', 'factura': 'factura', 'envio': 'envio' };
      const id = mapTypeToId[type];
      if (id && this.activeCrmModule !== id) {
         // Asegurarnos de cerrar el actual si hay uno abierto antes de forzar el clic
         if (this.activeCrmModule) {
             this.crmPopover.classList.remove('popover-visible');
             this.activeCrmModule = null;
         }
         const btn = Array.from(this.crmIconsColumn.children).find(b => b.dataset.id === id);
         if (btn) btn.click();
      }
  },

  closeCrmPopover() {
      if (this.crmPopover && this.activeCrmModule) {
          this.crmPopover.classList.remove('popover-visible');
          this.activeCrmModule = null;
          this.updateActiveIcon();
      }
  },

  updateContact(contact) {
    if (!this.popoverHeader) return;
    if (contact) {
      this.popoverHeader.textContent = `${contact.name} — ${contact.phone}`;
    } else {
      this.popoverHeader.textContent = 'Abre un chat para comenzar';
    }
    window.dispatchEvent(new CustomEvent('WA_CRM_CONTACT_CHANGED', { detail: { contact } }));
  },

  updateConnectionStatus(isConnected) {
     if (!this.popoverHeader) return;
     if(!isConnected){
         this.popoverHeader.textContent = '⚠️ Desconectado de WA';
         this.popoverHeader.style.backgroundColor = 'rgba(211, 47, 47, 0.8)';
     } else {
         this.popoverHeader.style.backgroundColor = 'rgba(7, 94, 84, 0.8)';
     }
  },

  renderFloatingSnippets() {
    if (!this.snippetsBar) return;
    this.snippetsBar.innerHTML = '';
    
    if (this.snippetsBar._controls) {
        this.snippetsBar.appendChild(this.snippetsBar._controls);
    }
    
    const floatingSnippets = Array.from(this.state.snippets.values()).filter(s => s.isFloating).slice(0, 5);
    
    if(floatingSnippets.length === 0){
        this.snippetsBar.style.display = 'none';
        return;
    }
    
    this.snippetsBar.style.display = 'flex';
    const colors = ['#6a5acd', '#20b2aa', '#f4a460', '#ff6347', '#e83e8c'];

        floatingSnippets.forEach((snippet, i) => {
            const chip = document.createElement('div');
            chip.className = 'snippet-chip';
            
            const dotColor = colors[i % colors.length];

            chip.innerHTML = `
                <div class="snippet-dot" style="color: ${dotColor}; background-color: ${dotColor}"></div>
                <span>${snippet.command.replace('/', '')}</span>
            `;

            chip.addEventListener('click', async () => {
            try {
                if (window.location.hostname === 'web.whatsapp.com') {
                    const chatInput = document.querySelector('#main footer div[contenteditable="true"]');
                    if (chatInput) {
                        chatInput.focus();
                        
                        if (snippet.imageUrl) {
                            try {
                                const res = await fetch(snippet.imageUrl);
                                const blob = await res.blob();
                                const file = new File([blob], "image.png", { type: blob.type });
                                
                                const imgDataTransfer = new DataTransfer();
                                imgDataTransfer.items.add(file);
                                
                                chatInput.dispatchEvent(new ClipboardEvent('paste', {
                                    clipboardData: imgDataTransfer,
                                    bubbles: true,
                                    cancelable: true
                                }));
                                
                                setTimeout(() => {
                                    const captionInput = document.activeElement;
                                    if (captionInput && captionInput.getAttribute('contenteditable') === 'true') {
                                        const textDataTransfer = new DataTransfer();
                                        textDataTransfer.setData('text/plain', snippet.text);
                                        captionInput.dispatchEvent(new ClipboardEvent('paste', {
                                            clipboardData: textDataTransfer,
                                            bubbles: true,
                                            cancelable: true
                                        }));
                                    }
                                }, 500);
                                
                                this.showToast(`${snippet.command} insertando imagen...`);
                                return;
                            } catch (imgErr) {
                                console.error('[WA-CRM] Error cargando imagen flotante', imgErr);
                            }
                        }

                        // Si no hay imagen
                        const dataTransfer = new DataTransfer();
                        dataTransfer.setData('text/plain', snippet.text);
                        const pasteEvent = new ClipboardEvent('paste', {
                            clipboardData: dataTransfer,
                            bubbles: true,
                            cancelable: true
                        });
                        chatInput.dispatchEvent(pasteEvent);
                        this.showToast(`${snippet.command} insertado!`);
                        return;
                    }
                }
                const textArea = document.createElement("textarea");
                textArea.value = snippet.text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textArea);
                    this.showToast(`${snippet.command} copiado al portapapeles`);
                } catch(e) {
                    this.showToast(`Error al usar snippet`);
                }
            });
            this.snippetsBar.appendChild(chip);
        });

        // Divisor visual para botones de estado de soporte
        const divider = document.createElement('div');
        divider.className = 'snippets-divider';
        divider.style.width = '1px';
        divider.style.height = '24px';
        divider.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        divider.style.margin = '0 4px';
        this.snippetsBar.appendChild(divider);

        // Botones de Soporte
        const supportStatuses = [
            { label: 'LISTO', type: 'listo', color: '#00FF00', bg: 'rgba(0, 255, 0, 0.2)' },
            { label: 'PENDIENTE', type: 'pendiente', color: '#FFA500', bg: 'rgba(255, 165, 0, 0.2)' },
            { label: 'CRÍTICO', type: 'critico', color: '#FF4500', bg: 'rgba(255, 69, 0, 0.2)' }
        ];

        supportStatuses.forEach(status => {
            const chip = document.createElement('div');
            chip.className = 'snippet-chip';
            chip.style.backgroundColor = status.bg;
            chip.style.border = `1px solid ${status.color}`;
            chip.style.color = status.color;
            chip.innerHTML = `<strong>${status.label}</strong>`;

            chip.addEventListener('click', () => {
                window.dispatchEvent(new CustomEvent('WA_CRM_ACTION_SUPPORT', { detail: { status: status.type, label: status.label } }));
            });
            this.snippetsBar.appendChild(chip);
        });

  },

  updateFloatingSnippets() {
       this.renderFloatingSnippets();
  },

  renderReportGenerator(container) {
      container.innerHTML = '';
      const p = document.createElement('p');
      p.style.fontSize = '12px';
      p.style.color = '#bbb';
      p.textContent = 'Genera una lista de pendientes para enviar por WhatsApp.';
      
      const btn = document.createElement('button');
      btn.className = 'primary-btn';
      btn.textContent = '📋 Copiar Reporte';
      
      btn.addEventListener('click', async () => {
          try {
              const { StorageAPI } = await import('../shared/storage-api.js');
              const citas = await StorageAPI.getCrmRecords('citas');
              const facturas = await StorageAPI.getCrmRecords('facturas');
              const envios = await StorageAPI.getCrmRecords('envios');
              
              let report = '📊 *REPORTE CRM PENDIENTES*\n\n';
              
              if (citas.length > 0) {
                  report += '*Agendamientos:*\n';
                  citas.forEach(c => { report += `${c.contacto} - ${c.telefono} - Cita\n`; });
                  report += '\n';
              }
              if (facturas.length > 0) {
                  report += '*Facturas:*\n';
                  facturas.forEach(c => { report += `${c.contacto} - ${c.telefono} - ${c.estado}\n`; });
                  report += '\n';
              }
              if (envios.length > 0) {
                  report += '*Envíos:*\n';
                  envios.forEach(c => { report += `${c.contacto} - ${c.telefono} - ${c.estado}\n`; });
              }
              
              if (citas.length === 0 && facturas.length === 0 && envios.length === 0) {
                  this.showToast('No hay registros pendientes');
                  return;
              }
              
              const textArea = document.createElement("textarea");
              textArea.value = report;
              document.body.appendChild(textArea);
              textArea.select();
              document.execCommand("copy");
              document.body.removeChild(textArea);
              this.showToast('✅ Reporte copiado');
          } catch (e) {
              this.showToast('Error generando reporte');
          }
      });
      
      container.appendChild(p);
      container.appendChild(btn);
  },
  
  showToast(msg) {
      this.toastEl.textContent = msg;
      this.toastEl.classList.add('show');
      setTimeout(() => this.toastEl.classList.remove('show'), 3000);
  }
};

