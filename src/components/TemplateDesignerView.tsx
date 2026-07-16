import { TemplateSettingsPanel } from './templatedesigner/TemplateSettingsPanel';
import { TemplatePreviews } from './templatedesigner/TemplatePreviews';
import { SwitchRow } from './templates/SwitchRow';
import React, { useState, useEffect } from 'react';
import { Save, Plus, Settings, LayoutTemplate, Image as ImageIcon, Barcode as BarcodeIcon, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';

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
  barcodeFormat?: 'CODE128' | 'EAN13';
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
  imagePosition?: 'top' | 'bottom';

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

  const [resizingElement, setResizingElement] = useState<string | null>(null);
  const [resizingCorner, setResizingCorner] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null>(null);
  const resizeInitialPosRef = React.useRef<{x: number, y: number, scale: number} | null>(null);

  useEffect(() => {
    if (!draggingElement && !resizingElement) return;

    const onGlobalMouseMove = (e: MouseEvent) => {
      if (!labelContainerRef.current) return;
      const rect = labelContainerRef.current.getBoundingClientRect();
      
      if (draggingElement) {
        let x = ((e.clientX - rect.left) / rect.width) * 100;
        let y = ((e.clientY - rect.top) / rect.height) * 100;
        
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        const activeT = templates.find(t => t.id === activeTemplateId);
        if (!activeT) return;
        
        if (activeT.snapToGrid !== false) {
          x = Math.round(x / 2.5) * 2.5;
          y = Math.round(y / 2.5) * 2.5;
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
        
        const updated = templates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        setTemplates(updated);
        localStorage.setItem('storm_print_templates', JSON.stringify(updated));
      } else if (resizingElement && resizeInitialPosRef.current && resizingCorner) {
        // Handle resizing based on the corner dragged
        const dx = e.clientX - resizeInitialPosRef.current.x;
        const dy = e.clientY - resizeInitialPosRef.current.y;
        
        let distance = 0;
        if (resizingCorner === 'top-left') {
          distance = -(dx + dy) / 2;
        } else if (resizingCorner === 'top-right') {
          distance = (dx - dy) / 2;
        } else if (resizingCorner === 'bottom-left') {
          distance = (-dx + dy) / 2;
        } else { // bottom-right
          distance = (dx + dy) / 2;
        }
        
        const scaleDelta = distance * 0.01;
        const newScale = Math.max(0.2, Math.min(5, resizeInitialPosRef.current.scale + scaleDelta));
        
        const activeT = templates.find(t => t.id === activeTemplateId);
        if (!activeT) return;
        
        const currentPositions = activeT.customPositions || {};
        const updatedPositions = {
          ...currentPositions,
          [resizingElement]: {
            ...currentPositions[resizingElement],
            scale: parseFloat(newScale.toFixed(2))
          }
        };
        
        const updated = templates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        setTemplates(updated);
        localStorage.setItem('storm_print_templates', JSON.stringify(updated));
      }
    };

    const onGlobalTouchMove = (e: TouchEvent) => {
      if (!labelContainerRef.current || e.touches.length === 0) return;
      const touch = e.touches[0];
      const rect = labelContainerRef.current.getBoundingClientRect();
      
      if (draggingElement) {
        let x = ((touch.clientX - rect.left) / rect.width) * 100;
        let y = ((touch.clientY - rect.top) / rect.height) * 100;
        
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));
        
        const activeT = templates.find(t => t.id === activeTemplateId);
        if (!activeT) return;
        
        if (activeT.snapToGrid !== false) {
          x = Math.round(x / 2.5) * 2.5;
          y = Math.round(y / 2.5) * 2.5;
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
        
        const updated = templates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        setTemplates(updated);
        localStorage.setItem('storm_print_templates', JSON.stringify(updated));
      } else if (resizingElement && resizeInitialPosRef.current && resizingCorner) {
        const dx = touch.clientX - resizeInitialPosRef.current.x;
        const dy = touch.clientY - resizeInitialPosRef.current.y;
        
        let distance = 0;
        if (resizingCorner === 'top-left') {
          distance = -(dx + dy) / 2;
        } else if (resizingCorner === 'top-right') {
          distance = (dx - dy) / 2;
        } else if (resizingCorner === 'bottom-left') {
          distance = (-dx + dy) / 2;
        } else { // bottom-right
          distance = (dx + dy) / 2;
        }
        
        const scaleDelta = distance * 0.01;
        const newScale = Math.max(0.2, Math.min(5, resizeInitialPosRef.current.scale + scaleDelta));
        
        const activeT = templates.find(t => t.id === activeTemplateId);
        if (!activeT) return;
        
        const currentPositions = activeT.customPositions || {};
        const updatedPositions = {
          ...currentPositions,
          [resizingElement]: {
            ...currentPositions[resizingElement],
            scale: parseFloat(newScale.toFixed(2))
          }
        };
        
        const updated = templates.map(t => t.id === activeTemplateId ? { ...t, customPositions: updatedPositions } : t);
        setTemplates(updated);
        localStorage.setItem('storm_print_templates', JSON.stringify(updated));
      }
    };

    const onGlobalMouseUp = () => {
      setDraggingElement(null);
      setResizingElement(null);
      setResizingCorner(null);
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
  }, [draggingElement, resizingElement, activeTemplateId, templates]);

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
    const padVal = activeTemplate && activeTemplate.barcodePadding !== undefined ? `${activeTemplate.barcodePadding}px` : '8px';
    switch (size) {
      case 'a4': return { maxWidth: '794px', aspectRatio: '1 / 1.414', padding: '40px' };
      case 'a4_yatay': return { maxWidth: '1123px', aspectRatio: '1.414 / 1', padding: '40px' };
      case 'a5': return { maxWidth: '559px', aspectRatio: '1 / 1.414', padding: '24px' };
      case 'a5_yatay': return { maxWidth: '794px', aspectRatio: '1.414 / 1', padding: '24px' };
      case 'termal_80': return { maxWidth: '302px', aspectRatio: 'auto', minHeight: '400px', padding: '12px' };
      case 'termal_58': return { maxWidth: '219px', aspectRatio: 'auto', minHeight: '300px', padding: '8px' };
      case 'etiket_80x50': return { maxWidth: '302px', aspectRatio: '80 / 50', padding: '12px', minHeight: 'auto' };
      case 'etiket_60x40': return { maxWidth: '226px', aspectRatio: '60 / 40', padding: '8px', minHeight: 'auto' };
      case 'etiket_40x60': return { maxWidth: '151px', aspectRatio: '40 / 60', padding: '8px', minHeight: 'auto' };
      case 'etiket_40x30': return { maxWidth: '151px', aspectRatio: '40 / 30', padding: '8px', minHeight: 'auto' };
      case 'etiket_40x20': return { maxWidth: '151px', aspectRatio: '40 / 20', padding: '8px', minHeight: 'auto' };
      case 'etiket_ozel': {
        const w = activeTemplate.customWidthCm || 6;
        const h = activeTemplate.customHeightCm || 4;
        return { 
          maxWidth: `${w * 37.8}px`, 
          aspectRatio: `${w} / ${h}`, 
          padding: `${activeTemplate.barcodePadding !== undefined ? activeTemplate.barcodePadding : 8}px`, 
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
    const defaultPositions: Record<string, { x: number; y: number; scale?: number }> = {
      image: { x: 50, y: 15, scale: 1 },
      name: { x: 50, y: 35, scale: 1 },
      code: { x: 50, y: 50, scale: 1 },
      customText: { x: 50, y: 62, scale: 1 },
      price: { x: 50, y: 74, scale: 1 },
      barcode: { x: 50, y: 88, scale: 1 }
    };
    const pos = positions[key] || defaultPositions[key] || { x: 50, y: 50, scale: 1 };
    const isDragging = draggingElement === key;
    const isResizing = resizingElement === key;
    
    return (
      <div
        key={key}
        className={`absolute group select-none p-1.5 rounded-lg border border-transparent transition-all duration-100 ${
          isDragging 
            ? 'cursor-grabbing border-teal-500 bg-teal-50/70 shadow-lg z-50 ring-2 ring-teal-500/20' 
            : isResizing 
              ? 'border-teal-500 bg-teal-50/50 z-50'
              : 'cursor-grab hover:border-dashed hover:border-teal-400 hover:bg-slate-50/50 hover:shadow-sm'
        }`}
        style={{
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          transform: `translate(-50%, -50%) scale(${pos.scale || 1})`,
          whiteSpace: 'nowrap',
          width: 'max-content'
        }}
      >
        <div 
          className="absolute inset-0 w-full h-full"
          onMouseDown={(e) => {
            if (resizingElement) return;
            e.preventDefault();
            setDraggingElement(key);
          }}
          onTouchStart={() => {
            if (resizingElement) return;
            setDraggingElement(key);
          }}
        />

        {/* Label Badge */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-teal-600 text-white text-[9px] font-semibold px-2 py-0.5 rounded shadow-sm pointer-events-none transition-opacity duration-150 z-50 flex items-center gap-1">
          <span>{label}</span>
          <span className="text-[8px] opacity-75">{pos.x}%, {pos.y}%</span>
        </div>

        {/* Resize Handles (Four Corners) */}
        {[
          { name: 'top-left', cursor: 'nwse-resize', class: '-top-2 -left-2' },
          { name: 'top-right', cursor: 'nesw-resize', class: '-top-2 -right-2' },
          { name: 'bottom-left', cursor: 'nesw-resize', class: '-bottom-2 -left-2' },
          { name: 'bottom-right', cursor: 'nwse-resize', class: '-bottom-2 -right-2' }
        ].map((corner) => (
          <div 
            key={corner.name}
            className={`absolute ${corner.class} w-4 h-4 bg-white border-2 border-teal-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-sm`}
            style={{ cursor: corner.cursor }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setResizingElement(key);
              setResizingCorner(corner.name as any);
              resizeInitialPosRef.current = { x: e.clientX, y: e.clientY, scale: pos.scale || 1 };
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              if (e.touches.length > 0) {
                setResizingElement(key);
                setResizingCorner(corner.name as any);
                resizeInitialPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, scale: pos.scale || 1 };
              }
            }}
          />
        ))}
        
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
        <div className="bg-slate-800 p-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider z-10 shrink-0" style={{ color: '#ffffff' }}>
          <div className="flex items-center gap-2" style={{ color: '#ffffff' }}>
            <LayoutTemplate size={16} style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Canlı Önizleme</span>
          </div>
          <div className="flex items-center gap-2">
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
              const imgSize = activeTemplate.barcodeImageSize || 64;
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
                    fontSize: activeTemplate.barcodeNameSize ? `${activeTemplate.barcodeNameSize}px` : undefined,
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
                    fontSize: activeTemplate.barcodeCodeSize ? `${activeTemplate.barcodeCodeSize}px` : undefined,
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
                    fontSize: activeTemplate.barcodeCustomTextSize ? `${activeTemplate.barcodeCustomTextSize}px` : undefined,
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
                    fontSize: activeTemplate.barcodePriceSize ? `${activeTemplate.barcodePriceSize}px` : undefined,
                  }}
                >
                  125,00 ₺
                </div>
              ) : null;
              
              const barcodeEl = (
                <div key="barcode" className="flex justify-center barcode-svg-container w-full max-w-full overflow-visible">
                  <Barcode renderer="img" 
                    value={activeTemplate.barcodeFormat === 'EAN13' ? "8691234567890" : "STK-10001"} 
                    format={activeTemplate.barcodeFormat || "CODE128"} 
                    width={activeTemplate.barcodeWidthScale || (['etiket_40x20', 'etiket_40x60'].includes(activeTemplate.paperSize) ? 1 : 2)} 
                    height={activeTemplate.barcodeHeight || (activeTemplate.paperSize === 'etiket_40x20' ? 30 : 50)} 
                    fontSize={activeTemplate.barcodeFontSize || (activeTemplate.paperSize === 'etiket_40x20' ? 8 : 12)}
                    margin={0}
                    background="#ffffff"
                  />
                </div>
              );

              const elements = [];
              if (activeTemplate.imagePosition === 'top') elements.push(imgEl);
              if (activeTemplate.barcodePosition === 'top') elements.push(barcodeEl);
              elements.push(nameEl, codeEl, customEl, priceEl);
              if (activeTemplate.barcodePosition !== 'top') elements.push(barcodeEl);
              if (activeTemplate.imagePosition === 'bottom') elements.push(imgEl);

               const filteredElements = elements.filter(Boolean);

              if (activeTemplate.paperSize === 'etiket_ozel') {
                return (
                  <div 
                    ref={labelContainerRef}
                    className="relative w-full h-full select-none"
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


