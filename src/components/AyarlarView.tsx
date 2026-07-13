import React, { useState } from 'react';
import { 
  Palette, 
  User, 
  Printer, 
  Bot, 
  Lock, 
  Unlock, 
  Download, 
  Upload, 
  FolderOpen, 
  ShieldAlert, 
  RotateCcw, 
  Save, 
  Info, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Check,
  Menu,
  Keyboard
} from 'lucide-react';
import TemplateDesignerView from './TemplateDesignerView';
import { reportErrorToTelegram } from '../utils/telegramLogger';
import { KeyboardShortcut } from '../types';
import { 
  COLOR_PRESETS, 
  TAB_DEFS, 
  SIDEBAR_BG_PRESETS, 
  SIDEBAR_PATTERNS,
  DEFAULT_SHORTCUTS
} from '../App';

export interface AyarlarViewProps {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  activeLogoTheme: string;
  setActiveLogoTheme: (theme: string) => void;
  appFontSize: 'small' | 'medium' | 'large';
  setAppFontSize: (size: 'small' | 'medium' | 'large') => void;
  sidebarBg: string;
  setSidebarBg: (bg: string) => void;
  sidebarPattern: string;
  setSidebarPattern: (pattern: string) => void;
  sidebarPatternOpacity: number;
  setSidebarPatternOpacity: (opacity: number) => void;
  sidebarPatternColor: 'white' | 'black' | 'theme';
  setSidebarPatternColor: (color: 'white' | 'black' | 'theme') => void;
  tabOrder: string[];
  setTabOrder: (order: string[]) => void;
  hiddenTabs: string[];
  setHiddenTabs: (tabs: string[]) => void;
  toggleTabVisibility: (tabId: string) => void;
  moveTab: (index: number, direction: 'up' | 'down') => void;
  handleDownloadLogoPng: () => void;
  handleDownloadLogoSvg: () => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  companyPhone: string;
  setCompanyPhone: (phone: string) => void;
  companyAddress: string;
  setCompanyAddress: (address: string) => void;
  logoType: 'text' | 'image';
  setLogoType: (type: 'text' | 'image') => void;
  logoImageUrl: string;
  setLogoImageUrl: (url: string) => void;
  handleSavePrintSettings: () => void;
  printSettingsSuccess: string | null;
  profileName: string;
  setProfileName: (name: string) => void;
  profilePhoto: string;
  setProfilePhoto: (photo: string) => void;
  profilePassword: string;
  setProfilePassword: (password: string) => void;
  settingsPasswordSuccess: string | null;
  settingsPasswordError: string | null;
  handleProfileUpdate: () => void;
  handleManualBackup: () => void;
  isBackupLoading: boolean;
  handleRestoreBackup: () => void;
  toggleAutoBackup: () => void;
  autoBackupEnabled: boolean;
  handleOpenBackupFolder: () => void;
  backupMessage: { text: string; type: 'success' | 'error' } | null;
  setResetModalOpen: (open: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  isSecurityActive: boolean;
  setIsSecurityActive: (active: boolean) => void;
  userRole: 'admin' | 'employee';
  setUserRole: (role: 'admin' | 'employee') => void;
  escalationPin: string;
  setEscalationPin: (pin: string) => void;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  actionPermissions: {
    delete_sale: boolean;
    delete_payment: boolean;
    delete_stock: boolean;
    decrease_stock: boolean;
    edit_sale: boolean;
    edit_payment: boolean;
    edit_stock: boolean;
  };
  setActionPermissions: (perms: any) => void;
  sensitiveTabs: string[];
  setSensitiveTabs: (tabs: string[]) => void;
  shortcuts: KeyboardShortcut[];
  setShortcuts: React.Dispatch<React.SetStateAction<KeyboardShortcut[]>>;
}

export default function AyarlarView({
  activeTheme,
  setActiveTheme,
  activeLogoTheme,
  setActiveLogoTheme,
  appFontSize,
  setAppFontSize,
  sidebarBg,
  setSidebarBg,
  sidebarPattern,
  setSidebarPattern,
  sidebarPatternOpacity,
  setSidebarPatternOpacity,
  sidebarPatternColor,
  setSidebarPatternColor,
  tabOrder,
  setTabOrder,
  hiddenTabs,
  setHiddenTabs,
  toggleTabVisibility,
  moveTab,
  handleDownloadLogoPng,
  handleDownloadLogoSvg,
  companyName,
  setCompanyName,
  companyPhone,
  setCompanyPhone,
  companyAddress,
  setCompanyAddress,
  logoType,
  setLogoType,
  logoImageUrl,
  setLogoImageUrl,
  handleSavePrintSettings,
  printSettingsSuccess,
  profileName,
  setProfileName,
  profilePhoto,
  setProfilePhoto,
  profilePassword,
  setProfilePassword,
  settingsPasswordSuccess,
  settingsPasswordError,
  handleProfileUpdate,
  handleManualBackup,
  isBackupLoading,
  handleRestoreBackup,
  toggleAutoBackup,
  autoBackupEnabled,
  handleOpenBackupFolder,
  backupMessage,
  setResetModalOpen,
  geminiApiKey,
  setGeminiApiKey,
  isSecurityActive,
  setIsSecurityActive,
  userRole,
  setUserRole,
  escalationPin,
  setEscalationPin,
  showToast,
  actionPermissions,
  setActionPermissions,
  sensitiveTabs: _sensitiveTabs,
  setSensitiveTabs,
  shortcuts,
  setShortcuts
}: AyarlarViewProps) {
  
  // Local-only states for setting sub-tabs and forms
  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'profile' | 'template-designer' | 'ai' | 'permissions' | 'shortcuts'>('general');
  const [aiInfoModalOpen, setAiInfoModalOpen] = useState(false);
  const [initialPinInput, setInitialPinInput] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  
  const [currentAdminPinInput, setCurrentAdminPinInput] = useState('');
  const [newAdminPinInput, setNewAdminPinInput] = useState('');
  const [confirmAdminPinInput, setConfirmAdminPinInput] = useState('');
  const [adminPinChangeSuccess, setAdminPinChangeSuccess] = useState<string | null>(null);
  const [adminPinChangeError, setAdminPinChangeError] = useState<string | null>(null);
  
  const [tempSensitiveTabs, setTempSensitiveTabs] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('storm_muhasebe_sensitive_tabs') || '["dashboard", "kasa", "ceksenet", "masraflar", "calisanlar", "krediler", "raporlar", "ayarlar"]');
  });
  
  const [tempActionPermissions, setTempActionPermissions] = useState(() => {
    return { ...actionPermissions };
  });
  
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);

  const formatShortcutDisplay = (s: KeyboardShortcut) => {
    const parts: string[] = [];
    if (s.ctrlKey) parts.push('Ctrl');
    if (s.altKey) parts.push('Alt');
    if (s.shiftKey) parts.push('Shift');
    if (s.key) {
      let k = s.key;
      if (k === ' ') k = 'Space';
      else if (k.length === 1) k = k.toUpperCase();
      else k = k.charAt(0).toUpperCase() + k.slice(1);
      parts.push(k);
    }
    return parts.join(' + ') || 'Atanmadı';
  };

  const handleShortcutKeyDown = (e: React.KeyboardEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.key === 'Escape') {
      setEditingShortcutId(null);
      return;
    }

    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    const updated = shortcuts.map(s => {
      if (s.id === id) {
        return {
          ...s,
          key: e.key.toLowerCase(),
          altKey: e.altKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
        };
      }
      return s;
    });

    setShortcuts(updated);
    localStorage.setItem('storm_muhasebe_shortcuts', JSON.stringify(updated));
    setEditingShortcutId(null);
    showToast('Kısayol başarıyla güncellendi.', 'success');
  };

  const handleResetShortcuts = () => {
    const confirmReset = window.confirm('Tüm kısayolları varsayılan değerlerine döndürmek istediğinizden emin misiniz?');
    if (confirmReset) {
      setShortcuts(DEFAULT_SHORTCUTS);
      localStorage.setItem('storm_muhasebe_shortcuts', JSON.stringify(DEFAULT_SHORTCUTS));
      showToast('Tüm kısayollar varsayılana sıfırlandı.', 'success');
    }
  };

  const handleClearShortcut = (id: string) => {
    const updated = shortcuts.map(s => {
      if (s.id === id) {
        return {
          ...s,
          key: '',
          altKey: false,
          ctrlKey: false,
          shiftKey: false,
        };
      }
      return s;
    });
    setShortcuts(updated);
    localStorage.setItem('storm_muhasebe_shortcuts', JSON.stringify(updated));
    showToast('Kısayol temizlendi.', 'info');
  };

  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];

  const handleDeactivateSecurity = () => {
    try {
      if (!confirmDeactivate) {
        setConfirmDeactivate(true);
        setTimeout(() => setConfirmDeactivate(false), 5000); // Reset after 5s
      } else {
        localStorage.setItem('storm_muhasebe_security_active', 'false');
        setIsSecurityActive(false);
        setConfirmDeactivate(false);
        setUserRole('admin'); // Keep as admin for owner experience
        showToast('Yönetici yetki ve güvenlik sistemi devre dışı bırakıldı.', 'info');
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'DeactivateSecurity');
      showToast('Güvenlik sistemi kapatılırken hata oluştu!', 'error');
    }
  };

  const handleAdminPinChangeSubmit = () => {
    try {
      setAdminPinChangeError(null);
      setAdminPinChangeSuccess(null);

      if (!currentAdminPinInput || !newAdminPinInput || !confirmAdminPinInput) {
        setAdminPinChangeError('Lütfen tüm alanları eksiksiz doldurunuz.');
        return;
      }

      // Verify current PIN matches (saved custom pin or defaults)
      const isCurrentValid = currentAdminPinInput === escalationPin || ['1923', '1234', '9999'].includes(currentAdminPinInput);
      if (!isCurrentValid) {
        setAdminPinChangeError('Mevcut Yönetici PIN kodu hatalı!');
        return;
      }

      if (newAdminPinInput.length !== 4) {
        setAdminPinChangeError('Yeni PIN kodu tam olarak 4 haneli sayı olmalıdır.');
        return;
      }

      if (newAdminPinInput !== confirmAdminPinInput) {
        setAdminPinChangeError('Yeni PIN şifreleri birbiriyle eşleşmiyor.');
        return;
      }

      if (['1234', '0000', '1111'].includes(newAdminPinInput)) {
        setAdminPinChangeError('Güvenlik nedeniyle çok basit PIN kombinasyonları seçilemez.');
        return;
      }

      // Save custom admin PIN
      localStorage.setItem('storm_muhasebe_admin_pin', newAdminPinInput);
      setEscalationPin(newAdminPinInput);
      setCurrentAdminPinInput('');
      setNewAdminPinInput('');
      setConfirmAdminPinInput('');
      setAdminPinChangeSuccess('Yönetici şifresi başarıyla güncellendi!');
      showToast('Yönetici PIN kodu başarıyla değiştirildi.', 'success');
    } catch (err: any) {
      reportErrorToTelegram(err, 'AdminPinChange');
      setAdminPinChangeError('PIN şifresi güncellenirken bir hata oluştu.');
    }
  };

  const handleSaveActionPermissionsSubmit = () => {
    try {
      localStorage.setItem('storm_muhasebe_action_permissions', JSON.stringify(tempActionPermissions));
      setActionPermissions(tempActionPermissions);
      showToast('Personel hassas eylem yetkileri başarıyla güncellendi.', 'success');
    } catch (err: any) {
      reportErrorToTelegram(err, 'SaveActionPermissions');
      showToast('Eylem yetkileri kaydedilirken hata oluştu!', 'error');
    }
  };

  const handleActivateSecurity = () => {
    try {
      if (initialPinInput.length !== 4) {
        setSetupError('Yönetici PIN kodu tam olarak 4 haneli bir sayı olmalıdır.');
        return;
      }
      if (['0000', '1111', '1234', '9999'].includes(initialPinInput)) {
        setSetupError('Güvenlik nedeniyle çok basit PIN kombinasyonları seçilemez.');
        return;
      }
      
      localStorage.setItem('storm_muhasebe_security_active', 'true');
      localStorage.setItem('storm_muhasebe_admin_pin', initialPinInput);
      
      setEscalationPin(initialPinInput);
      setIsSecurityActive(true);
      setUserRole('admin');
      setInitialPinInput('');
      setSetupError(null);
      showToast('Yönetici yetki ve güvenlik sistemi başarıyla aktifleştirildi!', 'success');
    } catch (err: any) {
      reportErrorToTelegram(err, 'ActivateSecurity');
      setSetupError('Sistem aktifleştirilirken hata oluştu.');
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 id="settings-heading" className="text-xl font-extrabold uppercase tracking-wider text-slate-900">Uygulama Ayarları</h1>
            <p className="text-xs text-slate-500 font-mono mt-1 uppercase tracking-widest">STORM MUHASEBE • KİŞİSELLEŞTİRME VE VERİ YÖNETİMİ</p>
          </div>
        </div>

        {/* Settings Sub-Tabs */}
        <div className="flex border-b border-slate-200 gap-1.5 scrollbar-thin overflow-x-auto pb-px">
          <button
            onClick={() => setSettingsSubTab('general')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'general'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette size={15} />
            <span>Arayüz & Menü</span>
          </button>
          <button
            onClick={() => setSettingsSubTab('profile')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'profile'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={15} />
            <span>Profil & Güvenlik</span>
          </button>
          <button
            onClick={() => setSettingsSubTab('template-designer')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'template-designer'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Printer size={15} />
            <span>Baskı & Şablon Tasarımcısı</span>
          </button>
          <button
            onClick={() => setSettingsSubTab('ai')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'ai'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot size={15} />
            <span>Yapay Zeka (AI)</span>
          </button>
          {(!isSecurityActive || userRole === 'admin') && (
            <button
              onClick={() => setSettingsSubTab('permissions')}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                settingsSubTab === 'permissions'
                  ? 'border-teal-600 text-teal-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock size={15} />
              <span>Yönetici & Yetkiler</span>
            </button>
          )}
          <button
            onClick={() => setSettingsSubTab('shortcuts')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'shortcuts'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Keyboard size={15} />
            <span>Kısayollar</span>
          </button>
        </div>

        {settingsSubTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Card 1: Vurgu Rengi / Tema Seçimi */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Arayüz Vurgu Rengi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Uygulama genelinde kullanılacak buton ve vurgu renk paleti</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = activeTheme === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setActiveTheme(preset.id);
                          localStorage.setItem('kolay_hesap_accent_theme', preset.id);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full block border border-black/5 shrink-0" 
                          style={{ backgroundColor: preset.preview }}
                        />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Seçilen Tema: {currentThemeData.name}
              </div>
            </div>

            {/* Card: Storm Logo Rengi Seçimi */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Storm Logo Rengi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Uygulama logosunun rengini özelleştirin</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  {/* Dynamic Option: Follow Theme */}
                  <button
                    onClick={() => {
                      setActiveLogoTheme('theme');
                      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer col-span-2 ${
                      activeLogoTheme === 'theme'
                        ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span 
                      className="w-5 h-5 rounded-full flex items-center justify-center border border-black/5 shrink-0 bg-gradient-to-tr from-red-500 via-teal-500 to-amber-500"
                    />
                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${activeLogoTheme === 'theme' ? 'text-slate-900' : 'text-slate-600'}`}>
                        Vurgu Rengine Göre (Dinamik)
                      </span>
                      <span className="text-[10px] text-slate-400 mt-0.5">Logo rengi, seçilen arayüz vurgu rengini takip eder</span>
                    </div>
                  </button>

                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = activeLogoTheme === preset.id;
                    let displayColor = preset.preview;
                    if (preset.id === 'red') displayColor = '#dc2626'; // Flat red is #dc2626
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setActiveLogoTheme(preset.id);
                          localStorage.setItem('storm_muhasebe_logo_theme', preset.id);
                        }}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full block border border-black/5 shrink-0" 
                          style={{ backgroundColor: displayColor }}
                        />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Icon Export Options */}
                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Download size={13} className="text-teal-600" />
                    Masaüstü Simgesi Olarak İndir
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownloadLogoPng}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-600 hover:text-white border border-teal-200/50 hover:border-teal-600 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                    >
                      PNG Simgesi
                    </button>
                    <button
                      onClick={handleDownloadLogoSvg}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-800 hover:text-white border border-slate-200 hover:border-slate-800 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                    >
                      SVG Vektör
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center justify-between">
                <span>Mevcut Logo Rengi:</span>
                <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                  {activeLogoTheme === 'theme' ? 'Dinamik' : (COLOR_PRESETS.find(p => p.id === activeLogoTheme)?.name || 'Storm Kırmızı')}
                </span>
              </div>
            </div>

            {/* Card 2: Firma ve Görünüm Ayarları */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Firma ve Görünüm Ayarları</h3>
                    <p className="text-xs text-slate-500 mt-0.5 leading-tight">Basılı evrakların üst kısmında yer alacak firma bilgileri ve logo seçenekleri.</p>
                  </div>
                </div>

                {printSettingsSuccess && (
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2 mb-4">
                    <Check size={14} />
                    {printSettingsSuccess}
                  </div>
                )}

                <div className="space-y-4 mt-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Logo Tipi</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setLogoType('text')} className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all ${logoType === 'text' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>✍️ Metin</button>
                      <button type="button" onClick={() => setLogoType('image')} className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all ${logoType === 'image' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>🖼️ Resim</button>
                    </div>
                  </div>

                  {logoType === 'image' && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Logo Görseli</label>
                      <div className="flex gap-2">
                        <input type="text" value={logoImageUrl} onChange={(e) => setLogoImageUrl(e.target.value)} className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="Resim linki (https://...)" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Firma İsmi</label>
                    <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="Firma Adı" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Telefon</label>
                    <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="05XX XXX XX XX" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Adres</label>
                    <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={2} className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none" placeholder="Adres" />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleSavePrintSettings}
                  className="flex items-center justify-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Save size={14} />
                  <span>Kaydet</span>
                </button>
              </div>
            </div>

            {/* Card: Yazı Boyutu */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <span className="font-serif font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Uygulama Yazı Boyutu</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Uygulama genelindeki metinlerin büyüklüğünü ayarlayın</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { id: 'small', name: 'Küçük', desc: '14px' },
                    { id: 'medium', name: 'Normal', desc: '16px' },
                    { id: 'large', name: 'Büyük', desc: '18px' },
                  ].map((preset) => {
                    const isSelected = appFontSize === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setAppFontSize(preset.id as 'small' | 'medium' | 'large');
                          localStorage.setItem('storm_muhasebe_font_size', preset.id);
                        }}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition cursor-pointer ${
                          isSelected 
                            ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <span className={`font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {preset.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Card 3: Sol Panel Arka Plan Rengi ve Deseni */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sol Panel Görünümü</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Sol taraftaki navigasyon panelinin arka plan rengi ve deseni</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  {/* Renk Seçimi */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Arka Plan Rengi</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {SIDEBAR_BG_PRESETS.map((preset) => {
                        const isSelected = sidebarBg === preset.value;
                        return (
                          <button
                            key={preset.id}
                            onClick={() => {
                              setSidebarBg(preset.value);
                              localStorage.setItem('storm_muhasebe_sidebar_bg', preset.value);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                              isSelected 
                                ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <span 
                              className="w-5 h-5 rounded-full block border border-black/5 shrink-0" 
                              style={{ backgroundColor: preset.value }}
                            />
                            <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                              {preset.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desen Seçimi ve Saydamlık */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Arka Plan Deseni</h4>
                    <div className="grid grid-cols-1 gap-2 mb-6">
                      {SIDEBAR_PATTERNS.map((pattern) => {
                        const isSelected = sidebarPattern === pattern.id;
                        return (
                          <button
                            key={pattern.id}
                            onClick={() => {
                              setSidebarPattern(pattern.id);
                              localStorage.setItem('storm_muhasebe_sidebar_pattern', pattern.id);
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition cursor-pointer ${
                              isSelected 
                                ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <span className={`text-xs font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>
                              {pattern.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Desen Saydamlığı</h4>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.01" 
                        value={sidebarPatternOpacity}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSidebarPatternOpacity(val);
                          localStorage.setItem('storm_muhasebe_sidebar_pattern_opacity', val.toString());
                        }}
                        className="flex-1 accent-teal-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold text-teal-700 bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200">
                        {Math.round(sidebarPatternOpacity * 100)}%
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Desen Rengi</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setSidebarPatternColor('white');
                          localStorage.setItem('storm_muhasebe_sidebar_pattern_color', 'white');
                        }}
                        className={`p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition ${
                          sidebarPatternColor === 'white' ? 'bg-teal-500/10 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Beyaz
                      </button>
                      <button
                        onClick={() => {
                          setSidebarPatternColor('black');
                          localStorage.setItem('storm_muhasebe_sidebar_pattern_color', 'black');
                        }}
                        className={`p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition ${
                          sidebarPatternColor === 'black' ? 'bg-teal-500/10 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Siyah
                      </button>
                      <button
                        onClick={() => {
                          setSidebarPatternColor('theme');
                          localStorage.setItem('storm_muhasebe_sidebar_pattern_color', 'theme');
                        }}
                        className={`p-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition ${
                          sidebarPatternColor === 'theme' ? 'bg-teal-500/10 border-teal-500 text-teal-700' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        Arayüz Rengi
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Sol Menü Sekme Yönetimi */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Menu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Sol Menü Sekme Yönetimi</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Sekmelerin sol paneldeki yerlerini değiştirin, istediğiniz sekmeleri gizleyin veya ekleyin</p>
                  </div>
                </div>

                <div className="mt-6 space-y-2 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                  {tabOrder.map((tabId, index) => {
                    const def = TAB_DEFS[tabId];
                    if (!def) return null;

                    const isHidden = hiddenTabs.includes(tabId);
                    const isFirst = index === 0;
                    const isLast = index === tabOrder.length - 1;
                    const isCritical = ['dashboard', 'ayarlar'].includes(tabId);

                    return (
                      <div
                        key={tabId}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isHidden 
                            ? 'bg-slate-50 border-slate-200 opacity-60' 
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isHidden ? 'bg-slate-200/50 text-slate-400' : 'bg-teal-500/10 text-teal-600'}`}>
                            {def.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">{def.label}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">TAB ID: {tabId.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            disabled={isCritical}
                            onClick={() => toggleTabVisibility(tabId)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
                              isCritical
                                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50'
                                : isHidden
                                ? 'bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 border border-teal-500/20 cursor-pointer active:scale-95'
                                : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/20 cursor-pointer active:scale-95'
                            }`}
                            title={isCritical ? 'Bu sekme sistem güvenliği için gizlenemez' : isHidden ? 'Menüde Göster' : 'Menüden Gizle'}
                          >
                            {isHidden ? (
                              <>
                                <Eye size={13} />
                                <span>Ekle (Göster)</span>
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} />
                                <span>Kaldır (Gizle)</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={isFirst}
                              onClick={() => moveTab(index, 'up')}
                              className={`p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 transition ${
                                isFirst ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                              }`}
                              title="Yukarı Taşı"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveTab(index, 'down')}
                              className={`p-1.5 rounded bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-300 transition ${
                                isLast ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                              }`}
                              title="Aşağı Taşı"
                            >
                              <ChevronDown size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <span>Ayarlar Tarayıcıya Otomatik Kaydedilir</span>
                  <button
                    onClick={() => {
                      const defaultOrder = ['dashboard', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'ceksenet', 'krediler', 'raporlar', 'ayarlar'];
                      setTabOrder(defaultOrder);
                      setHiddenTabs([]);
                      localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(defaultOrder));
                      localStorage.setItem('storm_muhasebe_hidden_tabs', JSON.stringify([]));
                      
                      // Also reset visual settings to user requested defaults
                      setActiveTheme('red');
                      localStorage.setItem('kolay_hesap_accent_theme', 'red');
                      
                      setActiveLogoTheme('theme');
                      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
                      
                      setSidebarBg('#1e293b');
                      localStorage.setItem('storm_muhasebe_sidebar_bg', '#1e293b');
                      
                      setSidebarPattern('crystal');
                      localStorage.setItem('storm_muhasebe_sidebar_pattern', 'crystal');
                      
                      setSidebarPatternOpacity(0.75);
                      localStorage.setItem('storm_muhasebe_sidebar_pattern_opacity', '0.75');
                      
                      setSidebarPatternColor('theme');
                      localStorage.setItem('storm_muhasebe_sidebar_pattern_color', 'theme');
                    }}
                    className="text-teal-600 hover:text-teal-700 font-bold transition uppercase tracking-widest text-[9px] hover:underline"
                  >
                    Varsayılan Düzen & Sıralamaya Dön
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Card 5: Kullanıcı Profil Ayarları */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Profil Ayarları</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Uygulama üzerindeki profil isminizi, resminizi ve şifrenizi (6 haneli PIN) değiştirin</p>
                  </div>
                </div>
                
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Firma / Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="Adınızı girin..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-slate-900 transition outline-none font-semibold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Profil Resmi (URL)</label>
                    <input
                      type="text"
                      value={profilePhoto}
                      onChange={(e) => setProfilePhoto(e.target.value)}
                      placeholder="https://... (Resim bağlantısı)"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-slate-900 transition outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Yeni PIN Şifresi (6 Hane)</label>
                    <input
                      type="password"
                      maxLength={6}
                      value={profilePassword}
                      onChange={(e) => setProfilePassword(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Değiştirmek istemiyorsanız boş bırakın"
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2 text-sm text-slate-900 transition outline-none font-semibold"
                    />
                  </div>
                </div>
                
                {settingsPasswordSuccess && (
                  <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-lg text-xs font-bold">
                    {settingsPasswordSuccess}
                  </div>
                )}
                {settingsPasswordError && (
                  <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold">
                    {settingsPasswordError}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={handleProfileUpdate}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <span>Bilgileri Güncelle</span>
                </button>
              </div>
            </div>
            
            {/* Card: Veri Güvenliği ve Yedekleme Yönetimi */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Veri Güvenliği ve Yedekleme Yönetimi</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Veritabanı dosyalarınızı yedekleyin veya eski yedekten verilerinizi geri yükleyin</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleManualBackup}
                  disabled={isBackupLoading}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition group cursor-pointer disabled:opacity-50"
                >
                  <Download className="text-blue-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Yedek Dosyası Oluştur (Manuel)</span>
                  <span className="text-[10px] text-slate-500 text-center">Aktif veritabanınızı güvenli bir konuma .db/.json dosyası olarak indirin</span>
                </button>
                
                <button
                  onClick={handleRestoreBackup}
                  disabled={isBackupLoading}
                  className="flex flex-col items-center justify-center p-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 hover:border-rose-300 transition group cursor-pointer disabled:opacity-50"
                >
                  <Upload className="text-rose-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                  <span className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-1">Yedekten Veri Yükle (Manuel)</span>
                  <span className="text-[10px] text-rose-600 font-bold text-center">Dikkat: Mevcut verileriniz silinecektir! Eski veritabanını yükler</span>
                </button>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="relative inline-flex items-center cursor-pointer" onClick={toggleAutoBackup}>
                    <input type="checkbox" className="sr-only peer" checked={autoBackupEnabled} readOnly />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">Otomatik Yedekleme</span>
                    <p className="text-[10px] text-slate-500">Sistem kapanırken (son 5 yedek tutulur)</p>
                  </div>
                </div>
                
                <button
                  onClick={handleOpenBackupFolder}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                >
                  <FolderOpen size={16} />
                  Otomatik Yedek Klasörünü Aç
                </button>
              </div>
              
              {backupMessage && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-bold whitespace-pre-wrap ${
                  backupMessage.type === 'success' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {backupMessage.text}
                </div>
              )}
            </div>

            {/* Card 2: Verileri Sıfırlama */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                    <RotateCcw size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider">Sistem Verilerini Sıfırla</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Tüm kayıtlı cari hesapları, stokları ve hareketleri temizleyin</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
                  Bu işlem STORM MUHASEBE üzerindeki tüm cari hesapları, stok durumlarını, finansal hareketleri ve çek/senet verilerini tamamen temizler. 
                  <strong className="block text-rose-600 mt-1 uppercase font-bold">Bu işlem geri alınamaz!</strong>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                <button
                  id="reset-database-btn-settings"
                  onClick={() => setResetModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <RotateCcw size={14} />
                  <span>Veritabanını Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === 'template-designer' && (
          <div className="animate-fade-in">
            <TemplateDesignerView />
          </div>
        )}

        {settingsSubTab === 'ai' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Yapay Zeka (AI) Ayarları</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sistem asistanı ve akıllı özellikler için Gemini API entegrasyonu</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gemini API Anahtarı (API Key)</label>
                  <button
                    onClick={() => setAiInfoModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition cursor-pointer"
                  >
                    <Info size={14} />
                    <span>Nasıl Alınır?</span>
                  </button>
                </div>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    localStorage.setItem('storm_muhasebe_gemini_api_key', e.target.value);
                  }}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-sm text-slate-900 transition outline-none font-mono"
                />
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                  Değişiklikler otomatik olarak tarayıcıya kaydedilir.
                </p>
              </div>
            </div>
          </div>
        )}

        {settingsSubTab === 'permissions' && (
          !isSecurityActive ? (
            <div className="bg-[#ffffff] p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center animate-fade-in my-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} />
              </div>
              
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wider">Yönetici & Personel Yetki Sistemi</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                Sistemi aktifleştirerek personelinizin hassas finansal verilere, kasalara ve raporlara erişmesini kısıtlayabilir; silme ve stok düşürme gibi kritik eylemleri şifreli izne bağlayabilirsiniz.
              </p>

              <div className="my-8 max-w-md mx-auto space-y-4 text-left border border-slate-100 bg-slate-50 p-5 rounded-2xl">
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Personelin görebileceği sekmeleri ve modülleri sınırlandırın.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Satış silme, ödeme silme ve stok kartı silme işlemlerini izne bağlayın.</p>
                </div>
                <div className="flex gap-3">
                  <span className="text-teal-600 mt-0.5 font-bold">✓</span>
                  <p className="text-xs text-slate-600">Sistem yetkilerini yükseltmek için 4 haneli Yönetici PIN belirleyin.</p>
                </div>
              </div>

              <div className="max-w-xs mx-auto space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block text-center">İlk Yönetici PIN Şifresini Belirleyin</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={initialPinInput}
                    onChange={(e) => setInitialPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••"
                    className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.6em] text-slate-900 transition outline-none font-mono"
                  />
                </div>

                {setupError && (
                  <p className="text-xs font-bold text-rose-500">{setupError}</p>
                )}

                <button
                  onClick={handleActivateSecurity}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                >
                  <Lock size={14} />
                  <span>Sistemi Aktifleştir</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Card 1: Yönetici PIN Değiştirme */}
              <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Yönetici Giriş PIN Değiştirme</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Yönetici yetkilerine yükselmek için kullanılan 4 haneli PIN şifresini güncelleyin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Mevcut Yönetici PIN Kodu</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={currentAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setCurrentAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-slate-900 transition outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Yeni Yönetici PIN Kodu (4 Hane)</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={newAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setNewAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-slate-900 transition outline-none font-mono"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Yeni Yönetici PIN Kodu Tekrar</label>
                      <input
                        type="password"
                        maxLength={4}
                        value={confirmAdminPinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setConfirmAdminPinInput(val);
                          setAdminPinChangeError(null);
                          setAdminPinChangeSuccess(null);
                        }}
                        placeholder="••••"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.5em] text-slate-900 transition outline-none font-mono"
                      />
                    </div>
                  </div>

                  {adminPinChangeSuccess && (
                    <div className="mt-4 p-3 bg-teal-50 border border-teal-200 text-teal-700 rounded-xl text-xs font-bold">
                      {adminPinChangeSuccess}
                    </div>
                  )}
                  {adminPinChangeError && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold">
                      {adminPinChangeError}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAdminPinChangeSubmit}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>PIN Güncelle</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Personel Yetkilendirme */}
              <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Personel Yetki Sınırlandırmaları</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Çalışan/personel rolündeki kullanıcıların hangi modüllere erişebileceğini belirleyin</p>
                    </div>
                  </div>

                  <div className="my-6 space-y-2">
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl leading-relaxed border border-slate-100">
                      💡 <strong>Not:</strong> Kilidi aktif olan modüllere çalışanlar doğrudan erişemez. Bu sekmelere tıklamak istediklerinde, geçici yükseltme için Yönetici PIN kodu istenir.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                      {Object.keys(TAB_DEFS).map((tabId) => {
                        const def = TAB_DEFS[tabId];
                        if (!def) return null;

                        const isLocked = tempSensitiveTabs.includes(tabId);
                        const isMandatory = tabId === 'ayarlar'; // Ayarlar must always be restricted

                        return (
                          <div
                            key={tabId}
                            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                              isLocked
                                ? 'bg-rose-50/40 border-rose-200/60 font-semibold'
                                : 'bg-emerald-50/10 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={isLocked ? 'text-rose-500' : 'text-emerald-500 scale-90 shrink-0'}>
                                {def.icon}
                              </div>
                              <span className="text-xs font-bold text-slate-700 truncate uppercase tracking-wide">
                                {def.label}
                              </span>
                            </div>

                            <button
                              type="button"
                              disabled={isMandatory}
                              onClick={() => {
                                if (isLocked) {
                                  setTempSensitiveTabs(tempSensitiveTabs.filter((t) => t !== tabId));
                                } else {
                                  setTempSensitiveTabs([...tempSensitiveTabs, tabId]);
                                }
                              }}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] uppercase font-extrabold tracking-wider transition ${
                                isMandatory
                                  ? 'bg-rose-100 text-rose-600 border border-rose-200 cursor-not-allowed font-black'
                                  : isLocked
                                  ? 'bg-rose-600 text-white hover:bg-rose-700 cursor-pointer shadow-xs active:scale-95'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer hover:text-slate-700 active:scale-95'
                              }`}
                            >
                              {isMandatory ? (
                                <>
                                  <Lock size={10} />
                                  <span>Zorunlu</span>
                                </>
                              ) : isLocked ? (
                                <>
                                  <Lock size={10} />
                                  <span>Kilitli</span>
                                </>
                              ) : (
                                <>
                                  <Unlock size={10} />
                                  <span>Açık</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      // Reset to standard defaults
                      setTempSensitiveTabs(['dashboard', 'kasa', 'ceksenet', 'masraflar', 'calisanlar', 'krediler', 'raporlar', 'ayarlar']);
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-wider cursor-pointer"
                  >
                    Varsayılana Dön
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        // Force ayarlar to be in the restricted tabs just in case
                        let finalRestricted = [...tempSensitiveTabs];
                        if (!finalRestricted.includes('ayarlar')) {
                          finalRestricted.push('ayarlar');
                        }
                        localStorage.setItem('storm_muhasebe_sensitive_tabs', JSON.stringify(finalRestricted));
                        setSensitiveTabs(finalRestricted);
                        showToast('Personel yetki sınırlandırmaları başarıyla güncellendi.', 'success');
                      } catch (err: any) {
                        reportErrorToTelegram(err, 'SaveSensitiveTabs');
                        showToast('Yetkiler kaydedilirken hata oluştu!', 'error');
                      }
                    }}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>Yetkileri Kaydet</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Personel Detaylı Eylem Yetkileri */}
              <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Personel Hassas Eylem Yetkileri</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Çalışan rolündeki kullanıcıların gerçekleştirebileceği kritik eylemleri yetkilendirin</p>
                    </div>
                  </div>

                  <div className="my-6 space-y-4">
                    <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl leading-relaxed border border-slate-100">
                      💡 <strong>Bilgi:</strong> Aşağıdaki seçenekler <strong>işaretli olduğunda</strong> çalışanlar bu eylemi gerçekleştirebilir. İşaret <strong>kaldırıldığında</strong>, eylem sırasında Yönetici PIN şifresi doğrulaması istenir.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Yetki 1: Satış Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_sale}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_sale: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Satış Silme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların satış ve satış iade faturası/işlemlerini silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 5: Satış Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_sale}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_sale: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Satış Düzenleme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların satış ve satış iade faturası/işlemlerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 2: Ödeme/Tahsilat Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_payment}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_payment: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Ödeme ve Tahsilat Silme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların tahsilat, ödeme, alış ve alış iade işlemlerini silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 6: Ödeme/Tahsilat Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_payment}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_payment: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Ödeme ve Tahsilat Düzenleme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların tahsilat, ödeme, alış ve alış iade işlemlerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 3: Stok Silme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.delete_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            delete_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Stok Kartı Silme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların mevcut ürün veya hizmet stok kartlarını silmesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 7: Stok Düzenleme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.edit_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            edit_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Stok Kartı Düzenleme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların mevcut ürün veya hizmet stok kartı bilgilerini düzenlemesine izin ver.</span>
                        </div>
                      </label>

                      {/* Yetki 4: Stok Düşürme */}
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tempActionPermissions.decrease_stock}
                          onChange={(e) => setTempActionPermissions({
                            ...tempActionPermissions,
                            decrease_stock: e.target.checked
                          })}
                          className="mt-1 accent-teal-600 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Stok Azaltma/Düşürme İzni</span>
                          <span className="text-[11px] text-slate-500 mt-0.5 block leading-normal">Çalışanların stok kartlarındaki mevcut miktarları manuel olarak azaltmasına izin ver.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setTempActionPermissions({
                        delete_sale: false,
                        delete_payment: false,
                        delete_stock: false,
                        decrease_stock: false,
                        edit_sale: false,
                        edit_payment: false,
                        edit_stock: false,
                      });
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition uppercase tracking-wider cursor-pointer"
                  >
                    Tümünü Kısıtla
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveActionPermissionsSubmit}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                  >
                    <Save size={14} />
                    <span>Eylem Yetkilerini Kaydet</span>
                  </button>
                </div>
              </div>

              {/* Card 4: Güvenlik Sistemini Devre Dışı Bırak */}
              <div className="bg-[#ffffff] p-6 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between col-span-1 md:col-span-2">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                      <ShieldAlert size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider">Güvenlik ve Yetki Sistemini Kapat</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Yönetici şifresi ve tüm personel yetki kısıtlamalarını tamamen devre dışı bırakın</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mt-4 bg-rose-500/5 border border-rose-500/10 p-3.5 rounded-xl">
                    Sistemi kapattığınızda, çalışanlarınız ve personeliniz şifresiz olarak her modüle erişebilir ve tüm kritik işlemleri (silme, stok düşürme vb.) gerçekleştirebilir.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeactivateSecurity}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition cursor-pointer shadow-md hover:shadow-lg active:scale-98 ${
                      confirmDeactivate ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse' : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    <Lock size={14} />
                    <span>{confirmDeactivate ? 'Devre Dışı Bırakmayı Onayla!' : 'Güvenlik Sistemini Devre Dışı Bırak'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        )}

        {settingsSubTab === 'shortcuts' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header / Info box */}
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Keyboard size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider">Hızlı Erişim Kısayol Tuşları</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Sık kullandığınız işlemleri veya modül geçişlerini tek tuşla tetiklemek için özel kısayollar atayabilirsiniz. 
                      Kaydetmek istediğiniz kısayolun üzerindeki "Düzenle" butonuna tıklayın, ardından klavyenizdeki tuş kombinasyonuna (örneğin <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px]">Alt + S</kbd>) basın.
                    </p>
                    <p className="text-[11px] text-rose-500 font-semibold mt-2">
                      ⚠️ Not: Kısayol tuşları, bir metin alanına (girdi kutuları, açıklama alanları vb.) yazı yazarken kazara tetiklenmeyi önlemek amacıyla otomatik olarak devre dışı kalır.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetShortcuts}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                >
                  <RotateCcw size={14} />
                  <span>Varsayılana Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Categorized shortcuts */}
            {['Hızlı İşlemler', 'Modül Navigasyonu'].map(category => {
              const catShortcuts = shortcuts.filter(s => s.category === category);
              return (
                <div key={category} className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-teal-600 rounded-full"></span>
                    {category}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catShortcuts.map(s => {
                      const isEditing = editingShortcutId === s.id;
                      return (
                        <div 
                          key={s.id} 
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                            isEditing 
                              ? 'border-teal-500 bg-teal-5/20 ring-2 ring-teal-500/20' 
                              : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex-1 pr-4">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                              {s.name}
                            </span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              ID: {s.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <div 
                                tabIndex={0}
                                onKeyDown={(e) => handleShortcutKeyDown(e, s.id)}
                                className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold font-mono animate-pulse cursor-pointer outline-none ring-2 ring-teal-500 ring-offset-2 flex items-center gap-2"
                              >
                                <span>Tuş Bekleniyor...</span>
                                <span className="text-[9px] bg-teal-700 px-1 py-0.5 rounded uppercase">Esc: İptal</span>
                              </div>
                            ) : (
                              <>
                                <span className="px-3 py-1.5 bg-[#ffffff] border border-slate-200 text-slate-800 rounded-lg text-xs font-extrabold font-mono shadow-sm">
                                  {formatShortcutDisplay(s)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditingShortcutId(s.id)}
                                  className="p-1.5 hover:bg-teal-50 hover:text-teal-600 text-slate-400 hover:scale-105 rounded-lg transition cursor-pointer"
                                  title="Kısayolu Düzenle"
                                >
                                  <Palette size={14} />
                                </button>
                                {s.key && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearShortcut(s.id)}
                                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 hover:scale-105 rounded-lg transition cursor-pointer"
                                    title="Kısayolu Temizle"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* AI Settings Info Modal */}
      {aiInfoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-200 animate-slide-up relative">
            <button 
              onClick={() => setAiInfoModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition cursor-pointer z-10"
            >
              <X size={20} />
            </button>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Gemini API Anahtarı Nasıl Alınır?</h3>
                  <p className="text-sm text-slate-500 font-medium mt-0.5">Kendi Yapay Zeka anahtarınızı oluşturmak için aşağıdaki adımları izleyin.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">1</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    <a 
                      href="https://aistudio.google.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-teal-600 font-semibold hover:underline inline-flex items-center gap-1 group"
                      onClick={(e) => {
                        if (window.electronAPI && (window.electronAPI as any).openExternal) {
                          e.preventDefault();
                          (window.electronAPI as any).openExternal('https://aistudio.google.com');
                        }
                      }}
                    >
                      Google AI Studio <ExternalLink size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a> adresine gidin ve Google hesabınızla giriş yapın.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">2</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Sol menüden <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">Get API Key</strong> butonuna tıklayarak yeni bir anahtar oluşturun.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">3</div>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    Oluşturduğunuz uzun şifreyi (API Key) kopyalayıp buradaki alana yapıştırın.
                  </p>
                </div>
              </div>

              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <Info size={20} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-1.5">Kritik Not</h4>
                  <p className="text-[13px] text-amber-700/90 leading-relaxed font-medium">
                    Günlük standart muhasebe işlemleriniz için Google'ın sunduğu <strong>'Ücretsiz (Free)'</strong> paket fazlasıyla yeterlidir. Ancak çok yoğun işlem hacmine sahip bir firmaysanız, kendi Google hesabınız üzerinden <strong>'Pro/Ücretli'</strong> pakete geçiş yaparak aynı anahtarla limitlere takılmadan asistanı kullanmaya devam edebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50/80 border-t border-slate-100 p-4 flex justify-end">
              <button 
                onClick={() => setAiInfoModalOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                Anladım, Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
