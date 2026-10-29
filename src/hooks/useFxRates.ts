import { useEffect, useState } from 'react';
import { TCMBRatesResult, fetchTCMBRates, getCachedOrFallbackRates } from '../utils/tcmbService';
import { logError } from '../utils/errorLogger';

/**
 * Döviz kurlarını sağlar: önce önbellekteki (veya yedek) kurla anında başlar,
 * ardından günün kurunu arka planda yükler.
 */
export function useFxRates(): TCMBRatesResult {
  const [rates, setRates] = useState<TCMBRatesResult>(() => getCachedOrFallbackRates());

  useEffect(() => {
    let cancelled = false;
    fetchTCMBRates(false)
      .then((result) => {
        if (!cancelled && result) setRates(result);
      })
      .catch((err) => {
        logError(err instanceof Error ? err : new Error(String(err)), 'useFxRates');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return rates;
}
