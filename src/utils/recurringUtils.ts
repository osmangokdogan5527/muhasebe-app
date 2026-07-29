import { RecurringTransaction } from '../types';

/**
 * Formats a Date object as YYYY-MM-DD string in local time.
 */
export function formatDateISO(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Returns today's date formatted as YYYY-MM-DD.
 */
export function getTodayISO(): string {
  return formatDateISO(new Date());
}

/**
 * Calculates the next due date based on frequency and target day of month.
 * @param fromDateStr The base date (e.g. current nextDueDate or today) YYYY-MM-DD
 * @param frequency 'monthly' | 'weekly' | 'yearly'
 * @param targetDayOfMonth Desired day of month (1-31)
 */
export function calculateNextDueDate(
  fromDateStr: string,
  frequency: 'monthly' | 'weekly' | 'yearly' = 'monthly',
  targetDayOfMonth: number = 1
): string {
  const baseDate = new Date(fromDateStr || getTodayISO());
  if (isNaN(baseDate.getTime())) {
    return getTodayISO();
  }

  if (frequency === 'weekly') {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 7);
    return formatDateISO(nextDate);
  }

  if (frequency === 'yearly') {
    const nextDate = new Date(baseDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1);
    return formatDateISO(nextDate);
  }

  // Monthly logic
  let nextYear = baseDate.getFullYear();
  let nextMonth = baseDate.getMonth() + 1; // move to next month

  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear += 1;
  }

  // Handle max days in the target month (e.g., Feb 28/29, April 30)
  const maxDaysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
  const actualDay = Math.min(Math.max(1, targetDayOfMonth), maxDaysInNextMonth);

  const resultDate = new Date(nextYear, nextMonth, actualDay);
  return formatDateISO(resultDate);
}

/**
 * Checks if a recurring item is due for approval today or earlier.
 */
export function isPendingApproval(item: RecurringTransaction, todayStr: string = getTodayISO()): boolean {
  if (item.status !== 'active') return false;
  if (!item.nextDueDate) return false;

  // Check end date constraint if exists
  if (item.endDate && item.nextDueDate > item.endDate) {
    return false;
  }

  return item.nextDueDate <= todayStr;
}

/**
 * Filters a list of recurring transactions to return those waiting for approval.
 */
export function getPendingRecurringItems(items: RecurringTransaction[], todayStr: string = getTodayISO()): RecurringTransaction[] {
  if (!Array.isArray(items)) return [];
  return items.filter((item) => isPendingApproval(item, todayStr));
}
