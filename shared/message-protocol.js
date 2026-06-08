import { CONSTANTS } from './constants.js';

/**
 * @description Crea un objeto de mensaje válido para postMessage
 * @param {string} type Tipo de mensaje (usar constantes)
 * @param {object} payload Datos a enviar
 * @returns {object} Mensaje formateado
 */
export function createMessage(type, payload = {}) {
  return {
    type,
    payload,
    source: 'wa-crm-bridge'
  };
}

/**
 * @description Valida si un mensaje recibido por postMessage es nuestro
 * @param {MessageEvent} event Evento de postMessage
 * @returns {boolean} true si es válido
 */
export function validateMessage(event) {
  // Ignorar mensajes sin data o sin source
  if (!event.data || typeof event.data !== 'object') return false;
  
  // Validar origen (debe venir del mismo frame para seguridad en WApp Web)
  if (event.origin !== 'https://web.whatsapp.com') return false;

  // Validar prefijo o source específico
  if (event.data.source !== 'wa-crm-bridge' && event.data.source !== 'wa-crm-content') return false;
  
  if (typeof event.data.type !== 'string') return false;
  
  return event.data.type.startsWith(CONSTANTS.PREFIX);
}
