const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');
content = content.replace(/import \{ X, Send, Loader2/, "import { X, Send, Loader2, Paperclip, File, FileText, FileSpreadsheet,");
fs.writeFileSync('src/components/AiAssistant.tsx', content);
