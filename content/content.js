import { CONSTANTS } from '../shared/constants.js';
import { StorageAPI } from '../shared/storage-api.js';
import { ShadowUI } from './modules/shadow-ui.js';
import { FloatingMenu } from './modules/floating-menu.js';
import { SnippetEngine } from './modules/snippet-engine.js';
import { ContactNotes } from './modules/contact-notes.js';

/**
 * @description Orquestador principal (ISOLATED WORLD)
 */

const STATE = {
  currentContact: null,
  snippets: new Map(),
  isMenuOpen: false,
  isConnected: false,
  config: {}
};

const OVERLAY_CSS = `
/* Contenedor principal */
#wa-crm-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; pointer-events: none; }
/* Botón flotante FAB */
#wa-crm-fab { position: fixed; bottom: 80px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background-color: #25D366; color: white; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center; z-index: 1000; transition: transform 0.2s, background-color 0.2s; pointer-events: auto; }
#wa-crm-fab:hover { transform: scale(1.05); background-color: #128C7E; }
/* Menú principal */
#wa-crm-menu { position: fixed; bottom: 150px; right: 24px; width: 320px; background: white; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); display: flex; flex-direction: column; overflow: hidden; transition: opacity 0.3s, transform 0.3s; transform-origin: bottom right; z-index: 999; pointer-events: auto; }
.menu-hidden { opacity: 0; transform: scale(0.8); pointer-events: none !important; }
.menu-visible { opacity: 1; transform: scale(1); }
/* Header del menú */
#menu-header { background-color: #075E54; color: white; padding: 16px; font-weight: bold; font-size: 14px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
/* Acordeón */
.accordion-section { border-bottom: 1px solid #eee; }
.accordion-section:last-child { border-bottom: none; }
.accordion-header { width: 100%; background: none; border: none; padding: 16px; text-align: left; font-size: 15px; font-weight: 500; color: #333; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.accordion-header:hover { background-color: #f9f9f9; }
.accordion-body { padding: 0 16px 16px; display: flex; flex-direction: column; gap: 12px; }
.accordion-body.collapsed { display: none; }
/* Elementos comunes */
textarea, input[type="time"], input[type="date"] { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; font-family: inherit; font-size: 14px; }
button.primary-btn { background-color: #25D366; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; }
button.primary-btn:hover { background-color: #128C7E; }
button.secondary-btn { background-color: #f0f0f0; color: #333; border: 1px solid #ccc; padding: 6px 12px; border-radius: 6px; cursor: pointer; }
button.secondary-btn:hover { background-color: #e0e0e0; }
/* Toast */
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px; z-index: 2000; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.toast.show { opacity: 1; }
/* Scheduler */
.scheduler-row { display: flex; align-items: center; gap: 8px; }
.scheduler-row label { font-size: 12px; font-weight: bold; width: 60px; }
`;

async function init() {
  const { shadow, container } = ShadowUI.init(OVERLAY_CSS);
  
  FloatingMenu.init({ container }, STATE);
  SnippetEngine.init(STATE);

  console.log('[WA-CRM] Shadow DOM inicializado', container);

  STATE.config = await StorageAPI.getConfig();
  const snippetsArr = await StorageAPI.getSnippets();
  STATE.snippets = new Map(snippetsArr.map(s => [s.command, s]));
  FloatingMenu.updateFloatingSnippets();
  
  await updateDynamicStyles();

  window.addEventListener('message', handleBridgeMessage);
  chrome.storage.onChanged.addListener(handleStorageChange);

  // Escuchar mensajes desde el Service Worker o Dashboard
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'OPEN_CHAT_IN_WA' && request.phone) {
          window.postMessage({ source: 'wa-crm-content', action: 'OPEN_CHAT', phone: request.phone }, '*');
          sendResponse({ success: true });
      }
  });
  
  // Custom event listeners from modules
  window.addEventListener('WA_CRM_SAVE_APPOINTMENT', handleSaveAppointment);
  window.addEventListener('WA_CRM_ACTION_INVOICE', (e) => handleActionRecord('factura', e.detail?.target));
  window.addEventListener('WA_CRM_ACTION_SHIPPING', (e) => handleActionRecord('envio', e.detail?.target));
}

let dynamicStyleElement = null;

