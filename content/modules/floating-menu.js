import { ContactNotes } from './contact-notes.js';
import { Scheduler } from './scheduler.js';
import { Invoice } from './invoice.js';
import { Shipping } from './shipping.js';

export const FloatingMenu = {
  menuElement: null,
  isOpen: false,
  state: null,
  toastEl: null,

  init(shadowRoot, state) {
    this.state = state;
    const container = shadowRoot.container;
    
    // Toast
    this.toastEl = document.createElement('div');
    this.toastEl.className = 'toast';
    container.appendChild(this.toastEl);

    // FAB
    const fab = document.createElement('button');
    fab.id = 'wa-crm-fab';
    fab.innerHTML = '⚡';
    fab.addEventListener('click', () => this.toggleMenu());
    container.appendChild(fab);

    // MENU
    this.menuElement = document.createElement('div');
    this.menuElement.id = 'wa-crm-menu';
    this.menuElement.className = 'menu-hidden';

    // Header
    const header = document.createElement('div');
    header.id = 'menu-header';
    header.textContent = 'Abre un chat para comenzar';
    this.menuElement.appendChild(header);

    // Secciones
    this.addSection(this.menuElement, 'contacto', '👤 Contacto', ContactNotes.render);
    this.addSection(this.menuElement, 'agendar', '📅 Agendar', Scheduler.render);
    this.addSection(this.menuElement, 'factura', '🧾 Factura', Invoice.render);
    this.addSection(this.menuElement, 'envio', '📦 Envío', Shipping.render);
    this.addSection(this.menuElement, 'snippets', '⚡ Snippets Rápidos', this.renderFloatingSnippets.bind(this));

    container.appendChild(this.menuElement);
    
    // Listeners for custom events from modules
    window.addEventListener('WA_CRM_SHOW_TOAST', (e) => this.showToast(e.detail));
  },

  toggleMenu() {
    this.isOpen = !this.isOpen;
    this.menuElement.className = this.isOpen ? 'menu-visible' : 'menu-hidden';
  },

  addSection(parent, id, title, renderFn) {
    const section = document.createElement('div');
    section.className = 'accordion-section';

    const headerBtn = document.createElement('button');
    headerBtn.className = 'accordion-header';
    headerBtn.textContent = title;

    const body = document.createElement('div');
    body.className = 'accordion-body collapsed';
    renderFn(body);

    headerBtn.addEventListener('click', () => {
      body.classList.toggle('collapsed');
    });

    section.append(headerBtn, body);
    parent.appendChild(section);
  },

  updateContact(contact) {
    const header = this.menuElement.querySelector('#menu-header');
    if (contact) {
      header.textContent = `${contact.name} — ${contact.phone}`;
    } else {
      header.textContent = 'Abre un chat para comenzar';
    }
  },

  updateConnectionStatus(isConnected) {
     const header = this.menuElement.querySelector('#menu-header');
     if(!isConnected){
         header.textContent = '⚠️ Desconectado de WA';
         header.style.backgroundColor = '#d32f2f';
     } else {
         header.style.backgroundColor = '#075E54';
     }
  },

  renderFloatingSnippets(container) {
    container.innerHTML = '';
    const floatingSnippets = Array.from(this.state.snippets.values()).filter(s => s.isFloating).slice(0, 4);
    
    if(floatingSnippets.length === 0){
        const p = document.createElement('p');
        p.textContent = 'No hay snippets flotantes. Configúralos en el dashboard.';
        p.style.fontSize = '12px';
        p.style.color = '#666';
        container.appendChild(p);
        return;
    }

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '8px';

    floatingSnippets.forEach(snippet => {
        const btn = document.createElement('button');
        btn.className = 'secondary-btn';
        btn.textContent = snippet.command;
        btn.addEventListener('click', () => {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = snippet.text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                this.showToast(`Snippet ${snippet.command} copiado al portapapeles`);
            } catch(e) {
                this.showToast(`Error al copiar snippet`);
            }
        });
        grid.appendChild(btn);
    });
    container.appendChild(grid);
  },

  updateFloatingSnippets() {
       // Find the snippets body and re-render
       const sections = this.menuElement.querySelectorAll('.accordion-section');
       const snippetsSection = Array.from(sections).find(s => s.querySelector('.accordion-header').textContent.includes('Snippets Rápidos'));
       if(snippetsSection){
           const body = snippetsSection.querySelector('.accordion-body');
           this.renderFloatingSnippets(body);
       }
  },
  
  showToast(msg) {
      this.toastEl.textContent = msg;
      this.toastEl.classList.add('show');
      setTimeout(() => this.toastEl.classList.remove('show'), 3000);
  }
};
