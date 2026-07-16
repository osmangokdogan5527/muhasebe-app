import React, { useState, useEffect, useMemo } from 'react';
import { useAppSettings } from './hooks/useAppSettings';
import { useAppData } from './hooks/useAppData';
import { useAppAuth } from './hooks/useAppAuth';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { usePrintSettings } from './hooks/usePrintSettings';
import { useBackupActions } from './hooks/useBackupActions';
import { useLogoActions } from './hooks/useLogoActions';
import { renderToStaticMarkup } from 'react-dom/server';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit, BankAccount, AccountTransaction, KeyboardShortcut } from './types';
import { 
  subscribeCariler, 
  subscribeStoklar, 
  subscribeIslemler, 
  subscribeCekSenet, 
  clearAllDatabaseData, 
  subscribeExpenses, 
  subscribeEmployees, 
  subscribeEmployeeTransactions,
  subscribeCredits,
  subscribeBankAccounts,
  subscribeAccountTransactions,
  auth,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User as FirebaseUser,
  setActiveUser,
  saveBankAccount
} from './firebase';
import DashboardView from './components/DashboardView';
import CarilerView from './components/CarilerView';
import StoklarView from './components/StoklarView';
import IslemlerView from './components/IslemlerView';
import CekSenetView from './components/CekSenetView';
import MasraflarView from './components/MasraflarView';
import CalisanlarView from './components/CalisanlarView';
import KasaView from './components/KasaView';
import KredilerView from './components/KredilerView';
import RaporlarView from './components/RaporlarView';
import { GlobalStyles } from "./components/GlobalStyles";
import YetkisizErisimView from './components/YetkisizErisimView';
import AyarlarView from './components/AyarlarView';
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AuthScreen } from "./components/AuthScreen";
import { LoadingScreen } from "./components/LoadingScreen";
import { AppModals } from "./components/AppModals";
import { 
   
   
  Cloud, 
  CloudLightning,

  X,
  User,


  
  RotateCcw,
  
  
  ChevronUp,
  ChevronDown,
  
  Check,
  AlertTriangle,
  Shield,



  Trash2,

  Download,
  
  MessageSquare,

} from 'lucide-react';
import { compressImage } from './utils/imageCompressor';

