const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const updatedDataContext = `
      if (financialData) {
        try {
          const safeData = JSON.stringify({
            cariler: financialData.cariler?.slice(0, 100),
            stoklar: financialData.stoklar?.slice(0, 100),
            islemler: financialData.islemler?.slice(0, 100),
            ceksenet: financialData.ceksenet?.slice(0, 100),
            expenses: financialData.expenses?.slice(0, 100),
            bankAccounts: financialData.bankAccounts?.slice(0, 100),
          });
          dataContext = "\\n\\nMevcut Finansal Veriler (JSON Formatında): \\n" + safeData.slice(0, 100000) + "\\n\\nKullanıcı analiz, rapor veya finansal durumla ilgili soru sorarsa bu verilere bakarak cevapla. Eğer soru analiz veya finansal durumla ilgiliyse, 'tip': 'bilgi' yerine 'tip': 'analiz' kullanabilirsin. Eğer uygun bir grafik çizilebiliyorsa (örneğin gider dağılımı, gelir/gider kıyaslaması vb.) şu formatta dön: \\n{ \\"tip\\": \\"analiz\\", \\"mesaj\\": \\"Açıklayıcı metin\\", \\"grafik\\": { \\"tip\\": \\"bar\\" veya \\"pie\\", \\"data\\": [{ \\"name\\": \\"Kategori Adı\\", \\"value\\": 1234 }] } }\\nEğer grafik gerekmiyorsa sadece 'tip': 'bilgi' ve 'mesaj' dön.";
        } catch(e) {}
      }
`;

content = content.replace(/if \(financialData\) \{[\s\S]*?\} catch\(e\) \{\}\n      \}/g, updatedDataContext.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
