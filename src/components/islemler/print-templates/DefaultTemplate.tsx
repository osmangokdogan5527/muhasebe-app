import React from 'react';
export function DefaultTemplate({ dynamicPrintVars, printSettings, }: any) {
  const { transaction, currentCariForPrint, formatPrintCurrency, convertNumberToWords, transactionTypeTheme, printedBankDetails, printedSignatureArea, activeTemplate, stoklar } = dynamicPrintVars || {};
    return (
                            /* PREMIUM CORPORATE MINIMALIST INVOICE / TICKET LAYOUT (A4/A5) */
                            <div className="w-full flex flex-col items-stretch text-zinc-900 font-sans pr-1 select-none text-xs">
                              {/* Header Logo & Address */}
                              <div className="flex justify-between items-start pb-4 mb-6">
                                <div className="max-w-[60%]">
                                  {/* Şirket Adı veya Logo */}
                                  {activeTemplate?.showLogo !== false && (
                                    <div className="mb-1">
                                      {printSettings.logoType === 'image' && printSettings.logoImageUrl ? (
                                        <img src={printSettings.logoImageUrl} alt={printSettings.companyName} className="h-10 max-w-[240px] object-contain" referrerPolicy="no-referrer" />
                                      ) : (
                                        <h2 className="text-[26px] font-extrabold tracking-tight uppercase text-zinc-950 leading-none font-sans" style={{ fontWeight: 900 }}>
                                          {printSettings.companyName || 'FIRMA ADI'}
                                        </h2>
                                      )}
                                    </div>
                                  )}
                                  
                                  {activeTemplate?.showCompanyAddress !== false && (
                                    <div className="text-[11px] text-zinc-500 leading-tight whitespace-pre-line font-sans mt-1.5">
                                      {activeTemplate?.showLogo === false && <strong className="text-sm text-zinc-900 block mb-1">{printSettings.companyName}</strong>}
                                      <p>{printSettings.companyAddress || 'Firma Adresi'}</p>
                                      <p className="mt-0.5 font-bold text-zinc-800">Tel: {printSettings.companyPhone || '0555 555 55 55'}</p>
                                    </div>
                                  )}
                                </div>

                                {/* Document Details (Tarih, No) */}
                                <div className="text-right">
                                  <h1 className="text-[26px] font-extrabold text-zinc-950 tracking-tight uppercase leading-none" style={{ fontWeight: 900 }}>
                                    {dynamicPrintVars?.title || transactionTypeTheme.title}
                                  </h1>
                                  <div className="text-[11px] text-zinc-400 mt-2 font-mono leading-relaxed">
                                    Tarih: {transaction.date}
                                    <br />
                                    Belge No: {transaction.invoiceNo || `INV-${Math.floor(Math.random() * 10000)}`}
                                  </div>
                                </div>
                              </div>

                              {/* Kalın Siyah Çizgi */}
                              <div className="border-b-[3px] border-zinc-950 mb-6"></div>

                              {/* Recipient Info */}
                              <div className="mb-8">
                                <div className="text-xs text-zinc-800 font-semibold mb-0.5">Sayın,</div>
                                <div className="font-extrabold text-[17px] text-zinc-950 tracking-wide uppercase" style={{ fontWeight: 800 }}>
                                  {transaction.cariName?.toLocaleUpperCase('tr-TR')}
                                </div>
                                {currentCariForPrint && (
                                  <div className="text-xs text-zinc-500 mt-1 whitespace-pre-line font-sans leading-normal">
                                    {currentCariForPrint.address ? <p>{currentCariForPrint.address}</p> : <p className="text-zinc-400 italic text-[11px]">Kayıtlı adres bulunmuyor.</p>}
                                    {(currentCariForPrint.taxOffice || currentCariForPrint.taxNo) && (
                                      <p className="font-semibold text-zinc-600 mt-1">
                                        V.Dairesi: {currentCariForPrint.taxOffice || '-'} / Vergi No: {currentCariForPrint.taxNo || '-'}
                                      </p>
                                    )}
                                    {currentCariForPrint.phone && <p className="font-bold text-zinc-700">Tel: {currentCariForPrint.phone}</p>}
                                  </div>
                                )}
                              </div>

                              {/* Table Section */}
                              <table className="w-full text-left text-xs mb-8 border-collapse">
                                <thead>
                                  <tr className="bg-[#f0f4f8] text-zinc-800 font-bold text-xs border-y border-zinc-200">
                                    <th className="py-2.5 px-3 font-bold text-zinc-800">Ürün / Hizmet</th>
                                    <th className="py-2.5 px-3 font-bold text-zinc-800 text-center w-24">Miktar</th>
                                    {activeTemplate?.showUnitPrice !== false && <th className="py-2.5 px-3 font-bold text-zinc-800 text-right w-32">Birim Fiyat</th>}
                                    {activeTemplate?.showDiscountRate && <th className="py-2.5 px-3 font-bold text-zinc-800 text-center w-24">KDV</th>}
                                    <th className="py-2.5 px-3 font-bold text-zinc-800 text-right w-36">Toplam</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {transaction.items && transaction.items.length > 0 ? (
                                    transaction.items.map((item, idx) => (
                                      <tr key={idx} className="border-b border-zinc-200/60">
                                        <td className="py-2.5 px-3 text-zinc-800 font-normal">
                                          <div className="flex items-center gap-2">
                                            {activeTemplate?.showProductImage && (() => {
                                              const matchedStock = stoklar?.find(s => s.id === item.stockId);
                                              return matchedStock?.imageUrl ? (
                                                <img src={matchedStock.imageUrl} alt={item.stockName} className="w-6 h-6 object-cover rounded shrink-0 border border-zinc-200" referrerPolicy="no-referrer" />
                                              ) : (
                                                <div className="w-6 h-6 bg-zinc-100 border border-zinc-200 rounded shrink-0 flex items-center justify-center">
                                                  <span className="text-[9px] font-bold text-zinc-400">{item.stockName?.charAt(0).toLocaleUpperCase('tr-TR')}</span>
                                                </div>
                                              );
                                            })()}
                                            <span>{item.stockName}</span>
                                          </div>
                                        </td>
                                        <td className="py-2.5 px-3 text-zinc-500 text-center">
                                          {item.quantity} {item.unit || 'Adet'}
                                        </td>
                                        {activeTemplate?.showUnitPrice !== false && (
                                          <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                            {formatPrintCurrency(item.price, transaction.currency || 'TRY')}
                                          </td>
                                        )}
                                        {activeTemplate?.showVatRate && (
                                          <td className="py-2.5 px-3 text-zinc-500 text-center font-mono">
                                            %{item.taxRate || 20}
                                          </td>
                                        )}
                                        <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono">
                                          {formatPrintCurrency(item.total, transaction.currency || 'TRY')}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    /* Receipts fallback (collection or payment) */
                                    <tr className="border-b border-zinc-200/60">
                                      <td className="py-2.5 px-3 text-zinc-800">
                                        {transaction.type === 'collection' ? 'Tahsilat Makbuzu' : 'Ödeme Makbuzu'}
                                        <div className="text-[10px] text-zinc-500 mt-0.5 font-sans">
                                          {transaction.description || 'Cari hesaba yansıtılan finans hareketi.'}
                                        </div>
                                      </td>
                                      <td className="py-2.5 px-3 text-zinc-500 text-center">1 Adet</td>
                                      {activeTemplate?.showUnitPrice !== false && (
                                        <td className="py-2.5 px-3 text-zinc-600 text-right font-mono">
                                          {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                        </td>
                                      )}
                                      {activeTemplate?.showVatRate && <td className="py-2.5 px-3 text-zinc-500 text-center font-mono">-</td>}
                                      <td className="py-2.5 px-3 font-bold text-zinc-900 text-right font-mono">
                                        {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              {/* Genel Toplam Area (Altta, Sağa Hizalı) */}
                              <div className="flex flex-col items-end">
                                <div className="w-80 border-t border-zinc-300 pt-3 flex justify-between items-center">
                                  <span className="font-bold text-zinc-900 text-sm">Genel Toplam:</span>
                                  <span className="font-bold text-zinc-950 text-sm font-mono">
                                    {formatPrintCurrency(transaction.amount, transaction.currency || 'TRY')}
                                  </span>
                                </div>

                                {/* Bilgilendirme ve Açıklama Yazısı */}
                                <div className="w-full mt-10 grid grid-cols-2 gap-4 items-start text-left">
                                  <div className="text-[10px] text-zinc-400 font-mono leading-relaxed">
                                    <span className="font-bold tracking-wider text-zinc-300 uppercase">Bizi Tercih Ettiğiniz İçin Teşekkür Ederiz</span>
                                    {printedBankDetails}
                                  </div>
                                  {dynamicPrintVars?.notes && (
                                    <div className="text-right">
                                      <span className="font-bold text-zinc-400 text-[8px] uppercase tracking-widest block mb-1">AÇIKLAMA</span>
                                      <p className="text-[10px] text-zinc-500 leading-snug whitespace-pre-line font-sans">
                                        {dynamicPrintVars.notes}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {printedSignatureArea}
                            </div>
                            
  );
}
