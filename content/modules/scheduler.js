import { CONSTANTS } from '../../shared/constants.js';
import { StorageAPI } from '../../shared/storage-api.js';

export const Scheduler = {
  container: null,
  currentContact: null,

  init() {
    window.addEventListener('WA_CRM_CONTACT_CHANGED', async (e) => {
        this.currentContact = e.detail.contact;
        await this.render();
    });
    chrome.storage.onChanged.addListener((changes) => {
        if (changes['crm_citas']) this.render();
    });
  },

  async render(parentElement) {
    if (parentElement) this.container = parentElement;
    if (!this.container) return;
    
    this.container.innerHTML = '';

    if (!this.currentContact) {
        this.container.innerHTML = '<p style="font-size:12px; color:#666;">Abre un chat para agendar.</p>';
        return;
    }

    const citas = await StorageAPI.getCrmRecords('citas');
    const record = citas.find(r => r.telefono === this.currentContact.phone);

    if (!record) {
        this.renderSchedulingUI();
    } else {
        const p = document.createElement('p');
        p.style.fontSize = '13px';
        p.style.margin = '0 0 10px 0';
        p.innerHTML = `Estado actual: <strong>${record.estado.toUpperCase()}</strong>`;
        this.container.appendChild(p);

        const details = document.createElement('div');
        details.style.padding = '8px';
        details.style.backgroundColor = '#f9f9f9';
        details.style.borderLeft = '3px solid #FFC107';
        details.style.marginBottom = '10px';
        details.innerHTML = `
            <strong>Cita Programada:</strong><br/>
            Fecha/Hora: ${new Date(record.fechaHora).toLocaleString()}<br/>
            <em>No se puede modificar</em>
        `;
        this.container.appendChild(details);

        const btnFinalizar = document.createElement('button');
        btnFinalizar.textContent = '✅ Contactado (Finalizar)';
        btnFinalizar.className = 'primary-btn';
        btnFinalizar.style.backgroundColor = '#4CAF50';
        btnFinalizar.style.width = '100%';
        btnFinalizar.addEventListener('click', async () => {
            await StorageAPI.finalizeCrmRecord('citas', record.id);
            window.dispatchEvent(new CustomEvent('WA_CRM_SHOW_TOAST', { detail: 'Cita Finalizada' }));
        });
        
        this.container.appendChild(btnFinalizar);
    }
  },

  renderSchedulingUI() {
    // Utilidades
    const createButton = (text, onClick, className = 'secondary-btn') => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.className = className;
      btn.addEventListener('click', onClick);
      return btn;
    };
    
    const createInput = (type) => {
        const input = document.createElement('input');
        input.type = type;
        return input;
    };

    // Fila Hoy
    const rowToday = document.createElement('div');
    rowToday.className = 'scheduler-row';
    const lblHoy = document.createElement('label'); lblHoy.textContent = 'HOY:';
    
    const inputTimeToday = createInput('time');
    
    const setTimeToday = (hoursToAdd) => {
        const d = new Date();
        d.setHours(d.getHours() + hoursToAdd);
        inputTimeToday.value = d.toTimeString().slice(0,5);
    };

    const btnPlus1h = createButton('+1h', () => setTimeToday(1));
    const btnPlus3h = createButton('+3h', () => setTimeToday(3));
    const btnGoToday = createButton('Ir', () => Scheduler.saveAppointment('today', inputTimeToday.value), 'primary-btn');
    
    rowToday.append(lblHoy, btnPlus1h, btnPlus3h, inputTimeToday, btnGoToday);

    // Fila Mañana
    const rowTomorrow = document.createElement('div');
    rowTomorrow.className = 'scheduler-row';
    const lblManana = document.createElement('label'); lblManana.textContent = 'MAÑANA:';
    
    const inputTimeTomorrow = createInput('time');
    
    const setTimeTomorrow = (hoursToAdd) => {
         const d = new Date();
         d.setDate(d.getDate() + 1);
         d.setHours(d.getHours() + hoursToAdd);
         inputTimeTomorrow.value = d.toTimeString().slice(0,5);
    };

    const btnMinus1h = createButton('-1h', () => setTimeTomorrow(-1));
    const btnPlus1hT = createButton('+1h', () => setTimeTomorrow(1));
    const btnGoTomorrow = createButton('Ir', () => Scheduler.saveAppointment('tomorrow', inputTimeTomorrow.value), 'primary-btn');
    
    rowTomorrow.append(lblManana, btnMinus1h, inputTimeTomorrow, btnPlus1hT, btnGoTomorrow);

    // Fila Calendario (oculta por defecto)
    const calendarRow = document.createElement('div');
    calendarRow.className = 'scheduler-row';
    calendarRow.style.display = 'none';
    
    const inputDate = createInput('date');
    const inputTimeCal = createInput('time');
    const btnGoCal = createButton('Ir', () => Scheduler.saveAppointment('specific', inputTimeCal.value, inputDate.value), 'primary-btn');
    calendarRow.append(inputDate, inputTimeCal, btnGoCal);

    const btnCalendar = createButton('📅 Calendario Específico', () => {
        calendarRow.style.display = calendarRow.style.display === 'none' ? 'flex' : 'none';
    });
    btnCalendar.style.width = '100%';
    btnCalendar.style.marginTop = '8px';

    this.container.append(rowToday, rowTomorrow, btnCalendar, calendarRow);
  },

  saveAppointment(mode, timeValue, dateValue = null) {
      const event = new CustomEvent('WA_CRM_SAVE_APPOINTMENT', {
          detail: { mode, timeValue, dateValue }
      });
      window.dispatchEvent(event);
  }
};

Scheduler.init();
