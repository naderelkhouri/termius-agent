import React from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Capturado erro na interface:', error, errorInfo);

    // Envia automaticamente para a telemetria do backend
    try {
      fetch('/api/telemetry/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bug',
          title: 'Erro de Renderização React (ErrorBoundary)',
          message: error?.message || 'Erro desconhecido na interface',
          stack: `${error?.stack || ''}\nComponentStack:\n${errorInfo?.componentStack || ''}`,
          severity: 'high',
          source: 'frontend_error_boundary',
          category: 'ui'
        })
      }).catch(() => {});
    } catch {}
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] h-full w-full bg-[#0d1117] text-slate-200 p-6 select-none">
          <div className="max-w-md w-full bg-[#161b22] border border-rose-500/30 rounded-2xl p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">
              Interrupção Inesperada no Painel
            </h3>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              O componente encontrou uma exceção não prevista. O erro foi registrado automaticamente na telemetria interna.
            </p>

            {this.state.error?.message && (
              <div className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl p-3 mb-5 text-left font-mono text-[11px] text-rose-300 break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-slate-200 text-xs font-semibold border border-[#30363d] transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                Tentar Restaurar
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recarregar App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
