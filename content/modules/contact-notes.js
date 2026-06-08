import { StorageAPI } from '../../shared/storage-api.js';

export const ContactNotes = {
  container: null,
  textarea: null,
  currentPhone: null,

  render(parentElement) {
    ContactNotes.container = parentElement;
    parentElement.innerHTML = '';

    ContactNotes.textarea = document.createElement('textarea');
    ContactNotes.textarea.placeholder = 'Notas sobre este contacto...';
    ContactNotes.textarea.rows = 4;
    
    // Guardar al perder el foco
    ContactNotes.textarea.addEventListener('blur', ContactNotes.save);

    parentElement.appendChild(ContactNotes.textarea);
  },

  async load(phone) {
    if (!phone) return;
    ContactNotes.currentPhone = phone;
    if (ContactNotes.textarea) {
      ContactNotes.textarea.value = 'Cargando...';
      ContactNotes.textarea.disabled = true;
      try {
        const text = await StorageAPI.getContactNotes(phone);
        ContactNotes.textarea.value = text;
      } catch (e) {
        console.error('Error loading notes:', e);
        ContactNotes.textarea.value = '';
      } finally {
         ContactNotes.textarea.disabled = false;
      }
    }
  },

  async save() {
    if (!ContactNotes.currentPhone || !ContactNotes.textarea) return;
    const text = ContactNotes.textarea.value;
    try {
      // Usar sendMessage para que el background lo guarde
      chrome.runtime.sendMessage({
          action: 'SAVE_CONTACT_NOTES',
          phone: ContactNotes.currentPhone,
          text: text
      });
    } catch (e) {
      console.error('Error saving notes:', e);
    }
  }
};
