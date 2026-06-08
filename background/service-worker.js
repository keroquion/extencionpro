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
