# Plan de Implementación: Enviador de SMS por ADB

Este documento describe la arquitectura y el plan paso a paso para construir una aplicación local que permite enviar mensajes de texto (SMS) a través de un teléfono Android conectado mediante ADB. La interfaz será una vista web moderna y modular.

## Explicación sobre Node.js y Portabilidad

> [!NOTE]
> **¿Por qué Node.js o un servidor?** 
> Los navegadores web (Chrome, Edge) tienen restricciones de seguridad que impiden que una página web normal (HTML/JS) ejecute comandos en la consola de tu computadora (como ejecutar `adb`). Por eso necesitamos un "intermediario" o "backend" (que puede ser Node.js, Java o un ejecutable) que reciba la orden de la web y la ejecute en la PC.

> [!TIP]
> **Solución para Portabilidad (Llevarlo a cualquier máquina)**
> Si no quieres instalar Node.js en cada máquina, podemos hacer lo siguiente: Desarrollamos el sistema con Node.js y HTML/CSS, y al finalizar **lo empaquetamos en un único archivo ejecutable (`.exe`) portátil**. 
> Así, cuando lo lleves a otra máquina, solo haces doble clic en el `.exe` y se abrirá tu aplicación (sin necesidad de instalar Node ni configurar servidores web). La única dependencia externa en las otras máquinas será tener **ADB** y conectar el celular.

## Open Questions

1. **Empaquetado Portable**: ¿Te parece bien si usamos Node.js para programarlo rápidamente y al final lo convertimos en un `.exe` portable para que funcione en cualquier PC sin instalaciones extra?
2. **Método de envío de SMS**: Para el envío, utilizaremos el comando nativo de Android (`am start` o `service call isms`).

## Proposed Architecture

La aplicación tendrá una estructura cliente-servidor muy simple dentro de la carpeta `tester`:

1. **Backend (Node.js)**: 
   - Expondrá una API REST o WebSockets para la comunicación en tiempo real.
   - Mantendrá una cola (Queue) de números a enviar y el intervalo de tiempo configurado.
   - Utilizará el módulo `child_process` para ejecutar comandos de ADB en el sistema operativo.
   - Usará un archivo local (ej. `history.json` o SQLite) para registrar el historial de números y evitar duplicados.
2. **Frontend (HTML/CSS/JS)**:
   - Interfaz web (UI) elegante y moderna, con estilos CSS actualizados (Glassmorphism, animaciones suaves).
   - Formulario para establecer el mensaje.
   - Área para ingresar una **lista larga de números** (un área de texto `textarea` que permita pegar cientos de números separados por salto de línea o comas).
   - Controles de tiempo (input numérico para ajustar los segundos de envío entre 1 y 10).
   - Panel de historial y estado en tiempo real para ver qué números fueron enviados y cuáles fueron saltados por estar duplicados.

## Requisitos de Instalación (Herramientas Externas)

Para que el proyecto funcione en tu computadora (Windows), necesitarás instalar lo siguiente:

1. **Node.js**: Entorno de ejecución para el servidor web.
   - [Descargar Node.js](https://nodejs.org/) (Instalar la versión LTS).
2. **Android SDK Platform-Tools (ADB)**: Herramienta de línea de comandos para comunicarte con el teléfono Android.
   - [Descargar ADB Platform-Tools](https://developer.android.com/tools/releases/platform-tools)
   - *Nota: Asegúrate de extraer la carpeta y agregarla a las variables de entorno de Windows (`PATH`) para que el comando `adb` pueda ser reconocido globalmente.*
3. **Dispositivo Android**:
   - Cable USB conectado a la PC.
   - Opciones de desarrollador activadas > **Depuración por USB activada**.

## Proposed Changes

La estructura del proyecto dentro de la carpeta `tester` será la siguiente:

### Backend (Servidor)

#### [NEW] tester/server.js
Servidor principal de Express. Se encargará de levantar la interfaz web estática, recibir peticiones de envío, procesar los números (separarlos y limpiar espacios) y gestionar la cola de envío en base al delay configurado.

#### [NEW] tester/adb-controller.js
Módulo que envolverá la lógica de ejecución del comando `adb`.
Por ejemplo, enviará el comando: `adb shell am start -a android.intent.action.SENDTO -d sms:<NUM> --es sms_body "<MENSAJE>" --ez exit_on_sent true` seguido de la simulación de teclas para presionar el botón enviar.

#### [NEW] tester/history-manager.js
Módulo para leer y escribir el registro de números en un archivo JSON. Cuando el usuario pegue una lista de 500 números, este archivo los filtrará descartando los que ya existan en `history.json`.

### Frontend (Vista Web)

#### [NEW] tester/public/index.html
Estructura semántica del panel de control con contenedores para el mensaje, la lista de números, configuraciones de delay y visualizador del registro.

#### [NEW] tester/public/styles.css
Diseño premium utilizando variables CSS, diseño oscuro por defecto (Dark Mode), tipografía limpia y diseño responsivo utilizando Flexbox/Grid.

#### [NEW] tester/public/app.js
Lógica de la vista, peticiones `fetch` o de WebSockets hacia el servidor para enviar la configuración, y actualización de la barra de progreso o tabla de historial en pantalla.

## Verification Plan

### Manual Verification
1. Instalar las dependencias con `npm install`.
2. Iniciar el servidor local (`node server.js`).
3. Abrir la URL `http://localhost:3000` en el navegador.
4. Conectar un teléfono y escribir en consola `adb devices` para comprobar que sea reconocido.
5. Colocar un número de prueba y configurar el delay en 10s.
6. Enviar y comprobar si el teléfono reacciona enviando el SMS.
7. Insertar el mismo número en el panel y observar cómo la interfaz y el servidor lo bloquean y marcan como "Duplicado" (Spam evitado).
