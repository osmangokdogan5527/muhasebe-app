const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

if (!content.includes('recharts')) {
  content = content.replace(
    /import \{ .*? \} from 'lucide-react';/, 
    "import { X, Send, Loader2, Sparkles, AlertCircle, Settings, Bot, Mic, HelpCircle, Sliders, BookOpen, ChevronRight, Check } from 'lucide-react';\nimport { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';"
  );
  fs.writeFileSync('src/components/AiAssistant.tsx', content);
}
