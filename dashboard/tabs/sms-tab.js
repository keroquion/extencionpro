// Lógica para el tab de SMS Masivo

const SERVER_URL = 'http://localhost:3000';

export function initSmsTab() {
    const sendBtn = document.getElementById('smsSendBtn');
    const numbersInput = document.getElementById('smsNumbers');
    const messageInput = document.getElementById('smsMessage');
    const delayInput = document.getElementById('smsDelay');
    const coordXInput = document.getElementById('smsCoordX');
    const coordYInput = document.getElementById('smsCoordY');
    const whitelistInputEl = document.getElementById('smsWhitelist');

    const loopNumber = document.getElementById('smsLoopNumber');
    const loopDelay = document.getElementById('smsLoopDelay');
    const startLoopBtn = document.getElementById('smsStartLoopBtn');
    const stopLoopBtn = document.getElementById('smsStopLoopBtn');
    
    const adbStatusBadge = document.getElementById('adbStatusBadge');
    
    const queueCount = document.getElementById('smsQueueCount');
    const historyCount = document.getElementById('smsHistoryCount');
    const logContainer = document.getElementById('smsLogContainer');

    if (!sendBtn) return; // Si no carga bien el DOM, abortar.

    function addLog(message) {
        const p = document.createElement('p');
        p.style.margin = "2px 0";
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    startLoopBtn.addEventListener('click', async () => {
        const number = loopNumber.value.trim();
        const delaySecs = parseInt(loopDelay.value) || 1;
        const message = messageInput.value.trim();
        const x = coordXInput.value;
        const y = coordYInput.value;

        if (!x || !y) {
            alert("Ingresa X e Y para el modo Test.");
            return;
        }

        if (!number || !message) {
            alert("Llena el número de testeo y el mensaje principal.");
            return;
        }

        try {
            await fetch(`${SERVER_URL}/api/test/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number, message, delaySecs, x, y })
            });

            startLoopBtn.style.display = 'none';
            stopLoopBtn.style.display = 'block';
            addLog(`🔄 Bucle iniciado para ${number} cada ${delaySecs}s.`);
        } catch (error) {
            alert("No se pudo conectar al ServidorSMS.exe. ¿Está abierto?");
        }
    });

    stopLoopBtn.addEventListener('click', async () => {
        try {
            await fetch(`${SERVER_URL}/api/test/stop`, { method: 'POST' });
            stopLoopBtn.style.display = 'none';
            startLoopBtn.style.display = 'block';
            addLog(`⏹ Bucle detenido.`);
        } catch (error) {
            alert("No se pudo conectar al ServidorSMS.exe.");
        }
    });

    sendBtn.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const rawNumbers = numbersInput.value;
        const delaySecs = parseInt(delayInput.value) || 10;
        const x = coordXInput.value;
        const y = coordYInput.value;
        const whitelist = whitelistInputEl ? whitelistInputEl.value : '';

        if (!x || !y) {
            alert("Por favor ingresa las coordenadas X e Y.");
            return;
        }

        if (!message) {
            alert("Por favor escribe un mensaje.");
            return;
        }

        const numbers = rawNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
        
        if (numbers.length === 0) {
            alert("Por favor ingresa al menos un número válido.");
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Procesando...';

        try {
            const res = await fetch(`${SERVER_URL}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numbers, message, delaySecs, x, y, whitelist })
            });
            const data = await res.json();
            
            if (data.success) {
                addLog(`Iniciando envío masivo a ${numbers.length} números con ${delaySecs}s de retraso.`);
                numbersInput.value = '';
            } else {
                alert(data.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error al enviar a la API:', error);
            alert("No se pudo conectar al ServidorSMS.exe. Verifica que esté abierto en tu computadora.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Iniciar Envío';
        }
    });

    async function checkStatus() {
        try {
            const res = await fetch(`${SERVER_URL}/api/status`);
            const data = await res.json();
            
            queueCount.textContent = data.queueLength;
            
            if (data.adbConnected) {
                adbStatusBadge.textContent = 'ADB Conectado 🟢';
                adbStatusBadge.style.background = '#dcfce7';
                adbStatusBadge.style.color = '#166534';
            } else {
                adbStatusBadge.textContent = 'ADB Desconectado 🔴';
                adbStatusBadge.style.background = '#fee2e2';
                adbStatusBadge.style.color = '#991b1b';
            }

            if (data.isSending) {
                sendBtn.disabled = true;
                sendBtn.textContent = `Enviando... (${data.queueLength} restantes)`;
            } else {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Iniciar Envío';
            }
        } catch (error) {
            // Silencioso si el servidor no está corriendo
            queueCount.textContent = "Off";
            if (!sendBtn.textContent.includes('Iniciar')) {
                sendBtn.textContent = 'Servidor Cerrado';
            }
            if (adbStatusBadge) {
                adbStatusBadge.textContent = 'Servidor EXE Apagado 🔴';
                adbStatusBadge.style.background = '#fee2e2';
                adbStatusBadge.style.color = '#991b1b';
            }
        }
    }

    async function loadHistory() {
        try {
            const res = await fetch(`${SERVER_URL}/api/history`);
            const historyObj = await res.json();
            const keys = Object.keys(historyObj);
            historyCount.textContent = keys.length;
        } catch (error) {
            historyCount.textContent = "Off";
        }
    }

    // Inicializar
    checkStatus();
    loadHistory();
    setInterval(() => {
        checkStatus();
        loadHistory();
    }, 2000);
}
