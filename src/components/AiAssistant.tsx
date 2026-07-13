import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles, AlertCircle, Settings, Bot, Mic } from 'lucide-react';

const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

interface AiAssistantProps {
  apiKey: string;
  onNavigateToSettings: () => void;
  onCommandParsed: (command: any) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
}

const AI_EXAMPLES = [
  '"Ahmet Yılmaz\'a 10 adet Monitör sat, birim fiyat 5000 TL"',
  '"Elektrik faturası için 1500 TL masraf gir"',
  '"Ali Kaya\'dan 10000 TL tahsilat yap"',
  '"Tedarikçi AŞ\'ye 25000 TL ödeme yap"',
  '"Ayşe Demir\'e 5000 TL avans ödemesi gir"',
  '"XYZ Lojistik\'ten 50 adet Klavye alışı yap, birim fiyatı 200 TL"',
  '"350 TL Su faturası masrafı ekle"',
  '"Yeni müşteri ekle: Mehmet Demir, Telefon: 0555 123 4567"',
  '"Yeni tedarikçi ekle: ABC Toptan Ticaret, bakiye: -5000 TL"',
  '"Yeni ürün ekle: Kablosuz Mouse, Alış: 150 TL, Satış: 250 TL, Stok: 100 adet"',
  '"Geçen ayki satış analizimi nasıl görebilirim?"'
];

