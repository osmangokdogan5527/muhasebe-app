import { useState } from 'react';

export function useBackupActions(
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
  autoBackupEnabled: boolean,
  setAutoBackupEnabled: (val: boolean) => void
) {
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleManualBackup = async () => {
    if (!(window as any).electronAPI || !(window as any).electronAPI.createManualBackup) {
      showToast("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    setIsBackupLoading(true);
    try {
      const result = await (window as any).electronAPI.createManualBackup();
      if (result.success) {
        showToast("Yedekleme başarıyla tamamlandı.", "success");
      } else {
        showToast(`Yedekleme başarısız oldu: ${result.error}`, "error");
      }
    } catch (err) {
      showToast("Yedekleme sırasında bir hata oluştu.", "error");
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!(window as any).electronAPI || !(window as any).electronAPI.restoreFromBackup) {
      showToast("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    setIsBackupLoading(true);
    try {
      const result = await (window as any).electronAPI.restoreFromBackup();
      if (result.success) {
        showToast("Yedekleme başarıyla geri yüklendi. Uygulama yeniden başlatılacak...", "success");
        setTimeout(() => {
          if ((window as any).electronAPI && (window as any).electronAPI.restartApp) {
            (window as any).electronAPI.restartApp();
          } else {
            window.location.reload();
          }
        }, 2000);
      } else if (result.canceled) {
        // Canceled, do nothing
      } else {
        showToast(`Yedekleme geri yüklenemedi: ${result.error}`, "error");
      }
    } catch (err) {
      showToast("Yedekleme geri yüklenirken bir hata oluştu.", "error");
    } finally {
      setIsBackupLoading(false);
    }
  };

  const toggleAutoBackup = () => {
    setAutoBackupEnabled(!autoBackupEnabled);
  };

  const handleOpenBackupFolder = async () => {
    if (!(window as any).electronAPI || !(window as any).electronAPI.openAutoBackupFolder) {
      showToast("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    try {
      const result = await (window as any).electronAPI.openAutoBackupFolder();
      if (!result.success) {
        showToast(`Klasör açılamadı: ${result.error}`, "error");
      }
    } catch (err) {
      showToast("Klasör açılırken bir hata oluştu.", "error");
    }
  };

  return {
    isBackupLoading,
    backupMessage,
    setBackupMessage,
    handleManualBackup,
    handleRestoreBackup,
    toggleAutoBackup,
    handleOpenBackupFolder
  };
}
