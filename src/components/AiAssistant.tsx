import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Paperclip, File, FileText, FileSpreadsheet, Sparkles, AlertCircle, Settings, Bot, Mic, HelpCircle, Sliders, BookOpen, ChevronRight, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { runAgent, resumeAgent, AgentResult, AgentSuspension, GeminiContent, GeminiApiError } from '../ai/geminiAgent';
import { AiToolContext } from '../ai/aiTools';
import { useFxRates } from '../hooks/useFxRates';
import { logError } from '../utils/errorLogger';

interface AiAssistantProps {
  apiKey: string;
  userRole?: 'admin' | 'employee';
  isSecurityActive?: boolean;
  sensitiveTabs?: string[];
  actionPermissions?: any;
  onNavigateToSettings: () => void;
  onCommandParsed: (command: any) => void;
  financialData?: any;
  // Telefon saha ekranında: yüzen buton olmadan, bulunduğu alanı dolduran sohbet
  embedded?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  chart?: {
    tip: 'bar' | 'pie';
    data: any[];
  };
  // Onay bekleyen kayıt işlemleri (her öğe bir işlemin özet satırları)
  pending?: {
    items: string[][];
    status: 'waiting' | 'approved' | 'cancelled';
  };
}

const AI_EXAMPLES = [
  '"Ahmet Yılmaz\'a 10 adet monitör sat, birim fiyat 5000 TL, nakit ödendi"',
  '"Ali Kaya\'dan bankaya 10000 TL tahsilat gir"',
  '"Elektrik faturası için kasadan 1500 TL masraf gir"',
  '"Ayşe Demir\'e kasadan 5000 TL avans ver"',
  '"Bu ayki kâr-zarar durumum ne?"',
  '"Kasada ve bankada ne kadar param var?"',
  '"En çok borcu olan 5 müşteriyi göster"',
  '"Kritik seviyedeki ürünleri listele"',
  '"Önümüzdeki 7 günde vadesi dolan çekler hangileri?"',
  '"Mehmet Demir\'in ekstresini çıkar"',
  '"Masraflarımı kategoriye göre grafikle göster"',
  '"Yeni ürün ekle: Kablosuz Mouse, alış 150, satış 250, stok 100"',
  '"POS hesabındaki 20000 TL\'yi bankaya aktar"'
];

