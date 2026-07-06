import React, { useState, useEffect, useMemo } from 'react';
import { Cari, Stock, Transaction, CekSenet, Expense, Employee, EmployeeTransaction, Credit, BankAccount, AccountTransaction } from './types';
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
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  signInWithGoogle,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithGoogle,
  signInAnonymously,
  setActiveUser
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
import TemplateDesignerView from './components/TemplateDesignerView';
import AiAssistant from './components/AiAssistant';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  Receipt, 
  Cloud, 
  CloudLightning,
  Menu,
  X,
  User,
  LogOut,
  Settings,
  HelpCircle,
  TrendingUp,
  Briefcase,
  Palette,
  RotateCcw,
  Wallet,
  DollarSign,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  KeyRound,
  BarChart3,
  Printer,
  FileText,
  Check,
  LayoutTemplate,
  Save,
  AlertTriangle,
  Shield,
  Trash2,
  Bot,
  Info,
  ExternalLink,
  Database,
  Download,
  Upload,
  FolderOpen,
  ShieldCheck,
  Landmark,
  MessageSquare
} from 'lucide-react';

const StormLogo = ({ 
  className = "", 
  style = {}, 
  logoTheme, 
  theme,
  sidebarPattern,
  sidebarPatternOpacity
}: { 
  className?: string; 
  style?: React.CSSProperties; 
  logoTheme?: string; 
  theme?: string;
  sidebarPattern?: string;
  sidebarPatternOpacity?: number;
}) => {
  // Strip any shadow filters and transition effects to keep the logo perfectly flat and net
  const cleanedStyle = { ...style };
  if (cleanedStyle.filter) {
    delete cleanedStyle.filter;
  }

  const currentLogoTheme = logoTheme || localStorage.getItem('storm_muhasebe_logo_theme') || 'red';
  const currentActiveTheme = theme || localStorage.getItem('kolay_hesap_accent_theme') || 'red';

  const effectiveTheme = currentLogoTheme === 'theme' ? currentActiveTheme : currentLogoTheme;
  const preset = COLOR_PRESETS.find(p => p.id === effectiveTheme) || COLOR_PRESETS.find(p => p.id === 'red') || COLOR_PRESETS[0];
  
  // Choose the background fill color
  let fillCol = '#dc2626'; // Default red
  if (preset.id === 'sampi10-blue') {
    fillCol = '#22315b';
  } else if (preset.id !== 'red') {
    fillCol = preset.preview || '#dc2626';
  }

  // Get active sidebar pattern details
  let currentPattern = sidebarPattern || localStorage.getItem('storm_muhasebe_sidebar_pattern') || 'crystal';
  if (currentPattern === 'circles') currentPattern = 'flame';
  if (currentPattern === 'waves') currentPattern = 'chain';
  const savedOpacity = sidebarPatternOpacity !== undefined ? sidebarPatternOpacity : parseFloat(localStorage.getItem('storm_muhasebe_sidebar_pattern_opacity') || '0.02');
  
  // Set texture opacity inside logo to be subtle but beautiful
  const opacity = Math.min(0.24, Math.max(0.08, savedOpacity * 5));

  // Generate safe dynamic unique ID for pattern reference
  const rawId = React.useId ? React.useId() : '0';
  const patternId = 'storm-logo-pattern-' + rawId.replace(/:/g, '');

  let patternWidth = 120;
  let patternHeight = 104;
  let patternViewBox = "0 0 120 104";
  let patternContent = null;

  if (currentPattern === 'none') {
    // Geometrik
    patternWidth = 60;
    patternHeight = 104;
    patternViewBox = "0 0 60 104";
    patternContent = (
      <path 
        d="M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z M30 69.28 L30 34.64 L0 17.32 M30 34.64 L60 17.32 M0 69.28 L30 86.6 L60 69.28 M30 86.6 L30 104 M0 69.28 L30 104 M60 69.28 L30 104 M0 51.96 L0 69.28 M60 51.96 L60 69.28 M0 0 L0 17.32 M60 0 L60 17.32 M0 69.28 L0 104 M60 69.28 L60 104" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="1.2" 
        strokeOpacity={opacity}
      />
    );
  } else if (currentPattern === 'flame') {
    // Halftone Baklava Deseni
    patternWidth = 120;
    patternHeight = 120;
    patternViewBox = "0 0 120 120";
    patternContent = (
      <g fill="#ffffff" opacity={opacity}>
        <path d="M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z" />
        <path d="M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z" fillOpacity={0.75} />
        <path d="M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z" fillOpacity={0.45} />
        <path d="M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z" fillOpacity={0.25} />
      </g>
    );
  } else if (currentPattern === 'crystal') {
    // Kristal
    patternWidth = 120;
    patternHeight = 104;
    patternViewBox = "0 0 120 104";
    patternContent = (
      <g opacity={opacity * 1.5}>
        <polygon points="0,0 60,0 30,52" fill="#ffffff" fillOpacity="0.3" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="60,0 120,0 90,52" fill="#ffffff" fillOpacity="0.6" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="30,52 90,52 60,0" fill="#ffffff" fillOpacity="0.4" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,0 30,52 0,52" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="120,0 90,52 120,52" fill="#ffffff" fillOpacity="0.15" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,52 60,52 30,104" fill="#ffffff" fillOpacity="0.35" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="60,52 120,52 90,104" fill="#ffffff" fillOpacity="0.65" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="30,104 90,104 60,52" fill="#ffffff" fillOpacity="0.5" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="0,52 30,104 0,104" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
        <polygon points="120,52 90,104 120,104" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.15" strokeWidth="1"/>
      </g>
    );
  } else if (currentPattern === 'chain') {
    // Akışkan
    patternWidth = 120;
    patternHeight = 120;
    patternViewBox = "0 0 120 120";
    patternContent = (
      <g stroke="none" fill="#ffffff" opacity={opacity}>
        <path d="M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z" fillOpacity={0.35} />
        <path d="M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z" fillOpacity={0.35} />
        <path d="M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z" fillOpacity={0.5} />
        <path d="M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z" fillOpacity={0.5} />
        <rect x={38} y={47} width={12} height={30} rx={6} fillOpacity={0.2} />
        <rect x={98} y={15} width={12} height={40} rx={6} fillOpacity={0.2} />
        <rect x={98} y={65} width={12} height={45} rx={6} fillOpacity={0.2} />
        <rect x={15} y={-10} width={12} height={25} rx={6} fillOpacity={0.2} />
        <rect x={15} y={110} width={12} height={25} rx={6} fillOpacity={0.2} />
        <circle cx={28} cy={55} r={5} fillOpacity={0.25} />
        <circle cx={85} cy={35} r={5} fillOpacity={0.25} />
        <circle cx={85} cy={85} r={5} fillOpacity={0.25} />
      </g>
    );
  } else if (currentPattern === 'topography') {
    // Topografya
    patternWidth = 200;
    patternHeight = 200;
    patternViewBox = "0 0 200 200";
    patternContent = (
      <g stroke="#ffffff" strokeWidth="1.2" fill="none" strokeOpacity={opacity}>
        <path d="M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150" />
        <path d="M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10" />
        <path d="M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210" />
      </g>
    );
  }

  return (
    <svg className={className} style={cleanedStyle} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="100%" height="100%">
      {patternContent && (
        <defs>
          <pattern 
            id={patternId} 
            width={patternWidth} 
            height={patternHeight} 
            patternUnits="userSpaceOnUse" 
            viewBox={patternViewBox}
            x={(200 - patternWidth) / 2}
            y={(200 - patternHeight) / 2}
          >
            {patternContent}
          </pattern>
        </defs>
      )}

      {/* Rounded Square Background - Dynamic Color */}
      <rect width="200" height="200" rx="48" fill={fillCol} />

      {/* Textured overlay pattern inside the logo background */}
      {patternContent && (
        <rect width="200" height="200" rx="48" fill={`url(#${patternId})`} />
      )}

      {/* Modern Minimalist Lightning Bolt - Enlarged and centered */}
      <g transform="translate(70, 22) scale(1.2)">
        <path d="M28 2 L8 38 L23 38 L15 66 L42 28 L28 28 Z" fill="#ffffff" />
      </g>

      {/* Typography - Enlarged and high contrast for absolute sharpness */}
      <text x="100" y="136" dx="2" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="950" fontSize="27" fill="#ffffff" letterSpacing="3.5">STORM</text>
      <text x="100" y="162" dx="1" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="11" fill="#ffffff" letterSpacing="2" opacity="1">MUHASEBE</text>
    </svg>
  );
};

const APP_VERSION = '1.5.2';

const CHANGELOG = {
  version: '1.5.2',
  features: [
    "Barkod tasarımı için 40x60 mm (dikey) yeni barkod etiketi şablonu eklendi.",
    "Şablon Tasarımcısına 'Barkod Etiketi (40x60)' seçeneği ve dinamik kağıt boyutu desteği entegre edildi."
  ],
  fixes: [
    "Masaüstü uygulaması için yüksek çözünürlüklü .ico formatında yeni uygulama simgesi (icon) oluşturuldu.",
    "Şablon derleyicisindeki mükerrer kod blokları temizlenerek üretim sürümü derleme hatası düzeltildi.",
    "Büyük boyutlu yedek (.zip) dosyaları ve derleme artıkları Git takibinden çıkarılarak GitHub senkronizasyonu optimize edildi."
  ]
};

const PREDEFINED_USERS = [
  { id: 'admin', name: 'XSTORM', pin: '270212' },
  { id: 'muhasebe', name: 'GÖKDOĞAN TEKSTİL', pin: '041646' },
  { id: 'firma_1', name: 'SAMPI10', pin: '111111' },
  { id: 'firma_2', name: 'NİFER', pin: '222222' },
  { id: 'firma_3', name: '3. Firma (Kullanıcı 3)', pin: '333333' },
];

const COLOR_PRESETS = [
  {
    id: 'sampi10-blue',
    name: 'Sampi10 Mavisi',
    preview: '#22315b',
    colors: {
      '--accent-50': '#f4f6fb',
      '--accent-100': '#e7ecf5',
      '--accent-200': '#ced9ea',
      '--accent-300': '#a5bdda',
      '--accent-400': '#779dc5',
      '--accent-500': '#5480b1',
      '--accent-600': '#406594',
      '--accent-700': '#345179',
      '--accent-800': '#2d4565',
      '--accent-900': '#22315b',
      '--accent-950': '#1a2240',
    }
  },
  {
    id: 'teal',
    name: 'Turkuaz',
    preview: '#14b8a6',
    colors: {
      '--accent-50': '#f0fdfa',
      '--accent-100': '#ccfbf1',
      '--accent-200': '#99f6e4',
      '--accent-300': '#5eead4',
      '--accent-400': '#2dd4bf',
      '--accent-500': '#14b8a6',
      '--accent-600': '#0d9488',
      '--accent-700': '#0f766e',
      '--accent-800': '#115e59',
      '--accent-900': '#134e4a',
      '--accent-950': '#042f2e',
    }
  },
  {
    id: 'amber',
    name: 'Kehribar',
    preview: '#f59e0b',
    colors: {
      '--accent-50': '#fffbeb',
      '--accent-100': '#fef3c7',
      '--accent-200': '#fde68a',
      '--accent-300': '#fcd34d',
      '--accent-400': '#fbbf24',
      '--accent-500': '#f59e0b',
      '--accent-600': '#d97706',
      '--accent-700': '#b45309',
      '--accent-800': '#92400e',
      '--accent-900': '#78350f',
      '--accent-950': '#451a03',
    }
  },
  {
    id: 'emerald',
    name: 'Zümrüt',
    preview: '#10b981',
    colors: {
      '--accent-50': '#ecfdf5',
      '--accent-100': '#d1fae5',
      '--accent-200': '#a7f3d0',
      '--accent-300': '#6ee7b7',
      '--accent-400': '#34d399',
      '--accent-500': '#10b981',
      '--accent-600': '#059669',
      '--accent-700': '#047857',
      '--accent-800': '#065f46',
      '--accent-900': '#064e3b',
      '--accent-950': '#022c22',
    }
  },
  {
    id: 'red',
    name: 'Storm Kırmızı',
    preview: '#b91c1c',
    colors: {
      '--accent-50': '#fef2f2',
      '--accent-100': '#fee2e2',
      '--accent-200': '#fecaca',
      '--accent-300': '#fca5a5',
      '--accent-400': '#f87171',
      '--accent-500': '#b91c1c', // storm logo red
      '--accent-600': '#991b1b',
      '--accent-700': '#7f1d1d', // storm logo dark red
      '--accent-800': '#450a0a',
      '--accent-900': '#3a0909',
      '--accent-950': '#2b0707',
    }
  },
  {
    id: 'sky',
    name: 'Mavi',
    preview: '#0ea5e9',
    colors: {
      '--accent-50': '#f0f9ff',
      '--accent-100': '#e0f2fe',
      '--accent-200': '#bae6fd',
      '--accent-300': '#7dd3fc',
      '--accent-400': '#38bdf8',
      '--accent-500': '#0ea5e9',
      '--accent-600': '#0284c7',
      '--accent-700': '#0369a1',
      '--accent-800': '#075985',
      '--accent-900': '#0c4a6e',
      '--accent-950': '#031b2c',
    }
  },
  {
    id: 'gray',
    name: 'Gri',
    preview: '#71717a',
    colors: {
      '--accent-50': '#fafafa',
      '--accent-100': '#f4f4f5',
      '--accent-200': '#e4e4e7',
      '--accent-300': '#d4d4d8',
      '--accent-400': '#a1a1aa',
      '--accent-500': '#71717a',
      '--accent-600': '#52525b',
      '--accent-700': '#3f3f46',
      '--accent-800': '#27272a',
      '--accent-900': '#18181b',
      '--accent-950': '#09090b',
    }
  }
];

