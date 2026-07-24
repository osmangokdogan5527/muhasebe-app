const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const newStates = `
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string, type: 'excel' | 'csv' | 'text' | 'json'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'excel' | 'csv' | 'text' | 'json' = 'text';
      let parsedContent = '';

      if (extension === 'xlsx' || extension === 'xls') {
        fileType = 'excel';
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        // Sadece ilk sayfayı alalım
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        parsedContent = JSON.stringify(json, null, 2);
      } else if (extension === 'csv') {
        fileType = 'csv';
        parsedContent = await file.text();
      } else if (extension === 'json') {
        fileType = 'json';
        parsedContent = await file.text();
      } else {
        fileType = 'text';
        parsedContent = await file.text();
      }

      // Max 100kb character limit (roughly 100k chars) to avoid prompt limits
      if (parsedContent.length > 100000) {
        parsedContent = parsedContent.slice(0, 100000) + '... (Devamı kesildi)';
      }

      setAttachedFile({
        name: file.name,
        content: parsedContent,
        type: fileType
      });
      
    } catch (err) {
      console.error("Dosya okunurken hata:", err);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
`;

content = content.replace(/const \[showVoiceGuide, setShowVoiceGuide\] = useState\(false\);/, newStates.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
