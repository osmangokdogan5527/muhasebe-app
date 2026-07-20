import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Download, 
  Upload, 
  Settings, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Lock, 
  Unlock, 
  X, 
  FileText,
  Database,
  RefreshCw,
  HelpCircle,
  Key
} from 'lucide-react';
import { encryptBackup, decryptBackup, BackupDataPayload } from '../../utils/backupCrypto';

interface BackupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  // All tables from useAppData
  cariler: any[];
  stoklar: any[];
  islemler: any[];
  ceksenet: any[];
  expenses: any[];
  employees: any[];
  employeeTransactions: any[];
  credits: any[];
  bankAccounts: any[];
  accountTransactions: any[];
  // Import handler (should clear and batch setDoc in firestore, then reload)
  onImportData: (payload: any) => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const BackupWizardModal: React.FC<BackupWizardModalProps> = ({
  isOpen,
  onClose,
  cariler,
  stoklar,
  islemler,
  ceksenet,
  expenses,
  employees,
  employeeTransactions,
  credits,
  bankAccounts,
  accountTransactions,
  onImportData,
  showToast
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'backup' | 'restore' | 'settings'>('status');
  const [backupPassword, setBackupPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [restorePassword, setRestorePassword] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [restorePreview, setRestorePreview] = useState<BackupDataPayload | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [hasBackedUpThisSession, setHasBackedUpThisSession] = useState(false);

  // Frequency setting
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'disabled'>(() => {
    return (localStorage.getItem('storm_backup_frequency') as any) || 'weekly';
  });

  // Calculate stats
  const totalRecords = 
    cariler.length + 
    stoklar.length + 
    islemler.length + 
    ceksenet.length + 
    expenses.length + 
    employees.length + 
    employeeTransactions.length + 
    credits.length + 
    bankAccounts.length + 
    accountTransactions.length;

  const lastBackupTime = localStorage.getItem('storm_last_backup_time');
  const lastBackupDate = lastBackupTime ? new Date(parseInt(lastBackupTime)) : null;

  // Calculate Health Score (0 - 100)
  const [healthScore, setHealthScore] = useState(100);
  const [healthStatus, setHealthStatus] = useState<'excellent' | 'good' | 'warning' | 'danger'>('excellent');

  useEffect(() => {
    let score = 100;
    
    if (totalRecords === 0) {
      score = 100; // No data, perfect health
    } else if (!lastBackupDate) {
      score = 30; // Has data but never backed up!
    } else {
      const diffMs = Date.now() - lastBackupDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 1) {
        score = 100;
      } else if (diffDays <= 3) {
        score = 90;
      } else if (diffDays <= 7) {
        score = 75;
      } else if (diffDays <= 14) {
        score = 50;
      } else {
        score = 20;
      }
    }

    setHealthScore(score);

    if (score >= 90) setHealthStatus('excellent');
    else if (score >= 70) setHealthStatus('good');
    else if (score >= 45) setHealthStatus('warning');
    else setHealthStatus('danger');
  }, [totalRecords, lastBackupTime]);

  // Handle Frequency Change
  const handleFrequencyChange = (freq: 'daily' | 'weekly' | 'monthly' | 'disabled') => {
    setFrequency(freq);
    localStorage.setItem('storm_backup_frequency', freq);
    showToast(`Hatırlatma sıklığı ${
      freq === 'daily' ? 'Günlük' :
      freq === 'weekly' ? 'Haftalık' :
      freq === 'monthly' ? 'Aylık' : 'Kapatıldı'
    } olarak güncellendi.`, 'success');
  };

  // Trigger Backup Download
  const handleCreateBackup = () => {
    setIsActionLoading(true);
    try {
      // Gather current localStorage settings
      const settingsToBackup: { [key: string]: string | null } = {};
      const settingsKeys = [
        'kolay_hesap_accent_theme',
        'storm_muhasebe_design_style',
        'storm_muhasebe_logo_theme',
        'storm_muhasebe_font_size',
        'storm_muhasebe_sidebar_bg',
        'storm_muhasebe_sidebar_pattern',
        'storm_muhasebe_sidebar_pattern_opacity',
        'storm_muhasebe_sidebar_pattern_color',
        'storm_muhasebe_hidden_tabs',
        'storm_muhasebe_tab_order',
        'storm_muhasebe_print_settings',
        'storm_print_templates',
        'storm_muhasebe_shortcuts',
        'storm_muhasebe_admin_pin',
        'storm_muhasebe_security_active',
        'storm_muhasebe_action_permissions'
      ];

      settingsKeys.forEach(key => {
        settingsToBackup[key] = localStorage.getItem(key);
      });

      const payload: BackupDataPayload = {
        version: '1.6.9-draft',
        timestamp: new Date().toISOString(),
        collections: {
          cariler,
          stoklar,
          islemler,
          ceksenet,
          giderler: expenses,
          calisanlar: employees,
          calisanIslemler: employeeTransactions,
          krediler: credits,
          hesaplar: bankAccounts,
          hesapIslemleri: accountTransactions
        },
        localStorage: settingsToBackup
      };

      const pass = backupPassword.trim() || undefined;
      const encryptedString = encryptBackup(payload, pass);

      // Create download
      const blob = new Blob([encryptedString], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `storm_yedek_${new Date().toISOString().split('T')[0]}_${pass ? 'sifreli' : 'standart'}.storm`;
      a.click();
      URL.revokeObjectURL(url);

      // Update state
      localStorage.setItem('storm_last_backup_time', Date.now().toString());
      setHasBackedUpThisSession(true);
      showToast('Yedek dosyanız (.storm) başarıyla oluşturuldu ve indirildi.', 'success');
      setActiveTab('status');
    } catch (err: any) {
      showToast(`Yedekleme hatası: ${err.message || err}`, 'error');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.storm')) {
        setSelectedFile(file);
        setRestorePreview(null);
      } else {
        showToast('Lütfen geçerli bir .storm yedek dosyası yükleyin.', 'error');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.name.endsWith('.storm')) {
        setSelectedFile(file);
        setRestorePreview(null);
      } else {
        showToast('Lütfen geçerli bir .storm yedek dosyası yükleyin.', 'error');
      }
    }
  };

  // Parse & Preview Uploaded File
  const handleAnalyzeFile = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const pass = restorePassword.trim() || undefined;
        const decrypted = decryptBackup(text, pass);
        setRestorePreview(decrypted);
        showToast('Yedek dosyası başarıyla doğrulandı. İçerik önizlemesini inceleyebilirsiniz.', 'success');
      } catch (err: any) {
        showToast(err.message || 'Yedek çözümlenemedi. Parola hatalı olabilir.', 'error');
      }
    };
    reader.readAsText(selectedFile);
  };

  // Restore Action
  const handleRestoreBackupFile = async () => {
    if (!restorePreview) return;

    const confirmRestore = window.confirm(
      '⚠️ KRİTİK UYARI!\n\nYedek yükleme işlemi mevcut tüm verilerinizi (cariler, stoklar, işlemler, masraflar vb.) kalıcı olarak silecek ve yedek dosyasındaki verileri yükleyecektir.\n\nBu işlemi onaylıyor musunuz?'
    );

    if (!confirmRestore) return;

    setIsActionLoading(true);
    try {
      // 1. Restore collections to firestore
      await onImportData(restorePreview.collections);

      // 2. Restore localStorages
      if (restorePreview.localStorage) {
        Object.entries(restorePreview.localStorage).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            localStorage.setItem(key, val as string);
          }
        });
      }

      showToast('Yedek verileriniz başarıyla içe aktarıldı! Uygulama yenileniyor...', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      showToast(`Geri yükleme hatası: ${err.message || err}`, 'error');
      setIsActionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#0b0c10] border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Otomatik Veri Sağlığı & Yedekleme Sihirbazı</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Bulut yedeklerinizi yönetin ve veri kaybı riskini sıfıra indirin</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/20 px-2 pt-1 gap-1">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'status' 
                ? 'border-teal-500 text-teal-400 bg-teal-500/5' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Activity size={14} />
              <span>Veri Sağlığı</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'backup' 
                ? 'border-teal-500 text-teal-400 bg-teal-500/5' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Download size={14} />
              <span>Şifreli Yedek Al</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('restore')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'restore' 
                ? 'border-teal-500 text-teal-400 bg-teal-500/5' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Upload size={14} />
              <span>Yedekten Geri Yükle</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition ${
              activeTab === 'settings' 
                ? 'border-teal-500 text-teal-400 bg-teal-500/5' 
                : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/30'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Settings size={14} />
              <span>Ayarlar & Sıklık</span>
            </div>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: STATUS & HEALTH */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              
              {/* Health Score Panel */}
              <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Veri Sağlığı & Güvenlik Durumu</h3>
                  <div className="flex items-baseline gap-2 justify-center md:justify-start">
                    <span className={`text-4xl font-extrabold font-mono ${
                      healthStatus === 'excellent' ? 'text-emerald-400' :
                      healthStatus === 'good' ? 'text-teal-400' :
                      healthStatus === 'warning' ? 'text-amber-400' : 'text-rose-500'
                    }`}>
                      {healthScore}%
                    </span>
                    <span className="text-xs text-zinc-400 font-medium">Güvenlik Skoru</span>
                  </div>
                  <p className="text-xs text-zinc-400 max-w-sm">
                    {healthStatus === 'excellent' && 'Harika! Verileriniz güvende ve yakın zamanda yedeklenmiş.'}
                    {healthStatus === 'good' && 'İyi durumda. Ancak veri kaybı riskini tamamen önlemek için düzenli manuel yedek almanız önerilir.'}
                    {healthStatus === 'warning' && 'Dikkat! Son yedeklemenizin üzerinden zaman geçmiş. Lütfen bir yedek dosyası indirin.'}
                    {healthStatus === 'danger' && 'KRİTİK RİSK! Henüz yedek oluşturulmamış veya kritik süreyi aşmış. Lütfen hemen yedek indirin!'}
                  </p>
                </div>

                {/* Progress Wheel */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" className="stroke-zinc-800" strokeWidth="8" fill="transparent" />
                    <circle 
                      cx="48" 
                      cy="48" 
                      r="40" 
                      className={`transition-all duration-500 ${
                        healthStatus === 'excellent' ? 'stroke-emerald-500' :
                        healthStatus === 'good' ? 'stroke-teal-500' :
                        healthStatus === 'warning' ? 'stroke-amber-500' : 'stroke-rose-500'
                      }`}
                      strokeWidth="8" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - healthScore / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {healthStatus === 'excellent' && <CheckCircle2 size={32} className="text-emerald-400" />}
                    {healthStatus === 'good' && <CheckCircle2 size={32} className="text-teal-400" />}
                    {healthStatus === 'warning' && <AlertTriangle size={32} className="text-amber-400" />}
                    {healthStatus === 'danger' && <AlertTriangle size={32} className="text-rose-500 animate-pulse" />}
                  </div>
                </div>
              </div>

              {/* Data Volume Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Database size={14} className="text-teal-400" />
                  <span>Aktif Veritabanı Dağılımı</span>
                </h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Cari Kartlar</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{cariler.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Stok Ürünleri</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{stoklar.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Kasa & Banka</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{bankAccounts.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Tüm İşlemler</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{islemler.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Çek & Senetler</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{ceksenet.length}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-800">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase block">Gider Faturaları</span>
                    <span className="text-sm font-bold font-mono text-white mt-1 block">{expenses.length}</span>
                  </div>
                </div>
              </div>

              {/* Last Backup Log */}
              <div className="p-4 rounded-xl bg-zinc-950/20 border border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zinc-500" />
                  <span>Son Başarılı Yedekleme Tarihi:</span>
                </div>
                <span className="font-bold font-mono text-white">
                  {lastBackupDate ? lastBackupDate.toLocaleString('tr-TR') : 'Yedekleme kaydı bulunamadı'}
                </span>
              </div>

              {/* Status Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => setActiveTab('restore')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  Yedek Yükle
                </button>
                <button
                  onClick={() => setActiveTab('backup')}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition"
                >
                  Yedekleme Sihirbazını Başlat
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: BACKUP CREATION */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              
              <div className="p-4 bg-teal-500/5 border border-teal-500/10 rounded-xl space-y-1.5">
                <p className="text-xs text-teal-400 font-bold uppercase tracking-wider">Güvenli .storm Yedekleme Dosyası</p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Tüm ticari verileriniz, firma ayarlarınız, fatura tasarımlarınız ve kısayollarınız tek bir şifreli dosyada sıkıştırılır. Parola belirleyerek yedeklerinizi izinsiz erişime karşı koruyabilirsiniz.
                </p>
              </div>

              {/* Encryption Passphrase Selection */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Key size={14} className="text-teal-400" />
                  <span>Yedek Şifreleme Anahtarı (İsteğe Bağlı)</span>
                </label>
                
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={backupPassword}
                    onChange={(e) => setBackupPassword(e.target.value)}
                    placeholder="Yedeğin şifrelenmesi için bir parola girin (boş bırakılırsa varsayılan şifre kullanılır)..."
                    className="w-full bg-zinc-900 border border-zinc-800 focus:border-teal-500 rounded-xl px-4 py-3 text-xs text-white transition outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-1 text-zinc-400 hover:text-white transition"
                  >
                    {showPassword ? <Unlock size={16} /> : <Lock size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500">
                  ⚠️ Şifre belirlerseniz, bu yedeği geri yüklerken aynı şifreyi girmek zorunlu olacaktır. Şifrenizi güvenli bir yerde saklayın.
                </p>
              </div>

              {/* Stats Preview of current Export payload */}
              <div className="p-4 rounded-xl bg-zinc-950/30 border border-zinc-800 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase block">Paketlenecek Toplam Kayıt Sayısı</span>
                  <span className="text-lg font-bold font-mono text-white block">{totalRecords} Satır Veri</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-teal-500/10 text-teal-400 text-[10px] font-bold border border-teal-500/20 uppercase">
                  HAZIR
                </div>
              </div>

              {/* Action Button */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => setActiveTab('status')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={isActionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Download size={14} />
                  <span>Şifreli .storm Dosyasını İndir</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: RESTORE FROM BACKUP */}
          {activeTab === 'restore' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Veri Geri Yükleme Uyarısı</span>
                </p>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Geri yükleme işlemi mevcut bulut ve yerel veritabanınızı temizleyip seçtiğiniz yedek dosyasındaki verileri üzerine yazacaktır. Bu işlem geri alınamaz.
                </p>
              </div>

              {/* Drag & Drop File input */}
              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer flex flex-col items-center justify-center space-y-3 ${
                  isDragOver ? 'border-teal-500 bg-teal-500/5' : 'border-zinc-800 bg-zinc-900/10 hover:bg-zinc-900/30 hover:border-zinc-700'
                }`}
                onClick={() => document.getElementById('backup-file-input')?.click()}
              >
                <input 
                  type="file" 
                  id="backup-file-input" 
                  accept=".storm" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                
                <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <FileText size={24} />
                </div>
                
                {selectedFile ? (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">{selectedFile.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono block">{(selectedFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">Storm Yedek Dosyasını Sürükleyin</span>
                    <span className="text-[10px] text-zinc-400 block">veya bilgisayarınızdan seçmek için tıklayın (.storm)</span>
                  </div>
                )}
              </div>

              {/* Password for Restore */}
              {selectedFile && (
                <div className="space-y-3 p-4 rounded-xl bg-zinc-900/40 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={14} className="text-teal-400" />
                    <span>Yedek Şifresi (Varsa)</span>
                  </label>
                  
                  <div className="flex gap-2">
                    <input
                      type="password"
                      value={restorePassword}
                      onChange={(e) => setRestorePassword(e.target.value)}
                      placeholder="Dosya şifrelenirken kullanılan parolayı girin..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-teal-500 rounded-xl px-4 py-2 text-xs text-white transition outline-none font-mono"
                    />
                    <button
                      onClick={handleAnalyzeFile}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer"
                    >
                      Kilit Çöz & Doğrula
                    </button>
                  </div>
                </div>
              )}

              {/* Restore Data Preview */}
              {restorePreview && (
                <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800 space-y-3 animate-fade-in">
                  <h5 className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider">Yedek Dosyası Doğrulandı</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-zinc-400 block">Yedeklenme Tarihi:</span>
                      <span className="font-bold text-white font-mono">{new Date(restorePreview.timestamp).toLocaleString('tr-TR')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-400 block">Sürüm:</span>
                      <span className="font-bold text-white font-mono">{restorePreview.version}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                    <span className="font-bold text-white block mb-1">Paket Veri İçeriği:</span>
                    • {restorePreview.collections.cariler?.length || 0} Cari Kart • {restorePreview.collections.stoklar?.length || 0} Stok Ürünü • {restorePreview.collections.islemler?.length || 0} İşlem Kaydı
                  </div>
                </div>
              )}

              {/* Restore Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setRestorePreview(null);
                    setRestorePassword('');
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
                >
                  Temizle
                </button>
                <button
                  onClick={handleRestoreBackupFile}
                  disabled={!restorePreview || isActionLoading}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg transition cursor-pointer disabled:opacity-40"
                >
                  {isActionLoading ? 'Yükleniyor...' : 'Verileri Geri Yükle'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: SETTINGS & REMINDER FREQUENCY */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-teal-400" />
                  <span>Otomatik Yedek Hatırlatıcı Sıklığı</span>
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Uygulama yerel depolama ve bulut senkronizasyonu kullandığı için belirli aralıklarla bilgisayarınıza fiziksel bir .storm yedeği indirmenizi hatırlatır. Hatırlatma sıklığını buradan seçebilirsiniz.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleFrequencyChange('daily')}
                    className={`p-4 rounded-xl border transition text-center flex flex-col items-center justify-center gap-1.5 ${
                      frequency === 'daily'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                        : 'bg-zinc-900/20 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                    }`}
                  >
                    <Clock size={16} />
                    <span className="text-xs uppercase tracking-wider block">Günlük</span>
                    <span className="text-[9px] text-zinc-500 block">Her gün sonunda</span>
                  </button>

                  <button
                    onClick={() => handleFrequencyChange('weekly')}
                    className={`p-4 rounded-xl border transition text-center flex flex-col items-center justify-center gap-1.5 ${
                      frequency === 'weekly'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                        : 'bg-zinc-900/20 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                    }`}
                  >
                    <Clock size={16} />
                    <span className="text-xs uppercase tracking-wider block">Haftalık</span>
                    <span className="text-[9px] text-zinc-500 block">7 günde bir</span>
                  </button>

                  <button
                    onClick={() => handleFrequencyChange('monthly')}
                    className={`p-4 rounded-xl border transition text-center flex flex-col items-center justify-center gap-1.5 ${
                      frequency === 'monthly'
                        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-bold'
                        : 'bg-zinc-900/20 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                    }`}
                  >
                    <Clock size={16} />
                    <span className="text-xs uppercase tracking-wider block">Aylık</span>
                    <span className="text-[9px] text-zinc-500 block">30 günde bir</span>
                  </button>

                  <button
                    onClick={() => handleFrequencyChange('disabled')}
                    className={`p-4 rounded-xl border transition text-center flex flex-col items-center justify-center gap-1.5 ${
                      frequency === 'disabled'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-400 font-bold'
                        : 'bg-zinc-900/20 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800/30'
                    }`}
                  >
                    <X size={16} />
                    <span className="text-xs uppercase tracking-wider block">Kapalı</span>
                    <span className="text-[9px] text-zinc-500 block">Soru sorma</span>
                  </button>
                </div>
              </div>

              {/* Data Safety Tips */}
              <div className="p-4 rounded-xl bg-zinc-950/20 border border-zinc-800 space-y-2.5">
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-wider block">💡 Veri Sağlığı İpuçları</span>
                <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                  <li>Yedek dosyalarınızı bilgisayarınız haricinde bir USB bellek veya Google Drive/Dropbox gibi harici bulut klasöründe saklayın.</li>
                  <li>Her ay sonunda şifreli bir yedek alıp mali raporlarınızla birlikte arşivleyin.</li>
                  <li>Cihaz değişikliği veya tarayıcı sıfırlama durumunda indirdiğiniz .storm dosyasını yükleyerek saniyeler içinde kaldığınız yerden devam edin.</li>
                </ul>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950/60 border-t border-zinc-800 flex justify-between items-center text-[10px] text-zinc-500">
          <span>Storm Muhasebe Güvenli Veri Motoru v1.6.9-draft</span>
          <span>Bütün Hakları Saklıdır © 2026</span>
        </div>

      </div>
    </div>
  );
};
