const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const adbController = require('./adb-controller');
const historyManager = require('./history-manager');
const emailController = require('./email-controller');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let sendQueue = [];
let isSending = false;
let currentDelay = 10000; // 10 segundos por defecto

let emailQueue = [];
let isEmailSending = false;
let currentEmailDelay = 15000; // 15 segundos por defecto

async function processEmailQueue() {
    if (isEmailSending || emailQueue.length === 0) return;
    
    isEmailSending = true;
    const { to, subject, htmlBody, fromEmail } = emailQueue.shift();

    try {
        console.log(`[EMAIL ENVIANDO] a ${to}...`);
        await emailController.sendEmail(to, subject, htmlBody, fromEmail);
        console.log(`[ÉXITO] Email enviado a ${to}`);
    } catch (error) {
        console.error(`[ERROR] Fallo el email a ${to}:`, error);
    }

    setTimeout(() => {
        isEmailSending = false;
        processEmailQueue();
    }, currentEmailDelay);
}

async function processQueue() {
    if (isSending || sendQueue.length === 0) return;
    
    isSending = true;
    const { number, message, x, y, isWhitelist } = sendQueue.shift();

    if (!isWhitelist && historyManager.isDuplicate(number)) {
        console.log(`[SALTADO] El número ${number} ya existe en el historial.`);
        isSending = false;
        // Procesar el siguiente sin delay
        processQueue();
        return;
    }

    try {
        console.log(`[ENVIANDO] a ${number}...`);
        await adbController.sendSms(number, message, x, y);
        historyManager.addToHistory(number);
        console.log(`[ÉXITO] SMS enviado a ${number}`);
    } catch (error) {
        console.error(`[ERROR] Fallo el envío a ${number}:`, error);
    }

    setTimeout(() => {
        isSending = false;
        processQueue();
    }, currentDelay);
}

// Endpoint para añadir a la cola
app.post('/api/send', async (req, res) => {
    const { numbers, message, delaySecs, x, y, whitelist } = req.body;
    
    if (!numbers || !message) {
        return res.status(400).json({ error: 'Faltan números o mensaje' });
    }

    if (delaySecs) {
        currentDelay = delaySecs * 1000;
    }

    // Procesar lista blanca
    const whitelistArray = whitelist ? whitelist.split(',').map(n => n.trim()) : [];

    // Agregar a la cola
    numbers.forEach(num => {
        sendQueue.push({ 
            number: num, 
            message, 
            x, y,
            isWhitelist: whitelistArray.includes(num)
        });
    });

    // Iniciar el procesamiento si no estaba enviando
    processQueue();

    res.json({ success: true, queued: numbers.length });
});

app.post('/api/email/verify', async (req, res) => {
    try {
        emailController.initTransporter(req.body);
        await emailController.verifyConnection();
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/email/send', async (req, res) => {
    const { config, emails, subject, htmlBody, delaySecs } = req.body;
    
    if (!emails || !subject || !htmlBody) {
        return res.status(400).json({ error: 'Faltan datos de envío' });
    }

    try {
        emailController.initTransporter(config);
    } catch (err) {
        return res.status(400).json({ error: 'Configuración SMTP inválida' });
    }

    if (delaySecs) currentEmailDelay = delaySecs * 1000;

    emails.forEach(email => {
        emailQueue.push({ 
            to: email, 
            subject, 
            htmlBody, 
            fromEmail: config.user 
        });
    });

    processEmailQueue();
    res.json({ success: true, queued: emails.length });
});

// Endpoint para el estado actual (para polling desde la web)
app.get('/api/status', async (req, res) => {
    const isAdbConnected = await adbController.checkAdbDevices().catch(() => false);
    res.json({
        queueLength: sendQueue.length,
        isSending: isSending,
        adbConnected: isAdbConnected,
        historyCount: historyManager.getHistory().length,
        emailQueueLength: emailQueue.length,
        isEmailSending: isEmailSending
    });
});

// Endpoint para obtener el historial completo
app.get('/api/history', (req, res) => {
    res.json(historyManager.getHistory());
});

// Endpoint para agregar número manual a blacklist
app.post('/api/history', (req, res) => {
    const { number } = req.body;
    if (number) {
        historyManager.addToHistory(number.trim());
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Número requerido' });
    }
});

// Endpoint para eliminar del historial
app.delete('/api/history/:number', (req, res) => {
    const number = req.params.number;
    const removed = historyManager.removeFromHistory(number);
    res.json({ success: removed });
});

let loopActive = false;
let loopTimer = null;

app.post('/api/test/start', (req, res) => {
    const { number, message, delaySecs, x, y } = req.body;
    if (!number || !message || !x || !y) return res.status(400).json({ error: 'Faltan datos' });
    
    if (loopActive) clearInterval(loopTimer);
    loopActive = true;
    
    // Ejecutar inmediatamente el primero
    adbController.sendSms(number, message, x, y).catch(console.error);
    
    const interval = (delaySecs || 1) * 1000;
    loopTimer = setInterval(() => {
        if (loopActive) {
            console.log(`[LOOP] Enviando a ${number}`);
            adbController.sendSms(number, message, x, y).catch(console.error);
        }
    }, interval);
    
    res.json({ success: true });
});

app.post('/api/test/stop', (req, res) => {
    loopActive = false;
    if (loopTimer) clearInterval(loopTimer);
    res.json({ success: true });
});

function startServer(port = 3000) {
    return new Promise((resolve) => {
        app.listen(port, () => {
            console.log(`Servidor API corriendo en http://localhost:${port}`);
            console.log("No cierres esta ventana mientras uses la extensión.");
            resolve(`http://localhost:${port}`);
        });
    });
}

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
