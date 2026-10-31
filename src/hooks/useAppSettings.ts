import { useState, useEffect } from 'react';
import { logError } from '../utils/errorLogger';

/** Ayarlarda seçilebilen arayüz tasarım stilleri */
export const SUPPORTED_DESIGN_STYLES = ['pusula', 'fluid-mesh', 'clean-light', 'pro-solid'];

/** Menünün ekrandaki yeri (masaüstü) */
export type NavPosition = 'left' | 'right' | 'top';
export const NAV_POSITIONS: NavPosition[] = ['left', 'right', 'top'];

/** Telefona uyarlanmış tasarım stilleri */
export const MOBILE_DESIGN_STYLES = ['pusula', 'fluid-mesh'];

/** Masaüstünde varsayılan tasarım stili */
export const DEFAULT_DESIGN_STYLE = 'pusula';

export function useAppSettings() {
  const isMobileInitial = typeof window !== 'undefined' && window.innerWidth < 768;

  // Tema rengi telefonda da seçilebilir ve hatırlanır (telefonda Pusula ya da Sıvı Mesh kullanılır)
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    // Migration check to ensure previous users get the new default 'sky' with 'fluid-mesh'
    const isInitializedV4 = localStorage.getItem('storm_default_setup_v4');
    if (!isInitializedV4) {
      localStorage.setItem('storm_default_setup_v4', 'true');
      localStorage.setItem('kolay_hesap_accent_theme', 'sky');
      localStorage.setItem('storm_muhasebe_design_style', DEFAULT_DESIGN_STYLE);
      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
      return 'sky';
    }

    const saved = localStorage.getItem('kolay_hesap_accent_theme');
    if (saved === 'rose') return 'red';
    return saved || 'sky';
  });

  // Kullanıcının seçtiği tasarım stili (masaüstü tercihi; tarayıcıda saklanır)
  const [preferredStyle, setPreferredStyle] = useState<string>(() => {
    // 1.8.6: yeni varsayılan Pusula stili herkese bir kez uygulanır; sonra kullanıcı seçimi korunur
    if (!localStorage.getItem('storm_default_setup_v5')) {
      localStorage.setItem('storm_default_setup_v5', 'true');
      localStorage.setItem('storm_muhasebe_design_style', DEFAULT_DESIGN_STYLE);
      return DEFAULT_DESIGN_STYLE;
    }
    const saved = localStorage.getItem('storm_muhasebe_design_style');
    // Kaldırılan stiller (Cam Arayüz, Lacivert Performans) varsayılana döner
    return saved && SUPPORTED_DESIGN_STYLES.includes(saved) ? saved : DEFAULT_DESIGN_STYLE;
  });

  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobileViewport(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Telefonda yalnızca telefona uyarlanmış stiller kullanılır; diğerlerinde Sıvı Mesh devreye girer.
  // Kullanıcının masaüstü tercihi değişmez.
  const designStyle = isMobileViewport && !MOBILE_DESIGN_STYLES.includes(preferredStyle) ? 'fluid-mesh' : preferredStyle;

  const setDesignStyle = (style: string) => {
    if (!SUPPORTED_DESIGN_STYLES.includes(style)) return;
    setPreferredStyle(style);
    try {
      localStorage.setItem('storm_muhasebe_design_style', style);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useAppSettings.setDesignStyle');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-design-style', designStyle);
  }, [designStyle]);

  // Menü konumu: sol, sağ ya da üstte yatay çubuk
  const [navPosition, setNavPositionState] = useState<NavPosition>(() => {
    const saved = localStorage.getItem('storm_muhasebe_nav_position') as NavPosition | null;
    return saved && NAV_POSITIONS.includes(saved) ? saved : 'left';
  });

  const setNavPosition = (position: NavPosition) => {
    if (!NAV_POSITIONS.includes(position)) return;
    setNavPositionState(position);
    try {
      localStorage.setItem('storm_muhasebe_nav_position', position);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useAppSettings.setNavPosition');
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-nav-position', navPosition);
  }, [navPosition]);

  const [activeLogoTheme, setActiveLogoTheme] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_logo_theme') || 'theme';
  });

  const [appFontSize, setAppFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('storm_muhasebe_font_size') as 'small' | 'medium' | 'large') || 'medium';
  });

  const [sidebarBg, setSidebarBg] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_bg') || '#050505';
  });

  const [sidebarPattern, setSidebarPattern] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_sidebar_pattern') || 'crystal';
  });

  const [sidebarPatternOpacity, setSidebarPatternOpacity] = useState<number>(() => {
    return parseFloat(localStorage.getItem('storm_muhasebe_sidebar_pattern_opacity') || '0.75');
  });

  const [sidebarPatternColor, setSidebarPatternColor] = useState<'white' | 'black' | 'theme'>(() => {
    return (localStorage.getItem('storm_muhasebe_sidebar_pattern_color') as 'white' | 'black' | 'theme') || 'theme';
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

  const [tabOrder, setTabOrder] = useState<string[]>(() => {
    const defaultOrder = ['dashboard', 'pos', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'ceksenet', 'krediler', 'raporlar', 'ayarlar'];
    const saved = localStorage.getItem('storm_muhasebe_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((t: string) => defaultOrder.includes(t));
          const missing = defaultOrder.filter((t: string) => !filtered.includes(t));
          let order = [...filtered, ...missing];

          // Reorder 'pos' so it is positioned right under 'dashboard' and above 'cariler'
          if (order.includes('pos') && order.includes('cariler')) {
            order = order.filter((t) => t !== 'pos');
            const carilerIdx = order.indexOf('cariler');
            order.splice(carilerIdx >= 0 ? carilerIdx : 1, 0, 'pos');
          }
          localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(order));
          return order;
        }
      } catch (e) {}
    }
    localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(defaultOrder));
    return defaultOrder;
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

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_gemini_api_key') || '';
  });

  const [isAiEnabled, setIsAiEnabled] = useState<boolean>(() => {
    return localStorage.getItem('storm_muhasebe_ai_enabled') !== 'false';
  });

  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('storm_auto_backup_enabled') !== 'false';
  });

  // Sync auto backup with electron when it changes
  useEffect(() => {
    if ((window as any).electronAPI && (window as any).electronAPI.setAutoBackup) {
      (window as any).electronAPI.setAutoBackup(autoBackupEnabled);
    }
  }, [autoBackupEnabled]);

  return {
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
    isAiEnabled, setIsAiEnabled,
    autoBackupEnabled, setAutoBackupEnabled
  };
}
