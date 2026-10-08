'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mercado Fresh Uncaught Error:', error, errorInfo);
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleResetStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('mercado_fresh_guest_lists_v3');
        localStorage.removeItem('mercado_fresh_guest_settings_v3');
        localStorage.removeItem('mercado_fresh_pantry_items_v3');
        localStorage.removeItem('mercado_fresh_guest_lists');
        localStorage.removeItem('mercado_fresh_guest_settings');
        localStorage.removeItem('mercado_fresh_pantry_items_v2');
      } catch (e) {
        console.warn('Failed to clear storage:', e);
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} />
            </div>
            
            <h2 className="text-xl font-black text-slate-900 mb-2">
              Ops! Algo inesperado aconteceu
            </h2>
            
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              O aplicativo encontrou um erro temporário. Não se preocupe, você pode recarregar a tela ou restaurar os dados com segurança.
            </p>

            {this.state.error && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] font-mono text-slate-600 text-left mb-6 overflow-x-auto max-h-24">
                {this.state.error.message || 'Erro de execução'}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={this.handleReload}
                className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md text-sm"
              >
                <RefreshCw size={18} /> Recarregar Aplicativo
              </button>

              <button
                onClick={this.handleResetStorage}
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-xs"
              >
                <RotateCcw size={16} /> Restaurar Dados de Exemplo
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