const StormIconWrapper = ({ iconElement, isActive }: { iconElement: React.ReactNode, isActive?: boolean }) => {
  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 rounded-lg overflow-hidden transition-all duration-200 w-8 h-8 text-white group-hover:scale-110`}
      style={{
        backgroundColor: isActive ? 'var(--accent-600)' : 'color-mix(in srgb, var(--accent-900) 40%, transparent)',
        boxShadow: isActive ? '0 0 10px color-mix(in srgb, var(--accent-500) 40%, transparent)' : 'none'
      }}
    >
      {/* Actual Icon */}
      <div className="relative z-10">
        {iconElement}
      </div>
    </div>
  );
};

const TAB_DEFS: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard: { label: 'Gösterge Paneli', icon: <LayoutDashboard size={16} /> },
  cariler: { label: 'Cari Hesaplar', icon: <Users size={16} /> },
  stoklar: { label: 'Stok Durumu', icon: <Package size={16} /> },
  islemler: { label: 'Finansal Hareketler', icon: <Receipt size={16} /> },
  ceksenet: { label: 'Çek ve Senet Takibi', icon: <Briefcase size={16} /> },
  masraflar: { label: 'Gider ve Masraflar', icon: <Wallet size={16} /> },
  kasa: { label: 'Kasa & Banka Durumu', icon: <DollarSign size={16} /> },
  krediler: { label: 'Kredi Takip Yönetimi', icon: <Landmark size={16} /> },
  calisanlar: { label: 'Personel & Maaşlar', icon: <Users size={16} /> },
  raporlar: { label: 'Raporlar ve Analiz', icon: <BarChart3 size={16} /> },
  ayarlar: { label: 'Sistem Ayarları', icon: <Settings size={16} /> }
};

const SIDEBAR_BG_PRESETS = [
  { id: 'pure-white', name: 'Kar Beyaz (Beyaz)', value: '#ffffff', border: 'rgba(0,0,0,0.1)' },
  { id: 'slate-gray', name: 'Mika Grisi', value: '#1e293b', border: 'rgba(255,255,255,0.12)' },
  { id: 'royal-navy', name: 'Safir Mavisi (Lacivert)', value: '#1e3a8a', border: 'rgba(255,255,255,0.15)' },
  { id: 'sampi10-blue', name: 'Sampi10 Mavisi', value: '#22315b', border: 'rgba(255,255,255,0.15)' },
  { id: 'vibrant-blue', name: 'Okyanus Mavisi (Mavi)', value: '#0284c7', border: 'rgba(255,255,255,0.15)' },
  { id: 'vibrant-amber', name: 'Altın Kehribar (Kehribar)', value: '#d97706', border: 'rgba(255,255,255,0.15)' },
  { id: 'forest-teal', name: 'Zümrüt Yeşili (Turkuaz)', value: '#0d9488', border: 'rgba(255,255,255,0.15)' },
  { id: 'storm-red', name: 'Storm Kırmızı', value: '#b91c1c', border: 'rgba(255,255,255,0.15)' }
];

const SIDEBAR_PATTERNS = [
  { id: 'none', name: 'Geometrik', svg: `url("data:image/svg+xml,%3Csvg width='60' height='104' viewBox='0 0 60 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z M30 69.28 L30 34.64 L0 17.32 M30 34.64 L60 17.32 M0 69.28 L30 86.6 L60 69.28 M30 86.6 L30 104 M0 69.28 L30 104 M60 69.28 L30 104 M0 51.96 L0 69.28 M60 51.96 L60 69.28 M0 0 L0 17.32 M60 0 L60 17.32 M0 69.28 L0 104 M60 69.28 L60 104' fill='none' stroke='PATTERNCOLOR' stroke-width='1.5' stroke-opacity='OPACITY'/%3E%3C/svg%3E")`, size: '60px 104px' },
  { id: 'flame', name: 'Halftone Baklava', svg: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='PATTERNCOLOR' opacity='OPACITY'%3E%3Cpath d='M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z' /%3E%3Cpath d='M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z' opacity='0.75' /%3E%3Cpath d='M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z' opacity='0.45' /%3E%3Cpath d='M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z' opacity='0.25' /%3E%3C/g%3E%3C/svg%3E")`, size: '120px 120px' },
  { id: 'crystal', name: 'Kristal', svg: `url("data:image/svg+xml,%3Csvg width='120' height='104' viewBox='0 0 120 104' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='OPACITY'%3E%3Cpolygon points='0,0 60,0 30,52' fill='PATTERNCOLOR' fill-opacity='0.3' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='60,0 120,0 90,52' fill='PATTERNCOLOR' fill-opacity='0.6' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='30,52 90,52 60,0' fill='PATTERNCOLOR' fill-opacity='0.4' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,0 30,52 0,52' fill='PATTERNCOLOR' fill-opacity='0.15' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='120,0 90,52 120,52' fill='PATTERNCOLOR' fill-opacity='0.15' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,52 60,52 30,104' fill='PATTERNCOLOR' fill-opacity='0.35' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='60,52 120,52 90,104' fill='PATTERNCOLOR' fill-opacity='0.65' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='30,104 90,104 60,52' fill='PATTERNCOLOR' fill-opacity='0.5' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='0,52 30,104 0,104' fill='PATTERNCOLOR' fill-opacity='0.2' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3Cpolygon points='120,52 90,104 120,104' fill='PATTERNCOLOR' fill-opacity='0.2' stroke='PATTERNCOLOR' stroke-opacity='0.15' stroke-width='1'/%3E%3C/g%3E%3C/svg%3E")`, size: '120px 104px' },
  { id: 'chain', name: 'Akışkan', svg: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='none' fill='PATTERNCOLOR' opacity='OPACITY'%3E%3Cpath d='M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z' fill-opacity='0.35'/%3E%3Cpath d='M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z' fill-opacity='0.35'/%3E%3Cpath d='M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z' fill-opacity='0.5'/%3E%3Cpath d='M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z' fill-opacity='0.5'/%3E%3Crect x='38' y='47' width='12' height='30' rx='6' fill-opacity='0.2'/%3E%3Crect x='98' y='15' width='12' height='40' rx='6' fill-opacity='0.2'/%3E%3Crect x='98' y='65' width='12' height='45' rx='6' fill-opacity='0.2'/%3E%3Crect x='15' y='-10' width='12' height='25' rx='6' fill-opacity='0.2'/%3E%3Crect x='15' y='110' width='12' height='25' rx='6' fill-opacity='0.2'/%3E%3Ccircle cx='28' cy='55' r='5' fill-opacity='0.25'/%3E%3Ccircle cx='85' cy='35' r='5' fill-opacity='0.25'/%3E%3Ccircle cx='85' cy='85' r='5' fill-opacity='0.25'/%3E%3C/g%3E%3C/svg%3E")`, size: '120px 120px' },
  { id: 'topography', name: 'Topografya', svg: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3Cpath d='M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3Cpath d='M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210' fill='none' stroke='PATTERNCOLOR' stroke-width='1' stroke-opacity='OPACITY'/%3E%3C/svg%3E")`, size: '200px 200px' },
];

export const PIN_ACCOUNTS = [
  { name: 'XSTORM', pin: '270212', email: 'admin@storm.com', password: 'storm_admin_pass' },
  { name: 'GÖKDOĞAN TEKSTİL', pin: '041646', email: 'muhasebe@storm.com', password: 'storm_muhasebe_pass' },
  { name: 'SAMPI10', pin: '111111', email: 'firma_1@storm.com', password: 'storm_firma1_pass' },
  { name: 'NİFER', pin: '222222', email: 'firma_2@storm.com', password: 'storm_firma2_pass' },
  { name: '3. Firma (Kullanıcı 3)', pin: '333333', email: 'firma_3@storm.com', password: 'storm_firma3_pass' },
];

const changelogData = [
  {
    version: "1.5.2",
    date: "06.07.2026",
    changes: [
      "Barkod tasarımı için 40x60 mm (dikey) boyutunda yeni barkod etiketi şablonu eklendi.",
      "Şablon Tasarımcısına 'Barkod Etiketi (40x60)' seçeneği ve dinamik kağıt boyutu desteği entegre edildi.",
      "Masaüstü uygulaması için yüksek çözünürlüklü .ico formatında yeni uygulama simgesi (icon) oluşturuldu ve simge uyumluluk hataları giderildi.",
      "Şablon derleyicisindeki mükerrer 'etiket_40x60' durum blokları temizlenerek üretim aşamasındaki (production build) hata giderildi.",
      "Büyük boyutlu yedek (.zip) dosyaları ve derleme artıkları Git takibinden çıkarılarak GitHub senkronizasyonu optimize edildi."
    ]
  },
  {
    version: "1.5.1",
    date: "06.07.2026",
    changes: [
      "Kişiselleştirme ayarlarındaki yan menü ve ana ekran arka plan desenlerinin tam ortalı durması ve ekran geneline eşit şekilde dağılması sağlandı.",
      "SVG desen şablonlarındaki koordinat ve hizalama (offset/position) parametreleri optimize edilerek görsel kaymalar giderildi."
    ]
  },
  {
    version: "1.5.0",
    date: "06.07.2026",
    changes: [
      "Yapay Zeka (AI) Asistanı üzerinden 'add_customer', 'add_supplier' ve 'add_product' komutlarıyla sesli/yazılı hızlı veri ekleme desteği eklendi.",
      "Kristal arka plan deseni, arayüz renklerine dinamik olarak uyum sağlayacak şekilde tamamen yeniden tasarlandı.",
      "Geometrik ve Kristal desen isimleri sadeleştirilerek menü tasarımları optimize edildi.",
      "Kullanılmayan atıl kodlar, eski taslak dosyaları ve geçici logo dönüştürücüleri temizlenerek masaüstü (.exe) paket boyutu ve bellek (RAM) tüketimi minimize edildi.",
      "Masaüstü derleme (electron-builder) ayarları, kaynak kodları ve gereksiz kütüphaneleri dışlayarak hafifletildi."
    ]
  },
  {
    version: "1.4.9",
    date: "02.07.2026",
    changes: [
      "Kişiselleştirme ayarlarındaki yan menü deseni, modern 3D Geometrik Desen (Yeni Arka Plan) olarak güncellendi.",
      "Versiyon 1.4.9'a yükseltildi ve otomatik güncelleme (Auto-Updater) test edildi."
    ]
  },
  {
    version: "1.4.8",
    date: "01.07.2026",
    changes: [
      "Masaüstü uygulaması için özel logo entegre edildi.",
      "Kişiselleştirme ayarlarına yeni 'Topografya' deseni eklendi.",
      "Hata ve sistem loglarının takibi için Telegram entegrasyonu test edildi ve iyileştirildi."
    ]
  },
  {
    version: "1.4.7",
    date: "01.07.2026",
    changes: [
      "Satıştan İade ve Alıştan İade işlemleri eklendi.",
      "Gereksiz dosyalar temizlendi ve uygulama paket (exe) boyutu optimize edildi.",
      "Electron build yapılandırması optimize edilerek daha hızlı açılış ve düşük bellek tüketimi sağlandı."
    ]
  },
  {
    version: "1.4.6",
    date: "30.06.2026",
    changes: [
      "Şablon Tasarımına Stok Kartları için Barkod Etiketi oluşturma seçeneği eklendi.",
      "Standart A4 ve Termal yazıcılar için (EAN-13, CODE128) format desteği getirildi."
    ]
  },
  {
    version: "1.4.5",
    date: "30.06.2026",
    changes: [
      "Stok ve Hızlı Satış ekranları için Barkod Okuyucu desteği eklendi.",
      "Stok eklerken otomatik barkod numarası oluşturma (Oluştur butonu) özelliği getirildi.",
      "Hızlı satış ve fatura oluşturma ekranlarına barkod okutarak hızlıca ürün ekleme özelliği entegre edildi."
    ]
  },
  {
    version: "1.4.4",
    date: "30.06.2026",
    changes: [
      "Kullanıcıların sistemdeki hataları ve istekleri bildirebileceği Hata / İstek Bildir modülü eklendi.",
      "Yönetici panelinde sistem hataları ve kullanıcı geri bildirimlerini yönetmek için yeni arayüz oluşturuldu."
    ]
  },
  {
    version: "1.4.3",
    date: "30.06.2026",
    changes: [
      "Tüm modüllere POS (Kredi Kartı) tahsilat ve ödeme seçenekleri eklendi.",
      "Kasa bölümüne POS hesapları için özel filtreleme eklendi.",
      "Hesap bakiyeleri hesaplamaları POS ödemelerini destekleyecek şekilde güncellendi."
    ]
  },
  {
    version: "1.4.2",
    date: "30.06.2026",
    changes: [
      "Yapay Zeka asistan ikonu güncellendi (Yapay Zeka temasını daha fazla ön plana çıkaran ikonlar).",
      "Arayüz temaları sadeleştirildi ve arayüz rengi beyaz (Light mode) destekli hale getirildi.",
      "Gereksiz renk temaları kaldırılarak arayüz daha derli toplu hale getirildi."
    ]
  },
  {
    version: "1.4.1",
    date: "30.06.2026",
    changes: [
      "Hesaplar arası çapraz döviz transferi ve kur çevirici eklendi.",
      "Tahsilat ve Ödeme makbuzlarında detaylı Kasa/Banka seçimi eklendi."
    ]
  },
  {
    version: "1.4.0",
    date: "30.06.2026",
    changes: [
      "Kredi Takip Yönetimi modülü eklendi: Banka kredileri ve finansman ödemeleri takip edilebilir hale getirildi.",
      "Kredi listeleme, ekleme ve aktif/kapanmış durum kontrolleri gerçek zamanlı veritabanına bağlandı."
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'cariler' | 'stoklar' | 'islemler' | 'ceksenet' | 'masraflar' | 'calisanlar' | 'ayarlar' | 'kasa' | 'raporlar' | 'krediler'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingIslemModal, setPendingIslemModal] = useState<'sale' | 'purchase' | 'collection' | 'payment' | null>(null);
  const [pendingCariId, setPendingCariId] = useState<string | null>(null);
  const [isIslemlerSubMenuOpen, setIsIslemlerSubMenuOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    const saved = localStorage.getItem('kolay_hesap_accent_theme');
    if (saved === 'rose') return 'red';
    return saved || 'red';
  });

  const [activeLogoTheme, setActiveLogoTheme] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_logo_theme') || 'red';
  });

  const [appFontSize, setAppFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('storm_muhasebe_font_size') as 'small' | 'medium' | 'large') || 'medium';
  });

  const [sidebarBg, setSidebarBg] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_bg') || '#ffffff';
  });

  const [sidebarPattern, setSidebarPattern] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_pattern') || 'crystal';
  });

  const [sidebarPatternOpacity, setSidebarPatternOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('storm_muhasebe_sidebar_pattern_opacity') || '0.02');
  });

  const [sidebarPatternColor, setSidebarPatternColor] = useState<'white' | 'black' | 'theme'>(() => {
    return (localStorage.getItem('storm_muhasebe_sidebar_pattern_color') as 'white' | 'black' | 'theme') || 'white';
  });

  const [hiddenTabs, setHiddenTabs] = useState<string[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_hidden_tabs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {}
    }
    return [];
  });

  const toggleTabVisibility = (tabId: string) => {
    if (tabId === 'ayarlar' || tabId === 'dashboard') return;
    setHiddenTabs((prev) => {
      const next = prev.includes(tabId)
        ? prev.filter((t) => t !== tabId)
        : [...prev, tabId];
      localStorage.setItem('storm_muhasebe_hidden_tabs', JSON.stringify(next));
      return next;
    });
  };

  const handleDownloadLogoSvg = () => {
    let fillCol = '#dc2626'; // Default red
    const currentLogoTheme = activeLogoTheme === 'theme' ? activeTheme : activeLogoTheme;
    const preset = COLOR_PRESETS.find(p => p.id === currentLogoTheme);
    if (preset) {
      fillCol = preset.preview || '#dc2626';
    } else if (currentLogoTheme === 'theme') {
      const activePreset = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
      fillCol = activePreset.preview || '#dc2626';
    }

    const currentPattern = sidebarPattern;
    const opacity = Math.min(0.24, Math.max(0.08, sidebarPatternOpacity * 5));

    let patternMarkup = '';
    let patternUrl = '';
    const patternId = 'storm-download-pattern';

    if (currentPattern === 'none') {
      patternMarkup = `
        <pattern id="${patternId}" width="60" height="104" patternUnits="userSpaceOnUse" viewBox="0 0 60 104" x="70" y="48">
          <path d="M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z M30 69.28 L30 34.64 L0 17.32 M30 34.64 L60 17.32 M0 69.28 L30 86.6 L60 69.28 M30 86.6 L30 104 M0 69.28 L30 104 M60 69.28 L30 104 M0 51.96 L0 69.28 M60 51.96 L60 69.28 M0 0 L0 17.32 M60 0 L60 17.32 M0 69.28 L0 104 M60 69.28 L60 104" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="${opacity}"/>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'flame') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="120" patternUnits="userSpaceOnUse" viewBox="0 0 120 120" x="40" y="40">
          <g fill="#ffffff" opacity="${opacity}">
            <path d="M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z" />
            <path d="M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z" fill-opacity="0.75" />
            <path d="M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z" fill-opacity="0.45" />
            <path d="M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z" fill-opacity="0.25" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'crystal') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="104" patternUnits="userSpaceOnUse" viewBox="0 0 120 104" x="40" y="48">
          <g opacity="${opacity * 1.5}">
            <polygon points="0,0 60,0 30,52" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="60,0 120,0 90,52" fill="#ffffff" fill-opacity="0.6" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="30,52 90,52 60,0" fill="#ffffff" fill-opacity="0.4" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,0 30,52 0,52" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="120,0 90,52 120,52" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,52 60,52 30,104" fill="#ffffff" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="60,52 120,52 90,104" fill="#ffffff" fill-opacity="0.65" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="30,104 90,104 60,52" fill="#ffffff" fill-opacity="0.5" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,52 30,104 0,104" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="120,52 90,104 120,104" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'chain') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="120" patternUnits="userSpaceOnUse" viewBox="0 0 120 120" x="40" y="40">
          <g stroke="none" fill="#ffffff" opacity="${opacity}">
            <path d="M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z" fill-opacity="0.35" />
            <path d="M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z" fill-opacity="0.35" />
            <path d="M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z" fill-opacity="0.5" />
            <path d="M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z" fill-opacity="0.5" />
            <rect x="38" y="47" width="12" height="30" rx="6" fill-opacity="0.2" />
            <rect x="98" y="15" width="12" height="40" rx="6" fill-opacity="0.2" />
            <rect x="98" y="65" width="12" height="45" rx="6" fill-opacity="0.2" />
            <rect x="15" y="-10" width="12" height="25" rx="6" fill-opacity="0.2" />
            <rect x="15" y="110" width="12" height="25" rx="6" fill-opacity="0.2" />
            <circle cx="28" cy="55" r="5" fill-opacity="0.25" />
            <circle cx="85" cy="35" r="5" fill-opacity="0.25" />
            <circle cx="85" cy="85" r="5" fill-opacity="0.25" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'topography') {
      patternMarkup = `
        <pattern id="${patternId}" width="200" height="200" patternUnits="userSpaceOnUse" viewBox="0 0 200 200">
          <g stroke="#ffffff" stroke-width="1.2" fill="none" stroke-opacity="${opacity}">
            <path d="M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150" />
            <path d="M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10" />
            <path d="M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    }

    const patternRect = patternUrl ? `<rect width="200" height="200" rx="48" fill="${patternUrl}" />` : '';

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <defs>
          ${patternMarkup}
        </defs>
        <rect width="200" height="200" rx="48" fill="${fillCol}" />
        ${patternRect}
        <g transform="translate(78, 32)">
          <path d="M28 2 L8 38 L23 38 L15 66 L42 28 L28 28 Z" fill="#ffffff" />
        </g>
        <text x="100" y="132" dx="2" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="23" fill="#ffffff" letter-spacing="4">STORM</text>
        <text x="100" y="156" dx="1.25" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="9" fill="#ffffff" letter-spacing="2.5" opacity="0.9">MUHASEBE</text>
      </svg>
    `.trim();

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'storm-muhasebe-logo.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadLogoPng = () => {
    let fillCol = '#dc2626'; // Default red
    const currentLogoTheme = activeLogoTheme === 'theme' ? activeTheme : activeLogoTheme;
    const preset = COLOR_PRESETS.find(p => p.id === currentLogoTheme);
    if (preset) {
      fillCol = preset.preview || '#dc2626';
    } else if (currentLogoTheme === 'theme') {
      const activePreset = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS[0];
      fillCol = activePreset.preview || '#dc2626';
    }

    const currentPattern = sidebarPattern;
    const opacity = Math.min(0.24, Math.max(0.08, sidebarPatternOpacity * 5));

    let patternMarkup = '';
    let patternUrl = '';
    const patternId = 'storm-download-pattern-png';

    if (currentPattern === 'none') {
      patternMarkup = `
        <pattern id="${patternId}" width="60" height="104" patternUnits="userSpaceOnUse" viewBox="0 0 60 104" x="70" y="48">
          <path d="M0 17.32 L30 0 L60 17.32 L60 51.96 L30 69.28 L0 51.96 Z M30 69.28 L30 34.64 L0 17.32 M30 34.64 L60 17.32 M0 69.28 L30 86.6 L60 69.28 M30 86.6 L30 104 M0 69.28 L30 104 M60 69.28 L30 104 M0 51.96 L0 69.28 M60 51.96 L60 69.28 M0 0 L0 17.32 M60 0 L60 17.32 M0 69.28 L0 104 M60 69.28 L60 104" fill="none" stroke="#ffffff" stroke-width="1.2" stroke-opacity="${opacity}"/>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'flame') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="120" patternUnits="userSpaceOnUse" viewBox="0 0 120 120" x="40" y="40">
          <g fill="#ffffff" opacity="${opacity}">
            <path d="M 0,-11 L 11,0 L 0,11 L -11,0 Z M 0,29 L 11,40 L 0,51 L -11,40 Z M 0,69 L 11,80 L 0,91 L -11,80 Z M 0,109 L 11,120 L 0,131 L -11,120 Z M 120,-11 L 131,0 L 120,11 L 109,0 Z M 120,29 L 131,40 L 120,51 L 109,40 Z M 120,69 L 131,80 L 120,91 L 109,80 Z M 120,109 L 131,120 L 120,131 L 109,120 Z" />
            <path d="M 20,12 L 28,20 L 20,28 L 12,20 Z M 20,52 L 28,60 L 20,68 L 12,60 Z M 20,92 L 28,100 L 20,108 L 12,100 Z M 100,12 L 108,20 L 100,28 L 92,20 Z M 100,52 L 108,60 L 100,68 L 92,60 Z M 100,92 L 108,100 L 100,108 L 92,100 Z" fill-opacity="0.75" />
            <path d="M 40,-5 L 45,0 L 40,5 L 35,0 Z M 40,35 L 45,40 L 40,45 L 35,40 Z M 40,75 L 45,80 L 40,85 L 35,80 Z M 40,115 L 45,120 L 40,125 L 35,120 Z M 80,-5 L 85,0 L 80,5 L 75,0 Z M 80,35 L 85,40 L 80,45 L 75,40 Z M 80,75 L 85,80 L 80,85 L 75,80 Z M 80,115 L 85,120 L 80,125 L 75,120 Z" fill-opacity="0.45" />
            <path d="M 60,17.5 L 62.5,20 L 60,22.5 L 57.5,20 Z M 60,57.5 L 62.5,60 L 60,62.5 L 57.5,60 Z M 60,97.5 L 62.5,100 L 60,102.5 L 57.5,100 Z" fill-opacity="0.25" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'crystal') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="104" patternUnits="userSpaceOnUse" viewBox="0 0 120 104" x="40" y="48">
          <g opacity="${opacity * 1.5}">
            <polygon points="0,0 60,0 30,52" fill="#ffffff" fill-opacity="0.3" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="60,0 120,0 90,52" fill="#ffffff" fill-opacity="0.6" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="30,52 90,52 60,0" fill="#ffffff" fill-opacity="0.4" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,0 30,52 0,52" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="120,0 90,52 120,52" fill="#ffffff" fill-opacity="0.15" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,52 60,52 30,104" fill="#ffffff" fill-opacity="0.35" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="60,52 120,52 90,104" fill="#ffffff" fill-opacity="0.65" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="30,104 90,104 60,52" fill="#ffffff" fill-opacity="0.5" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="0,52 30,104 0,104" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
            <polygon points="120,52 90,104 120,104" fill="#ffffff" fill-opacity="0.2" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1"/>
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'chain') {
      patternMarkup = `
        <pattern id="${patternId}" width="120" height="120" patternUnits="userSpaceOnUse" viewBox="0 0 120 120" x="40" y="40">
          <g stroke="none" fill="#ffffff" opacity="${opacity}">
            <path d="M 0,0 L 30,0 C 30,20 15,20 15,40 L 15,80 C 15,100 30,100 30,120 L 0,120 Z" fill-opacity="0.35" />
            <path d="M 70,0 L 100,0 C 100,20 115,30 115,50 L 115,70 C 115,90 70,95 70,110 L 70,120 L 120,120 L 120,0 Z" fill-opacity="0.35" />
            <path d="M 45,0 L 57,0 L 57,35 C 57,42 45,42 45,35 Z" fill-opacity="0.5" />
            <path d="M 45,120 L 57,120 L 57,85 C 57,78 45,78 45,85 Z" fill-opacity="0.5" />
            <rect x="38" y="47" width="12" height="30" rx="6" fill-opacity="0.2" />
            <rect x="98" y="15" width="12" height="40" rx="6" fill-opacity="0.2" />
            <rect x="98" y="65" width="12" height="45" rx="6" fill-opacity="0.2" />
            <rect x="15" y="-10" width="12" height="25" rx="6" fill-opacity="0.2" />
            <rect x="15" y="110" width="12" height="25" rx="6" fill-opacity="0.2" />
            <circle cx="28" cy="55" r="5" fill-opacity="0.25" />
            <circle cx="85" cy="35" r="5" fill-opacity="0.25" />
            <circle cx="85" cy="85" r="5" fill-opacity="0.25" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    } else if (currentPattern === 'topography') {
      patternMarkup = `
        <pattern id="${patternId}" width="200" height="200" patternUnits="userSpaceOnUse" viewBox="0 0 200 200">
          <g stroke="#ffffff" stroke-width="1.2" fill="none" stroke-opacity="${opacity}">
            <path d="M0 50 Q 50 100 100 50 T 200 50 M0 70 Q 50 120 100 70 T 200 70 M0 90 Q 50 140 100 90 T 200 90 M0 110 Q 50 160 100 110 T 200 110 M0 130 Q 50 180 100 130 T 200 130 M0 150 Q 50 200 100 150 T 200 150" />
            <path d="M0 30 Q 50 80 100 30 T 200 30 M0 10 Q 50 60 100 10 T 200 10 M0 -10 Q 50 40 100 -10 T 200 -10" />
            <path d="M0 170 Q 50 220 100 170 T 200 170 M0 190 Q 50 240 100 190 T 200 190 M0 210 Q 50 260 100 210 T 200 210" />
          </g>
        </pattern>
      `;
      patternUrl = `url(#${patternId})`;
    }

    const patternRectPng = patternUrl ? `<rect width="200" height="200" rx="48" fill="${patternUrl}" />` : '';

    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="512" height="512">
        <defs>
          ${patternMarkup}
        </defs>
        <rect width="200" height="200" rx="48" fill="${fillCol}" />
        ${patternRectPng}
        <g transform="translate(78, 32)">
          <path d="M28 2 L8 38 L23 38 L15 66 L42 28 L28 28 Z" fill="#ffffff" />
        </g>
        <text x="100" y="132" dx="2" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="23" fill="#ffffff" letter-spacing="4">STORM</text>
        <text x="100" y="156" dx="1.25" text-anchor="middle" font-family="system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="800" font-size="9" fill="#ffffff" letter-spacing="2.5" opacity="0.9">MUHASEBE</text>
      </svg>
    `.trim();

    const img = new Image();
    const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, 512, 512);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = 'storm-muhasebe-logo.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
          }
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem('storm_muhasebe_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const required = ['dashboard', 'cariler', 'stoklar', 'islemler', 'ceksenet', 'masraflar', 'kasa', 'krediler', 'calisanlar', 'raporlar', 'ayarlar'];
          const filtered = parsed.filter((t: string) => required.includes(t));
          const missing = required.filter((t: string) => !filtered.includes(t));
          return [...filtered, ...missing];
        }
      } catch (e) {}
    }
    return ['dashboard', 'cariler', 'stoklar', 'islemler', 'ceksenet', 'masraflar', 'kasa', 'krediler', 'calisanlar', 'raporlar', 'ayarlar'];
  });

  const moveTab = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...tabOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const temp = newOrder[index];
      newOrder[index] = newOrder[targetIndex];
      newOrder[targetIndex] = temp;
      setTabOrder(newOrder);
      localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(newOrder));
    }
  };
  
  // Auth state variables
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  
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
  const [feedbackCompany, setFeedbackCompany] = useState('');
  const [adminTab, setAdminTab] = useState<'errors' | 'feedback'>('errors');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
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
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsPasswordVisible, setSettingsPasswordVisible] = useState(false);
  const [settingsPasswordSuccess, setSettingsPasswordSuccess] = useState<string | null>(null);
  const [settingsPasswordError, setSettingsPasswordError] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Profile Settings State
  const [profileName, setProfileName] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  
  useEffect(() => {
    if (user) {
      setProfileName(user.displayName || '');
      setProfilePhoto((user as any).photoURL || '');
    }
  }, [user]);

  const [settingsSubTab, setSettingsSubTab] = useState<'general' | 'profile' | 'print' | 'template-designer' | 'ai' | 'updates'>('general');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_gemini_api_key') || '';
  });
  
  const [telegramBotToken, setTelegramBotToken] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_telegram_bot_token') || '8661867798:AAHVgj4cyEw3D_NS19jjiSBqkJe7nvIFfy0';
  });
  const [telegramChatId, setTelegramChatId] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_telegram_chat_id') || '-5266920189';
  });

  // Backup States
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('storm_auto_backup_enabled') !== 'false';
  });
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{text: string, type: 'success'|'error'} | null>(null);

  // Sync auto backup with electron when it changes
  useEffect(() => {
    if (window.electronAPI && window.electronAPI.setAutoBackup) {
      window.electronAPI.setAutoBackup(autoBackupEnabled);
    }
  }, [autoBackupEnabled]);

  const [aiInfoModalOpen, setAiInfoModalOpen] = useState(false);
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

  // Centralized Print Settings State
  const [companyName, setCompanyName] = useState('Firma Adı');
  const [companyAddress, setCompanyAddress] = useState('Firma Adresi');
  const [companyPhone, setCompanyPhone] = useState('0555 555 55 55');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  
  const [printSettingsSuccess, setPrintSettingsSuccess] = useState<string | null>(null);

  // Load from local storage dynamically
  const initialPrintSettings = useMemo(() => {
    const DEFAULT_PRINT_SETTINGS = {
      companyName: 'Firma Adı',
      companyAddress: 'Firma Adresi',
      companyPhone: '0555 555 55 55',
      logoType: 'text' as 'text' | 'image',
      logoImageUrl: '',
    };
    const saved = localStorage.getItem('storm_muhasebe_print_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PRINT_SETTINGS;
  }, []);

  useEffect(() => {
    setCompanyName(initialPrintSettings.companyName);
    setCompanyAddress(initialPrintSettings.companyAddress);
    setCompanyPhone(initialPrintSettings.companyPhone);
    setLogoType(initialPrintSettings.logoType);
    setLogoImageUrl(initialPrintSettings.logoImageUrl);
  }, [initialPrintSettings]);

  const handleSavePrintSettings = () => {
    const existing = localStorage.getItem('storm_muhasebe_print_settings');
    let parsed = {};
    if (existing) {
      try { parsed = JSON.parse(existing); } catch(e) {}
    }
    
    const settingsToSave = {
      ...parsed,
      companyName,
      companyAddress,
      companyPhone,
      logoType,
      logoImageUrl,
    };
    localStorage.setItem('storm_muhasebe_print_settings', JSON.stringify(settingsToSave));
    setPrintSettingsSuccess('Firma bilgileri başarıyla kaydedildi!');
    setTimeout(() => setPrintSettingsSuccess(null), 3000);
  };

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
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState<boolean>(false);
  const [availableUpdateVersion, setAvailableUpdateVersion] = useState<string>('');

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

  // App data state
  const [cariler, setCariler] = useState<Cari[]>([]);

  const [stoklar, setStoklar] = useState<Stock[]>([]);
  const [islemler, setIslemler] = useState<Transaction[]>([]);
  const [ceksenet, setCeksenet] = useState<CekSenet[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeTransactions, setEmployeeTransactions] = useState<EmployeeTransaction[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  
  // Loading & connection state
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize Authentication state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('storm_muhasebe_active_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Do NOT auto-login, require PIN entry every time.
        setActiveUser(null);
        setUser(null); 
      } catch (e) {
        localStorage.removeItem('storm_muhasebe_active_user');
        setActiveUser(null);
      }
    } else {
      setActiveUser(null);
    }
    setAuthLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Monitor network connection status
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

  // Real-time synchronization when user is signed in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let carilerLoaded = false;
    let stoklarLoaded = false;
    let islemlerLoaded = false;
    let ceksenetLoaded = false;
    let expensesLoaded = false;
    let employeesLoaded = false;
    let employeeTransactionsLoaded = false;
    let creditsLoaded = false;
    let bankAccountsLoaded = false;
    let accountTransactionsLoaded = false;

    const checkLoadingFinished = () => {
      if (
        carilerLoaded && 
        stoklarLoaded && 
        islemlerLoaded && 
        ceksenetLoaded && 
        expensesLoaded &&
        employeesLoaded &&
        employeeTransactionsLoaded &&
        creditsLoaded &&
        bankAccountsLoaded &&
        accountTransactionsLoaded
      ) {
        setLoading(false);
      }
    };

    const unsubscribeCari = subscribeCariler((data) => {
      setCariler(data);
      carilerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeStok = subscribeStoklar((data) => {
      setStoklar(data);
      stoklarLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeIslem = subscribeIslemler((data) => {
      setIslemler(data);
      islemlerLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeCek = subscribeCekSenet((data) => {
      setCeksenet(data);
      ceksenetLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeExpenses = subscribeExpenses((data) => {
      setExpenses(data);
      expensesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployees = subscribeEmployees((data) => {
      setEmployees(data);
      employeesLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeEmployeeTxs = subscribeEmployeeTransactions((data) => {
      setEmployeeTransactions(data);
      employeeTransactionsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeCredits = subscribeCredits((data) => {
      setCredits(data);
      creditsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeBankAccounts = subscribeBankAccounts((data) => {
      setBankAccounts(data);
      bankAccountsLoaded = true;
      checkLoadingFinished();
    });

    const unsubscribeAccountTransactions = subscribeAccountTransactions((data) => {
      setAccountTransactions(data);
      accountTransactionsLoaded = true;
      checkLoadingFinished();
    });

    return () => {
      unsubscribeCari();
      unsubscribeStok();
      unsubscribeIslem();
      unsubscribeCek();
      unsubscribeExpenses();
      unsubscribeEmployees();
      unsubscribeEmployeeTxs();
      unsubscribeCredits();
      unsubscribeBankAccounts();
      unsubscribeAccountTransactions();
    };
  }, [user]);

  const handlePinSubmit = async (enteredPinValue: string) => {
    if (enteredPinValue.length !== 6) {
      setAuthError('Lütfen 6 haneli giriş kodunuzu tam olarak girin.');
      return;
    }

    const account = PIN_ACCOUNTS.find(acc => acc.pin === enteredPinValue);
    if (!account) {
      setAuthError('Geçersiz giriş kodu! Lütfen sistemde tanımlı olan 5 koddan birini kullanın.');
      return;
    }

    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, account.email, account.password);
    } catch (err: any) {
      console.warn("Otomatik giriş başarısız oldu, kullanıcı kaydı kontrol ediliyor...", err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, account.email, account.password);
          await updateProfile(userCredential.user, {
            displayName: account.name
          });
        } catch (createErr: any) {
          console.error("Otomatik hesap kaydı başarısız oldu:", createErr);
          setAuthError(`Kullanıcı kaydı oluşturulamadı: ${createErr.message || createErr}`);
        }
      } else {
        setAuthError(`Giriş hatası: ${err.message || err}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (user) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.key >= '0' && e.key <= '9') {
        setEnteredPin(prev => {
          if (prev.length < 6) {
            const nextPin = prev + e.key;
            if (nextPin.length === 6) {
              handlePinSubmit(nextPin);
            }
            return nextPin;
          }
          return prev;
        });
      } else if (e.key === 'Backspace') {
        setEnteredPin(prev => prev.slice(0, -1));
      } else if (e.key === 'Escape') {
        setEnteredPin('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!authName.trim()) {
          throw new Error('Lütfen adınızı ve soyadınızı girin.');
        }
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        await updateProfile(userCredential.user, {
          displayName: authName.trim()
        });
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
      }
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Giriş yapılırken bir hata oluştu.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        errorMsg = 'E-posta adresi veya şifre hatalı.';
      } else if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Bu e-posta adresi zaten başka bir hesap tarafından kullanılıyor.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Şifre çok zayıf. En az 6 karakter olmalıdır.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Geçersiz e-posta adresi.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Google ile giriş yapılırken bir hata oluştu.';
      if (err.code === 'auth/popup-blocked') {
        errorMsg = 'Giriş penceresi tarayıcı tarafından engellendi. Lütfen açılır pencerelere izin verin.';
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        errorMsg = 'Giriş işlemi pencere kapatıldığı için tamamlanamadı.';
      } else if (err.code === 'auth/unauthorized-domain') {
        errorMsg = 'Masaüstü uygulamasında (Electron) güvenlik kısıtlamaları nedeniyle doğrudan Google ile Giriş desteklenmez. Lütfen web sürümünde kullandığınız E-posta ve Şifre ile giriş yapın veya yeni bir e-posta hesabı oluşturun.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!authEmail.trim()) {
      setAuthError('Şifre sıfırlama bağlantısı göndermek için lütfen önce E-posta Adresi alanını doldurun.');
      return;
    }
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);
    try {
      await sendPasswordResetEmail(auth, authEmail.trim());
      setAuthSuccess('Şifre sıfırlama ve belirleme bağlantısı e-posta adresinize gönderildi! Lütfen gelen kutunuzu (ve gereksiz/spam klasörünü) kontrol ederek yeni şifrenizi belirleyin.');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Şifre sıfırlama e-postası gönderilirken bir hata oluştu.';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Geçersiz e-posta adresi.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showBackupMessage = (text: string, type: 'success' | 'error') => {
    setBackupMessage({ text, type });
    setTimeout(() => setBackupMessage(null), 5000);
  };

  const handleManualBackup = async () => {
    if (!window.electronAPI || !window.electronAPI.createManualBackup) {
      showBackupMessage("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    setIsBackupLoading(true);
    try {
      const response = await window.electronAPI.createManualBackup();
      if (response.success) {
        showBackupMessage(`Yedekleme başarıyla tamamlandı.\nKonum: ${response.path}`, "success");
      } else if (!response.canceled) {
        showBackupMessage(`Yedekleme hatası: ${response.error}`, "error");
      }
    } catch (err: any) {
      showBackupMessage(`Beklenmeyen bir hata oluştu: ${err.message}`, "error");
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!window.electronAPI || !window.electronAPI.restoreFromBackup) {
      showBackupMessage("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    setIsBackupLoading(true);
    try {
      const response = await window.electronAPI.restoreFromBackup();
      if (!response.success && !response.canceled) {
        showBackupMessage(`Geri yükleme hatası: ${response.error}`, "error");
      }
    } catch (err: any) {
      showBackupMessage(`Beklenmeyen bir hata oluştu: ${err.message}`, "error");
    } finally {
      setIsBackupLoading(false);
    }
  };

  const handleOpenBackupFolder = async () => {
    if (!window.electronAPI || !window.electronAPI.openAutoBackupFolder) {
      showBackupMessage("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.", "error");
      return;
    }
    try {
      await window.electronAPI.openAutoBackupFolder();
    } catch (err: any) {
      showBackupMessage(`Klasör açılamadı: ${err.message}`, "error");
    }
  };

  const toggleAutoBackup = () => {
    const newVal = !autoBackupEnabled;
    setAutoBackupEnabled(newVal);
    localStorage.setItem('storm_auto_backup_enabled', newVal.toString());
  };

  const handleProfileUpdate = async () => {
    if (profilePassword && profilePassword.length !== 6) {
      setSettingsPasswordError('Uygulama pin şifreniz tam olarak 6 hane olmalıdır.');
      return;
    }
    
    if (!user) return;
    
    // 1. Update in the user list so that it shows on the login screen
    const updatedUsers = usersList.map(u => {
      if (u.id === user?.uid) {
        return {
          ...u,
          name: profileName || u.name,
          pin: profilePassword || u.pin,
          photoURL: profilePhoto || u.photoURL
        };
      }
      return u;
    });
    
    setUsersList(updatedUsers);
    localStorage.setItem('storm_muhasebe_users', JSON.stringify(updatedUsers));
    
    // 2. Update the active logged in user in localStorage
    const updatedUser = {
      ...user,
      displayName: profileName || user.displayName,
      photoURL: profilePhoto || (user as any).photoURL
    };
    setUser(updatedUser);
    localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(updatedUser));

    // 3. Update Firebase Auth profile
    if (auth.currentUser) {
      try {
        await updateProfile(auth.currentUser, {
          displayName: profileName || user.displayName,
          photoURL: profilePhoto || (user as any).photoURL
        });
      } catch (err) {
        console.error("Firebase profil güncellenemedi:", err);
      }
    }
    
    setSettingsPasswordSuccess('Profil bilgileriniz başarıyla güncellendi.');
    setTimeout(() => setSettingsPasswordSuccess(null), 4000);
    setProfilePassword('');
    setSettingsPasswordError(null);
  };

  const handleUpdateSettingsPassword = async () => {
    if (!settingsPassword || settingsPassword.length < 6) {
      setSettingsPasswordError('Şifre en az 6 karakterden oluşmalıdır.');
      return;
    }
    if (!auth.currentUser) {
      setSettingsPasswordError('Oturum açmış bir kullanıcı bulunamadı.');
      return;
    }
    
    setSettingsPasswordError(null);
    setSettingsPasswordSuccess(null);
    setIsUpdatingPassword(true);
    
    try {
      await updatePassword(auth.currentUser, settingsPassword);
      setSettingsPasswordSuccess('Şifreniz başarıyla güncellendi ve tanımlandı! Artık bilgisayar uygulamasında bu e-posta adresi ve yeni şifrenizle doğrudan giriş yapabilirsiniz.');
      setSettingsPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        try {
          setSettingsPasswordError('Güvenlik doğrulamasının yenilenmesi gerekiyor. Lütfen açılan Google penceresinden hesabınızı onaylayın...');
          await reauthenticateWithGoogle();
          
          if (auth.currentUser) {
            await updatePassword(auth.currentUser, settingsPassword);
            setSettingsPasswordSuccess('Şifreniz başarıyla güncellendi ve tanımlandı! Artık bilgisayar uygulamasında bu e-posta adresi ve yeni şifrenizle doğrudan giriş yapabilirsiniz.');
            setSettingsPassword('');
            setSettingsPasswordError(null);
          } else {
            setSettingsPasswordError('Kullanıcı oturumu bulunamadı.');
          }
        } catch (reauthErr: any) {
          console.error(reauthErr);
          let errorMsg = 'Güvenlik doğrulaması tamamlanamadı.';
          if (reauthErr.message) {
            errorMsg = `Güvenlik doğrulaması başarısız: ${reauthErr.message}`;
          }
          setSettingsPasswordError(errorMsg);
        }
      } else {
        let errorMsg = 'Şifre güncellenirken bir hata oluştu.';
        if (err.message) {
          errorMsg = err.message;
        }
        setSettingsPasswordError(errorMsg);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      localStorage.removeItem('storm_muhasebe_active_user');
      setActiveUser(null);
      setUser(null);
      setCariler([]);
      setStoklar([]);
      setIslemler([]);
      setCeksenet([]);
      setExpenses([]);
      setEmployees([]);
      setEmployeeTransactions([]);
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Çıkış hatası:', err);
    }
  };

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleResetAllData = async () => {
    if (resetConfirmationText.trim().toUpperCase() !== 'SIFIRLA') {
      setResetError('Lütfen doğrulamak için "SIFIRLA" yazın.');
      return;
    }
    try {
      setIsResetting(true);
      setResetError(null);
      await clearAllDatabaseData();
      setResetModalOpen(false);
      setResetConfirmationText('');
    } catch (err: any) {
      setResetError(err.message || 'Veriler sıfırlanırken bir hata oluştu.');
    } finally {
      setIsResetting(false);
    }
  };

  const activePattern = SIDEBAR_PATTERNS.find(p => p.id === sidebarPattern) || SIDEBAR_PATTERNS[0];
  let patternColorValue = '%23ffffff';
  if (sidebarPatternColor === 'black') {
    patternColorValue = '%23000000';
  } else if (sidebarPatternColor === 'theme') {
    const currentThemeDataForPattern = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS.find(p => p.id === 'red') || COLOR_PRESETS[0];
    patternColorValue = currentThemeDataForPattern.preview.replace('#', '%23');
  }

  const sidebarPatternStyle = activePattern.svg 
    ? {
        backgroundImage: activePattern.svg.replace(/OPACITY/g, sidebarPatternOpacity.toString()).replace(/PATTERNCOLOR/g, patternColorValue),
        backgroundSize: activePattern.size,
        backgroundPosition: 'center center',
        backgroundRepeat: 'repeat'
      }
    : {};

  const isLightSidebar = sidebarBg === '#ffffff' || sidebarBg === 'pure-white';

  const handleNavigate = (tab: 'dashboard' | 'cariler' | 'stoklar' | 'islemler' | 'ceksenet' | 'masraflar' | 'calisanlar' | 'ayarlar' | 'kasa') => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const renderSettingsView = () => {
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
          <button
            onClick={() => setSettingsSubTab('updates')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
              settingsSubTab === 'updates'
                ? 'border-teal-600 text-teal-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CloudLightning size={15} />
            <span>Güncellemeler</span>
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

                <div className="mt-6 space-y-2 max-w-2xl">
                  {tabOrder.map((tabId, index) => {
                    const def = TAB_DEFS[tabId];
                    if (!def) return null;
                    const isFirst = index === 0;
                    const isLast = index === tabOrder.length - 1;
                    const isHidden = hiddenTabs.includes(tabId);
                    const isCritical = tabId === 'ayarlar' || tabId === 'dashboard';

                    return (
                      <div 
                        key={tabId} 
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border transition-all ${
                          isHidden 
                            ? 'bg-slate-50/50 border-slate-200 opacity-60 text-slate-400' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 font-mono w-4">{index + 1}.</span>
                          <div className={isHidden ? 'text-slate-400' : 'text-teal-600'}>{def.icon}</div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold uppercase tracking-wide ${isHidden ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {def.label}
                            </span>
                            {isCritical && (
                              <span className="text-[8px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                Kritik
                              </span>
                            )}
                            {isHidden && (
                              <span className="text-[8px] bg-rose-50 text-rose-500 font-bold px-1.5 py-0.5 rounded border border-rose-150 uppercase tracking-wider font-mono">
                                Gizli
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-3 sm:mt-0 self-end sm:self-auto">
                          {/* Görünürlük Toggla */}
                          <button
                            disabled={isCritical}
                            onClick={() => toggleTabVisibility(tabId)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] uppercase font-bold tracking-wider transition ${
                              isCritical
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
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
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                <span>Ayarlar Tarayıcıya Otomatik Kaydedilir</span>
                <button
                  onClick={() => {
                    const defaultOrder = ['dashboard', 'cariler', 'stoklar', 'islemler', 'ceksenet', 'masraflar', 'kasa', 'calisanlar', 'ayarlar'];
                    setTabOrder(defaultOrder);
                    setHiddenTabs([]);
                    localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(defaultOrder));
                    localStorage.setItem('storm_muhasebe_hidden_tabs', JSON.stringify([]));
                  }}
                  className="text-teal-600 hover:text-teal-700 font-bold transition uppercase tracking-widest text-[9px] hover:underline"
                >
                  Varsayılan Düzen & Sıralamaya Dön
                </button>
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

        {settingsSubTab === 'updates' && (
          <div className="grid grid-cols-1 gap-6 animate-fade-in">
            <div className="bg-[#ffffff] p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <CloudLightning size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Yazılım Güncellemeleri</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sisteminizin her zaman en güncel ve güvenli sürümde çalıştığından emin olun</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between bg-slate-50 border border-slate-200 p-6 rounded-xl">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-slate-900">Mevcut Sürüm: v{APP_VERSION}</span>
                    {updateStatus === 'downloaded' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded">
                        Güncelleme Hazır
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 max-w-md">
                    Uygulamanın yeni bir sürümü olup olmadığını kontrol edebilir ve güncellemeyi indirebilirsiniz. Yeni sürüm hazır olduğunda onayınızla kurulum yapılır.
                  </p>
                </div>

                <div className="flex flex-col items-end gap-3 min-w-[200px] w-full md:w-auto">
                  {updateStatus === 'idle' || updateStatus === 'not-available' ? (
                    <button
                      onClick={async () => {
                        if (!window.electronAPI) {
                          alert("Bu özellik yalnızca masaüstü uygulamasında (Electron) kullanılabilir.");
                          return;
                        }
                        setUpdateStatus('checking');
                        try {
                          const result = await (window.electronAPI as any).checkForUpdatesManual();
                          if (result.available) {
                            setUpdateStatus('available');
                          } else {
                            setUpdateStatus('not-available');
                            alert(result.error ? `Hata: ${result.error}` : "Şu an için yeni bir güncelleme bulunmuyor.");
                          }
                        } catch (err) {
                          setUpdateStatus('idle');
                          alert("Güncelleme kontrolü sırasında bir hata oluştu.");
                        }
                      }}
                      className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      Güncellemeleri Denetle
                    </button>
                  ) : updateStatus === 'checking' ? (
                    <button disabled className="w-full md:w-auto px-5 py-2.5 bg-indigo-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-not-allowed flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Kontrol Ediliyor...
                    </button>
                  ) : updateStatus === 'available' ? (
                    <button
                      onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.downloadUpdate();
                          setUpdateStatus('downloading');
                        }
                      }}
                      className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={14} />
                      Şimdi İndir
                    </button>
                  ) : updateStatus === 'downloading' ? (
                    <div className="w-full md:w-auto flex flex-col gap-1 w-full">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <span>İndiriliyor...</span>
                        <span>{Math.round(updatePercent)}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden w-full">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${updatePercent}%` }} />
                      </div>
                    </div>
                  ) : updateStatus === 'downloaded' ? (
                    <button
                      onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.restartApp();
                        }
                      }}
                      className="w-full md:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <RotateCcw size={14} />
                      Yeniden Başlat & Kur
                    </button>
                  ) : null}
                </div>
              </div>
            </div>


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
  };

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} ceksenet={ceksenet} expenses={expenses} employeeTransactions={employeeTransactions} onNavigate={handleNavigate} />;
      case 'cariler':
        return (
          <CarilerView 
            cariler={cariler} 
            islemler={islemler} 
            onQuickTransaction={(type, cariId) => {
              setPendingIslemModal(type);
              setPendingCariId(cariId);
              setActiveTab('islemler');
            }}
            aiPrefilledData={aiPrefilledData}
            onClearAiPrefilledData={() => setAiPrefilledData(null)}
          />
        );
      case 'stoklar':
        return (
          <StoklarView 
            stoklar={stoklar} 
            aiPrefilledData={aiPrefilledData}
            onClearAiPrefilledData={() => setAiPrefilledData(null)}
          />
        );
      case 'islemler':
        return (
          <IslemlerView 
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
          />
        );
      case 'ceksenet':
        return <CekSenetView ceksenet={ceksenet} cariler={cariler} islemler={islemler} />;
      case 'masraflar':
        return <MasraflarView expenses={expenses} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />;
      case 'calisanlar':
        return <CalisanlarView employees={employees} transactions={employeeTransactions} ceksenet={ceksenet} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />;
      case 'kasa':
        return <KasaView islemler={islemler} expenses={expenses} employeeTransactions={employeeTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} />;
      case 'krediler':
        return <KredilerView credits={credits} />;
      case 'ayarlar':
        return renderSettingsView();
      default:
        return <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} ceksenet={ceksenet} expenses={expenses} employeeTransactions={employeeTransactions} onNavigate={handleNavigate} />;
    }
  };

  const currentThemeData = COLOR_PRESETS.find(p => p.id === activeTheme) || COLOR_PRESETS.find(p => p.id === 'red') || COLOR_PRESETS[0];
  const themeCssRules = Object.entries(currentThemeData.colors)
    .map(([variable, hexValue]) => `${variable}: ${hexValue};`)
    .join('\n');

  if (isWebSplashLoading) {
    return (
      <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-[#f8fafc]'} flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden relative`}>
        <style>{`
          :root { ${themeCssRules} }
        `}</style>
        <StormLogo className="w-52 h-auto mx-auto mb-8 relative z-10" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
        <p className="text-xs text-slate-500 font-mono mb-8 relative z-10 h-4">{webSplashMessage}</p>
        
        <div className="w-64 max-w-[70vw] h-1.5 bg-black/5 rounded-full overflow-hidden relative z-10">
          <div 
            className="h-full bg-rose-500 transition-all duration-150 ease-out"
            style={{ width: `${webSplashProgress}%` }}
          />
        </div>
      </main>
    );
  }

  if (authLoading) {
    return (
      <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-[#050505]'} flex flex-col items-center justify-center p-6 text-center`}>
        <style>{`
          :root {
            ${themeCssRules}
          }
        `}</style>
        <div className="relative animate-pulse">
          <div className="w-16 h-16 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
          <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400" size={20} />
        </div>
        <h2 className="text-lg font-light tracking-[0.2em] uppercase text-white/95 mt-6">Sistem Başlatılıyor...</h2>
        <p className="text-white/40 text-xs mt-2 max-w-xs uppercase tracking-widest font-mono">Güvenli oturum kontrol ediliyor.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-[#050505]'} flex flex-col items-center p-6 overflow-y-auto`}>
        <style>{`
          :root {
            ${themeCssRules}
          }
        `}</style>
        
        <div className="w-full max-w-md my-auto">
          <div className="text-center mb-10 flex flex-col items-center">
            <StormLogo className="w-44 h-auto mx-auto mb-6" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
            <p className="text-xs text-white/40 uppercase tracking-widest font-mono">Güvenli Yönetim Paneli</p>
          </div>

          {!selectedPinAccount ? (
            <div className="space-y-3 animate-fade-in">
              <h2 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-6 text-center">Hesabınızı Seçin</h2>
              {usersList.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedPinAccount(u)}
                  className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-teal-500/10 hover:border-teal-500/30 transition group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-teal-500/20 text-white/40 group-hover:text-teal-400 transition">
                      <User size={20} />
                    </div>
                    <span className="font-bold text-white tracking-wide">{u.name}</span>
                  </div>
                  <ChevronDown className="text-white/20 group-hover:text-teal-400 -rotate-90 transition" size={18} />
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 animate-fade-in">
              <button 
                onClick={() => {
                  setSelectedPinAccount(null);
                  setEnteredPin('');
                  setAuthError(null);
                }}
                className="flex items-center gap-2 text-xs text-white/40 hover:text-white uppercase tracking-widest font-bold mb-8 transition cursor-pointer"
              >
                <ChevronDown className="rotate-90" size={14} />
                Geri Dön
              </button>
              
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-4">
                  <User size={24} />
                </div>
                <h3 className="text-lg font-bold text-white tracking-wider">{selectedPinAccount.name}</h3>
                <p className="text-xs text-white/40 mt-1">Lütfen 6 haneli erişim şifrenizi girin</p>
              </div>

              <div className="space-y-6">
                <div>
                  <input
                    type="password"
                    maxLength={6}
                    value={enteredPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      setEnteredPin(val);
                      if (authError) setAuthError(null);
                      
                      if (val.length === 6) {
                        if (val === selectedPinAccount.pin) {
                          const userData = {
                            uid: selectedPinAccount.id,
                            displayName: selectedPinAccount.name,
                            email: `${selectedPinAccount.id}@storm.com`
                          };
                          localStorage.setItem('storm_muhasebe_active_user', JSON.stringify(userData));
                          setActiveUser(selectedPinAccount.id);
                          setUser(userData as any);
                        } else {
                          setAuthError('Hatalı şifre girdiniz.');
                          setEnteredPin('');
                        }
                      }
                    }}
                    placeholder="••••••"
                    className="w-full bg-white/5 border border-white/10 focus:border-teal-500/50 rounded-xl px-4 py-4 text-center text-3xl tracking-[1em] text-white placeholder-slate-400 transition outline-none font-mono"
                    autoFocus
                  />
                  {authError && (
                    <p className="text-rose-400 text-xs text-center mt-3 font-bold">{authError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Admin Login Section */}
        <div className="hidden md:block absolute top-8 left-8 w-[360px]">
          {!showAdminLogin ? (
            <button 
              onClick={() => setShowAdminLogin(true)}
              className="flex items-center gap-2 bg-[#0c0c0c] border border-white/10 hover:border-red-500/50 text-white/60 hover:text-red-400 px-4 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all"
            >
              <Shield size={16} />
              Yönetici Paneli
            </button>
          ) : (
            <div className="bg-[#0c0c0c] border border-red-500/30 rounded-2xl p-6 shadow-[0_8px_30px_rgb(185,28,28,0.2)] backdrop-blur-xl animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={16} className="text-red-500 shrink-0" />
                  Yönetici Girişi
                </h3>
                <button onClick={() => { setShowAdminLogin(false); setAdminPin(''); setAdminAuthError(null); }} className="text-white/40 hover:text-white transition">
                  <X size={16} />
                </button>
              </div>
              <p className="text-xs text-white/40 mb-4 font-mono uppercase tracking-widest">Sistem Loglarına Erişim</p>
              <input
                type="password"
                maxLength={6}
                value={adminPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAdminPin(val);
                  if (adminAuthError) setAdminAuthError(null);
                  
                  if (val.length >= 4) {
                    // Predefined admin password logic for "XSTORM" or arbitrary secure code
                    // Let's use 270212 for XSTORM or 000000 as fallback
                    if (val === '270212' || val === '000000') { 
                      setShowAdminDashboard(true);
                      setShowAdminLogin(false);
                      setAdminPin('');
                      // Load error logs
                      const logsStr = localStorage.getItem('storm_error_logs');
                      if (logsStr) {
                        try {
                          setErrorLogs(JSON.parse(logsStr));
                        } catch(e) {}
                      }
                      
                      // Load feedback logs
                      const fLogsStr = localStorage.getItem('storm_feedback_logs');
                      if (fLogsStr) {
                        try {
                          setFeedbackList(JSON.parse(fLogsStr));
                        } catch(e) {}
                      }
                    } else if (val.length === 6) {
                      setAdminAuthError('Hatalı yönetici şifresi.');
                      setAdminPin('');
                    }
                  }
                }}
                placeholder="••••••"
                className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] text-white placeholder-slate-500 transition outline-none font-mono"
                autoFocus
              />
              {adminAuthError && (
                <p className="text-red-400 text-xs text-center mt-3 font-bold">{adminAuthError}</p>
              )}
            </div>
          )}
        </div>

        {/* Changelog Section */}
        <div className="hidden md:block absolute top-8 right-8 w-[360px] bg-[#0c0c0c] border border-white/20 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.5)] backdrop-blur-xl animate-fade-in max-h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
          <h3 className="text-xs font-bold text-white/80 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CloudLightning size={16} className="text-teal-400 shrink-0" />
            Sürüm Notları & Güncellemeler
          </h3>
          <div className="space-y-6">
            {changelogData.map((log, idx) => (
              <div key={idx} className={`relative pl-4 border-l-2 ${idx === 0 ? 'border-teal-500' : 'border-white/20'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-bold tracking-widest ${idx === 0 ? 'text-teal-400' : 'text-white/80'}`}>
                    v{log.version}
                  </span>
                  <span className="text-xs text-white/50 font-mono">{log.date}</span>
                  {idx === 0 && (
                    <span className="px-2 py-0.5 bg-teal-500/20 text-teal-300 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                      Yeni
                    </span>
                  )}
                </div>
                <ul className="space-y-2.5">
                  {log.changes.map((change, cIdx) => (
                    <li key={cIdx} className="text-xs text-white/90 leading-relaxed flex items-start gap-2">
                      <span className="text-teal-400 mt-1 shrink-0">•</span>
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>



        {/* Admin Dashboard Modal */}
        {showAdminDashboard && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in">
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-widest uppercase flex items-center gap-3">
                    <Shield className="text-teal-500" size={24} />
                    Yönetim Paneli
                  </h2>
                  <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-widest">Kullanıcı & Sistem Yönetimi</p>
                </div>
                
                <div className="flex bg-white/5 p-1 rounded-xl w-full md:w-auto">
                  <button
                    onClick={() => setAdminTab('errors')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${adminTab === 'errors' ? 'bg-red-500/20 text-red-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    Sistem Hataları
                  </button>
                  <button
                    onClick={() => setAdminTab('feedback')}
                    className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition ${adminTab === 'feedback' ? 'bg-teal-500/20 text-teal-400' : 'text-white/40 hover:text-white/60'}`}
                  >
                    İstek & Geri Bildirim
                  </button>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <button 
                    onClick={() => {
                      if (adminTab === 'errors') {
                        localStorage.removeItem('storm_error_logs');
                        setErrorLogs([]);
                      } else {
                        localStorage.removeItem('storm_feedback_logs');
                        setFeedbackList([]);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition cursor-pointer"
                  >
                    <Trash2 size={16} />
                    Tümünü Temizle
                  </button>
                  <button 
                    onClick={() => setShowAdminDashboard(false)} 
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                {adminTab === 'errors' && (
                  errorLogs.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <Check size={48} className="mx-auto mb-4 text-teal-500/50" />
                      <p className="text-sm uppercase tracking-widest font-bold">Kayıtlı Hata Bulunamadı</p>
                      <p className="text-xs font-mono mt-2">Sistem sorunsuz çalışıyor.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {errorLogs.map((log) => (
                        <div key={log.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-colors hover:border-white/20">
                          <div 
                            className="p-4 flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                                <AlertTriangle size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white line-clamp-1">{log.message}</p>
                                <div className="flex items-center gap-3 mt-1 text-xs text-white/40 font-mono">
                                  <span>{log.date}</span>
                                  <span>•</span>
                                  <span className="text-teal-400/70">{log.user}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-white/40 shrink-0 ml-4 flex items-center gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newLogs = errorLogs.filter(l => l.id !== log.id);
                                  localStorage.setItem('storm_error_logs', JSON.stringify(newLogs));
                                  setErrorLogs(newLogs);
                                }}
                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition cursor-pointer"
                                title="Bu Kaydı Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                              {expandedLogId === log.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                          </div>
                          
                          {/* Expanded Stack Trace */}
                          {expandedLogId === log.id && (
                            <div className="p-4 border-t border-white/5 bg-black/40">
                              <h4 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-3">Stack Trace</h4>
                              <pre className="text-[10px] text-red-300/80 font-mono whitespace-pre-wrap overflow-x-auto bg-[#050505] p-4 rounded-lg border border-red-500/10">
                                {log.stack || 'Stack trace bulunamadı.'}
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                )}

                {adminTab === 'feedback' && (
                  feedbackList.length === 0 ? (
                    <div className="text-center py-12 text-white/40">
                      <MessageSquare size={48} className="mx-auto mb-4 text-teal-500/50" />
                      <p className="text-sm uppercase tracking-widest font-bold">Bildirim Bulunamadı</p>
                      <p className="text-xs font-mono mt-2">Kullanıcılardan gelen henüz yeni bir bildirim yok.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {feedbackList.map((feedback) => (
                        <div key={feedback.id} className={`bg-white/5 border rounded-xl overflow-hidden transition-colors ${feedback.type === 'error' ? 'border-red-500/20' : 'border-teal-500/20'}`}>
                          <div className="p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${feedback.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-teal-500/10 text-teal-500'}`}>
                                {feedback.type === 'error' ? <AlertTriangle size={20} /> : <MessageSquare size={20} />}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{feedback.text}</p>
                                <div className="flex items-center gap-3 mt-3 text-xs text-white/40 font-mono">
                                  <span>{feedback.date}</span>
                                  <span>•</span>
                                  <span className={feedback.type === 'error' ? 'text-red-400/70' : 'text-teal-400/70'}>{feedback.user}</span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 flex items-center self-end md:self-start">
                              <button
                                onClick={(e) => {
                                  const newFeedbackList = feedbackList.filter(f => f.id !== feedback.id);
                                  localStorage.setItem('storm_feedback_logs', JSON.stringify(newFeedbackList));
                                  setFeedbackList(newFeedbackList);
                                }}
                                className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded transition cursor-pointer"
                                title="Bu Bildirimi Sil"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  if (loading) {
    return (
      <main className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-[#050505]'} flex flex-col items-center justify-center p-6 text-center`}>
        <style>{`
          :root {
            ${themeCssRules}
          }
        `}</style>
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white/5 border-t-teal-500 rounded-full animate-spin"></div>
          <Cloud className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-teal-400" size={20} />
        </div>
        <h2 className="text-lg font-light tracking-[0.2em] uppercase text-white/95 mt-6">Bulut Hesabım Yükleniyor...</h2>
        <p className="text-white/40 text-xs mt-2 max-w-xs uppercase tracking-widest font-mono">Güvenli bulut veri tabanına bağlanılıyor ve verileriniz eşitleniyor.</p>
      </main>
    );
  }

  return (
    <div className={`min-h-screen ${(currentThemeData as any).bgClass || 'bg-[#050505]'} text-[#e0e0e0] flex flex-col md:flex-row font-sans`}>
      <style>{`
        :root {
          ${themeCssRules}
        }
        /* Normal dark sidebar rules */
        aside:not(.sidebar-light).text-white,
        aside:not(.sidebar-light) .text-white {
          color: #ffffff !important;
        }
        aside:not(.sidebar-light) .hover\\:text-white:hover {
          color: #ffffff !important;
        }
        aside:not(.sidebar-light) .hover\\:bg-white\\/5:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
        }

        /* Light sidebar rules */
        aside.sidebar-light,
        aside.sidebar-light.text-white,
        aside.sidebar-light .text-white,
        aside.sidebar-light .text-zinc-50 {
          color: #1e293b !important;
        }
        aside.sidebar-light .text-zinc-400,
        aside.sidebar-light .text-zinc-300 {
          color: #475569 !important;
        }
        aside.sidebar-light .border-white\\/10,
        aside.sidebar-light .border-white\\/5 {
          border-color: rgba(0, 0, 0, 0.1) !important;
        }
        aside.sidebar-light .bg-black\\/15,
        aside.sidebar-light .bg-white\\/5 {
          background-color: rgba(0, 0, 0, 0.05) !important;
        }
        aside.sidebar-light .hover\\:bg-white\\/5:hover {
          background-color: rgba(0, 0, 0, 0.08) !important;
          color: #0f172a !important;
        }
        aside.sidebar-light .hover\\:text-white:hover {
          color: #0f172a !important;
        }

        /* Mobile menu fixes */
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light).text-white,
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) span,
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) button {
          color: #ffffff !important;
        }
        .fixed.inset-0.z-30.bg-black\\/80 aside:not(.sidebar-light) .text-zinc-400 {
          color: #a1a1aa !important;
        }
      `}</style>


      
      {/* 1. DESKTOP SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col w-64 text-white shrink-0 transition-all duration-300 relative z-20 shadow-[0_12px_40px_-6px_rgba(0,0,0,0.5)] my-4 ml-4 rounded-3xl border ${isLightSidebar ? 'sidebar-light' : ''}`}
        style={{ 
          backgroundColor: sidebarBg,
          ...sidebarPatternStyle,
          borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
        }}
      >
        {/* Sidebar Brand Logo */}
        <div className="pt-7 pb-4 px-6 flex items-center justify-center relative z-10">
          <StormLogo className="w-38 h-auto mx-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {tabOrder
            .filter((tabId) => !hiddenTabs.includes(tabId))
            .map((tabId) => {
              const def = TAB_DEFS[tabId];
            if (!def) return null;
            const isActive = activeTab === tabId;
            return (
              <div key={tabId} className="space-y-1">
                {tabId === 'islemler' ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <button 
                        id={`tab-btn-${tabId}`}
                        onClick={() => {
                          handleNavigate('islemler');
                          setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                        }}
                        className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                          isActive 
                            ? 'text-white font-semibold' 
                            : 'text-white hover:bg-white/5'
                        }`}
                        style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                      >
                        <div className="flex items-center gap-3">
                          <div className="scale-90 transform-origin-left"><StormIconWrapper iconElement={def.icon} isActive={isActive} /></div>
                          <span>{def.label}</span>
                        </div>
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                          }}
                          className={`p-1 rounded-lg hover:bg-black/15 transition-transform duration-200 ${isIslemlerSubMenuOpen ? 'rotate-180' : ''}`}
                        >
                          <ChevronDown size={14} />
                        </div>
                      </button>
                    </div>
                    
                    {isIslemlerSubMenuOpen && (
                      <div className="pl-3 pr-1 py-1 space-y-1 bg-black/15 rounded-xl border border-white/5 animate-fade-in my-1 mx-1">
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('sale');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">📈</span>
                          <span>Satış Faturası</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('purchase');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">📉</span>
                          <span>Alış Faturası</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('collection');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">💰</span>
                          <span>Tahsilat Girişi</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigate('islemler');
                            setPendingIslemModal('payment');
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                        >
                          <span className="text-[10px]">💸</span>
                          <span>Ödeme Girişi</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    id={`tab-btn-${tabId}`}
                    onClick={() => handleNavigate(tabId as any)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer group ${
                      isActive 
                        ? 'text-white font-semibold' 
                        : 'text-white hover:bg-white/5'
                    }`}
                    style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                  >
                    <div className="scale-90 transform-origin-left"><StormIconWrapper iconElement={def.icon} isActive={isActive} /></div>
                    <span>{def.label}</span>
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar User & Cloud Sync Info Footer */}
        <div className="p-3 mt-auto space-y-2">
          <div className="p-3 rounded-2xl border border-white/5 space-y-2.5 bg-black/20 shadow-lg relative z-10">
            <div className="flex items-center justify-between text-[8px] font-mono tracking-widest uppercase px-1">
              <span className="text-zinc-400">CLOUD STATUS</span>
              <span className="inline-flex items-center gap-1 font-bold" style={{ color: isOnline ? '#2dd4bf' : '#f43f5e' }}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-teal-400' : 'bg-rose-500'}`} style={{ boxShadow: isOnline ? '0 0 8px #2dd4bf' : 'none' }}></span>
                {isOnline ? 'SİSTEM ÇEVRİMİÇİ' : 'ÇEVRİMDIŞI'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
              <div className="flex items-center gap-2.5 min-w-0">
                { (user as any)?.photoURL ? (
                  <img src={(user as any).photoURL} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase" style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
                    {user?.displayName ? user.displayName.charAt(0) : 'K'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-zinc-50 block truncate" title={user?.displayName || 'Kullanıcı'}>{user?.displayName || 'Kullanıcı'}</span>
                  <span className="text-[8px] font-mono text-zinc-300 block truncate">Aktif Oturum</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer shrink-0"
                style={{ backgroundColor: 'transparent' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-500) 15%, transparent)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                title="Çıkış Yap"
              >
                <LogOut size={14} />
              </button>
            </div>
            
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="w-full flex items-center justify-center gap-2 p-2 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition cursor-pointer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              <MessageSquare size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Hata / İstek Bildir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE HEADER & NAVIGATION BAR */}
      <div 
        className="md:hidden px-5 py-3 flex items-center justify-between border-b sticky top-0 z-40 transition-colors duration-300"
        style={{ 
          backgroundColor: sidebarBg,
          borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
          color: '#ffffff'
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <StormLogo className="w-14 h-14" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
        </div>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: isOnline ? '#2dd4bf' : '#f43f5e', boxShadow: isOnline ? '0 0 8px #2dd4bf' : 'none' }} title={isOnline ? 'Sistem Çevrimiçi' : 'Çevrimdışı'}></span>
          <button 
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-zinc-200 hover:text-white rounded-lg hover:bg-white/10"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/80 backdrop-blur-xs flex justify-start animate-fade-in">
          <aside 
            className={`text-white w-64 h-full p-5 flex flex-col justify-between shadow-2xl animate-slide-right border-r transition-colors duration-300 relative z-40 ${isLightSidebar ? 'sidebar-light' : ''}`}
            style={{ 
              backgroundColor: sidebarBg,
              ...sidebarPatternStyle,
              borderColor: SIDEBAR_BG_PRESETS.find(p => p.value === sidebarBg)?.border || 'rgba(255,255,255,0.1)',
              borderRightWidth: '1px'
            }}
          >
            <div>
              <div className="flex justify-between items-center pb-6 border-b border-white/10 mb-6">
                <StormLogo className="w-28 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
                <button 
                  id="mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-zinc-200 hover:text-white hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-0.5">
                {tabOrder
                  .filter((tabId) => !hiddenTabs.includes(tabId))
                  .map((tabId) => {
                    const def = TAB_DEFS[tabId];
                  if (!def) return null;
                  const isActive = activeTab === tabId;
                  return (
                    <div key={tabId} className="space-y-0.5">
                      {tabId === 'islemler' ? (
                        <div className="space-y-0.5">
                          <button 
                            id={`mob-nav-${tabId}`}
                            onClick={() => {
                              handleNavigate('islemler');
                              setIsIslemlerSubMenuOpen(!isIslemlerSubMenuOpen);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-150 group ${
                              isActive ? 'text-white font-semibold' : 'text-white hover:bg-white/5'
                            }`}
                            style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="scale-90 transform-origin-left"><StormIconWrapper iconElement={def.icon} isActive={isActive} /></div>
                              <span>{def.label}</span>
                            </div>
                            <ChevronDown size={14} className={`transition-transform duration-200 ${isIslemlerSubMenuOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          {isIslemlerSubMenuOpen && (
                            <div className="pl-2.5 py-0.5 space-y-0.5 bg-black/15 rounded-lg border border-white/5">
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('sale');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">📈</span>
                                <span>Satış Faturası</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('purchase');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">📉</span>
                                <span>Alış Faturası</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('collection');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">💰</span>
                                <span>Tahsilat Girişi</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleNavigate('islemler');
                                  setPendingIslemModal('payment');
                                  setMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-white hover:bg-white/5 transition-all text-left uppercase tracking-wider"
                              >
                                <span className="text-[10px]">💸</span>
                                <span>Ödeme Girişi</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          id={`mob-nav-${tabId}`}
                          onClick={() => handleNavigate(tabId as any)}
                          className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-150 group ${
                            isActive ? 'text-white font-semibold' : 'text-white hover:bg-white/5'
                          }`}
                          style={isActive ? { backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)' } : {}}
                        >
                          <div className="scale-90 transform-origin-left"><StormIconWrapper iconElement={def.icon} isActive={isActive} /></div>
                          <span>{def.label}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-2 p-2 px-2.5 rounded-xl border border-white/5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="flex items-center gap-2 min-w-0">
                  { (user as any)?.photoURL ? (
                    <img src={(user as any).photoURL} alt="Profile" className="w-7 h-7 object-cover rounded-lg" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg text-teal-400 flex items-center justify-center font-bold text-xs shrink-0 uppercase" style={{ backgroundColor: 'rgba(45, 212, 191, 0.15)', color: '#2dd4bf' }}>
                      {user?.displayName ? user.displayName.charAt(0) : 'K'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-zinc-50 block truncate">{user?.displayName || 'Kullanıcı'}</span>
                    <span className="text-[9px] font-mono text-zinc-300 block truncate">Aktif Oturum</span>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition cursor-pointer shrink-0"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--accent-500) 15%, transparent)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Çıkış Yap"
                >
                  <LogOut size={13} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full pb-20 md:pb-6">
        <div className={activeTab === 'dashboard' ? 'block animate-fade-in' : 'hidden'}>
          <DashboardView cariler={cariler} stoklar={stoklar} islemler={islemler} ceksenet={ceksenet} expenses={expenses} employeeTransactions={employeeTransactions} onNavigate={handleNavigate} />
        </div>
        <div className={activeTab === 'cariler' ? 'block animate-fade-in' : 'hidden'}>
          <CarilerView 
            cariler={cariler} 
            islemler={islemler} 
            onQuickTransaction={(type, cariId) => {
              setPendingIslemModal(type);
              setPendingCariId(cariId);
              setActiveTab('islemler');
            }}
          />
        </div>
        <div className={activeTab === 'stoklar' ? 'block animate-fade-in' : 'hidden'}>
          <StoklarView stoklar={stoklar} />
        </div>
        <div className={activeTab === 'islemler' ? 'block animate-fade-in' : 'hidden'}>
          <IslemlerView 
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
          />
        </div>
        <div className={activeTab === 'ceksenet' ? 'block animate-fade-in' : 'hidden'}>
          <CekSenetView ceksenet={ceksenet} cariler={cariler} islemler={islemler} />
        </div>
        <div className={activeTab === 'masraflar' ? 'block animate-fade-in' : 'hidden'}>
          <MasraflarView expenses={expenses} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />
        </div>
        <div className={activeTab === 'calisanlar' ? 'block animate-fade-in' : 'hidden'}>
          <CalisanlarView employees={employees} transactions={employeeTransactions} ceksenet={ceksenet} aiPrefilledData={aiPrefilledData} onClearAiPrefilledData={() => setAiPrefilledData(null)} />
        </div>
        <div className={activeTab === 'kasa' ? 'block animate-fade-in' : 'hidden'}>
          <KasaView islemler={islemler} expenses={expenses} employeeTransactions={employeeTransactions} bankAccounts={bankAccounts} accountTransactions={accountTransactions} />
        </div>
        <div className={activeTab === 'krediler' ? 'block animate-fade-in' : 'hidden'}>
          <KredilerView credits={credits} />
        </div>
        <div className={activeTab === 'raporlar' ? 'block animate-fade-in' : 'hidden'}>
          <RaporlarView 
            cariler={cariler} 
            stoklar={stoklar} 
            islemler={islemler} 
            ceksenet={ceksenet} 
            expenses={expenses} 
            employeeTransactions={employeeTransactions} 
          />
        </div>
        <div className={activeTab === 'ayarlar' ? 'block animate-fade-in' : 'hidden'}>
          {renderSettingsView()}
        </div>
      </main>

      {/* 4. MOBILE BOTTOM FIXED NAV BAR */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#080808] border-t border-white/10 py-2.5 px-4 flex justify-around items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.5)] overflow-x-auto gap-4 custom-scrollbar">
        <button 
          id="btm-btn-dashboard"
          onClick={() => handleNavigate('dashboard')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[9px] uppercase tracking-wider">Pano</span>
        </button>

        <button 
          id="btm-btn-cariler"
          onClick={() => handleNavigate('cariler')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'cariler' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] uppercase tracking-wider">Cari</span>
        </button>

        <button 
          id="btm-btn-stoklar"
          onClick={() => handleNavigate('stoklar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'stoklar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Package size={18} />
          <span className="text-[9px] uppercase tracking-wider">Stok</span>
        </button>

        <button 
          id="btm-btn-islemler"
          onClick={() => handleNavigate('islemler')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'islemler' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Receipt size={18} />
          <span className="text-[9px] uppercase tracking-wider">Hareket</span>
        </button>

        <button 
          id="btm-btn-ceksenet"
          onClick={() => handleNavigate('ceksenet')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'ceksenet' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Briefcase size={18} />
          <span className="text-[9px] uppercase tracking-wider">Çek/Senet</span>
        </button>

        <button 
          id="btm-btn-masraflar"
          onClick={() => handleNavigate('masraflar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'masraflar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Wallet size={18} />
          <span className="text-[9px] uppercase tracking-wider">Masraf</span>
        </button>

        <button 
          id="btm-btn-calisanlar"
          onClick={() => handleNavigate('calisanlar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'calisanlar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Users size={18} />
          <span className="text-[9px] uppercase tracking-wider">Personel</span>
        </button>

        <button 
          id="btm-btn-ayarlar"
          onClick={() => handleNavigate('ayarlar')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'ayarlar' ? 'text-teal-400 font-bold' : 'text-white/40 hover:text-white/60'
          }`}
        >
          <Settings size={18} />
          <span className="text-[9px] uppercase tracking-wider">Ayarlar</span>
        </button>
      </nav>

      {/* RESET DATABASE MODAL */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-lg font-extrabold uppercase tracking-wider text-slate-900">Verileri Sıfırla</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bu işlem STORM MUHASEBE üzerindeki <strong>tüm Cari Hesapları, Stokları, Finansal Hareketleri, Ödemeleri/Tahsilatları ve Çek/Senet</strong> verilerini kalıcı olarak silecektir. 
              <br />
              <span className="text-rose-600 font-semibold block mt-2">Bu işlem geri alınamaz!</span>
            </p>

            <div className="mb-5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Onaylamak için aşağıdaki kutuya <span className="text-rose-600 font-extrabold">SIFIRLA</span> yazın:
              </label>
              <input
                type="text"
                placeholder="SIFIRLA"
                value={resetConfirmationText}
                onChange={(e) => {
                  setResetConfirmationText(e.target.value);
                  if (resetError) setResetError(null);
                }}
                disabled={isResetting}
                className="w-full text-center tracking-widest uppercase font-extrabold border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-lg p-2.5 bg-slate-50 text-slate-900"
              />
              {resetError && (
                <p className="text-xs text-rose-600 font-medium mt-1.5">{resetError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmationText('');
                  setResetError(null);
                }}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleResetAllData}
                disabled={isResetting || resetConfirmationText.trim().toUpperCase() !== 'SIFIRLA'}
                className={`px-5 py-2 text-xs font-extrabold text-white uppercase tracking-wider rounded-lg transition shadow-md flex items-center gap-2 ${
                  resetConfirmationText.trim().toUpperCase() === 'SIFIRLA' && !isResetting
                    ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                {isResetting ? 'Sıfırlanıyor...' : 'Her Şeyi Sıfırla'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE DOWNLOADED MODAL */}
      {updateStatus === 'downloaded' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 overflow-hidden text-center">
            <div className="mx-auto mb-6 flex justify-center">
              <StormLogo className="w-28 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
            </div>
            
            <h3 className="text-xl font-extrabold text-slate-900 mb-2">Güncelleme Hazır</h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Yeni özellikler hazır! Uygulamayı güncel sürüme geçirmek için yeniden başlatın.
            </p>

            <button
              onClick={() => {
                if (window.electronAPI) {
                  window.electronAPI.restartApp();
                }
              }}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Şimdi Yeniden Başlat
            </button>
          </div>
        </div>
      )}

      {/* GLOBAL UPDATE NOTIFICATION MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <CloudLightning size={24} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 leading-tight">
                  Yeni Güncelleme Bulundu
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-0.5">
                  Versiyon {availableUpdateVersion}
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Uygulamanın yeni bir sürümü mevcut. Performans iyileştirmeleri ve yeni özelliklerden faydalanmak için hemen güncelleyebilirsiniz.
              </p>
              
              <div className="mt-2">
                {updateStatus === 'available' ? (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition uppercase text-xs tracking-wider cursor-pointer"
                    >
                      Daha Sonra
                    </button>
                    <button
                      onClick={() => {
                        if (window.electronAPI) {
                          window.electronAPI.downloadUpdate();
                          setUpdateStatus('downloading');
                        }
                      }}
                      className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Download size={16} />
                      Şimdi İndir
                    </button>
                  </div>
                ) : updateStatus === 'downloading' ? (
                  <div className="flex flex-col gap-2 w-full bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs font-bold text-indigo-900 uppercase tracking-wider mb-1">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />
                        İndiriliyor...
                      </span>
                      <span>{Math.round(updatePercent)}%</span>
                    </div>
                    <div className="h-3 bg-slate-200 rounded-full overflow-hidden w-full shadow-inner">
                      <div className="h-full bg-indigo-600 transition-all duration-300 relative" style={{ width: `${updatePercent}%` }}>
                        <div className="absolute inset-0 bg-white/20" style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' }} />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">Lütfen indirme işlemi bitene kadar uygulamayı kapatmayın.</p>
                  </div>
                ) : updateStatus === 'downloaded' ? (
                  <div className="flex flex-col gap-3">
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center gap-2 text-sm font-medium">
                      <div className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center shrink-0">
                        <Check size={14} />
                      </div>
                      İndirme tamamlandı! Yeniden başlatılmaya hazır.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowUpdateModal(false)}
                        className="flex-1 px-4 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition uppercase text-xs tracking-wider cursor-pointer"
                      >
                        Daha Sonra
                      </button>
                      <button
                        onClick={() => {
                          if (window.electronAPI) {
                            window.electronAPI.restartApp();
                          }
                        }}
                        className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20"
                      >
                        <RotateCcw size={16} />
                        Yeniden Başlat
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGELOG MODAL */}
      {showChangelog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center gap-4 shrink-0">
              <div className="shrink-0">
                <StormLogo className="w-14 h-auto" logoTheme={activeLogoTheme} theme={activeTheme} sidebarPattern={sidebarPattern} sidebarPatternOpacity={sidebarPatternOpacity} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-rose-900 leading-tight">
                  Yeni Sürümde Neler Değişti?
                </h3>
                <p className="text-rose-700 text-sm font-semibold mt-0.5 font-mono">
                  Versiyon {CHANGELOG.version}
                </p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50">
              {CHANGELOG.features.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                    <span className="text-xl">🚀</span> Yeni Özellikler
                  </h4>
                  <ul className="space-y-3">
                    {CHANGELOG.features.map((feature, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-2"></span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {CHANGELOG.fixes.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800 uppercase tracking-widest mb-3">
                    <span className="text-xl">🔧</span> Düzeltmeler & İyileştirmeler
                  </h4>
                  <ul className="space-y-3">
                    {CHANGELOG.fixes.map((fix, idx) => (
                      <li key={idx} className="flex gap-3 text-slate-600 text-sm leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0 mt-2"></span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 shrink-0">
              <button
                onClick={handleCloseChangelog}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-4 rounded-xl transition cursor-pointer shadow-md text-sm uppercase tracking-wider"
              >
                Anladım / Kapat
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl flex flex-col animate-fade-in p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={18} className="text-teal-400" />
                Hata / İstek Bildir
              </h2>
              <button onClick={() => setShowFeedbackModal(false)} className="text-white/40 hover:text-white transition cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">Bildirim Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFeedbackType('error')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      feedbackType === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Hata Bildirimi
                  </button>
                  <button
                    onClick={() => setFeedbackType('feature')}
                    className={`p-3 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      feedbackType === 'feature' ? 'bg-teal-500/20 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Yeni İstek
                  </button>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2 block">Detaylar</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={4}
                  placeholder="Lütfen karşılaştığınız hatayı veya yeni özellik isteğinizi detaylıca açıklayın..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/30 focus:border-teal-500/50 outline-none resize-none"
                ></textarea>
              </div>
              
              <button
                onClick={() => {
                  if (!feedbackText.trim()) return;
                  const newFeedback = {
                    id: Date.now().toString(),
                    type: feedbackType,
                    text: feedbackText,
                    user: user?.displayName || 'Bilinmeyen Kullanıcı',
                    date: new Date().toLocaleString('tr-TR')
                  };
                  const existing = localStorage.getItem('storm_feedback_logs');
                  const parsed = existing ? JSON.parse(existing) : [];
                  const updated = [newFeedback, ...parsed];
                  localStorage.setItem('storm_feedback_logs', JSON.stringify(updated));
                  
                  // update state if admin panel is somehow listening to it, though it's separate
                  setFeedbackList(updated);
                  
                  setShowFeedbackModal(false);
                  setFeedbackText('');
                  setFeedbackType('error');
                  
                  alert("Bildiriminiz başarıyla iletildi. Teşekkür ederiz!");
                }}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
              >
                Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Chat UI */}
      {user && (
        <AiAssistant 
          apiKey={geminiApiKey} 
          onNavigateToSettings={() => {
            setActiveTab('ayarlar');
            setSettingsSubTab('ai');
          }}
          onCommandParsed={(commandData) => {
            setAiPrefilledData(commandData);
            if (commandData.islem === 'expense') {
              setActiveTab('masraflar');
            } else if (commandData.islem === 'employee_payment') {
              setActiveTab('calisanlar');
            } else if (commandData.islem === 'add_customer' || commandData.islem === 'add_supplier') {
              setActiveTab('cariler');
            } else if (commandData.islem === 'add_product') {
              setActiveTab('stoklar');
            } else {
              setActiveTab('islemler');
            }
          }}
        />
      )}
      
    </div>
  );
}

