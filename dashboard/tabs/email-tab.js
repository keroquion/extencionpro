// Lógica para el tab de Email Masivo

const SERVER_URL = 'http://localhost:3000';

const DEFAULT_HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Promoción Especial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <!-- Contenedor Principal -->
                <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Cabecera / Banner -->
                    <tr>
                        <td style="background-color: #3b82f6; padding: 40px 20px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">¡Gran Oferta Exclusiva!</h1>
                            <p style="color: #bfdbfe; margin-top: 10px; font-size: 16px;">Solo por tiempo limitado para nuestros mejores clientes.</p>
                        </td>
                    </tr>
                    
                    <!-- Cuerpo del Mensaje -->
                    <tr>
                        <td style="padding: 40px 30px; color: #333333; line-height: 1.6;">
                            <h2 style="color: #1e293b; font-size: 22px; margin-top: 0;">Hola,</h2>
                            <p style="font-size: 16px;">Te escribimos para contarte que hemos lanzado nuestra nueva línea de productos con un descuento que no podrás dejar pasar.</p>
                            
                            <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0;">
                                <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">🔥 50% de Descuento en tu próxima compra</p>
                            </div>
                            
                            <p style="font-size: 16px;">Haz clic en el botón de abajo para comunicarte con nosotros y hacer válido tu descuento de inmediato.</p>
                            
                            <!-- Botón de Llamada a la Acción -->
                            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 30px;">
                                <tr>
                                    <td align="center">
                                        <a href="https://wa.me/51999999999" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-size: 18px; font-weight: bold; display: inline-block;">Reclamar Descuento por WhatsApp</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Pie de página -->
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0;">Has recibido este correo porque estás suscrito a nuestro boletín.</p>
                            <p style="margin: 5px 0 0 0;">© 2026 Tu Empresa. Todos los derechos reservados.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;

export function initEmailTab() {
    const providerSelect = document.getElementById('emailProvider');
    const customFields = document.getElementById('customSmtpFields');
    
    const emailUser = document.getElementById('emailUser');
    const emailPass = document.getElementById('emailPass');
    const emailHost = document.getElementById('emailHost');
    const emailPort = document.getElementById('emailPort');
    
    const verifyBtn = document.getElementById('emailVerifyBtn');
    
    const emailList = document.getElementById('emailList');
    const emailSubject = document.getElementById('emailSubject');
    const emailBody = document.getElementById('emailBody');
    const emailDelay = document.getElementById('emailDelay');
    
    const sendBtn = document.getElementById('emailSendBtn');
    const logContainer = document.getElementById('emailLogContainer');
    const queueCount = document.getElementById('emailQueueCount');
    
    if (!sendBtn) return;
    
    // Set default beautiful template
    if (!emailBody.value) {
        emailBody.value = DEFAULT_HTML_TEMPLATE;
    }

    providerSelect.addEventListener('change', () => {
        if (providerSelect.value === 'custom') {
            customFields.style.display = 'flex';
        } else {
            customFields.style.display = 'none';
        }
    });

    function addLog(message) {
        const p = document.createElement('p');
        p.style.margin = "2px 0";
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(p);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    function getConfig() {
        return {
            provider: providerSelect.value,
            user: emailUser.value.trim(),
            pass: emailPass.value.trim(),
            host: emailHost.value.trim(),
            port: emailPort.value
        };
    }

    verifyBtn.addEventListener('click', async () => {
        const config = getConfig();
        if (!config.user || !config.pass) {
            alert("Llena tu correo y contraseña.");
            return;
        }
        
        verifyBtn.disabled = true;
        verifyBtn.textContent = "Verificando...";
        
        try {
            const res = await fetch(`${SERVER_URL}/api/email/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
            const data = await res.json();
            
            if (data.success) {
                alert("¡Conexión Exitosa! Tus credenciales son válidas.");
                addLog("Conexión SMTP verificada correctamente.");
            } else {
                alert(`Error: ${data.error}`);
                addLog(`Error de conexión: ${data.error}`);
            }
        } catch (err) {
            alert("No se pudo conectar al Servidor. ¿Está el EXE ejecutándose?");
        } finally {
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Probar Conexión";
        }
    });

    sendBtn.addEventListener('click', async () => {
        const config = getConfig();
        if (!config.user || !config.pass) {
            alert("Primero configura tu cuenta remitente.");
            return;
        }

        const rawEmails = emailList.value;
        const subject = emailSubject.value.trim();
        const htmlBody = emailBody.value.trim();
        const delaySecs = parseInt(emailDelay.value) || 15;

        if (!subject || !htmlBody) {
            alert("Llena el asunto y el mensaje.");
            return;
        }

        const emails = rawEmails.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
        
        if (emails.length === 0) {
            alert("Por favor ingresa al menos un correo de destino.");
            return;
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Enviando a la cola...';

        try {
            const res = await fetch(`${SERVER_URL}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config, emails, subject, htmlBody, delaySecs })
            });
            const data = await res.json();
            
            if (data.success) {
                addLog(`Campaña iniciada: ${emails.length} correos en cola (${delaySecs}s de retraso).`);
                emailList.value = '';
            } else {
                alert(data.error || 'Error desconocido');
            }
        } catch (error) {
            alert("No se pudo conectar al Servidor EXE.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Iniciar Campaña de Correos';
        }
    });

    async function checkStatus() {
        try {
            const res = await fetch(`${SERVER_URL}/api/status`);
            const data = await res.json();
            
            queueCount.textContent = data.emailQueueLength || 0;
            
            if (data.isEmailSending) {
                sendBtn.disabled = true;
                sendBtn.textContent = `Enviando Campaña... (${data.emailQueueLength} restantes)`;
            } else {
                sendBtn.disabled = false;
                sendBtn.textContent = 'Iniciar Campaña de Correos';
            }
        } catch (error) {
            queueCount.textContent = "Off";
        }
    }

    setInterval(() => {
        checkStatus();
    }, 2000);
}
