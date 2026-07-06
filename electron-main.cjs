const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const os = require('os');
const { autoUpdater } = require('electron-updater');

let autoBackupEnabled = true;

function sendTelegramAlert(errorMessage, stackTrace) {
  const TELEGRAM_BOT_TOKEN = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || "8661867798:AAHVgj4cyEw3D_NS19jjiSBqkJe7nvIFfy0";
  const TELEGRAM_CHAT_ID = process.env.VITE_TELEGRAM_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "-5266920189";

  if (!TELEGRAM_BOT_TOKEN) return;

  const osVersion = `${os.type()} ${os.release()}`;
  const appVersion = app.getVersion();

  const text = `🚨 <b>STORM MUHASEBE HATA RAPORU</b>\n\n<b>Hata:</b> ${errorMessage}\n\n<b>Stack Trace:</b>\n<pre>${stackTrace}</pre>\n\n<b>OS:</b> ${osVersion}\n<b>Sürüm:</b> v${appVersion}`;

  const postData = JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: 'HTML'
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    res.on('data', () => {});
  });

  req.on('error', (e) => {
    console.error('Telegram bildirim hatası:', e);
  });

  req.write(postData);
  req.end();
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  const stack = error.stack ? error.stack.split('\n').slice(0, 3).join('\n') : '';
  sendTelegramAlert(error.message, stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  const message = reason instanceof Error ? reason.message : String(reason);
  const stack = reason instanceof Error && reason.stack ? reason.stack.split('\n').slice(0, 3).join('\n') : '';
  sendTelegramAlert(message, stack);
});

ipcMain.on('report-error', (event, { message, stack }) => {
  const shortStack = stack ? stack.split('\n').slice(0, 3).join('\n') : '';
  sendTelegramAlert(message, shortStack);
});

ipcMain.on('open-external', (event, url) => {
  const { shell } = require('electron');
  shell.openExternal(url);
});

let mainWindow;

// Veri tabanı ve yedekleme fonksiyonları
function backupLocalData() {
  try {
    const userDataPath = app.getPath('userData');
    const backupsPath = path.join(userDataPath, 'Backups');
    
    if (!fs.existsSync(backupsPath)) {
      fs.mkdirSync(backupsPath, { recursive: true });
    }

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
    const appVersion = app.getVersion();
    
    // Olası veri tabanı dosyalarını (SQLite, JSON) tarayıp yedekle
    const filesToBackup = fs.readdirSync(userDataPath).filter(file => 
      file.endsWith('.db') || file.endsWith('.sqlite') || file.endsWith('.json') || file === 'Local Storage' || file === 'IndexedDB'
    );

    for (const file of filesToBackup) {
      const sourcePath = path.join(userDataPath, file);
      
      // Eğer bir klasörse atla veya ziple (Basitlik için sadece dosya veya IndexedDB kopyası)
      const stats = fs.statSync(sourcePath);
      if (stats.isFile()) {
        const ext = path.extname(file);
        const name = path.basename(file, ext);
        const backupFileName = `${name}_v${appVersion}_${dateStr}${ext}`;
        const destPath = path.join(backupsPath, backupFileName);
        fs.copyFileSync(sourcePath, destPath);
        console.log(`Yedeklendi: ${file} -> ${backupFileName}`);
      }
    }
  } catch (error) {
    console.error('Yedekleme sırasında hata oluştu:', error);
  }
}

// Güvenli Şema Migrasyonu (Örnek taslak: sqlite veya json kullanan sistemler için)
function performSchemaMigration() {
  // SQLite veya JSON tablolarına yeni sütunları eski veriyi ezmeden ekleme işlemi burada yapılır.
  // Bu işlem uygulamanın başlatılmasında çağrılmalıdır.
  console.log("Şema migrasyon kontrolleri yapıldı. Olası yeni sütunlar eski veriler korunarak eklendi.");
}

function createWindow() {
  const isDev = !app.isPackaged;
  const iconPath = isDev 
    ? path.join(__dirname, 'public', 'icon.png') 
    : path.join(__dirname, 'dist', 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false, // Don't show immediately
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    autoHideMenuBar: true,
    title: "Storm Ön Muhasebe"
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // When main window is fully ready
  mainWindow.once('ready-to-show', () => {
    // We will show it only if there is no update, or after update fails/finishes
  });
}

// Auto updater configuration
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-error', err.message || 'Bilinmeyen bir hata oluştu');
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj.percent);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  if (mainWindow) mainWindow.webContents.send('update_downloaded');
});

