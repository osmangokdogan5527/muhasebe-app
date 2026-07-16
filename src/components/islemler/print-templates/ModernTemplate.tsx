import React from 'react';
export function ModernTemplate({ dynamicPrintVars, printSettings }: any) {
  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};
  return (

                              /* PREMIUM MODERN ASYMMETRIC LAYOUT */
                              <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                                {/* Modern Asymmetric Header */}
                                <div className="flex items-stretch gap-5 mb-8">
                                  {/* Left Modern Colored Accent Strip */}
                                  <div className="w-2.5 rounded-full shrink-0" style={{ backgroundColor: transactionTypeTheme.primary }}></div>
                                  
                                  <div className="flex-1 flex justify-between items-start">
                                    <div>
                                      {activeTemplate?.showLogo !== false && (
                                        <div className="mb-2">
                                          {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                            <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[200px] object-contain" referrerPolicy="no-referrer" />
                                          ) : (
                                            <h2 className="text-xl font-black tracking-tight uppercase text-zinc-950 leading-none">{printSettings.companyName || 'LOGO'}</h2>
                                          )}
                                        </div>
                                      )}
                                      {activeTemplate?.showCompanyAddress !== false && (
                                        <div className="text-[10px] text-zinc-500 leading-relaxed max-w-[320px]">
                                          {activeTemplate?.showLogo === false && <strong className="text-xs text-zinc-900 block mb-0.5">{printSettings.companyName}</strong>}
                                          <p>{printSettings.companyAddress}</p>
                                          <p className="mt-0.5 font-bold" style={{ color: transactionTypeTheme.primary }}>Tel: {printSettings.companyPhone}</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="text-right">
                                      <h1 className="text-xl font-black text-zinc-900 tracking-tight uppercase leading-none mb-1">
                                        {dynamicPrintVars?.title || transactionTypeTheme.title}
                                      </h1>
                                      <div className="inline-block text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2 text-white" style={{ backgroundColor: transactionTypeTheme.primary }}>
                                        YENİ NESİL BELGE
                                      </div>
                                      <div className="text-[9px] text-zinc-400 font-mono leading-relaxed mt-1">
                                        Tarih: {transaction.date}
                                        <br />
                                        Belge No: {transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Customer Section */}
                                <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-150 mb-6 flex justify-between items-start">
                                  <div>
                                    <div className="text-[8px] font-bold uppercase tracking-widest mb-1" style={{ color: transactionTypeTheme.primary }}>ALICI DETAYLARI</div>
                                    <div className="text-sm font-extrabold text-zinc-900 uppercase tracking-wide">{transaction.cariName}</div>
                                    {currentCariForPrint && (
                                      <div className="text-[10px] text-zinc-500 mt-1 max-w-[340px]">
                                        <p>{currentCariForPrint.address || 'Kayıtlı adres bulunmuyor.'}</p>
                                        {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                          <p className="font-semibold text-zinc-600 mt-0.5">
                                            V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {activeTemplate?.showValidityDate && (
                                    <div className="text-right text-[10px] bg-white border border-zinc-200 rounded-lg p-2 font-mono">
                                      <span className="text-zinc-400 text-[8px] block uppercase font-bold tracking-wider mb-0.5">GEÇERLİLİK</span>
                                      <span className="font-extrabold text-zinc-800">{new Date(Date.now() + 7 * 86400000).toLocaleDateString('tr-TR')}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Sleek Modern Table */}
                                <table className="w-full text-left text-xs mb-6 border-collapse">
                                  <thead>
                                    <tr className="border-b border-zinc-200 text-[8px] font-bold uppercase tracking-wider text-zinc-400">
                                      <th className="py-2.5 px-1">ÜRÜN / AÇIKLAMA</th>
                                      <th className="py-2.5 px-1 text-center w-20">MİKTAR</th>
                                      {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-1 text-right w-24">BİRİM FİYAT</th>}
                                      {activeTemplate?.showDiscountRate && <th className="py-2.5 px-1 text-center w-14">İNDİRİM</th>}
                                      {activeTemplate?.showVatRate && <th className="py-2.5 px-1 text-center w-14">KDV</th>}
                                      <th className="py-2.5 px-1 text-right w-28 text-zinc-900">TOPLAM</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {transaction.items && transaction.items.length > 0 ? (
                                      transaction.items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-zinc-100">
                                          <td className="py-3 px-1">
                                            <div className="flex items-center gap-2">
                                              {activeTemplate?.showProductImage && (() => {
                                                const matchedStock = stoklar?.find(s => s.id === item.stockId);
                                                return matchedStock?.imageUrl ? (
                                                  <img src={matchedStock.imageUrl} alt={item.stockName} className="w-6 h-6 object-cover rounded-md shrink-0 border border-zinc-200" referrerPolicy="no-referrer" />
                                                ) : (
                                                  <div className="w-6 h-6 bg-zinc-100 border border-zinc-200 rounded-md shrink-0 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-zinc-400">{item.stockName?.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                                                  </div>
                                                );
                                              })()}
                                              <div>
                                                <span className="font-bold text-zinc-900 text-[10px] block uppercase">{item.stockName}</span>
                                                <span className="text-[8px] text-zinc-400 block mt-0.5">Sistem Stok Tanımlı Ürün</span>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-3 px-1 text-zinc-800 text-center font-semibold">
                                            {item.quantity} {item.unit || 'Adet'}
                                          </td>
                                          {activeTemplate?.showUnitPrice !== false && (
                                            <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                              {formatPrintCurrency(item.price, transaction.currency || 'TRY')}
                                            </td>
                                          )}
                                          {activeTemplate?.showDiscountRate && (
                                            <td className="py-3 px-1 text-zinc-500 text-center font-mono">%0</td>
                                          )}
                                          {activeTemplate?.showVatRate && (
                                            <td className="py-3 px-1 text-zinc-400 text-center font-mono">%{item.taxRate || 20}</td>
                                          )}
                                          <td className="py-3 px-1 font-extrabold text-zinc-950 text-right font-mono">
                                            {formatPrintCurrency(item.total, transaction.currency || 'TRY')}
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="border-b border-zinc-100">
                                        <td className="py-3 px-1">
                                          <span className="font-bold text-zinc-900 text-[10px] block uppercase">
                                            {transaction.type === 'collection' ? 'TAHSİLAT MAKBUZU' : 'ÖDEME MAKBUZU'}
                                          </span>
                                          <span className="text-[8px] text-zinc-400 block mt-0.5">{transaction.description || 'Finansal Hareket'}</span>
                                        </td>
                                        <td className="py-3 px-1 text-zinc-800 text-center font-semibold">1 Adet</td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-3 px-1 text-zinc-500 text-right font-mono">
                                            {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showDiscountRate && <td className="py-3 px-1 text-zinc-500 text-center font-mono">-</td>}
                                        {activeTemplate?.showVatRate && <td className="py-3 px-1 text-zinc-400 text-center font-mono">-</td>}
                                        <td className="py-3 px-1 font-extrabold text-zinc-950 text-right font-mono">
                                          {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>

                                {/* Summary area */}
                                <div className="flex justify-between items-start mt-4">
                                  <div className="space-y-3">
                                    {dynamicPrintVars?.showBalance && currentCariForPrint && (
                                      <div className="border border-zinc-100 bg-zinc-50/20 px-3 py-2 rounded-xl text-[9px] text-zinc-800 inline-block">
                                        <span className="block text-[7px] text-zinc-500 uppercase font-black tracking-widest mb-0.5">CARİ GÜNCEL HESAP BAKİYESİ</span>
                                        <span className="font-extrabold">{formatPrintCurrency(currentCariForPrint.balance, currentCariForPrint.currency || 'TRY')}</span>
                                      </div>
                                    )}
                                    {dynamicPrintVars?.notes && (
                                      <div className="max-w-md bg-zinc-50/30 p-2.5 rounded-lg border border-zinc-150">
                                        <span className="text-[7px] font-bold text-zinc-400 block mb-0.5">NOT / AÇIKLAMA:</span>
                                        <p className="text-[9px] text-zinc-600 whitespace-pre-line">{dynamicPrintVars.notes}</p>
                                      </div>
                                    )}
                                    {printedBankDetails}
                                  </div>
                                  
                                  <div className="w-72 bg-zinc-50 rounded-xl p-3 border border-zinc-100 font-mono text-[9px] text-zinc-600 space-y-1">
                                    <div className="flex justify-between text-[10px] font-extrabold text-zinc-900 border-b border-zinc-200/60 pb-1.5 mb-1.5">
                                      <span className="font-sans uppercase text-[8px] tracking-wider text-zinc-400">ÖDENECEK TOPLAM TUTAR</span>
                                      <span style={{ color: transactionTypeTheme.primary }}>{formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-400">
                                      <span>MATRAH:</span>
                                      <span>{formatPrintCurrency(transaction.amount / 1.2, transaction.currency || 'TRY')}</span>
                                    </div>
                                    <div className="flex justify-between text-[8px] text-zinc-400">
                                      <span>VERGİLER TOPLAMI:</span>
                                      <span>{formatPrintCurrency(transaction.amount - (transaction.amount / 1.2), transaction.currency || 'TRY')}</span>
                                    </div>
                                  </div>
                                </div>

                                {printedSignatureArea}

                                {/* Footer */}
                                {activeTemplate?.showFooter !== false && (
                                  <div className="mt-12 text-center text-[8px] text-zinc-400 font-mono uppercase tracking-widest bg-zinc-50/40 py-2 rounded-lg border border-zinc-150">
                                    Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz
                                  </div>
                                )}
                              </div>

                          
  );
}
