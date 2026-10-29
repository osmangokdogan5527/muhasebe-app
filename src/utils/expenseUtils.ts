import { EmployeeTransaction } from '../types';

/**
 * Maaş ödemesi ve avanslar kaydedilirken firebase.ts (saveEmployeeTransaction)
 * aynı id ile bir masraf kaydı da oluşturur. Bu fonksiyon o otomatik masrafların
 * id'lerini döndürür; çalışan işlemlerini ayrıca sayan hesaplamalar bu masrafları
 * atlayarak aynı ödemenin iki kez düşülmesini önler.
 */
export function getSyncedEmployeeExpenseIds(employeeTransactions: EmployeeTransaction[] | undefined): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(employeeTransactions)) return ids;
  employeeTransactions.forEach((et) => {
    if (et && et.id && (et.type === 'payment' || et.type === 'advance')) {
      ids.add(et.id);
    }
  });
  return ids;
}
