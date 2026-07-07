import React, { useState, useEffect } from 'react';
import { Save, Plus, FileText, Settings, LayoutTemplate, Type, Image as ImageIcon, FileSignature, Barcode as BarcodeIcon, Trash2, Upload, Printer, Check } from 'lucide-react';
import Barcode from 'react-barcode';

export interface PrintTemplateConfig {
  id: string;
  name: string;
  type: 'satis' | 'alis' | 'iade' | 'teklif' | 'barkod';
  documentTitle: string;
  paperSize: 'a4' | 'a4_yatay' | 'a5' | 'a5_yatay' | 'termal_80' | 'termal_58' | 'etiket_40x30' | 'etiket_60x40' | 'etiket_80x50' | 'etiket_40x20' | 'etiket_40x60';
  textSize?: 'small' | 'normal' | 'large';
  
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

  // Custom Text
  showCustomText?: boolean;
  customTextContent?: string;
}

const DEFAULT_TEMPLATES: PrintTemplateConfig[] = [
  {
    id: 'default-satis',
    name: 'Standart Satış Faturası',
    type: 'satis',
    documentTitle: 'SATIŞ FATURASI',
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
  },
  {
    id: 'default-teklif',
    name: 'Standart Teklif Formu',
    type: 'teklif',
    documentTitle: 'TEKLİF FORMU',
    paperSize: 'a4',
    showLogo: true,
    showCompanyAddress: true,
    showValidityDate: true,
    showFooter: true,
    showCustomerBalance: false,
    showProductImage: true,
    showDiscountRate: true,
    showExVatAmount: false,
    showVatRate: false,
    showUnitPrice: true,
  },
  {
    id: 'default-barkod',
    name: 'Standart Barkod Etiketi',
    type: 'barkod',
    documentTitle: 'BARKOD ETİKETİ',
    paperSize: 'etiket_40x30',
    showLogo: false,
    showCompanyAddress: false,
    showValidityDate: false,
    showFooter: false,
    showCustomerBalance: false,
    showProductImage: false,
    showDiscountRate: false,
    showExVatAmount: false,
    showVatRate: false,
    showUnitPrice: false,
    barcodeFormat: 'CODE128',
    showBarcodePrice: true,
    showBarcodeName: true,
    showBarcodeCode: true,
    showCustomText: false,
    customTextContent: '',
  },
  {
    id: "default-barkod-40x60",
    name: "Barkod Etiketi (40x60)",
    type: "barkod",
    documentTitle: "BARKOD ETİKETİ 40x60",
    paperSize: "etiket_40x60",
    showLogo: false,
    showCompanyAddress: false,
    showValidityDate: false,
    showFooter: false,
    showCustomerBalance: false,
    showProductImage: false,
    showDiscountRate: false,
    showExVatAmount: false,
    showVatRate: false,
    showUnitPrice: false,
    barcodeFormat: "CODE128",
    showBarcodePrice: true,
    showBarcodeName: true,
    showBarcodeCode: true,
    showCustomText: false,
    customTextContent: '',
  }
];

