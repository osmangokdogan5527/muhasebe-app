/**
 * Storm Ön Muhasebe - Yerel Hata Günlüğü
 *
 * Hatalar dış servislere gönderilmez; konsola yazılır ve son 100 kayıt
 * localStorage'daki 'storm_error_logs' anahtarında saklanır.
 */

const ERROR_LOGS_KEY = 'storm_error_logs';
const MAX_ERROR_LOGS = 100;

export function logError(error: Error, context: string, stackOverride?: string) {
  console.error(`[${context}] Caught error:`, error);

  try {
    let activeUser = 'Sistem/Giriş Ekranı';
    const activeUserStr = localStorage.getItem('storm_muhasebe_active_user');
    if (activeUserStr) {
      activeUser = JSON.parse(activeUserStr).displayName || activeUser;
    }

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toLocaleString('tr-TR'),
      user: activeUser,
      message: `[${context}] ${error.message || 'Bilinmeyen Hata'}`,
      stack: stackOverride || error.stack || ''
    };

    const existingLogsStr = localStorage.getItem(ERROR_LOGS_KEY);
    const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
    existingLogs.unshift(newLog);
    if (existingLogs.length > MAX_ERROR_LOGS) existingLogs.length = MAX_ERROR_LOGS;

    localStorage.setItem(ERROR_LOGS_KEY, JSON.stringify(existingLogs));
  } catch (e) {
    console.error('Local error logging failed:', e);
  }
}
