import { TemplateSettingsPanel } from './templatedesigner/TemplateSettingsPanel';
import { TemplatePreviews } from './templatedesigner/TemplatePreviews';
import { SwitchRow } from './templates/SwitchRow';
import React, { useState, useEffect } from 'react';
import { Save, Plus, Settings, LayoutTemplate, Image as ImageIcon, Barcode as BarcodeIcon, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { QrCodeImage } from './templatedesigner/QrCodeImage';

export interface PrintTemplateConfig {
  id: string;
  name: string;
  type: 'satis' | 'alis' | 'iade' | 'teklif' | 'barkod';
  documentTitle: string;
  paperSize: 'a4' | 'a4_yatay' | 'a5' | 'a5_yatay' | 'termal_80' | 'termal_58' | 'etiket_40x30' | 'etiket_60x40' | 'etiket_80x50' | 'etiket_40x20' | 'etiket_40x60' | 'etiket_ozel';
  textSize?: 'small' | 'normal' | 'large';
  
  customWidthCm?: number;
  customHeightCm?: number;
  snapToGrid?: boolean;
  customPositions?: Record<string, { x: number; y: number; scale?: number }>;
  
  // General Settings
  showLogo: boolean;
  showCompanyAddress: boolean;
  showValidityDate: boolean;
  showFooter: boolean;
  showCustomerBalance: boolean;

  // Column Settings
  showProductImage: boolean;
  showDiscountRate: boolean;
  showExVatAmount: boolean;
  showVatRate: boolean;
  showUnitPrice: boolean;

  // Barcode Settings
  barcodeFormat?: 'CODE128' | 'EAN13' | 'QR';
  showBarcodePrice?: boolean;
  showBarcodeName?: boolean;
  showBarcodeCode?: boolean;
  showImage?: boolean; // Show product image on barcode
  
  // Custom Barcode Scales
  barcodeWidthScale?: number;
  barcodeHeight?: number;
  barcodeFontSize?: number;
  
  barcodePosition?: 'bottom' | 'top';
  barcodeAlignment?: 'left' | 'center' | 'right';
  imagePosition?: 'top' | 'bottom' | 'top_left' | 'top_center' | 'top_right' | 'bottom_left' | 'bottom_center' | 'bottom_right';

  // Granular sizing and spacing
  barcodeImageSize?: number;
  barcodeNameSize?: number;
  barcodeCodeSize?: number;
  barcodeCustomTextSize?: number;
  barcodePriceSize?: number;
  barcodePadding?: number;
  barcodeGap?: number;

  // Custom Text
  showCustomText?: boolean;
  customTextContent?: string;

  // Signature and Bank Details Settings (1-2)
  showSignatureArea?: boolean;
  deliveryDelivererLabel?: string;
  deliveryReceiverLabel?: string;
  showBankDetails?: boolean;
  bankDetailsTitle?: string;
  bankDetailsContent?: string;

  // Template design layout style (5 different designs)
  designStyle?: 'minimal' | 'corporate' | 'modern' | 'elegant' | 'classic';
}

const DEFAULT_TEMPLATES: PrintTemplateConfig[] = [];

export default function TemplateDesignerView() {
  const [templates, setTemplates] = useState<PrintTemplateConfig[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  const [draggingElement, setDraggingElement] = useState<string | null>(null);
  const labelContainerRef = React.useRef<HTMLDivElement>(null);

  const dragOffsetRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(2.0);

  // Precision Keyboard Move Support
  useEffect(() => {
    if (!selectedElement || !activeTemplateId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input, textarea or editable element
      if (
        document.activeElement?.tagName === 'INPUT' || 
        document.activeElement?.tagName === 'TEXTAREA' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      let dx = 0;
      let dy = 0;

      // Handle Arrow keys for millimeter-precision positioning (0.5% or 2.5% if Shift held)
      if (e.key === 'ArrowUp') {
        dy = e.shiftKey ? -2.5 : -0.5;
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        dy = e.shiftKey ? 2.5 : 0.5;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        dx = e.shiftKey ? -2.5 : -0.5;
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        dx = e.shiftKey ? 2.5 : 0.5;
        e.preventDefault();
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
        e.preventDefault();
        return;
      }

      if (dx !== 0 || dy !== 0) {
        setTemplates(prevTemplates => {
          const activeT = prevTemplates.find(t => t.id === activeTemplateId);
          if (!activeT) return prevTemplates;

          const currentPositions = activeT.customPositions || {};
          const pos = currentPositions[selectedElement] || { x: 50, y: 50, scale: 1 };
          
          let newX = pos.x + dx;
          let newY = pos.y + dy;

          newX = Math.max(0, Math.min(100, newX));
          newY = Math.max(0, Math.min(100, newY));

          if (activeT.snapToGrid !== false) {
            // Keep to 0.5% increments for precision grid alignment
            newX = Math.round(newX / 0.5) * 0.5;
            newY = Math.round(newY / 0.5) * 0.5;
          }

          const updatedPositions = {
            ...currentPositions,
            [selectedElement]: {
              ...pos,
              x: parseFloat(newX.toFixed(1)),
              y: parseFloat(newY.toFixed(1))
            }
          };

          const updated = prevTemplates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
          localStorage.setItem('storm_print_templates', JSON.stringify(updated));
          return updated;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, activeTemplateId]);

  useEffect(() => {
    if (!draggingElement) return;

    const getPaddingBox = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      const borderLeft = parseFloat(style.borderLeftWidth) || 0;
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderRight = parseFloat(style.borderRightWidth) || 0;
      const borderBottom = parseFloat(style.borderBottomWidth) || 0;
      
      // CSS absolute positioning left/top percentages are relative to the PADDING BOX.
      // Padding Box = Border Box - Borders. (Padding is INCLUDED in the padding box).
      return {
        left: rect.left + borderLeft,
        top: rect.top + borderTop,
        width: rect.width - borderLeft - borderRight,
        height: rect.height - borderTop - borderBottom
      };
    };

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!labelContainerRef.current) return;
      const pBox = getPaddingBox(labelContainerRef.current);
      
      if (draggingElement) {
        // Calculate coordinate using offset to avoid jump
        const desiredX_px = e.clientX - dragOffsetRef.current.x;
        const desiredY_px = e.clientY - dragOffsetRef.current.y;

        let x = ((desiredX_px - pBox.left) / pBox.width) * 100;
        let y = ((desiredY_px - pBox.top) / pBox.height) * 100;
        
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        setTemplates(prevTemplates => {
          const activeT = prevTemplates.find(t => t.id === activeTemplateId);
          if (!activeT) return prevTemplates;
          
          if (activeT.snapToGrid !== false) {
            // Finer snap step (0.5% instead of 2.5%) for smoother, precise design
            x = Math.round(x / 0.5) * 0.5;
            y = Math.round(y / 0.5) * 0.5;
          }
          
          const currentPositions = activeT.customPositions || {};
          const updatedPositions = {
            ...currentPositions,
            [draggingElement]: {
              ...currentPositions[draggingElement],
              x: parseFloat(x.toFixed(1)),
              y: parseFloat(y.toFixed(1))
            }
          };
          
          return prevTemplates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        });
      }
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (!labelContainerRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const pBox = getPaddingBox(labelContainerRef.current);
      
      if (draggingElement) {
        const desiredX_px = touch.clientX - dragOffsetRef.current.x;
        const desiredY_px = touch.clientY - dragOffsetRef.current.y;

        let x = ((desiredX_px - pBox.left) / pBox.width) * 100;
        let y = ((desiredY_px - pBox.top) / pBox.height) * 100;
        
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        setTemplates(prevTemplates => {
          const activeT = prevTemplates.find(t => t.id === activeTemplateId);
          if (!activeT) return prevTemplates;
          
          if (activeT.snapToGrid !== false) {
            x = Math.round(x / 0.5) * 0.5;
            y = Math.round(y / 0.5) * 0.5;
          }
          
          const currentPositions = activeT.customPositions || {};
          const updatedPositions = {
            ...currentPositions,
            [draggingElement]: {
              ...currentPositions[draggingElement],
              x: parseFloat(x.toFixed(1)),
              y: parseFloat(y.toFixed(1))
            }
          };
          
          return prevTemplates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        });
      }
    };

    const onGlobalMouseUp = () => {
      if (draggingElement) {
        setTemplates(prevTemplates => {
          localStorage.setItem('storm_print_templates', JSON.stringify(prevTemplates));
          return prevTemplates;
        });
      }
      setDraggingElement(null);
    };

    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
    window.addEventListener('touchmove', onGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', onGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', onGlobalMouseMove);
      window.removeEventListener('mouseup', onGlobalMouseUp);
      window.removeEventListener('touchmove', onGlobalTouchMove);
      window.removeEventListener('touchend', onGlobalMouseUp);
    };
  }, [draggingElement, activeTemplateId]);

  const [companyName, setCompanyName] = useState('Firma Adı');
  const [companyAddress, setCompanyAddress] = useState('Firma Adresi');
  const [companyPhone, setCompanyPhone] = useState('0555 555 55 55');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');

  useEffect(() => {
    // Load templates
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
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
          setTemplates(filtered);
          if (filtered.length > 0) {
            setActiveTemplateId(filtered[0].id);
            localStorage.setItem('storm_print_templates', JSON.stringify(filtered));
          } else {
            setActiveTemplateId('');
            localStorage.setItem('storm_print_templates', JSON.stringify([]));
          }
        } else {
          setTemplates([]);
          setActiveTemplateId('');
          localStorage.setItem('storm_print_templates', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Failed to parse templates', e);
        setTemplates([]);
        setActiveTemplateId('');
      }
    } else {
      setTemplates([]);
      setActiveTemplateId('');
      localStorage.setItem('storm_print_templates', JSON.stringify([]));
    }

    // Load company settings
    const savedSettings = localStorage.getItem('storm_muhasebe_print_settings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.companyName) setCompanyName(parsedSettings.companyName);
        if (parsedSettings.companyAddress) setCompanyAddress(parsedSettings.companyAddress);
        if (parsedSettings.companyPhone) setCompanyPhone(parsedSettings.companyPhone);
        if (parsedSettings.logoType) setLogoType(parsedSettings.logoType);
        if (parsedSettings.logoImageUrl) setLogoImageUrl(parsedSettings.logoImageUrl);
      } catch (e) {}
    }
  }, []);

  // Optimize all barcode SVGs on the screen for maximum crispness
  useEffect(() => {
    const svgs = document.querySelectorAll('.barcode-svg-container svg');
    svgs.forEach(svg => {
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.querySelectorAll('*').forEach(child => {
        child.setAttribute('vector-effect', 'non-scaling-stroke');
      });
    });
  }, [activeTemplateId, templates]);

  const saveTemplates = (newTemplates: PrintTemplateConfig[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('storm_print_templates', JSON.stringify(newTemplates));
  };

  const handleUpdateActiveTemplate = (updates: Partial<PrintTemplateConfig>) => {
    const updated = templates.map(t => t.id === activeTemplateId ? { ...t, ...updates } : t);
    saveTemplates(updated);
  };

  const handleCreateNew = () => {
    const newTemplate: PrintTemplateConfig = {
      id: `template-${Date.now()}`,
      name: 'Yeni Şablon',
      type: 'satis',
      documentTitle: 'YENİ BELGE',
      paperSize: 'a4',
      showLogo: true,
      showCompanyAddress: true,
      showValidityDate: false,
      showFooter: true,
      showCustomerBalance: false,
      showProductImage: false,
      showDiscountRate: false,
      showExVatAmount: false,
      showVatRate: true,
      showUnitPrice: true,
      barcodeFormat: 'CODE128',
      showBarcodePrice: true,
      showBarcodeName: true,
      showBarcodeCode: true,
      showCustomText: false,
      customTextContent: '',
      showSignatureArea: true,
      deliveryDelivererLabel: 'TESLİM EDEN (İMZA)',
      deliveryReceiverLabel: 'TESLİM ALAN (İMZA)',
      showBankDetails: false,
      bankDetailsTitle: 'BANKA HESAP BİLGİLERİ',
      bankDetailsContent: 'Ziraat Bankası: TR00 1111 2222 3333 4444 5555 66\nVakıfbank: TR00 2222 3333 4444 5555 6666 77',
    };
    saveTemplates([...templates, newTemplate]);
    setActiveTemplateId(newTemplate.id);
  };

  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleDeleteTemplate = () => {
    if (templates.length <= 1) {
      return;
    }
    setTemplateToDelete(activeTemplateId);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      const newTemplates = templates.filter(t => t.id !== templateToDelete);
      saveTemplates(newTemplates);
      setActiveTemplateId(newTemplates[0].id);
      setTemplateToDelete(null);
    }
  };

  const cancelDelete = () => {
    setTemplateToDelete(null);
  };

  const activeTemplate = templates.find(t => t.id === activeTemplateId) || templates[0];

  if (templates.length === 0 || !activeTemplate) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center h-[calc(100vh-200px)] min-h-[500px]">
        <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <LayoutTemplate size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Henüz Tasarlanmış Şablon Yok</h3>
        <p className="text-slate-500 text-sm max-w-sm mb-6 leading-relaxed">
          Kendi ihtiyaçlarınıza uygun özel fatura, barkod etiketi, fiş veya makbuz tasarımlarınızı sıfırdan oluşturmaya başlayın!
        </p>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-lg shadow-teal-500/10 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <Plus size={18} /> İlk Şablonu Tasarla
        </button>
      </div>
    );
  }

  // Mock Data for Preview
  const mockCustomer = {
    name: 'Ahmet Yılmaz',
    address: 'Atatürk Cad. No:123 Kadıköy/İstanbul',
    balance: '12.450,00 ₺'
  };

  const mockItems = [
    { name: 'Laptop Pro 15"', qty: 1, price: 25000, vat: 20, discount: 5 },
    { name: 'Kablosuz Mouse', qty: 2, price: 450, vat: 20, discount: 0 },
  ];

  const calculateTotal = () => {
    return mockItems.reduce((acc, item) => {
      const discountedPrice = item.price * (1 - item.discount / 100);
      const withVat = discountedPrice * (1 + item.vat / 100);
      return acc + (withVat * item.qty);
    }, 0);
  };

  const renderPreviewBankDetails = () => {
    if (!activeTemplate.showBankDetails) return null;
    return (
      <div className="mt-4 border border-slate-200 bg-slate-50/50 rounded-lg p-2.5 text-left font-mono text-[8px] text-slate-600">
        <span className="font-extrabold text-[9px] text-slate-800 tracking-wider block mb-1 uppercase font-sans">
          {activeTemplate.bankDetailsTitle || 'BANKA HESAP BİLGİLERİ'}
        </span>
        <div className="whitespace-pre-line leading-relaxed">
          {activeTemplate.bankDetailsContent || 'Banka bilgisi girilmemiş.'}
        </div>
      </div>
    );
  };

  const renderPreviewSignatureArea = () => {
    if (activeTemplate.showSignatureArea === false) return null;
    return (
      <div className="grid grid-cols-2 gap-4 text-center mt-4 pt-3 border-t border-dashed border-slate-200">
        <div>
          <span className="text-[7px] font-bold text-slate-400 tracking-wider uppercase block mb-6 font-sans">
            {activeTemplate.deliveryDelivererLabel || 'TESLİM EDEN (İMZA)'}
          </span>
          <div className="border-t border-dashed border-slate-200 w-16 mx-auto"></div>
        </div>
        <div>
          <span className="text-[7px] font-bold text-slate-400 tracking-wider uppercase block mb-6 font-sans">
            {activeTemplate.deliveryReceiverLabel || 'TESLİM ALAN (İMZA)'}
          </span>
          <div className="border-t border-dashed border-slate-200 w-16 mx-auto"></div>
        </div>
      </div>
    );
  };

  const getPaperDimensions = (size: string) => {
    const isLabelOrThermal = size.startsWith('etiket_') || size.startsWith('termal_');
    const zoomMultiplier = isLabelOrThermal ? previewZoom : 1.0;

    switch (size) {
      case 'a4': return { maxWidth: '794px', aspectRatio: '1 / 1.414', padding: '40px' };
      case 'a4_yatay': return { maxWidth: '1123px', aspectRatio: '1.414 / 1', padding: '40px' };
      case 'a5': return { maxWidth: '559px', aspectRatio: '1 / 1.414', padding: '24px' };
      case 'a5_yatay': return { maxWidth: '794px', aspectRatio: '1.414 / 1', padding: '24px' };
      case 'termal_80': return { maxWidth: `${302 * zoomMultiplier}px`, aspectRatio: 'auto', minHeight: `${400 * zoomMultiplier}px`, padding: `${12 * zoomMultiplier}px` };
      case 'termal_58': return { maxWidth: `${219 * zoomMultiplier}px`, aspectRatio: 'auto', minHeight: `${300 * zoomMultiplier}px`, padding: `${8 * zoomMultiplier}px` };
      case 'etiket_80x50': return { maxWidth: `${302 * zoomMultiplier}px`, aspectRatio: '80 / 50', padding: `${12 * zoomMultiplier}px`, minHeight: 'auto' };
      case 'etiket_60x40': return { maxWidth: `${226 * zoomMultiplier}px`, aspectRatio: '60 / 40', padding: `${8 * zoomMultiplier}px`, minHeight: 'auto' };
      case 'etiket_40x60': return { maxWidth: `${151 * zoomMultiplier}px`, aspectRatio: '40 / 60', padding: `${8 * zoomMultiplier}px`, minHeight: 'auto' };
      case 'etiket_40x30': return { maxWidth: `${151 * zoomMultiplier}px`, aspectRatio: '40 / 30', padding: `${8 * zoomMultiplier}px`, minHeight: 'auto' };
      case 'etiket_40x20': return { maxWidth: `${151 * zoomMultiplier}px`, aspectRatio: '40 / 20', padding: `${8 * zoomMultiplier}px`, minHeight: 'auto' };
      case 'etiket_ozel': {
        const w = activeTemplate.customWidthCm || 6;
        const h = activeTemplate.customHeightCm || 4;
        return { 
          maxWidth: `${w * 37.8 * zoomMultiplier}px`, 
          aspectRatio: `${w} / ${h}`, 
          padding: `${(activeTemplate.barcodePadding !== undefined ? activeTemplate.barcodePadding : 8) * zoomMultiplier}px`, 
          minHeight: 'auto' 
        };
      }
      default: return { maxWidth: '794px', aspectRatio: '1 / 1.414', padding: '40px' };
    }
  };

  const getPaperLabel = (size: string) => {
    switch(size) {
      case 'a4': return 'A4 DİKEY';
      case 'a4_yatay': return 'A4 YATAY';
      case 'a5': return 'A5 DİKEY';
      case 'a5_yatay': return 'A5 YATAY';
      case 'termal_80': return 'TERMAL 80MM';
      case 'termal_58': return 'TERMAL 58MM';
      case 'etiket_80x50': return 'ETİKET 80x50';
      case 'etiket_60x40': return 'ETİKET 60x40';
      case 'etiket_40x60': return 'ETİKET 40x60';
      case 'etiket_40x30': return 'ETİKET 40x30';
      case 'etiket_40x20': return 'ETİKET 40x20';
      case 'etiket_ozel': return `ÖZEL ETİKET (${activeTemplate.customWidthCm || 6}x${activeTemplate.customHeightCm || 4}cm)`;
      default: return size;
    }
  };

  const renderDraggableItem = (key: string, label: string, element: React.ReactNode) => {
    if (!element) return null;
    const positions = activeTemplate.customPositions || {};
    const defaultPositions: Record<string, { x: number; y: number }> = {
      image: { x: 50, y: 15 },
      name: { x: 50, y: 35 },
      code: { x: 50, y: 50 },
      customText: { x: 50, y: 62 },
      price: { x: 50, y: 74 },
      barcode: { x: 50, y: 88 }
    };
    const pos = positions[key] || defaultPositions[key] || { x: 50, y: 50 };
    const isDragging = draggingElement === key;
    const isSelected = selectedElement === key;
    
    return (
      <div
        id={`draggable-${key}`}
        key={key}
        className={`absolute group select-none p-2 rounded-xl border border-dashed ${
          isDragging 
            ? 'cursor-grabbing border-teal-600 bg-teal-50/80 shadow-lg z-50 ring-2 ring-teal-600/30' 
            : isSelected
              ? 'transition-colors duration-150 border-teal-500 bg-teal-50/30 shadow-xs ring-1 ring-teal-500/20 z-40'
              : 'transition-colors duration-150 border-transparent cursor-grab hover:border-teal-400/60 hover:bg-slate-50/50 hover:shadow-xs'
        }`}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: `translate(-50%, -50%)`,
          whiteSpace: 'nowrap',
          width: 'max-content'
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            e.preventDefault();
            
            // Calculate starting offset to prevent jumping
            const domNode = document.getElementById(`draggable-${key}`);
            if (domNode && labelContainerRef.current) {
              const elRect = domNode.getBoundingClientRect();
              const elemX = elRect.left + elRect.width / 2;
              const elemY = elRect.top + elRect.height / 2;
              dragOffsetRef.current = {
                x: e.clientX - elemX,
                y: e.clientY - elemY
              };
            } else {
              dragOffsetRef.current = { x: 0, y: 0 };
            }
            
            setDraggingElement(key);
            setSelectedElement(key);
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
            const domNode = document.getElementById(`draggable-${key}`);
            if (e.touches && e.touches.length > 0 && domNode && labelContainerRef.current) {
              const touch = e.touches[0];
              const elRect = domNode.getBoundingClientRect();
              const elemX = elRect.left + elRect.width / 2;
              const elemY = elRect.top + elRect.height / 2;
              dragOffsetRef.current = {
                x: touch.clientX - elemX,
                y: touch.clientY - elemY
              };
            } else {
              dragOffsetRef.current = { x: 0, y: 0 };
            }
            setDraggingElement(key);
            setSelectedElement(key);
          }}
        />

        {/* Label Badge */}
        <div className={`absolute -top-6 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm pointer-events-none transition-opacity duration-150 z-50 flex items-center gap-1 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}>
          <span>{label}</span>
          <span className="text-[8px] opacity-75">{pos.x}%, {pos.y}%</span>
        </div>
        
        <div className="relative pointer-events-none">
          {element}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* LEFT COLUMN: LIVE PREVIEW (60%) */}
      <div className="lg:w-[60%] flex flex-col bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="bg-slate-800 p-3 flex flex-wrap gap-2 justify-between items-center text-xs font-bold uppercase tracking-wider z-10 shrink-0" style={{ color: '#ffffff' }}>
          <div className="flex items-center gap-2" style={{ color: '#ffffff' }}>
            <LayoutTemplate size={16} style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Canlı Önizleme</span>
          </div>
          
          <div className="flex items-center flex-wrap gap-3">
            {/* Keyboard shortcuts helper when active */}
            {activeTemplate.paperSize === 'etiket_ozel' && (
              <div className="hidden md:flex items-center gap-2 text-[10px] text-teal-400 font-mono tracking-normal normal-case">
                <span>⌨️ Yön Tuşları: İnce Taşı</span>
                <span className="opacity-45">|</span>
                <span>Boyut: + / -</span>
                <span className="opacity-45">|</span>
                <span>Bırak: ESC</span>
              </div>
            )}

            {/* Clear selection button */}
            {selectedElement && (
              <button
                onClick={() => setSelectedElement(null)}
                className="px-2 py-0.5 text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded cursor-pointer transition uppercase"
              >
                Seçimi Kaldır
              </button>
            )}

            {/* Zoom Selector for Label layouts */}
            {(activeTemplate.paperSize.startsWith('etiket_') || activeTemplate.paperSize.startsWith('termal_')) && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 capitalize normal-case">Yakınlaştır:</span>
                <select
                  value={previewZoom}
                  onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-1.5 py-0.5 text-[10px] font-mono text-white outline-none cursor-pointer focus:border-teal-500"
                >
                  <option value="1.0">1.0x (100%)</option>
                  <option value="1.5">1.5x (150%)</option>
                  <option value="2.0">2.0x (200%)</option>
                  <option value="2.5">2.5x (250%)</option>
                  <option value="3.0">3.0x (300%)</option>
                </select>
              </div>
            )}

            <span className="bg-slate-700 px-2 py-1 rounded text-[10px]" style={{ color: '#ffffff' }}>
              {getPaperLabel(activeTemplate.paperSize)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
          {/* Paper Container */}
          <div 
            className="bg-white shadow-2xl transition-all duration-300 origin-top shrink-0 relative flex flex-col print-paper-sheet"
            style={{
              width: '100%',
              ...getPaperDimensions(activeTemplate.paperSize),
              padding: activeTemplate.barcodePadding !== undefined ? `${activeTemplate.barcodePadding}px` : undefined
            }}
          >
            {activeTemplate.type === 'barkod' ? (() => {
              const isLabelOrThermal = activeTemplate.paperSize.startsWith('etiket_') || activeTemplate.paperSize.startsWith('termal_');
              const zoomMultiplier = isLabelOrThermal ? previewZoom : 1.0;

              const imgSize = (activeTemplate.barcodeImageSize || 64) * zoomMultiplier;
              const imgEl = activeTemplate.showImage ? (
                <div 
                  key="img" 
                  className="bg-slate-200 border border-slate-300 rounded flex items-center justify-center shrink-0"
                  style={{
                    width: `${imgSize}px`,
                    height: `${imgSize}px`,
                  }}
                >
                  <ImageIcon size={Math.max(16, imgSize * 0.4)} className="text-slate-400" />
                </div>
              ) : null;
              
              const nameEl = activeTemplate.showBarcodeName ? (
                <div 
                  key="name" 
                  className="font-bold text-slate-900 px-1 whitespace-nowrap leading-tight"
                  style={{
                    fontSize: `${(activeTemplate.barcodeNameSize || (activeTemplate.paperSize === 'etiket_60x40' || activeTemplate.paperSize === 'etiket_80x50' ? 12 : 10)) * zoomMultiplier}px`
                  }}
                >
                  ÖRNEK ÜRÜN ADI - SİYAH
                </div>
              ) : null;
              
              const codeEl = activeTemplate.showBarcodeCode !== false ? (
                <div 
                  key="code" 
                  className="font-medium text-slate-700 px-1 whitespace-nowrap leading-tight"
                  style={{
                    fontSize: `${(activeTemplate.barcodeCodeSize || (activeTemplate.paperSize === 'etiket_60x40' || activeTemplate.paperSize === 'etiket_80x50' ? 10 : 9)) * zoomMultiplier}px`
                  }}
                >
                  STK-10001
                </div>
              ) : null;
              
              const customEl = (activeTemplate.showCustomText && activeTemplate.customTextContent) ? (
                <div 
                  key="custom" 
                  className="font-medium text-slate-800 px-1 whitespace-nowrap leading-tight"
                  style={{
                    fontSize: `${(activeTemplate.barcodeCustomTextSize || (activeTemplate.paperSize === 'etiket_60x40' || activeTemplate.paperSize === 'etiket_80x50' ? 11 : 10)) * zoomMultiplier}px`
                  }}
                >
                  {activeTemplate.customTextContent}
                </div>
              ) : null;
              
              const priceEl = activeTemplate.showBarcodePrice ? (
                <div 
                  key="price" 
                  className="font-black text-slate-900 px-1 whitespace-nowrap leading-tight"
                  style={{
                    fontSize: `${(activeTemplate.barcodePriceSize || (activeTemplate.paperSize === 'etiket_60x40' || activeTemplate.paperSize === 'etiket_80x50' ? 16 : 14)) * zoomMultiplier}px`
                  }}
                >
                  125,00 ₺
                </div>
              ) : null;
              
              const qrSize = Math.round((activeTemplate.barcodeHeight || (activeTemplate.paperSize === 'etiket_40x20' ? 40 : 64)) * zoomMultiplier);
              const barcodeValue = activeTemplate.barcodeFormat === 'EAN13' ? "8691234567890" : "STK-10001";

              const barcodeEl = activeTemplate.barcodeFormat === 'QR' ? (
                <div key="barcode" className="flex justify-center barcode-svg-container overflow-visible">
                  <QrCodeImage 
                    value={barcodeValue} 
                    size={qrSize} 
                  />
                </div>
              ) : (
                <div key="barcode" className="flex justify-center barcode-svg-container overflow-visible">
                  <Barcode renderer="svg" 
                    value={barcodeValue} 
                    format={(activeTemplate.barcodeFormat === 'EAN13' ? 'EAN13' : 'CODE128')} 
                    width={Math.round((activeTemplate.barcodeWidthScale || (['etiket_40x20', 'etiket_40x60'].includes(activeTemplate.paperSize) ? 1 : 2)) * zoomMultiplier)} 
                    height={Math.round((activeTemplate.barcodeHeight || (activeTemplate.paperSize === 'etiket_40x20' ? 30 : 50)) * zoomMultiplier)} 
                    fontSize={Math.round((activeTemplate.barcodeFontSize || (activeTemplate.paperSize === 'etiket_40x20' ? 8 : 12)) * zoomMultiplier)}
                    margin={0}
                    background="#ffffff"
                  />
                </div>
              );

              // 6-way Image alignment
              const imgPos = activeTemplate.imagePosition || 'top_center';
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
                <div key="img-wrapper" className={`flex w-full px-2.5 ${imgAlignClass}`}>
                  {imgEl}
                </div>
              ) : null;

              const elements = [];
              if (isImageTop) elements.push(wrappedImgEl);
              if (activeTemplate.barcodePosition === 'top') elements.push(barcodeEl);
              elements.push(nameEl, codeEl, customEl, priceEl);
              if (activeTemplate.barcodePosition !== 'top') elements.push(barcodeEl);
              if (isImageBottom) elements.push(wrappedImgEl);

               const filteredElements = elements.filter(Boolean);

              if (activeTemplate.paperSize === 'etiket_ozel') {
                return (
                  <div 
                    ref={labelContainerRef}
                    className="relative w-full h-full select-none touch-none"
                    style={{
                      backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                      backgroundSize: '12px 12px',
                      backgroundColor: '#ffffff',
                      height: '100%',
                      border: '2px dashed #0f766e',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                  >
                    {activeTemplate.showImage && renderDraggableItem('image', 'Ürün Resmi', imgEl)}
                    {activeTemplate.showBarcodeName !== false && renderDraggableItem('name', 'Ürün Adı', nameEl)}
                    {activeTemplate.showBarcodeCode !== false && renderDraggableItem('code', 'Ürün Kodu', codeEl)}
                    {(activeTemplate.showCustomText && activeTemplate.customTextContent) && renderDraggableItem('customText', 'Özel Metin', customEl)}
                    {activeTemplate.showBarcodePrice !== false && renderDraggableItem('price', 'Fiyat', priceEl)}
                    {renderDraggableItem('barcode', 'Barkod Çizgisi', barcodeEl)}
                  </div>
                );
              }

              const alignVal = activeTemplate.barcodeAlignment || 'center';
              const alignmentClass = alignVal === 'left' 
                ? 'items-start text-left pl-2.5 pr-2.5' 
                : alignVal === 'right' 
                  ? 'items-end text-right pl-2.5 pr-2.5' 
                  : 'items-center text-center';

              return (
                <div 
                  className={`flex flex-col justify-center h-full w-full ${alignmentClass}`}
                  style={{ 
                    gap: activeTemplate.barcodeGap !== undefined ? `${activeTemplate.barcodeGap}px` : '4px' 
                  }}
                >
                  {filteredElements}
                </div>
              );
            })() : (() => {
              const style = activeTemplate.designStyle || 'minimal';
              
                            return <TemplatePreviews 
                activeTemplate={activeTemplate}
                companyName={companyName}
                companyAddress={companyAddress}
                companyPhone={companyPhone}
                logoType={logoType}
                logoImageUrl={logoImageUrl}
                
                mockCustomer={mockCustomer}
                mockItems={mockItems}
                calculateTotal={calculateTotal}
                renderPreviewBankDetails={renderPreviewBankDetails}
                renderPreviewSignatureArea={renderPreviewSignatureArea}
              />;
              })()}
          </div>
        </div>
      </div>

      <TemplateSettingsPanel 
        activeTemplateId={activeTemplateId}
        setActiveTemplateId={setActiveTemplateId}
        templates={templates}
        handleCreateNew={handleCreateNew}
        activeTemplate={activeTemplate}
        handleUpdateActiveTemplate={handleUpdateActiveTemplate}
        handleDeleteTemplate={handleDeleteTemplate}
        saveTemplates={saveTemplates}
        setTemplateToDelete={setTemplateToDelete}
      />
            {/* Delete Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-lg border border-slate-200 max-w-sm w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Şablonu Sil</h3>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 mb-6">
                Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
              </p>
              <div className="flex justify-end gap-3">
                <button 
                  onClick={cancelDelete}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition"
                >
                  İptal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition shadow-sm"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


