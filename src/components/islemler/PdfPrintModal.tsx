import { DefaultTemplate } from './print-templates/DefaultTemplate';
import { CorporateTemplate } from './print-templates/CorporateTemplate';
import { ModernTemplate } from './print-templates/ModernTemplate';
import { ElegantTemplate } from './print-templates/ElegantTemplate';
import { ClassicTemplate } from './print-templates/ClassicTemplate';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, Cari } from '../../types';
import { X, Search, FileText, CreditCard, Wallet, AlertCircle, Check, Printer, Download, Settings, RefreshCcw, Maximize2, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';

import Barcode from 'react-barcode';
import { Stock } from '../../types';

export interface PdfPrintModalProps {
  transaction: Transaction | null;
  cariler: Cari[];
  stoklar: Stock[];
  onClose: () => void;
}

export function PdfPrintModal({ transaction, cariler, stoklar, onClose }: PdfPrintModalProps) {
  // Print PDF Receipt states
    const [isPrintReady, setIsPrintReady] = useState(false);
  const [selectedTemplateIdForPrint, setSelectedTemplateIdForPrint] = useState<string | null>(null);
  const [printPageSize, setPrintPageSize] = useState<string>('a4');
  const [previewScale, setPreviewScale] = useState<number>(0.6);
  const [isPdfDownloading, setIsPdfDownloading] = useState(false);

  // Load print settings from localStorage
  const printSettings = useMemo(() => {
    const DEFAULT_PRINT_SETTINGS = {
      companyName: 'Firma Adı',
      companyAddress: 'Firma Adresi',
      companyPhone: '0555 555 55 55',
      logoType: 'text' as 'text' | 'image',
      logoImageUrl: '',
    };
    const saved = localStorage.getItem('storm_muhasebe_print_settings');
    if (saved) {
      try {
        return { ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return DEFAULT_PRINT_SETTINGS;
  }, [transaction]); // Recalculate when print modal opens

  const printTemplates = useMemo(() => {
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => {
            if (!t || !t.id || !t.name) return false;
            const idLower = t.id.toLowerCase();
            const nameLower = t.name.toLowerCase();
            const isDefault = idLower.startsWith('default') || idLower.includes('default');
            const isStandart = nameLower.includes('standart') || 
                               nameLower.includes('teklif formu') || 
                               nameLower.includes('barkod etiketi') || 
                               nameLower.includes('bilgi fişi') || 
                               nameLower.includes('termal fiş');
            return !(isDefault || isStandart);
          });
        }
      } catch (e) {}
    }
    return [];
  }, [transaction]);

  const activeTemplate = useMemo(() => {
    if (!transaction) return null;

    if (selectedTemplateIdForPrint) {
      const manualMatch = printTemplates.find((t: any) => t.id === selectedTemplateIdForPrint);
      if (manualMatch) return manualMatch;
    }

    const islem = transaction;
    
    let templateType = 'satis';
    if (islem.type === 'sale_return' || islem.type === 'purchase_return') templateType = 'iade';
    else if (islem.type === 'purchase') templateType = 'alis';
    
    // Find matching template by type
    const matchingTemplates = printTemplates.filter((t: any) => t.type === templateType);
    if (matchingTemplates.length > 0) {
      if (!selectedTemplateIdForPrint) {
         // Optionally we could set it, but we can just use the match
      }
      return matchingTemplates[0];
    }
    
    // Fallback if no template of that type
    if (printTemplates.length > 0) return printTemplates[0];
    
    // System fallback
    return {
      name: 'Default',
      type: templateType,
      documentTitle: (islem.type === 'sale_return' || islem.type === 'purchase_return') ? 'İADE BELGESİ' : (islem.type === 'purchase' ? 'ALIŞ NOTU' : 'SATIŞ NOTU'),
      paperSize: 'a4',
      showLogo: true,
      showCompanyAddress: true,
      showValidityDate: false,
      showFooter: true,
      showCustomerBalance: true,
      showProductImage: false,
      showDiscountRate: true,
      showExVatAmount: true,
      showVatRate: true,
      showUnitPrice: true,
    };
  }, [transaction, printTemplates, selectedTemplateIdForPrint]);

  // Reset selected template when closing modal
  useEffect(() => {
    if (!transaction) {
      setSelectedTemplateIdForPrint(null);
      setIsPrintReady(false);
    } else {
      // Simulate data fetching / DOM rendering stabilization delay
      const timer = setTimeout(() => setIsPrintReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [transaction]);

  const dynamicPrintVars = useMemo(() => {
    if (!transaction) return null;
    if (!activeTemplate) return null;
    const islem = transaction;

    let title = activeTemplate.documentTitle || 'BELGE';
    let notes = islem.description || '';
    let showBalance = activeTemplate.showCustomerBalance;
    
    if (islem.type === 'collection') {
      title = 'TAHSİLAT MAKBUZU';
    } else if (islem.type === 'payment') {
      title = 'ÖDEME MAKBUZU';
    }

    return { title, notes, showBalance };
  }, [transaction, activeTemplate]);

  useEffect(() => {
    if (activeTemplate) {
      setPrintPageSize(activeTemplate.paperSize || 'a4');
    }
  }, [activeTemplate]);

  useEffect(() => {
    if (printPageSize === 'a4' || printPageSize === 'a4_yatay') {
      setPreviewScale(0.6);
    } else if (printPageSize === 'a5' || printPageSize === 'a5_yatay') {
      setPreviewScale(0.85);
    } else {
      setPreviewScale(1);
    }
  }, [printPageSize]);


  if (!transaction) return null;


        if (!transaction || !activeTemplate || !dynamicPrintVars) {
           return (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="flex flex-col justify-center items-center gap-3">
                  <div className="w-8 h-8 border-4 border-teal-500/30 border-t-teal-500 rounded-full animate-spin"></div>
                  <div className="text-white text-xs tracking-widest uppercase font-bold">Veriler Yükleniyor...</div>
                </div>
             </div>
           );
        }

        const currentCariForPrint = cariler.find(c => c.id === transaction.cariId);
        
        const getCurrencySymbol = (cur: string) => {
          if (cur === 'USD') return '$';
          if (cur === 'EUR') return '€';
          return '₺';
        };

        const formatPrintCurrency = (amount: number, currency: string) => {
          const symbol = getCurrencySymbol(currency);
          const formattedVal = new Intl.NumberFormat('tr-TR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(amount);
          
          return `${symbol} ${formattedVal}`;
        };

        const convertNumberToWords = (num: number, currencyCode: string = 'TRY') => {
          const ones = ['', 'BİR', 'İKİ', 'ÜÇ', 'DÖRT', 'BEŞ', 'ALTI', 'YEDİ', 'SEKİZ', 'DOKUZ'];
          const tens = ['', 'ON', 'YİRMİ', 'OTUZ', 'KIRK', 'ELLİ', 'ALTMIŞ', 'YETMİŞ', 'SEKSEN', 'DOKSAN'];
          const hundreds = ['', 'YÜZ', 'İKİYÜZ', 'ÜÇYÜZ', 'DÖRTYÜZ', 'BEŞYÜZ', 'ALTIYÜZ', 'YEDİYÜZ', 'SEKİZYÜZ', 'DOKUZYÜZ'];
          const thousands = ['', 'BİN', 'MİLYON', 'MİLYAR', 'TRİLYON'];

          const formatGroup = (n: number) => {
            let s = '';
            const h = Math.floor(n / 100);
            const t = Math.floor((n % 100) / 10);
            const o = n % 10;
            if (h > 0) {
              s += h === 1 ? 'YÜZ' : hundreds[h];
            }
            if (t > 0) s += tens[t];
            if (o > 0) s += ones[o];
            return s;
          };

          const intPart = Math.floor(num);
          const fracPart = Math.round((num - intPart) * 100);

          let intStr = '';
          if (intPart === 0) {
            intStr = 'SIFIR';
          } else {
            let temp = intPart;
            let groupIdx = 0;
            while (temp > 0) {
              const group = temp % 1000;
              if (group > 0) {
                let groupWord = formatGroup(group);
                if (groupIdx === 1 && group === 1) {
                  groupWord = '';
                }
                intStr = groupWord + thousands[groupIdx] + intStr;
              }
              temp = Math.floor(temp / 1000);
              groupIdx++;
            }
          }

          let fracStr = '';
          if (fracPart > 0) {
            fracStr = formatGroup(fracPart);
          }

          let currencyUnit = 'TL';
          let subUnit = 'Kr.';
          if (currencyCode === 'USD') {
            currencyUnit = 'DOLAR';
            subUnit = 'SNT.';
          } else if (currencyCode === 'EUR') {
            currencyUnit = 'EURO';
            subUnit = 'SNT.';
          }

          return `Yalnız; ${intStr} ${currencyUnit}` + (fracPart > 0 ? ` ${fracStr} ${subUnit}` : ' SIFIR KURUŞ.');
        };

        const transactionTypeTheme = (() => {
          const type = transaction.type;
          if (type === 'purchase') {
            return {
              primary: '#0f766e', // Teal 700
              primaryBg: '#f0fdfa', // Teal 50
              primaryBorder: '#99f6e4', // Teal 200
              accent: '#0d9488', // Teal 600
              textLight: '#0f766e',
              title: 'ALIŞ FATURASI',
              badgeText: 'ALIŞ BELGESİ'
            };
          } else if (type === 'sale_return' || type === 'purchase_return') {
            return {
              primary: '#be123c', // Rose 700
              primaryBg: '#fff1f2', // Rose 50
              primaryBorder: '#fecdd3', // Rose 200
              accent: '#e11d48', // Rose 600
              textLight: '#be123c',
              title: 'İADE FATURASI',
              badgeText: 'İADE BELGESİ'
            };
          } else if (type === 'collection') {
            return {
              primary: '#4338ca', // Indigo 700
              primaryBg: '#eef2ff', // Indigo 50
              primaryBorder: '#c7d2fe', // Indigo 200
              accent: '#4f46e5', // Indigo 600
              textLight: '#4338ca',
              title: 'TAHSİLAT MAKBUZU',
              badgeText: 'FİNANS FİŞİ'
            };
          } else if (type === 'payment') {
            return {
              primary: '#b45309', // Amber 700
              primaryBg: '#fffbeb', // Amber 50
              primaryBorder: '#fde68a', // Amber 200
              accent: '#d97706', // Amber 600
              textLight: '#b45309',
              title: 'ÖDEME MAKBUZU',
              badgeText: 'FİNANS FİŞİ'
            };
          } else {
            // default / sale
            return {
              primary: '#1d4ed8', // Blue 700
              primaryBg: '#eff6ff', // Blue 50
              primaryBorder: '#bfdbfe', // Blue 200
              accent: '#2563eb', // Blue 600
              textLight: '#1d4ed8',
              title: 'SATIŞ FATURASI',
              badgeText: 'SATIŞ BELGESİ'
            };
          }
        })();

        const textScale = activeTemplate?.textSize === 'small' ? 0.85 : activeTemplate?.textSize === 'large' ? 1.15 : 1;

        const kdvBreakdown = (() => {
          if (!transaction || !transaction.items) return [];
          const groups: Record<number, { rate: number; total: number; matrah: number; kdv: number }> = {};
          
          transaction.items.forEach(item => {
            const rate = item.taxRate || 20; // default 20%
            const total = item.total || 0;
            const matrah = total / (1 + rate / 100);
            const kdv = total - matrah;
            
            if (!groups[rate]) {
              groups[rate] = { rate, total: 0, matrah: 0, kdv: 0 };
            }
            groups[rate].total += total;
            groups[rate].matrah += matrah;
            groups[rate].kdv += kdv;
          });
          
          return Object.values(groups);
        })();

        let pageWidth = '210mm';
        let pageHeight = '297mm';
        
        if (printPageSize === 'a4_yatay') {
          pageWidth = '297mm';
          pageHeight = '210mm';
        } else if (printPageSize === 'a5') {
          pageWidth = '148mm';
          pageHeight = '210mm';
        } else if (printPageSize === 'a5_yatay') {
          pageWidth = '210mm';
          pageHeight = '148mm';
        } else if (printPageSize === 'etiket_60x40') {
          pageWidth = '60mm';
          pageHeight = '40mm';
        } else if (printPageSize === 'etiket_80x50') {
          pageWidth = '80mm';
          pageHeight = '50mm';
        } else if (printPageSize === 'etiket_40x30') {
          pageWidth = '40mm';
          pageHeight = '30mm';
        } else if (printPageSize === 'etiket_40x20') {
          pageWidth = '40mm';
          pageHeight = '20mm';
        } else if (printPageSize === 'termal_80') {
          pageWidth = '80mm';
          pageHeight = '300mm'; // termal auto boyutu önizlemede uzun bir kağıt gibi göstersin
        } else if (printPageSize === 'termal_58') {
          pageWidth = '58mm';
          pageHeight = '300mm';
        }

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in print:p-0 print:bg-white print-override">
            {/* Dynamic Style Injection for Native OS Print Page Size removed, using iframe instead */}

            <div className="bg-[#0c0c0c] rounded-xl border border-white/10 max-w-6xl w-full shadow-2xl overflow-hidden flex flex-col h-[90vh] print-override">
              {/* Modal Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <Printer className="text-teal-400 animate-pulse" size={18} />
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">PDF Baskı ve Yazdırma Paneli</h3>
                    <p className="text-white/40 text-[10px] mt-0.5 font-sans">Belgeyi özelleştirin, kağıt boyutunu ölçekleyin ve PDF olarak kaydedin.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => onClose()}
                  className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-all active:scale-90 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Print Panel Body */}
              <div className="flex-1 flex flex-col overflow-hidden bg-[#070707] relative scrollbar-thin p-6 items-center print-override">
                {/* Top Actions: Zoom, Size & Print */}
                <div className="w-full max-w-4xl bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-5 flex items-center justify-between gap-4 text-xs z-10 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-white/60">
                      <Sparkles size={14} className="text-teal-400" />
                      <span className="font-semibold text-[10px] tracking-wider uppercase">Baskı Ön İzleme (%{Math.round(previewScale * 100)})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Template Selector */}
                    {printTemplates.length > 0 && (
                      <div className="flex items-center gap-2 mr-2">
                        <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold hidden md:inline">Şablon:</span>
                        <select
                          value={selectedTemplateIdForPrint || activeTemplate?.id || ''}
                          onChange={(e) => setSelectedTemplateIdForPrint(e.target.value)}
                          className="px-2 py-1 bg-white/5 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
                        >
                          {printTemplates.map((t: any) => (
                            <option key={t.id} value={t.id} className="bg-[#111] text-white">
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    

                    
                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewScale(prev => Math.max(0.3, Number((prev - 0.05).toFixed(2))))}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 text-white rounded transition-all cursor-pointer"
                        title="Küçült"
                      >
                        <ZoomOut size={13} />
                      </button>
                      
                      <input 
                        type="range"
                        min="0.3"
                        max="1.2"
                        step="0.05"
                        value={previewScale}
                        onChange={(e) => setPreviewScale(parseFloat(e.target.value))}
                        className="w-24 accent-teal-500 cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => setPreviewScale(prev => Math.min(1.2, Number((prev + 0.05).toFixed(2))))}
                        className="p-1.5 bg-white/5 border border-white/10 hover:bg-white/10 active:scale-90 text-white rounded transition-all cursor-pointer"
                        title="Büyüt"
                      >
                        <ZoomIn size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreviewScale(printPageSize === 'A4' ? 0.6 : 0.85)}
                        className="px-2.5 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 active:scale-95 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer"
                      >
                        Sığdır
                      </button>
                    </div>
                    
                    <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
                    
                    <button
                      type="button"
                      disabled={!isPrintReady || isPdfDownloading}
                      onClick={async () => {
                        if (!isPrintReady || isPdfDownloading) return;
                        setIsPdfDownloading(true);

                        const printContent = document.getElementById('printable-invoice-content');
                        if (!printContent) {
                          setIsPdfDownloading(false);
                          return;
                        }

                        const originalTransform = printContent.style.transform;
                        // Set scale to 1 for high-fidelity capture
                        printContent.style.transform = 'scale(1)';

                        // Let layout settle for a fraction of a millisecond
                        await new Promise((resolve) => setTimeout(resolve, 80));

                        try {
                          // Get dimensions in mm
                          let pdfFormat: string | [number, number] = 'a4';
                          let isLandscape = false;
                          let pdfWidthMm = 210;
                          let pdfHeightMm = 297;

                          if (printPageSize === 'a4_yatay') {
                            pdfFormat = 'a4';
                            isLandscape = true;
                            pdfWidthMm = 297;
                            pdfHeightMm = 210;
                          } else if (printPageSize === 'a5') {
                            pdfFormat = 'a5';
                            isLandscape = false;
                            pdfWidthMm = 148;
                            pdfHeightMm = 210;
                          } else if (printPageSize === 'a5_yatay') {
                            pdfFormat = 'a5';
                            isLandscape = true;
                            pdfWidthMm = 210;
                            pdfHeightMm = 148;
                          } else if (printPageSize === 'etiket_60x40') {
                            pdfFormat = [60, 40];
                            isLandscape = true;
                            pdfWidthMm = 60;
                            pdfHeightMm = 40;
                          } else if (printPageSize === 'etiket_80x50') {
                            pdfFormat = [80, 50];
                            isLandscape = true;
                            pdfWidthMm = 80;
                            pdfHeightMm = 50;
                          } else if (printPageSize === 'etiket_40x30') {
                            pdfFormat = [40, 30];
                            isLandscape = true;
                            pdfWidthMm = 40;
                            pdfHeightMm = 30;
                          } else if (printPageSize === 'etiket_40x20') {
                            pdfFormat = [40, 20];
                            isLandscape = true;
                            pdfWidthMm = 40;
                            pdfHeightMm = 20;
                          } else if (printPageSize === 'termal_80') {
                            const actualHeightMm = (printContent.scrollHeight / printContent.clientWidth) * 80 || 200;
                            pdfFormat = [80, actualHeightMm];
                            isLandscape = false;
                            pdfWidthMm = 80;
                            pdfHeightMm = actualHeightMm;
                          } else if (printPageSize === 'termal_58') {
                            const actualHeightMm = (printContent.scrollHeight / printContent.clientWidth) * 58 || 180;
                            pdfFormat = [58, actualHeightMm];
                            isLandscape = false;
                            pdfWidthMm = 58;
                            pdfHeightMm = actualHeightMm;
                          }

                          // Generate crisp PNG image
                          const dataUrl = await toPng(printContent, {
                            pixelRatio: 2.5, // High resolution
                            backgroundColor: '#ffffff',
                            style: {
                              transform: 'scale(1)',
                              transformOrigin: 'top left',
                            }
                          });

                          // Reset original transform immediately
                          printContent.style.transform = originalTransform;

                          // Create jsPDF document
                          const doc = new jsPDF({
                            orientation: isLandscape ? 'landscape' : 'portrait',
                            unit: 'mm',
                            format: pdfFormat,
                          });

                          // Add image covering the entire page area
                          doc.addImage(dataUrl, 'PNG', 0, 0, pdfWidthMm, pdfHeightMm);

                          // Save PDF with meaningful name
                          const docName = transaction.invoiceNo 
                            ? `Fatura_${transaction.invoiceNo}`
                            : `Islem_Belgesi_${transaction.id.substring(0, 8)}`;
                          doc.save(`${docName}.pdf`);

                        } catch (err: any) {
                          printContent.style.transform = originalTransform;
                          console.error('PDF İndirme Hatası:', err);

                          // Hata Savunması (try-catch, and Telegram logging)
                          try {
                            const { reportErrorToTelegram } = await import('../../utils/telegramLogger');
                            reportErrorToTelegram(err instanceof Error ? err : new Error(String(err)), 'IslemlerView_DownloadPDF');
                          } catch (logErr) {
                            console.error('Telegram loglama hatası:', logErr);
                          }

                          alert('PDF oluşturulurken bir hata meydana geldi.');
                        } finally {
                          setIsPdfDownloading(false);
                        }
                      }}
                      className={`px-4 py-1.5 ${isPrintReady && !isPdfDownloading ? 'bg-[#151515] hover:bg-[#202020] border border-white/10 text-white cursor-pointer active:scale-95' : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'} text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2`}
                    >
                      {isPdfDownloading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Hazırlanıyor...</span>
                        </>
                      ) : (
                        <>
                          <Download size={14} />
                          <span>PDF İndir</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={!isPrintReady}
                      onClick={() => {
                        if (isPrintReady) {
                          const printContent = document.getElementById('printable-invoice-content');
                          if (printContent) {
                            const iframe = document.createElement('iframe');
                            iframe.style.position = 'fixed';
                            iframe.style.right = '0';
                            iframe.style.bottom = '0';
                            iframe.style.width = '0';
                            iframe.style.height = '0';
                            iframe.style.border = '0';
                            document.body.appendChild(iframe);
                            
                            const iframeDoc = iframe.contentWindow?.document;
                            if (iframeDoc) {
                              const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
                                .map(s => s.outerHTML)
                                .join('\n');
                                
                              const clone = printContent.cloneNode(true) as HTMLElement;
                              clone.style.transform = 'none';
                              clone.style.position = 'static';
                              clone.style.width = '100%';
                              clone.style.height = 'auto';
                              clone.style.minHeight = '0';
                              clone.style.margin = '0';
                              
                              let pageCssSize = 'A4 portrait';
                              
                              if (printPageSize === 'a4_yatay') {
                                pageCssSize = 'A4 landscape';
                              } else if (printPageSize === 'a5') {
                                pageCssSize = 'A5 portrait';
                              } else if (printPageSize === 'a5_yatay') {
                                pageCssSize = 'A5 landscape';
                              } else if (printPageSize === 'etiket_60x40') {
                                pageCssSize = '60mm 40mm';
                              } else if (printPageSize === 'etiket_80x50') {
                                pageCssSize = '80mm 50mm';
                              } else if (printPageSize === 'etiket_40x30') {
                                pageCssSize = '40mm 30mm';
                              } else if (printPageSize === 'etiket_40x20') {
                                pageCssSize = '40mm 20mm';
                              } else if (printPageSize === 'termal_80') {
                                pageCssSize = '80mm auto';
                              } else if (printPageSize === 'termal_58') {
                                pageCssSize = '58mm auto';
                              }
                              
                              iframeDoc.open();
                              iframeDoc.write(`
                                <html>
                                  <head>
                                    ${styles}
                                    <style>
                                      @page { size: ${pageCssSize}; margin: 0; }
                                      body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                                    </style>
                                  </head>
                                  <body>
                                    ${clone.outerHTML}
                                  </body>
                                </html>
                              `);
                              iframeDoc.close();
                              
                              iframe.onload = () => {
                                setTimeout(() => {
                                  iframe.contentWindow?.focus();
                                  iframe.contentWindow?.print();
                                  setTimeout(() => {
                                    if (document.body.contains(iframe)) {
                                      document.body.removeChild(iframe);
                                    }
                                  }, 1000);
                                }, 250);
                              };
                            }
                          } else {
                            setTimeout(() => {
                              window.print();
                            }, 150);
                          }
                        }
                      }}
                      className={`px-4 py-1.5 \${isPrintReady ? 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/20 shadow-lg cursor-pointer active:scale-95 text-black' : 'bg-zinc-600 text-zinc-400 cursor-not-allowed'} text-[10px] font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2`}
                    >
                      <Printer size={14} />
                      {isPrintReady ? 'Yazdır' : 'Bekleyin...'}
                    </button>
                  </div>
                </div>

                {/* Visual container designed to wrap the physical page exactly at scale S */}
                  <div 
                    className="shadow-2xl border border-zinc-800 bg-white rounded-xs overflow-hidden relative transition-all duration-300 ease-out print-override"
                    style={{
                      width: `calc(${pageWidth} * ${previewScale})`,
                      height: `calc(${pageHeight} * ${previewScale})`,
                    }}
                  >
                    {/* The physical paper layout container */}
                    <div 
                      id="printable-invoice-content"
                      className="bg-white text-black font-sans select-none print-paper-sheet"
                      style={{
                        width: pageWidth,
                        minHeight: pageHeight, // Slightly smaller to prevent A5 page bleed
                        padding: printPageSize.includes('etiket') ? '5mm' : printPageSize.includes('termal') ? '5mm' : '15mm',
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        boxSizing: 'border-box',
                      }}
                    >
                      <div style={{ zoom: textScale }} className="w-full">
                        {printPageSize.startsWith('termal_') ? (
                          /* PREMIUM CORPORATE THERMAL RECEIPT (FİŞ) LAYOUT */
                          <div className="w-full font-mono text-[10px] leading-tight text-zinc-900 flex flex-col items-stretch pr-2 select-none">
                            {/* Header Section */}
                            <div className="text-center flex flex-col items-center">
                              {activeTemplate?.showLogo !== false && (
                                <div className="mb-1.5">
                                  {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                    <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[150px] object-contain mx-auto" referrerPolicy="no-referrer" />
                                  ) : (
                                    <h2 className="text-sm font-black tracking-tight uppercase text-zinc-950 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                  )}
                                </div>
                              )}
                              {activeTemplate?.showCompanyAddress !== false && (
                                <div className="text-[8px] text-zinc-600 leading-tight whitespace-pre-line max-w-[200px] mx-auto">
                                  {activeTemplate?.showLogo === false && <strong className="text-[9px] text-zinc-900 block mb-0.5">{printSettings.companyName}</strong>}
                                  <p>{printSettings.companyAddress}</p>
                                  <p className="mt-0.5 font-bold">TEL: {printSettings.companyPhone}</p>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Receipt Subtitle */}
                            <div className="text-center font-black text-[11px] uppercase tracking-wider text-zinc-900 mb-0.5">
                              *** {dynamicPrintVars?.title || 'BİLGİ FİŞİ'} ***
                            </div>
                            <div className="text-center text-[7px] font-bold tracking-wider text-zinc-500 mb-1">
                              * * * M A L İ   D E Ğ E R İ   Y O K T U R * * *
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Metadata Section */}
                            <div className="space-y-0.5 text-[9px] font-mono text-zinc-700">
                              <div className="flex justify-between">
                                <span className="font-bold">TARİH:</span>
                                <span>{transaction.date}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-bold">FİŞ NO / BELGE SERİ:</span>
                                <span>{transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</span>
                              </div>
                              <div className="flex justify-between items-start gap-1">
                                <span className="font-bold shrink-0">SAYIN CARİ:</span>
                                <span className="font-semibold text-zinc-900 text-right break-words uppercase">{transaction.cariName}</span>
                              </div>
                              {currentCariForPrint && (currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                <div className="flex justify-between text-[8px] text-zinc-500">
                                  <span>V.D. / NO:</span>
                                  <span>{currentCariForPrint.taxOffice || 'BİLİNMİYOR'} / {currentCariForPrint.taxNo || 'NO-YOK'}</span>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1 text-[9px] tracking-tighter">
                              ------------------------------------------------
                            </div>

                            {/* Items Section */}
                            <div className="space-y-1.5 py-1">
                              <div className="flex justify-between text-[9px] font-bold text-zinc-900 border-b border-dashed border-zinc-300 pb-0.5">
                                <span>ÜRÜN / HİZMET ADI</span>
                                <span>TUTAR</span>
                              </div>
                              {transaction.items && transaction.items.length > 0 ? (
                                transaction.items.map((item, idx) => (
                                  <div key={idx} className="flex flex-col">
                                    <span className="font-bold text-[9px] text-zinc-900 uppercase break-words">{item.stockName}</span>
                                    <div className="flex justify-between text-[9px] text-zinc-600 mt-0.5 font-mono">
                                      <span>{item.quantity} {item.unit || 'Adet'} x {formatPrintCurrency(item.price, transaction.currency || 'TRY')}</span>
                                      <span className="font-bold text-zinc-900 font-mono">{formatPrintCurrency(item.total, transaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                /* Fallback Collection/Payment */
                                <div className="flex flex-col">
                                  <span className="font-bold text-[9px] text-zinc-900 uppercase">
                                    {transaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                  </span>
                                  <span className="text-[8px] text-zinc-500 leading-tight mt-0.5 whitespace-pre-line">{transaction.description || 'Cari hesaba yansıtılan finans hareketi.'}</span>
                                  <div className="flex justify-between text-[9px] text-zinc-600 mt-1 font-mono">
                                    <span>1 Adet x {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                    <span className="font-bold text-zinc-900 font-mono">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Separator */}
                            <div className="text-zinc-400 font-mono text-center select-none my-1.5 text-[9px] tracking-tighter">
                              ================================================
                            </div>

                            {/* Totals Section */}
                            <div className="space-y-1 font-mono">
                              <div className="flex justify-between text-[11px] font-black text-zinc-950 py-1 border-y border-dashed border-zinc-400">
                                <span>GENEL TOPLAM</span>
                                <span className="text-[11px]">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                              </div>

                              {/* KDV Breakdown */}
                              {kdvBreakdown.length > 0 && (
                                <div className="text-[8px] text-zinc-500 pt-1 space-y-0.5 border-b border-dashed border-zinc-200 pb-1">
                                  <div className="flex justify-between font-bold text-zinc-600">
                                    <span>KDV GRUBU</span>
                                    <span>MATRAH</span>
                                    <span>KDV TUTARI</span>
                                  </div>
                                  {kdvBreakdown.map((g, idx) => (
                                    <div key={idx} className="flex justify-between font-mono">
                                      <span>%{g.rate}</span>
                                      <span>{formatPrintCurrency(g.matrah, transaction.currency || 'TRY')}</span>
                                      <span>{formatPrintCurrency(g.kdv, transaction.currency || 'TRY')}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Customer Balance */}
                            {dynamicPrintVars?.showBalance && currentCariForPrint && (
                              <div className="mt-2 text-[8px] text-zinc-700 bg-zinc-50 border border-zinc-200 rounded p-1 flex justify-between font-bold font-mono">
                                <span>GÜNCEL BAKİYE:</span>
                                <span>{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                              </div>
                            )}

                            {/* Descriptions */}
                            {dynamicPrintVars?.notes && activeTemplate?.showFooter !== false && (
                              <div className="mt-1.5 text-[8px] text-zinc-600 border-t border-dashed border-zinc-200 pt-1 font-sans leading-snug">
                                <span className="font-bold text-zinc-800">AÇIKLAMA:</span>
                                <p className="mt-0.5 whitespace-pre-line">{dynamicPrintVars.notes}</p>
                              </div>
                            )}

                            {/* Message & Software Info */}
                            <div className="text-center mt-3.5 space-y-0.5">
                              <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold font-sans">Bizi tercih ettiğiniz için teşekkür ederiz!</div>
                              <div className="text-[7px] text-zinc-400 font-mono">ON MUHASEBE BİLGİ SİSTEMLERİ</div>
                            </div>

                            {/* Barcode representation */}
                            <div className="flex flex-col items-center justify-center mt-3 pt-1.5 border-t border-dashed border-zinc-200 overflow-hidden">
                              <Barcode 
                                value={transaction.invoiceNo || transaction.id || "000000"} 
                                width={1.0} 
                                height={30} 
                                fontSize={7}
                                margin={0}
                                displayValue={true}
                              />
                            </div>
                          </div>
                        ) : (() => {
                          const style = activeTemplate?.designStyle || 'minimal';

                          const printedBankDetails = activeTemplate?.showBankDetails && (
                            <div className="mt-4 border border-zinc-200 bg-zinc-50/50 rounded-lg p-2.5 text-left font-mono text-[8px] text-zinc-600">
                              <span className="font-extrabold text-[9px] text-zinc-800 tracking-wider block mb-1 uppercase font-sans">
                                {activeTemplate.bankDetailsTitle || 'BANKA HESAP BİLGİLERİ'}
                              </span>
                              <div className="whitespace-pre-line leading-relaxed font-mono">
                                {activeTemplate.bankDetailsContent}
                              </div>
                            </div>
                          );

                          const printedSignatureArea = activeTemplate?.showSignatureArea !== false && (
                            <div className="grid grid-cols-2 gap-4 text-center mt-6 pt-4 border-t border-dashed border-zinc-200">
                              <div>
                                <span className="text-[8px] font-bold text-zinc-400 tracking-widest uppercase block mb-8 font-sans">
                                  {activeTemplate?.deliveryDelivererLabel || 'TESLİM EDEN (İMZA)'}
                                </span>
                                <div className="border-t border-dashed border-zinc-200 w-28 mx-auto"></div>
                              </div>
                              <div>
                                <span className="text-[8px] font-bold text-zinc-400 tracking-widest uppercase block mb-8 font-sans">
                                  {activeTemplate?.deliveryReceiverLabel || 'TESLİM ALAN (İMZA)'}
                                </span>
                                <div className="border-t border-dashed border-zinc-200 w-28 mx-auto"></div>
                              </div>
                            </div>
                          );
                          
                          const fullDynamicPrintVars = {
                            ...dynamicPrintVars,
                            transaction,
                            currentCariForPrint,
                            formatPrintCurrency,
                            convertNumberToWords,
                            transactionTypeTheme,
                            printedBankDetails,
                            printedSignatureArea,
                            activeTemplate,
                            stoklar,
                            kdvBreakdown
                          };
                          
                          if (style === 'corporate') return <CorporateTemplate dynamicPrintVars={fullDynamicPrintVars} printSettings={printSettings} />;
                          if (style === 'modern') return <ModernTemplate dynamicPrintVars={fullDynamicPrintVars} printSettings={printSettings} />;
                          if (style === 'elegant') return <ElegantTemplate dynamicPrintVars={fullDynamicPrintVars} printSettings={printSettings} />;
                          if (style === 'classic') return <ClassicTemplate dynamicPrintVars={fullDynamicPrintVars} printSettings={printSettings} />;
                          return <DefaultTemplate dynamicPrintVars={fullDynamicPrintVars} printSettings={printSettings} />;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        );
      
}
