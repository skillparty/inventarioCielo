const { app, BrowserWindow, Menu, dialog, shell } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const fs = require('fs');

// =====================================================
// VARIABLES GLOBALES
// =====================================================

let mainWindow;
let backendProcess = null;
const BACKEND_PORT = process.env.BACKEND_PORT || 5000;
const FRONTEND_PORT = 3000;

// =====================================================
// CONFIGURACION DE VENTANA PRINCIPAL
// =====================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Sistema de Gestion de Inventario',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: getAppIcon(),
    show: false, // No mostrar hasta que este listo
  });

  // Mostrar ventana cuando este lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    console.log('Ventana principal lista');
  });

  // En desarrollo, carga desde el servidor de desarrollo de React
  // En produccion, carga el build
  const startUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, 'build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Abre DevTools en modo desarrollo
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Manejar enlaces externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Crear menu de aplicacion
  createApplicationMenu();
}

// =====================================================
// MENU DE APLICACION
// =====================================================

function createApplicationMenu() {
  const template = [
    // Menu Archivo
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Nuevo Activo',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-new-asset');
            }
          }
        },
        {
          label: 'Exportar Inventario',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            exportInventory();
          }
        },
        { type: 'separator' },
        {
          label: 'Configuracion',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-settings');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    // Menu Ver
    {
      label: 'Ver',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            if (mainWindow) {
              mainWindow.reload();
            }
          }
        },
        {
          label: 'Forzar Recarga',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.reloadIgnoringCache();
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Pantalla Completa',
          accelerator: process.platform === 'darwin' ? 'Ctrl+Command+F' : 'F11',
          click: () => {
            if (mainWindow) {
              mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom + 0.5);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const currentZoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(currentZoom - 0.5);
            }
          }
        },
        {
          label: 'Zoom Reset',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.setZoomLevel(0);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'DevTools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.toggleDevTools();
            }
          }
        }
      ]
    },
    // Menu Herramientas
    {
      label: 'Herramientas',
      submenu: [
        {
          label: 'Escanear QR',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            if (mainWindow) {
              mainWindow.webContents.send('menu-scan-qr');
            }
          }
        },
        {
          label: 'Generar Reporte',
          accelerator: 'CmdOrCtrl+G',
          click: () => {
            generateReport();
          }
        },
        { type: 'separator' },
        {
          label: 'Verificar Base de Datos',
          click: () => {
            checkDatabase();
          }
        },
        {
          label: 'Reiniciar Servidor',
          click: () => {
            restartBackend();
          }
        }
      ]
    },
    // Menu Ayuda
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Documentacion',
          click: () => {
            shell.openExternal('https://github.com/skillparty/inventarioCielo');
          }
        },
        {
          label: 'Reportar Problema',
          click: () => {
            shell.openExternal('https://github.com/skillparty/inventarioCielo/issues');
          }
        },
        { type: 'separator' },
        {
          label: 'Acerca de',
          click: () => {
            showAboutDialog();
          }
        }
      ]
    }
  ];

  // En Mac, agregar menu de la app
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.name,
      submenu: [
        { role: 'about', label: 'Acerca de Inventario Cielo' },
        { type: 'separator' },
        { role: 'services', label: 'Servicios' },
        { type: 'separator' },
        { role: 'hide', label: 'Ocultar Inventario Cielo' },
        { role: 'hideOthers', label: 'Ocultar Otros' },
        { role: 'unhide', label: 'Mostrar Todo' },
        { type: 'separator' },
        { role: 'quit', label: 'Salir de Inventario Cielo' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// =====================================================
// FUNCIONES DE MENU
// =====================================================

function exportInventory() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Exportar Inventario',
    message: 'Funcionalidad de exportacion en desarrollo',
    detail: 'Proximamente podras exportar el inventario a Excel, PDF o CSV.'
  });
}

function generateReport() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Generar Reporte',
    message: 'Generador de reportes en desarrollo',
    detail: 'Proximamente podras generar reportes personalizados.'
  });
}

function checkDatabase() {
  const url = `http://localhost:${BACKEND_PORT}/api/db-test`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Estado de Base de Datos',
        message: data.success ? 'Conexion exitosa' : 'Error de conexion',
        detail: data.success 
          ? `PostgreSQL conectado correctamente\n\nVersion: ${data.database?.version || 'N/A'}`
          : 'No se pudo conectar a la base de datos'
      });
    })
    .catch(err => {
      dialog.showMessageBox(mainWindow, {
        type: 'error',
        title: 'Error de Conexion',
        message: 'No se pudo conectar al servidor',
        detail: 'Verifica que el servidor Express este corriendo.'
      });
    });
}

