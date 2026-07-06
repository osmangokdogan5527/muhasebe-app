const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('update_available', subscription);
    return () => ipcRenderer.removeListener('update_available', subscription);
  },
  onUpdateDownloaded: (callback) => {
    const subscription = () => callback();
    ipcRenderer.on('update_downloaded', subscription);
    return () => ipcRenderer.removeListener('update_downloaded', subscription);
  },
  onUpdateError: (callback) => {
    const subscription = (event, error) => callback(error);
    ipcRenderer.on('update-error', subscription);
    return () => ipcRenderer.removeListener('update-error', subscription);
  },
  restartApp: () => ipcRenderer.send('restart_app'),
  checkForUpdates: () => ipcRenderer.send('check_for_updates'), // Legacy
  checkForUpdatesManual: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.send('download-update'),
  onDownloadProgress: (callback) => {
    const subscription = (event, percent) => callback(percent);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  reportError: (errorInfo) => ipcRenderer.send('report-error', errorInfo),
  openExternal: (url) => ipcRenderer.send('open-external', url),
  setAutoBackup: (enabled) => ipcRenderer.send('set-auto-backup', enabled),
  createManualBackup: () => ipcRenderer.invoke('create-manual-backup'),
  restoreFromBackup: () => ipcRenderer.invoke('restore-from-backup'),
  openAutoBackupFolder: () => ipcRenderer.invoke('open-auto-backup-folder')
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('Preload script loaded successfully.');
});
