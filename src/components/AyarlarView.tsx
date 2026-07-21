import { ShortcutsSettings } from './settings/ShortcutsSettings';
import { PermissionsSettings } from './settings/PermissionsSettings';
import { AiSettings } from './settings/AiSettings';
import { ProfileSettings } from './settings/ProfileSettings';
import { GeneralSettings } from './settings/GeneralSettings';
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
  Keyboard,
  Sparkles
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
} from '../constants';

export interface AyarlarViewProps {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  designStyle: string;
  setDesignStyle: (style: string) => void;
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
  isAiEnabled: boolean;
  setIsAiEnabled: (enabled: boolean) => void;
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
  onOpenBackupWizard?: () => void;
}

export default function AyarlarView({
  activeTheme,
  setActiveTheme,
  designStyle,
  setDesignStyle,
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
  isAiEnabled,
  setIsAiEnabled,
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
  setShortcuts,
  onOpenBackupWizard
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
          <GeneralSettings
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            designStyle={designStyle}
            setDesignStyle={setDesignStyle}
            activeLogoTheme={activeLogoTheme}
            setActiveLogoTheme={setActiveLogoTheme}
            appFontSize={appFontSize}
            setAppFontSize={setAppFontSize}
            sidebarBg={sidebarBg}
            setSidebarBg={setSidebarBg}
            sidebarPattern={sidebarPattern}
            setSidebarPattern={setSidebarPattern}
            sidebarPatternOpacity={sidebarPatternOpacity}
            setSidebarPatternOpacity={setSidebarPatternOpacity}
            sidebarPatternColor={sidebarPatternColor}
            setSidebarPatternColor={setSidebarPatternColor}
            tabOrder={tabOrder}
            setTabOrder={setTabOrder}
            hiddenTabs={hiddenTabs}
            setHiddenTabs={setHiddenTabs}
            toggleTabVisibility={toggleTabVisibility}
            moveTab={moveTab}
            companyName={companyName}
            setCompanyName={setCompanyName}
            companyPhone={companyPhone}
            setCompanyPhone={setCompanyPhone}
            companyAddress={companyAddress}
            setCompanyAddress={setCompanyAddress}
            logoType={logoType}
            setLogoType={setLogoType}
            logoImageUrl={logoImageUrl}
            setLogoImageUrl={setLogoImageUrl}
            handleDownloadLogoPng={handleDownloadLogoPng}
            handleDownloadLogoSvg={handleDownloadLogoSvg}
            currentThemeData={currentThemeData}
            showToast={showToast}
            handleSavePrintSettings={handleSavePrintSettings}
            printSettingsSuccess={printSettingsSuccess}
          />
        )}
        {settingsSubTab === 'profile' && (
          <ProfileSettings
            profileName={profileName}
            setProfileName={setProfileName}
            profilePhoto={profilePhoto}
            setProfilePhoto={setProfilePhoto}
            profilePassword={profilePassword}
            setProfilePassword={setProfilePassword}
            settingsPasswordSuccess={settingsPasswordSuccess}
            settingsPasswordError={settingsPasswordError}
            handleProfileUpdate={handleProfileUpdate}
            handleManualBackup={handleManualBackup}
            handleRestoreBackup={handleRestoreBackup}
            isBackupLoading={isBackupLoading}
            toggleAutoBackup={toggleAutoBackup}
            autoBackupEnabled={autoBackupEnabled}
            handleOpenBackupFolder={handleOpenBackupFolder}
            backupMessage={backupMessage}
            setResetModalOpen={setResetModalOpen}
            onOpenBackupWizard={onOpenBackupWizard}
          />
        )}
        {settingsSubTab === 'template-designer' && (
          <div className="animate-fade-in">
            <TemplateDesignerView />
          </div>
        )}

        {settingsSubTab === 'ai' && (
          <AiSettings
            geminiApiKey={geminiApiKey}
            setGeminiApiKey={setGeminiApiKey}
            setAiInfoModalOpen={setAiInfoModalOpen}
            isAiEnabled={isAiEnabled}
            setIsAiEnabled={setIsAiEnabled}
          />
        )}
        {settingsSubTab === 'permissions' && (
          <PermissionsSettings
            showToast={showToast}
            isSecurityActive={isSecurityActive}
            initialPinInput={initialPinInput}
            setInitialPinInput={setInitialPinInput}
            setupError={setupError}
            handleActivateSecurity={handleActivateSecurity}
            currentAdminPinInput={currentAdminPinInput}
            setCurrentAdminPinInput={setCurrentAdminPinInput}
            newAdminPinInput={newAdminPinInput}
            setNewAdminPinInput={setNewAdminPinInput}
            confirmAdminPinInput={confirmAdminPinInput}
            setConfirmAdminPinInput={setConfirmAdminPinInput}
            handleAdminPinChangeSubmit={handleAdminPinChangeSubmit}
            adminPinChangeSuccess={adminPinChangeSuccess}
            adminPinChangeError={adminPinChangeError}
            tempSensitiveTabs={tempSensitiveTabs}
            setTempSensitiveTabs={setTempSensitiveTabs}
            tempActionPermissions={tempActionPermissions}
            setTempActionPermissions={setTempActionPermissions}
            handleSaveActionPermissionsSubmit={handleSaveActionPermissionsSubmit}
            confirmDeactivate={confirmDeactivate}
            setConfirmDeactivate={setConfirmDeactivate}
            handleDeactivateSecurity={handleDeactivateSecurity}
            setAdminPinChangeError={setAdminPinChangeError}
            setAdminPinChangeSuccess={setAdminPinChangeSuccess}
            setSensitiveTabs={setSensitiveTabs}
          />
        )}
        {settingsSubTab === 'shortcuts' && (
          <ShortcutsSettings
            shortcuts={shortcuts}
            setShortcuts={setShortcuts}
            editingShortcutId={editingShortcutId}
            setEditingShortcutId={setEditingShortcutId}
            handleShortcutKeyDown={handleShortcutKeyDown}
            handleClearShortcut={handleClearShortcut}
            handleResetShortcuts={handleResetShortcuts}
          />
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
