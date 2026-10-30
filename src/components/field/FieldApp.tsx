/**
 * Storm Saha (telefon) Uygulaması
 *
 * Telefona yüklenen uygulama (PWA) bu sade ekranla açılır: hızlı satış, tahsilat,
 * stok sorgulama, cari bakiye ve Storm AI. Kayıtlar masaüstü ekranlarının kullandığı
 * aynı fonksiyonlarla yapılır. "Tam Sürüm" ile bilgisayardaki tüm ekranlara geçilir.
 */
import React, { useCallback, useState } from 'react';
import { ShoppingCart, ArrowDownLeft, Package, Users, Bot, MoreVertical, Monitor, LogOut, Wifi, WifiOff, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { Cari, Stock, Transaction, BankAccount } from '../../types';
import AiAssistant from '../AiAssistant';
import { FieldSale, FieldSaleData } from './FieldSale';
import { FieldCollection } from './FieldCollection';
import { FieldStock } from './FieldStock';
import { FieldCari } from './FieldCari';

type FieldTab = 'satis' | 'tahsilat' | 'stok' | 'cari' | 'ai';

// Saha sekmelerinin karşılık geldiği masaüstü menüleri (güvenlik modu yetki kontrolü için)
const TAB_PERMISSION: Record<FieldTab, string | null> = { satis: 'pos', tahsilat: 'islemler', stok: 'stoklar', cari: 'cariler', ai: null };

interface FieldAppProps {
  firmName: string;
  cariler: Cari[];
  stoklar: Stock[];
  islemler: Transaction[];
  bankAccounts: BankAccount[];
  isOnline: boolean;
  toastMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (text: string | null, type?: 'success' | 'error' | 'info') => void;
  onCompleteSale: (sale: FieldSaleData) => Promise<boolean>;
  onSwitchToFull: (targetTab?: string) => void;
  onSignOut: () => void;
  isRestricted: boolean;
  sensitiveTabs: string[];
  ai: {
    enabled: boolean;
    apiKey: string;
    userRole: 'admin' | 'employee';
    isSecurityActive: boolean;
    actionPermissions: any;
    financialData: any;
  };
}

export const FieldApp: React.FC<FieldAppProps> = ({
  firmName, cariler, stoklar, islemler, bankAccounts, isOnline, toastMessage, showToast,
  onCompleteSale, onSwitchToFull, onSignOut, isRestricted, sensitiveTabs, ai,
}) => {
  const allowed = (tab: FieldTab) => {
    if (tab === 'ai') return ai.enabled;
    const perm = TAB_PERMISSION[tab];
    return !(isRestricted && perm && sensitiveTabs.includes(perm));
  };
  const tabs: { id: FieldTab; label: string; icon: React.ReactNode }[] = ([
    { id: 'satis', label: 'Satış', icon: <ShoppingCart size={21} /> },
    { id: 'tahsilat', label: 'Tahsilat', icon: <ArrowDownLeft size={21} /> },
    { id: 'stok', label: 'Stok', icon: <Package size={21} /> },
    { id: 'cari', label: 'Cariler', icon: <Users size={21} /> },
    { id: 'ai', label: 'Storm AI', icon: <Bot size={21} /> },
  ] as { id: FieldTab; label: string; icon: React.ReactNode }[]).filter(t => allowed(t.id));

  const [activeTab, setActiveTab] = useState<FieldTab>(() => tabs[0]?.id || 'cari');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [presetSaleCari, setPresetSaleCari] = useState<Cari | null>(null);
  const [presetCollectionCari, setPresetCollectionCari] = useState<Cari | null>(null);
  const clearSalePreset = useCallback(() => setPresetSaleCari(null), []);
  const clearCollectionPreset = useCallback(() => setPresetCollectionCari(null), []);

  const titles: Record<FieldTab, string> = { satis: 'Hızlı Satış', tahsilat: 'Tahsilat / Ödeme', stok: 'Stok Sorgula', cari: 'Cariler', ai: 'Storm AI' };

  return (
    <div
      className="fixed inset-0 flex flex-col text-white"
      style={{
        background: 'radial-gradient(120% 60% at 50% -10%, color-mix(in oklab, var(--accent-800, #075985) 45%, #070817) 0%, #05060d 65%)',
      }}
    >
      {/* Üst bar */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 truncate">{firmName}</div>
          <h1 className="text-lg font-bold leading-tight">{titles[activeTab]}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${isOnline ? 'text-emerald-300 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          </span>
          <div className="relative">
            <button type="button" onClick={() => setIsMenuOpen(v => !v)} className="p-2 rounded-xl text-slate-300 cursor-pointer" aria-label="Menü">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-[95] w-56 rounded-2xl border border-white/10 bg-[#0d1024] shadow-2xl overflow-hidden">
                  <button type="button" onClick={() => { setIsMenuOpen(false); onSwitchToFull(); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-white hover:bg-white/5 cursor-pointer">
                    <Monitor size={17} /> Tam Sürüme Geç
                  </button>
                  <button type="button" onClick={() => { setIsMenuOpen(false); onSignOut(); }} className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-rose-300 hover:bg-white/5 border-t border-white/5 cursor-pointer">
                    <LogOut size={17} /> Çıkış Yap
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Bildirim */}
      {toastMessage && (
        <div className="absolute left-3 right-3 top-[calc(4.5rem+env(safe-area-inset-top))] z-[130] animate-fade-in">
          <div className={`flex items-start gap-2.5 rounded-2xl border px-4 py-3 text-sm shadow-2xl backdrop-blur-md ${
            toastMessage.type === 'error' ? 'bg-rose-950/90 border-rose-500/40 text-rose-100'
              : toastMessage.type === 'info' ? 'bg-slate-900/90 border-white/15 text-slate-100'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'}`}>
            {toastMessage.type === 'error' ? <AlertCircle size={18} className="shrink-0 mt-0.5" /> : toastMessage.type === 'info' ? <Info size={18} className="shrink-0 mt-0.5" /> : <CheckCircle2 size={18} className="shrink-0 mt-0.5" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* İçerik */}
      <main className={`flex-1 min-h-0 ${activeTab === 'ai' ? 'flex flex-col p-2' : 'overflow-y-auto px-4 py-4'}`}>
        {activeTab === 'satis' && allowed('satis') && (
          <FieldSale
            stoklar={stoklar}
            cariler={cariler}
            bankAccounts={bankAccounts}
            presetCari={presetSaleCari}
            onPresetConsumed={clearSalePreset}
            onCompleteSale={onCompleteSale}
            showToast={showToast}
          />
        )}
        {activeTab === 'tahsilat' && allowed('tahsilat') && (
          <FieldCollection
            cariler={cariler}
            bankAccounts={bankAccounts}
            presetCari={presetCollectionCari}
            onPresetConsumed={clearCollectionPreset}
            showToast={showToast}
          />
        )}
        {activeTab === 'stok' && allowed('stok') && <FieldStock stoklar={stoklar} showToast={showToast} />}
        {activeTab === 'cari' && allowed('cari') && (
          <FieldCari
            cariler={cariler}
            islemler={islemler}
            canCollect={allowed('tahsilat')}
            canSell={allowed('satis')}
            onCollect={(cari) => { setPresetCollectionCari(cari); setActiveTab('tahsilat'); }}
            onSell={(cari) => { setPresetSaleCari(cari); setActiveTab('satis'); }}
          />
        )}
        {activeTab === 'ai' && ai.enabled && (
          <AiAssistant
            embedded
            apiKey={ai.apiKey}
            userRole={ai.userRole}
            isSecurityActive={ai.isSecurityActive}
            sensitiveTabs={sensitiveTabs}
            actionPermissions={ai.actionPermissions}
            financialData={ai.financialData}
            onNavigateToSettings={() => onSwitchToFull('ayarlar')}
            onCommandParsed={() => { /* saha ekranında AI kayıtları onay kartıyla doğrudan yapar */ }}
          />
        )}
      </main>

      {/* Alt sekme çubuğu */}
      <nav className="shrink-0 grid border-t border-white/10 bg-[#070915]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(tab => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center gap-1 pt-2.5 pb-2 text-[10px] font-bold transition cursor-pointer ${active ? 'text-white' : 'text-slate-500'}`}
            >
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full" style={{ backgroundColor: 'var(--accent-400, #38bdf8)' }} />}
              <span style={active ? { color: 'var(--accent-400, #38bdf8)' } : {}}>{tab.icon}</span>
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
