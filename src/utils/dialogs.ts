/**
 * Storm Ön Muhasebe - Sayfa İçi Onay ve Bilgi Pencereleri
 *
 * Tarayıcının window.confirm / window.alert pencereleri gömülü önizlemelerde (AI Studio gibi)
 * engellenir: onay sorusu sessizce "hayır" döner, bilgi mesajı hiç görünmez. Bu modül aynı işi
 * sayfanın içinde gösterilen pencerelerle yapar. Pencereleri <DialogHost /> çizer.
 *
 *   if (!(await confirmDialog('Bu kaydı silmek istediğinize emin misiniz?'))) return;
 *   alertDialog('Kayıt bulunamadı.');
 *
 * DialogHost henüz ekranda değilse (ör. çok erken bir hata) tarayıcının kendi penceresine düşer.
 */
import { logError } from './errorLogger';

export type DialogKind = 'confirm' | 'alert';

export interface DialogOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Silme gibi geri alınamayan işlemlerde onay düğmesi kırmızı gösterilir. */
  danger?: boolean;
}

export interface DialogRequest extends DialogOptions {
  id: number;
  kind: DialogKind;
  resolve: (confirmed: boolean) => void;
}

type DialogListener = (queue: DialogRequest[]) => void;

let queue: DialogRequest[] = [];
let listener: DialogListener | null = null;
let nextId = 1;

const DANGER_WORDS = /sil|kaldır|iptal|sıfırla|geri yükle|pas geç|temizle/i;

function toOptions(input: string | DialogOptions): DialogOptions {
  return typeof input === 'string' ? { message: input } : input;
}

function emit(): void {
  try {
    listener?.([...queue]);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), 'dialogs.emit');
  }
}

function enqueue(kind: DialogKind, options: DialogOptions): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    queue.push({ ...options, id: nextId++, kind, resolve });
    emit();
  });
}

/** Ekrandaki DialogHost kendini buraya bağlar; ayrılırken null verir. */
export function subscribeDialogs(fn: DialogListener | null): void {
  listener = fn;
  if (fn) emit();
}

/** Kullanıcı bir pencereyi yanıtladığında DialogHost çağırır. */
export function settleDialog(id: number, confirmed: boolean): void {
  const request = queue.find((item) => item.id === id);
  queue = queue.filter((item) => item.id !== id);
  emit();
  request?.resolve(confirmed);
}

/** Evet/Hayır sorusu. Onaylanırsa true döner. */
export function confirmDialog(input: string | DialogOptions): Promise<boolean> {
  const options = toOptions(input);
  if (!listener) {
    try {
      return Promise.resolve(window.confirm(options.message));
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'dialogs.confirmFallback');
      return Promise.resolve(false);
    }
  }
  return enqueue('confirm', {
    ...options,
    danger: options.danger ?? DANGER_WORDS.test(options.message),
  });
}

/** Bilgi / uyarı mesajı. Kapatılınca tamamlanır (beklemek zorunlu değildir). */
export function alertDialog(input: string | DialogOptions): Promise<void> {
  const options = toOptions(input);
  if (!listener) {
    try {
      window.alert(options.message);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'dialogs.alertFallback');
    }
    return Promise.resolve();
  }
  return enqueue('alert', options).then(() => undefined);
}
