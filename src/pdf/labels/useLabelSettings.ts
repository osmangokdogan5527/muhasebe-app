/**
 * Etiket tasarımını firmanın ortak ayarlarından okur ve değişiklikleri kısa bir gecikmeyle
 * kendiliğinden kaydeder (kullanıcı "kaydet" demek zorunda kalmaz).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { saveSettingDoc, subscribeSettingDoc } from '../../firebase';
import { logError } from '../../utils/errorLogger';
import { DEFAULT_LABEL_SETTINGS, LabelSettings, normalizeLabelSettings } from './labelSettings';

const SETTING_ID = 'etiketTasarimi';
const SAVE_DELAY_MS = 800;

export type LabelSaveState = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

export function useLabelSettings() {
  const [settings, setSettingsState] = useState<LabelSettings>(DEFAULT_LABEL_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [saveState, setSaveState] = useState<LabelSaveState>('idle');
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<LabelSettings>(DEFAULT_LABEL_SETTINGS);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const fallback = setTimeout(() => setIsLoaded(true), 2500);
    try {
      unsubscribe = subscribeSettingDoc(SETTING_ID, (data) => {
        setIsLoaded(true);
        // Kullanıcı düzenlerken gelen (kendi kaydımızın yankısı dahil) güncellemeler ezmez
        if (dirtyRef.current) return;
        const next = normalizeLabelSettings(data);
        latestRef.current = next;
        setSettingsState(next);
      });
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useLabelSettings.subscribe');
      setIsLoaded(true);
    }
    return () => {
      clearTimeout(fallback);
      try {
        unsubscribe?.();
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'useLabelSettings.unsubscribe');
      }
    };
  }, []);

  const flush = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!dirtyRef.current) return;
    setSaveState('saving');
    try {
      await saveSettingDoc(SETTING_ID, { ...latestRef.current });
      dirtyRef.current = false;
      setSaveState('saved');
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'useLabelSettings.save');
      setSaveState('error');
    }
  }, []);

  const updateSettings = useCallback((updater: (prev: LabelSettings) => LabelSettings) => {
    setSettingsState((prev) => {
      const next = normalizeLabelSettings(updater(prev));
      latestRef.current = next;
      return next;
    });
    dirtyRef.current = true;
    setSaveState('pending');
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void flush(); }, SAVE_DELAY_MS);
  }, [flush]);

  // Pencere kapanırken bekleyen değişiklik varsa hemen kaydedilir
  useEffect(() => () => { void flush(); }, [flush]);

  return { settings, updateSettings, isLoaded, saveState };
}
