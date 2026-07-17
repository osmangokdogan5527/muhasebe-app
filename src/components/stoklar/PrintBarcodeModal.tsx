import React, { useState, useEffect } from 'react';
import { Stock } from '../../types';
import { X, Printer, Settings, Layers, Download } from 'lucide-react';
import Barcode from 'react-barcode';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { QrCodeImage } from '../templatedesigner/QrCodeImage';

export interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  printingStock: Stock | null;
}

export function PrintBarcodeModal({ isOpen, onClose, printingStock }: PrintBarcodeModalProps) {
  const [printTemplates, setPrintTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  useEffect(() => {
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter((t: any) => {
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
          const barcodeTemplates = filtered.filter((t: any) => t.type === 'barkod');
          setPrintTemplates(barcodeTemplates);
          if (barcodeTemplates.length > 0) {
            setSelectedTemplateId(barcodeTemplates[0].id);
          }
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!printingStock || !selectedTemplateId || !isOpen) return;
    
    setTimeout(() => {
      const svgs = document.querySelectorAll('.print-preview-container svg');
      svgs.forEach(svg => {
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.querySelectorAll('*').forEach(child => {
          child.setAttribute('vector-effect', 'non-scaling-stroke');
        });
      });
    }, 100);
  }, [printingStock, selectedTemplateId, isOpen]);


  if (!isOpen || !printingStock) return null;

  return (
    <>
{/* Print Barcode Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-[#0c0c0c] rounded-lg border border-white/10 max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/95">
                Barkod Yazdır: {printingStock.name}
              </h3>
              <button 
                onClick={() => onClose()}
                className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded transition"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-4">
              {printTemplates.length === 0 ? (
                <div className="text-center p-4 border border-white/10 rounded bg-white/5">
                  <p className="text-xs text-white/60 mb-2">Henüz bir barkod şablonu oluşturmadınız.</p>
                  <p className="text-[10px] text-white/40">Sol menüdeki <b>Ayarlar &gt; Baskı &amp; Şablon Tasarımcısı</b> bölümünden yeni bir barkod şablonu ekleyebilirsiniz.</p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-semibold text-white/40 uppercase tracking-widest mb-1.5 font-mono">Şablon Seçin</label>
                    <select 
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 text-white rounded text-xs focus:outline-hidden focus:border-teal-500"
                    >
                      {printTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.paperSize})</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Preview Area */}
                  <div className="mt-4 p-4 bg-white rounded-lg flex flex-col items-center justify-center text-black overflow-hidden relative">
                    {(() => {
                      const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
                      if (!t) return null;
                      
                      const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
                      const is40x20 = t.paperSize === 'etiket_40x20';
                      const is60x40 = t.paperSize === 'etiket_60x40';
                      const is40x60 = t.paperSize === 'etiket_40x60';
                      const is80x50 = t.paperSize === 'etiket_80x50';
                      const isOzel = t.paperSize === 'etiket_ozel';
                      
                      let w = 151; // 40mm scaled to pixels for rendering
                      let h = 113; // 30mm
                      if (isOzel) {
                        w = (t.customWidthCm || 6) * 37.8;
                        h = (t.customHeightCm || 4) * 37.8;
                      } else if (is60x40) { w = 226; h = 151; }
                      else if (is40x60) { w = 151; h = 226; }
                      else if (is80x50) { w = 302; h = 189; }
                      else if (is40x20) { w = 151; h = 75; }
                      
                      let bcWidth = 1;
                      let bcHeight = 40;
                      let bcFontSize = 10;
                      if (is40x20) { bcWidth = 1; bcHeight = 30; bcFontSize = 8; }
                      if (is60x40 || is80x50) { bcWidth = 2; bcHeight = 50; bcFontSize = 12; }
                      
                      const imgSize = (t.barcodeImageSize || 64) * 0.5;
                      const imgEl = (t.showImage && printingStock.imageUrl) ? (
                        <img 
                          key="img"
                          src={printingStock.imageUrl} 
                          alt="Ürün Resmi" 
                          className="object-cover rounded filter grayscale"
                          style={{ 
                            width: `${imgSize}px`, 
                            height: `${imgSize}px`,
                            WebkitFilter: 'grayscale(100%)', 
                            mixBlendMode: 'multiply' 
                          }}
                        />
                      ) : null;
                      
                      const nameEl = t.showBarcodeName !== false ? (
                        <div 
                          key="name" 
                          className="font-bold whitespace-nowrap px-1 text-black"
                          style={{
                            fontSize: t.barcodeNameSize ? `${t.barcodeNameSize * 0.5}px` : (is60x40 || is80x50 ? '12px' : '10px'),
                          }}
                        >
                          {printingStock.name}
                        </div>
                      ) : null;
                      
                      const codeEl = (t.showBarcodeCode !== false && printingStock.code) ? (
                        <div 
                          key="code" 
                          className="font-medium text-gray-700 whitespace-nowrap px-1"
                          style={{
                            fontSize: t.barcodeCodeSize ? `${t.barcodeCodeSize * 0.5}px` : (is60x40 || is80x50 ? '10px' : '9px'),
                          }}
                        >
                          {printingStock.code}
                        </div>
                      ) : null;
                      
                      const customEl = (t.showCustomText && t.customTextContent) ? (
                        <div 
                          key="custom" 
                          className="font-medium text-gray-800 whitespace-nowrap px-1"
                          style={{
                            fontSize: t.barcodeCustomTextSize ? `${t.barcodeCustomTextSize * 0.5}px` : (is60x40 || is80x50 ? '11px' : '10px'),
                          }}
                        >
                          {t.customTextContent}
                        </div>
                      ) : null;
                      
                      const priceEl = t.showBarcodePrice !== false ? (
                        <div 
                          key="price" 
                          className="font-black text-black px-1 whitespace-nowrap"
                          style={{
                            fontSize: t.barcodePriceSize ? `${t.barcodePriceSize * 0.5}px` : (is60x40 || is80x50 ? '16px' : '14px'),
                          }}
                        >
                          {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </div>
                      ) : null;
                      
                      const qrSize = (t.barcodeHeight ? t.barcodeHeight * 0.5 : (is40x20 ? 40 : 64));
                      const barcodeEl = t.barcodeFormat === 'QR' ? (
                        <div key="barcode" className="flex justify-center barcode-svg-container w-full max-w-full overflow-visible">
                          <QrCodeImage 
                            value={barcodeValue} 
                            size={qrSize} 
                          />
                        </div>
                      ) : (
                        <div key="barcode" className="flex justify-center barcode-svg-container w-full max-w-full overflow-visible">
                          <Barcode renderer="img" 
                            value={barcodeValue} 
                            format={(t.barcodeFormat === 'EAN13' ? 'EAN13' : 'CODE128')} 
                            width={t.barcodeWidthScale ? t.barcodeWidthScale * 0.5 : bcWidth} 
                            height={t.barcodeHeight ? t.barcodeHeight * 0.5 : bcHeight} 
                            fontSize={t.barcodeFontSize ? t.barcodeFontSize * 0.5 : bcFontSize}
                            margin={0}
                            background="#ffffff"
                            displayValue={true}
                          />
                        </div>
                      );

                      // 6-way Image alignment
                      const imgPos = t.imagePosition || 'top_center';
                      const isImageTop = ['top', 'top_left', 'top_center', 'top_right'].includes(imgPos);
                      const isImageBottom = ['bottom', 'bottom_left', 'bottom_center', 'bottom_right'].includes(imgPos);

                      let imgAlignClass = 'justify-center';
                      if (imgPos.endsWith('_left') || imgPos === 'left') {
                        imgAlignClass = 'justify-start';
                      } else if (imgPos.endsWith('_right') || imgPos === 'right') {
                        imgAlignClass = 'justify-end';
                      } else {
                        imgAlignClass = 'justify-center';
                      }

                      const wrappedImgEl = imgEl ? (
                        <div key="img-wrapper" className={`flex w-full ${imgAlignClass}`}>
                          {imgEl}
                        </div>
                      ) : null;

                      const elements = [];
                      if (isImageTop) elements.push(wrappedImgEl);
                      if (t.barcodePosition === 'top') elements.push(barcodeEl);
                      elements.push(nameEl, codeEl, customEl, priceEl);
                      if (t.barcodePosition !== 'top') elements.push(barcodeEl);
                      if (isImageBottom) elements.push(wrappedImgEl);

                      const filteredElements = elements.filter(Boolean);

                      if (isOzel) {
                        const renderOzelPreviewItem = (key: string, el: React.ReactNode) => {
                          if (!el) return null;
                          const positions = t.customPositions || {};
                          const pos = positions[key] || { x: 50, y: 50, scale: 1 };
                          return (
                            <div 
                              key={key} 
                              className="absolute"
                              style={{
                                left: `${pos.x}%`,
                                top: `${pos.y}%`,
                                transform: `translate(-50%, -50%) scale(${pos.scale || 1})`,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {el}
                            </div>
                          );
                        };

                        return (
                          <div 
                            className="border border-zinc-200 shadow-sm bg-white relative overflow-hidden"
                            style={{ 
                              width: `${w}px`, 
                              height: `${h}px`,
                              padding: t.barcodePadding !== undefined ? `${t.barcodePadding * 0.5}px` : '8px'
                            }}
                          >
                            {t.showImage && renderOzelPreviewItem('image', imgEl)}
                            {t.showBarcodeName !== false && renderOzelPreviewItem('name', nameEl)}
                            {t.showBarcodeCode !== false && renderOzelPreviewItem('code', codeEl)}
                            {(t.showCustomText && t.customTextContent) && renderOzelPreviewItem('customText', customEl)}
                            {t.showBarcodePrice !== false && renderOzelPreviewItem('price', priceEl)}
                            {renderOzelPreviewItem('barcode', barcodeEl)}
                          </div>
                        );
                      }

                      const alignVal = t.barcodeAlignment || 'center';
                      const alignmentClass = alignVal === 'left' 
                        ? 'items-start text-left pl-2.5 pr-2.5' 
                        : alignVal === 'right' 
                          ? 'items-end text-right pl-2.5 pr-2.5' 
                          : 'items-center text-center';

                      return (
                        <div 
                          className={`border border-zinc-200 shadow-sm flex flex-col justify-center bg-white ${alignmentClass}`}
                          style={{ 
                            width: `${w}px`, 
                            height: `${h}px`,
                            padding: t.barcodePadding !== undefined ? `${t.barcodePadding * 0.5}px` : '8px',
                            gap: t.barcodeGap !== undefined ? `${t.barcodeGap * 0.5}px` : '4px'
                          }}
                        >
                          {filteredElements}
                        </div>
                      );
                    })()}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-white/5 bg-white/[0.01] flex justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const printContent = document.getElementById('printable-barcode-content');
                    if (printContent) {
                      try {
                        const dataUrl = await toPng(printContent, {
                          pixelRatio: 4, // Ultra high resolution for ultra sharp print/save
                          backgroundColor: '#ffffff'
                        });
                        const link = document.createElement('a');
                        link.download = `barkod_${printingStock.code || 'etiket'}.png`;
                        link.href = dataUrl;
                        link.click();
                      } catch (err) {
                        console.error('Resim kaydetme hatası:', err);
                        alert('Görsel oluşturulurken bir hata oluştu.');
                      }
                    }
                  }}
                  disabled={printTemplates.length === 0}
                  className="px-3 py-2 rounded text-xs font-semibold bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/20 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Barkod etiketini yüksek çözünürlüklü PNG resmi olarak indirir."
                >
                  <Download size={14} />
                  Resim Olarak İndir (PNG)
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onClose()}
                  className="px-4 py-2 rounded text-xs font-semibold text-white/70 hover:bg-white/5 transition"
                >
                  İptal
                </button>
              <button 
                onClick={async () => {
                  const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
                  if (!t) return;
                  
                  const printContent = document.getElementById('printable-barcode-content');
                  if (printContent) {
                    try {
                      // Generate pristine high-res flat image to avoid printer driver SVG/CSS bugs
                      const dataUrl = await toPng(printContent, {
                        pixelRatio: 4, // 4x resolution for absolute crispness on thermal printers
                        backgroundColor: '#ffffff'
                      });

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
                        let pw = '40mm';
                        let ph = '30mm';
                        if (t.paperSize === 'etiket_ozel') {
                          pw = `${(t.customWidthCm || 6) * 10}mm`;
                          ph = `${(t.customHeightCm || 4) * 10}mm`;
                        } else if (t.paperSize === 'etiket_60x40') { pw = '60mm'; ph = '40mm'; }
                        else if (t.paperSize === 'etiket_40x60') { pw = '40mm'; ph = '60mm'; }
                        else if (t.paperSize === 'etiket_80x50') { pw = '80mm'; ph = '50mm'; }
                        else if (t.paperSize === 'etiket_40x20') { pw = '40mm'; ph = '20mm'; }
                        
                        iframeDoc.open();
                        iframeDoc.write(`
                          <html>
                            <head>
                              <title>Barkod Yazdır</title>
                              <style>
                                @page { 
                                  size: ${pw} ${ph}; 
                                  margin: 0 !important; 
                                }
                                html, body { 
                                  margin: 0 !important; 
                                  padding: 0 !important; 
                                  width: ${pw} !important; 
                                  height: ${ph} !important;
                                  max-width: ${pw} !important;
                                  max-height: ${ph} !important;
                                  background: white !important; 
                                  overflow: hidden !important;
                                  display: flex !important;
                                  align-items: center !important;
                                  justify-content: center !important;
                                  box-sizing: border-box !important;
                                }
                                img {
                                  width: 100% !important;
                                  height: 100% !important;
                                  object-fit: contain !important;
                                  image-rendering: pixelated !important;
                                  image-rendering: crisp-edges !important;
                                  -webkit-print-color-adjust: exact !important; 
                                  print-color-adjust: exact !important; 
                                }
                              </style>
                            </head>
                            <body>
                              <img src="${dataUrl}" alt="Barkod Etiketi" />
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
                    } catch (err) {
                      console.error('Yazdırma hazırlama hatası:', err);
                      alert('Yazdırma işlemi hazırlanırken bir hata oluştu. Lütfen tekrar deneyin.');
                    }
                  } else {
                    window.print();
                  }
                }}
                disabled={printTemplates.length === 0}
                className="px-4 py-2 rounded text-xs font-bold bg-teal-500 hover:bg-teal-600 text-black transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer size={14} />
                Yazdır
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      {isOpen && printingStock && selectedTemplateId && (
        <div style={{ position: 'fixed', left: 0, top: 0, width: '0px', height: '0px', overflow: 'hidden', zIndex: -9999, pointerEvents: 'none' }}>
          {(() => {
            const t = printTemplates.find(tpl => tpl.id === selectedTemplateId);
            if (!t) return null;
            
            const barcodeValue = printingStock.barcode || printingStock.code || '1234567890';
            const is40x20 = t.paperSize === 'etiket_40x20';
            const is60x40 = t.paperSize === 'etiket_60x40';
            const is40x60 = t.paperSize === 'etiket_40x60';
            const is80x50 = t.paperSize === 'etiket_80x50';
            
            const isOzel = t.paperSize === 'etiket_ozel';
            
            let w = 400; // default 40x30 (scaled to pixels)
            let h = 300;
            if (isOzel) {
              w = Math.round((t.customWidthCm || 6) * 100);
              h = Math.round((t.customHeightCm || 4) * 100);
            } else if (is60x40) { w = 600; h = 400; }
            else if (is40x60) { w = 400; h = 600; }
            else if (is80x50) { w = 800; h = 500; }
            else if (is40x20) { w = 400; h = 200; }

            const widthStyle = { width: `${w}px`, height: `${h}px`, backgroundColor: '#ffffff' };
            
            const scaleFactor = 2.65;
            const imgSize = (t.barcodeImageSize || 64) * scaleFactor;
            
            const imgEl = (t.showImage && printingStock.imageUrl) ? (
              <img 
                key="img"
                src={printingStock.imageUrl} 
                alt="Ürün Resmi" 
                className="object-cover rounded-sm filter grayscale"
                style={{ 
                  width: `${imgSize}px`, 
                  height: `${imgSize}px`,
                  WebkitFilter: 'grayscale(100%)', 
                  mixBlendMode: 'multiply' 
                }}
              />
            ) : null;
            
            const nameEl = t.showBarcodeName !== false ? (
              <div 
                key="name" 
                className="font-bold px-1 whitespace-nowrap uppercase text-black"
                style={{
                  fontSize: `${(t.barcodeNameSize || 12) * scaleFactor}px`
                }}
              >
                {printingStock.name}
              </div>
            ) : null;
            
            const codeEl = (t.showBarcodeCode !== false && printingStock.code) ? (
              <div 
                key="code" 
                className="font-medium text-gray-700 px-1 whitespace-nowrap uppercase text-ellipsis overflow-hidden"
                style={{
                  fontSize: `${(t.barcodeCodeSize || 10) * scaleFactor}px`
                }}
              >
                {printingStock.code}
              </div>
            ) : null;
            
            const customEl = (t.showCustomText && t.customTextContent) ? (
              <div 
                key="custom" 
                className="font-medium text-gray-800 px-1 whitespace-nowrap uppercase"
                style={{
                  fontSize: `${(t.barcodeCustomTextSize || 11) * scaleFactor}px`
                }}
              >
                {t.customTextContent}
              </div>
            ) : null;
            
            const priceEl = t.showBarcodePrice !== false ? (
              <div 
                key="price" 
                className="font-black text-black px-1 whitespace-nowrap"
                style={{
                  fontSize: `${(t.barcodePriceSize || 14) * scaleFactor}px`
                }}
              >
                {printingStock.salesPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </div>
            ) : null;
            
            const bcWidth = (t.barcodeWidthScale || (['etiket_40x20', 'etiket_40x60'].includes(t.paperSize) ? 1 : 2)) * scaleFactor;
            const bcHeight = (t.barcodeHeight || (t.paperSize === 'etiket_40x20' ? 30 : 50)) * scaleFactor;
            const bcFontSize = (t.barcodeFontSize || (t.paperSize === 'etiket_40x20' ? 8 : 12)) * scaleFactor;

            const qrSize = bcHeight; // for QR code, height is square size

            const barcodeEl = t.barcodeFormat === 'QR' ? (
              <div key="barcode" className="flex justify-center barcode-svg-container w-full max-w-full overflow-visible">
                <QrCodeImage 
                  value={barcodeValue} 
                  size={qrSize} 
                />
              </div>
            ) : (
              <div key="barcode" className="flex justify-center barcode-svg-container w-full max-w-full overflow-visible">
                <Barcode renderer="img" 
                  value={barcodeValue} 
                  format={(t.barcodeFormat === 'EAN13' ? 'EAN13' : 'CODE128')} 
                  width={bcWidth} 
                  height={bcHeight} 
                  fontSize={bcFontSize}
                  margin={0}
                  background="#ffffff"
                  displayValue={true}
                />
              </div>
            );

            // 6-way Image alignment
            const imgPos = t.imagePosition || 'top_center';
            const isImageTop = ['top', 'top_left', 'top_center', 'top_right'].includes(imgPos);
            const isImageBottom = ['bottom', 'bottom_left', 'bottom_center', 'bottom_right'].includes(imgPos);

            let imgAlignClass = 'justify-center';
            if (imgPos.endsWith('_left') || imgPos === 'left') {
              imgAlignClass = 'justify-start';
            } else if (imgPos.endsWith('_right') || imgPos === 'right') {
              imgAlignClass = 'justify-end';
            } else {
              imgAlignClass = 'justify-center';
            }

            const wrappedImgEl = imgEl ? (
              <div key="img-wrapper" className={`flex w-full ${imgAlignClass}`}>
                {imgEl}
              </div>
            ) : null;

            const elements = [];
            if (isImageTop) elements.push(wrappedImgEl);
            if (t.barcodePosition === 'top') elements.push(barcodeEl);
            elements.push(nameEl, codeEl, customEl, priceEl);
            if (t.barcodePosition !== 'top') elements.push(barcodeEl);
            if (isImageBottom) elements.push(wrappedImgEl);

            const filteredElements = elements.filter(Boolean);

            const finalPadding = (t.barcodePadding !== undefined ? t.barcodePadding : 8) * scaleFactor;
            const finalGap = (t.barcodeGap !== undefined ? t.barcodeGap : 4) * scaleFactor;

            if (isOzel) {
              const renderOzelPrintItem = (key: string, el: React.ReactNode) => {
                if (!el) return null;
                const positions = t.customPositions || {};
                const pos = positions[key] || { x: 50, y: 50, scale: 1 };
                return (
                  <div 
                    key={key} 
                    style={{
                      position: 'absolute',
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                      transform: `translate(-50%, -50%) scale(${pos.scale || 1})`,
                      whiteSpace: 'nowrap',
                      margin: 0,
                      padding: 0
                    }}
                  >
                    {el}
                  </div>
                );
              };

              return (
                <div 
                  id="printable-barcode-content" 
                  className="bg-white text-black relative overflow-hidden" 
                  style={{
                    ...widthStyle,
                    padding: `${finalPadding}px`
                  }}
                >
                  {t.showImage && renderOzelPrintItem('image', imgEl)}
                  {t.showBarcodeName !== false && renderOzelPrintItem('name', nameEl)}
                  {t.showBarcodeCode !== false && renderOzelPrintItem('code', codeEl)}
                  {(t.showCustomText && t.customTextContent) && renderOzelPrintItem('customText', customEl)}
                  {t.showBarcodePrice !== false && renderOzelPrintItem('price', priceEl)}
                  {renderOzelPrintItem('barcode', barcodeEl)}
                </div>
              );
            }

            const alignVal = t.barcodeAlignment || 'center';
            const alignmentClass = alignVal === 'left' 
              ? 'items-start text-left pl-[10%] pr-[10%]' 
              : alignVal === 'right' 
                ? 'items-end text-right pl-[10%] pr-[10%]' 
                : 'items-center text-center';

            return (
              <div 
                id="printable-barcode-content" 
                className={`flex flex-col justify-center overflow-hidden bg-white text-black ${alignmentClass}`} 
                style={{
                  ...widthStyle,
                  padding: `${finalPadding}px`,
                  gap: `${finalGap}px`
                }}
              >
                {filteredElements}
              </div>
            );
          })()}
        </div>
      )}

    </>
  );
}
