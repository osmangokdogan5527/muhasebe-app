import { useState, useEffect } from 'react';

export function useAppSettings() {
  const [activeTheme, setActiveTheme] = useState<string>(() => {
    // Migration check to ensure previous users get the new default 'sky' with 'fluid-mesh'
    const isInitializedV2 = localStorage.getItem('storm_default_setup_v2');
    if (!isInitializedV2) {
      localStorage.setItem('storm_default_setup_v2', 'true');
      localStorage.setItem('kolay_hesap_accent_theme', 'sky');
      localStorage.setItem('storm_muhasebe_design_style', 'fluid-mesh');
      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
      return 'sky';
    }

    const saved = localStorage.getItem('kolay_hesap_accent_theme');
    if (saved === 'rose') return 'red';
    return saved || 'sky';
  });

  const [designStyle, setDesignStyle] = useState<string>(() => {
    return localStorage.getItem('storm_muhasebe_design_style') || 'fluid-mesh';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-design-style', designStyle);
    localStorage.setItem('storm_muhasebe_design_style', designStyle);
  }, [designStyle]);

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
    const saved = localStorage.getItem('storm_muhasebe_tab_order');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const required = ['dashboard', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'ceksenet', 'krediler', 'raporlar', 'ayarlar'];
          const filtered = parsed.filter((t: string) => required.includes(t));
          const missing = required.filter((t: string) => !filtered.includes(t));
          return [...filtered, ...missing];
        }
      } catch (e) {}
    }
    return ['dashboard', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'ceksenet', 'krediler', 'raporlar', 'ayarlar'];
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
  };
}
