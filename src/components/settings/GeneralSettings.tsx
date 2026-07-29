import React from 'react';
import { Palette, Eye, EyeOff, ChevronUp, ChevronDown, Download, Sparkles, Check, Printer, Save, Menu } from 'lucide-react';
import { COLOR_PRESETS, TAB_DEFS } from '../../constants';

export interface GeneralSettingsProps {
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
  handleDownloadLogoPng: () => void;
  handleDownloadLogoSvg: () => void;
  currentThemeData: any;
  showToast: (text: string, type?: 'success' | 'error' | 'info') => void;
  handleSavePrintSettings: () => void;
  printSettingsSuccess: string | null;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({
  activeTheme,
  setActiveTheme,
  designStyle,
  setDesignStyle,
  activeLogoTheme,
  setActiveLogoTheme,
  appFontSize,
  setAppFontSize,
  tabOrder,
  setTabOrder,
  hiddenTabs,
  setHiddenTabs,
  toggleTabVisibility,
  moveTab,
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
  handleDownloadLogoPng,
  handleDownloadLogoSvg,
  currentThemeData,
  showToast,
  handleSavePrintSettings,
  printSettingsSuccess,
  sidebarBg,
  setSidebarBg,
  sidebarPattern,
  setSidebarPattern,
  sidebarPatternOpacity,
  setSidebarPatternOpacity,
  sidebarPatternColor,
  setSidebarPatternColor
}) => {
  // Ensure the logo theme is stabilized to dynamically track the active interface accent color
  React.useEffect(() => {
    if (activeLogoTheme !== 'theme') {
      setActiveLogoTheme('theme');
      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
    }
  }, [activeLogoTheme, setActiveLogoTheme]);

  return (
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Card 1: Vurgu Rengi / Tema Seçimi */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm hidden md:flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Palette size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Arayüz Vurgu Rengi</h3>
                    <p className="text-xs text-white/50 mt-0.5">Uygulama genelinde kullanılacak buton ve vurgu renk paleti</p>
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
                            ? 'border-teal-500 bg-teal-500/15 text-white font-bold shadow-[0_2px_8px_rgba(45,212,191,0.2)]' 
                            : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/80'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full block border border-black/10 shrink-0 shadow-xs" 
                          style={{ backgroundColor: preset.preview }}
                        />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/80'}`}>
                          {preset.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Desktop Icon Export Options */}
                <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
                  <div className="text-[10px] font-bold text-white/50 uppercase tracking-wider flex items-center gap-1.5 mb-1">
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
                      className="flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold text-white/80 bg-white hover:bg-slate-800 hover:text-white border border-white/10 hover:border-slate-800 rounded-lg transition shadow-xs cursor-pointer active:scale-95"
                    >
                      SVG Vektör
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Seçilen Tema: {currentThemeData.name}
              </div>
            </div>

            {/* Combined Compact Card: Arayüz Tasarım Stili & Uygulama Yazı Boyutu */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
              <div className="flex flex-col gap-6">
                {/* Section A: Arayüz Tasarım Stili */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Arayüz Tasarım Stili</h3>
                      <p className="text-[11px] text-white/50 mt-0.5">Uygulama atmosferi ve tema stilini seçin</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { id: 'fluid-mesh', name: 'Sıvı Mesh Gradient', badge: 'Seçkin & Canlı', dot: 'bg-gradient-to-r from-teal-400 to-indigo-500' },
                      { id: 'glass', name: 'Cam Arayüz (Glass)', badge: 'Sanat Eseri', dot: 'bg-purple-400' },
                      { id: 'navy-perf', name: 'Lacivert Performans', badge: 'Navy Hız', dot: 'bg-blue-500' },
                      { id: 'clean-light', name: 'Temiz Işık (Pure)', badge: 'Mikro Hız', dot: 'bg-emerald-400' },
                      { id: 'pro-solid', name: 'MuhasebePro (Solid)', badge: 'Pro Stil', dot: 'bg-rose-500' },
                    ].map((styleOpt) => {
                      const isSelected = designStyle === styleOpt.id;
                      return (
                        <button
                          key={styleOpt.id}
                          onClick={() => {
                            setDesignStyle(styleOpt.id);
                            localStorage.setItem('storm_muhasebe_design_style', styleOpt.id);
                            showToast(`${styleOpt.name} stili uygulandı!`, 'success');
                          }}
                          className={`flex items-center justify-between p-2.5 px-3 rounded-xl border text-left transition cursor-pointer relative ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-500/15 text-white shadow-[0_2px_10px_rgba(99,102,241,0.2)] font-bold'
                              : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${styleOpt.dot}`} />
                            <div className="flex flex-col truncate">
                              <span className="text-xs font-semibold truncate">{styleOpt.name}</span>
                              <span className="text-[9px] text-white/40">{styleOpt.badge}</span>
                            </div>
                          </div>
                          {isSelected && <Check size={14} className="text-indigo-400 shrink-0 ml-1 stroke-[3px]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section B: Uygulama Yazı Boyutu */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
                      <span className="font-serif font-bold text-base">A</span>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Uygulama Yazı Boyutu</h3>
                      <p className="text-[11px] text-white/50 mt-0.5">Uygulama genelindeki metinlerin büyüklüğü</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
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
                          className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border transition cursor-pointer ${
                            isSelected 
                              ? 'border-teal-500 bg-teal-500/15 text-white shadow-[0_2px_10px_rgba(45,212,191,0.2)] font-bold' 
                              : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white'
                          }`}
                        >
                          <span className="text-xs font-semibold">{preset.name}</span>
                          <span className="text-[10px] text-white/40 font-mono mt-0.5">{preset.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Firma ve Görünüm Ayarları */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm hidden md:flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-600 flex items-center justify-center">
                    <Printer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Firma ve Görünüm Ayarları</h3>
                    <p className="text-xs text-white/50 mt-0.5 leading-tight">Basılı evrakların üst kısmında yer alacak firma bilgileri ve logo seçenekleri.</p>
                  </div>
                </div>

                {printSettingsSuccess && (
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg flex items-center gap-2 mb-4">
                    <Check size={14} />
                    {printSettingsSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Logo Tipi</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setLogoType('text')} className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${logoType === 'text' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-white/10 text-white/50 hover:border-white/20'}`}>✍️ Metin</button>
                        <button type="button" onClick={() => setLogoType('image')} className={`py-1.5 px-3 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${logoType === 'image' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-white/10 text-white/50 hover:border-white/20'}`}>🖼️ Resim</button>
                      </div>
                    </div>

                    {logoType === 'image' && (
                      <div className="space-y-1.5 animate-fade-in">
                        <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Logo Görseli</label>
                        <div className="flex gap-2">
                          <input type="text" value={logoImageUrl} onChange={(e) => setLogoImageUrl(e.target.value)} className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="Resim linki (https://...)" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Firma İsmi</label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="Firma Adı" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Telefon</label>
                      <input type="text" value={companyPhone} onChange={(e) => setCompanyPhone(e.target.value)} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500" placeholder="05XX XXX XX XX" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Adres</label>
                      <textarea value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} rows={3} className="w-full px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none" placeholder="Adres" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
                <button
                  onClick={handleSavePrintSettings}
                  className="flex items-center justify-center gap-2 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Save size={14} />
                  <span>Kaydet</span>
                </button>
              </div>
            </div>

            {/* Card 4: Sol Menü Sekme Yönetimi */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Menu size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sol Menü Sekme Yönetimi</h3>
                    <p className="text-xs text-white/50 mt-0.5">Sekmelerin sol paneldeki yerlerini değiştirin, istediğiniz sekmeleri gizleyin veya ekleyin</p>
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
                            ? 'bg-white/5 border-white/10 opacity-60' 
                            : 'bg-white border-white/10 hover:border-white/20 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isHidden ? 'bg-slate-200/50 text-slate-400' : 'bg-teal-500/10 text-teal-600'}`}>
                            {def.icon}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">{def.label}</span>
                            <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">TAB ID: {tabId.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            disabled={isCritical}
                            onClick={() => toggleTabVisibility(tabId)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition ${
                              isCritical
                                ? 'bg-white/10 text-slate-400 border border-white/10 cursor-not-allowed opacity-50'
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
                              className={`p-1.5 rounded bg-white border border-white/10 text-white/50 hover:text-teal-600 hover:border-teal-300 transition ${
                                isFirst ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer active:scale-90'
                              }`}
                              title="Yukarı Taşı"
                            >
                              <ChevronUp size={16} />
                            </button>
                            <button
                              disabled={isLast}
                              onClick={() => moveTab(index, 'down')}
                              className={`p-1.5 rounded bg-white border border-white/10 text-white/50 hover:text-teal-600 hover:border-teal-300 transition ${
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

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-between items-center text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                  <span>Ayarlar Tarayıcıya Otomatik Kaydedilir</span>
                  <button
                    onClick={() => {
                      const defaultOrder = ['dashboard', 'cariler', 'kasa', 'islemler', 'stoklar', 'masraflar', 'calisanlar', 'ceksenet', 'krediler', 'raporlar', 'ayarlar'];
                      setTabOrder(defaultOrder);
                      setHiddenTabs([]);
                      localStorage.setItem('storm_muhasebe_tab_order', JSON.stringify(defaultOrder));
                      localStorage.setItem('storm_muhasebe_hidden_tabs', JSON.stringify([]));
                      
                      // Also reset visual settings to user requested defaults
                      setActiveTheme('sky');
                      localStorage.setItem('kolay_hesap_accent_theme', 'sky');
                      
                      setDesignStyle('fluid-mesh');
                      localStorage.setItem('storm_muhasebe_design_style', 'fluid-mesh');
                      
                      setActiveLogoTheme('theme');
                      localStorage.setItem('storm_muhasebe_logo_theme', 'theme');
                      
                      setSidebarBg('#050505');
                      localStorage.setItem('storm_muhasebe_sidebar_bg', '#050505');
                      
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

  );
};
