export const Invoice = {
  render(parentElement) {
    parentElement.innerHTML = '';
    
    const btn = document.createElement('button');
    btn.textContent = '📋 Insertar mensaje y registrar';
    btn.className = 'primary-btn';
    btn.style.width = '100%';
    
    btn.addEventListener('click', (e) => {
        const event = new CustomEvent('WA_CRM_ACTION_INVOICE', { detail: { target: e.currentTarget } });
        window.dispatchEvent(event);
    });

    parentElement.appendChild(btn);
  }
};