function restartBackend() {
  stopBackend();
  setTimeout(() => {
    startBackend();
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Servidor Reiniciado',
      message: 'El servidor backend se ha reiniciado correctamente'
    });
  }, 1000);
}

function showAboutDialog() {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Acerca de Inventario Cielo',
    message: 'Sistema de Gestion de Inventario',
    detail: `Version: 1.0.0
    
Desarrollado con:
- Electron
- React
- Node.js
- PostgreSQL

(c) 2025 Inventario Cielo
https://github.com/skillparty/inventarioCielo`,
    buttons: ['OK']
  });
}

// =====================================================
// GESTION DEL SERVIDOR BACKEND
// =====================================================

function startBackend() {
  if (backendProcess) {
    console.log('Backend ya esta corriendo');
    return;
  }

  console.log('Iniciando servidor backend...');

  const serverPath = isDev
    ? path.join(__dirname, 'src/backend/server.js')
    : path.join(process.resourcesPath, 'app/src/backend/server.js');

  // Verificar que el archivo existe
  if (!fs.existsSync(serverPath)) {
    console.error('No se encontro el archivo del servidor:', serverPath);
    dialog.showErrorBox(
      'Error al Iniciar Servidor',
      `No se encontro el servidor en: ${serverPath}`
    );
    return;
  }

  backendProcess = spawn('node', [serverPath], {
    env: {
      ...process.env,
      BACKEND_PORT: BACKEND_PORT,
      NODE_ENV: isDev ? 'development' : 'production'
    },
    stdio: 'inherit' // Mostrar logs en consola
  });

  backendProcess.on('error', (err) => {
    console.error('Error al iniciar backend:', err);
    dialog.showErrorBox(
      'Error del Servidor',
      `No se pudo iniciar el servidor backend:\n${err.message}`
    );
  });

  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend finalizado - Codigo: ${code}, Señal: ${signal}`);
    backendProcess = null;
  });

  console.log('Servidor backend iniciado');
}

function stopBackend() {
  if (backendProcess) {
    console.log('Deteniendo servidor backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// =====================================================
// OBTENER ICONO DE LA APP
// =====================================================

function getAppIcon() {
  const iconName = process.platform === 'win32' ? 'icon.ico' : 
                   process.platform === 'darwin' ? 'icon.icns' : 
                   'icon.png';
  
  const iconPath = path.join(__dirname, 'build', iconName);
  
  if (fs.existsSync(iconPath)) {
    return iconPath;
  }
  
  // Fallback a icono por defecto
  return path.join(__dirname, 'public', 'icon.png');
}

// =====================================================
// EVENTOS DE LA APLICACION
// =====================================================

app.on('ready', () => {
  console.log('Aplicacion iniciada');
  
  // Iniciar servidor backend
  startBackend();
  
  // Esperar un poco para que el servidor inicie
  setTimeout(() => {
    createWindow();
  }, 2000);
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  console.log('Cerrando aplicacion...');
  stopBackend();
});

// =====================================================
// MANEJO DE ERRORES NO CAPTURADOS
// =====================================================

process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error);
  dialog.showErrorBox(
    'Error Inesperado',
    `Se produjo un error inesperado:\n${error.message}`
  );
});

// =====================================================
// DEEP LINKING (OPCIONAL)
// =====================================================

// Protocolo personalizado: inventario://
if (!isDev) {
  app.setAsDefaultProtocolClient('inventario');
}

app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('Deep link recibido:', url);
  
  // Ejemplo: inventario://asset/AST-2025-0001
  if (mainWindow) {
    mainWindow.webContents.send('deep-link', url);
  }
});

// =====================================================
// AUTO UPDATER (PREPARADO PARA FUTURAS VERSIONES)
// =====================================================

// Descomentar cuando se configure el servidor de actualizaciones
/*
const { autoUpdater } = require('electron-updater');

autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Actualizacion Disponible',
    message: 'Hay una nueva version disponible. Se descargara en segundo plano.'
  });
});

autoUpdater.on('update-downloaded', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Actualizacion Lista',
    message: 'La actualizacion se instalara al reiniciar la aplicacion.',
    buttons: ['Reiniciar Ahora', 'Mas Tarde']
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

app.on('ready', () => {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});
*/

console.log('Electron configurado correctamente');
