export const formatCurrency = (val: number, cur: string = 'TRY') => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: cur }).format(val);
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('tr-TR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  }).format(date);
};

export const parseScannedQrCode = (text: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  
  // 1. Try to match "Barkod: <val>"
  const barcodeMatch = trimmed.match(/Barkod:\s*([^\n]+)/i);
  if (barcodeMatch && barcodeMatch[1]) {
    const val = barcodeMatch[1].trim();
    if (val !== '-') return val;
  }
  
  // 2. Try to match "Kod: <val>"
  const codeMatch = trimmed.match(/Kod:\s*([^\n]+)/i);
  if (codeMatch && codeMatch[1]) {
    return codeMatch[1].trim();
  }

  // 3. Try to check if it's a URL and extract the last part
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        return decodeURIComponent(parts[parts.length - 1]);
      }
    }
  } catch (err) {
    // ignore URL parsing errors
  }

  // 4. Fallback: original trimmed text
  return trimmed;
};
