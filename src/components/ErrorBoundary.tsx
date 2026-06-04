import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw, AlertTriangle, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an analytics service here
    console.error('[VUU Core Guard] Uncaught application exception:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Attempt local state recovery or soft redirect
    window.location.hash = '#stabilize';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center p-6 text-center select-none" id="vuu-recovery-tunnel">
          <div className="bg-slate-900 border border-slate-850 max-w-md w-full p-6 rounded-3xl shadow-2xl relative overflow-hidden space-y-5">
            <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-455 flex items-center justify-center shadow-lg shadow-rose-500/5">
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span className="text-[9px] font-mono font-extrabold text-rose-400 uppercase tracking-widest leading-none mt-1">CORE GUARD EXCEPTION DETECTED</span>
              <h3 className="text-base font-black text-white tracking-tight">VUU Component Sandbox Crashed</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                A non-fatal rendering collision occurred inside your active view. The VUU Core Guard safely intercepted the crash to prevent complete app closure.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-850 text-left font-mono text-[10px] text-rose-300 leading-normal max-h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                <div className="flex items-center gap-1.5 text-rose-400 font-extrabold select-none">
                  <Bug className="w-3.5 h-3.5" />
                  <span>ERROR_METADATA_DUMP</span>
                </div>
                <div className="text-slate-400 uppercase font-black text-[9px]">
                  Name: {this.state.error.name}
                </div>
                <div>{this.state.error.message}</div>
                {this.state.error.stack && (
                  <div className="text-[9px] text-slate-550 pt-1 whitespace-pre-wrap select-text selection:bg-rose-500/25 border-t border-slate-900/60 mt-1">
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full bg-rose-600 hover:bg-rose-500 hover:scale-[1.01] active:scale-95 text-slate-950 font-black py-2.5 rounded-xl transition-all shadow-lg shadow-rose-500/5 cursor-pointer flex items-center justify-center gap-1.5 text-xs tracking-tight uppercase"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Re-stabilize VUU Tunnel</span>
            </button>
          </div>

          <span className="text-[9.5px] font-mono text-slate-600 mt-4 uppercase tracking-widest select-none">
            Google AI Studio Recover Protocol Enabled
          </span>
        </div>
      );
    }

    // Access the children property from props.children as instructed in the react guideline
    return this.props.children;
  }
}
