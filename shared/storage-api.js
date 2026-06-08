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
   * @description Actualiza un registro del CRM
   * @param {string} tab 
   * @param {object} updatedRecord 
   */
  async updateCrmRecord(tab, updatedRecord) {
    const key = `crm_${tab}`;
    const records = await this.getCrmRecords(tab);
    const index = records.findIndex(r => r.id === updatedRecord.id);
    if (index !== -1) {
        records[index] = updatedRecord;
        await chrome.storage.local.set({ [key]: records });
    }
  },

  /**
   * @description Mueve un registro a la lista de finalizados y lo elimina de pendientes
   * @param {string} tab 
   * @param {string} recordId 
   */
  async finalizeCrmRecord(tab, recordId) {
    const key = `crm_${tab}`;
    const finalKey = `crm_${tab}_finalizados`;
    
    const records = await this.getCrmRecords(tab);
    const index = records.findIndex(r => r.id === recordId);
    
    if (index !== -1) {
        const record = records[index];
        record.estado = 'finalizado';
        record.finalizedAt = Date.now();
        
        // Remove from active
        records.splice(index, 1);
        await chrome.storage.local.set({ [key]: records });
        
        // Add to finalized
        const finalData = await chrome.storage.local.get(finalKey);
        const finalizedRecords = finalData[finalKey] || [];
        finalizedRecords.push(record);
        await chrome.storage.local.set({ [finalKey]: finalizedRecords });
    }
  },

  /**
   * @description Obtiene registros finalizados del CRM
   * @param {string} tab 
   * @returns {Promise<Array>}
   */
  async getFinalizedCrmRecords(tab) {
    const key = `crm_${tab}_finalizados`;
    const data = await chrome.storage.local.get(key);
    return data[key] || [];
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
