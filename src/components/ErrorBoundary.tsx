import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              The application encountered an unexpected error. This has been logged for our technical team.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="mt-8 p-4 bg-slate-50 rounded-xl text-[10px] text-rose-600 text-left overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
