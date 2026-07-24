import React from 'react';
import { PrintTemplateConfig } from '../TemplateDesignerView';

import { Image as ImageIcon } from 'lucide-react';
export function TemplatePreviews({ activeTemplate, companyName, companyAddress, companyPhone, logoType, logoImageUrl, mockCustomer, mockItems, calculateTotal, renderPreviewBankDetails, renderPreviewSignatureArea }: any) {
  const style = activeTemplate.designStyle || 'minimal';
  if (style === 'corporate') {
                return (
                  <div className="w-full flex flex-col items-stretch text-slate-800 font-sans select-none text-xs">
                    {/* Corporate Header Bar */}
                    <div className="flex justify-between items-stretch border border-slate-200 rounded-xl p-5 mb-6 bg-slate-50/75">
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          {activeTemplate.showLogo && (
                            <div className="mb-2">
                              {logoType === 'image' && logoImageUrl ? (
                                <img src={logoImageUrl} alt={companyName} className="h-10 max-w-[200px] object-contain" />
                              ) : (
                                <h2 className="text-lg font-black tracking-tight uppercase text-slate-900 leading-none">{companyName || 'LOGO'}</h2>
                              )}
                            </div>
                          )}
                          {activeTemplate.showCompanyAddress && (
                            <div className="text-[9px] text-slate-500 leading-normal max-w-[280px]">
                              {!activeTemplate.showLogo && <strong className="text-xs text-slate-900 block mb-0.5">{companyName}</strong>}
                              <p>{companyAddress}</p>
                              <p className="mt-0.5 font-bold text-slate-700">Tel: {companyPhone}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="w-60 flex flex-col justify-between border-l border-slate-200 pl-5 text-right">
                        <div>
                          <span className="inline-block px-2 py-0.5 text-[8px] font-black tracking-widest rounded bg-slate-800 text-white mb-1 uppercase">
                            BELGE DETAYI
                          </span>
                          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase leading-none">
                            {activeTemplate.documentTitle || 'BELGE'}
                          </h1>
                        </div>
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] font-mono text-slate-500 mt-2 pt-2 border-t border-dashed border-slate-200">
                          <span className="font-bold text-left">BELGE NO:</span>
                          <span className="text-right font-bold text-slate-950">INV-4820</span>
                          <span className="font-bold text-left">TARİH:</span>
                          <span className="text-right text-slate-900">{new Date().toLocaleDateString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Parties Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/20">
                        <div className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-100 pb-0.5">GÖNDERİCİ</div>
                        <div className="text-xs font-extrabold text-slate-900 uppercase mb-0.5">{companyName}</div>
                        <div className="text-[9px] text-slate-500 leading-relaxed">
                          <p>{companyAddress}</p>
                          <p className="font-bold text-slate-700 mt-0.5">Tel: {companyPhone}</p>
                        </div>
                      </div>
                      
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/20">
                        <div className="text-[7px] font-bold uppercase tracking-wider text-slate-400 mb-1 border-b border-slate-100 pb-0.5">ALICI / CARİ</div>
                        <div className="text-xs font-extrabold text-slate-900 uppercase mb-0.5">{mockCustomer.name}</div>
                        <div className="text-[9px] text-slate-500 leading-relaxed">
                          {activeTemplate.showValidityDate && (
                            <p className="text-slate-600 mt-1 font-semibold">
                              Geçerlilik: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-[8px] font-bold uppercase bg-slate-800 text-white">
                            <th className="py-2 px-3 text-center w-10">NO</th>
                            <th className="py-2 px-3">ÜRÜN / HİZMET</th>
                            <th className="py-2 px-3 text-center w-20">MİKTAR</th>
                            {activeTemplate.showUnitPrice && <th className="py-2 px-3 text-right w-24">BİRİM FİYAT</th>}
                            {activeTemplate.showDiscountRate && <th className="py-2 px-3 text-center w-14">İNDİRİM</th>}
                            {activeTemplate.showVatRate && <th className="py-2 px-3 text-center w-14">KDV</th>}
                            <th className="py-2 px-3 text-right w-28">TOPLAM</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockItems.map((item, idx) => {
                            const discountedPrice = item.price * (1 - item.discount / 100);
                            const withVat = discountedPrice * (1 + item.vat / 100);
                            const total = withVat * item.qty;
                            
                            return (
                              <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors odd:bg-slate-50/20">
                                <td className="py-2 px-3 text-center text-slate-400 font-mono text-[8px]">
                                  {String(idx + 1).padStart(2, '0')}
                                </td>
                                <td className="py-2 px-3 font-semibold text-slate-950 uppercase text-[9px] flex items-center gap-2">
                                  {activeTemplate.showProductImage && (
                                    <div className="w-5 h-5 bg-slate-200 rounded shrink-0 flex items-center justify-center">
                                      <ImageIcon size={10} className="text-slate-400" />
                                    </div>
                                  )}
                                  {item.name}
                                </td>
                                <td className="py-2 px-3 text-slate-600 text-center font-mono">
                                  {item.qty} Adet
                                </td>
                                {activeTemplate.showUnitPrice && (
                                  <td className="py-2 px-3 text-slate-500 text-right font-mono">
                                    {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                  </td>
                                )}
                                {activeTemplate.showDiscountRate && (
                                  <td className="py-2 px-3 text-slate-400 text-center font-mono">%{item.discount}</td>
                                )}
                                {activeTemplate.showVatRate && (
                                  <td className="py-2 px-3 text-slate-400 text-center font-mono">%{item.vat}</td>
                                )}
                                <td className="py-2 px-3 font-bold text-slate-900 text-right font-mono">
                                  {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Area */}
                    <div className="grid grid-cols-12 gap-4 items-start">
                      <div className="col-span-7 space-y-3">
                        {activeTemplate.showCustomerBalance && (
                          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[8px] text-slate-600 font-mono">
                            <span className="font-bold">CARİ GÜNCEL BAKİYESİ:</span>
                            <span className="font-extrabold text-slate-950">{mockCustomer.balance}</span>
                          </div>
                        )}
                        <div className="border-l-2 border-slate-300 pl-3 py-0.5">
                          <span className="text-[7px] font-bold text-slate-400 tracking-wider uppercase block">BİLGİLENDİRME</span>
                          <p className="text-[8px] text-slate-500 leading-normal">
                            Bu belge sistem üzerinde oluşturulmuş finansal bilgi amaçlı dökümdür. Resmi fatura yerine geçmez.
                          </p>
                        </div>
                        {renderPreviewBankDetails()}
                      </div>

                      <div className="col-span-5 flex flex-col items-stretch pl-3 border-l border-dashed border-slate-200 font-mono text-[9px] text-slate-600 space-y-1.5">
                        <div className="flex justify-between">
                          <span>KDV HARIÇ TOPLAM:</span>
                          <span>{(calculateTotal() / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[8px]">
                          <span>TOPLAM KDV (%20):</span>
                          <span>{(calculateTotal() - (calculateTotal() / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-slate-200 pt-1.5 text-slate-900 text-xs">
                          <span>GENEL TOPLAM:</span>
                          <span>{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                      </div>
                    </div>

                    {renderPreviewSignatureArea()}

                    {/* Footer */}
                    {activeTemplate.showFooter && (
                      <div className="mt-8 border-t border-slate-200 pt-3 text-[8px] text-slate-400 text-center uppercase tracking-wider font-semibold">
                        Sistem tarafından otomatik üretilmiştir.
                      </div>
                    )}
                  </div>
                );
              }

              if (style === 'modern') {
                return (
                  <div className="w-full flex flex-col items-stretch text-slate-800 font-sans select-none text-xs">
                    {/* Modern Asymmetric Header */}
                    <div className="flex items-stretch gap-5 mb-8">
                      {/* Left Modern Colored Accent Strip */}
                      <div className="w-2.5 bg-teal-600 rounded-full shrink-0"></div>
                      
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          {activeTemplate.showLogo && (
                            <div className="mb-2">
                              {logoType === 'image' && logoImageUrl ? (
                                <img src={logoImageUrl} alt={companyName} className="h-9 max-w-[200px] object-contain" />
                              ) : (
                                <h2 className="text-xl font-black tracking-tight uppercase text-teal-950 leading-none">{companyName || 'LOGO'}</h2>
                              )}
                            </div>
                          )}
                          {activeTemplate.showCompanyAddress && (
                            <div className="text-[9px] text-slate-500 leading-relaxed max-w-[320px]">
                              {!activeTemplate.showLogo && <strong className="text-xs text-slate-900 block mb-0.5">{companyName}</strong>}
                              <p>{companyAddress}</p>
                              <p className="mt-0.5 font-bold text-teal-700">Tel: {companyPhone}</p>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase leading-none mb-1">
                            {activeTemplate.documentTitle || 'BELGE'}
                          </h1>
                          <div className="text-[9px] text-slate-400 font-mono leading-relaxed mt-1">
                            Tarih: {new Date().toLocaleDateString('tr-TR')}
                            <br />
                            Belge No: INV-7201
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Customer Section */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6 flex justify-between items-start">
                      <div>
                        <div className="text-[8px] font-bold uppercase tracking-widest text-teal-600 mb-1">MÜŞTERİ DETAYLARI</div>
                        <div className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">{mockCustomer.name}</div>
                        </div>
                      
                      {activeTemplate.showValidityDate && (
                        <div className="text-right text-[10px] bg-white border border-slate-200/50 rounded-lg p-2 font-mono">
                          <span className="text-slate-400 text-[8px] block uppercase font-bold tracking-wider mb-0.5">SON GEÇERLİLİK</span>
                          <span className="font-extrabold text-slate-800">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Sleek Modern Table */}
                    <table className="w-full text-left text-xs mb-6 border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[8px] font-bold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 px-1">ÜRÜN / AÇIKLAMA</th>
                          <th className="py-2.5 px-1 text-center w-20">MİKTAR</th>
                          {activeTemplate.showUnitPrice && <th className="py-2.5 px-1 text-right w-24">BİRİM FİYAT</th>}
                          {activeTemplate.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İNDİRİM</th>}
                          {activeTemplate.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                          <th className="py-2.5 px-1 text-right w-28 text-slate-900">TOPLAM</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockItems.map((item, idx) => {
                          const discountedPrice = item.price * (1 - item.discount / 100);
                          const withVat = discountedPrice * (1 + item.vat / 100);
                          const total = withVat * item.qty;
                          
                          return (
                            <tr key={idx} className="border-b border-slate-100">
                              <td className="py-3 px-1">
                                <div className="flex items-center gap-2">
                                  {activeTemplate.showProductImage && (
                                    <div className="w-6 h-6 bg-slate-100 border border-slate-200 rounded-md shrink-0 flex items-center justify-center">
                                      <ImageIcon size={12} className="text-slate-400" />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-slate-900 text-[10px] block uppercase">{item.name}</span>
                                    <span className="text-[8px] text-slate-400 block mt-0.5">Premium Ürün Segmenti</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-1 text-slate-800 text-center font-semibold">
                                {item.qty} Adet
                              </td>
                              {activeTemplate.showUnitPrice && (
                                <td className="py-3 px-1 text-slate-500 text-right font-mono">
                                  {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </td>
                              )}
                              {activeTemplate.showDiscountRate && (
                                <td className="py-3 px-1 text-slate-500 text-center font-mono">%{item.discount}</td>
                              )}
                              {activeTemplate.showVatRate && (
                                <td className="py-3 px-1 text-slate-400 text-center font-mono">%{item.vat}</td>
                              )}
                              <td className="py-3 px-1 font-extrabold text-teal-950 text-right font-mono">
                                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Summary area */}
                    <div className="flex justify-between items-start mt-4">
                      <div className="space-y-3">
                        {activeTemplate.showCustomerBalance && (
                          <div className="border border-teal-100 bg-teal-50/20 px-3 py-2 rounded-xl text-[9px] text-teal-800 inline-block">
                            <span className="block text-[7px] text-teal-500 uppercase font-black tracking-widest mb-0.5">CARİ GÜNCEL HESAP BAKİYESİ</span>
                            <span className="font-extrabold">{mockCustomer.balance}</span>
                          </div>
                        )}
                        {renderPreviewBankDetails()}
                      </div>
                      
                      <div className="w-72 bg-slate-50 rounded-xl p-3 border border-slate-100 font-mono text-[9px] text-slate-600 space-y-1">
                        <div className="flex justify-between text-[10px] font-extrabold text-slate-900 border-b border-slate-200/60 pb-1.5 mb-1.5">
                          <span className="font-sans uppercase text-[8px] tracking-wider text-slate-400">ÖDENECEK TOPLAM TUTAR</span>
                          <span className="text-teal-600">{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400">
                          <span>MATRAH:</span>
                          <span>{(calculateTotal() / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400">
                          <span>VERGİLER TOPLAMI:</span>
                          <span>{(calculateTotal() - (calculateTotal() / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                      </div>
                    </div>

                    {renderPreviewSignatureArea()}

                    {/* Footer */}
                    {activeTemplate.showFooter && (
                      <div className="mt-12 text-center text-[8px] text-slate-400 font-mono uppercase tracking-widest bg-slate-50/40 py-2 rounded-lg border border-slate-150">
                        Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz
                      </div>
                    )}
                  </div>
                );
              }

              if (style === 'elegant') {
                return (
                  <div className="w-full flex flex-col items-stretch text-slate-800 font-serif select-none text-xs">
                    {/* Elegant Centered Header */}
                    <div className="text-center pb-5 mb-8 border-b-4 border-double border-slate-300">
                      {activeTemplate.showLogo && (
                        <div className="flex justify-center mb-2">
                          {logoType === 'image' && logoImageUrl ? (
                            <img src={logoImageUrl} alt={companyName} className="h-10 max-w-[200px] object-contain" />
                          ) : (
                            <h2 className="text-2xl font-normal italic tracking-wide uppercase text-slate-900 leading-none">{companyName || 'LOGO'}</h2>
                          )}
                        </div>
                      )}
                      
                      {activeTemplate.showCompanyAddress && (
                        <div className="text-[9px] text-slate-500 leading-relaxed font-sans max-w-[420px] mx-auto">
                          {!activeTemplate.showLogo && <strong className="text-xs text-slate-900 block mb-0.5 font-serif uppercase tracking-wider">{companyName}</strong>}
                          <p>{companyAddress} • Tel: {companyPhone}</p>
                        </div>
                      )}

                      <h1 className="text-xl font-bold text-slate-900 tracking-widest uppercase leading-none mt-4 font-serif">
                        {activeTemplate.documentTitle || 'BELGE'}
                      </h1>
                      <p className="text-[8px] text-amber-800 tracking-widest uppercase font-sans font-bold mt-1">GÜVENİLİR VE SEÇKİN TİCARET BELGESİ</p>
                    </div>

                    {/* Parties Area */}
                    <div className="flex justify-between items-start mb-8 font-sans">
                      <div className="max-w-[60%]">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block mb-1">MÜŞTERİ / MUHATAP</span>
                        <div className="text-sm font-bold text-slate-900 uppercase font-serif tracking-wider">{mockCustomer.name}</div>
                        </div>

                      <div className="text-right text-[10px] text-slate-600 space-y-0.5">
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest block mb-1">BELGE KÜNYESİ</span>
                        <p><span className="font-semibold">Belge No:</span> #INV-9204</p>
                        <p><span className="font-semibold">Düzenleme Tarihi:</span> {new Date().toLocaleDateString('tr-TR')}</p>
                        {activeTemplate.showValidityDate && (
                          <p className="text-amber-800 font-medium"><span className="font-semibold text-slate-600">Geçerlilik:</span> {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                        )}
                      </div>
                    </div>

                    {/* Delicate Elegant Table */}
                    <table className="w-full text-left text-xs mb-8 font-sans border-collapse">
                      <thead>
                        <tr className="border-b-2 border-slate-200 text-[9px] font-bold uppercase text-slate-700 italic">
                          <th className="py-2.5 px-1 font-serif">Açıklama</th>
                          <th className="py-2.5 px-1 text-center w-20">Miktar</th>
                          {activeTemplate.showUnitPrice && <th className="py-2.5 px-1 text-right w-24">Birim Fiyat</th>}
                          {activeTemplate.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İndirim</th>}
                          {activeTemplate.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                          <th className="py-2.5 px-1 text-right w-28 font-serif text-slate-950">Net Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockItems.map((item, idx) => {
                          const discountedPrice = item.price * (1 - item.discount / 100);
                          const withVat = discountedPrice * (1 + item.vat / 100);
                          const total = withVat * item.qty;
                          
                          return (
                            <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/20">
                              <td className="py-3 px-1">
                                <div className="flex items-center gap-2">
                                  {activeTemplate.showProductImage && (
                                    <div className="w-5 h-5 border border-slate-200 shrink-0 flex items-center justify-center">
                                      <ImageIcon size={10} className="text-slate-400" />
                                    </div>
                                  )}
                                  <span className="font-medium text-slate-900 font-serif text-[10px] tracking-wide">{item.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-1 text-slate-600 text-center font-mono italic">
                                {item.qty} Adet
                              </td>
                              {activeTemplate.showUnitPrice && (
                                <td className="py-3 px-1 text-slate-500 text-right font-mono">
                                  {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                                </td>
                              )}
                              {activeTemplate.showDiscountRate && (
                                <td className="py-3 px-1 text-slate-400 text-center font-mono">%{item.discount}</td>
                              )}
                              {activeTemplate.showVatRate && (
                                <td className="py-3 px-1 text-slate-400 text-center font-mono">%{item.vat}</td>
                              )}
                              <td className="py-3 px-1 font-bold text-slate-900 text-right font-serif">
                                {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Elegant Totals */}
                    <div className="flex justify-between items-start font-sans">
                      <div className="space-y-3">
                        {activeTemplate.showCustomerBalance && (
                          <div className="border border-slate-200 p-2 text-[8px] text-slate-500 italic max-w-xs leading-tight">
                            Mutabık kalınan cari bakiyeniz: <strong className="text-slate-800 font-serif not-italic">{mockCustomer.balance}</strong>
                          </div>
                        )}
                        {renderPreviewBankDetails()}
                      </div>

                      <div className="w-64 border-t-2 border-slate-300 pt-3 space-y-1 text-[9px] text-slate-600 font-mono">
                        <div className="flex justify-between text-slate-500">
                          <span>ARA TOPLAM:</span>
                          <span>{(calculateTotal() / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-[8px]">
                          <span>KDV TOPLAMI:</span>
                          <span>{(calculateTotal() - (calculateTotal() / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                        <div className="flex justify-between font-serif font-extrabold text-slate-900 text-xs border-t border-dashed border-slate-200 pt-1.5 mt-1.5">
                          <span>GENEL TOPLAM:</span>
                          <span>{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                        </div>
                      </div>
                    </div>

                    {renderPreviewSignatureArea()}

                    {/* Footer */}
                    {activeTemplate.showFooter && (
                      <div className="mt-12 text-center text-[8px] text-slate-400 font-serif italic border-t border-slate-200 pt-3 max-w-md mx-auto">
                        Bizi tercih ettiğiniz için teşekkür ederiz.
                      </div>
                    )}
                  </div>
                );
              }

              if (style === 'classic') {
                return (
                  <div className="w-full flex flex-col items-stretch text-slate-900 font-mono select-none text-[10px] p-4 border border-slate-300 rounded-lg bg-white relative">
                    {/* Classic Frame Layout */}
                    <div className="border border-slate-400 p-3 rounded-md flex flex-col items-stretch h-full">
                      {/* Grid Header */}
                      <div className="grid grid-cols-12 gap-2 border-b border-slate-400 pb-3 mb-4">
                        <div className="col-span-8 space-y-1">
                          {activeTemplate.showLogo && (
                            <div>
                              {logoType === 'image' && logoImageUrl ? (
                                <img src={logoImageUrl} alt={companyName} className="h-8 max-w-[180px] object-contain" />
                              ) : (
                                <h2 className="text-sm font-bold uppercase leading-none">{companyName || 'LOGO'}</h2>
                              )}
                            </div>
                          )}
                          {activeTemplate.showCompanyAddress && (
                            <div className="text-[8px] text-slate-600 leading-tight">
                              {!activeTemplate.showLogo && <strong className="text-[10px] block mb-0.5">{companyName}</strong>}
                              <p>{companyAddress}</p>
                              <p className="font-bold">Tel: {companyPhone}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="col-span-4 border border-slate-400 p-2 text-center bg-slate-50 rounded">
                          <span className="text-[7px] text-red-600 font-bold uppercase tracking-widest block mb-0.5">BİLGİ AMAÇLIDIR</span>
                          <h1 className="text-xs font-bold uppercase tracking-wide leading-none">{activeTemplate.documentTitle || 'BELGE'}</h1>
                          <div className="text-[8px] text-slate-600 mt-1.5 pt-1.5 border-t border-slate-300">
                            No: CL-10023
                            <br />
                            Tarih: {new Date().toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>

                      {/* Client / Cari Bilgileri */}
                      <div className="border border-slate-400 p-2.5 rounded bg-slate-50/50 mb-4 grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SAYIN MÜŞTERİ (CARİ HESAP):</div>
                          <div className="text-xs font-bold uppercase">{mockCustomer.name}</div>
                          </div>
                        <div className="text-right flex flex-col justify-between">
                          <div>
                            {activeTemplate.showValidityDate && (
                              <p className="text-[8px] text-slate-500 font-bold">GEÇERLİLİK: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                            )}
                          </div>
                          {activeTemplate.showCustomerBalance && (
                            <div className="text-[8px] text-slate-700 bg-white border border-slate-300 p-1 rounded inline-block self-end">
                              CARİ BAKİYE: <span className="font-bold">{mockCustomer.balance}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Gridded Classical Table */}
                      <table className="w-full text-left text-[9px] mb-4 border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                            <th className="py-1.5 px-2 border-r border-slate-400 w-6 text-center">S.N.</th>
                            <th className="py-1.5 px-2 border-r border-slate-400">ÜRÜN / HİZMET TANIMI</th>
                            <th className="py-1.5 px-2 border-r border-slate-400 text-center w-16">MİKTAR</th>
                            {activeTemplate.showUnitPrice && <th className="py-1.5 px-2 border-r border-slate-400 text-right w-20">FİYAT</th>}
                            {activeTemplate.showDiscountRate && <th className="py-1.5 px-2 border-r border-slate-400 text-center w-12">İND.</th>}
                            {activeTemplate.showVatRate && <th className="py-1.5 px-2 border-r border-slate-400 text-center w-12">KDV</th>}
                            <th className="py-1.5 px-2 text-right w-24">TUTAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockItems.map((item, idx) => {
                            const discountedPrice = item.price * (1 - item.discount / 100);
                            const withVat = discountedPrice * (1 + item.vat / 100);
                            const total = withVat * item.qty;
                            
                            return (
                              <tr key={idx} className="border-b border-slate-300">
                                <td className="py-1.5 px-2 border-r border-slate-300 text-center">{idx + 1}</td>
                                <td className="py-1.5 px-2 border-r border-slate-300 uppercase font-bold flex items-center gap-1.5">
                                  {activeTemplate.showProductImage && (
                                    <div className="w-4 h-4 bg-slate-200 shrink-0 border border-slate-400 flex items-center justify-center">
                                      <ImageIcon size={8} className="text-slate-400" />
                                    </div>
                                  )}
                                  {item.name}
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-300 text-center">{item.qty} Adet</td>
                                {activeTemplate.showUnitPrice && (
                                  <td className="py-1.5 px-2 border-r border-slate-400 text-right">
                                    {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </td>
                                )}
                                {activeTemplate.showDiscountRate && (
                                  <td className="py-1.5 px-2 border-r border-slate-300 text-center">%{item.discount}</td>
                                )}
                                {activeTemplate.showVatRate && (
                                  <td className="py-1.5 px-2 border-r border-slate-300 text-center">%{item.vat}</td>
                                )}
                                <td className="py-1.5 px-2 text-right font-bold">
                                  {total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Classic Totals Block */}
                      <div className="grid grid-cols-12 gap-2 mt-auto">
                        <div className="col-span-7 border border-slate-400 rounded p-2 text-[7px] leading-relaxed text-slate-500 self-stretch flex flex-col justify-between">
                          <div>
                            <p>Bu döküm sistem üzerinden üretilmiştir.</p>
                            {activeTemplate.showBankDetails && (
                              <div className="mt-2 border-t border-slate-200 pt-2 font-mono text-[7px] text-slate-600">
                                <span className="font-bold block mb-0.5">{activeTemplate.bankDetailsTitle || 'BANKA HESAP BİLGİLERİ'}</span>
                                <div className="whitespace-pre-line leading-normal">{activeTemplate.bankDetailsContent}</div>
                              </div>
                            )}
                          </div>
                          {activeTemplate.showSignatureArea !== false && (
                            <div className="grid grid-cols-2 gap-4 text-center mt-2 pt-2 border-t border-dashed border-slate-300">
                              <div>
                                <span>{activeTemplate.deliveryDelivererLabel || 'TESLİM EDEN (İMZA)'}</span>
                                <div className="border-t border-slate-300 w-16 mx-auto mt-4"></div>
                              </div>
                              <div>
                                <span>{activeTemplate.deliveryReceiverLabel || 'TESLİM ALAN (İMZA)'}</span>
                                <div className="border-t border-slate-300 w-16 mx-auto mt-4"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="col-span-5 border border-slate-400 rounded p-2 bg-slate-50 space-y-1 text-right">
                          <div className="flex justify-between border-b border-slate-200 pb-1">
                            <span>MATRAH:</span>
                            <span>{(calculateTotal() / 1.2).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-200 pb-1 text-slate-500">
                            <span>KDV %20:</span>
                            <span>{(calculateTotal() - (calculateTotal() / 1.2)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex justify-between font-bold text-xs pt-1">
                            <span>GENEL TOPLAM:</span>
                            <span>{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // DEFAULT MINIMAL
              return (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 text-xs font-sans">
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
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
                        {activeTemplate.documentTitle || 'BELGE'}
                      </h1>
                      <div className="text-xs text-slate-500 mt-2 leading-relaxed">
                        Tarih: {new Date().toLocaleDateString('tr-TR')}
                        <br />
                        Belge No: INV-{Math.floor(Math.random() * 10000)}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex justify-between mb-8 text-xs font-sans">
                    <div className="text-sm">
                      <div className="font-bold text-slate-900 mb-1">Sayın,</div>
                      <div className="font-extrabold text-base md:text-lg text-slate-900 tracking-wide uppercase">
                        {mockCustomer.name.toLocaleUpperCase('tr-TR')}
                      </div>
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
                  <table className="w-full text-left text-xs mb-8 font-sans">
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
                                <div className="w-6 h-6 bg-slate-200 rounded shrink-0 flex items-center justify-center">
                                  <ImageIcon size={12} className="text-slate-400" />
                                </div>
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
                  <div className="flex justify-between mb-12 text-xs font-sans">
                    <div className="w-1/2 flex flex-col justify-end space-y-3">
                      {activeTemplate.showCustomerBalance && (
                        <div className="text-xs text-slate-600 border border-slate-200 p-3 rounded bg-slate-50 inline-block w-max">
                          Güncel Bakiye: <span className="font-bold text-slate-900">{mockCustomer.balance}</span>
                        </div>
                      )}
                      {renderPreviewBankDetails()}
                    </div>
                    <div className="w-64">
                      <div className="flex justify-between py-1 text-sm border-b border-slate-200 font-bold">
                        <span className="text-slate-900 font-extrabold uppercase">Genel Toplam:</span>
                        <span className="text-slate-900 font-mono font-black">{calculateTotal().toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                      </div>
                    </div>
                  </div>

                  {renderPreviewSignatureArea()}

                  {/* Footer */}
                  {activeTemplate.showFooter && (
                    <div className="absolute bottom-10 left-10 right-10 border-t border-slate-200 pt-4 text-[10px] text-slate-500 text-center font-sans">
                      Bizi tercih ettiğiniz için teşekkür ederiz. Bu belge sistem tarafından otomatik oluşturulmuştur.
                    </div>
                  )}
                </>
              );

}
