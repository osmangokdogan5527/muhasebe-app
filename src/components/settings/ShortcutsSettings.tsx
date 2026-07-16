import React from 'react';
import { RotateCcw, X, Keyboard, Palette } from 'lucide-react';
import { KeyboardShortcut } from '../../types';

export interface ShortcutsSettingsProps {
  shortcuts: KeyboardShortcut[];
  setShortcuts: (val: KeyboardShortcut[]) => void;
  editingShortcutId: string | null;
  setEditingShortcutId: (val: string | null) => void;
  handleShortcutKeyDown: (e: React.KeyboardEvent, id: string) => void;
  handleClearShortcut: (id: string) => void;
  handleResetShortcuts: () => void;
}

export const ShortcutsSettings: React.FC<ShortcutsSettingsProps> = ({
  shortcuts,
  setShortcuts,
  editingShortcutId,
  setEditingShortcutId,
  handleShortcutKeyDown,
  handleClearShortcut,
  handleResetShortcuts
}) => {
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
    return parts.join(' + ');
  };

  return (
<div className="space-y-6 animate-fade-in">
            {/* Header / Info box */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                    <Keyboard size={24} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Hızlı Erişim Kısayol Tuşları</h3>
                    <p className="text-xs text-white/50 mt-1 leading-relaxed">
                      Sık kullandığınız işlemleri veya modül geçişlerini tek tuşla tetiklemek için özel kısayollar atayabilirsiniz. 
                      Kaydetmek istediğiniz kısayolun üzerindeki "Düzenle" butonuna tıklayın, ardından klavyenizdeki tuş kombinasyonuna (örneğin <kbd className="px-1.5 py-0.5 bg-white/10 border border-white/10 rounded font-mono text-[10px]">Alt + S</kbd>) basın.
                    </p>
                    <p className="text-[11px] text-rose-500 font-semibold mt-2">
                      ⚠️ Not: Kısayol tuşları, bir metin alanına (girdi kutuları, açıklama alanları vb.) yazı yazarken kazara tetiklenmeyi önlemek amacıyla otomatik olarak devre dışı kalır.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleResetShortcuts}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-slate-200 text-white/80 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
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
                <div key={category} className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-sm space-y-4">
                  <h4 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/5 pb-2 flex items-center gap-2">
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
                              : 'border-white/5 bg-white/5/50 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex-1 pr-4">
                            <span className="text-xs font-bold text-white/90 uppercase tracking-wider block">
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
                                <span className="px-3 py-1.5 bg-white/5 border border-white/10 text-white/90 rounded-lg text-xs font-extrabold font-mono shadow-sm">
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

  );
};
