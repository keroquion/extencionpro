export const SnippetEngine = {
  state: null,
  buffer: '',
  lastKeyTime: 0,
  isCapturing: false,
  TIMEOUT: 3000,
  
  init(state) {
      this.state = state;
      document.addEventListener('keydown', this.handleKeydown.bind(this));
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
              this.expandSnippet(snippet.text);
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

  async expandSnippet(text) {
      try {
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