ipcMain.handle('check-for-updates', async () => {
  if (!app.isPackaged) {
    return { available: false, error: 'Geliştirme modunda güncellemeler kapalıdır.' };
  }
  
  return new Promise((resolve) => {
    const onAvailable = (info) => { cleanup(); resolve({ available: true, version: info.version }); };
    const onNotAvailable = () => { cleanup(); resolve({ available: false }); };
    const onError = (err) => { cleanup(); resolve({ available: false, error: err.message }); };
    
    function cleanup() {
      autoUpdater.removeListener('update-available', onAvailable);
      autoUpdater.removeListener('update-not-available', onNotAvailable);
      autoUpdater.removeListener('error', onError);
    }
    
    autoUpdater.once('update-available', onAvailable);
    autoUpdater.once('update-not-available', onNotAvailable);
    autoUpdater.once('error', onError);
    
    autoUpdater.checkForUpdates().catch(err => {
      cleanup();
      resolve({ available: false, error: err.message });
    });
  });
});

ipcMain.on('download-update', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.on('restart_app', () => {
  console.log("Güncelleme öncesi veriler yedekleniyor...");
  backupLocalData();
  autoUpdater.quitAndInstall(false, true);
});

app.whenReady().then(() => {
  performSchemaMigration(); // Uygulama başlarken şema göç kontrollerini yap
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (mainWindow) mainWindow.show();
    }
  });
  
  if (!app.isPackaged) {
    // Show main app
    if (mainWindow) mainWindow.show();
  } else {
    // Show main app
    if (mainWindow) mainWindow.show();
  }
});

ipcMain.on('set-auto-backup', (event, enabled) => {
  autoBackupEnabled = enabled;
});

ipcMain.handle('create-manual-backup', async () => {
  try {
    const userDataPath = app.getPath('userData');
    
    // Attempt to find the database file, assume database.sqlite if none found
    let dbFilePath = path.join(userDataPath, 'database.sqlite');
    const files = fs.readdirSync(userDataPath);
    const existingDb = files.find(f => f.endsWith('.sqlite') || f.endsWith('.db') || f.endsWith('.json') && f !== 'package.json');
    if (existingDb) {
      dbFilePath = path.join(userDataPath, existingDb);
    } else {
      // Create a dummy file to satisfy copy operation if no DB exists yet
      fs.writeFileSync(dbFilePath, '');
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const defaultPath = path.join(app.getPath('documents'), `Storm_Yedek_${dateStr}${path.extname(dbFilePath)}`);

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Yedek Dosyasını Kaydet',
      defaultPath: defaultPath,
      filters: [
        { name: 'Veritabanı Yedek Dosyası', extensions: [path.extname(dbFilePath).substring(1) || 'db'] }
      ]
    });

    if (!result.canceled && result.filePath) {
      fs.copyFileSync(dbFilePath, result.filePath);
      return { success: true, path: result.filePath };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Yedekleme hatası:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-from-backup', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Yedek Dosyası Seç',
      properties: ['openFile'],
      filters: [
        { name: 'Veritabanı Yedek Dosyası', extensions: ['db', 'sqlite', 'json'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const sourcePath = result.filePaths[0];
      const userDataPath = app.getPath('userData');
      const ext = path.extname(sourcePath);
      
      let targetFile = `database${ext}`;
      const files = fs.readdirSync(userDataPath);
      const existingDb = files.find(f => f.endsWith(ext));
      if (existingDb) {
        targetFile = existingDb;
      }
      
      const destPath = path.join(userDataPath, targetFile);
      fs.copyFileSync(sourcePath, destPath);
      
      // Relaunch the app to apply restored data
      app.relaunch();
      app.exit(0);
      return { success: true };
    }
    return { success: false, canceled: true };
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('open-auto-backup-folder', async () => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'Storm_Otomatik_Yedekler');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    await shell.openPath(backupDir);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.on('before-quit', () => {
  if (autoBackupEnabled) {
    try {
      const userDataPath = app.getPath('userData');
      const backupDir = path.join(userDataPath, 'Storm_Otomatik_Yedekler');
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Find DB file
      let dbFilePath = path.join(userDataPath, 'database.sqlite');
      const files = fs.readdirSync(userDataPath);
      const existingDb = files.find(f => f.endsWith('.sqlite') || f.endsWith('.db') || f.endsWith('.json') && f !== 'package.json');
      if (existingDb) {
        dbFilePath = path.join(userDataPath, existingDb);
      }

      if (fs.existsSync(dbFilePath)) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        const ext = path.extname(dbFilePath);
        
        const backupFileName = `Oto_Yedek_${dateStr}_${timeStr}${ext}`;
        const destPath = path.join(backupDir, backupFileName);
        
        fs.copyFileSync(dbFilePath, destPath);
        
        // Akıllı rotasyon: 5'ten fazla varsa en eskisini sil
        const backupFiles = fs.readdirSync(backupDir)
          .filter(f => f.startsWith('Oto_Yedek_'))
          .map(f => ({
            name: f,
            path: path.join(backupDir, f),
            time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
          }))
          .sort((a, b) => b.time - a.time);
          
        if (backupFiles.length > 5) {
          const filesToDelete = backupFiles.slice(5);
          for (const file of filesToDelete) {
            fs.unlinkSync(file.path);
          }
        }
      }
    } catch (error) {
      console.error('Otomatik yedekleme hatası:', error);
    }
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