export default function AiAssistant({ 
  apiKey, 
  userRole = 'employee',
  isSecurityActive = false,
  sensitiveTabs = [],
  actionPermissions = {},
  onNavigateToSettings, 
  onCommandParsed, 
  financialData,
  embedded = false
}: AiAssistantProps) {
  const [isOpenState, setIsOpen] = useState(false);
  const isOpen = embedded || isOpenState;
  const [input, setInput] = useState('');

  // Yüzen Storm AI butonu fare ve dokunmayla sürüklenebilir; yeri hatırlanır ve ekran dışına taşmaz
  const AI_BUTTON_POSITION_KEY = 'storm_ai_button_position';
  const DRAG_THRESHOLD_PX = 6;
  const SCREEN_MARGIN_PX = 6;
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(AI_BUTTON_POSITION_KEY) || 'null');
      if (saved && Number.isFinite(saved.x) && Number.isFinite(saved.y)) return { x: saved.x, y: saved.y };
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AiAssistant.loadButtonPosition');
    }
    return { x: 0, y: 0 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const dragBounds = useRef({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
  const hasMovedRef = useRef(false);
  const floatingButtonRef = useRef<HTMLDivElement | null>(null);

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  // Pencere küçülünce ya da kayıtlı konum bu ekrana sığmıyorsa buton görünür alana geri çekilir
  useEffect(() => {
    if (embedded) return;
    const keepInside = () => {
      const el = floatingButtonRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      let dx = 0;
      let dy = 0;
      if (rect.left < SCREEN_MARGIN_PX) dx = SCREEN_MARGIN_PX - rect.left;
      else if (rect.right > window.innerWidth - SCREEN_MARGIN_PX) dx = window.innerWidth - SCREEN_MARGIN_PX - rect.right;
      if (rect.top < SCREEN_MARGIN_PX) dy = SCREEN_MARGIN_PX - rect.top;
      else if (rect.bottom > window.innerHeight - SCREEN_MARGIN_PX) dy = window.innerHeight - SCREEN_MARGIN_PX - rect.bottom;
      if (dx !== 0 || dy !== 0) setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };
    keepInside();
    window.addEventListener('resize', keepInside);
    return () => window.removeEventListener('resize', keepInside);
  }, [embedded, isOpenState]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    dragBounds.current = {
      minX: SCREEN_MARGIN_PX - rect.left,
      maxX: window.innerWidth - SCREEN_MARGIN_PX - rect.right,
      minY: SCREEN_MARGIN_PX - rect.top,
      maxY: window.innerHeight - SCREEN_MARGIN_PX - rect.bottom,
    };
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
    hasMovedRef.current = false;
    setIsDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AiAssistant.setPointerCapture');
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (!hasMovedRef.current && Math.abs(dx) < DRAG_THRESHOLD_PX && Math.abs(dy) < DRAG_THRESHOLD_PX) return;
    hasMovedRef.current = true;
    const b = dragBounds.current;
    setPosition({
      x: initialPos.current.x + clamp(dx, b.minX, b.maxX),
      y: initialPos.current.y + clamp(dy, b.minY, b.maxY),
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), 'AiAssistant.releasePointerCapture');
    }
    if (hasMovedRef.current) {
      try {
        localStorage.setItem(AI_BUTTON_POSITION_KEY, JSON.stringify(position));
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), 'AiAssistant.saveButtonPosition');
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Sürükleme bittiğinde gelen tıklama asistanı açmasın (klavye ile Enter/Boşluk yine açar)
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsOpen(true);
  };

  const [messages, setMessages] = useState<Message[]>([]);
  // Gemini sohbet geçmişi ve onay bekleyen işlemler (render dışı tutulur)
  const agentHistoryRef = useRef<GeminiContent[]>([]);
  const suspensionRef = useRef<AgentSuspension | null>(null);
  const financialDataRef = useRef<any>(financialData);
  financialDataRef.current = financialData;
  const fxRates = useFxRates();
  const fxRatesRef = useRef(fxRates);
  fxRatesRef.current = fxRates;
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
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
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string, type: 'excel' | 'csv' | 'text' | 'json'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'excel' | 'csv' | 'text' | 'json' = 'text';
      let parsedContent = '';

      if (extension === 'xlsx' || extension === 'xls') {
        fileType = 'excel';
        const data = await file.arrayBuffer();
        // Excel kütüphanesi büyük olduğu için yalnızca Excel dosyası eklendiğinde indirilir
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(data);
        // Sadece ilk sayfayı alalım
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        parsedContent = JSON.stringify(json, null, 2);
      } else if (extension === 'csv') {
        fileType = 'csv';
        parsedContent = await file.text();
      } else if (extension === 'json') {
        fileType = 'json';
        parsedContent = await file.text();
      } else {
        fileType = 'text';
        parsedContent = await file.text();
      }

      // Max 100kb character limit (roughly 100k chars) to avoid prompt limits
      if (parsedContent.length > 100000) {
        parsedContent = parsedContent.slice(0, 100000) + '... (Devamı kesildi)';
      }

      setAttachedFile({
        name: file.name,
        content: parsedContent,
        type: fileType
      });
      
    } catch (err) {
      console.error("Dosya okunurken hata:", err);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
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
    if (suspensionRef.current) {
      addAssistantMessage('Önce bekleyen işlemi onaylayın veya iptal edin.', true);
      return;
    }

    setMessages(prev => [...prev, { id: newMessageId(), role: 'user', text: '🎤 Sesli komut gönderildi' }]);
    setIsTyping(true);

    const sensitivityGuide = sensitivity >= 4
      ? 'Arka plan gürültüsünü, eksik veya peltek söylenen kelimeleri tolere et; en olası muhasebe terimiyle tamamla.'
      : sensitivity <= 2
        ? 'Sadece net duyulan kelimeleri esas al; şüpheli kısımlarda tahmin yürütme, kullanıcıya sor.'
        : 'Standart ses çözümlemesi yap.';

    try {
      const result = await runAgent(apiKey, agentHistoryRef.current, [
        { inlineData: { mimeType, data: base64Audio } },
        { text: `Bu bir sesli komuttur. ${sensitivityGuide} Cevabının ilk satırına "🎤 Söylediğiniz: ..." diye anladığın cümleyi yaz, sonra isteği araçlarla yerine getir.` }
      ], buildAgentContext());
      applyAgentResult(result);
    } catch (error: any) {
      handleAgentError(error, 'AiAssistant.handleAudioInput');
    } finally {
      setIsTyping(false);
    }
  };

  // ---------------------------------------------------------------------------
  // AI sohbet motoru (Gemini function calling) yardımcıları
  // ---------------------------------------------------------------------------

  const newMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addAssistantMessage = (text: string, isError = false, chart?: Message['chart']) => {
    setMessages(prev => [...prev, { id: newMessageId(), role: 'assistant', text, isError, chart }]);
  };

  const buildAgentContext = (): AiToolContext => {
    const data = financialDataRef.current || {};
    return {
      data: {
        cariler: data.cariler || [],
        stoklar: data.stoklar || [],
        islemler: data.islemler || [],
        ceksenet: data.ceksenet || [],
        expenses: data.expenses || [],
        bankAccounts: data.bankAccounts || [],
        employees: data.employees || [],
        employeeTransactions: data.employeeTransactions || [],
        accountTransactions: data.accountTransactions || [],
        fxRates: fxRatesRef.current,
      },
      permissions: {
        isRestricted: isSecurityActive && userRole === 'employee',
        sensitiveTabs: sensitiveTabs || [],
        actionPermissions: actionPermissions || {},
      },
    };
  };

  const applyAgentResult = (result: AgentResult) => {
    agentHistoryRef.current = result.history;
    const text = result.texts.join('\n\n');
    if (text || result.charts.length > 0) {
      const [firstChart, ...otherCharts] = result.charts;
      addAssistantMessage(text || 'Grafik hazırlandı:', false, firstChart);
      otherCharts.forEach(chart => addAssistantMessage('', false, chart));
    }
    if (result.suspension) {
      suspensionRef.current = result.suspension;
      setMessages(prev => [...prev, {
        id: newMessageId(),
        role: 'assistant',
        text: result.suspension!.pending.length > 1 ? 'Aşağıdaki işlemler için onayınız gerekiyor:' : 'Aşağıdaki işlem için onayınız gerekiyor:',
        pending: { items: result.suspension!.pending.map(p => p.summary), status: 'waiting' },
      }]);
    } else if (!text && result.charts.length === 0) {
      addAssistantMessage('İşlem tamamlandı.');
    }
  };

  const handleAgentError = (error: any, context: string) => {
    logError(error instanceof Error ? error : new Error(String(error)), context);
    const message = error instanceof GeminiApiError
      ? error.message
      : 'Yapay zeka ile iletişim kurulurken bir hata oluştu. İnternet bağlantınızı ve API anahtarınızı kontrol edin.';
    addAssistantMessage(message, true);
  };

  const handlePendingDecision = async (messageId: string, approved: boolean) => {
    const suspension = suspensionRef.current;
    if (!suspension || isTyping) return;
    suspensionRef.current = null;
    setMessages(prev => prev.map(m => m.id === messageId && m.pending ? { ...m, pending: { ...m.pending, status: approved ? 'approved' : 'cancelled' } } : m));
    setIsTyping(true);
    try {
      const result = await resumeAgent(apiKey, agentHistoryRef.current, suspension, approved, buildAgentContext());
      if (result.executionResults.length > 0) {
        addAssistantMessage(
          result.executionResults.map(r => `${r.ok ? '✅' : '❌'} ${r.message}`).join('\n'),
          result.executionResults.some(r => !r.ok)
        );
      }
      applyAgentResult(result);
    } catch (error: any) {
      handleAgentError(error, 'AiAssistant.handlePendingDecision');
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
        text: `Merhaba! Ben Storm AI. Fatura kesmekten rapor almaya kadar uygulamadaki her işi sizin için yapabilirim; kayıt yapmadan önce onayınızı alırım.\nÖrneğin: ${randomExample}`
      }
    ]);
  }, []);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timerId = setTimeout(() => {
        
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }

      }, 100);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [messages, isOpen, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey || isTyping) return;
    if (suspensionRef.current) {
      addAssistantMessage('Önce bekleyen işlemi onaylayın veya iptal edin.', true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    let finalUserMessage = userMessage;
    if (attachedFile) {
      finalUserMessage += "\n\n[KULLANICININ EKLENEN DOSYASI: " + attachedFile.name + "]\n" + attachedFile.content + "\n\nBu eklenen dosyayı yukarıdaki istekle ilişkilendirerek incele veya isteği bu dosya verisine göre yerine getir.";
    }

    setMessages(prev => [...prev, { id: newMessageId(), role: 'user', text: userMessage }]);
    setIsTyping(true);
    setAttachedFile(null);

    try {
      const result = await runAgent(apiKey, agentHistoryRef.current, [{ text: finalUserMessage }], buildAgentContext());
      applyAgentResult(result);
    } catch (error: any) {
      handleAgentError(error, 'AiAssistant.handleSubmit');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={embedded ? 'w-full h-full flex flex-col min-h-0' : 'fixed bottom-20 right-1.5 sm:right-4 z-[100]'}>
      {/* Chat Window */}
      {isOpen && (
        <div className={embedded
          ? 'w-full h-full min-h-0 bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col'
          : 'mb-4 w-[calc(100vw-12px)] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-slide-up origin-bottom-right'}>
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
              {!embedded && (
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {!apiKey ? (
            <div className="p-6 flex flex-col items-center justify-center text-center h-[50vh] max-h-[300px] sm:h-[300px] sm:max-h-none bg-slate-50">
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
            <div className="flex-1 h-[60vh] max-h-[440px] sm:h-[440px] sm:max-h-none overflow-y-auto bg-slate-50 flex flex-col animate-fade-in">
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
              <div ref={messagesContainerRef} className={`p-4 overflow-y-auto bg-slate-50 flex flex-col gap-3 ${embedded ? 'flex-1 min-h-0' : 'h-[55vh] max-h-[350px] sm:h-[350px] sm:max-h-none'}`}>
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
                      {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                        <div className="mt-3 w-full h-[180px] bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                          <ResponsiveContainer width="100%" height="100%">
                            {msg.chart.tip === 'pie' ? (
                              <PieChart>
                                <Pie data={msg.chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#0d9488" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                  {msg.chart.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#0d9488', '#0f766e', '#14b8a6', '#5eead4', '#ccfbf1'][index % 5]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                              </PieChart>
                            ) : (
                              <BarChart data={msg.chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-20} textAnchor="end" height={40} />
                                <YAxis tick={{fontSize: 10}} width={45} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                      {msg.pending && (
                        <div className="mt-3 space-y-2">
                          {msg.pending.items.map((lines, idx) => (
                            <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-slate-700 space-y-0.5">
                              {lines.map((line, lineIdx) => (
                                <div key={lineIdx} className={lineIdx === 0 ? 'font-bold text-slate-900 text-[13px] mb-1' : ''}>{line}</div>
                              ))}
                            </div>
                          ))}
                          {msg.pending.status === 'waiting' ? (
                            <div className="flex gap-2 pt-1">
                              <button
                                type="button"
                                disabled={isTyping}
                                onClick={() => handlePendingDecision(msg.id, true)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                              >
                                <Check size={14} /> Onayla
                              </button>
                              <button
                                type="button"
                                disabled={isTyping}
                                onClick={() => handlePendingDecision(msg.id, false)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                              >
                                <X size={14} /> İptal
                              </button>
                            </div>
                          ) : (
                            <div className={`text-[11px] font-bold ${msg.pending.status === 'approved' ? 'text-teal-600' : 'text-slate-400'}`}>
                              {msg.pending.status === 'approved' ? 'Onaylandı' : 'İptal edildi'}
                            </div>
                          )}
                        </div>
                      )}
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

                {attachedFile && (
                  <div className="flex items-center justify-between bg-slate-50 p-2 mx-3 mt-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {attachedFile.type === 'excel' ? <FileSpreadsheet size={16} className="text-emerald-600" /> : <FileText size={16} className="text-blue-600" />}
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{attachedFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="p-3 flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.txt,.json"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition shrink-0"
                    title="Dosya Ekle (Excel, CSV, TXT)"
                  >
                    <Paperclip size={18} />
                  </button>
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
      {!isOpen && !embedded && (
        <div 
          ref={floatingButtonRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          title="Sürükleyerek yerini değiştirebilirsiniz"
          className="flex flex-col items-center gap-1 relative group mt-2 select-none touch-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Tooltip-like or subtext */}
          <div className="absolute -top-8 text-white text-[8px] px-2 py-1 rounded-md shadow-xl font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20" style={{ backgroundColor: 'var(--accent-600, #dc2626)' }}>
            SİZE NASIL YARDIMCI OLABİLİRİM?
          </div>
          
          <div className="relative">
            {/* Outer glowing rings */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 animate-duration-2000" style={{ backgroundColor: 'var(--accent-500, #ef4444)' }}></div>
            <div className="absolute -inset-0.5 rounded-full animate-pulse opacity-20" style={{ backgroundColor: 'var(--accent-400, #f87171)' }}></div>
            
            <button
              onClick={handleButtonClick}
              className="w-10 h-10 md:w-[58px] md:h-[58px] text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white/90 relative hover:brightness-125 z-10"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-400, #f87171), var(--accent-600, #dc2626), var(--accent-900, #7f1d1d))',
                boxShadow: '0 0 10px color-mix(in srgb, var(--accent-500, #ef4444) 80%, transparent), inset 0 0 5px rgba(255,255,255,0.5)'
              }}
            >
              <div className="relative flex items-center justify-center md:scale-[1.45]">
                <Bot size={18} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)] transition-transform group-hover:rotate-12" />
                <Sparkles size={8} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <Sparkles size={7} className="absolute -bottom-1 -left-1.5 text-yellow-100 animate-pulse" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white animate-pulse shadow-[0_0_5px_#22c55e] z-20" style={{ backgroundColor: '#22c55e' }}></div>
            </button>
          </div>

          <span className="storm-ai-badge hidden sm:inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700/80 uppercase tracking-widest text-center">
            STORM AI
          </span>
        </div>
      )}
    </div>
  );
}
