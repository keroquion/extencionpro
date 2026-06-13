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
#wa-crm-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #fff; pointer-events: none; }

/* Barra Horizontal de Snippets */
#snippets-bar { position: fixed; bottom: 74px; left: 50%; transform: translateX(-50%); display: none; gap: 8px; background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 8px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.5); z-index: 998; pointer-events: auto; max-width: 80%; overflow-x: auto; transition: border-radius 0.3s; }
#snippets-bar::-webkit-scrollbar { height: 0px; }
.snippet-chip { display: flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; padding: 6px 12px; cursor: pointer; transition: all 0.2s; color: #fff; font-size: 13px; font-weight: 500; white-space: nowrap; }
.snippet-chip:hover { background: rgba(255, 255, 255, 0.15); transform: translateY(-2px); }
.snippet-dot { width: 8px; height: 8px; border-radius: 50%; box-shadow: 0 0 8px currentColor; }

/* Controles de la barra de snippets */
.drag-handle { cursor: grab; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); padding: 0 4px; user-select: none; font-size: 16px; transition: color 0.2s; }
.drag-handle:hover { color: white; }
.drag-handle:active { cursor: grabbing; }
.min-btn { cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5); padding: 0 4px; user-select: none; font-size: 16px; transition: color 0.2s; font-weight: bold; }
.min-btn:hover { color: white; }

.snippets-minimized .snippet-chip, .snippets-minimized .snippets-divider { display: none !important; }
.snippets-minimized { padding: 8px 12px !important; border-radius: 24px !important; gap: 0 !important; }

/* Botón flotante FAB principal (Rayito) */
#wa-crm-fab { position: fixed; bottom: 80px; right: 24px; width: 56px; height: 56px; border-radius: 50%; background-color: #6a5acd; color: #ff8c00; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); cursor: pointer; font-size: 24px; display: flex; align-items: center; justify-content: center; z-index: 1000; transition: transform 0.2s, background-color 0.2s; pointer-events: auto; font-weight: bold; }
#wa-crm-fab:hover { transform: scale(1.05); background-color: #5a4bba; }

/* Columna vertical de iconos CRM */
#crm-icons-column { position: fixed; bottom: 150px; right: 28px; display: flex; flex-direction: column-reverse; gap: 12px; z-index: 999; pointer-events: auto; transition: opacity 0.3s, transform 0.3s; transform-origin: bottom center; }
.icons-hidden { opacity: 0; transform: scale(0.5) translateY(50px); pointer-events: none !important; }
.icons-visible { opacity: 1; transform: scale(1) translateY(0); }

/* Icono CRM individual */
.crm-icon-btn { width: 48px; height: 48px; border-radius: 50%; background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; font-size: 20px; display: flex; justify-content: center; align-items: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.4); transition: all 0.2s; position: relative; }
.crm-icon-btn:hover { background: rgba(255, 255, 255, 0.1); transform: scale(1.1); }
.crm-icon-btn.active { background: #6a5acd; border-color: #ff8c00; }
/* Tooltip para el icono */
.crm-icon-btn::before { content: attr(data-tooltip); position: absolute; right: 60px; background: rgba(0,0,0,0.8); color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.2s; }
.crm-icon-btn:hover::before { opacity: 1; }

/* Panel Popover del CRM activo */
#crm-popover { position: fixed; bottom: 150px; right: 90px; width: 320px; background: rgba(26, 26, 46, 0.95); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.4); display: none; flex-direction: column; overflow-y: auto; max-height: calc(100vh - 200px); z-index: 999; pointer-events: auto; padding: 16px; }
.popover-visible { display: flex !important; animation: fadeInRight 0.3s ease; }
@keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }

/* Header del menú CRM y contenido de paneles */
#menu-header { background-color: rgba(7, 94, 84, 0.8); color: white; padding: 12px; border-radius: 8px; font-weight: bold; font-size: 13px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 12px; }
.crm-panel-content { display: flex; flex-direction: column; gap: 12px; }
.crm-panel-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #25D366; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px; }

