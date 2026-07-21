import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Sparkles, AlertCircle, Settings, Bot, Mic, HelpCircle, Sliders, BookOpen, ChevronRight, Check } from 'lucide-react';

interface AiAssistantProps {
  apiKey: string;
  userRole?: 'admin' | 'employee';
  isSecurityActive?: boolean;
  sensitiveTabs?: string[];
  actionPermissions?: any;
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

export default function AiAssistant({ 
  apiKey, 
  userRole = 'employee',
  isSecurityActive = false,
  sensitiveTabs = [],
  actionPermissions = {},
  onNavigateToSettings, 
  onCommandParsed 
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Audio visualizer refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isListeningRef = useRef<boolean>(false);

  // Audio input devices list and preference
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(() => {
    return localStorage.getItem('storm_selected_mic_id') || '';
  });

  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [sensitivity, setSensitivity] = useState<number>(() => {
    return Number(localStorage.getItem('storm_mic_sensitivity')) || 3;
  });

  const [micPermission, setMicPermission] = useState<'granted' | 'prompt' | 'denied' | 'unsupported'>('prompt');

  // Check microphone permissions using Permissions API
  const checkMicPermission = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices) {
      setMicPermission('unsupported');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setMicPermission(result.state as any);
        
        result.onchange = () => {
          setMicPermission(result.state as any);
        };
      } catch (e) {
        console.warn("Permissions API query failed, falling back to device-based checking:", e);
        await fallbackPermissionCheck();
      }
    } else {
      await fallbackPermissionCheck();
    }
  };

  const fallbackPermissionCheck = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasMic = devices.some(device => device.kind === 'audioinput');
      if (!hasMic) {
        setMicPermission('unsupported');
        return;
      }
      // If we have at least one audio input device with a non-empty label, it means permission was already granted.
      const hasLabel = devices.some(device => device.kind === 'audioinput' && device.label);
      setMicPermission(hasLabel ? 'granted' : 'prompt');
    } catch (err) {
      setMicPermission('prompt');
    }
  };

  // Query and list available microphone devices
  const loadAudioDevices = async () => {
    try {
      if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }
      await checkMicPermission();
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(device => device.kind === 'audioinput');
      setAudioDevices(mics);
      
      if (mics.length > 0) {
        const storedId = localStorage.getItem('storm_selected_mic_id');
        const exists = mics.some(m => m.deviceId === storedId);
        if (storedId && exists) {
          setSelectedDeviceId(storedId);
        } else {
          setSelectedDeviceId(mics[0].deviceId);
          localStorage.setItem('storm_selected_mic_id', mics[0].deviceId);
        }
      }
    } catch (err) {
      console.error("Error enumerating audio devices:", err);
    }
  };

  // Check and load audio devices when chat is opened
  useEffect(() => {
    if (isOpen) {
      loadAudioDevices();
    }
  }, [isOpen]);

  // Listen to device insertion/removal (hotplugging)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', loadAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', loadAudioDevices);
      };
    }
  }, []);

  // Clear listening error automatically after 12 seconds
  useEffect(() => {
    if (listeningError) {
      const timer = setTimeout(() => {
        setListeningError(null);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [listeningError]);

  const stopVisualizer = () => {
    isListeningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.warn("Error closing AudioContext:", err));
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const startVisualizer = () => {
    isListeningRef.current = true;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const draw = () => {
      if (!isListeningRef.current || !analyserRef.current || !canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle background grid/line
      ctx.strokeStyle = 'rgba(13, 148, 136, 0.15)'; // extremely light teal
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // Symmetrical visualizer bars
      const barWidth = (width / bufferLength) * 0.85;
      let x = (width - (bufferLength * barWidth)) / 2; // center the bars

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        let barHeight = (val / 255) * height * 1.35;
        if (barHeight > height) barHeight = height;
        if (barHeight < 2) barHeight = 2; // minimum height when silent so it looks alive

        ctx.fillStyle = `rgba(13, 148, 136, ${0.45 + (val / 255) * 0.55})`; // dynamic opacity teal-600
        const y = (height - barHeight) / 2;
        
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, barWidth - 1, barHeight, 1);
        } else {
          ctx.rect(x, y, barWidth - 1, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Delay slightly to let canvas mount in the DOM
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(draw);
    }, 150);
  };

  // Clean up recording on unmount or close
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopVisualizer();
    };
  }, []);

  const startListening = async () => {
    setListeningError(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setListeningError("Cihazınızda mikrofon erişimi desteklenmiyor.");
      return;
    }

    try {
      let stream: MediaStream;
      
      // Try using the user-selected microphone device ID
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedDeviceId ? { 
            deviceId: { exact: selectedDeviceId },
            echoCancellation: sensitivity >= 3,
            noiseSuppression: sensitivity >= 3,
            autoGainControl: sensitivity >= 3
          } : {
            echoCancellation: sensitivity >= 3,
            noiseSuppression: sensitivity >= 3,
            autoGainControl: sensitivity >= 3
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (deviceError) {
        console.warn("Could not open specific selected microphone, falling back to default device:", deviceError);
        // Fallback to default microphone if selected one failed or unplugged
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: sensitivity >= 3,
            noiseSuppression: sensitivity >= 3,
            autoGainControl: sensitivity >= 3
          }
        });
      }

      // Re-load devices so the system populates device labels/names now that permission has been granted
      setTimeout(() => {
        loadAudioDevices();
      }, 600);
      
      let options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release the microphone immediately
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) {
          setListeningError("Ses kaydedilemedi.");
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        
        // Convert to Base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          try {
            const base64Data = (reader.result as string).split(',')[1];
            await handleAudioInput(base64Data, options.mimeType);
          } catch (err) {
            console.error("Audio processing error:", err);
            setListeningError("Ses işlenirken bir hata oluştu.");
          }
        };
      };

      mediaRecorder.start();
      setIsListening(true);
      isListeningRef.current = true;

      // Web Audio API setup for visualizer
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 32; // Responsive 16 frequency bands
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          
          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;
          
          startVisualizer();
        }
      } catch (audioCtxError) {
        console.warn("Failed to initialize Web Audio API for visualizer:", audioCtxError);
      }

      // Max 30 seconds limit to avoid infinite recording
      if (recordingTimerRef.current) clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopListening();
        }
      }, 30000);

    } catch (err: any) {
      console.error("Microphone access error:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setListeningError("Mikrofon izni verilmedi. Lütfen sistem ayarlarından veya tarayıcınızdan mikrofon erişimine izin verin.");
      } else {
        setListeningError("Mikrofon bağlantısı kurulamadı. Lütfen mikrofonunuzu kontrol edin.");
      }
      setIsListening(false);
    }
  };

  const stopListening = () => {
    stopVisualizer();
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const handleAudioInput = async (base64Audio: string, mimeType: string) => {
    if (!apiKey) return;

    const tempUserMessageId = Date.now().toString();
    setMessages(prev => [...prev, { 
      id: tempUserMessageId, 
      role: 'user', 
      text: '🎤 [Sesli komut çözümleniyor...]' 
    }]);
    setIsTyping(true);

    try {
      const today = new Date().toLocaleDateString('tr-TR');

      let securityGuideline = '';
      if (isSecurityActive && userRole === 'employee') {
        const restrictedTabsList = sensitiveTabs.map(t => {
          if (t === 'dashboard') return 'Yönetim Paneli (dashboard)';
          if (t === 'kasa') return 'Kasa ve Banka Hesapları (kasa)';
          if (t === 'ceksenet') return 'Çek/Senet Yönetimi (ceksenet)';
          if (t === 'masraflar') return 'Gider Girişi ve Masraflar (masraflar)';
          if (t === 'calisanlar') return 'Personel Yönetimi ve Maaş Ödemeleri (calisanlar)';
          if (t === 'krediler') return 'Krediler Takibi (krediler)';
          if (t === 'raporlar') return 'Detaylı Raporlama ve Analiz (raporlar)';
          if (t === 'ayarlar') return 'Uygulama ve Sistem Ayarları (ayarlar)';
          return t;
        }).join(', ');

        securityGuideline = `
[KRİTİK GÜVENLİK KISITLAMASI]
Aktif kullanıcı rolünüz "Personel" (Sınırlı Yetki) ve güvenlik PIN koruma modu aktiftir.
Erişiminiz dışındaki menüler: [${restrictedTabsList}].
Kullanıcı bu yasaklı alanlardan birine ait bir işlem yapmaya çalışırsa (örneğin: masraf girişi 'masraf', personel ödemesi 'personel', kasa raporu sorma vb.) veya bu menülere gitmek isterse:
KESİNLİKLE bu işlemi gerçekleştirmeyin ve SADECE şu JSON formatını döndürün:
{ "tip": "bilgi", "mesaj": "Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya bu menüye erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız.", "transcription": "ses kaydının metin hali" }
`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Sen Storm Muhasebe asistanısın. Kullanıcının ses kaydını analiz et. Bugünün tarihi: ${today}.${securityGuideline}
Mevcut Ses Tanıma Hassasiyeti Seviyesi: ${sensitivity}/5 (1: Düşük, 3: Dengeli, 5: Çok Hassas/Toleranslı)
- Hassasiyet seviyesi 4 veya 5 ise: Arka plandaki çevre gürültülerini, mırıldanmaları, peltek veya eksik söylenen kelimeleri, nefes seslerini tolere et ve en olası muhasebe veya işlem terimiyle tamamlayarak deşifre et.
- Hassasiyet seviyesi 3 ise: Standart ses çözümlemesi yap.
- Hassasiyet seviyesi 1 veya 2 ise: Sadece çok net ve bariz duyulan kelimeleri birebir yazıya dök, şüpheli durumlarda tahmin yürütme.

Öncelikle ses kaydındaki konuşmayı bu hassasiyet kurallarına göre Türkçe olarak yazıya dök (transcribe et) ve JSON sonucundaki "transcription" alanına yaz.

Eğer girdi bir finansal işlem (satış, alış, tahsilat, ödeme, masraf, personel maaş/avans ödemesi) içeriyorsa, SADECE şu JSON formatını döndür: 
{ "tip": "islem", "islem": "satis|alis|tahsilat|odeme|masraf|personel", "cariAdi": "string", "urunAdi": "string", "miktar": number, "fiyat": number, "kdv": number, "tarih": "YYYY-MM-DD", "transcription": "ses kaydının metin hali" }
KDV belirtilmemişse her zaman 0 yap. Personel ödemelerinde "cariAdi" veya "urunAdi" alanına personelin adını yaz. Masraflarda (ör: su faturası, elektrik) faturanın cinsini "urunAdi" kısmına yaz. Eğer tarih belirtilmemişse veya 'bugün' denilmişse bugünün tarihini ver. Eğer belirsiz bir şey varsa mantıksal tahmin yürüt.

Eğer girdi bir MÜŞTERİ EKLEME/TANIMLAMA isteği ise (ör: "Mehmet Demir adında müşteri ekle, tel: 0555...", "Yeni müşteri tanımla: Can A.Ş.", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_customer", "cariAdi": "Müşteri Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY|USD|EUR", "transcription": "ses kaydının metin hali" }

Eğer girdi bir TEDARİKÇİ EKLEME/TANIMLAMA isteği ise (ör: "XYZ Toptan adında tedarikçi ekle", "Yeni tedarikçi tanımla: ABC Gıda, borç bakiye: -3000 TL", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_supplier", "cariAdi": "Tedarikçi Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY|USD|EUR", "transcription": "ses kaydının metin hali" }

Eğer girdi bir ÜRÜN / STOK KARTI EKLEME/TANIMLAMA isteği ise (ör: "Kablosuz Mouse ekle, alış 150 TL, satış 250 TL, stok 100 adet, KDV 20%", "Yeni ürün tanımla: Klavye", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_product", "urunAdi": "Ürün Adı", "code": "Stok Kodu (ör: STK-001 gibi, belirtilmemişse boş bırak)", "barcode": "Barkod (varsa)", "unit": "Adet|KG|Litre|Metre|Kutu|Hizmet (belirtilmemişse Adet)", "purchasePrice": number, "salesPrice": number, "kdv": number (ör: 20 veya 10, belirtilmemişse 20), "miktar": miktar_sayi_değilse_0, "minQuantity": number (kritik limit, belirtilmemişse 5), "transcription": "ses kaydının metin hali" }

Eğer kullanıcı sadece bir soru soruyorsa, bilgi istiyorsa veya uygulamanın nasıl kullanılacağı hakkında (örneğin: sistem verileri nasıl sıfırlanır, fatura nasıl kesilir, vb.) bir şey diyorsa, SADECE şu JSON formatını döndür:
{ "tip": "bilgi", "mesaj": "Kullanıcıya verilecek açıklayıcı, profesyonel, yönlendirici veya bilgilendirici cevap metni.", "transcription": "ses kaydının metin hali" }

Yalnızca geçerli bir JSON döndür, etrafında markdown (\`\`\`json vb.) kullanma.` }]
          },
          contents: [{
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio
                }
              },
              {
                text: "Bu ses kaydını dinle, deşifre et ve analiz et."
              }
            ]
          }],
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

      try {
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
        jsonStr = jsonStr.trim();
        
        const parsedCommand = JSON.parse(jsonStr);

        // Update the user message to show the real transcription
        if (parsedCommand.transcription) {
          setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { 
            ...m, 
            text: `🎤 Söylediğiniz: "${parsedCommand.transcription}"` 
          } : m));
        } else {
          setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { 
            ...m, 
            text: `🎤 [Ses çözümlendi]` 
          } : m));
        }
        
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

        // Code enforcement guard for sensitive operations
        let targetTab = 'islemler';
        if (parsedCommand.islem === 'expense') targetTab = 'masraflar';
        else if (parsedCommand.islem === 'employee_payment') targetTab = 'calisanlar';
        else if (parsedCommand.islem === 'add_customer' || parsedCommand.islem === 'add_supplier') targetTab = 'cariler';
        else if (parsedCommand.islem === 'add_product') targetTab = 'stoklar';

        if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(targetTab)) {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            text: `Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya "${targetTab.toUpperCase()}" menüsüne erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız.`,
            isError: true
          }]);
          setIsTyping(false);
          return;
        }

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
        setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { 
          ...m, 
          text: `🎤 Ses kaydı alındı ancak anlaşılamadı. Lütfen tekrar daha net konuşun.` 
        } : m));
      }

    } catch (error: any) {
      console.error("Audio AI Error:", error);
      let errorMsg = "Sistemle iletişim kurulurken bir hata oluştu. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.";
      if (error.status === 429) errorMsg = "API limitlerine ulaşıldı. Lütfen daha sonra tekrar deneyin.";
      
      setMessages(prev => prev.map(m => m.id === tempUserMessageId ? { 
        ...m, 
        text: `🎤 [Ses analiz hatası]` 
      } : m));

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

      let securityGuideline = '';
      if (isSecurityActive && userRole === 'employee') {
        const restrictedTabsList = sensitiveTabs.map(t => {
          if (t === 'dashboard') return 'Yönetim Paneli (dashboard)';
          if (t === 'kasa') return 'Kasa ve Banka Hesapları (kasa)';
          if (t === 'ceksenet') return 'Çek/Senet Yönetimi (ceksenet)';
          if (t === 'masraflar') return 'Gider Girişi ve Masraflar (masraflar)';
          if (t === 'calisanlar') return 'Personel Yönetimi ve Maaş Ödemeleri (calisanlar)';
          if (t === 'krediler') return 'Krediler Takibi (krediler)';
          if (t === 'raporlar') return 'Detaylı Raporlama ve Analiz (raporlar)';
          if (t === 'ayarlar') return 'Uygulama ve Sistem Ayarları (ayarlar)';
          return t;
        }).join(', ');

        securityGuideline = `
[KRİTİK GÜVENLİK KISITLAMASI]
Aktif kullanıcı rolünüz "Personel" (Sınırlı Yetki) ve güvenlik PIN koruma modu aktiftir.
Erişiminiz dışındaki menüler: [${restrictedTabsList}].
Kullanıcı bu yasaklı alanlardan birine ait bir işlem yapmaya çalışırsa (örneğin: masraf girişi 'masraf', personel ödemesi 'personel', kasa raporu sorma vb.) veya bu menülere gitmek isterse:
KESİNLİKLE bu işlemi gerçekleştirmeyin ve SADECE şu JSON formatını döndürün:
{ "tip": "bilgi", "mesaj": "Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya bu menüye erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız." }
`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Sen Storm Muhasebe asistanısın. Kullanıcının girdisini analiz et. Bugünün tarihi: ${today}.${securityGuideline}
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

        // Code enforcement guard for sensitive operations
        let targetTab = 'islemler';
        if (parsedCommand.islem === 'expense') targetTab = 'masraflar';
        else if (parsedCommand.islem === 'employee_payment') targetTab = 'calisanlar';
        else if (parsedCommand.islem === 'add_customer' || parsedCommand.islem === 'add_supplier') targetTab = 'cariler';
        else if (parsedCommand.islem === 'add_product') targetTab = 'stoklar';

        if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(targetTab)) {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'assistant', 
            text: `Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya "${targetTab.toUpperCase()}" menüsüne erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız.`,
            isError: true
          }]);
          setIsTyping(false);
          return;
        }

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
    <div className="fixed bottom-20 right-1.5 sm:right-4 z-[100]">
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
            <div className="flex items-center gap-2">
              {apiKey && (
                <button 
                  onClick={() => setShowVoiceGuide(!showVoiceGuide)}
                  className={`p-1.5 rounded-lg transition-all ${showVoiceGuide ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Sesli Kontrol Rehberi"
                >
                  <HelpCircle size={18} />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>
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
          ) : showVoiceGuide ? (
            <div className="flex-1 h-[440px] overflow-y-auto bg-slate-50 flex flex-col animate-fade-in">
              {/* Sensitivity Settings Section */}
              <div className="p-4 bg-white border-b border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                  <Sliders size={14} className="text-teal-600 animate-pulse" />
                  <span>Ses Tanıma Hassasiyeti</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Mikrofon kaydının çevre gürültüsüne ve konuşma hızına göre toleransını ayarlayın.
                </p>
                <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                    <span>Hassasiyet Seviyesi:</span>
                    <span className="text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 font-mono text-[11px]">
                      Seviye {sensitivity}/5
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1"
                    value={sensitivity}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSensitivity(val);
                      localStorage.setItem('storm_mic_sensitivity', String(val));
                    }}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600 outline-none my-2"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                    <span>Doğal (Ham)</span>
                    <span>Dengeli</span>
                    <span>Çok Hassas</span>
                  </div>
                  <div className="mt-2 text-[10px] text-slate-600 leading-relaxed border-t border-slate-200/60 pt-2 flex items-start gap-1.5">
                    <Sparkles size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      {sensitivity <= 2 && "Düşük/Doğal Seviye: Sadece çok net sesleri algılar. Arka plan filtresi kapalıdır, sessiz odalar için uygundur."}
                      {sensitivity === 3 && "Dengeli Seviye: Standart ofis/ev ortamı için ideal, dengeli donanımsal filtreleme."}
                      {sensitivity >= 4 && "Yüksek Seviye: Gelişmiş gürültü engelleme ve mırıldanma/bozuk kelimeler için yüksek yapay zeka toleransı aktiftir."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample Commands Section */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <BookOpen size={14} className="text-rose-600" />
                  <span>Kullanabileceğiniz Sesli Komutlar</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Aşağıdaki örnek kalıpları sesli olarak söyleyebilir veya <strong className="text-teal-600 font-semibold">"Kullan"</strong> butonuna basarak metin kutusuna aktarabilirsiniz.
                </p>

                <div className="flex flex-col gap-2.5 mt-1">
                  {/* Category 1 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>💰 Satış & Alış İşlemleri</span>
                      <span className="text-[9px] text-slate-400 font-normal">Form Doldurma</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Ahmet Yılmaz'a 10 adet Monitör sat, birim fiyat 5000 TL",
                        "XYZ Lojistik'ten 50 adet Klavye alışı yap, birim fiyatı 200 TL"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowVoiceGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>🏦 Ödemeler & Tahsilatlar</span>
                      <span className="text-[9px] text-slate-400 font-normal">Kasa & Cari</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Ali Kaya'dan 10000 TL tahsilat yap",
                        "Tedarikçi AŞ'ye 25000 TL ödeme yap",
                        "Ayşe Demir'e 5000 TL avans ödemesi gir"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowVoiceGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>🏷️ Masraf & Kart Ekleme</span>
                      <span className="text-[9px] text-slate-400 font-normal">Yeni Tanımlama</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Elektrik faturası için 1500 TL masraf gir",
                        "Yeni müşteri ekle: Mehmet Demir, Telefon: 0555 123 4567",
                        "Yeni ürün ekle: Kablosuz Mouse, Alış 150 TL, Satış 250 TL"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowVoiceGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 4 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>❓ Soru Sorma & Bilgi</span>
                      <span className="text-[9px] text-slate-400 font-normal">Soru & Cevap</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Kasada ne kadar paramız var?",
                        "Geçen ayki satış analizimi nasıl görebilirim?"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowVoiceGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky bottom close */}
              <div className="p-3 bg-white border-t border-slate-100 flex justify-end shrink-0 sticky bottom-0 z-10 shadow-md">
                <button
                  type="button"
                  onClick={() => setShowVoiceGuide(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
                >
                  Sohbete Geri Dön
                </button>
              </div>
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

              {/* Microphone Permission Denied Notice Banner */}
              {micPermission === 'denied' && (
                <div className="mx-3 mt-1 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2.5 text-xs text-red-800 animate-fade-in shadow-sm">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle size={15} className="shrink-0 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold text-red-900 block mb-0.5">Mikrofon Erişimi Engellendi</span>
                      <span className="leading-relaxed">Tarayıcınızda mikrofon izni reddedilmiş durumda. Sesli komutları kullanabilmek için lütfen izin verin.</span>
                    </div>
                  </div>
                  <div className="bg-white/80 rounded-lg p-2.5 border border-red-100 flex flex-col gap-1.5 text-[10px] text-slate-700 font-medium">
                    <span className="font-bold text-slate-950 uppercase tracking-wider text-[9px]">İzin Nasıl Açılır?</span>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-teal-600">1.</span>
                      <span>Tarayıcı adres çubuğundaki <strong>Asma Kilit (🔒)</strong> simgesine tıklayın.</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-teal-600">2.</span>
                      <span><strong>Mikrofon</strong> seçeneğini bulun ve <strong>"İzin Ver"</strong> (Allow) konumuna getirin.</span>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="font-bold text-teal-600">3.</span>
                      <span>Mikrofonun aktif olması için sayfayı yenileyin.</span>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={async () => {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(track => track.stop());
                        setMicPermission('granted');
                        setListeningError(null);
                        loadAudioDevices();
                      } catch (err) {
                        setMicPermission('denied');
                        setListeningError("Mikrofon izni hâlâ kapalı durumda. Lütfen tarayıcı ayarlarınızdan izin verin.");
                      }
                    }}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] py-1.5 rounded-lg transition text-center tracking-wide cursor-pointer shadow-xs"
                  >
                    Tekrar Dene & İzin İste
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
              <div className="bg-white border-t border-slate-200">
                {/* Microphone Status Check Bar */}
                <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2 h-8">
                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    <Mic size={12} className={`${isListening ? "text-red-500 animate-pulse" : "text-teal-600"} shrink-0`} />
                    <span className="font-semibold text-slate-700 select-none">Mikrofon Durumu</span>
                  </div>
 
                  {/* Real-time Status Indicator Light */}
                  <div className="flex items-center gap-1.5 shrink-0 select-none" title="Mikrofon İzin Durumu">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      micPermission === 'granted' ? 'bg-emerald-500 animate-pulse' :
                      micPermission === 'denied' ? 'bg-rose-500' :
                      micPermission === 'prompt' ? 'bg-amber-500 animate-bounce' : 'bg-slate-400'
                    }`}></span>
                    <span className={`text-[10px] font-semibold ${
                      micPermission === 'granted' ? 'text-emerald-700' :
                      micPermission === 'denied' ? 'text-rose-700 font-bold' :
                      micPermission === 'prompt' ? 'text-amber-700' : 'text-slate-500'
                    }`}>
                      {micPermission === 'granted' && "Erişim Aktif / Hazır"}
                      {micPermission === 'denied' && "Erişim Engellendi"}
                      {micPermission === 'prompt' && "Onay Bekleniyor"}
                      {micPermission === 'unsupported' && "Desteklenmiyor"}
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-3 flex gap-2 items-center">
                  <div className="relative flex-1 flex items-center min-w-0">
                    {isListening ? (
                      <div className="w-full h-10 bg-teal-50/50 border border-teal-200 rounded-xl flex items-center justify-between px-3 overflow-hidden animate-pulse">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                          <span className="text-[11px] font-bold text-teal-800 animate-pulse">Dinleniyor...</span>
                        </div>
                        
                        {/* Dynamic Frequency Visualizer Canvas inside writing line space */}
                        <div className="flex-1 h-5 mx-2 bg-teal-600/5 rounded flex items-center border border-teal-500/10 overflow-hidden">
                          <canvas ref={canvasRef} width="160" height="20" className="w-full h-full" />
                        </div>
                      </div>
                    ) : (
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
                            : "Bir işlem veya sesli komut yazın..."
                        }
                        className={`w-full bg-slate-50 border border-slate-200 focus:border-teal-500 outline-none rounded-xl px-4 py-2.5 text-sm transition ${
                          listeningError
                            ? 'border-red-300 bg-red-50 text-red-700 placeholder-red-400 focus:border-red-500'
                            : 'text-slate-900'
                        }`}
                        disabled={isTyping}
                      />
                    )}
                  </div>

                  {/* Dedicated Microphone Button Outside the Writing Line */}
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white border-red-600 shadow-md shadow-red-200 animate-pulse' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 border-slate-200'
                    }`}
                    title={isListening ? "Dinlemeyi Durdur" : "Sesle Konuş"}
                  >
                    <Mic size={18} className={isListening ? "animate-bounce" : ""} />
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping || isListening}
                    className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:hover:bg-teal-600 shrink-0"
                  >
                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <div className="flex flex-col items-center gap-1 relative group mt-2">
          {/* Tooltip-like or subtext */}
          <div className="absolute -top-8 text-white text-[8px] px-2 py-1 rounded-md shadow-xl font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20" style={{ backgroundColor: 'var(--accent-600, #dc2626)' }}>
            SİZE NASIL YARDIMCI OLABİLİRİM?
          </div>
          
          <div className="relative">
            {/* Outer glowing rings */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: 'var(--accent-500, #ef4444)', animationDuration: '2s' }}></div>
            <div className="absolute -inset-0.5 rounded-full animate-pulse opacity-20" style={{ backgroundColor: 'var(--accent-400, #f87171)' }}></div>
            
            <button
              onClick={() => setIsOpen(true)}
              className="w-8.5 h-8.5 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white/90 relative hover:brightness-125 z-10"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-400, #f87171), var(--accent-600, #dc2626), var(--accent-900, #7f1d1d))',
                boxShadow: '0 0 10px color-mix(in srgb, var(--accent-500, #ef4444) 80%, transparent), inset 0 0 5px rgba(255,255,255,0.5)'
              }}
            >
              <div className="relative flex items-center justify-center">
                <Bot size={15} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)] transition-transform group-hover:rotate-12" />
                <Sparkles size={6} className="absolute -top-1 -right-1 text-yellow-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <Sparkles size={5} className="absolute -bottom-0.5 -left-1 text-yellow-100 animate-pulse" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white animate-pulse shadow-[0_0_5px_#22c55e] z-20" style={{ backgroundColor: '#22c55e' }}></div>
            </button>
          </div>

          <span className="hidden sm:block text-[7px] font-black text-slate-400 bg-[#070709]/95 backdrop-blur-md px-1.5 py-0.5 rounded-md shadow-md border border-white/5 uppercase tracking-widest mt-1">
            Storm AI
          </span>
        </div>
      )}
    </div>
  );
}
