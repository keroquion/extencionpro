/**
 * @description Capa de datos MAIN WORLD - Inyecta wa-js y extrae datos
 */
(() => {
  const CONSTANTS = {
    PREFIX: 'WA_CRM_',
    POLL_INTERVAL_MS: 2000,
    MAX_WAIT_WPP_MS: 30000
  };

  let lastContactHash = null;

  function init() {
    waitForWPP()
      .then(startEventListening)
      .catch((err) => console.error('[WA-CRM] Error inesperado', err));
  }

  function waitForWPP() {
    return new Promise((resolve) => {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        console.error(`[WA-CRM-BRIDGE] Esperando WPP... Intento ${attempts}. WPP existe:`, !!window.WPP, 'WPP.chat existe:', !!window.WPP?.chat);
        if (window.WPP && window.WPP.chat) {
          console.error('[WA-CRM-BRIDGE] WPP y WPP.chat detectados! Resolviendo...');
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
           console.error('[WA-CRM-BRIDGE] Timeout: WPP nunca se inicializó después de 30 segundos.');
           clearInterval(interval);
        }
      }, 1000);
    });
  }

  function startEventListening() {
    console.log('[WA-CRM-BRIDGE] startEventListening iniciado. WPP isReady:', window.WPP?.isReady);
    emitStatus('CONNECTED');
    
    setInterval(() => {
        try {
            let activeChat = window.WPP?.chat?.getActiveChat();
            if (!activeChat) activeChat = window.WPP?.whatsapp?.Chat?.getActive?.();
            if (!activeChat) activeChat = window.WPP?.whatsapp?.ChatStore?.getActive?.();
            if (!activeChat) {
                const chats = window.WPP?.whatsapp?.ChatStore?.getModelsArray?.() || [];
                activeChat = chats.find(c => c.active || c.isOpened);
            }
            if (activeChat) {
                processChat(activeChat);
            } else {
                console.log('[WA-CRM-BRIDGE] activeChat es nulo en el polling.');
            }
        } catch(e) {
            console.error('[WA-CRM-BRIDGE] Error en polling:', e);
        }
    }, 1000);

    window.WPP?.on?.('chat.active_chat', (chat) => {
      console.log('[WA-CRM-BRIDGE] Evento chat.active_chat disparado', chat);
      if(chat) processChat(chat);
    });
  }

  function processChat(chat) {
    try {
      console.log('[WA-CRM-BRIDGE] processChat ejecutado para:', chat);
      
      const name = chat.formattedTitle || chat.name || chat.__x_formattedTitle || 'SinNombre';
      const phoneRaw = chat.historyChatId || chat.id?.user || chat.__x_id?.user || chat.id?._serialized || 'SinTelefono';
      
      const contact = {
        name: name,
        phone: typeof phoneRaw === 'string' ? phoneRaw.replace('@c.us', '').replace('@lid', '') : 'Desconocido',
        isGroup: chat.isGroup || chat.__x_isGroup || false,
        timestamp: Date.now()
      };

      const hash = contact.phone + contact.name;
      console.log('[WA-CRM-BRIDGE] Contacto procesado:', contact, 'Hash:', hash);
      if (hash !== lastContactHash) {
        lastContactHash = hash;
        console.log('[WA-CRM-BRIDGE] Emitiendo CONTACT_UPDATE');
        emit(CONSTANTS.PREFIX + 'CONTACT_UPDATE', contact);
      }
    } catch (error) {
      console.error('[WA-CRM-BRIDGE] Error fatal en processChat:', error);
      emit(CONSTANTS.PREFIX + 'CONTACT_UPDATE', { name: "Error Catch", phone: error.message, isGroup: false });
    }
  }

  function emit(type, payload) {
    window.postMessage({ type, payload, source: 'wa-crm-bridge' }, '*');
  }

  function emitStatus(status) {
    emit(CONSTANTS.PREFIX + 'STATUS', { status });
  }

  // Iniciar el script
  init();
})();
