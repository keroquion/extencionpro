import { CONSTANTS } from '../../shared/constants.js';

export const Scheduler = {
  render(parentElement) {
    parentElement.innerHTML = '';

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

    parentElement.append(rowToday, rowTomorrow, btnCalendar, calendarRow);
  },

  saveAppointment(mode, timeValue, dateValue = null) {
      // STATE is needed here, we'll pass it from the orchestrator
      const event = new CustomEvent('WA_CRM_SAVE_APPOINTMENT', {
          detail: { mode, timeValue, dateValue }
      });
      window.dispatchEvent(event);
  }
};