export default function AiAssistant({ apiKey, onNavigateToSettings, onCommandParsed }: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Clear listening error automatically after 12 seconds
  useEffect(() => {
    if (listeningError) {
      const timer = setTimeout(() => {
        setListeningError(null);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [listeningError]);

  const startListening = () => {
    setListeningError(null);
    if (!SpeechRecognition) {
      setListeningError("Ses tanıma desteklenmiyor.");
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'tr-TR';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const text = event.results[i][0].transcript;
          if (text) {
            finalTranscript += (finalTranscript ? ' ' : '') + text.trim();
          }
        }
        if (finalTranscript) {
          setInput(prev => prev + (prev ? ' ' : '') + finalTranscript);
        }
      };

      rec.onerror = (event: any) => {
        if (event.error !== 'no-speech' && event.error !== 'not-allowed') {
          console.error("Speech recognition error:", event.error);
        } else {
          console.warn("Speech recognition info:", event.error);
        }
        setIsListening(false);

        const isIframe = typeof window !== 'undefined' && window.self !== window.top;

        if (event.error === 'not-allowed') {
          if (isIframe) {
            setListeningError("Mikrofon izni alınamadı. Önizleme ekranında (Iframe) olduğunuz için tarayıcı güvenlik politikaları ses tanımayı engelliyor olabilir. Tam performans için lütfen sağ üstteki butonla uygulamayı 'Yeni Sekmede Aç'arak deneyin.");
          } else {
            setListeningError("Mikrofon izni verilmedi. Lütfen tarayıcınızın adres çubuğundaki kilit simgesine tıklayarak mikrofon erişimine izin verin.");
          }
        } else if (event.error === 'no-speech') {
          // No-speech is a normal timeout event when user doesn't say anything.
          // Handle it silently to prevent disruptive warnings or validation alerts.
        } else if (event.error === 'network') {
          if (isIframe) {
            setListeningError("Ses tanıma sunucu bağlantısı kurulamadı. Önizleme ekranı yerine lütfen uygulamayı sağ üstteki 'Yeni Sekmede Aç' butonuyla açıp orada deneyin.");
          } else {
            setListeningError("Ses tanıma için Google API bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin veya yazarak iletişim kurun.");
          }
        } else if (event.error === 'audio-capture') {
          setListeningError("Ses kaydedilemedi. Mikrofon donanımınızı veya bağlantı kablolarınızı kontrol edin.");
        } else if (event.error === 'aborted') {
          setListeningError("Sesli asistan işlemi iptal edildi.");
        } else {
          setListeningError(`Ses tanıma hatası (${event.error}). Lütfen uygulamayı yeni sekmede açarak mikrofon izniyle deneyin.`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  useEffect(() => {
    // Set a random example on mount
    const randomExample = AI_EXAMPLES[Math.floor(Math.random() * AI_EXAMPLES.length)];
    setMessages([
      {
        id: '1',
        role: 'assistant',
        text: `Merhaba! Ben Storm AI. Size nasıl yardımcı olabilirim?\nÖrneğin: ${randomExample}`
      }
    ]);
  }, []);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timerId = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [messages, isOpen, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userMessage }]);
    setIsTyping(true);

    try {
      const today = new Date().toLocaleDateString('tr-TR');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Sen Storm Muhasebe asistanısın. Kullanıcının girdisini analiz et. Bugünün tarihi: ${today}.
Eğer girdi bir finansal işlem (satış, alış, tahsilat, ödeme, masraf, personel maaş/avans ödemesi) içeriyorsa, SADECE şu JSON formatını döndür: 
{ "tip": "islem", "islem": "satis|alis|tahsilat|odeme|masraf|personel", "cariAdi": "string", "urunAdi": "string", "miktar": number, "fiyat": number, "kdv": number, "tarih": "YYYY-MM-DD" }
KDV belirtilmemişse her zaman 0 yap. Personel ödemelerinde "cariAdi" veya "urunAdi" alanına personelin adını yaz. Masraflarda (ör: su faturası, elektrik) faturanın cinsini "urunAdi" kısmına yaz. Eğer tarih belirtilmemişse veya 'bugün' denilmişse bugünün tarihini ver. Eğer belirsiz bir şey varsa mantıksal tahmin yürüt.

Eğer girdi bir MÜŞTERİ EKLEME/TANIMLAMA isteği ise (ör: "Mehmet Demir adında müşteri ekle, tel: 0555...", "Yeni müşteri tanımla: Can A.Ş.", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_customer", "cariAdi": "Müşteri Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY|USD|EUR" }

Eğer girdi bir TEDARİKÇİ EKLEME/TANIMLAMA isteği ise (ör: "XYZ Toptan adında tedarikçi ekle", "Yeni tedarikçi tanımla: ABC Gıda, borç bakiye: -3000 TL", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_supplier", "cariAdi": "Tedarikçi Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY|USD|EUR" }

Eğer girdi bir ÜRÜN / STOK KARTI EKLEME/TANIMLAMA isteği ise (ör: "Kablosuz Mouse ekle, alış 150 TL, satış 250 TL, stok 100 adet, KDV 20%", "Yeni ürün tanımla: Klavye", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_product", "urunAdi": "Ürün Adı", "code": "Stok Kodu (ör: STK-001 gibi, belirtilmemişse boş bırak)", "barcode": "Barkod (varsa)", "unit": "Adet|KG|Litre|Metre|Kutu|Hizmet (belirtilmemişse Adet)", "purchasePrice": number, "salesPrice": number, "kdv": number (ör: 20 veya 10, belirtilmemişse 20), "miktar": miktar_sayi_değilse_0, "minQuantity": number (kritik limit, belirtilmemişse 5) }

Eğer kullanıcı sadece bir soru soruyorsa, bilgi istiyorsa veya uygulamanın nasıl kullanılacağı hakkında (örneğin: sistem verileri nasıl sıfırlanır, fatura nasıl kesilir, vb.) bir şey diyorsa, SADECE şu JSON formatını döndür:
{ "tip": "bilgi", "mesaj": "Kullanıcıya verilecek açıklayıcı, profesyonel, yönlendirici veya bilgilendirici cevap metni." }

Yalnızca geçerli bir JSON döndür, etrafında markdown (\`\`\`json vb.) kullanma.` }]
          },
          contents: [{ parts: [{ text: userMessage }] }],
          generationConfig: {
            temperature: 0.1,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız oldu.');
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      
      // Try to parse JSON from the response
      try {
        let jsonStr = responseText.trim();
        // Remove markdown formatting if the model still includes it
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
        jsonStr = jsonStr.trim();
        
        const parsedCommand = JSON.parse(jsonStr);
        
        if (parsedCommand.tip === 'bilgi') {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            text: parsedCommand.mesaj 
          }]);
          setIsTyping(false);
          return;
        }

        // Map Turkish operation names to our internal ones if necessary
        if (parsedCommand.islem === 'satis') parsedCommand.islem = 'sale';
        else if (parsedCommand.islem === 'alis') parsedCommand.islem = 'purchase';
        else if (parsedCommand.islem === 'tahsilat') parsedCommand.islem = 'collection';
        else if (parsedCommand.islem === 'odeme') parsedCommand.islem = 'payment';
        else if (parsedCommand.islem === 'masraf') parsedCommand.islem = 'expense';
        else if (parsedCommand.islem === 'personel') parsedCommand.islem = 'employee_payment';
        else if (parsedCommand.islem === 'musteri_ekle') parsedCommand.islem = 'add_customer';
        else if (parsedCommand.islem === 'tedarikci_ekle') parsedCommand.islem = 'add_supplier';
        else if (parsedCommand.islem === 'urun_ekle') parsedCommand.islem = 'add_product';

        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          text: `İşlemi anladım. Yönlendiriyorum ve formu sizin için dolduruyorum...` 
        }]);

        setTimeout(() => {
          onCommandParsed(parsedCommand);
          setIsOpen(false);
        }, 1500);

      } catch (parseError) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'assistant', 
          text: `Anladığım kadarıyla işlem yapamadım. Lütfen daha net bir ifade kullanın. (${responseText})`,
          isError: true
        }]);
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "Sistemle iletişim kurulurken bir hata oluştu. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.";
      if (error.status === 429) errorMsg = "API limitlerine ulaşıldı. Lütfen daha sonra tekrar deneyin veya kotalarınızı kontrol edin.";
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'assistant', 
        text: errorMsg,
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-slide-up origin-bottom-right">
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, var(--accent-800, #991b1b), var(--accent-950, #4c0519))' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border relative" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500, #ef4444) 20%, transparent)', color: 'var(--accent-400, #f87171)', borderColor: 'color-mix(in srgb, var(--accent-500, #ef4444) 30%, transparent)' }}>
                <Bot size={16} />
                <Sparkles size={8} className="absolute -top-1 -right-1 animate-pulse text-yellow-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Storm AI</h3>
                <p className="text-[11px] font-mono font-medium tracking-wide" style={{ color: 'color-mix(in srgb, var(--accent-100, #fee2e2) 90%, white)' }}>Akıllı Asistan</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {!apiKey ? (
            <div className="p-6 flex flex-col items-center justify-center text-center h-[300px] bg-slate-50">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-slate-900 font-bold mb-2">API Anahtarı Eksik</h4>
              <p className="text-slate-500 text-sm mb-6">Storm AI'ı kullanabilmek için Ayarlar bölümünden Gemini API anahtarınızı girmeniz gerekmektedir.</p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSettings();
                }}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm"
              >
                <Settings size={16} />
                Ayarlara Git
              </button>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="p-4 h-[350px] overflow-y-auto bg-slate-50 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-teal-600 text-white rounded-br-none' 
                          : msg.isError 
                            ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-none'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Speech Recognition Error Notice Banner */}
              {listeningError && (
                <div className="mx-3 mt-1 mb-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl flex items-start justify-between gap-3 text-xs text-red-700 animate-fade-in shadow-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 text-red-500 mt-0.5" />
                    <span className="font-medium leading-normal">{listeningError}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setListeningError(null)}
                    className="text-red-400 hover:text-red-600 font-bold text-[10px] uppercase tracking-wider cursor-pointer transition px-1.5 py-0.5 rounded-md hover:bg-red-100/50 shrink-0 self-start mt-0.5"
                  >
                    Kapat
                  </button>
                </div>
              )}

              {/* If in iframe, show a friendly tip about Open in New Tab for speech recognition */}
              {typeof window !== 'undefined' && window.self !== window.top && !listeningError && (
                <div className="mx-3 mt-1 mb-2 px-3 py-1.5 bg-amber-50/70 border border-amber-100 rounded-xl flex items-center justify-between gap-2 text-[10px] text-amber-800 animate-fade-in shadow-2xs">
                  <span className="leading-tight">
                    💡 <strong>Önizleme İpucu:</strong> Sesli komutların sorunsuz çalışması için uygulamayı sağ üstteki <strong>"Yeni Sekmede Aç"</strong> butonuyla açabilirsiniz.
                  </span>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-200 flex gap-2">
                <div className="relative flex-1 flex items-center">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      if (listeningError) setListeningError(null);
                    }}
                    placeholder={
                      listeningError 
                        ? listeningError 
                        : isListening 
                          ? "Dinleniyor, konuşabilirsiniz..." 
                          : "Bir işlem veya sesli komut yazın..."
                    }
                    className={`w-full bg-slate-50 border border-slate-200 focus:border-teal-500 outline-none rounded-xl pl-4 pr-10 py-2.5 text-sm transition ${
                      listeningError
                        ? 'border-red-300 bg-red-50 text-red-700 placeholder-red-400 focus:border-red-500'
                        : isListening 
                          ? 'border-red-400 focus:border-red-500 bg-red-50/20 text-slate-900' 
                          : 'text-slate-900'
                    }`}
                    disabled={isTyping}
                  />
                  {SpeechRecognition && (
                    <button
                      type="button"
                      onClick={isListening ? stopListening : startListening}
                      className={`absolute right-2.5 p-1.5 rounded-lg transition-all ${
                        isListening 
                          ? 'text-red-500 hover:bg-red-100 bg-red-50 animate-pulse' 
                          : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title={isListening ? "Dinlemeyi Durdur" : "Sesle Yazdır"}
                    >
                      <Mic size={16} className={isListening ? "animate-bounce text-red-600" : ""} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping || isListening}
                  className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:hover:bg-teal-600"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-2 relative group mt-2">
          {/* Tooltip-like or subtext */}
          <div className="absolute -top-12 text-white text-[11px] px-4 py-2 rounded-xl shadow-xl font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20" style={{ backgroundColor: 'var(--accent-600, #dc2626)' }}>
            SİZE NASIL YARDIMCI OLABİLİRİM?
          </div>
          
          <div className="relative">
            {/* Outer glowing rings */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: 'var(--accent-500, #ef4444)', animationDuration: '2s' }}></div>
            <div className="absolute -inset-2 rounded-full animate-pulse opacity-20" style={{ backgroundColor: 'var(--accent-400, #f87171)' }}></div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border-[3px] border-white/90 relative hover:brightness-125 z-10"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-400, #f87171), var(--accent-600, #dc2626), var(--accent-900, #7f1d1d))',
                boxShadow: '0 0 25px color-mix(in srgb, var(--accent-500, #ef4444) 80%, transparent), inset 0 0 10px rgba(255,255,255,0.5)'
              }}
            >
              <div className="relative flex items-center justify-center">
                <Bot size={34} className="text-white drop-shadow-[0_0_12px_rgba(255,255,255,1)] transition-transform group-hover:rotate-12" />
                <Sparkles size={14} className="absolute -top-3 -right-3 text-yellow-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <Sparkles size={10} className="absolute -bottom-1 -left-3 text-yellow-100 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white animate-pulse shadow-[0_0_12px_#22c55e] z-20" style={{ backgroundColor: '#22c55e' }}></div>
            </button>
          </div>

          <span className="text-[11px] font-black text-slate-800 bg-white/95 px-3 py-1 rounded-lg shadow-md border border-slate-200 uppercase tracking-widest mt-1">
            Storm AI
          </span>
        </div>
      )}
    </div>
  );
}
