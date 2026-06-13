import { CONSTANTS } from '../shared/constants.js';

/**
 * @description Service worker principal (MV3 Background)
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Manejo de mensajes CRUD para el CRM
  if (message.action === CONSTANTS.MESSAGES.CRM_ADD_RECORD) {
    const key = `crm_${message.tab}`;
    chrome.storage.local.get(key).then(records => {
      const currentRecords = records[key] || [];
      currentRecords.push(message.data);
      chrome.storage.local.set({ [key]: currentRecords }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true; // Indicar que la respuesta es asíncrona
  }

  if (message.action === CONSTANTS.MESSAGES.CRM_UPDATE_RECORD) {
    const key = `crm_${message.tab}`;
    chrome.storage.local.get(key).then(records => {
      const currentRecords = records[key] || [];
      const index = currentRecords.findIndex(r => r.id === message.id);
      if (index >= 0) {
        currentRecords[index] = { ...currentRecords[index], ...message.fields };
        chrome.storage.local.set({ [key]: currentRecords }).then(() => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: 'Record not found' });
      }
    });
    return true;
  }

  if (message.action === CONSTANTS.MESSAGES.CRM_DELETE_RECORD) {
    const key = `crm_${message.tab}`;
    chrome.storage.local.get(key).then(records => {
      const currentRecords = records[key] || [];
      const newRecords = currentRecords.filter(r => r.id !== message.id);
      chrome.storage.local.set({ [key]: newRecords }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === 'CRM_SET_SUPPORT_STATE') {
    const key = `crm_${message.tab}`;
    chrome.storage.local.get(key).then(records => {
      const currentRecords = records[key] || [];
      // Filtrar el anterior del mismo telefono
      const newRecords = currentRecords.filter(r => r.telefono !== message.data.telefono);
      newRecords.push(message.data);
      chrome.storage.local.set({ [key]: newRecords }).then(() => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (message.action === 'CRM_CLEAR_SUPPORT_STATE_BY_PHONE') {
    const key = `crm_soportes`;
    chrome.storage.local.get(key).then(records => {
      const currentRecords = records[key] || [];
      const newRecords = currentRecords.filter(r => {
          if (r.telefono === message.phone) {
              // Borramos el estado SOLAMENTE si han pasado más de 24 horas (24 * 60 * 60 * 1000)
              if (Date.now() - r.createdAt > 24 * 60 * 60 * 1000) {
                  return false; // Excluir (borrar)
              }
          }
          return true; // Conservar
      });
      if (currentRecords.length !== newRecords.length) {
          chrome.storage.local.set({ [key]: newRecords }).then(() => {
              sendResponse({ success: true, cleared: true });
          });
      } else {
          sendResponse({ success: true, cleared: false });
      }
    });
    return true;
  }

  if (message.action === CONSTANTS.MESSAGES.SAVE_CONTACT_NOTES) {
    const key = `contact_notes_${message.phone}`;
    chrome.storage.local.set({ [key]: message.text }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.action === CONSTANTS.MESSAGES.GET_CONTACT_NOTES) {
    const key = `contact_notes_${message.phone}`;
    chrome.storage.local.get(key).then(result => {
      sendResponse({ text: result[key] || '' });
    });
    return true;
  }

  return false; // No se manejó el mensaje
});

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        // Establecer valores por defecto al instalar
        chrome.storage.local.set({
            isExtensionEnabled: true,
            [CONSTANTS.STORAGE_KEYS.SNIPPETS]: [
                { id: crypto.randomUUID(), command: '/saludo', text: '¡Hola! ¿En qué podemos ayudarte hoy?', isFloating: true },
                { id: crypto.randomUUID(), command: '/horarios', text: 'Nuestro horario de atención es de Lunes a Viernes de 9am a 6pm.', isFloating: true },
                { id: crypto.randomUUID(), command: '/pagos', text: 'Aceptamos transferencias, tarjetas y pagos en efectivo contra entrega.', isFloating: true },
                { id: crypto.randomUUID(), command: '/listo', text: '¡Todo listo! Tu pedido está en camino.', isFloating: true }
            ]
        });
    }
});