async function updateDynamicStyles() {
    const citas = await StorageAPI.getCrmRecords('citas');
    const facturas = await StorageAPI.getCrmRecords('facturas');
    const envios = await StorageAPI.getCrmRecords('envios');

    const contactStates = new Map();

    // Priority: Envío (3) > Factura (2) > Cita (1)
    citas.forEach(r => contactStates.set(r.contacto, { type: 'cita', level: 1 }));
    facturas.forEach(r => {
        const current = contactStates.get(r.contacto);
        if (!current || current.level < 2) contactStates.set(r.contacto, { type: 'factura', level: 2 });
    });
    envios.forEach(r => {
        const current = contactStates.get(r.contacto);
        if (!current || current.level < 3) contactStates.set(r.contacto, { type: 'envio', level: 3 });
    });

    let cssRules = '';
    let currentContactType = null;

    for (const [nameRaw, data] of contactStates.entries()) {
        // Limpiar marcas bidi invisibles que WhatsApp suele insertar (LRM, RLM, etc.)
        const cleanName = nameRaw.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        const escapedName = cleanName.replace(/"/g, '\\"');
        
        let color = '';
        if (data.type === 'cita') color = 'rgba(255, 193, 7, 0.4)'; // Amarillo más fuerte
        if (data.type === 'factura') color = 'rgba(33, 150, 243, 0.4)'; // Azul
        if (data.type === 'envio') color = 'rgba(76, 175, 80, 0.5)'; // Verde Intenso

        // WhatsApp usa un div interno para el color de fondo gris/hover.
        // Aplicamos el color al contenedor interior para que siempre sea visible.
        cssRules += `
            div[role="row"]:has([title*="${escapedName}"]),
            div[role="listitem"]:has([title*="${escapedName}"]) {
                border-left: 6px solid ${color.replace('0.4', '1').replace('0.5', '1')} !important;
            }
            div[role="row"]:has([title*="${escapedName}"]) > div,
            div[role="listitem"]:has([title*="${escapedName}"]) > div {
                background-color: ${color} !important;
            }
        `;
        
        if (STATE.currentContact && STATE.currentContact.name === nameRaw) {
            currentContactType = data.type;
        }
    }

    // Sobreescribir el color del panel derecho si el contacto activo tiene estado
    if (STATE.currentContact && currentContactType) {
        let glowColor = '';
        if (currentContactType === 'cita') glowColor = 'rgba(255, 193, 7, 0.6)';
        if (currentContactType === 'factura') glowColor = 'rgba(33, 150, 243, 0.6)';
        if (currentContactType === 'envio') glowColor = 'rgba(76, 175, 80, 0.7)';

        // Aplicamos estilos brutales para garantizar visibilidad
        cssRules += `
            body.wa-crm-active-session #main,
            body.wa-crm-active-session [data-testid="conversation-panel-wrapper"] {
                box-shadow: inset 0 0 80px 15px ${glowColor} !important;
                border: 4px solid ${glowColor.replace('0.6', '1').replace('0.7', '1')} !important;
            }
        `;
    }

    if (!dynamicStyleElement) {
        dynamicStyleElement = document.createElement('style');
        dynamicStyleElement.id = 'wa-crm-dynamic-styles';
        (document.head || document.documentElement).appendChild(dynamicStyleElement);
    }
    dynamicStyleElement.textContent = cssRules;
}

function handleBridgeMessage(event) {
  if (!event.data || event.data.source !== 'wa-crm-bridge') return;

  switch (event.data.type) {
    case CONSTANTS.MESSAGES.CONTACT_UPDATE:
      STATE.currentContact = event.data.payload;
      console.log('[WA-CRM] Contacto activo:', STATE.currentContact);
      FloatingMenu.updateContact(STATE.currentContact);
      ContactNotes.load(STATE.currentContact.phone);
      // Activar el resaltado visual global
      if (STATE.currentContact) {
          document.body.classList.add('wa-crm-active-session');
          updateDynamicStyles(); // Recalcular color del panel derecho
      } else {
          document.body.classList.remove('wa-crm-active-session');
      }
      break;
    case CONSTANTS.MESSAGES.STATUS:
      STATE.isConnected = (event.data.payload.status === 'CONNECTED');
      console.log('[WA-CRM] Estado:', event.data.payload.status);
      FloatingMenu.updateConnectionStatus(STATE.isConnected);
      if (!STATE.isConnected) {
          document.body.classList.remove('wa-crm-active-session');
      }
      break;
    case CONSTANTS.MESSAGES.ERROR:
      console.warn('[WA-CRM] Error del bridge:', event.data.payload.message);
      break;
  }
}

function handleStorageChange(changes) {
  if (changes[CONSTANTS.STORAGE_KEYS.SNIPPETS]) {
    const newSnippets = changes[CONSTANTS.STORAGE_KEYS.SNIPPETS].newValue || [];
    STATE.snippets = new Map(newSnippets.map(s => [s.command, s]));
    FloatingMenu.updateFloatingSnippets();
  }
  
  // Actualizar colores si cambia alguna base de datos del CRM
  if (changes['crm_citas'] || changes['crm_facturas'] || changes['crm_envios']) {
      updateDynamicStyles();
  }
}

function handleSaveAppointment(e) {
    if (!STATE.currentContact) {
        FloatingMenu.showToast('Abre un chat primero');
        return;
    }
    const { mode, timeValue, dateValue } = e.detail;
    
    let fecha = new Date();
    const [hours, minutes] = timeValue.split(':');
    
    if (mode === 'tomorrow') {
        fecha.setDate(fecha.getDate() + 1);
    } else if (mode === 'specific' && dateValue) {
        fecha = new Date(dateValue);
    }
    
    if(timeValue) {
        fecha.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    }

    const record = {
        id: crypto.randomUUID(),
        contacto: STATE.currentContact.name,
        telefono: STATE.currentContact.phone,
        fechaHora: fecha.toISOString(),
        tipo: 'cita',
        notas: '',
        estado: 'pendiente',
        createdAt: Date.now()
    };
    
    chrome.runtime.sendMessage({
        action: CONSTANTS.MESSAGES.CRM_ADD_RECORD,
        tab: 'citas',
        data: record
    });
    
    FloatingMenu.showToast('✅ Cita agendada');
}

async function handleActionRecord(type, btnElement) {
    try {
        if (!STATE.currentContact) {
            FloatingMenu.showToast('Abre un chat primero');
            return;
        }
        
        const templateText = type === 'factura' 
            ? (STATE.config?.invoice_template || 'Factura pendiente de pago...') 
            : (STATE.config?.shipping_template || 'Su envío ha sido registrado...');
            
        // Intentar pegar automáticamente en el chat
        const chatInput = document.querySelector('#main footer div[contenteditable="true"]');
        let pasted = false;
        
        if (chatInput) {
            chatInput.focus();
            pasted = document.execCommand('insertText', false, templateText);
        }

        if (pasted) {
            FloatingMenu.showToast('✅ Texto insertado, ¡listo para enviar!');
        } else {
            // Fallback robusto al portapapeles si la interfaz de WhatsApp cambia
            const textArea = document.createElement("textarea");
            textArea.value = templateText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            FloatingMenu.showToast('Texto copiado — pégalo en el chat');
        }
        
        // Feedback visual en el botón
        if (btnElement) {
            const originalText = btnElement.innerHTML;
            btnElement.innerHTML = '✅ ¡Guardado y Copiado!';
            btnElement.style.backgroundColor = '#128C7E';
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.style.backgroundColor = '';
            }, 2500);
        }

        const record = {
            id: crypto.randomUUID(),
            contacto: STATE.currentContact.name,
            telefono: STATE.currentContact.phone,
            fechaHora: new Date().toISOString(),
            tipo: type,
            notas: '',
            estado: 'pendiente',
            createdAt: Date.now()
        };
        
        chrome.runtime.sendMessage({
            action: CONSTANTS.MESSAGES.CRM_ADD_RECORD,
            tab: type === 'factura' ? 'facturas' : 'envios',
            data: record
        });
    } catch(e) {
         console.error('[WA-CRM] Error en handleActionRecord:', e);
         FloatingMenu.showToast('Error de ejecución: ' + e.message);
    }
}

function injectMainWorldScripts() {
    console.log('[WA-CRM] Inyectando scripts y estilos al MAIN world de forma segura...');
    
    // Inyectar CSS Global
    const cssPath = 'content/styles/global-highlight.css';
    const existingCss = document.querySelector(`link[href*="${cssPath.split('?')[0]}"]`);
    if (existingCss) existingCss.remove();
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL(cssPath) + '?t=' + Date.now();
    (document.head || document.documentElement).appendChild(link);

    // Inyectar JS Global
    const scripts = [
        'lib/wppconnect-wa.js',
        'content/wa-bridge.js'
    ];

    scripts.forEach(path => {
        // Remover script viejo si existe para forzar actualización sin F5
        const existing = document.querySelector(`script[src*="${path.split('?')[0]}"]`);
        if (existing) existing.remove();

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL(path) + '?t=' + Date.now();
        script.onload = () => console.log(`[WA-CRM] ${path} inyectado exitosamente.`);
        (document.head || document.documentElement).appendChild(script);
    });
}

// Iniciar extensión
init().then(() => {
    injectMainWorldScripts();
});
