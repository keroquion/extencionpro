/**
 * @description Crea y gestiona el Shadow DOM root
 */

export const ShadowUI = {
  /**
   * @description Inicializa el Shadow DOM y le inyecta los estilos
   * @param {string} cssContent Contenido del archivo CSS (overlay.css)
   * @returns {object} { shadow: ShadowRoot, container: HTMLElement }
   */
  init(cssContent) {
    // Evitar duplicados si hay hot-reload de la extensión
    this.destroy();

    const host = document.createElement('div');
    host.id = 'wa-crm-root';
    // Estilos del host para que cubra la pantalla pero deje pasar eventos
    host.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 2147483647; pointer-events: none;';
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'closed' });

    const styleEl = document.createElement('style');
    styleEl.textContent = cssContent;
    shadow.appendChild(styleEl);

    const container = document.createElement('div');
    container.id = 'wa-crm-container';
    shadow.appendChild(container);

    return { shadow, container };
  },

  /**
   * @description Elimina el Shadow DOM del body
   */
  destroy() {
    const existing = document.getElementById('wa-crm-root');
    if (existing) {
      existing.remove();
    }
  }
};
