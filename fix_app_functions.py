import re

with open('src/App.tsx', 'r') as f:
    app = f.read()

# Replace empty functions
app = re.sub(
    r"  const handleResetAllData = async \(\) => \{\};\n  const handleProfileUpdate = \(\) => \{\};\n  const handleManualBackup = \(\) => \{\};\n  const handleRestoreBackup = \(\) => \{\};\n  const toggleAutoBackup = \(\) => \{\};\n  const handleOpenBackupFolder = \(\) => \{\};\n",
    """  const handleResetAllData = async () => {
    try {
      setIsResetting(true);
      await clearAllDatabaseData();
      setResetModalOpen(false);
      showToast("Tüm veriler başarıyla sıfırlandı.", "success");
    } catch (e: any) {
      setResetError(e.message || "Sıfırlama sırasında bir hata oluştu.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user) return;
    try {
      if (profileName) {
        await updateProfile(user, { displayName: profileName });
      }
      showToast("Profil bilgileri başarıyla güncellendi.", "success");
    } catch (err: any) {
      showToast(`Profil güncellenirken hata oluştu: ${err.message}`, "error");
    }
  };

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
""",
    app,
    flags=re.DOTALL
)

# Remove the old handleCreateBackup
app = re.sub(
    r"  const handleCreateBackup = async \(\) => \{.*?  \};\n",
    "",
    app,
    flags=re.DOTALL
)

with open('src/App.tsx', 'w') as f:
    f.write(app)
