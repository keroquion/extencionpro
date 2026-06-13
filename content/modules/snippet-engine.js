export const SnippetEngine = {
  state: null,
  buffer: '',
  lastKeyTime: 0,
  isCapturing: false,
  TIMEOUT: 3000,
  
  init(state) {
      this.state = state;
      document.addEventListener('keydown', this.handleKeydown.bind(this), true);
  },

  handleKeydown(event) {
      const now = Date.now();
      
      if (now - this.lastKeyTime > this.TIMEOUT) {
          this.resetBuffer();
      }
      this.lastKeyTime = now;

      if (event.key === '/') {
          this.isCapturing = true;
          this.buffer = '/';
          return;
      }

      if (!this.isCapturing) return;

      if (event.key === ' ') {
          const command = this.buffer.trim();
          const snippet = this.state.snippets.get(command);

          if (snippet) {
              event.preventDefault();
              this.expandSnippet(snippet);
          }
          this.resetBuffer();
          return;
      }

      if (event.key === 'Escape' || event.key === 'Enter') {
          this.resetBuffer();
          return;
      }

      if (event.key.length === 1) {
          this.buffer += event.key;
      }
  },

  async expandSnippet(snippet) {
      try {
          const text = snippet.text;
          const chatInput = document.querySelector('#main footer div[contenteditable="true"]');
          if (chatInput) {
              chatInput.focus();
              
              if (snippet.imageUrl) {
                  try {
                      const res = await fetch(snippet.imageUrl);
                      const blob = await res.blob();
                      const file = new File([blob], "image.png", { type: blob.type });
                      
                      const imgDataTransfer = new DataTransfer();
                      imgDataTransfer.items.add(file);
                      
                      chatInput.dispatchEvent(new ClipboardEvent('paste', {
                          clipboardData: imgDataTransfer,
                          bubbles: true,
                          cancelable: true
                      }));
                      
                      // Esperar a que WhatsApp abra el modal de imagen (enfoca el caption auto)
                      setTimeout(() => {
                          const captionInput = document.activeElement;
                          if (captionInput && captionInput.getAttribute('contenteditable') === 'true') {
                              const textDataTransfer = new DataTransfer();
                              textDataTransfer.setData('text/plain', text);
                              captionInput.dispatchEvent(new ClipboardEvent('paste', {
                                  clipboardData: textDataTransfer,
                                  bubbles: true,
                                  cancelable: true
                              }));
                          }
                      }, 500);
                      
                      const event = new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Insertando imagen y texto...' });
                      window.dispatchEvent(event);
                      return;
                  } catch (imgErr) {
                      console.error('[WA-CRM] Error convirtiendo imagen:', imgErr);
                  }
              }

              // Fallback o si solo hay texto
              const dataTransfer = new DataTransfer();
              dataTransfer.setData('text/plain', text);
              const pasteEvent = new ClipboardEvent('paste', {
                  clipboardData: dataTransfer,
                  bubbles: true,
                  cancelable: true
              });
              chatInput.dispatchEvent(pasteEvent);
              
              const event = new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Texto insertado' });
              window.dispatchEvent(event);
              return;
          }

          await navigator.clipboard.writeText(text);
          document.execCommand('paste');
          
          // Toast notification
          const event = new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Texto insertado (o presiona Ctrl+V)' });
          window.dispatchEvent(event);
      } catch (e) {
          const event = new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Texto copiado — presiona Ctrl+V' });
          window.dispatchEvent(event);
      }
  },

  resetBuffer() {
      this.buffer = '';
      this.isCapturing = false;
  }
};
