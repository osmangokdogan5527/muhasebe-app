import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { lazyWithReload } from './utils/lazyWithReload';
import { useAppSettings } from './hooks/useAppSettings';
import { useAppData } from './hooks/useAppData';
import { useAppAuth } from './hooks/useAppAuth';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { useBackupActions } from './hooks/useBackupActions';
import { useLogoActions } from './hooks/useLogoActions';
import { renderToStaticMarkup } from 'react-dom/server';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit, BankAccount, AccountTransaction, KeyboardShortcut, LinkedReceiptInput } from './types';
import { 
  subscribeCariler, 
  subscribeStoklar, 
  subscribeIslemler, 
  subscribeCekSenet, 
  clearAllDatabaseData, 
  importAllDatabaseData,
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
  saveBankAccount,
  createTransaction,
  ensureRetailCari,
  db,
  setActivityActor,
  recordActivity,
  setPrimaryCashAccounts,
} from './firebase';
import { logError } from './utils/errorLogger';
import { PosCartItem, PosPaymentSplit } from './types/pos';

import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { BackupWizardModal } from './components/backup/BackupWizardModal';
import { useAutoBackup } from './backup/useAutoBackup';
import { subscribeFirmStatus } from './admin/firmRegistry';
import { primaryAccountMap } from './utils/cashAccounts';
import type { AiCredentials } from './ai/aiProviders';
import { useFirmInfo } from './onboarding/useFirmInfo';
import { FirmInfoModal } from './onboarding/FirmInfoModal';
import { FirmInfoBanner } from './onboarding/FirmInfoBanner';
import { markFirmInfoPrompted, wasFirmInfoPrompted } from './onboarding/firmInfo';
import { GlobalStyles } from "./components/GlobalStyles";
import YetkisizErisimView from './components/YetkisizErisimView';
// Telefonda pratik satış ve tahsilat ekranları (tam sürümün içinde)
const FieldSale = lazyWithReload(() => import('./components/field/FieldSale').then((m) => ({ default: m.FieldSale })));
const StaffActivityView = lazyWithReload(() => import('./users/StaffActivityView').then((m) => ({ default: m.StaffActivityView })));
const FieldCollection = lazyWithReload(() => import('./components/field/FieldCollection').then((m) => ({ default: m.FieldCollection })));
import { DesktopSidebar } from "./components/DesktopSidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MobileMenuView } from "./components/MobileMenuView";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { AuthScreen } from "./components/AuthScreen";
import { useStaffSession } from "./users/useStaffSession";
import { StaffLoginScreen } from "./users/StaffLoginScreen";
import { ALL_STAFF_TAB_IDS } from "./users/UsersSettings";
import { DEFAULT_STAFF_TABS, StaffActions, checkPin, hasSpecialPermission, isFullOwner, restrictedTabsFor } from "./users/staffUsers";
import { registerAdminVerifier } from "./utils/masterCode";
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

import { StormLogo, APP_VERSION, CHANGELOG, COLOR_PRESETS, TAB_DEFS, SIDEBAR_PATTERNS, changelogData, DEFAULT_SHORTCUTS } from "./constants";
import { DeviceAccount, loadDeviceAccounts, upsertDeviceAccount } from "./utils/accountStore";
import { changeTenantPassword } from "./utils/tenantAuth";
import { alertDialog } from './utils/dialogs';
// Ekranlar ilk açıldıklarında indirilir (açılış hızı): program yalnızca görünen ekranın
// kodunu yükler; Excel, PDF, grafik ve kamera kütüphaneleri de ilgili ekranla birlikte gelir.
const DashboardView = lazyWithReload(() => import('./components/DashboardView'));
const PosView = lazyWithReload(() => import('./components/pos/PosView').then((m) => ({ default: m.PosView })));
const CarilerView = lazyWithReload(() => import('./components/CarilerView'));
const StoklarView = lazyWithReload(() => import('./components/StoklarView'));
const IslemlerView = lazyWithReload(() => import('./components/IslemlerView'));
const CekSenetView = lazyWithReload(() => import('./components/CekSenetView'));
const MasraflarView = lazyWithReload(() => import('./components/MasraflarView'));
const CalisanlarView = lazyWithReload(() => import('./components/CalisanlarView'));
const KasaView = lazyWithReload(() => import('./components/KasaView'));
const KredilerView = lazyWithReload(() => import('./components/KredilerView'));
const RaporlarView = lazyWithReload(() => import('./components/RaporlarView'));
const AyarlarView = lazyWithReload(() => import('./components/AyarlarView'));

