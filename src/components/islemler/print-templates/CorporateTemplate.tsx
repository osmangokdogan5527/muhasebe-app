import React from 'react';
import { Sparkles } from 'lucide-react';
export function CorporateTemplate({ dynamicPrintVars, printSettings }: any) {
  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar, kdvBreakdown } = dynamicPrintVars || {};
  return (

                              /* PREMIUM CORPORATE STANDARD INVOICE / TICKET LAYOUT (A4/A5) */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                                {/* Header Logo & Address */}
                                <div className="flex justify-between items-stretch border border-zinc-200 rounded-lg p-5 mb-6 bg-slate-50/50">
                                  <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                      {activeTemplate?.showLogo !== false && (
                                        <div className="mb-3">
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-12 max-w-[240px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-900 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[10px] text-zinc-600 leading-normal max-w-[340px] font-sans">
                                          {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-1">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="mt-1 font-bold text-zinc-800">Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Document Details (Tarih, No) */}
                                  <div className="w-80 flex flex-col justify-between border-l border-zinc-200 pl-6">
                                    <div className="text-right">
                                      <span className="inline-block px-2.5 py-0.5 text-[8px] font-black tracking-widest rounded text-white mb-1.5 uppercase" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        {transactionTypeTheme.badgeText}
                                      </span>
                                      <h1 className="text-xl font-extrabold text-zinc-900 tracking-tight uppercase leading-none">
                                        {dynamicPrintVars?.title || transactionTypeTheme.title}
                                      </h1>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px] font-mono text-zinc-600 mt-3 pt-3 border-t border-dashed border-zinc-200">
                                      <span className="font-bold">BELGE NO / SERİ:</span>
                                      <span className="text-right font-bold text-zinc-950">{transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</span>
                                      <span className="font-bold">TARİH:</span>
                                      <span className="text-right text-zinc-900">{transaction.date}</span>
                                      <span className="font-bold">PARA BİRİMİ:</span>
                                      <span className="text-right font-bold text-zinc-900">{transaction.currency || 'TRY'}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Parties Info Box (Double Columns) */}
                                <div className="grid grid-cols-2 gap-6 mb-6">
                                  <div className="border border-zinc-200 rounded-lg p-4 bg-slate-50/10">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 border-b border-zinc-100 pb-1">GÖNDERİCİ / SATICI</div>
                                    <div className="text-xs font-extrabold text-zinc-900 uppercase mb-1">{printSettings.companyName}</div>
                                    <div className="text-[10px] text-zinc-600 space-y-0.5 font-sans">
                                      <p>{printSettings.companyAddress}</p>
                                      <p className="font-bold text-zinc-800 mt-1">Tel: {printSettings.companyPhone}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="border border-zinc-200 rounded-lg p-4 bg-slate-50/10">
                                    <div className="text-[8px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5 border-b border-zinc-100 pb-1">ALICI / CARİ HESAP</div>
                                    <div className="text-xs font-extrabold text-zinc-900 uppercase mb-1">{transaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-600 space-y-0.5 font-sans">
                                        {currentCariForPrint.address ? <p>{currentCariForPrint.address}</p> : <p className="text-zinc-400 italic text-[9px]">Kayıtlı adres bulunmuyor.</p>}
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="font-semibold text-zinc-700 mt-1">
                                            V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                          </p>
                                        )}
                                        {currentCariForPrint.phone && <p className="font-bold text-zinc-800">Tel: {currentCariForPrint.phone}</p>}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Itemized Table */}
                                <div className="border border-zinc-200 rounded-lg overflow-hidden mb-6">
                                  <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                      <tr className="text-[9px] font-bold uppercase text-white" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        <th className="py-2.5 px-3 text-center w-12 font-bold">SIRA</th>
                                        <th className="py-2.5 px-3 font-bold">ÜRÜN / HİZMET TANIMI</th>
                                        <th className="py-2.5 px-3 text-center w-20 font-bold">MİKTAR</th>
                                        {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-3 text-right w-24 font-bold">BİRİM FİYAT</th>}
                                        {activeTemplate?.showDiscountRate && <th className="py-2.5 px-3 text-center w-14 font-bold">İNDİRİM</th>}
                                        {activeTemplate?.showVatRate && <th className="py-2.5 px-3 text-center w-14 font-bold">KDV (%)</th>}
                                        <th className="py-2.5 px-3 text-right w-28 font-bold">TOPLAM TUTAR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {transaction.items && transaction.items.length > 0 ? (
                                        transaction.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-zinc-200/60 hover:bg-slate-50/50 transition-colors odd:bg-slate-50/10">
                                            <td className="py-2.5 px-3 text-center text-zinc-400 font-mono text-[9px]">
                                              {String(idx + 1).padStart(2, '0')}
                                            </td>
                                            <td className="py-2.5 px-3">
                                              <div className="flex items-center gap-2">
                                                {activeTemplate?.showProductImage && (() => {
                                                  const matchedStock = stoklar?.find(s => s.id === item.stockId);
                                                  return matchedStock?.imageUrl ? (
                                                    <img src={matchedStock.imageUrl} alt={item.stockName} className="w-5 h-5 object-cover rounded shrink-0 border border-zinc-200" referrerPolicy="no-referrer" />
                                                  ) : (
                                                    <div className="w-5 h-5 bg-zinc-100 border border-zinc-200 rounded shrink-0 flex items-center justify-center">
                                                      <span className="text-[8px] font-bold text-zinc-400">{item.stockName?.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                                                    </div>
                                                  );
                                                })()}
                                                <span className="font-bold text-zinc-900 block uppercase text-[10px]">{item.stockName}</span>
                                              </div>
                                            </td>
                                            <td className="py-2.5 px-3 text-zinc-700 text-center font-mono">
                                              {item.quantity} {item.unit || 'Adet'}
                                            </td>
                                            {activeTemplate?.showUnitPrice !== false && (
                                              <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                                {formatPrintCurrency(item.price, transaction.currency || 'TRY')}
                                              </td>
                                            )}
                                            {activeTemplate?.showDiscountRate && (
                                              <td className="py-2.5 px-3 text-zinc-400 text-center font-mono">%0</td>
                                            )}
                                            {activeTemplate?.showVatRate && (
                                              <td className="py-2.5 px-3 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                            )}
                                            <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono text-[10px]">
                                              {formatPrintCurrency(item.total, transaction.currency || 'TRY')}
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr className="border-b border-zinc-150">
                                          <td className="py-3 px-3 text-center text-zinc-400 font-mono">01</td>
                                          <td className="py-3 px-3">
                                            <span className="font-bold text-zinc-900 block uppercase text-[10px]">
                                              {transaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                            </span>
                                            <span className="text-[9px] text-zinc-500 block mt-0.5 italic max-w-lg">
                                              {transaction.description || 'Cari hesaba yansıtılan finans hareketi.'}
                                            </span>
                                          </td>
                                          <td className="py-3 px-3 text-zinc-600 text-center font-mono">1 Adet</td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-3 text-zinc-600 text-right font-mono">
                                              {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && <td className="py-3 px-3 text-center font-mono">-</td>}
                                          {activeTemplate?.showVatRate && <td className="py-3 px-3 text-center font-mono">-</td>}
                                          <td className="py-3 px-3 font-bold text-zinc-900 text-right font-mono text-[10px]">
                                            {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Summary & Signatures Block */}
                                <div className="grid grid-cols-12 gap-6 items-start">
                                  <div className="col-span-7 space-y-4">
                                    {/* Written amount banner */}
                                    <div className="border border-zinc-200 bg-slate-50/50 rounded-lg p-3">
                                      <span className="text-[7px] font-black text-zinc-400 uppercase tracking-widest block mb-1">YAZI İLE TOPLAM TUTAR</span>
                                      <span className="text-[9px] font-bold text-zinc-800 tracking-wide uppercase font-mono">
                                        {convertNumberToWords(transaction.amount, transaction.currency || 'TRY')}
                                      </span>
                                    </div>

                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="flex justify-between items-center bg-zinc-50 border border-zinc-150 rounded-lg px-3 py-1.5 text-[9px] text-zinc-700 font-mono">
                                        <span className="font-bold text-zinc-400 uppercase">CARİ GÜNCEL HESAP BAKİYESİ:</span>
                                        <span className="font-black text-zinc-950">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                      </div>
                                    )}

                                    {dynamicPrintVars?.notes && activeTemplate?.showFooter !== false && (
                                      <div className="border-l-2 border-zinc-300 pl-3">
                                        <h4 className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5 font-sans">NOT / AÇIKLAMA</h4>
                                        <p className="text-[9px] text-zinc-500 leading-relaxed whitespace-pre-line font-sans">
                                          {dynamicPrintVars.notes}
                                        </p>
                                      </div>
                                    )}

                                    {printedBankDetails}
                                    {printedSignatureArea}
                                  </div>

                                  <div className="col-span-5 flex flex-col items-stretch pl-4 border-l border-dashed border-zinc-200">
                                    <div className="border border-zinc-200 rounded-lg overflow-hidden bg-slate-50/10">
                                      <div className="p-2.5 bg-slate-50 border-b border-zinc-200 flex justify-between items-center">
                                        <span className="text-[8px] font-black tracking-widest text-zinc-500 uppercase font-sans">FİNANSAL ÖZET</span>
                                        <span className="text-[7px] text-zinc-400 font-mono">{transaction.currency || 'TRY'}</span>
                                      </div>
                                      <div className="p-3 space-y-1.5 text-[9px] font-mono text-zinc-600">
                                        {transaction.items && transaction.items.length > 0 ? (
                                          <>
                                            <div className="flex justify-between">
                                              <span>KDV MATRAH TOPLAMI:</span>
                                              <span>{formatPrintCurrency(
                                                transaction.items.reduce((acc, curr) => acc + (curr.total / (1 + (curr.taxRate || 20)/100)), 0),
                                                transaction.currency || 'TRY'
                                              )}</span>
                                            </div>
                                            {kdvBreakdown.map((group, idx) => (
                                              <div key={idx} className="flex justify-between text-zinc-400 text-[8px]">
                                                <span>TOPLAM KDV (%{group.rate}):</span>
                                                <span>{formatPrintCurrency(group.kdv, transaction.currency || 'TRY')}</span>
                                              </div>
                                            ))}
                                          </>
                                        ) : (
                                          <div className="flex justify-between">
                                            <span>İŞLEM MATRAHI:</span>
                                            <span>{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between font-bold border-t border-zinc-150 pt-1.5 text-zinc-800">
                                          <span>TOPLAM KDV:</span>
                                          <span>{formatPrintCurrency(
                                            transaction.items && transaction.items.length > 0
                                              ? transaction.items.reduce((acc, curr) => acc + (curr.total - (curr.total / (1 + (curr.taxRate || 20)/100))), 0)
                                              : 0,
                                            transaction.currency || 'TRY'
                                          )}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] font-extrabold text-white rounded p-2 mt-2 transition-colors duration-300" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                          <span className="uppercase text-[8px] tracking-wider font-sans">GENEL TOPLAM:</span>
                                          <span className="text-[11px] font-black font-mono">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="text-[7px] text-zinc-400 mt-4 text-center leading-normal font-sans">
                                      <span className="font-bold tracking-wider text-zinc-300 uppercase">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                          
  );
}