/* Elementos comunes (Inputs, textareas, botones) */
textarea, input[type="time"], input[type="date"], select { width: 100%; padding: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(0,0,0,0.2); color: white; border-radius: 6px; box-sizing: border-box; font-family: inherit; font-size: 14px; }
button.primary-btn { background-color: #25D366; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%; }
button.primary-btn:hover { background-color: #128C7E; }
button.secondary-btn { background-color: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 6px; cursor: pointer; width: 100%; }
button.secondary-btn:hover { background-color: rgba(255,255,255,0.2); }
/* Toast y Scheduler */
.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); background: rgba(0, 0, 0, 0.8); color: white; padding: 10px 20px; border-radius: 20px; font-size: 14px; z-index: 2000; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
.toast.show { opacity: 1; }
.scheduler-row { display: flex; align-items: center; gap: 8px; }
.scheduler-row label { font-size: 12px; font-weight: bold; width: 60px; color: #bbb;}
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
  window.addEventListener('WA_CRM_ACTION_SUPPORT', handleActionSupport);
}

let dynamicStyleElement = null;

async function updateDynamicStyles() {
    const citas = await StorageAPI.getCrmRecords('citas');
    const facturas = await StorageAPI.getCrmRecords('facturas');
    const envios = await StorageAPI.getCrmRecords('envios');
    const soportes = await StorageAPI.getCrmRecords('soportes');

    const contactStates = new Map();

    const getMatchKey = (r) => (r.contacto === 'Sin Nombre' || r.contacto === 'Grupo') ? r.telefono : r.contacto;

    citas.forEach(r => contactStates.set(getMatchKey(r), { type: 'cita', level: 1 }));
    facturas.forEach(r => {
        const key = getMatchKey(r);
        const current = contactStates.get(key);
        if (!current || current.level < 2) contactStates.set(key, { type: 'factura', level: 2 });
    });
    envios.forEach(r => {
        const key = getMatchKey(r);
        const current = contactStates.get(key);
        if (!current || current.level < 3) contactStates.set(key, { type: 'envio', level: 3 });
    });
    
    // Soportes (Listo, Pendiente, Crítico)
    soportes.forEach(r => {
        const key = getMatchKey(r);
        // El estado de soporte sobreescribe el color visual
        contactStates.set(key, { type: 'soporte_' + r.estado_soporte, level: 99 });
    });

    let cssRules = '';
    let currentContactType = null;
    
    let currentActiveKey = null;
    if (STATE.currentContact) {
        currentActiveKey = (STATE.currentContact.name === 'Sin Nombre' || STATE.currentContact.name === 'Grupo') ? STATE.currentContact.phone : STATE.currentContact.name;
    }

    for (const [nameRaw, data] of contactStates.entries()) {
        if (!nameRaw) continue;
        
        // Limpiar marcas bidi invisibles que WhatsApp suele insertar (LRM, RLM, etc.)
        const cleanName = nameRaw.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '');
        const escapedName = cleanName.replace(/"/g, '\\"');
        
        let color = '';
        if (data.type === 'cita') color = 'rgba(255, 193, 7, 0.2)'; // Amarillo
        if (data.type === 'factura') color = 'rgba(33, 150, 243, 0.2)'; // Azul
        if (data.type === 'envio') color = 'rgba(76, 175, 80, 0.2)'; // Verde Intenso
        if (data.type === 'soporte_listo') color = 'rgba(0, 255, 0, 0.3)'; // Verde Chillón
        if (data.type === 'soporte_pendiente') color = 'rgba(255, 165, 0, 0.3)'; // Naranja
        if (data.type === 'soporte_critico') color = 'rgba(255, 69, 0, 0.3)'; // Rojo Crítico

        // Usamos un seudoelemento ::after con pointer-events: none apuntando al div interno
        // para evitar que se dibuje sobre el padding externo (espacio negro).
        cssRules += `
            div[role="row"]:has([title*="${escapedName}"]) > div,
            div[role="listitem"]:has([title*="${escapedName}"]) > div {
                position: relative !important;
            }
            div[role="row"]:has([title*="${escapedName}"]) > div::after,
            div[role="listitem"]:has([title*="${escapedName}"]) > div::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: ${color} !important;
                box-shadow: inset 6px 0 0 0 ${color.replace('0.2', '1')} !important;
                pointer-events: none !important;
                z-index: 10;
                border-radius: inherit;
            }
        `;
        
        if (currentActiveKey && currentActiveKey === nameRaw) {
            currentContactType = data.type;
        }
    }

    // Sobreescribir el color del panel derecho si el contacto activo tiene estado
    if (STATE.currentContact && currentContactType) {
        let glowColor = '';
        if (currentContactType === 'cita') glowColor = 'rgba(255, 193, 7, 0.6)';
        if (currentContactType === 'factura') glowColor = 'rgba(33, 150, 243, 0.6)';
        if (currentContactType === 'envio') glowColor = 'rgba(76, 175, 80, 0.7)';
        if (currentContactType === 'soporte_listo') glowColor = 'rgba(0, 255, 0, 0.6)';
        if (currentContactType === 'soporte_pendiente') glowColor = 'rgba(255, 165, 0, 0.6)';
        if (currentContactType === 'soporte_critico') glowColor = 'rgba(255, 69, 0, 0.6)';

        // Aplicamos outline y un seudoelemento o inset para no afectar el tamaño (el border suma pixeles)
        cssRules += `
            body.wa-crm-active-session #main,
            body.wa-crm-active-session [data-testid="conversation-panel-wrapper"] {
                box-shadow: inset 0 0 80px 15px ${glowColor} !important;
                outline: 4px solid ${glowColor.replace('0.6', '1').replace('0.7', '1')} !important;
                outline-offset: -4px !important;
            }
        `;
        
        // Auto-abrir la opción del CRM flotante correspondiente
        FloatingMenu.autoOpenCrmModule(currentContactType);
    } else if (STATE.currentContact) {
        // Cerrar popover si el chat activo no tiene estado
        FloatingMenu.closeCrmPopover();
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
    case CONSTANTS.MESSAGES.NEW_MESSAGE:
      // Cuando recibimos un mensaje del cliente, quitamos cualquier estado de soporte que tuviera
      if (event.data.payload && event.data.payload.phone) {
          chrome.runtime.sendMessage({
              action: 'CRM_CLEAR_SUPPORT_STATE_BY_PHONE',
              phone: event.data.payload.phone
          }, (response) => {
              if (response && response.cleared) {
                  // Si se limpió algún estado, actualizamos estilos
                  updateDynamicStyles();
              }
          });
      }
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
  if (changes['crm_citas'] || changes['crm_facturas'] || changes['crm_envios'] || changes['crm_soportes']) {
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
            const dataTransfer = new DataTransfer();
            dataTransfer.setData('text/plain', templateText);
            const pasteEvent = new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true
            });
            chatInput.dispatchEvent(pasteEvent);
            pasted = true;
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

function handleActionSupport(e) {
    if (!STATE.currentContact) {
        FloatingMenu.showToast('Abre un chat primero');
        return;
    }
    const { status, label } = e.detail;
    
    const record = {
        id: crypto.randomUUID(),
        contacto: STATE.currentContact.name,
        telefono: STATE.currentContact.phone,
        estado_soporte: status,
        createdAt: Date.now()
    };
    
    chrome.runtime.sendMessage({
        action: 'CRM_SET_SUPPORT_STATE',
        tab: 'soportes',
        data: record
    });
    
    FloatingMenu.showToast(`✅ Marcado como ${label}`);
}

function injectMainWorldScripts() {
    if (window.location.hostname !== 'web.whatsapp.com') return;

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
chrome.storage.local.get(['isExtensionEnabled']).then((result) => {
    const isEnabled = result.isExtensionEnabled !== false;
    if (isEnabled) {
        init().then(() => {
            if (window.location.hostname === 'web.whatsapp.com') {
                injectMainWorldScripts();
            }
        });
    }
});

// Escuchar cambios de estado
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isExtensionEnabled) {
        if (!changes.isExtensionEnabled.newValue) {
            // Desactivado: Recargar la página o esconder elementos
            window.location.reload();
        } else {
            // Activado
            window.location.reload();
        }
    }
});
