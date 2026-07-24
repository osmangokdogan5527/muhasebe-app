import React from 'react';
export function ElegantTemplate({ dynamicPrintVars, printSettings }: any) {
  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};
  return (

                              /* PREMIUM ELEGANT SERIF LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-800 font-serif pr-1 select-none text-xs">
                                {/* Elegant Centered Header */}
                                <div className="text-center pb-5 mb-8 border-b-4 border-double border-zinc-300">
                                  {activeTemplate?.showLogo !== false && (
                                    <div className="flex justify-center mb-2">
                                      {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                        <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <h2 className="text-2xl font-normal italic tracking-wide uppercase text-zinc-900 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                      )}
                                    </div>
                                  )}
                                  
                                  {activeTemplate?.showCompanyAddress !== false && (
                                    <div className="text-[9px] text-zinc-500 leading-relaxed font-sans max-w-[420px] mx-auto">
                                      {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-0.5 font-serif uppercase tracking-wider">{printSettings.companyName}</strong>}
                                      <p>{printSettings.companyAddress} • Tel: {printSettings.companyPhone}</p>
                                    </div>
                                  )}

                                  <h1 className="text-xl font-bold text-zinc-900 tracking-widest uppercase leading-none mt-4 font-serif">
                                    {dynamicPrintVars?.title || transactionTypeTheme.title}
                                  </h1>
                                  <p className="text-[8px] text-amber-800 tracking-widest uppercase font-sans font-bold mt-1">GÜVENİLİR VE SEÇKİN TİCARET BELGESİ</p>
                                </div>

                                {/* Parties Area */}
                                <div className="flex justify-between items-start mb-8 font-sans">
                                  <div className="max-w-[60%]">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">
                                      {currentCariForPrint?.type === 'customer' ? 'MÜŞTERİ' : currentCariForPrint?.type === 'supplier' ? 'TEDARİKÇİ' : 'ALICI'} / MUHATAP
                                    </span>
                                    <div className="text-sm font-bold text-zinc-900 uppercase font-serif tracking-wider">{transaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-500 mt-1 italic leading-normal font-serif">
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="text-zinc-600">V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}</p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="text-right text-[10px] text-zinc-600 space-y-0.5">
                                    <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest block mb-1">BELGE KÜNYESİ</span>
                                    <p><span className="font-semibold">Belge No:</span> #{transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}</p>
                                    <p><span className="font-semibold">Düzenleme Tarihi:</span> {transaction.date}</p>
                                    {activeTemplate?.showValidityDate && (
                                      <p className="text-amber-800 font-medium"><span className="font-semibold text-zinc-600">Geçerlilik:</span> {new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Delicate Elegant Table */}
                                <table className="w-full text-left text-xs mb-8 font-sans border-collapse">
                                  <thead>
                                    <tr className="border-b-2 border-zinc-200 text-[9px] font-bold uppercase text-zinc-700 italic">
                                      <th className="py-2.5 px-1 font-serif">Açıklama</th>
                                      <th className="py-2.5 px-1 text-center w-20">Miktar</th>
                                      {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-1 text-right w-24">Birim Fiyat</th>}
                                      {activeTemplate?.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İndirim</th>}
                                      {activeTemplate?.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                                      <th className="py-2.5 px-1 text-right w-28 font-serif text-zinc-950">Net Tutar</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {transaction.items && transaction.items.length > 0 ? (
                                      transaction.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-zinc-100 hover:bg-zinc-50/20">
                                          <td className="py-3 px-1">
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
                                              <span className="font-medium text-zinc-900 font-serif text-[10px] tracking-wide">{item.stockName}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-1 text-zinc-600 text-center font-mono italic">
                                            {item.quantity} {item.unit || 'Adet'}
                                          </td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                              {formatPrintCurrency(item.price, transaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%0</td>
                                          )}
                                          {activeTemplate?.showVatRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                          )}
                                          <td className="py-3 px-1 font-bold text-zinc-900 text-right font-serif">
                                            {formatPrintCurrency(item.total, transaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-b border-zinc-100 hover:bg-zinc-50/20">
                                        <td className="py-3 px-1">
                                          <span className="font-medium text-zinc-900 font-serif text-[10px] tracking-wide">
                                            {transaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                          </span>
                                        </td>
                                        <td className="py-3 px-1 text-zinc-600 text-center font-mono italic">1 Adet</td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                            {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showDiscountRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        {activeTemplate?.showVatRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        <td className="py-3 px-1 font-bold text-zinc-900 text-right font-serif">
                                          {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* Elegant Totals */}
                                <div className="flex justify-between items-start font-sans">
                                  <div className="space-y-3">
                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="border border-zinc-200 p-2 text-[8px] text-zinc-500 italic max-w-xs leading-tight">
                                        Mutabık kalınan cari bakiyeniz: <strong className="text-zinc-800 font-serif not-italic">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</strong>
                                      </div>
                                    )}
                                    {dynamicPrintVars?.notes && (
                                      <div className="text-[9px] text-zinc-500 italic max-w-md">
                                        <span className="font-bold not-italic block text-[8px] tracking-wider text-zinc-400 uppercase">AÇIKLAMA:</span>
                                        <p className="whitespace-pre-line">{dynamicPrintVars.notes}</p>
                                      </div>
                                    )}
                                    {printedBankDetails}
                                  </div>

                                  <div className="w-64 border-t-2 border-zinc-300 pt-3 space-y-1 text-[9px] text-zinc-600 font-mono">
                                    <div className="flex justify-between text-zinc-500">
                                      <span>ARA TOPLAM:</span>
                                      <span>{formatPrintCurrency(transaction.amount / 1.2, transaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-400 text-[8px]">
                                      <span>KDV TOPLAMI:</span>
                                      <span>{formatPrintCurrency(transaction.amount - (transaction.amount / 1.2), transaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between font-serif font-extrabold text-zinc-900 text-xs border-t border-dashed border-zinc-200 pt-1.5 mt-1.5">
                                      <span>GENEL TOPLAM:</span>
                                      <span>{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                </div>

                                {printedSignatureArea}

                                {/* Footer */}
                                {activeTemplate?.showFooter !== false && (
                                  <div className="mt-12 text-center text-[8px] text-zinc-400 font-serif italic border-t border-zinc-200 pt-3 max-w-md mx-auto">
                                    Bizi tercih ettiğiniz için teşekkür ederiz.
                                  </div>
                                )}
                              </div>

                          
  );
}
