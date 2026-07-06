import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  private handleGlobalError = (event: ErrorEvent) => {
    // Prevent default handling so it doesn't just print to console (optional, maybe don't prevent if we want to see it in console too)
    this.reportToTelegram(event.error || new Error(event.message));
  };

  private handleGlobalPromiseRejection = (event: PromiseRejectionEvent) => {
    this.reportToTelegram(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  private reportToTelegram(error: Error, errorInfo?: ErrorInfo) {
    const stackTrace = errorInfo?.componentStack || error.stack || '';
    
    let activeUserStr: string | null = null;
    let activeUser = 'Sistem/Giriş Ekranı';
    
    // 1. Local Error Logging
    try {
      activeUserStr = localStorage.getItem('storm_muhasebe_active_user');
      activeUser = activeUserStr ? JSON.parse(activeUserStr).displayName : 'Sistem/Giriş Ekranı';
      
      const newLog = {
        id: Date.now().toString(),
        date: new Date().toLocaleString('tr-TR'),
        user: activeUser,
        message: error.message || 'Bilinmeyen Hata',
        stack: stackTrace
      };
      
      const existingLogsStr = localStorage.getItem('storm_error_logs');
      const existingLogs = existingLogsStr ? JSON.parse(existingLogsStr) : [];
      existingLogs.unshift(newLog); // Add to beginning
      
      // Keep only last 100 logs to prevent localStorage bloat
      if (existingLogs.length > 100) existingLogs.pop();
      
      localStorage.setItem('storm_error_logs', JSON.stringify(existingLogs));
    } catch (e) {
      console.error('Local error logging failed:', e);
    }

    // 2. Electron / Telegram Reporting
    if (window.electronAPI && (window.electronAPI as any).reportError) {
      (window.electronAPI as any).reportError({
        message: error.message || 'Bilinmeyen Hata',
        stack: stackTrace
      });
    } else {
      // Web Fallback for Telegram Reporting
      try {
        const TELEGRAM_BOT_TOKEN = localStorage.getItem('storm_muhasebe_telegram_bot_token') || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "8661867798:AAHVgj4cyEw3D_NS19jjiSBqkJe7nvIFfy0";
        const TELEGRAM_CHAT_ID = localStorage.getItem('storm_muhasebe_telegram_chat_id') || import.meta.env.VITE_TELEGRAM_CHAT_ID || "-5266920189";
        if (TELEGRAM_BOT_TOKEN) {
          const shortStack = stackTrace.split('\n').slice(0, 3).join('\n');
          const text = `🚨 <b>STORM MUHASEBE HATA RAPORU (WEB)</b>\n\n<b>Hata:</b> ${error.message}\n\n<b>Kullanıcı:</b> ${activeUser}\n\n<b>Stack Trace:</b>\n<pre>${shortStack}</pre>`;
          
          fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHAT_ID,
              text: text,
              parse_mode: 'HTML'
            })
          }).catch(err => console.error('Telegram web send error:', err));
        }
      } catch (err) {
        console.error('Error while sending telegram report:', err);
      }
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.reportToTelegram(error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-rose-100">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Beklenmeyen Bir Hata Oluştu</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Sistem kritik bir hata ile karşılaştı. Hata raporu otomatik olarak geliştirici ekibimize iletildi. Lütfen uygulamayı yeniden başlatmayı deneyin.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg text-left overflow-hidden mb-8 border border-slate-200">
              <p className="text-xs font-mono text-rose-600 truncate">
                {this.state.error?.message || 'Bilinmeyen Hata'}
              </p>
            </div>

            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl font-bold transition shadow-lg shadow-teal-500/30"
            >
              <RefreshCw size={18} />
              <span>Yeniden Başlat</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
