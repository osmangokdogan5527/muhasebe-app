/**
 * Sayfa içi onay / bilgi penceresi çizici (src/utils/dialogs.ts ile birlikte çalışır).
 * Uygulamanın en dışına bir kez yerleştirilir; giriş ekranında da çalışır.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { DialogRequest, settleDialog, subscribeDialogs } from '../../utils/dialogs';
import { logError } from '../../utils/errorLogger';

export const DialogHost: React.FC = () => {
  const [queue, setQueue] = useState<DialogRequest[]>([]);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    subscribeDialogs(setQueue);
    return () => subscribeDialogs(null);
  }, []);

  const current = queue[0];

  useEffect(() => {
    if (!current) return;
    try {
      confirmButtonRef.current?.focus();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'DialogHost.focus');
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        settleDialog(current.id, false);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [current]);

  if (!current) return null;

  const isConfirm = current.kind === 'confirm';
  const title = current.title || (isConfirm ? 'Onay' : 'Bilgi');
  const confirmText = current.confirmText || (isConfirm ? (current.danger ? 'Evet, Devam Et' : 'Onayla') : 'Tamam');
  const cancelText = current.cancelText || 'Vazgeç';

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={`storm-dialog-title-${current.id}`}
      aria-describedby={`storm-dialog-message-${current.id}`}
      onMouseDown={(e) => { if (e.target === e.currentTarget && !isConfirm) settleDialog(current.id, true); }}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 shadow-2xl p-5 text-left"
        style={{ backgroundColor: '#11142a' }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${current.danger ? 'text-rose-300' : 'text-sky-300'}`}
            style={{ backgroundColor: current.danger ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)' }}
          >
            {current.danger ? <AlertTriangle size={20} /> : <Info size={20} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 id={`storm-dialog-title-${current.id}`} className="text-base font-bold" style={{ color: '#ffffff' }}>
              {title}
            </h3>
            <p
              id={`storm-dialog-message-${current.id}`}
              className="mt-1.5 text-sm leading-relaxed whitespace-pre-line break-words"
              style={{ color: '#cbd5e1' }}
            >
              {current.message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          {isConfirm && (
            <button
              type="button"
              onClick={() => settleDialog(current.id, false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/10 hover:bg-white/10 transition cursor-pointer"
              style={{ color: '#e2e8f0', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={() => settleDialog(current.id, true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer hover:brightness-110"
            style={{
              color: '#ffffff',
              backgroundColor: current.danger ? '#e11d48' : 'var(--accent-600, #0284c7)',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
