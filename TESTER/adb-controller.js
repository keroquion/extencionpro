const { exec } = require('child_process');

/**
 * Ejecuta un comando ADB.
 * Asume que `adb` está en el PATH del sistema o en la misma carpeta.
 */
function sendSms(number, message, x, y) {
    return new Promise((resolve, reject) => {
        // Comando moderno para enviar SMS usando el intent nativo de Android
        // am start -a android.intent.action.SENDTO -d sms:NUMERO --es sms_body "MENSAJE" --ez exit_on_sent true
        
        // Escapamos comillas simples en el mensaje para la consola
        const safeMessage = message.replace(/'/g, "\\'");
        const command = `adb shell "am start -a android.intent.action.SENDTO -d sms:${number} --es sms_body '${safeMessage}' --ez exit_on_sent true"`;
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ADB: ${error.message}`);
                return reject(error);
            }
            
            // Simular presionar el botón de Enter/Enviar
            const keyCommand = `adb shell input tap ${x} ${y}`;

            setTimeout(() => {
                exec(keyCommand, (err2) => {
                    if (err2) console.error("Error al presionar enviar:", err2);
                    resolve(stdout);
                });
            }, 1000); // 1 segundo de delay para que la UI del teléfono reaccione
        });
    });
}

function checkAdbDevices() {
    return new Promise((resolve, reject) => {
        exec('adb devices', (error, stdout) => {
            if (error) return reject(error);
            const lines = stdout.split('\n').filter(line => line.trim() !== '' && !line.includes('List of devices attached'));
            const isConnected = lines.length > 0 && lines[0].includes('device');
            resolve(isConnected);
        });
    });
}

module.exports = {
    sendSms,
    checkAdbDevices
};