/** Ekran kodu indirilirken gösterilen küçük yükleniyor göstergesi. */
const TabLoading: React.FC = () => (
  <div className="flex items-center justify-center py-24" role="status" aria-live="polite">
    <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-[color:var(--accent-500,#0ea5e9)] animate-spin" />
    <span className="sr-only">Yükleniyor...</span>
  </div>
);

export default function App() {
  const [isBackupWizardOpen, setIsBackupWizardOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    return window.innerWidth < 768 ? 'menu' : 'dashboard';
  });
  // Bir ekran ilk açıldığında oluşturulur, sonra açık kalır (sekme değişince yeri/girdiler korunur).
  // Önceden tüm ekranlar açılışta gizli olarak oluşturuluyordu; bu, açılışı yavaşlatıyordu.
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    setVisitedTabs((prev) => (prev.has(activeTab) ? prev : new Set(prev).add(activeTab)));
  }, [activeTab]);
  const [baseUserRole, setUserRole] = useState<'admin' | 'employee'>('employee');
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

  // 1.8.7: telefonda ayrı saha modu kaldırıldı; telefon da tam sürümü kullanır.
  // Eski sürümden kalan saha modu tercihi temizlenir.
  useEffect(() => {
    try {
      localStorage.removeItem('storm_field_mode');
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'App.clearFieldMode');
    }
  }, []);
  // Telefon genişliğinde kasa yerine pratik satış ekranı ve alt sekme çubuğu kullanılır
  const [isMobileScreen, setIsMobileScreen] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setIsMobileScreen(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      try {
        await enableNetwork(db);
        console.log("Firestore network enabled.");
      } catch (err) {
        console.error("Failed to enable network", err);
      }
    };
    const handleOffline = async () => {
      setIsOnline(false);
      try {
        await disableNetwork(db);
        console.log("Firestore network disabled explicitly.");
      } catch (err) {
        console.error("Failed to disable network", err);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      handleOffline();
    }

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
    navPosition, setNavPosition,
    activeLogoTheme, setActiveLogoTheme,
    appFontSize, setAppFontSize,
    sidebarBg, setSidebarBg,
    sidebarPattern, setSidebarPattern,
    sidebarPatternOpacity, setSidebarPatternOpacity,
    sidebarPatternColor, setSidebarPatternColor,
    hiddenTabs, setHiddenTabs, toggleTabVisibility,
    tabOrder, setTabOrder, moveTab,
    geminiApiKey, setGeminiApiKey,
    aiSecondaryProvider, setAiSecondaryProvider,
    aiSecondaryKey, setAiSecondaryKey,
    aiOrder, setAiOrder,
    isAiEnabled, setIsAiEnabled,
    autoBackupEnabled, setAutoBackupEnabled
  } = useAppSettings();

  const {
    isBackupLoading,
    backupMessage,
    setBackupMessage,
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
    handleSignOut
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
  // Bu cihazda oluşturulan/bağlanılan firmalar (kodda hazır hesap yoktur)
  const [accounts, setAccounts] = useState<DeviceAccount[]>(() => loadDeviceAccounts());

  // Settings password variables
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState<string | null>(null);
  const [settingsPasswordError, setSettingsPasswordError] = useState<string | null>(null);

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  // Dynamic permissions and admin PIN states
  const [baseSensitiveTabs, setSensitiveTabs] = useState<string[]>(() => {
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

  const [baseEscalationPin, setEscalationPin] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_admin_pin') || '1923';
  });

  const [baseSecurityActive, setIsSecurityActive] = useState<boolean>(() => {
    return localStorage.getItem('storm_muhasebe_security_active') === 'true';
  });

  // Dynamic action-level permissions for employees (true means ALLOWED, false means RESTRICTED)
  const [baseActionPermissions, setActionPermissions] = useState<{
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

  // ---- Firma içi kullanıcılar (sahip / çalışan) ----
  // Sistem açıkken (en az bir aktif kullanıcı) yetkiler giriş yapan kişiden gelir; kapalıyken eski tek PIN'li sistem geçerlidir.
  const staff = useStaffSession(user?.uid);
  const staffUser = staff.currentUser;
  const isStaffSystem = staff.systemActive;
  const userRole: 'admin' | 'employee' = isStaffSystem
    ? (isFullOwner(staffUser) ? 'admin' : baseUserRole)
    : baseUserRole;
  const isSecurityActive = isStaffSystem ? true : baseSecurityActive;
  // Sahip yetkileri: sahipler ve sahibin ayrıca yetki verdiği kullanıcılar görür
  const canSeeStaffActivity = isStaffSystem && hasSpecialPermission(staffUser, 'takip', isStaffSystem);
  const canManageBackup = hasSpecialPermission(staffUser, 'yedek', isStaffSystem);
  const aiCredentials = useMemo<AiCredentials>(() => ({
    geminiKey: (geminiApiKey || '').trim(),
    secondaryProvider: aiSecondaryProvider,
    secondaryKey: (aiSecondaryKey || '').trim(),
    order: aiOrder,
  }), [geminiApiKey, aiSecondaryProvider, aiSecondaryKey, aiOrder]);
  // Yedekten geri yükleme tüm verileri değiştirir: yalnızca sahip / yönetici
  const canRestoreBackup = userRole === 'admin' || !isSecurityActive;
  // İlk giriş: firma bilgileri (fişte görünen ad, adres, telefon). Yalnızca sahip / yönetici düzenler.
  const canEditFirmInfo = isStaffSystem ? isFullOwner(staffUser) : (userRole === 'admin' || !isSecurityActive);
  const firmInfoReady = !!user?.uid && !authLoading && staff.loaded && !staff.waitingForUsers;
  const firmInfo = useFirmInfo(user?.uid, firmInfoReady);
  const [isFirmInfoOpen, setIsFirmInfoOpen] = useState(false);
  const showFirmInfoBanner = canEditFirmInfo && firmInfo.missing && !isFirmInfoOpen;
  const closeFirmInfo = (saved: boolean) => {
    setIsFirmInfoOpen(false);
    if (user?.uid) markFirmInfoPrompted(user.uid);
    if (!saved) showToast('Firma bilgilerini istediğiniz zaman Gösterge Paneli\'ndeki karttan ya da Ayarlar > Belge Görünümü\'nden doldurabilirsiniz.', 'info');
  };
  const autoBackup = useAutoBackup({
    tenantId: user?.uid,
    ready: !!user?.uid && !authLoading && staff.loaded && !staff.waitingForUsers,
    autoEnabled: autoBackupEnabled,
    canManage: canManageBackup,
    actorName: staffUser?.name || profileName || undefined,
    showToast,
  });
  // Sistem açıkken eski firma PIN'i geçmez; onaylar sahip PIN'i (ya da sağlayıcı ana kodu) ister
  const escalationPin = isStaffSystem ? '' : baseEscalationPin;
  const sensitiveTabs = useMemo(
    () => (isStaffSystem && staffUser ? restrictedTabsFor(staffUser, ALL_STAFF_TAB_IDS) : baseSensitiveTabs),
    [isStaffSystem, staffUser, baseSensitiveTabs],
  );
  const actionPermissions = useMemo(
    () => (isStaffSystem && staffUser ? { ...baseActionPermissions, ...staffUser.actions } : baseActionPermissions),
    [isStaffSystem, staffUser, baseActionPermissions],
  );
  // Eski personel ayarları, yeni eklenen çalışanlar için varsayılan yetki olur
  const staffLegacyDefaults = useMemo(() => ({
    allowedTabs: baseSecurityActive
      ? ALL_STAFF_TAB_IDS.filter((t) => !baseSensitiveTabs.includes(t === 'tahsilat' ? 'islemler' : t))
      : [...DEFAULT_STAFF_TABS],
    actions: { ...baseActionPermissions } as StaffActions,
  }), [baseSecurityActive, baseSensitiveTabs, baseActionPermissions]);

  // Hareket günlüğü: giriş yapan kişi firebase katmanına bildirilir (kayıtlara "kim yaptı" yazılır)
  useEffect(() => {
    setActivityActor(isStaffSystem && staffUser ? { id: staffUser.id, name: staffUser.name, role: staffUser.role } : null);
  }, [isStaffSystem, staffUser]);

  // Çalışan sahip PIN'iyle yönetici yetkisi aldığında günlüğe yazılır
  useEffect(() => {
    if (isStaffSystem && staffUser?.role === 'staff' && baseUserRole === 'admin') {
      recordActivity({ category: 'yetki', action: 'elevate', title: "Sahip PIN'iyle yönetici yetkisi açıldı", risky: true });
    }
  }, [isStaffSystem, staffUser?.id, staffUser?.role, baseUserRole]);

  // Kişi değişince yükseltilmiş yönetici yetkisi düşer
  useEffect(() => {
    if (isStaffSystem) setUserRole('employee');
  }, [isStaffSystem, staffUser?.id]);

  // Onay pencereleri sahiplerin kendi PIN'lerini kabul eder
  useEffect(() => {
    if (!isStaffSystem) {
      registerAdminVerifier(null);
      return;
    }
    // Sınırlı sahiplerin PIN'i onay vermez (kendi kısıtlarını aşamasınlar)
    const owners = staff.activeUsers.filter((u) => isFullOwner(u));
    registerAdminVerifier(async (input) => {
      for (const owner of owners) {
        if (await checkPin(owner, input)) return true;
      }
      return false;
    });
    return () => registerAdminVerifier(null);
  }, [isStaffSystem, staff.activeUsers]);

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
    // Tahsilat ekranı Finansal Hareketler yetkisine bağlıdır
    // Kullanıcı sisteminde Tahsilat ayrıca yetkilendirilir
    const permissionTab = tabId === 'tahsilat' && !isStaffSystem ? 'islemler' : tabId;
    if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(permissionTab)) {
      setAdminPinError(null);
      setAdminPinInput('');
      setIsAdminPinModalOpen(true);
      return;
    }
    setActiveTab(tabId as any);
  };
  // Çalışan modunda izin verilmeyen ekranlar menülerde kilitli gösterilmez, hiç görünmez
  // (yönetici girişiyle yetki yükseltilince yeniden görünür). Ayarlar'daki sekme görünürlüğü etkilenmez.
  const navHiddenTabs = useMemo(() => {
    if (!isSecurityActive || userRole !== 'employee') return hiddenTabs;
    const locked = [...sensitiveTabs];
    // Eski tek PIN'li sistemde Tahsilat ekranı Finansal Hareketler yetkisine bağlıdır
    if (!isStaffSystem && sensitiveTabs.includes('islemler')) locked.push('tahsilat');
    return Array.from(new Set([...hiddenTabs, ...locked]));
  }, [isSecurityActive, userRole, isStaffSystem, sensitiveTabs, hiddenTabs]);

  // Çalışan izinli olmadığı bir ekranda kaldıysa (giriş, kişi değişimi, yetki değişimi) izinli ekrana geçer
  useEffect(() => {
    if (activeTab === 'takip' && !canSeeStaffActivity) {
      setActiveTab(isMobileScreen ? 'menu' : 'dashboard');
      return;
    }
    if (!isStaffSystem || !staffUser || userRole !== 'employee' || activeTab === 'menu') return;
    if (!sensitiveTabs.includes(activeTab)) return;
    const allowed = [...tabOrder, 'tahsilat'].find((t) => !sensitiveTabs.includes(t) && !hiddenTabs.includes(t));
    setActiveTab(isMobileScreen ? 'menu' : (allowed || 'menu'));
  }, [isStaffSystem, canSeeStaffActivity, staffUser, userRole, activeTab, sensitiveTabs, tabOrder, hiddenTabs, isMobileScreen]);

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

  // Firma bilgileri eksikse pencere sahibe bu cihazda bir kez kendiliğinden açılır
  useEffect(() => {
    // "Yeni sürümde neler değişti" penceresi açıksa o kapanınca açılır (pencereler üst üste binmez)
    if (!user?.uid || !canEditFirmInfo || !firmInfo.missing || showChangelog || wasFirmInfoPrompted(user.uid)) return;
    const timer = setTimeout(() => setIsFirmInfoOpen(true), 1200);
    return () => clearTimeout(timer);
  }, [user?.uid, canEditFirmInfo, firmInfo.missing, showChangelog]);

  // Kurucu firmayı dondurur/silerse açık oturum kapatılır (sunucu kuralları da veriyi kapatır)
  const firmBlockedRef = useRef(false);
  useEffect(() => {
    firmBlockedRef.current = false;
    if (!user?.uid) return;
    return subscribeFirmStatus(user.uid, (message) => {
      if (firmBlockedRef.current) return;
      firmBlockedRef.current = true;
      handleSignOut();
      alertDialog(message);
    });
  }, [user?.uid]);

  // Yedek hatırlatması: otomatik yedeğin çalışmadığı cihazda, yalnızca yedek yetkisi olan kişiye, oturumda bir kez
  const backupReminderShownRef = useRef(false);
  useEffect(() => {
    if (!autoBackup.reminderDue || backupReminderShownRef.current) return;
    backupReminderShownRef.current = true;
    const timer = setTimeout(() => {
      setIsBackupWizardOpen(true);
      showToast("Yedek zamanı: son yedeğin üzerinden uzun süre geçti. Lütfen verilerinizi yedekleyin.", "info");
    }, 3500);
    return () => clearTimeout(timer);
  }, [autoBackup.reminderDue]);

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
          
          let friendlyError = error;
          if (friendlyError && typeof friendlyError === 'string') {
            if (friendlyError.includes('No published versions on GitHub')) {
              friendlyError = 'GitHub üzerinde henüz yayınlanmış (Publish edilmiş) bir uygulama sürümü bulunamadı. Lütfen GitHub deposunun "Releases" kısmında en az bir sürüm oluşturup yayınladığınızdan emin olun.';
            } else if (friendlyError.includes('HttpError: 404')) {
              friendlyError = 'GitHub deponuz bulunamadı (404 Hatası). Lütfen package.json dosyasındaki "owner" ve "repo" bilgilerinin doğruluğunu ve deponun herkese açık (public) olduğunu kontrol edin.';
            }
          }
          
          alertDialog(`Güncelleme indirilirken hata oluştu:\n${friendlyError}`);
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
    recurringTransactions, setRecurringTransactions,
    loading, setLoading
  } = useAppData(user);

  // Hesap belirtilmeden kaydedilen satış/tahsilat/masraf, türün varsayılan (★) hesabına yazılır
  useEffect(() => {
    setPrimaryCashAccounts(bankAccounts && bankAccounts.length ? primaryAccountMap(bankAccounts) : null);
  }, [bankAccounts]);






  useEffect(() => {
    if (!user) return;
    // 1. Update in the device account list so that it shows on the login screen
    const existing = accounts.find(a => a.id === user.uid);
    if (existing) {
      const name = profileName || user.displayName || existing.name;
      const photoURL = profilePhoto || (user as any).photoURL || existing.photoURL || '';
      if (name !== existing.name || photoURL !== (existing.photoURL || '')) {
        setAccounts(upsertDeviceAccount({ ...existing, name, photoURL }));
      }
    }
    // 2. Update the active logged in user in localStorage
    const updatedUser = {
      ...user,
      displayName: profileName || user.displayName,
      photoURL: profilePhoto || (user as any).photoURL
    };
    localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(updatedUser));
  }, [user, profileName, profilePhoto, accounts]);







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
  const bodyPatternSvg = (activePatternObj.svg && designStyle !== 'pusula')
    ? activePatternObj.svg
        .replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
        .replace(/OPACITY/g, (sidebarPatternOpacity * 0.5).toString()) // Slightly lower opacity for body
    : '';
  const isLightSidebar = sidebarBg === '#ffffff' && designStyle !== 'pusula';
    const sidebarPatternStyle = (sidebarPattern !== 'none' && sidebarPatternOpacity > 0 && designStyle !== 'pusula') ? {
    backgroundImage: activePatternObj.svg
      ?.replace(/PATTERNCOLOR/g, sidebarPatternColor === 'white' ? '%23ffffff' : '%23000000')
      ?.replace(/OPACITY/g, sidebarPatternOpacity.toString()),
    backgroundSize: activePatternObj.size || 'auto'
  } : {};
  

  const renderWorkspaceView = (id: string, content: any) => {
    if (id !== activeTab && !visitedTabs.has(id)) return null;
    return (
      <div className={`w-full max-w-7xl mx-auto ${isLightSidebar ? 'text-gray-800' : 'text-gray-100'} transition-colors duration-300`}>
        <Suspense fallback={<TabLoading />}>{content}</Suspense>
      </div>
    );
  };

  const renderSettingsView = () => (
    <AyarlarView
      activeTheme={activeTheme}
      setActiveTheme={setActiveTheme}
      designStyle={designStyle}
      setDesignStyle={setDesignStyle}
      navPosition={navPosition}
      setNavPosition={setNavPosition}
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
      profileName={profileName}
      setProfileName={setProfileName}
      profilePhoto={profilePhoto}
      setProfilePhoto={setProfilePhoto}
      profilePassword={profilePassword}
      setProfilePassword={setProfilePassword}
      settingsPasswordSuccess={settingsPasswordSuccess}
      settingsPasswordError={settingsPasswordError}
      handleProfileUpdate={handleProfileUpdate}
      handleManualBackup={() => { autoBackup.backupNow(); }}
      isBackupLoading={isBackupLoading || autoBackup.running}
      handleRestoreBackup={() => setIsBackupWizardOpen(true)}
      toggleAutoBackup={toggleAutoBackup}
      autoBackupEnabled={autoBackupEnabled}
      handleOpenBackupFolder={handleOpenBackupFolder}
      backupMessage={backupMessage}
      setResetModalOpen={setResetModalOpen}
      onOpenBackupWizard={() => setIsBackupWizardOpen(true)}
      geminiApiKey={geminiApiKey}
      setGeminiApiKey={setGeminiApiKey}
      aiControls={{
        credentials: aiCredentials,
        setSecondaryProvider: setAiSecondaryProvider,
        setSecondaryKey: setAiSecondaryKey,
        setOrder: setAiOrder,
      }}
      isAiEnabled={isAiEnabled}
      setIsAiEnabled={setIsAiEnabled}
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
      staff={staff}
      staffLegacyDefaults={staffLegacyDefaults}
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

  const handleProfileUpdate = async (currentPassword?: string) => {
    if (!user) return;
    setSettingsPasswordError(null);
    setSettingsPasswordSuccess(null);
    try {
      // Firma adı Firebase hesabına da yazılır (başka cihazdan bağlanırken bu ad görünür)
      if (profileName && auth.currentUser && auth.currentUser.email === `${user.uid}@storm.com`) {
        await updateProfile(auth.currentUser, { displayName: profileName });
      }

      if (profilePassword) {
        const account = accounts.find(a => a.id === user.uid) || { id: user.uid, name: profileName || user.displayName || user.uid };
        const result = await changeTenantPassword(account, currentPassword || '', profilePassword);
        if (!result.ok) {
          setSettingsPasswordError(result.message || 'Şifre değiştirilemedi.');
          return;
        }
        setAccounts(loadDeviceAccounts());
        setProfilePassword('');
        setSettingsPasswordSuccess('Firma şifresi güncellendi. Diğer cihazlarda yeni şifreyle giriş yapın.');
      }
      showToast("Profil bilgileri başarıyla güncellendi.", "success");
    } catch (err: any) {
      logError(err instanceof Error ? err : new Error(String(err)), 'App.handleProfileUpdate');
      showToast(`Profil güncellenirken hata oluştu: ${err.message}`, "error");
    }
  };

  // Sayfa yenilemede oturum geri yüklenirken giriş ekranı bir an görünmesin
  if (authLoading) {
    return (
      <LoadingScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
      />
    );
  }

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
        accounts={accounts}
        setAccounts={setAccounts}
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

  if (loading || !staff.loaded) {
    return (
      <LoadingScreen
        currentThemeData={currentThemeData}
        themeCssRules={themeCssRules}
      />
    );
  }

  // Kullanıcı sistemi açıksa önce "Kim kullanıyor?" ekranı
  if ((staff.systemActive && !staff.currentUser) || staff.waitingForUsers) {
    return (
      <>
        <GlobalStyles themeCssRules={themeCssRules} bodyPatternSvg={bodyPatternSvg} activePattern={activePatternObj} />
        <StaffLoginScreen
          firmName={user.displayName || 'Firma'}
          users={staff.activeUsers}
          designStyle={designStyle}
          onLogin={(u) => {
            staff.login(u);
            setActiveTab(isMobileScreen ? 'menu' : (isFullOwner(u) || u.allowedTabs.includes('dashboard') ? 'dashboard' : (u.allowedTabs.find((t) => t !== 'tahsilat') || 'menu')));
          }}
          onSignOutFirm={() => {
            staff.logout();
            handleSignOut();
          }}
        />
      </>
    );
  }

  // POS Hızlı Satış Tamamlama Entegrasyonu
  const handleCompletePosSale = async (saleData: {
    receiptNo: string;
    cariId?: string;
    cariName: string;
    items: PosCartItem[];
    paymentSplit: PosPaymentSplit;
    grandTotal: number;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    date: string;
    note?: string;
  }) => {
    try {
      const items = saleData.items.map((item) => ({
        stockId: item.stockId,
        stockName: item.stockName,
        quantity: item.quantity,
        unit: item.unit,
        price: item.unitPrice,
        taxRate: item.taxRate,
        total: item.totalLine,
      }));

      // Müşteri seçilmediyse satış sabit "Perakende Müşteri" carisine yazılır (yoksa oluşturulur)
      const cariId = saleData.cariId || await ensureRetailCari();
      const split = saleData.paymentSplit;

      // 1. Ana Satış Faturası: tahsil edilen tutarlar aşağıdaki bağlı tahsilatlarla kasaya/POS'a girer,
      // fatura kendisi açık hesap olarak kaydedilir; ödenmeyen kısım (veresiye) carinin borcunda kalır.
      const mainTransaction: Omit<Transaction, 'id'> = {
        invoiceNo: saleData.receiptNo,
        type: 'sale',
        cariId,
        cariName: saleData.cariName || 'Perakende Müşteri',
        date: saleData.date,
        amount: saleData.grandTotal,
        account: '',
        // Kasada yazılan fiş açıklaması kayda da yazılır (yoksa fiş numarası)
        description: saleData.note?.trim() || `POS Hızlı Satış Fişi No: ${saleData.receiptNo}`,
        items,
        createdAt: new Date().toISOString(),
        currency: 'TRY',
      };

      // 2. Bağlı tahsilatlar: nakit ve kart kısmı ayrı kayıtlar olarak doğru hesaba işlenir
      const linkedReceipts: LinkedReceiptInput[] = [];
      if ((split.cashAmount || 0) > 0) {
        linkedReceipts.push({
          amount: split.cashAmount,
          account: 'cash',
          description: `POS Fişi ${saleData.receiptNo} - Nakit Tahsilat`,
        });
      }
      if ((split.posAmount || 0) > 0) {
        const posAccount = bankAccounts.find((a) => a.id === split.posAccountId);
        linkedReceipts.push({
          amount: split.posAmount,
          account: posAccount?.type === 'banka' ? 'bank' : 'pos',
          bankAccountId: split.posAccountId || undefined,
          description: `POS Fişi ${saleData.receiptNo} - Kart/POS Tahsilat`,
        });
      }

      await createTransaction(mainTransaction, linkedReceipts);
      showToast('Hızlı perakende satış başarıyla tamamlandı ve stoklar düşüldü.', 'success');
      return true;
    } catch (err: any) {
      logError(err, 'App:handleCompletePosSale');
      showToast('Satış kaydı oluşturulurken hata: ' + (err.message || err), 'error');
      return false;
    }
  };


  return (
    <div data-design-style={designStyle} data-nav-position={navPosition} className={`min-h-screen relative ${(currentThemeData as any).bgClass || 'bg-[#050505]'} text-[#e0e0e0] flex flex-col md:flex-row font-sans overflow-x-hidden`}>
      <GlobalStyles themeCssRules={themeCssRules} bodyPatternSvg={bodyPatternSvg} activePattern={activePatternObj} />



      
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
        hiddenTabs={navHiddenTabs}
        activeTab={activeTab}
        handleNavigate={handleNavigate}
        isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
        setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
        userRole={userRole}
        sensitiveTabs={sensitiveTabs}
        showToast={showToast as any}
        setPendingIslemModal={setPendingIslemModal}
        setActiveTab={setActiveTab}
        isSecurityActive={isSecurityActive && !(isStaffSystem && isFullOwner(staffUser))}
        isOnline={isOnline}
        user={user}
        handleSignOut={handleSignOut}
        setShowFeedbackModal={setShowFeedbackModal}
        setAdminPinError={setAdminPinError}
        setAdminPinInput={setAdminPinInput}
        setIsAdminPinModalOpen={setIsAdminPinModalOpen}
        setUserRole={setUserRole}
        staffUserName={isStaffSystem ? staffUser?.name : null}
        onSwitchUser={isStaffSystem ? staff.logout : undefined}
        onOpenStaffActivity={canSeeStaffActivity ? () => setActiveTab('takip') : undefined}
        onOpenBackup={canManageBackup && staffUser?.role === 'staff' ? () => setIsBackupWizardOpen(true) : undefined}
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
        hiddenTabs={navHiddenTabs}
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
        <div className={activeTab === 'menu' ? 'block animate-fade-in md:hidden' : 'hidden'}>
          <MobileMenuView
            tabOrder={tabOrder}
            hiddenTabs={navHiddenTabs}
            activeTab={activeTab}
            handleNavigate={handleNavigate}
            isIslemlerSubMenuOpen={isIslemlerSubMenuOpen}
            setIsIslemlerSubMenuOpen={setIsIslemlerSubMenuOpen}
            userRole={userRole}
            sensitiveTabs={sensitiveTabs}
            handleSignOut={handleSignOut}
            setAdminPinError={setAdminPinError}
            setAdminPinInput={setAdminPinInput}
            setIsAdminPinModalOpen={setIsAdminPinModalOpen}
            setUserRole={setUserRole}
            user={user}
            setPendingIslemModal={setPendingIslemModal}
            showToast={showToast as any}
            setActiveTab={setActiveTab}
            isSecurityActive={isSecurityActive && !(isStaffSystem && isFullOwner(staffUser))}
            staffUserName={isStaffSystem ? staffUser?.name : null}
            onSwitchUser={isStaffSystem ? staff.logout : undefined}
            onOpenStaffActivity={canSeeStaffActivity ? () => setActiveTab('takip') : undefined}
            onOpenBackup={canManageBackup ? () => setIsBackupWizardOpen(true) : undefined}
            onCompleteFirmInfo={showFirmInfoBanner ? () => setIsFirmInfoOpen(true) : undefined}
          />
        </div>
        <div className={activeTab === 'dashboard' ? 'block animate-fade-in' : 'hidden'}>
          {showFirmInfoBanner && <FirmInfoBanner className="mb-4 max-w-7xl mx-auto" onOpen={() => setIsFirmInfoOpen(true)} />}
          {renderWorkspaceView('dashboard', <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} ceksenet={ceksenet} expenses={expenses} employeeTransactions={employeeTransactions} recurringTransactions={recurringTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} onNavigate={handleNavigate} />)}
        </div>
        <div className={activeTab === 'pos' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('pos', isMobileScreen ? (
            <div className="mobile-quick">
              <FieldSale
                stoklar={stoklar}
                cariler={cariler}
                bankAccounts={bankAccounts}
                presetCari={null}
                onPresetConsumed={() => {}}
                onCompleteSale={handleCompletePosSale}
                showToast={showToast as any}
              />
            </div>
          ) : (
            <PosView
              stocks={stoklar}
              cariler={cariler}
              bankAccounts={bankAccounts}
              onCompletePosSale={handleCompletePosSale}
            />
          ))}
        </div>
        <div className={activeTab === 'tahsilat' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('tahsilat', (
            <div className="mobile-quick max-w-xl mx-auto">
              <FieldCollection
                cariler={cariler}
                islemler={islemler}
                bankAccounts={bankAccounts}
                presetCari={null}
                onPresetConsumed={() => {}}
                showToast={showToast as any}
              />
            </div>
          ))}
        </div>
        <div className={activeTab === 'cariler' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('cariler', <CarilerView 
            cariler={cariler}
            showToast={showToast as any} 
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
          {renderWorkspaceView('ceksenet', <CekSenetView ceksenet={ceksenet} cariler={cariler} islemler={islemler} bankAccounts={bankAccounts} />)}
        </div>
        <div className={activeTab === 'masraflar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('masraflar', <MasraflarView expenses={expenses} recurringTransactions={recurringTransactions} bankAccounts={bankAccounts} cariler={cariler} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />)}
        </div>
        <div className={activeTab === 'calisanlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('calisanlar', <CalisanlarView employees={employees} transactions={employeeTransactions} ceksenet={ceksenet} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />)}
        </div>
        <div className={activeTab === 'kasa' ? 'block animate-fade-in' : 'hidden'}>
          {renderWorkspaceView('kasa', <KasaView islemler={islemler} cariler={cariler} expenses={expenses} employeeTransactions={employeeTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} />)}
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
        {canSeeStaffActivity && (
          <div className={activeTab === 'takip' ? 'block animate-fade-in' : 'hidden'}>
            {renderWorkspaceView('takip', <StaffActivityView users={staff.users} />)}
          </div>
        )}
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
        aiCredentials={aiCredentials}
        isAiEnabled={isAiEnabled}
        setActiveTab={setActiveTab}
        setAiPrefilledData={setAiPrefilledData}
        setFeedbackList={setFeedbackList}
        financialData={{ cariler, stoklar, islemler, ceksenet, expenses, bankAccounts, employees, employeeTransactions, accountTransactions }}
        userRole={userRole}
        isSecurityActive={isSecurityActive}
        sensitiveTabs={sensitiveTabs}
        actionPermissions={actionPermissions}
        handleNavigate={handleNavigate}
      />
      <BackupWizardModal
        isOpen={isBackupWizardOpen}
        onClose={() => setIsBackupWizardOpen(false)}
        cariler={cariler}
        stoklar={stoklar}
        islemler={islemler}
        ceksenet={ceksenet}
        expenses={expenses}
        employees={employees}
        employeeTransactions={employeeTransactions}
        credits={credits}
        bankAccounts={bankAccounts}
        accountTransactions={accountTransactions}
        recurringTransactions={recurringTransactions}
        onImportData={importAllDatabaseData}
        showToast={showToast}
        autoBackup={autoBackup}
        canRestore={canRestoreBackup}
        actorName={staffUser?.name || profileName || undefined}
      />
      {isFirmInfoOpen && (
        <FirmInfoModal
          isOpen
          branding={firmInfo.branding}
          suggestedFirmName={profileName || user?.displayName || ''}
          onClose={closeFirmInfo}
          showToast={showToast}
        />
      )}
    </div>
  );
}
