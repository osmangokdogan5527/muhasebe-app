import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError } from '../utils/errorLogger';

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
    this.reportError(event.error || new Error(event.message));
  };

  private handleGlobalPromiseRejection = (event: PromiseRejectionEvent) => {
    this.reportError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
  };

  public componentDidMount() {
    window.addEventListener('error', this.handleGlobalError);
    window.addEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  public componentWillUnmount() {
    window.removeEventListener('error', this.handleGlobalError);
    window.removeEventListener('unhandledrejection', this.handleGlobalPromiseRejection);
  }

  private reportError(error: Error, errorInfo?: ErrorInfo) {
    logError(error, 'ErrorBoundary', errorInfo?.componentStack || undefined);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.reportError(error, errorInfo);
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
