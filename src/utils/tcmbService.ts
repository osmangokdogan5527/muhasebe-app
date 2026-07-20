export interface TCMBRate {
  buying: number;
  selling: number;
  code: string;
  name: string;
}

export interface TCMBRatesResult {
  USD: TCMBRate;
  EUR: TCMBRate;
  lastUpdated: string;
  source: 'TCMB' | 'ExchangeRateAPI' | 'Fallback';
}

const FALLBACK_RATES: TCMBRatesResult = {
  USD: { buying: 33.50, selling: 33.65, code: 'USD', name: 'ABD DOLARI' },
  EUR: { buying: 36.40, selling: 36.55, code: 'EUR', name: 'EURO' },
  lastUpdated: new Date().toISOString(),
  source: 'Fallback'
};

// Simple XML parsing helper
function parseTCMBXml(xmlText: string): { USD: TCMBRate; EUR: TCMBRate } | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    
    const parseCurrency = (code: string, fallbackName: string): TCMBRate | null => {
      const node = xmlDoc.querySelector(`Currency[CurrencyCode="${code}"]`);
      if (!node) return null;
      
      const buyingText = node.querySelector('ForexBuying')?.textContent;
      const sellingText = node.querySelector('ForexSelling')?.textContent;
      const name = node.querySelector('Isim')?.textContent || fallbackName;
      
      const buying = parseFloat(buyingText || '0');
      const selling = parseFloat(sellingText || '0');
      
      if (buying > 0 && selling > 0) {
        return { buying, selling, code, name };
      }
      return null;
    };
    
    const usd = parseCurrency('USD', 'ABD DOLARI');
    const eur = parseCurrency('EUR', 'EURO');
    
    if (usd && eur) {
      return { USD: usd, EUR: eur };
    }
  } catch (err) {
    console.error('TCMB XML Parse Error:', err);
  }
  return null;
}

export async function fetchTCMBRates(forceRefresh: boolean = false): Promise<TCMBRatesResult> {
  // Check localStorage Cache first
  if (!forceRefresh) {
    const cached = localStorage.getItem('storm_tcmb_rates_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as TCMBRatesResult;
        const cacheDate = new Date(parsed.lastUpdated);
        const now = new Date();
        // If same calendar day, return cache
        if (cacheDate.toDateString() === now.toDateString()) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse cached rates:', e);
      }
    }
  }

  // Attempt 1: Fetch TCMB directly through a secure CORS proxy
  try {
    const tcmbUrl = 'https://www.tcmb.gov.tr/kurlar/today.xml';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(tcmbUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const xmlText = await response.text();
      const parsed = parseTCMBXml(xmlText);
      if (parsed) {
        const result: TCMBRatesResult = {
          USD: parsed.USD,
          EUR: parsed.EUR,
          lastUpdated: new Date().toISOString(),
          source: 'TCMB'
        };
        localStorage.setItem('storm_tcmb_rates_cache', JSON.stringify(result));
        return result;
      }
    }
  } catch (error) {
    console.warn('TCMB Direct Proxy fetch failed, trying alternate API:', error);
  }

  // Attempt 2: Fetch ExchangeRateAPI as a reliable alternative
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/TRY');
    if (response.ok) {
      const data = await response.json();
      if (data && data.rates) {
        // ExchangeRateAPI base is TRY. rates.USD is e.g. 0.0298. To get 1 USD in TRY, we do 1 / rates.USD.
        const usdRate = 1 / data.rates.USD;
        const eurRate = 1 / data.rates.EUR;
        
        if (usdRate > 0 && eurRate > 0) {
          const result: TCMBRatesResult = {
            USD: { buying: Number((usdRate - 0.05).toFixed(4)), selling: Number((usdRate + 0.05).toFixed(4)), code: 'USD', name: 'ABD DOLARI (ER-API)' },
            EUR: { buying: Number((eurRate - 0.05).toFixed(4)), selling: Number((eurRate + 0.05).toFixed(4)), code: 'EUR', name: 'EURO (ER-API)' },
            lastUpdated: new Date().toISOString(),
            source: 'ExchangeRateAPI'
          };
          localStorage.setItem('storm_tcmb_rates_cache', JSON.stringify(result));
          return result;
        }
      }
    }
  } catch (error) {
    console.error('Alternate ExchangeRateAPI fetch failed:', error);
  }

  // Attempt 3: Fetch static daily-updated rates or fallback to previous cache
  const cached = localStorage.getItem('storm_tcmb_rates_cache');
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as TCMBRatesResult;
      // return cached rates but update timestamp slightly to avoid constant fetching
      return {
        ...parsed,
        source: 'Fallback' // Indicate it's fallback cache
      };
    } catch (e) {}
  }

  return FALLBACK_RATES;
}

export function calculateExchangeRate(rates: TCMBRatesResult, from: string, to: string): number {
  if (from === to) return 1;
  
  const getTryRate = (cur: string) => {
    if (cur === 'TRY') return 1;
    if (cur === 'USD') return rates.USD.buying;
    if (cur === 'EUR') return rates.EUR.buying;
    return 1;
  };
  
  const fromInTry = getTryRate(from);
  const toInTry = getTryRate(to);
  
  // 1 from = (fromInTry / toInTry) to
  return Number((fromInTry / toInTry).toFixed(6));
}
