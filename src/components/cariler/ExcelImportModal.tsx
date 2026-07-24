import React, { useState, useCallback } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { parseExcelWithAI, ParsedCari, ExcelParseResult } from '../../utils/aiExcelParser';
import { saveCari, createTransaction } from '../../firebase';
import { Cari } from '../../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  showToast
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls') && !file.name.endsWith('.csv')) {
      showToast('Lütfen geçerli bir Excel veya CSV dosyası yükleyin.', 'error');
      return;
    }

    setIsProcessing(true);
    setParseResult(null);

    try {
      const result = await parseExcelWithAI(file);
      setParseResult(result);
    } catch (err: any) {
      showToast(err.error || 'Dosya işlenirken bir hata oluştu.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirm = async () => {
    if (!parseResult || !parseResult.data.length) return;

    setIsSaving(true);
    try {
      let successCount = 0;
      for (const item of parseResult.data) {
        const cariId = `cari_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const code = `CR-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        const newCari: Cari = {
          id: cariId,
          name: item.name,
          code,
          type: item.type,
          phone: item.phone,
          email: '',
          address: '',
          balance: 0, // Transaction will add the balance
          openingBalance: item.openingBalance,
          createdAt: new Date().toISOString(),
          isActive: true,
          currency: item.currency || 'TRY'
        };

        const savedCariId = await saveCari(newCari, cariId);
        newCari.id = savedCariId;

        // Create opening balance transaction if not zero
        if (item.openingBalance !== 0) {
          const transId = `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await createTransaction({
            id: transId,
            type: item.openingBalance > 0 ? "sale" : "purchase", // representation of opening balance
            cariId: newCari.id,
            cariName: newCari.name,
            date: new Date().toISOString().split('T')[0],
            amount: Math.abs(item.openingBalance),
            account: "", // Unpaid/Opening balance
            description: "Açılış Bakiyesi",
            createdAt: new Date().toISOString(),
            currency: item.currency || "TRY"
          });
        }
        successCount++;
      }

      showToast(`${successCount} cari hesap başarıyla içeri aktarıldı.`, 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(`Aktarım sırasında hata oluştu: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Akıllı Excel Aktarımı</h2>
              <p className="text-sm text-slate-500">Müşteri verilerinizi yapay zeka ile otomatik eşleştirin</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!parseResult && !isProcessing && (
            <div 
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-colors ${
                isDragging ? 'border-teal-500 bg-teal-50/50' : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-500">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Dosyanızı buraya sürükleyin</h3>
              <p className="text-slate-500 text-center mb-6 max-w-sm">
                .xlsx veya .csv formatındaki müşteri listenizi yükleyin. Yapay zeka kolonları otomatik tanıyacaktır.
              </p>
              
              <label className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer transition-colors shadow-sm">
                Dosya Seç
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange} 
                />
              </label>
            </div>
          )}

          {isProcessing && (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
                <FileSpreadsheet size={24} className="absolute inset-0 m-auto text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Yapay Zeka Verileri Analiz Ediyor...</h3>
              <p className="text-slate-500">Sütunlar eşleştiriliyor ve bakiyeler hesaplanıyor.</p>
            </div>
          )}

          {parseResult && !isProcessing && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600 shrink-0">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-teal-900 mb-1">Analiz Tamamlandı</h4>
                  <p className="text-teal-700 text-sm">
                    Yapay zeka dosyanızı inceledi. <strong>{parseResult.summary.totalCards}</strong> Cari Kart tespit edildi. Onaylıyor musunuz?
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 font-semibold text-sm text-slate-600 grid grid-cols-12 gap-4">
                  <div className="col-span-5">Cari Adı</div>
                  <div className="col-span-4">Telefon</div>
                  <div className="col-span-3 text-right">Açılış Bakiyesi</div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {parseResult.data.slice(0, 50).map((row, i) => (
                    <div key={i} className="px-4 py-3 border-b border-slate-100 text-sm text-slate-700 grid grid-cols-12 gap-4 hover:bg-slate-50">
                      <div className="col-span-5 font-medium truncate">{row.name}</div>
                      <div className="col-span-4 truncate">{row.phone || '-'}</div>
                      <div className={`col-span-3 text-right font-medium ${
                        row.openingBalance > 0 ? 'text-teal-600' : 
                        row.openingBalance < 0 ? 'text-red-600' : 'text-slate-500'
                      }`}>
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: row.currency || 'TRY' }).format(row.openingBalance)}
                      </div>
                    </div>
                  ))}
                  {parseResult.data.length > 50 && (
                    <div className="px-4 py-3 text-center text-sm text-slate-500 italic bg-slate-50">
                      ... ve {parseResult.data.length - 50} kayıt daha
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={() => {
              if (parseResult && !isSaving) {
                setParseResult(null);
              } else {
                onClose();
              }
            }}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            {parseResult ? 'İptal ve Geri Dön' : 'Vazgeç'}
          </button>
          
          <button 
            onClick={handleConfirm}
            disabled={!parseResult || isSaving}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              !parseResult || isSaving
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                İçe Aktarılıyor...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Verileri Onayla ve Aktar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
