import { CONSTANTS } from './constants.js';

/**
 * @description Wrapper tipado para chrome.storage.local
 */
export const StorageAPI = {
  
  /**
   * @description Obtiene todos los snippets
   * @returns {Promise<Array>} Array de snippets
   */
  async getSnippets() {
    const data = await chrome.storage.local.get(CONSTANTS.STORAGE_KEYS.SNIPPETS);
    return data[CONSTANTS.STORAGE_KEYS.SNIPPETS] || [];
  },

  /**
   * @description Guarda toda la lista de snippets
   * @param {Array} snippets 
   */
  async saveSnippets(snippets) {
    await chrome.storage.local.set({ [CONSTANTS.STORAGE_KEYS.SNIPPETS]: snippets });
  },
  
  /**
   * @description Agrega un nuevo snippet
   * @param {object} snippet 
   */
  async addSnippet(snippet) {
    const snippets = await this.getSnippets();
    snippets.push(snippet);
    await this.saveSnippets(snippets);
  },

  /**
   * @description Obtiene registros del CRM por pestaña
   * @param {string} tab 'citas', 'facturas' o 'envios'
   * @returns {Promise<Array>} Array de registros
   */
  async getCrmRecords(tab) {
    const key = `crm_${tab}`;
    const data = await chrome.storage.local.get(key);
    return data[key] || [];
  },

  /**
   * @description Agrega un registro al CRM en la pestaña especificada
   * @param {string} tab 
   * @param {object} record 
   */
  async addCrmRecord(tab, record) {
    const key = `crm_${tab}`;
    const records = await this.getCrmRecords(tab);
    records.push(record);
    await chrome.storage.local.set({ [key]: records });
  },

  /**
   * @description Obtiene las notas de un contacto
   * @param {string} phone Número de teléfono del contacto
   * @returns {Promise<string>} Texto de las notas o string vacío
   */
  async getContactNotes(phone) {
    const key = `contact_notes_${phone}`;
    const data = await chrome.storage.local.get(key);
    return data[key] || '';
  },

  /**
   * @description Guarda las notas de un contacto
   * @param {string} phone 
   * @param {string} text 
   */
  async saveContactNotes(phone, text) {
    const key = `contact_notes_${phone}`;
    await chrome.storage.local.set({ [key]: text });
  },
  
  /**
   * @description Obtiene la configuración general
   * @returns {Promise<object>}
   */
  async getConfig() {
    const data = await chrome.storage.local.get(CONSTANTS.STORAGE_KEYS.CONFIG);
    return data[CONSTANTS.STORAGE_KEYS.CONFIG] || {};
  }
};