export default function TemplateDesignerView() {
  const [templates, setTemplates] = useState<PrintTemplateConfig[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');

  const [companyName, setCompanyName] = useState('Firma Adı');
  const [companyAddress, setCompanyAddress] = useState('Firma Adresi');
  const [companyPhone, setCompanyPhone] = useState('0555 555 55 55');
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoImageUrl, setLogoImageUrl] = useState('');
  const [printSettingsSuccess, setPrintSettingsSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load templates
    const saved = localStorage.getItem('storm_print_templates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setTemplates(parsed);
          setActiveTemplateId(parsed[0].id);
        } else {
          setTemplates(DEFAULT_TEMPLATES);
          setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
        }
      } catch (e) {
        console.error('Failed to parse templates', e);
        setTemplates(DEFAULT_TEMPLATES);
        setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
      }
    } else {
      setTemplates(DEFAULT_TEMPLATES);
      setActiveTemplateId(DEFAULT_TEMPLATES[0].id);
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

  const handleSaveCompanySettings = () => {
    const existing = localStorage.getItem('storm_muhasebe_print_settings');
    let parsed = {};
    if (existing) {
      try { parsed = JSON.parse(existing); } catch(e) {}
    }
    
    const newSettings = {
      ...parsed,
      companyName,
      companyAddress,
      companyPhone,
      logoType,
      logoImageUrl
    };
    
    localStorage.setItem('storm_muhasebe_print_settings', JSON.stringify(newSettings));
    setPrintSettingsSuccess('Firma bilgileri başarıyla kaydedildi.');
    setTimeout(() => setPrintSettingsSuccess(null), 3000);
  };

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

  if (!activeTemplate) return null;

  // Mock Data for Preview
  const mockCompany = {
    name: 'Örnek Teknoloji Ltd. Şti.',
    address: 'Teknopark İstanbul, Pendik / İstanbul',
    phone: '0850 123 45 67'
  };

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

  const getPaperDimensions = (size: string) => {
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
      default: return size;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[600px]">
      {/* LEFT COLUMN: LIVE PREVIEW (60%) */}
      <div className="lg:w-[60%] flex flex-col bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative">
        <div className="bg-slate-800 text-white p-3 flex justify-between items-center text-xs font-bold uppercase tracking-wider z-10 shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={16} />
            Canlı Önizleme
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-slate-700 px-2 py-1 rounded text-[10px]">
              {getPaperLabel(activeTemplate.paperSize)}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center">
          {/* Paper Container */}
          <div 
            className="bg-white shadow-2xl transition-all duration-300 origin-top shrink-0 relative flex flex-col"
            style={{
              width: '100%',
              ...getPaperDimensions(activeTemplate.paperSize)
            }}
          >
            {activeTemplate.type === 'barkod' ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-2">
                {activeTemplate.showImage && (
                  <div className="w-16 h-16 bg-slate-200 border border-slate-300 rounded mb-1 flex items-center justify-center shrink-0">
                    <ImageIcon size={24} className="text-slate-400" />
                  </div>
                )}
                {activeTemplate.showBarcodeName && (
                  <div className="font-bold text-slate-900 text-[10px] md:text-xs mb-1 w-full px-1 text-center whitespace-nowrap truncate leading-tight">
                    ÖRNEK ÜRÜN ADI - SİYAH
                  </div>
                )}
                {activeTemplate.showBarcodeCode !== false && (
                  <div className="font-medium text-slate-700 text-[8px] md:text-[10px] mb-0.5 w-full px-1 text-center whitespace-nowrap truncate leading-tight">
                    STK-10001
                  </div>
                )}
                {activeTemplate.showCustomText && activeTemplate.customTextContent && (
                  <div className="font-medium text-slate-800 text-[9px] md:text-[11px] mb-0.5 w-full px-1 text-center whitespace-nowrap truncate leading-tight">
                    {activeTemplate.customTextContent}
                  </div>
                )}
                {activeTemplate.showBarcodePrice && (
                  <div className="font-black text-slate-900 text-sm md:text-base mb-1">
                    125,00 ₺
                  </div>
                )}
                <div className="flex justify-center w-full mt-1 barcode-svg-container">
                  <Barcode 
                    value={activeTemplate.barcodeFormat === 'EAN13' ? "8691234567890" : "STK-10001"} 
                    format={activeTemplate.barcodeFormat || "CODE128"} 
                    width={['etiket_40x20', 'etiket_40x60'].includes(activeTemplate.paperSize) ? 1 : 2} 
                    height={activeTemplate.paperSize === 'etiket_40x20' ? 30 : 50} 
                    fontSize={activeTemplate.paperSize === 'etiket_40x20' ? 8 : 12}
                    margin={0}
                    background="transparent"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="max-w-[50%]">
                    {activeTemplate.showLogo && (
                      <div className="mb-3">
                        {logoType === 'image' && logoImageUrl ? (
                          <img src={logoImageUrl} alt={companyName} className="h-12 max-w-[200px] object-contain" />
                        ) : (
                          <h2 className="text-2xl font-extrabold tracking-tight uppercase text-zinc-900 leading-none">{companyName || 'LOGO'}</h2>
                        )}
                      </div>
                    )}
                    {activeTemplate.showCompanyAddress && (
                      <div className="text-[10px] text-slate-600 leading-tight whitespace-pre-line">
                        {!activeTemplate.showLogo && <strong className="text-sm text-slate-900 block mb-1">{companyName}</strong>}
                        <p>{companyAddress}</p>
                        <p className="mt-1 font-bold">Tel: {companyPhone}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                      {activeTemplate.documentTitle || 'BELGE'}
                    </h1>
                    <div className="text-xs text-slate-500 mt-2">
                      Tarih: {new Date().toLocaleDateString('tr-TR')}
                      <br />
                      Belge No: INV-{Math.floor(Math.random() * 10000)}
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex justify-between mb-8">
                  <div className="text-sm">
                    <div className="font-bold text-slate-900 mb-1">Sayın,</div>
                    <div className="text-slate-700">{mockCustomer.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{mockCustomer.address}</div>
                  </div>
                  <div className="text-right text-xs">
                    {activeTemplate.showValidityDate && (
                      <div className="text-slate-600 mb-1">
                        Geçerlilik Tarihi: <span className="font-bold">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Table */}
                <table className="w-full text-left text-xs mb-8">
                  <thead className="bg-slate-100 border-y border-slate-300">
                    <tr>
                      <th className="py-2 px-2 font-bold text-slate-700">Ürün / Hizmet</th>
                      <th className="py-2 px-2 font-bold text-slate-700 text-center">Miktar</th>
                      {activeTemplate.showUnitPrice && <th className="py-2 px-2 font-bold text-slate-700 text-right">Birim Fiyat</th>}
                      {activeTemplate.showDiscountRate && <th className="py-2 px-2 font-bold text-slate-700 text-center">İndirim</th>}
                      {activeTemplate.showVatRate && <th className="py-2 px-2 font-bold text-slate-700 text-center">KDV</th>}
                      {activeTemplate.showExVatAmount && <th className="py-2 px-2 font-bold text-slate-700 text-right">KDV Hariç</th>}
                      <th className="py-2 px-2 font-bold text-slate-700 text-right">Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockItems.map((item, idx) => {
                      const discountedPrice = item.price * (1 - item.discount / 100);
                      const withVat = discountedPrice * (1 + item.vat / 100);
                      const total = withVat * item.qty;
                      
                      return (
                        <tr key={idx} className="border-b border-slate-100">
                          <td className="py-2 px-2 text-slate-800 flex items-center gap-2">
                            {activeTemplate.showProductImage && (
                              <div className="w-6 h-6 bg-slate-200 rounded shrink-0"></div>
                            )}
                            {item.name}
                          </td>
                          <td className="py-2 px-2 text-slate-600 text-center">{item.qty} Adet</td>
                          {activeTemplate.showUnitPrice && <td className="py-2 px-2 text-slate-600 text-right">{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>}
                          {activeTemplate.showDiscountRate && <td className="py-2 px-2 text-slate-600 text-center">%{item.discount}</td>}
                          {activeTemplate.showVatRate && <td className="py-2 px-2 text-slate-600 text-center">%{item.vat}</td>}
                          {activeTemplate.showExVatAmount && <td className="py-2 px-2 text-slate-600 text-right">{(discountedPrice * item.qty).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>}
                          <td className="py-2 px-2 font-bold text-slate-900 text-right">{total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-between mb-12">
                  <div className="w-1/2 flex flex-col justify-end">
                    {activeTemplate.showCustomerBalance && (
                      <div className="text-xs text-slate-600 border border-slate-200 p-3 rounded bg-slate-50 inline-block w-max">
                        Güncel Bakiye: <span className="font-bold text-slate-900">{mockCustomer.balance}</span>
                      </div>
                    )}
                  </div>
                  <div className="w-64">
                    <div className="flex justify-between py-1 text-sm border-b border-slate-200 font-bold">
                      <span className="text-slate-900">Genel Toplam:</span>
                      <span className="text-slate-900">{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {activeTemplate.showFooter && (
                  <div className="absolute bottom-10 left-10 right-10 border-t border-slate-200 pt-4 text-[10px] text-slate-500 text-center">
                    Bizi tercih ettiğiniz için teşekkür ederiz. Bu belge sistem tarafından otomatik oluşturulmuştur.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: SETTINGS PANEL (40%) */}
      <div className="lg:w-[40%] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
          <div className="flex items-center gap-2">
            <select
              value={activeTemplateId}
              onChange={(e) => setActiveTemplateId(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button 
              onClick={handleDeleteTemplate}
              disabled={templates.length <= 1}
              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Şablonu Sil"
            >
              <Trash2 size={16} />
            </button>
          </div>
          <button 
            onClick={handleCreateNew}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg text-xs font-bold transition-colors"
          >
            <Plus size={14} /> Yeni Şablon
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-8">
          {/* Temel Ayarlar */}
          <div className="space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
              <Settings size={14} className="text-teal-600" /> Temel Ayarlar
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Şablon Adı</label>
                <input 
                  type="text" 
                  value={activeTemplate.name}
                  onChange={(e) => handleUpdateActiveTemplate({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Belge Tipi</label>
                  <select 
                    value={activeTemplate.type}
                    onChange={(e) => handleUpdateActiveTemplate({ type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="satis">Satış Faturası</option>
                    <option value="alis">Alış Faturası</option>
                    <option value="iade">İade Faturası</option>
                    <option value="teklif">Teklif Formu</option>
                    <option value="barkod">Barkod Etiketi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kağıt Boyutu</label>
                  <select 
                    value={activeTemplate.paperSize}
                    onChange={(e) => handleUpdateActiveTemplate({ paperSize: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="a4">A4 Dikey</option>
                    <option value="a4_yatay">A4 Yatay</option>
                    <option value="a5">A5 Dikey</option>
                    <option value="a5_yatay">A5 Yatay</option>
                    <option value="termal_80">Termal Rulo (80mm)</option>
                    <option value="termal_58">Termal Rulo (58mm)</option>
                    <option value="etiket_80x50">Barkod Etiketi (80x50mm)</option>
                    <option value="etiket_60x40">Barkod Etiketi (60x40mm)</option>
                    <option value="etiket_40x60">Barkod Etiketi (40x60mm)</option>
                    <option value="etiket_40x30">Barkod Etiketi (40x30mm)</option>
                    <option value="etiket_40x20">Barkod Etiketi (40x20mm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Yazı Boyutu (Çıktı)</label>
                  <select 
                    value={activeTemplate.textSize || 'normal'}
                    onChange={(e) => handleUpdateActiveTemplate({ textSize: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="small">Küçük (%85)</option>
                    <option value="normal">Normal (%100)</option>
                    <option value="large">Büyük (%115)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Belge Başlığı (Kağıtta Görünen)</label>
                <input 
                  type="text" 
                  value={activeTemplate.documentTitle}
                  onChange={(e) => handleUpdateActiveTemplate({ documentTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="Örn: SATIŞ FATURASI"
                />
              </div>
            </div>
          </div>

          {/* Ayarlar (Şartlı Gösterim) */}
          {activeTemplate.type === 'barkod' ? (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                <BarcodeIcon size={14} className="text-teal-600" /> Barkod Etiketi Ayarları
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Barkod Formatı</label>
                  <select 
                    value={activeTemplate.barcodeFormat || 'CODE128'}
                    onChange={(e) => handleUpdateActiveTemplate({ barcodeFormat: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    <option value="CODE128">Code 128 (Genel Kullanım)</option>
                    <option value="EAN13">EAN-13 (Perakende - 13 Haneli)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <SwitchRow 
                    label="Ürün Adı Görünsün" 
                    checked={activeTemplate.showBarcodeName !== false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showBarcodeName: v })} 
                  />
                  <SwitchRow 
                    label="Ürün Kodu Görünsün" 
                    checked={activeTemplate.showBarcodeCode !== false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showBarcodeCode: v })} 
                  />
                  <SwitchRow 
                    label="Satış Fiyatı Görünsün" 
                    checked={activeTemplate.showBarcodePrice !== false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showBarcodePrice: v })} 
                  />
                  <SwitchRow 
                    label="Ürün Resmi Görünsün" 
                    checked={activeTemplate.showImage || false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showImage: v })} 
                  />
                  <SwitchRow 
                    label="Özel Metin Görünsün" 
                    checked={activeTemplate.showCustomText || false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showCustomText: v })} 
                  />
                  {activeTemplate.showCustomText && (
                    <div className="pt-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Özel Metin İçeriği</label>
                      <input 
                        type="text" 
                        value={activeTemplate.customTextContent || ''}
                        onChange={(e) => handleUpdateActiveTemplate({ customTextContent: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        placeholder="Örn: %100 Pamuk, Yerli Üretim vs."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Genel Görünüm Ayarları */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ImageIcon size={14} className="text-teal-600" /> Genel Görünüm Seçenekleri
                </h3>
                
                <div className="space-y-2">
                  <SwitchRow 
                    label="Firma Logosu Görünsün" 
                    checked={activeTemplate.showLogo} 
                    onChange={(v) => handleUpdateActiveTemplate({ showLogo: v })} 
                  />
                  <SwitchRow 
                    label="Firma Adres Bilgileri Görünsün" 
                    checked={activeTemplate.showCompanyAddress} 
                    onChange={(v) => handleUpdateActiveTemplate({ showCompanyAddress: v })} 
                  />
                  <SwitchRow 
                    label="Geçerlilik Tarihi Görünsün (Teklifler için)" 
                    checked={activeTemplate.showValidityDate} 
                    onChange={(v) => handleUpdateActiveTemplate({ showValidityDate: v })} 
                  />
                  <SwitchRow 
                    label="Müşteri Güncel Bakiyesi Görünsün" 
                    checked={activeTemplate.showCustomerBalance} 
                    onChange={(v) => handleUpdateActiveTemplate({ showCustomerBalance: v })} 
                  />
                  <SwitchRow 
                    label="Alt Bilgi / Açıklama Görünsün" 
                    checked={activeTemplate.showFooter} 
                    onChange={(v) => handleUpdateActiveTemplate({ showFooter: v })} 
                  />
                </div>
              </div>

              {/* Kolon Ayarları */}
              <div className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <LayoutTemplate size={14} className="text-teal-600" /> Tablo Sütunları
                </h3>
                
                <div className="space-y-2">
                  <SwitchRow 
                    label="Ürün Resmi Sütunu" 
                    checked={activeTemplate.showProductImage} 
                    onChange={(v) => handleUpdateActiveTemplate({ showProductImage: v })} 
                  />
                  <SwitchRow 
                    label="Birim Fiyat Sütunu" 
                    checked={activeTemplate.showUnitPrice} 
                    onChange={(v) => handleUpdateActiveTemplate({ showUnitPrice: v })} 
                  />
                  <SwitchRow 
                    label="İndirim Oranı Sütunu" 
                    checked={activeTemplate.showDiscountRate} 
                    onChange={(v) => handleUpdateActiveTemplate({ showDiscountRate: v })} 
                  />
                  <SwitchRow 
                    label="KDV Oranı Sütunu" 
                    checked={activeTemplate.showVatRate} 
                    onChange={(v) => handleUpdateActiveTemplate({ showVatRate: v })} 
                  />
                  <SwitchRow 
                    label="KDV Hariç Tutar Sütunu" 
                    checked={activeTemplate.showExVatAmount} 
                    onChange={(v) => handleUpdateActiveTemplate({ showExVatAmount: v })} 
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0">
          <button 
            onClick={() => {
              saveTemplates(templates);
              const btn = document.getElementById('template-save-btn');
              if (btn) {
                const originalText = btn.innerHTML;
                btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Şablon Kaydedildi';
                btn.classList.replace('bg-teal-600', 'bg-emerald-600');
                btn.classList.replace('hover:bg-teal-700', 'hover:bg-emerald-700');
                setTimeout(() => {
                  btn.innerHTML = originalText;
                  btn.classList.replace('bg-emerald-600', 'bg-teal-600');
                  btn.classList.replace('hover:bg-emerald-700', 'hover:bg-teal-700');
                }, 2000);
              }
            }}
            id="template-save-btn"
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            <Save size={16} />
            <span>Şablonu Kaydet</span>
          </button>
        </div>
      </div>

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

function SwitchRow({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
      <span className="text-sm text-slate-700 font-medium">{label}</span>
      <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${checked ? 'bg-teal-500' : 'bg-slate-300'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-1'}`} />
      </div>
      {/* Hidden checkbox for accessibility */}
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}
