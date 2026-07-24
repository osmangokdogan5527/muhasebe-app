const fs = require('fs');
let content = fs.readFileSync('src/components/CarilerView.tsx', 'utf8');

const modalMarker = '{/* Add / Edit Cari Modal */}';
const newModal = `{/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={() => setIsExcelImportModalOpen(false)}
        showToast={showToast}
      />

      {/* Add / Edit Cari Modal */}`;
content = content.replace(modalMarker, newModal);

fs.writeFileSync('src/components/CarilerView.tsx', content);
