document.addEventListener('DOMContentLoaded', () => {
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('message');
    const numbersInput = document.getElementById('numbers');
    const delayInput = document.getElementById('delay');
    
    const adbStatus = document.getElementById('adbStatus');
    const queueCount = document.getElementById('queueCount');
    const historyCount = document.getElementById('historyCount');
    const logContainer = document.getElementById('logContainer');
    
    const keySequenceInput = document.getElementById('keySequence');
    const historyBody = document.getElementById('historyBody');
    const addBlacklistBtn = document.getElementById('addBlacklistBtn');
    const blacklistInput = document.getElementById('blacklistInput');
    
    const coordsGroup = document.getElementById('coordsGroup');
    const coordX = document.getElementById('coordX');
    const coordY = document.getElementById('coordY');
    
    const loopNumber = document.getElementById('loopNumber');
    const loopDelay = document.getElementById('loopDelay');
    const startLoopBtn = document.getElementById('startLoopBtn');
    const stopLoopBtn = document.getElementById('stopLoopBtn');
    const whitelistInputEl = document.getElementById('whitelist');

    async function loadHistory() {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            historyBody.innerHTML = '';
            data.forEach(num => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
                tr.innerHTML = `
                    <td style="padding: 10px;">${num}</td>
                    <td style="padding: 10px;"><button class="btn" style="background: #ef4444; padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="deleteHistory('${num}')">Borrar</button></td>
                `;
                historyBody.appendChild(tr);
            });
        } catch(e) {}
    }

    window.deleteHistory = async function(number) {
        if(confirm(`¿Eliminar ${number} del historial?`)) {
            await fetch(`/api/history/${encodeURIComponent(number)}`, { method: 'DELETE' });
            loadHistory();
        }
    };

    addBlacklistBtn.addEventListener('click', async () => {
        const number = blacklistInput.value.trim();
        if(number) {
            await fetch('/api/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number })
            });
            blacklistInput.value = '';
            loadHistory();
        }
    });

    startLoopBtn.addEventListener('click', async () => {
        const number = loopNumber.value.trim();
        const delaySecs = parseInt(loopDelay.value) || 1;
        const message = messageInput.value.trim();
        const x = coordX.value;
        const y = coordY.value;

        if (!x || !y) {
            alert("Ingresa X e Y para el modo Test.");
            return;
        }

        if (!number || !message) {
            alert("Llena el número de testeo y el mensaje principal.");
            return;
        }

        await fetch('/api/test/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, message, delaySecs, x, y })
        });

        startLoopBtn.style.display = 'none';
        stopLoopBtn.style.display = 'block';
        addLog(`🔄 Bucle iniciado para ${number} cada ${delaySecs}s.`);
    });

    stopLoopBtn.addEventListener('click', async () => {
        await fetch('/api/test/stop', { method: 'POST' });
        stopLoopBtn.style.display = 'none';
        startLoopBtn.style.display = 'block';
        addLog(`⏹ Bucle detenido.`);
    });

    loadHistory();

    function addLog(message) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        const time = new Date().toLocaleTimeString();
        div.innerHTML = `<span class="log-time">[${time}]</span> ${message}`;
        logContainer.prepend(div);
    }

    sendBtn.addEventListener('click', async () => {
        const message = messageInput.value.trim();
        const rawNumbers = numbersInput.value;
        const delaySecs = parseInt(delayInput.value) || 10;
        const x = coordX.value;
        const y = coordY.value;
        const whitelist = whitelistInputEl ? whitelistInputEl.value : '';

        if (!x || !y) {
            alert("Por favor ingresa las coordenadas X e Y.");
            return;
        }

        if (!message) {
            alert("Por favor escribe un mensaje.");
            return;
        }

        // Extraer números (separados por coma, salto de línea, espacios)
        const numbers = rawNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length > 0);

        if (numbers.length === 0) {
            alert("Por favor ingresa al menos un número.");
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Procesando...';

        try {
            const res = await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ numbers, message, delaySecs, x, y, whitelist })
            });
            const data = await res.json();
            
            if (data.success) {
                addLog(`✅ ${data.queued} números encolados para enviar.`);
                numbersInput.value = ''; // Limpiar textarea
            } else {
                addLog(`❌ Error: ${data.error}`);
            }
        } catch (e) {
            addLog(`❌ Error de conexión: ${e.message}`);
        }

        sendBtn.disabled = false;
        sendBtn.textContent = 'Iniciar Envío';
    });

    // Polling de estado cada 2 segundos
    setInterval(async () => {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();

            queueCount.textContent = data.queueLength;
            historyCount.textContent = data.historyCount;

            // Recargar historial si hay cambios en el contador
            if (data.historyCount !== historyBody.children.length) {
                loadHistory();
            }

            if (data.adbConnected) {
                adbStatus.textContent = 'ADB Conectado';
                adbStatus.className = 'status-badge connected';
            } else {
                adbStatus.textContent = 'ADB Desconectado';
                adbStatus.className = 'status-badge disconnected';
            }

            if (data.isSending) {
                sendBtn.textContent = 'Enviando...';
                sendBtn.disabled = true;
            } else if (sendBtn.textContent === 'Enviando...') {
                sendBtn.textContent = 'Iniciar Envío';
                sendBtn.disabled = false;
            }
        } catch (e) {
            adbStatus.textContent = 'Servidor Caído';
            adbStatus.className = 'status-badge disconnected';
        }
    }, 2000);
});
