/**
 * Cari bakiyelerini ekranda gizleme tercihi (müşteri ekrana bakarken tutarlar görünmesin diye).
 *
 * - hideAll: Cari listesindeki ve Veresiye Takibi'ndeki tüm tutarları gizler.
 * - hiddenIds: Yalnızca seçilen carilerin bakiyesini gizler (kalıcı).
 * - revealedIds: "Tümünü gizle" açıkken tek bir carinin tutarını geçici olarak gösterir (oturumluk).
 *
 * Tercih bu cihaza kaydedilir (localStorage); hesap verisi değişmez, yalnızca görünüm etkilenir.
 * Aynı anda açık olan Cari listesi ve Veresiye Takibi penceresi tek kaynaktan beslenir.
 */
import { useCallback, useSyncExternalStore } from 'react';
import { logError } from '../../utils/errorLogger';

const STORAGE_KEY = 'storm_cari_balance_privacy_v1';

export const MASKED_AMOUNT = '••••••';

interface PrivacyState {
  hideAll: boolean;
  hiddenIds: string[];
  revealedIds: string[];
}

const EMPTY_STATE: PrivacyState = { hideAll: false, hiddenIds: [], revealedIds: [] };

function readStored(): PrivacyState {
  try {
    if (typeof localStorage === 'undefined') return EMPTY_STATE;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<PrivacyState>;
    return {
      hideAll: parsed.hideAll === true,
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds.filter((id): id is string => typeof id === 'string') : [],
      revealedIds: [],
    };
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useBalancePrivacy.readStored');
    return EMPTY_STATE;
  }
}

let state: PrivacyState = readStored();
const listeners = new Set<() => void>();

function setState(next: PrivacyState) {
  state = next;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ hideAll: next.hideAll, hiddenIds: next.hiddenIds }));
    }
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'useBalancePrivacy.save');
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => state;

export function useBalancePrivacy() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  /** Bu carinin tutarı şu an gizli mi? */
  const isHidden = useCallback(
    (cariId: string) => (current.hideAll ? !current.revealedIds.includes(cariId) : current.hiddenIds.includes(cariId)),
    [current],
  );

  /** Tüm tutarları gizle / göster */
  const toggleAll = useCallback(() => {
    setState({ ...state, hideAll: !state.hideAll, revealedIds: [] });
  }, []);

  /** Tek carinin tutarını gizle / göster */
  const toggleOne = useCallback((cariId: string) => {
    if (state.hideAll) {
      const revealed = state.revealedIds.includes(cariId)
        ? state.revealedIds.filter((id) => id !== cariId)
        : [...state.revealedIds, cariId];
      setState({ ...state, revealedIds: revealed });
      return;
    }
    const hidden = state.hiddenIds.includes(cariId)
      ? state.hiddenIds.filter((id) => id !== cariId)
      : [...state.hiddenIds, cariId];
    setState({ ...state, hiddenIds: hidden });
  }, []);

  return { hideAll: current.hideAll, isHidden, toggleAll, toggleOne };
}
