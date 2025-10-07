/**
 * Preload Script
 * Se ejecuta antes de cargar la pagina web
 * Permite comunicacion segura entre el proceso principal y el renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

// Exponer API segura al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Recibir eventos del menu
  onMenuNewAsset: (callback) => {
    ipcRenderer.on('menu-new-asset', callback);
  },
  
  onMenuScanQR: (callback) => {
    ipcRenderer.on('menu-scan-qr', callback);
  },
  
  onMenuSettings: (callback) => {
    ipcRenderer.on('menu-settings', callback);
  },
  
  onDeepLink: (callback) => {
    ipcRenderer.on('deep-link', (event, url) => callback(url));
  },
  
  // Informacion del sistema
  platform: process.platform,
  version: process.versions.electron,
  
  // Remover listeners cuando el componente se desmonte
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

console.log('Preload script cargado correctamente');
