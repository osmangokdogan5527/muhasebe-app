const fs = require('fs');
let content = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');

// 1. Import FileSpreadsheet
if (!content.includes('FileSpreadsheet')) {
  content = content.replace('Plus,', 'Plus,\n  FileSpreadsheet,');
}

// 2. Import ExcelImportModal
if (!content.includes('ExcelImportModal')) {
  content = content.replace("import { CariModal } from './cariler/CariModal';", "import { CariModal } from './cariler/CariModal';\nimport { ExcelImportModal } from './cariler/ExcelImportModal';");
}

// 3. Add state
const stateMarker = 'const [deleteConfirmCari, setDeleteConfirmCari] = useState<Cari | null>(null);';
if (!content.includes('const [isExcelImportModalOpen')) {
  content = content.replace(stateMarker, stateMarker + '\n  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);');
}

// 4. Add Button
const btnPattern = `<button
          id="btn-add-cari"`;
const newBtns = `<div className="flex gap-2">
          <button
            onClick={() => setIsExcelImportModalOpen(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold uppercase tracking-wider px-4 py-3 rounded-lg transition duration-150 border border-white/10"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel Aktarım</span>
          </button>
          <button
            id="btn-add-cari"`;
content = content.replace(btnPattern, newBtns);

// close the div
content = content.replace(`          <span>Yeni Cari Hesap Ekle</span>
        </button>
      </div>`, `          <span>Yeni Cari Hesap Ekle</span>
        </button>
        </div>
      </div>`);

// 5. Render Modal
const modalMarker = '{/* Create/Edit Modal */}';
const newModal = `{/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={() => setIsExcelImportModalOpen(false)}
        showToast={showToast}
      />

      {/* Create/Edit Modal */}`;
content = content.replace(modalMarker, newModal);

fs.writeFileSync('src/components/CarilerView.tsx', content);
