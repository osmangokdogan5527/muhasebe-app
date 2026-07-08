import React, { useEffect, useState, useRef } from 'react';
import { Camera, X, RefreshCw, Volume2, VolumeX, Layers } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
  multiScan?: boolean; // If true, stays open after scanning and plays beep, allowing continuous scanning
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Barkod Tara',
  multiScan = false
}: BarcodeScannerModalProps) {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScannerActive, setIsScannerActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isContinuousMode, setIsContinuousMode] = useState(multiScan);
  const [lastScanned, setLastScanned] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Play a synthesized electronic beep on successful scan
  const playBeep = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch beautiful beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.12); // Short chirp
    } catch (e) {
      console.warn('Audio play failed', e);
    }
  };

  // Get available cameras on mount
  useEffect(() => {
    if (!isOpen) return;

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          // Auto select rear camera or the first one
          const rearCam = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') || 
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(rearCam ? rearCam.id : devices[0].id);
        } else {
          setErrorMsg('Kamera bulunamadı. Lütfen cihazınızda kamera olduğundan ve izin verildiğinden emin olun.');
        }
      })
      .catch((err) => {
        console.error('Kamera listeleme hatası:', err);
        setErrorMsg('Kamera erişim izni alınamadı.');
      });

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Restart scanner when camera selection changes
  useEffect(() => {
    if (isOpen && selectedCameraId) {
      startScanner(selectedCameraId);
    }
  }, [selectedCameraId, isOpen]);

  const startScanner = async (cameraId: string) => {
    setErrorMsg('');
    await stopScanner();

    try {
      const scanner = new Html5Qrcode('barcode-reader-container');
      scannerRef.current = scanner;

      // Configure a wider search box appropriate for linear 1D barcodes
      const width = window.innerWidth;
      const qrboxSize = width < 640 
        ? { width: 260, height: 120 } 
        : { width: 340, height: 160 };

      await scanner.start(
        cameraId,
        {
          fps: 30, // 30 FPS for ultra-responsive instant scanning
          qrbox: qrboxSize,
          aspectRatio: 1.777778, // 16:9 ratio is perfect for cameras
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        } as any,
        (decodedText) => {
          // Prevent rapid duplicate scans in less than 1.5 seconds in continuous mode
          const now = Date.now();
          if (isContinuousMode && decodedText === lastScanned && now - lastScanTimeRef.current < 1500) {
            return;
          }

          lastScanTimeRef.current = now;
          setLastScanned(decodedText);
          playBeep();
          
          // Flash visual feedback
          setScanFeedback(true);
          setTimeout(() => setScanFeedback(false), 450);

          onScan(decodedText);

          if (!isContinuousMode) {
            onClose();
          }
        },
        () => {
          // Verbose error from camera, ignore to keep console clean
        }
      );

      // Try to configure advanced camera autofocus constraints for high-precision
      setTimeout(async () => {
        try {
          const videoEl = document.querySelector('#barcode-reader-container video') as HTMLVideoElement;
          const stream = videoEl?.srcObject as MediaStream;
          if (stream) {
            const track = stream.getVideoTracks()[0];
            if (track) {
              const capabilities = (track.getCapabilities && typeof track.getCapabilities === 'function') 
                ? (track.getCapabilities() as any) 
                : {} as any;
              
              const advancedConstraints: any = {};
              
              // Apply continuous autofocus if available
              if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                advancedConstraints.focusMode = 'continuous';
              }
              
              if (Object.keys(advancedConstraints).length > 0) {
                await track.applyConstraints({
                  advanced: [advancedConstraints]
                });
                console.log('Advanced continuous autofocus constraints applied successfully.');
              } else {
                // Fallback attempt
                await track.applyConstraints({
                  advanced: [{ focusMode: 'continuous' }]
                } as any);
              }
            }
          }
        } catch (err) {
          console.warn('Failed to apply advanced autofocus track constraints:', err);
        }
      }, 600);

      setIsScannerActive(true);
    } catch (err: any) {
      console.error('Kamera başlatma hatası:', err);
      setErrorMsg(`Kamera başlatılamadı: ${err.message || err}`);
      setIsScannerActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error('Kamera durdurma hatası:', err);
      } finally {
        scannerRef.current = null;
        setIsScannerActive(false);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const toggleCamera = () => {
    if (cameras.length <= 1) return;
    const currentIndex = cameras.findIndex(c => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    setSelectedCameraId(cameras[nextIndex].id);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-[#161616] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Camera className="text-teal-400" size={18} />
            <span className="text-xs font-bold font-mono tracking-wider text-white uppercase">{title}</span>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewfinder Frame */}
        <div className={`relative aspect-video sm:aspect-square bg-black flex items-center justify-center overflow-hidden transition-all duration-150 ${
          scanFeedback ? 'ring-4 ring-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.7)] z-20' : ''
        }`}>
          
          {/* Scanner Output Container */}
          <div id="barcode-reader-container" className="w-full h-full object-cover"></div>

          {/* Flash Feedback Layer */}
          {scanFeedback && (
            <div className="absolute inset-0 bg-emerald-500/20 border-4 border-emerald-500 pointer-events-none z-30 transition-all duration-150 flex items-center justify-center animate-pulse">
              <div className="bg-emerald-500 text-[#000000] px-4 py-2 rounded-full font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.8)] flex items-center gap-1.5 animate-bounce">
                <span>✓ BARKOD OKUNDU</span>
              </div>
            </div>
          )}

          {/* Holographic Overlay when scanner is active */}
          {isScannerActive && !errorMsg && (
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
              {/* Corner brackets */}
              <div className="flex justify-between">
                <div className={`w-4 h-4 border-t-2 border-l-2 rounded-tl-md transition-colors duration-150 ${scanFeedback ? 'border-emerald-400 scale-110' : 'border-teal-400'}`}></div>
                <div className={`w-4 h-4 border-t-2 border-r-2 rounded-tr-md transition-colors duration-150 ${scanFeedback ? 'border-emerald-400 scale-110' : 'border-teal-400'}`}></div>
              </div>

              {/* Central laser animation */}
              <div className="relative w-full h-1 bg-teal-400/30">
                <div className={`absolute inset-x-0 h-[2px] transition-colors duration-150 shadow-[0_0_8px_#2dd4bf] animate-[bounce_1.8s_infinite] ${
                  scanFeedback ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-teal-400'
                }`}></div>
              </div>

              {/* Bottom brackets */}
              <div className="flex justify-between">
                <div className={`w-4 h-4 border-b-2 border-l-2 rounded-bl-md transition-colors duration-150 ${scanFeedback ? 'border-emerald-400 scale-110' : 'border-teal-400'}`}></div>
                <div className={`w-4 h-4 border-b-2 border-r-2 rounded-br-md transition-colors duration-150 ${scanFeedback ? 'border-emerald-400 scale-110' : 'border-teal-400'}`}></div>
              </div>
            </div>
          )}

          {/* Loading or Error States */}
          {(!isScannerActive || errorMsg) && (
            <div className="absolute inset-0 bg-neutral-900/95 flex flex-col items-center justify-center p-6 text-center z-20">
              {errorMsg ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mx-auto border border-red-500/20">
                    <X size={20} />
                  </div>
                  <p className="text-xs text-red-400 font-medium px-4">{errorMsg}</p>
                  <button 
                    onClick={() => selectedCameraId && startScanner(selectedCameraId)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 text-white rounded text-[11px] hover:bg-white/10 transition font-medium"
                  >
                    Tekrar Dene
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <RefreshCw className="text-teal-400 animate-spin mx-auto" size={24} />
                  <p className="text-xs text-white/50">Kamera başlatılıyor...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scan Status Log in Continuous Mode */}
        {isContinuousMode && lastScanned && (
          <div className="px-4 py-2 border-y border-white/5 bg-teal-400/5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-white/40">Okunan Kod:</span>
            <span className="text-teal-400 font-bold bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 animate-pulse">
              {lastScanned}
            </span>
          </div>
        )}

        {/* Controls Panel */}
        <div className="p-4 bg-white/[0.01] border-t border-white/5 space-y-4">
          
          <div className="flex items-center justify-between gap-3">
            {/* Camera Select dropdown */}
            {cameras.length > 0 && (
              <div className="flex-1 min-w-0">
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white/5 border border-white/10 text-white/95 rounded text-[11px] bg-[#0c0c0c] focus:outline-hidden focus:border-teal-500 truncate"
                >
                  {cameras.map((cam, idx) => (
                    <option key={cam.id} value={cam.id} className="bg-[#0c0c0c]">
                      {cam.label || `Kamera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Switch Camera Button (for mobile / multiple cameras) */}
            {cameras.length > 1 && (
              <button
                onClick={toggleCamera}
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:text-teal-300 rounded-lg transition cursor-pointer text-[11px] font-semibold"
              >
                <RefreshCw size={12} className="animate-pulse" />
                <span>Kamera Değiştir</span>
              </button>
            )}

            {/* Audio Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Sesi Aç" : "Sesi Kapat"}
              className={`p-2 border rounded-lg transition ${
                isMuted 
                  ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                  : 'bg-white/5 border-white/10 text-teal-400'
              }`}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>

            {/* Continuous Mode Toggle */}
            <button
              onClick={() => setIsContinuousMode(!isContinuousMode)}
              title={isContinuousMode ? "Tekli Tarama Moduna Geç" : "Çoklu Seri Tarama Moduna Geç"}
              className={`p-2 border rounded-lg transition ${
                isContinuousMode 
                  ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' 
                  : 'bg-white/5 border-white/10 text-white/40'
              }`}
            >
              <Layers size={14} />
            </button>
          </div>

          <div className="text-[10px] text-white/40 text-center font-mono leading-relaxed">
            {isContinuousMode 
              ? "Çoklu tarama modunda pencere kapanmaz. Barkodları ardı ardına okutarak sepete veya listeye hızlıca ekleyebilirsiniz."
              : "Barkodu kameranın ortasındaki kutunun içine hizalayın. Okunduğu an otomatik algılanacaktır."
            }
          </div>
        </div>

      </div>
    </div>
  );
}
