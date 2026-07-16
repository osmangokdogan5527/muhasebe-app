import React from 'react';
export function ClassicTemplate({ dynamicPrintVars, printSettings }: any) {
  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};
  return (

                              /* CLASSIC ACCOUNTING FRAME LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-mono select-none text-[10px] p-2 border border-zinc-300 rounded-lg bg-white relative">
                                <div className="border border-zinc-400 p-3 rounded-md flex flex-col items-stretch h-full">
                                  {/* Grid Header */}
                                  <div className="grid grid-cols-12 gap-2 border-b border-zinc-400 pb-3 mb-4">
                                    <div className="col-span-8 space-y-1">
                                      {activeTemplate?.showLogo !== false && (
                                        <div>
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-8 max-w-[180px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-sm font-bold uppercase leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[8px] text-zinc-600 leading-tight">
                                          {activeTemplate?.showLogo === false && <strong className="text-[10px] block mb-0.5">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="font-bold">Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="col-span-4 border border-zinc-400 p-2 text-center bg-zinc-50 rounded">
                                      <h1 className="text-xs font-bold uppercase tracking-wide leading-none">{dynamicPrintVars?.title || transactionTypeTheme.title}</h1>
                                      <div className="text-[8px] text-zinc-600 mt-1.5 pt-1.5 border-t border-zinc-300">
                                        No: {transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                        <br />
                                        Tarih: {transaction.date}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Client / Cari Bilgileri */}
                                  <div className="border border-zinc-400 p-2.5 rounded bg-zinc-50/50 mb-4 grid grid-cols-2 gap-2">
                                    <div>
                                      <div className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">SAYIN ALICI (CARİ HESAP):</div>
                                      <div className="text-xs font-bold uppercase">{transaction.cariName}</div>
                                      {currentCariForPrint && <div className="text-[8px] text-zinc-600 mt-1">{currentCariForPrint.address || 'Kayıtlı adres bulunmuyor.'}</div>}
                                    </div>
                                    <div className="text-right flex flex-col justify-between">
                                      <div>
                                        {activeTemplate?.showValidityDate && (
                                          <p className="text-[8px] text-zinc-500 font-bold">GEÇERLİLİK: {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                                        )}
                                      </div>
                                      {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                        <div className="text-[8px] text-zinc-700 bg-white border border-zinc-300 p-1 rounded inline-block self-end">
                                          CARİ BAKİYE: <span className="font-bold">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Gridded Classical Table */}
                                  <table className="w-full text-left text-[9px] mb-4 border border-zinc-400">
                                    <thead>
                                      <tr className="bg-zinc-100 border-b border-zinc-400 font-bold">
                                        <th className="py-1.5 px-2 border-r border-zinc-400 w-6 text-center">S.N.</th>
                                        <th className="py-1.5 px-2 border-r border-zinc-400">ÜRÜN / HİZMET TANIMI</th>
                                        <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-16">MİKTAR</th>
                                        {activeTemplate?.showUnitPrice !== false && <th className="py-1.5 px-2 border-r border-zinc-400 text-right w-20">FİYAT</th>}
                                        {activeTemplate?.showDiscountRate && <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-12">İND.</th>}
                                        {activeTemplate?.showVatRate && <th className="py-1.5 px-2 border-r border-zinc-400 text-center w-12">KDV</th>}
                                        <th className="py-1.5 px-2 text-right w-24">TUTAR</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {transaction.items && transaction.items.length > 0 ? (
                                        transaction.items.map((item, idx) => (
                                          <tr key={idx} className="border-b border-zinc-300">
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-center">{idx + 1}</td>
                                            <td className="py-1.5 px-2 border-r border-zinc-400 font-bold">
                                              <div className="flex items-center gap-1.5">
                                                {activeTemplate?.showProductImage && (() => {
                                                  const matchedStock = stoklar?.find(s => s.id === item.stockId);
                                                  return matchedStock?.imageUrl ? (
                                                    <img src={matchedStock.imageUrl} alt={item.stockName} className="w-4 h-4 object-cover rounded shrink-0 border border-zinc-200" referrerPolicy="no-referrer" />
                                                  ) : (
                                                    <div className="w-4 h-4 bg-zinc-100 border border-zinc-200 rounded shrink-0 flex items-center justify-center">
                                                      <span className="text-[7px] font-bold text-zinc-400">{item.stockName?.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                                                    </div>
                                                  );
                                                })()}
                                                <span>{item.stockName}</span>
                                              </div>
                                            </td>
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-center">{item.quantity} {item.unit || 'Adet'}</td>
                                            {activeTemplate?.showUnitPrice !== false && (
                                              <td className="py-1.5 px-2 border-r border-zinc-400 text-right">{formatPrintCurrency(item.price, transaction.currency || 'TRY')}</td>
                                            )}
                                            {activeTemplate?.showDiscountRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">%0</td>}
                                            {activeTemplate?.showVatRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">%{item.taxRate || 20}</td>}
                                            <td className="py-1.5 px-2 text-right">{formatPrintCurrency(item.total, transaction.currency || 'TRY')}</td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr className="border-b border-zinc-300">
                                          <td className="py-1.5 px-2 border-r border-zinc-400 text-center">1</td>
                                          <td className="py-1.5 px-2 border-r border-zinc-400 font-bold">
                                            {transaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                            <div className="text-[8px] font-normal text-zinc-500 mt-0.5">{transaction.description}</div>
                                          </td>
                                          <td className="py-1.5 px-2 border-r border-zinc-400 text-center">1 Adet</td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-1.5 px-2 border-r border-zinc-400 text-right">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</td>
                                          )}
                                          {activeTemplate?.showDiscountRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">-</td>}
                                          {activeTemplate?.showVatRate && <td className="py-1.5 px-2 border-r border-zinc-400 text-center">-</td>}
                                          <td className="py-1.5 px-2 text-right">{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>

                                  {/* Classic Bottom Totals */}
                                  <div className="grid grid-cols-12 gap-2 items-start mt-2">
                                    <div className="col-span-8 text-[8px] text-zinc-500 leading-snug">
                                      {dynamicPrintVars?.notes && (
                                        <div className="border border-zinc-300 p-2 rounded mb-2 bg-zinc-50">
                                          <span className="font-bold text-zinc-700 block mb-0.5">NOT:</span>
                                          <p className="text-zinc-600">{dynamicPrintVars.notes}</p>
                                        </div>
                                      )}
                                      {printedBankDetails}
                                      <p className="mt-2">MUTABAKAT AMACIYLA DÜZENLENMİŞTİR. FİRMAMIZ KAYITLARI ESAS ALINMALIDIR.</p>
                                    </div>
                                    <div className="col-span-4 border border-zinc-400 rounded p-2 text-[9px] space-y-1 bg-zinc-50">
                                      <div className="flex justify-between">
                                        <span>MATRAH:</span>
                                        <span>{formatPrintCurrency(transaction.amount / 1.2, transaction.currency || 'TRY')}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-zinc-300 pb-1">
                                        <span>KDV (%20):</span>
                                        <span>{formatPrintCurrency(transaction.amount - (transaction.amount / 1.2), transaction.currency || 'TRY')}</span>
                                      </div>
                                      <div className="flex justify-between font-bold text-zinc-950">
                                        <span>GENEL TOPLAM:</span>
                                        <span>{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                      </div>
                                    </div>
                                  </div>

                                  {printedSignatureArea}
                            </div>
                                </div>
                          
  );
}