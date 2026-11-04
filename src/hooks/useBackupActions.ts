import { useState } from 'react';
import { logError } from '../utils/errorLogger';

export function useBackupActions(
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void,
  autoBackupEnabled: boolean,
  setAutoBackupEnabled: (val: boolean) => void
) {
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

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
      logError(err instanceof Error ? err : new Error(String(err)), 'useBackupActions.openFolder');
      showToast("Klasör açılırken bir hata oluştu.", "error");
    }
  };

  return {
    isBackupLoading,
    backupMessage,
    setBackupMessage,
    toggleAutoBackup,
    handleOpenBackupFolder
  };
}
