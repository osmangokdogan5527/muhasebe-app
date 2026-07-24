const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

content = content.replace(/const messagesEndRef = useRef<HTMLDivElement>\(null\);/, "const messagesEndRef = useRef<HTMLDivElement>(null);\n  const messagesContainerRef = useRef<HTMLDivElement>(null);");

content = content.replace(/messagesEndRef\.current\?\.scrollIntoView\(\{ behavior: 'smooth' \}\);/g, `
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
`);

content = content.replace(/<div className="p-4 h-\[55vh\] max-h-\[350px\] sm:h-\[350px\] sm:max-h-none overflow-y-auto bg-slate-50 flex flex-col gap-3">/, `<div ref={messagesContainerRef} className="p-4 h-[55vh] max-h-[350px] sm:h-[350px] sm:max-h-none overflow-y-auto bg-slate-50 flex flex-col gap-3">`);

fs.writeFileSync('src/components/AiAssistant.tsx', content);
