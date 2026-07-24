const fs = require('fs');
let content = fs.readFileSync('src/components/AiAssistant.tsx', 'utf8');

const updatedUI = `
              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-2">
                {attachedFile && (
                  <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {attachedFile.type === 'excel' ? <FileSpreadsheet size={16} className="text-emerald-600" /> : <FileText size={16} className="text-blue-600" />}
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{attachedFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <form 
                  onSubmit={handleSubmit}
                  className="flex items-center gap-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.txt,.json"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition shrink-0"
                    title="Dosya Ekle (Excel, CSV, TXT)"
                  >
                    <Paperclip size={18} />
                  </button>
                  
                  <input
`;

content = content.replace(/\{\/\* Input Area \*\/\}\s*<div className="p-3 bg-white border-t border-slate-100 flex flex-col">\s*<form\s*onSubmit=\{handleSubmit\}\s*className="flex items-center gap-2"\s*>/m, updatedUI.trim());

fs.writeFileSync('src/components/AiAssistant.tsx', content);
