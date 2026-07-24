const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const updatedMessageInterface = `
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  chart?: {
    tip: 'bar' | 'pie';
    data: any[];
  };
}
`;

content = content.replace(/interface Message \{[\s\S]*?\n\}/g, updatedMessageInterface.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
