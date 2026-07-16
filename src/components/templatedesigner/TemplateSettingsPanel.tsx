import React from 'react';
import { Save, Plus, Trash2, LayoutTemplate, Settings, Image as ImageIcon, Barcode as BarcodeIcon } from 'lucide-react';
import { SwitchRow } from '../templates/SwitchRow';
import { PrintTemplateConfig } from '../TemplateDesignerView';
export function TemplateSettingsPanel({ activeTemplateId, setActiveTemplateId, templates, handleCreateNew, activeTemplate, handleUpdateActiveTemplate, handleDeleteTemplate, setTemplateToDelete, saveTemplates }: any) {
  return (
    <>
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
                    onChange={(e) => {
                      const newSize = e.target.value as any;
                      const updates: Partial<PrintTemplateConfig> = { paperSize: newSize };
                      if (newSize === 'etiket_ozel') {
                        updates.customWidthCm = activeTemplate.customWidthCm || 6;
                        updates.customHeightCm = activeTemplate.customHeightCm || 4;
                        if (!activeTemplate.customPositions) {
                          updates.customPositions = {
                            image: { x: 50, y: 15 },
                            name: { x: 50, y: 35 },
                            code: { x: 50, y: 50 },
                            customText: { x: 50, y: 62 },
                            price: { x: 50, y: 74 },
                            barcode: { x: 50, y: 88 }
                          };
                        }
                      }
                      handleUpdateActiveTemplate(updates);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                  >
                    {activeTemplate.type !== 'barkod' ? (
                      <>
                        <option value="a4">A4 Dikey</option>
                        <option value="a4_yatay">A4 Yatay</option>
                        <option value="a5">A5 Dikey</option>
                        <option value="a5_yatay">A5 Yatay</option>
                        <option value="termal_80">Termal Rulo (80mm)</option>
                        <option value="termal_58">Termal Rulo (58mm)</option>
                      </>
                    ) : (
                      <>
                        <option value="etiket_80x50">Barkod Etiketi (80x50mm)</option>
                        <option value="etiket_60x40">Barkod Etiketi (60x40mm)</option>
                        <option value="etiket_40x60">Barkod Etiketi (40x60mm)</option>
                        <option value="etiket_40x30">Barkod Etiketi (40x30mm)</option>
                        <option value="etiket_40x20">Barkod Etiketi (40x20mm)</option>
                        <option value="etiket_ozel">Özel Boyutlandırma (cm)</option>
                      </>
                    )}
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

              {activeTemplate.type !== 'barkod' && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Şablon Tasarım Stili (5 Seçenekli)</span>
                    <span className="text-[9px] font-bold text-teal-600 px-1.5 py-0.5 bg-teal-50 rounded uppercase">Aktif</span>
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'minimal', name: 'Minimalist', desc: 'Sade & Ferah' },
                      { id: 'corporate', name: 'Kurumsal', desc: 'Renkli & Blok' },
                      { id: 'modern', name: 'Modern', desc: 'Asimetrik' },
                      { id: 'elegant', name: 'Zarif', desc: 'Serif & Klas' },
                      { id: 'classic', name: 'Klasik', desc: 'Geleneksel' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => handleUpdateActiveTemplate({ designStyle: style.id as any })}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          (activeTemplate.designStyle || 'minimal') === style.id
                            ? 'bg-teal-50 border-teal-500 text-teal-950 ring-1 ring-teal-400 font-extrabold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <div className="text-[9px] truncate">{style.name}</div>
                        <div className="text-[7px] text-slate-400 mt-0.5 leading-none font-medium truncate">{style.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  <div className="grid grid-cols-3 gap-3 pt-2 pb-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" title="Çizgi Kalınlığı Çarpanı">Çizgi Kalınlığı (En)</label>
                      <input 
                        type="number" 
                        min="1" max="5" step="0.5"
                        value={activeTemplate.barcodeWidthScale || (['etiket_40x20', 'etiket_40x60'].includes(activeTemplate.paperSize) ? 1 : 2)}
                        onChange={(e) => handleUpdateActiveTemplate({ barcodeWidthScale: parseFloat(e.target.value) || 1 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" title="Barkod Yüksekliği (px)">Barkod Yüksekliği (Boy)</label>
                      <input 
                        type="number" 
                        min="20" max="200" step="5"
                        value={activeTemplate.barcodeHeight || (activeTemplate.paperSize === 'etiket_40x20' ? 30 : 50)}
                        onChange={(e) => handleUpdateActiveTemplate({ barcodeHeight: parseInt(e.target.value) || 50 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" title="Yazı Boyutu (Eğer yazdırılıyorsa)">Yazı Boyutu</label>
                      <input 
                        type="number" 
                        min="8" max="36" step="1"
                        value={activeTemplate.barcodeFontSize || (activeTemplate.paperSize === 'etiket_40x20' ? 8 : 12)}
                        onChange={(e) => handleUpdateActiveTemplate({ barcodeFontSize: parseInt(e.target.value) || 12 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 pb-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Barkod Çizgisi Konumu</label>
                      <select 
                        value={activeTemplate.barcodePosition || 'bottom'}
                        onChange={(e) => handleUpdateActiveTemplate({ barcodePosition: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="bottom">Alt Kısımda</option>
                        <option value="top">Üst Kısımda (Başta)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Yatay Hizalama</label>
                      <select 
                        value={activeTemplate.barcodeAlignment || 'center'}
                        onChange={(e) => handleUpdateActiveTemplate({ barcodeAlignment: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="left">Sola Hizala</option>
                        <option value="center">Ortala</option>
                        <option value="right">Sağa Hizala</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-2 pb-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ürün Resmi Konumu</label>
                      <select 
                        value={activeTemplate.imagePosition || 'top'}
                        onChange={(e) => handleUpdateActiveTemplate({ imagePosition: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        <option value="top">Üst Kısımda</option>
                        <option value="bottom">Alt Kısımda (Sonda)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-100 space-y-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">İçerik ve Taslak Boyutları</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {activeTemplate.showImage && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Resim Boyutu (px)</label>
                          <input 
                            type="number" 
                            min="20" max="200" step="5"
                            value={activeTemplate.barcodeImageSize || 64}
                            onChange={(e) => handleUpdateActiveTemplate({ barcodeImageSize: parseInt(e.target.value) || 64 })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      )}
                      
                      {activeTemplate.showBarcodeName && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ürün Adı Boyutu (px)</label>
                          <input 
                            type="number" 
                            min="8" max="36" step="1"
                            value={activeTemplate.barcodeNameSize || 12}
                            onChange={(e) => handleUpdateActiveTemplate({ barcodeNameSize: parseInt(e.target.value) || 12 })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      )}

                      {activeTemplate.showBarcodeCode !== false && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ürün Kodu Boyutu (px)</label>
                          <input 
                            type="number" 
                            min="8" max="24" step="1"
                            value={activeTemplate.barcodeCodeSize || 10}
                            onChange={(e) => handleUpdateActiveTemplate({ barcodeCodeSize: parseInt(e.target.value) || 10 })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      )}

                      {activeTemplate.showBarcodePrice && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Fiyat Boyutu (px)</label>
                          <input 
                            type="number" 
                            min="8" max="48" step="1"
                            value={activeTemplate.barcodePriceSize || 14}
                            onChange={(e) => handleUpdateActiveTemplate({ barcodePriceSize: parseInt(e.target.value) || 14 })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      )}

                      {activeTemplate.showCustomText && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Özel Metin Boyutu (px)</label>
                          <input 
                            type="number" 
                            min="8" max="24" step="1"
                            value={activeTemplate.barcodeCustomTextSize || 11}
                            onChange={(e) => handleUpdateActiveTemplate({ barcodeCustomTextSize: parseInt(e.target.value) || 11 })}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dış Kenar Boşluğu (px)</label>
                        <input 
                          type="number" 
                          min="0" max="40" step="1"
                          value={activeTemplate.barcodePadding !== undefined ? activeTemplate.barcodePadding : 8}
                          onChange={(e) => handleUpdateActiveTemplate({ barcodePadding: parseInt(e.target.value) === 0 ? 0 : (parseInt(e.target.value) || 8) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Öğeler Arası Boşluk (px)</label>
                        <input 
                          type="number" 
                          min="0" max="30" step="1"
                          value={activeTemplate.barcodeGap !== undefined ? activeTemplate.barcodeGap : 4}
                          onChange={(e) => handleUpdateActiveTemplate({ barcodeGap: parseInt(e.target.value) === 0 ? 0 : (parseInt(e.target.value) || 4) })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>

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

                  {activeTemplate.paperSize === 'etiket_ozel' && (
                    <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-4 pt-4 mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">MİLİMETRİK BOYUTLANDIRMA (CM)</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateActiveTemplate({
                              customPositions: {
                                image: { x: 50, y: 15 },
                                name: { x: 50, y: 35 },
                                code: { x: 50, y: 50 },
                                customText: { x: 50, y: 62 },
                                price: { x: 50, y: 74 },
                                barcode: { x: 50, y: 88 }
                              }
                            });
                          }}
                          className="text-[10px] font-bold text-teal-600 hover:text-teal-800 transition-colors bg-white px-2.5 py-1 rounded-lg border border-teal-200/60 shadow-xs"
                        >
                          Hizalamaları Sıfırla
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Etiket Eni (cm)</label>
                          <input 
                            type="number" 
                            min="1" max="25" step="0.1"
                            value={activeTemplate.customWidthCm || 6}
                            onChange={(e) => handleUpdateActiveTemplate({ customWidthCm: parseFloat(e.target.value) || 6 })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Etiket Boyu (cm)</label>
                          <input 
                            type="number" 
                            min="1" max="25" step="0.1"
                            value={activeTemplate.customHeightCm || 4}
                            onChange={(e) => handleUpdateActiveTemplate({ customHeightCm: parseFloat(e.target.value) || 4 })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="snap-to-grid"
                          checked={activeTemplate.snapToGrid !== false}
                          onChange={(e) => handleUpdateActiveTemplate({ snapToGrid: e.target.checked })}
                          className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                        />
                        <label htmlFor="snap-to-grid" className="text-xs font-bold text-slate-600 cursor-pointer">
                          Kılavuz Çizgilerine Yapış (Snap Grid)
                        </label>
                      </div>

                      <div className="pt-2 border-t border-teal-100/60 space-y-3">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hassas Koordinat Ayarları (%)</span>
                        
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                          {[
                            { key: 'image', label: 'Ürün Resmi', active: activeTemplate.showImage },
                            { key: 'name', label: 'Ürün Adı', active: activeTemplate.showBarcodeName !== false },
                            { key: 'code', label: 'Ürün Kodu', active: activeTemplate.showBarcodeCode !== false },
                            { key: 'customText', label: 'Özel Metin', active: activeTemplate.showCustomText && activeTemplate.customTextContent },
                            { key: 'price', label: 'Fiyat', active: activeTemplate.showBarcodePrice !== false },
                            { key: 'barcode', label: 'Barkod Çizgisi', active: true }
                          ].filter(item => item.active).map(item => {
                            const pos = (activeTemplate.customPositions || {})[item.key] || { x: 50, y: 50 };
                            return (
                              <div key={item.key} className="bg-white p-2.5 rounded-lg border border-slate-100 space-y-1.5 shadow-2xs">
                                <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                      <span>Yatay (X)</span>
                                      <span>{pos.x}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0" max="100" step="0.5"
                                      value={pos.x}
                                      onChange={(e) => {
                                        const currentPositions = activeTemplate.customPositions || {};
                                        handleUpdateActiveTemplate({
                                          customPositions: {
                                            ...currentPositions,
                                            [item.key]: { ...pos, x: parseFloat(e.target.value) }
                                          }
                                        });
                                      }}
                                      className="w-full accent-teal-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                  <div>
                                    <div className="flex justify-between text-[9px] font-semibold text-slate-500">
                                      <span>Dikey (Y)</span>
                                      <span>{pos.y}%</span>
                                    </div>
                                    <input
                                      type="range"
                                      min="0" max="100" step="0.5"
                                      value={pos.y}
                                      onChange={(e) => {
                                        const currentPositions = activeTemplate.customPositions || {};
                                        handleUpdateActiveTemplate({
                                          customPositions: {
                                            ...currentPositions,
                                            [item.key]: { ...pos, y: parseFloat(e.target.value) }
                                          }
                                        });
                                      }}
                                      className="w-full accent-teal-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
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

              {/* İmza & Kaşe Ayarları (1-2) */}
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1 rounded-lg bg-teal-50 text-teal-600">✍️</span> İmza & Kaşe Ayarları
                </h3>
                
                <div className="space-y-3">
                  <SwitchRow 
                    label="İmza/Kaşe Alanı Gösterilsin" 
                    checked={activeTemplate.showSignatureArea !== false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showSignatureArea: v })} 
                  />
                  
                  {(activeTemplate.showSignatureArea !== false) && (
                    <div className="space-y-2 pl-2 border-l-2 border-slate-200 mt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Teslim Eden Başlığı</label>
                        <input 
                          type="text"
                          value={activeTemplate.deliveryDelivererLabel || 'TESLİM EDEN (İMZA)'}
                          onChange={(e) => handleUpdateActiveTemplate({ deliveryDelivererLabel: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Teslim Alan Başlığı</label>
                        <input 
                          type="text"
                          value={activeTemplate.deliveryReceiverLabel || 'TESLİM ALAN (İMZA)'}
                          onChange={(e) => handleUpdateActiveTemplate({ deliveryReceiverLabel: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none bg-white text-slate-800"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Banka Hesap Bilgileri Ayarları (1-2) */}
              <div className="space-y-4 pt-4 border-t border-slate-150">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <span className="p-1 rounded-lg bg-teal-50 text-teal-600">🏦</span> Banka Hesap / IBAN Bilgileri
                </h3>
                
                <div className="space-y-3">
                  <SwitchRow 
                    label="Banka Hesap Bilgilerini Göster" 
                    checked={activeTemplate.showBankDetails || false} 
                    onChange={(v) => handleUpdateActiveTemplate({ showBankDetails: v })} 
                  />
                  
                  {activeTemplate.showBankDetails && (
                    <div className="space-y-2 pl-2 border-l-2 border-slate-200 mt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Banka Bölüm Başlığı</label>
                        <input 
                          type="text"
                          value={activeTemplate.bankDetailsTitle || 'BANKA HESAP BİLGİLERİ'}
                          onChange={(e) => handleUpdateActiveTemplate({ bankDetailsTitle: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none bg-white text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Hesap / IBAN Bilgileri</label>
                        <textarea 
                          rows={3}
                          value={activeTemplate.bankDetailsContent || 'Ziraat Bankası: TR00 1111 2222 3333 4444 5555 66\nVakıfbank: TR00 2222 3333 4444 5555 6666 77'}
                          onChange={(e) => handleUpdateActiveTemplate({ bankDetailsContent: e.target.value })}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-teal-500 outline-none bg-white text-slate-800 font-mono"
                          placeholder="Her satıra bir hesap gelecek şekilde yazınız..."
                        />
                      </div>
                    </div>
                  )}
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


    </>
  );
}
