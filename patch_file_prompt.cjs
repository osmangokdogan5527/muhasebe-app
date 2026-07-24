const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const updatedSubmit = `
    let finalUserMessage = userMessage;
    if (attachedFile) {
      finalUserMessage += "\\n\\n[KULLANICININ EKLENEN DOSYASI: " + attachedFile.name + "]\\n" + attachedFile.content + "\\n\\nBu eklenen dosyayı yukarıdaki finansal soruyla ilişkilendirerek incele veya sorulan soruyu bu dosya verisine göre yanıtla.";
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setIsTyping(true);
    
    // Clear the attached file after sending
    setAttachedFile(null);
`;

content = content.replace(/setMessages\(prev => \[\.\.\.prev, \{ id: Date\.now\(\)\.toString\(\), role: 'user', text: userMessage \}\]\);\n    setIsTyping\(true\);/g, updatedSubmit.trim());
content = content.replace(/contents: \[\{ parts: \[\{ text: userMessage \}\] \}\]/g, "contents: [{ parts: [{ text: finalUserMessage }] }]");

fs.writeFileSync('src/components/AiAssistant.tsx', content);
