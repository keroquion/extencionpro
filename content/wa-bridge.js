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
        if (window.WPP && window.WPP.chat) {
          clearInterval(interval);
          resolve();
        } else if (attempts > 30) {
           clearInterval(interval);
           resolve();
        }
      }, 1000);
    });
  }

  function startEventListening() {
    emitStatus('CONNECTED');
    
    setInterval(() => {
        try {
            if (!window.WPP || !window.WPP.chat) return;
            
            let activeChat = null;
            try { activeChat = window.WPP.chat?.getActiveChat(); } catch(e) {}
            
            if (!activeChat) {
                try { activeChat = window.WPP.whatsapp?.Chat?.getActive?.(); } catch(e) {}
            }
            if (!activeChat) {
                try { activeChat = window.WPP.whatsapp?.ChatStore?.getActive?.(); } catch(e) {}
            }
            if (!activeChat) {
                try {
                    const chats = window.WPP.whatsapp?.ChatStore?.getModelsArray?.() || [];
                    activeChat = chats.find(c => c.active || c.isOpened);
                } catch(e) {}
            }
            
            if (activeChat) {
                processChat(activeChat);
            }
        } catch(e) {
            // Silenciamos el error para no hacer spam en la consola
        }
    }, 1000);

    window.WPP?.on?.('chat.active_chat', (chat) => {
      if(chat) processChat(chat);
    });

    window.WPP?.on?.('chat.new_message', (msg) => {
      if (!msg.id.fromMe) {
          let phoneRaw = msg.from || msg.author || '';
          let cleanPhone = typeof phoneRaw === 'string' ? phoneRaw.replace('@c.us', '').replace('@g.us', '').replace('@lid', '') : '';
          if (cleanPhone) {
              console.log('[WA-CRM-BRIDGE] Mensaje recibido de:', cleanPhone);
              emit(CONSTANTS.PREFIX + 'NEW_MESSAGE', { phone: cleanPhone });
          }
      }
    });

    window.addEventListener('message', (event) => {
      if (event.data && event.data.source === 'wa-crm-content') {
        if (event.data.action === 'OPEN_CHAT' && event.data.phone) {
           console.log('[WA-CRM-BRIDGE] Recibida orden de abrir chat:', event.data.phone);
           const chatId = event.data.phone.includes('@') ? event.data.phone : `${event.data.phone}@c.us`;
           if (window.WPP && window.WPP.chat) {
               window.WPP.chat.openChat(chatId).then(() => {
                  console.log('[WA-CRM-BRIDGE] Chat abierto exitosamente:', chatId);
               }).catch(err => {
                  console.error('[WA-CRM-BRIDGE] Error al abrir chat remoto:', err);
               });
           }
        }
      }
    });
  }

  function processChat(chat) {
    try {
      let name = chat.formattedTitle || chat.name || chat.__x_formattedTitle || 'SinNombre';
      let isGroup = chat.isGroup || chat.__x_isGroup || false;
      let phoneRaw = chat.id?.user || chat.__x_id?.user || chat.id?._serialized || chat.historyChatId || 'SinTelefono';
      
      let cleanPhone = typeof phoneRaw === 'string' ? phoneRaw.replace('@c.us', '').replace('@g.us', '').replace('@lid', '') : 'Desconocido';
      
      // Si el "nombre" es solo un número telefónico (+51 956...), significa que no está agendado
      if (/^\+?[\d\s\-]+$/.test(name)) {
          cleanPhone = name; // Guardar el número tal cual, ej: "+51 956..."
          name = "Sin Nombre";
      } else if (isGroup) {
          cleanPhone = "Grupo";
          // Si el usuario pidió que el nombre del grupo también sea "Sin Nombre", lo ponemos:
          // pero típicamente los grupos tienen nombre. Si pidió estrictamente "o es grupo = sin nombre":
          name = "Sin Nombre"; 
      }

      const contact = {
        name: name,
        phone: cleanPhone,
        isGroup: isGroup,
        timestamp: Date.now()
      };

      const hash = contact.phone + contact.name;
      if (hash !== lastContactHash) {
        lastContactHash = hash;
        console.log('[WA-CRM-BRIDGE] Nuevo contacto detectado:', contact.name, contact.phone);
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