import { StormLogo, APP_VERSION, CHANGELOG, PREDEFINED_USERS, COLOR_PRESETS, TAB_DEFS, SIDEBAR_PATTERNS, PIN_ACCOUNTS, changelogData, DEFAULT_SHORTCUTS } from "./constants";
export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cariler' | 'stoklar' | 'islemler' | 'ceksenet' | 'masraflar' | 'calisanlar' | 'ayarlar' | 'kasa' | 'raporlar' | 'krediler'>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'employee'>('employee');
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const [pendingIslemModal, setPendingIslemModal] = useState<'sale' | 'purchase' | 'collection' | 'payment' | null>(null);
  const [pendingCariId, setPendingCariId] = useState<string | null>(null);
  const [selectedCariIdForDetails, setSelectedCariIdForDetails] = useState<string | null>(null);
  const [pendingAddCari, setPendingAddCari] = useState<boolean>(false);
  const [pendingAddStock, setPendingAddStock] = useState<boolean>(false);
  const [isIslemlerSubMenuOpen, setIsIslemlerSubMenuOpen] = useState(false);

  const {
    activeTheme, setActiveTheme,
    designStyle, setDesignStyle,
    activeLogoTheme, setActiveLogoTheme,
    appFontSize, setAppFontSize,
    sidebarBg, setSidebarBg,
    sidebarPattern, setSidebarPattern,
    sidebarPatternOpacity, setSidebarPatternOpacity,
    sidebarPatternColor, setSidebarPatternColor,
    hiddenTabs, setHiddenTabs, toggleTabVisibility,
    tabOrder, setTabOrder, moveTab,
    geminiApiKey, setGeminiApiKey,
    autoBackupEnabled, setAutoBackupEnabled
  } = useAppSettings();

  const {
    isBackupLoading,
    backupMessage,
    setBackupMessage,
    handleManualBackup,
    handleRestoreBackup,
    toggleAutoBackup,
    handleOpenBackupFolder
  } = useBackupActions(showToast, autoBackupEnabled, setAutoBackupEnabled);

  const {
    handleDownloadLogoSvg,
    handleDownloadLogoPng
  } = useLogoActions(
    activeLogoTheme,
    activeTheme,
    sidebarPattern,
    sidebarPatternOpacity,
    designStyle,
    sidebarBg
  );

  
  // Auth state variables
  const {
    user, setUser,
    authLoading, setAuthLoading,
    authError, setAuthError,
    enteredPin, setEnteredPin,
    handlePinLogin, handleSignOut
  } = useAppAuth(showToast, setUserRole, setActiveTab);

  
  // Admin Dashboard State
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState<'error' | 'feature'>('error');
  const [feedbackImage, setFeedbackImage] = useState<string | null>(null);
  const [feedbackImageLoading, setFeedbackImageLoading] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Init users from localStorage or predefined
  const [usersList, setUsersList] = useState<any[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Map PREDEFINED_USERS so any code updates (like name or ID changes) are reflected,
        // but retain customized fields like photoURL and explicitly changed pins/names
        return PREDEFINED_USERS.map(defaultUser => {
          // Check for exact ID match or old ID match (company_3 -> firma_1 etc)
          let matchId = defaultUser.id;
          if (defaultUser.id === 'firma_1') matchId = 'company_3';
          if (defaultUser.id === 'firma_2') matchId = 'company_4';
          if (defaultUser.id === 'firma_3') matchId = 'company_5';
          
          const savedUser = parsed.find((u: any) => u.id === defaultUser.id || u.id === matchId);
          if (savedUser) {
            // Only use saved name/pin if they were actually customized from the old default
            const oldDefaults: any = {
              'admin': { name: 'Yönetici', pin: '270212' },
              'muhasebe': { name: 'Muhasebe Departmanı', pin: '041646' },
              'company_3': { name: 'Kullanıcı 3', pin: '111111' },
              'company_4': { name: 'Kullanıcı 4', pin: '222222' },
              'company_5': { name: 'Kullanıcı 5', pin: '333333' }
            };
            const isNameCustomized = oldDefaults[matchId] && savedUser.name !== oldDefaults[matchId].name && savedUser.name !== defaultUser.name;
            const isPinCustomized = oldDefaults[matchId] && savedUser.pin !== oldDefaults[matchId].pin && savedUser.pin !== defaultUser.pin;
            
            return {
              ...defaultUser,
              name: isNameCustomized ? savedUser.name : defaultUser.name,
              pin: isPinCustomized ? savedUser.pin : defaultUser.pin,
              photoURL: savedUser.photoURL || ''
            };
          }
          return defaultUser;
        });
      } catch (e) {}
    }
    return PREDEFINED_USERS;
  });

  const [selectedPinAccount, setSelectedPinAccount] = useState<typeof PREDEFINED_USERS[0] | null>(null);

  // Settings password variables
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState<string | null>(null);
  const [settingsPasswordError, setSettingsPasswordError] = useState<string | null>(null);

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  // Dynamic permissions and admin PIN states
  const [sensitiveTabs, setSensitiveTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_sensitive_tabs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return ['dashboard', 'kasa', 'ceksenet', 'masraflar', 'calisanlar', 'krediler', 'raporlar', 'ayarlar'];
  });

  const [escalationPin, setEscalationPin] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_admin_pin') || '1923';
  });

  const [isSecurityActive, setIsSecurityActive] = useState<boolean>(() => {
    return localStorage.getItem('storm_muhasebe_security_active') === 'true';
  });

  // Dynamic action-level permissions for employees (true means ALLOWED, false means RESTRICTED)
  const [actionPermissions, setActionPermissions] = useState<{
    delete_sale: boolean;
    delete_payment: boolean;
    delete_stock: boolean;
    decrease_stock: boolean;
    edit_sale: boolean;
    edit_payment: boolean;
    edit_stock: boolean;
  }>(() => {
    const saved = localStorage.getItem('storm_muhasebe_action_permissions');
    const defaultPerms = {
      delete_sale: false,
      delete_payment: false,
      delete_stock: false,
      decrease_stock: false,
      edit_sale: false,
      edit_payment: false,
      edit_stock: false,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultPerms, ...parsed };
      } catch (e) {
        // ignore
      }
    }
    return defaultPerms;
  });

  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfilePhoto((user as any).photoURL || '');
    }
  }, [user]);


  // Global hardware barcode scanner listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Ignore standard modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }

      // If it's a single printable character (length is 1), record it
      if (e.key.length === 1) {
        // If the typing speed is slow (> 50ms), reset the buffer to only keep the current character.
        // Humans cannot type with < 50ms consistently. Hardware scanners type at < 15ms.
        if (timeDiff > 50) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      } else if (e.key === 'Enter') {
        // When Enter is pressed, if we have built up a rapid barcode sequence, trigger the event
        if (buffer.length >= 4 && timeDiff < 50) {
          e.preventDefault();
          const scannedCode = buffer.trim();
          buffer = '';
          
          const event = new CustomEvent('global-hardware-barcode-scan', {
            detail: { code: scannedCode }
          });
          window.dispatchEvent(event);
        } else {
          buffer = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true); // useCapture to intercept early before active inputs
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);


  const handleNavigate = (tabId: string) => {
    if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(tabId)) {
      setAdminPinError(null);
      setAdminPinInput('');
      setIsAdminPinModalOpen(true);
      return;
    }
    setActiveTab(tabId as any);
  };
  const { shortcuts, setShortcuts } = useAppShortcuts(handleNavigate, setPendingIslemModal, setPendingAddCari, setPendingAddStock);
  const [aiPrefilledData, setAiPrefilledData] = useState<{
    islem: 'sale' | 'purchase' | 'collection' | 'payment' | 'expense' | 'employee_payment' | 'sale_return' | 'purchase_return' | 'add_customer' | 'add_supplier' | 'add_product' | string;
    cariAdi?: string;
    urunAdi?: string;
    miktar?: number;
    fiyat?: number;
    kdv?: number;
    code?: string;
    barcode?: string;
    unit?: string;
    purchasePrice?: number;
    salesPrice?: number;
    minQuantity?: number;
    phone?: string;
    email?: string;
    address?: string;
    bakiye?: number;
    currency?: string;
    taxOffice?: string;
    taxNo?: string;
  } | null>(null);

  const {
    companyName, setCompanyName,
    companyAddress, setCompanyAddress,
    companyPhone, setCompanyPhone,
    logoType, setLogoType,
    logoImageUrl, setLogoImageUrl,
    printSettingsSuccess, handleSavePrintSettings
  } = usePrintSettings();


  useEffect(() => {
    let size = '16px';
    if (appFontSize === 'small') size = '14px';
    if (appFontSize === 'large') size = '18px';
    document.documentElement.style.setProperty('--app-font-size', size);
  }, [appFontSize]);



  // Web Simulator Splash Screen State
  const [isWebSplashLoading, setIsWebSplashLoading] = useState(true);
  const [webSplashProgress, setWebSplashProgress] = useState(0);
  const [webSplashMessage, setWebSplashMessage] = useState('Başlatılıyor...');

  useEffect(() => {
    // Only simulate splash screen if we are not running inside Electron
    // In Electron, the native splash window handles this before React even loads.
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    if (isElectron) {
      setIsWebSplashLoading(false);
      return;
    }

    let progress = 0;
    setWebSplashMessage('Sürüm kontrolü yapılıyor...');
    
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress > 100) progress = 100;
      setWebSplashProgress(progress);
      
      if (progress === 10) setWebSplashMessage('Sunucuyla bağlantı kuruluyor...');
      if (progress === 30) setWebSplashMessage('Yeni bir güncelleme aranıyor...');
      if (progress === 60) setWebSplashMessage('Güncellemeler denetleniyor...');
      if (progress >= 100) {
        setWebSplashMessage('Uygulama başlatılıyor...');
        clearInterval(interval);
        setTimeout(() => setIsWebSplashLoading(false), 600);
      }
    }, 150);
    
    return () => clearInterval(interval);
  }, []);

  // Update notification state
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded'>('idle');
  const [updatePercent, setUpdatePercent] = useState<number>(0);
  const [_updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [availableUpdateVersion, _setAvailableUpdateVersion] = useState<string>('');

  // Changelog state
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== APP_VERSION) {
      setShowChangelog(true);
    }
  }, []);

  const handleCloseChangelog = () => {
    localStorage.setItem('app_version', APP_VERSION);
    setShowChangelog(false);
  };

  // Listen for auto update events
  useEffect(() => {
    let cleanupProgress: (() => void) | undefined;
    let cleanupDownloaded: (() => void) | undefined;
    let cleanupError: (() => void) | undefined;

    if (window.electronAPI) {
      if ((window.electronAPI as any).onDownloadProgress) {
        cleanupProgress = (window.electronAPI as any).onDownloadProgress((percent: number) => {
          setUpdatePercent(percent);
          setUpdateStatus('downloading');
        });
      }
      if (window.electronAPI.onUpdateDownloaded) {
        cleanupDownloaded = window.electronAPI.onUpdateDownloaded(() => {
          setUpdateStatus('downloaded');
        });
      }
      if ((window.electronAPI as any).onUpdateError) {
        cleanupError = (window.electronAPI as any).onUpdateError((error: string) => {
          setUpdateError(error);
          setUpdateStatus('idle'); // Hata durumunda idle'a dön
          // Opsiyonel olarak bir alert gösterebiliriz
          alert(`Güncelleme indirilirken hata oluştu:\n${error}`);
        });
      }
    }
    
    return () => {
      if (cleanupProgress) cleanupProgress();
      if (cleanupDownloaded) cleanupDownloaded();
      if (cleanupError) cleanupError();
    };
  }, []);

  const {
    cariler, setCariler,
    stoklar, setStoklar,
    islemler, setIslemler,
    ceksenet, setCeksenet,
    expenses, setExpenses,
    employees, setEmployees,
    employeeTransactions, setEmployeeTransactions,
    credits, setCredits,
    bankAccounts, setBankAccounts,
    accountTransactions, setAccountTransactions,
    loading, setLoading
  } = useAppData(user);





  useEffect(() => {
    if (!user) return;
    // 1. Update in the user list so that it shows on the login screen
    const updatedUsers = usersList.map(u => {
      if (u.id === user?.uid) {
        return {
          ...u,
          name: profileName || user.displayName || u.name,
          photoURL: profilePhoto || (user as any).photoURL || u.photoURL
        };
      }
      return u;
    });
    localStorage.setItem('storm_muhasebe_users', JSON.stringify(updatedUsers));
    // 2. Update the active logged in user in localStorage
    const updatedUser = {
      ...user,
      displayName: profileName || user.displayName,
      photoURL: profilePhoto || (user as any).photoURL
    };
    localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(updatedUser));
  }, [user, profileName, profilePhoto, usersList]);







  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
  const themeCssRules = React.useMemo(() => {
    let rules = Object.entries(currentThemeData.colors)
      .map(([key, value]) => `${key}: ${value};`)
      .join('\n');
      
    const accent500 = (currentThemeData.colors as any)['--accent-500'];
    if (accent500 && accent500.startsWith('#')) {
      const hex = accent500.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      rules += `\n--accent-rgb: ${r}, ${g}, ${b};`;
    }
    return rules;
  }, [currentThemeData]);
  const activePatternObj = SIDEBAR_PATTERNS.find(p => p.id === sidebarPattern) || SIDEBAR_PATTERNS[0];
  const bodyPatternSvg = activePatternObj.svg
    ? activePatternObj.svg
        .replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
        .replace(/OPACITY/g, (sidebarPatternOpacity * 0.5).toString()) // Slightly lower opacity for body
    : '';
  const isLightSidebar = sidebarBg === '#ffffff';
    const sidebarPatternStyle = sidebarPattern !== 'none' && sidebarPatternOpacity > 0 ? {
    backgroundImage: activePatternObj.svg
      ?.replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
      ?.replace(/OPACITY/g, sidebarPatternOpacity.toString()),
    backgroundSize: activePatternObj.size || 'auto'
  } : {};
  

  const renderWorkspaceView = (id: string, content: any) => (
    <div className={`w-full max-w-7xl mx-auto ${isLightSidebar ? 'text-gray-800' : 'text-gray-100'} transition-colors duration-300`}>
      {content}
    </div>
  );

  const renderSettingsView = () => (
    <AyarlarView
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
      handleDownloadLogoPng={handleDownloadLogoPng}
      handleDownloadLogoSvg={handleDownloadLogoSvg}
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
      handleSavePrintSettings={handleSavePrintSettings}
      printSettingsSuccess={printSettingsSuccess}
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
      isBackupLoading={isBackupLoading}
      handleRestoreBackup={handleRestoreBackup}
      toggleAutoBackup={toggleAutoBackup}
      autoBackupEnabled={autoBackupEnabled}
      handleOpenBackupFolder={handleOpenBackupFolder}
      backupMessage={backupMessage}
      setResetModalOpen={setResetModalOpen}
      geminiApiKey={geminiApiKey}
      setGeminiApiKey={setGeminiApiKey}
      isSecurityActive={isSecurityActive}
      setIsSecurityActive={setIsSecurityActive}
      userRole={userRole}
      setUserRole={setUserRole}
      escalationPin={escalationPin}
      setEscalationPin={setEscalationPin}
      showToast={showToast}
      actionPermissions={actionPermissions}
      setActionPermissions={setActionPermissions}
      sensitiveTabs={sensitiveTabs}
      setSensitiveTabs={setSensitiveTabs}
      shortcuts={shortcuts}
      setShortcuts={setShortcuts}
    />
  );

  const handleResetAllData = async () => {
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

  if (!user) {
    return (
      <AuthScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        selectedPinAccount={selectedPinAccount}
        setSelectedPinAccount={setSelectedPinAccount}
        usersList={usersList}
        enteredPin={enteredPin}
        setEnteredPin={setEnteredPin}
        authError={authError}
        setAuthError={setAuthError}
        setUserRole={setUserRole}
        setActiveTab={setActiveTab}
        setActiveUser={setActiveUser}
        setUser={setUser}
        showAdminLogin={showAdminLogin}
        setShowAdminLogin={setShowAdminLogin}
        adminPin={adminPin}
        setAdminPin={setAdminPin}
        adminAuthError={adminAuthError}
        setAdminAuthError={setAdminAuthError}
        showAdminDashboard={showAdminDashboard}
        setShowAdminDashboard={setShowAdminDashboard}
        errorLogs={errorLogs}
        setErrorLogs={setErrorLogs}
        feedbackList={feedbackList}
        setFeedbackList={setFeedbackList}
        updateStatus={updateStatus}
        setUpdateStatus={setUpdateStatus}
        updatePercent={updatePercent}
        changelogData={changelogData}
        setZoomImage={setZoomImage}
      />
    );
  }

  if (loading) {
    return (
      <LoadingScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
      />
    );
  }
  return (
    <div data-design-style={designStyle} className={`min-h-screen relative ${(currentThemeData as any).bgClass || 'bg-[#050505]'} text-[#e0e0e0] flex flex-col md:flex-row font-sans overflow-x-hidden`}>
      <GlobalStyles themeCssRules={themeCssRules} bodyPatternSvg={bodyPatternSvg} activePattern={activePatternObj} />

      {designStyle === 'fluid-mesh' && (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 select-none">
          {/* Base deep purple/black background */}
          <div className="absolute inset-0 bg-[#06040e]" />
          {/* Floating fluid blobs with blur */}
          <div className="absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 opacity-[0.35] blur-[120px] animate-mesh-float-1" />
          <div className="absolute -bottom-1/4 -right-1/4 w-[75vw] h-[75vw] rounded-full bg-gradient-to-br from-pink-500 to-rose-600 opacity-[0.35] blur-[120px] animate-mesh-float-2" />
          <div className="absolute top-1/4 right-1/4 w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 opacity-[0.25] blur-[100px] animate-mesh-float-3" />
          <div className="absolute bottom-1/4 left-1/4 w-[65vw] h-[65vw] rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-[0.25] blur-[100px] animate-mesh-float-4" />
        </div>
      )}


      
            <DesktopSidebar
        isLightSidebar={isLightSidebar}
        sidebarBg={sidebarBg}
        sidebarPatternStyle={sidebarPatternStyle}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        tabOrder={tabOrder}
        hiddenTabs={hiddenTabs}
        activeTab={activeTab}
        handleNavigate={handleNavigate}
        isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
        setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
        showToast={showToast as any}
        setPendingIslemModal={setPendingIslemModal}
        setActiveTab={setActiveTab}
        isSecurityActive={isSecurityActive}
        isOnline={isOnline}
        user={user}
        handleSignOut={handleSignOut}
        setShowFeedbackModal={setShowFeedbackModal}
        setAdminPinError={setAdminPinError}
        setAdminPinInput={setAdminPinInput}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        setUserRole={setUserRole}
      />
      <MobileHeader
        sidebarBg={sidebarBg}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        isOnline={isOnline}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        isLightSidebar={isLightSidebar}
        sidebarPatternStyle={sidebarPatternStyle}
        tabOrder={tabOrder}
        hiddenTabs={hiddenTabs}
        activeTab={activeTab}
        handleNavigate={handleNavigate}
        isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
        setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
        handleSignOut={handleSignOut}
        setShowFeedbackModal={setShowFeedbackModal}
        setAdminPinError={setAdminPinError}
        setAdminPinInput={setAdminPinInput}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        setUserRole={setUserRole}
        user={user}
        setPendingIslemModal={setPendingIslemModal}
        showToast={showToast as any}
        setActiveTab={setActiveTab}
        isSecurityActive={isSecurityActive}
      />
{/* 3. MAIN WORKSPACE CONTENT */}
      <main className="relative z-10 flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full pb-20 md:pb-6">
        <div className={activeTab === 'dashboard' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('dashboard', <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} ceksenet={ceksenet} expenses={expenses} employeeTransactions={employeeTransactions} onNavigate={handleNavigate} />)}
        </div>
        <div className={activeTab === 'cariler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('cariler', <CarilerView 
            cariler={cariler} 
            islemler={islemler} 
            stoklar={stoklar}
            bankAccounts={bankAccounts}
            onQuickTransaction={(type, cariId) => {
              setPendingIslemModal(type);
              setPendingCariId(cariId);
              setActiveTab('islemler');
            }}
            aiPrefilledData={aiPrefilledData}
            onClearAiPrefilledData={() => setAiPrefilledData(null)}
            pendingAddCari={pendingAddCari}
            onCariAdded={() => setPendingAddCari(false)}
            selectedCariIdForDetails={selectedCariIdForDetails}
            onSelectCariForDetails={setSelectedCariIdForDetails}
          />)}
        </div>
        <div className={activeTab === 'stoklar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('stoklar', <StoklarView 
            stoklar={stoklar} 
            islemler={islemler}
            cariler={cariler}
            aiPrefilledData={aiPrefilledData}
            onClearAiPrefilledData={() => setAiPrefilledData(null)}
            userRole={userRole}
            actionPermissions={actionPermissions}
            escalationPin={escalationPin}
            isSecurityActive={isSecurityActive}
            pendingAddStock={pendingAddStock}
            onStockAdded={() => setPendingAddStock(false)}
          />)}
        </div>
        <div className={activeTab === 'islemler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('islemler', <IslemlerView 
            islemler={islemler} 
            cariler={cariler} 
            stoklar={stoklar} 
            bankAccounts={bankAccounts}
            pendingIslemModal={pendingIslemModal}
            pendingCariId={pendingCariId}
            onClearPendingIslemModal={() => {
              setPendingIslemModal(null);
              setPendingCariId(null);
            }}
            aiPrefilledData={aiPrefilledData}
            onClearAiPrefilledData={() => setAiPrefilledData(null)}
            userRole={userRole}
            actionPermissions={actionPermissions}
            escalationPin={escalationPin}
            isSecurityActive={isSecurityActive}
            onViewCariDetails={(cariId) => {
              setSelectedCariIdForDetails(cariId);
              setActiveTab('cariler');
            }}
          />)}
        </div>
        <div className={activeTab === 'ceksenet' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('ceksenet', <CekSenetView ceksenet={ceksenet} cariler={cariler} islemler={islemler} />)}
        </div>
        <div className={activeTab === 'masraflar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('masraflar', <MasraflarView expenses={expenses} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />)}
        </div>
        <div className={activeTab === 'calisanlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('calisanlar', <CalisanlarView employees={employees} transactions={employeeTransactions} ceksenet={ceksenet} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />)}
        </div>
        <div className={activeTab === 'kasa' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('kasa', <KasaView islemler={islemler} expenses={expenses} employeeTransactions={employeeTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} />)}
        </div>
        <div className={activeTab === 'krediler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('krediler', <KredilerView credits={credits} />)}
        </div>
        <div className={activeTab === 'raporlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('raporlar', <RaporlarView 
            cariler={cariler} 
            stoklar={stoklar} 
            islemler={islemler} 
            ceksenet={ceksenet} 
            expenses={expenses} 
            employeeTransactions={employeeTransactions} 
          />)}
        </div>
        <div className={activeTab === 'ayarlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('ayarlar', renderSettingsView())}
        </div>
      </main>

            <MobileBottomNav
        handleNavigate={handleNavigate}
        activeTab={activeTab}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
      />
      <AppModals
        resetModalOpen={resetModalOpen}
        setResetModalOpen={setResetModalOpen}
        resetConfirmationText={resetConfirmationText}
        setResetConfirmationText={setResetConfirmationText}
        resetError={resetError}
        setResetError={setResetError}
        isResetting={isResetting}
        handleResetAllData={handleResetAllData}
        updateStatus={updateStatus}
        updatePercent={updatePercent}
        activeLogoTheme={activeLogoTheme}
        activeTheme={activeTheme}
        sidebarPattern={sidebarPattern}
        sidebarPatternOpacity={sidebarPatternOpacity}
        designStyle={designStyle}
        showChangelog={showChangelog}
        handleCloseChangelog={handleCloseChangelog}
        isAdminPinModalOpen={isAdminPinModalOpen}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        adminPinInput={adminPinInput}
        setAdminPinInput={setAdminPinInput}
        adminPinError={adminPinError}
        setAdminPinError={setAdminPinError}
        escalationPin={escalationPin}
        setUserRole={setUserRole}
        showToast={showToast as any}
        toastMessage={toastMessage}
        setToastMessage={setToastMessage}
        showUpdateModal={showUpdateModal}
        setShowUpdateModal={setShowUpdateModal}
        availableUpdateVersion={availableUpdateVersion}
        setUpdateStatus={setUpdateStatus}
        CHANGELOG={CHANGELOG}
        showFeedbackModal={showFeedbackModal}
        setShowFeedbackModal={setShowFeedbackModal}
        feedbackType={feedbackType}
        setFeedbackType={setFeedbackType}
        feedbackText={feedbackText}
        setFeedbackText={setFeedbackText}
        feedbackImage={feedbackImage}
        setFeedbackImage={setFeedbackImage}
        feedbackImageLoading={feedbackImageLoading}
        setFeedbackImageLoading={setFeedbackImageLoading}
        compressImage={compressImage}
        user={user}
        zoomImage={zoomImage}
        setZoomImage={setZoomImage}
        geminiApiKey={geminiApiKey}
        setActiveTab={setActiveTab}
        setAiPrefilledData={setAiPrefilledData}
        setFeedbackList={setFeedbackList}
        userRole={userRole}
        isSecurityActive={isSecurityActive}
        sensitiveTabs={sensitiveTabs}
        actionPermissions={actionPermissions}
        handleNavigate={handleNavigate}
      />
    </div>
  );
}
