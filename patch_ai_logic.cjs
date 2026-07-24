const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const updatedLogic = `
        if (parsedCommand.tip === 'bilgi' || parsedCommand.tip === 'analiz') {
          setMessages(prev => {
            const arr = [...prev];
            // If replacing audio placeholder
            if (typeof tempUserMessageId !== 'undefined' && arr.find(m => m.id === tempUserMessageId)) {
               return arr.map(m => m.id === tempUserMessageId ? {
                 ...m,
                 text: m.text + "\\n(Analiz/Bilgi cevabı geldi)"
               } : m).concat([{
                  id: Date.now().toString(), 
                  role: 'assistant', 
                  text: parsedCommand.mesaj,
                  chart: parsedCommand.grafik
               }]);
            }
            return [...arr, { 
              id: Date.now().toString(), 
              role: 'assistant', 
              text: parsedCommand.mesaj,
              chart: parsedCommand.grafik
            }];
          });
          setIsTyping(false);
          return;
        }
`;

content = content.replace(/if \(parsedCommand\.tip === 'bilgi'\) \{[\s\S]*?return;\n        \}/g, updatedLogic.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
