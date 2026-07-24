const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const contextCode = `
      let dataContext = '';
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
          dataContext = "\n\nMevcut Finansal Veriler (JSON Formatında): \n" + safeData.slice(0, 100000) + "\n\nKullanıcı analiz, rapor veya finansal durumla ilgili soru sorarsa bu verilere bakarak cevapla. Eğer soru finansal durumla ilgiliyse, 'tip': 'bilgi' formatında bir JSON döndür ve 'mesaj' kısmına analizi/cevabı yaz. Markdown kullanma, verileri okunabilir bir metin olarak biçimlendirebilirsin.";
        } catch(e) {}
      }
`;

content = content.replace(/let securityGuideline = '';/g, `${contextCode}\n      let securityGuideline = '';`);

// We also need to append ${dataContext} to the prompt parts text
content = content.replace(/Bugünün tarihi: \$\{today\}\.\$\{securityGuideline\}/g, `Bugünün tarihi: \${today}.\${securityGuideline}\${dataContext}`);

fs.writeFileSync('src/components/AiAssistant.tsx', content);
