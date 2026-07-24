import * as XLSX from 'xlsx';

export interface ParsedCari {
  name: string;
  phone: string;
  openingBalance: number;
  type: "customer" | "supplier" | "both";
  currency: "TRY" | "USD" | "EUR";
}

export interface ExcelParseResult {
  data: ParsedCari[];
  summary: {
    totalCards: number;
    totalOpeningBalance: number;
  };
  error?: string;
}

export const parseExcelWithAI = async (file: File): Promise<ExcelParseResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: "" });
        
        if (!rawData || rawData.length === 0) {
          throw new Error("Dosya boş veya okunamadı.");
        }

        const sampleRows = rawData.slice(0, 15);
        const geminiApiKey = localStorage.getItem('storm_muhasebe_gemini_api_key');
        
        let mapping: any = null;

        if (geminiApiKey) {
          try {
            const prompt = `Bir muhasebe programına müşteri (cari) excel verisi aktaracağız.
Excel dosyasından çıkarılan ilk 15 satır (iki boyutlu dizi şeklinde) aşağıdadır:

${JSON.stringify(sampleRows)}

Görevlerin şunlardır:
1. "headerRowIndex": Sütun başlıklarının (Ad, Telefon, Bakiye vb.) bulunduğu satırın indeksini (0'dan başlayarak) bul.
2. Sütun indekslerini (0'dan başlayarak) belirle:
  - "nameColumnIndex": Müşteri veya Firma Adı (Zorunlu, Örn: "İsim", "Unvan", "Adı")
  - "phoneColumnIndex": Telefon Numarası
  - "balanceColumnIndex": Bakiye (Tutar)
  - "balanceTypeColumnIndex": Bakiyenin Borç mu Alacak mı olduğunu belirten kolon (B/A, Durum vb.). Yoksa null yap.
  - "currencyColumnIndex": Döviz birimini (TL, USD, EUR vb.) belirten kolon. Eğer döviz birimi bakiye ile aynı kolondaysa veya ayrı bir kolon yoksa null yap.
3. Eğer "balanceTypeColumnIndex" varsa:
  - "debtKeywords": Borç/borçlu anlamına gelen kelimeler.
  - "creditKeywords": Alacak/alacaklı anlamına gelen kelimeler.

ÖNEMLİ: Yalnızca aşağıdaki formatta saf bir JSON objesi döndür, markdown (md) bloğu içine alma, açıklamalar yazma.

{
  "headerRowIndex": 0,
  "nameColumnIndex": 0,
  "phoneColumnIndex": 1,
  "balanceColumnIndex": 2,
  "balanceTypeColumnIndex": null,
  "currencyColumnIndex": null,
  "debtKeywords": ["borç", "borçlu"],
  "creditKeywords": ["alacak", "alacaklı"]
}
`;
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  responseMimeType: "application/json",
                  temperature: 0.1
                }
              })
            });

            if (response.ok) {
              const result = await response.json();
              const text = result.candidates[0].content.parts[0].text;
              mapping = JSON.parse(text);
            }
          } catch (aiError) {
            console.error("AI Eşleştirme hatası:", aiError);
          }
        }

        if (!mapping) {
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(rawData.length, 10); i++) {
            const rowStr = rawData[i].join(' ').toLowerCase();
            if (rowStr.includes('ad') || rowStr.includes('ünvan') || rowStr.includes('isim') || rowStr.includes('bakiye')) {
              headerRowIndex = i;
              break;
            }
          }

          const headerRow = rawData[headerRowIndex].map(h => h ? h.toString().toLowerCase() : '');
          
          mapping = {
            headerRowIndex,
            nameColumnIndex: headerRow.findIndex(h => h.includes('ad') || h.includes('ünvan') || h.includes('isim')),
            phoneColumnIndex: headerRow.findIndex(h => h.includes('tel') || h.includes('cep')),
            balanceColumnIndex: headerRow.findIndex(h => h.includes('bakiye') || h.includes('tutar') || h.includes('alacak')),
            balanceTypeColumnIndex: headerRow.findIndex(h => h === 'b/a' || h.includes('durum') || h === 'ba'),
            currencyColumnIndex: headerRow.findIndex(h => h.includes('döviz') || h.includes('kur') || h.includes('para')),
            debtKeywords: ["borç", "borçlu", "b"],
            creditKeywords: ["alacak", "alacaklı", "a"]
          };
          
          if (mapping.nameColumnIndex === -1) mapping.nameColumnIndex = 0;
          if (mapping.balanceTypeColumnIndex === -1) mapping.balanceTypeColumnIndex = null;
          if (mapping.phoneColumnIndex === -1) mapping.phoneColumnIndex = null;
          if (mapping.currencyColumnIndex === -1) mapping.currencyColumnIndex = null;
          if (mapping.balanceColumnIndex === -1) mapping.balanceColumnIndex = null;
        }

        const parsedData: ParsedCari[] = [];
        let totalOpeningBalance = 0;

        const dataStartIndex = (mapping.headerRowIndex !== undefined ? mapping.headerRowIndex : 0) + 1;

        for (let i = dataStartIndex; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || row.length === 0) continue;

          if (row.filter((cell: any) => cell !== "").length === 0) continue;

          let name = "";
          if (mapping.nameColumnIndex !== null && mapping.nameColumnIndex !== -1 && row[mapping.nameColumnIndex] !== undefined) {
            name = row[mapping.nameColumnIndex].toString().trim();
          }
          
          if (!name || name.toLowerCase().includes('toplam')) continue;
          
          const lowerName = name.toLowerCase();
          if (lowerName.includes('isim/unvan') || lowerName === 'isim' || lowerName === 'unvan' || lowerName === 'cari adı' || lowerName === 'müşteri') continue;
          if (name.match(/^\d{1,2}\.\d{1,2}\.\d{2,4}$/) || name.match(/^\d{1,2}\/\d{1,2}\/\d{2,4}$/)) continue;

          let phone = "";
          if (mapping.phoneColumnIndex !== null && mapping.phoneColumnIndex !== -1 && row[mapping.phoneColumnIndex] !== undefined) {
             phone = row[mapping.phoneColumnIndex].toString().trim();
          }
          
          let rawBalance = 0;
          if (mapping.balanceColumnIndex !== null && mapping.balanceColumnIndex !== -1 && row[mapping.balanceColumnIndex] !== undefined && row[mapping.balanceColumnIndex] !== "") {
            const valStr = row[mapping.balanceColumnIndex].toString().replace(/,/g, '.').replace(/[^0-9.-]/g, '');
            rawBalance = parseFloat(valStr) || 0;
          }

          let multiplier = 1;
          if (mapping.balanceTypeColumnIndex !== null && mapping.balanceTypeColumnIndex !== -1 && row[mapping.balanceTypeColumnIndex] !== undefined && row[mapping.balanceTypeColumnIndex] !== "") {
            const typeStr = row[mapping.balanceTypeColumnIndex].toString().toLowerCase();
            const isDebt = mapping.debtKeywords?.some((k: string) => typeStr.includes(k.toLowerCase()));
            const isCredit = mapping.creditKeywords?.some((k: string) => typeStr.includes(k.toLowerCase()));
            
            if (isCredit) {
              multiplier = -1;
            } else if (isDebt) {
              multiplier = 1;
            }
          }

          const finalBalance = rawBalance * multiplier;
          
          let currency: "TRY" | "USD" | "EUR" = "TRY";
          const rowStr = row.join(' ').toUpperCase();
          if (mapping.currencyColumnIndex !== null && mapping.currencyColumnIndex !== -1 && row[mapping.currencyColumnIndex]) {
             const currStr = row[mapping.currencyColumnIndex].toString().toUpperCase();
             if (currStr.includes('USD') || currStr === '$') currency = 'USD';
             else if (currStr.includes('EUR') || currStr === '€') currency = 'EUR';
             else currency = 'TRY';
          } else {
             if (rowStr.includes('USD') || rowStr.includes('$')) currency = 'USD';
             else if (rowStr.includes('EUR') || rowStr.includes('€') || rowStr.includes('EURO')) currency = 'EUR';
          }

          if (currency === "TRY") {
            totalOpeningBalance += finalBalance;
          }

          parsedData.push({
            name,
            phone,
            openingBalance: finalBalance,
            type: finalBalance < 0 ? "supplier" : (finalBalance > 0 ? "customer" : "both"),
            currency
          });
        }

        resolve({
          data: parsedData,
          summary: {
            totalCards: parsedData.length,
            totalOpeningBalance
          }
        });

      } catch (err: any) {
        reject({ error: err.message || "Bilinmeyen bir hata oluştu." });
      }
    };

    reader.onerror = () => {
      reject({ error: "Dosya okunamadı." });
    };

    reader.readAsArrayBuffer(file);
  });
};
