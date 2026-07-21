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
                            ? 'border-teal-500 bg-teal-500/5 shadow-[0_2px_8px_rgba(45,212,191,0.1)]' 
                            : 'border-white/10 hover:border-white/20 bg-white'
                        }`}
                      >
                        <span 
                          className="w-5 h-5 rounded-full block border border-black/5 shrink-0" 
                          style={{ backgroundColor: preset.preview }}
                        />
                        <span className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
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

            {/* Card 2: Yazı Boyutu */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <span className="font-serif font-bold text-lg">A</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Uygulama Yazı Boyutu</h3>
                    <p className="text-xs text-white/50 mt-0.5">Uygulama genelindeki metinlerin büyüklüğünü ayarlayın</p>
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
                            : 'border-white/10 hover:border-white/20 bg-white'
                        }`}
                      >
                        <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
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

            {/* Card: Görsel Tasarım Teması Seçici */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm hidden md:flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Arayüz Tasarım Stili</h3>
                    <p className="text-xs text-white/50 mt-0.5">Uygulamanın genel görsel dilini, derinliğini ve atmosferini değiştirin</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {[
                    {
                      id: 'glass',
                      name: 'Cam Arayüz (Glassmorphism)',
                      desc: 'Buzlu cam dokusu, derinlik veren blurlar ve modern neon parıltıları.',
                      badge: 'Sanat Eseri',
                      preview: (
                        <div className="h-20 w-full rounded-lg bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-2 flex flex-col justify-between overflow-hidden relative">
                          <span className="absolute -right-2 -top-2 w-10 h-10 rounded-full bg-pink-500/20 blur-sm animate-pulse" />
                          <span className="absolute -left-2 -bottom-2 w-10 h-10 rounded-full bg-teal-500/20 blur-sm" />
                          <div className="flex items-center gap-1 relative z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="w-8 h-1 bg-white/20 rounded" />
                          </div>
                          <div className="space-y-1 relative z-10">
                            <div className="w-full h-2 bg-white/5 border border-white/10 backdrop-blur-xs rounded" />
                            <div className="w-2/3 h-2 bg-white/5 border border-white/10 backdrop-blur-xs rounded" />
                          </div>
                        </div>
                      )
                    },
                    {
                      id: 'fluid-mesh',
                      name: 'Sıvı Mesh Gradient (Aurora Mesh)',
                      desc: 'Renklerin akıcı bir şekilde süzüldüğü, göz alıcı neon geçişler ve parıldayan ultra şeffaf cam paneller.',
                      badge: 'Seçkin & Canlı',
                      preview: (
                        <div className="h-20 w-full rounded-lg bg-[#06040e] p-2 flex flex-col justify-between overflow-hidden relative border border-white/10">
                          <div className="absolute top-0 left-0 w-full h-full opacity-60 bg-gradient-to-tr from-violet-600/30 via-pink-600/20 to-teal-500/20 blur-md" />
                          <div className="absolute -top-6 -right-6 w-16 h-16 rounded-full bg-orange-500/20 blur-md" />
                          <div className="absolute -bottom-6 -left-6 w-16 h-16 rounded-full bg-teal-500/20 blur-md" />
                          <div className="flex items-center gap-1 relative z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" />
                            <span className="w-8 h-1 bg-white/40 rounded" />
                          </div>
                          <div className="space-y-1 relative z-10">
                            <div className="w-full h-2 bg-white/10 border border-white/20 backdrop-blur-md rounded shadow-sm" />
                            <div className="w-2/3 h-2 bg-white/10 border border-white/20 backdrop-blur-md rounded shadow-sm" />
                          </div>
                        </div>
                      )
                    },
                    {
                      id: 'navy-perf',
                      name: 'Lacivert & Yüksek Performans (Navy Performance)',
                      desc: 'Lacivert (#00007f) tabanlı, sıfır CPU yüküyle çalışan, göz yormayan, dinamik ve yüksek performanslı karanlık arayüz.',
                      badge: 'Navy Hız',
                      preview: (
                        <div className="h-20 w-full rounded-lg bg-[#000022] p-2 flex flex-col justify-between overflow-hidden relative border border-[#00007f]">
                          <div className="absolute top-0 left-0 w-full h-full bg-[#000018]" />
                          <div className="flex items-center gap-1 relative z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                            <span className="w-8 h-1 bg-blue-300 rounded" />
                          </div>
                          <div className="space-y-1 relative z-10">
                            <div className="w-full h-2 bg-[#00003c] border border-[#00007f] rounded shadow-xs" />
                            <div className="w-2/3 h-2 bg-[#00003c] border border-[#00007f] rounded shadow-xs" />
                          </div>
                        </div>
                      )
                    },
                    {
                      id: 'clean-light',
                      name: 'Temiz Işık & Yüksek Performans (Pure Light)',
                      desc: 'Sıfır CPU yüküyle çalışan, her cihazda akıcı, pürüzsüz saf beyaz zemin üzerine modern ve minimalist arayüz.',
                      badge: 'Mikro Hız',
                      preview: (
                        <div className="h-20 w-full rounded-lg bg-slate-100 p-2 flex flex-col justify-between overflow-hidden relative border border-slate-200">
                          <div className="absolute top-0 left-0 w-full h-full bg-white opacity-40" />
                          <div className="flex items-center gap-1 relative z-10">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span className="w-8 h-1 bg-slate-300 rounded" />
                          </div>
                          <div className="space-y-1 relative z-10">
                            <div className="w-full h-2 bg-white border border-slate-200 rounded shadow-xs" />
                            <div className="w-2/3 h-2 bg-white border border-slate-200 rounded shadow-xs" />
                          </div>
                        </div>
                      )
                    }
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
                        className={`group flex flex-col text-left rounded-xl border p-4 transition-all cursor-pointer relative overflow-hidden ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/10 shadow-[0_4px_16px_rgba(99,102,241,0.15)]' 
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5/50 bg-slate-900 shadow-xs'
                        }`}
                      >
                        {styleOpt.preview}
                        
                        <div className="mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white/90">
                              {styleOpt.name}
                            </span>
                            {styleOpt.badge && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white/50'
                              }`}>
                                {styleOpt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                            {styleOpt.desc}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-indigo-600 text-white rounded-full p-0.5 shadow-sm">
                            <Check size={10} className="stroke-[3px]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 text-[10px] text-slate-400 font-mono uppercase tracking-wider flex justify-between items-center">
                <span>Aktif Tasarım Dili:</span>
                <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                  {designStyle === 'fluid-mesh' 
                    ? 'Sıvı Mesh Gradient (Aurora)' 
                    : designStyle === 'clean-light' 
                      ? 'Temiz Işık & Yüksek Performans' 
                      : 'Cam Arayüz (Glassmorphism)'}
                </span>
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

  );
};
