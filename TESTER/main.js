const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let mainWindow;
let tray = null;
let serverUrl = 'http://localhost:3000';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            nodeIntegration: true
        },
        icon: path.join(__dirname, 'public', 'icon.png'), // Si tienes un icono
        show: false, // Empezar oculto si prefieres
        autoHideMenuBar: true
    });

    mainWindow.loadURL(serverUrl);

    // Ocultar en lugar de cerrar cuando se le da a la X
    mainWindow.on('close', function (event) {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });
}

app.whenReady().then(async () => {
    // 1. Iniciar servidor express
    serverUrl = await startServer(3000);

    // 2. Crear icono en bandeja del sistema (System Tray)
    // Para simplificar, usamos un icono de sistema predeterminado si no hay uno propio
    // Nota: Deberás tener un archivo icon.png en tester/public/
    const iconPath = path.join(__dirname, 'public', 'icon.png');
    tray = new Tray(iconPath); 

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Abrir Panel', click: () => mainWindow.show() },
        { label: 'Salir', click: () => {
            app.isQuitting = true;
            app.quit();
        }}
    ]);
    tray.setToolTip('ADB SMS Sender');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });

    // 3. Crear ventana
    createWindow();
    mainWindow.show(); // Mostrar al iniciar

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    // En Windows se suele cerrar, pero aquí queremos que se minimice al tray
});
