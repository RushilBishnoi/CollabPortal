import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  didAttemptReload: boolean;
}

// Session-storage key to detect if we already tried a chunk-error reload
const CHUNK_RELOAD_KEY = 'aip_chunk_reload_attempted';

function isChunkLoadError(error: Error): boolean {
  const msg = error.message?.toLowerCase() ?? '';
  return (
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('dynamically imported module')
  );
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    didAttemptReload: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    // If it's a chunk load error and we haven't reloaded yet, trigger a reload
    if (isChunkLoadError(error)) {
      const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1';
      if (!alreadyReloaded) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
        // Returning state first; actual reload happens in componentDidUpdate
        return { hasError: true, error, didAttemptReload: false };
      }
      // Already tried reload — show error UI
      return { hasError: true, error, didAttemptReload: true };
    }
    return { hasError: true, error, didAttemptReload: false };
  }

  public componentDidUpdate(_: Props, prevState: State): void {
    // Trigger reload after state is committed (not during render)
    if (
      this.state.hasError &&
      this.state.error &&
      isChunkLoadError(this.state.error) &&
      !this.state.didAttemptReload &&
      !prevState.hasError
    ) {
      window.location.reload();
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      // If we're doing an auto-reload (chunk error, first attempt), show nothing
      // to avoid a flash of error UI before the reload
      if (this.state.error && isChunkLoadError(this.state.error) && !this.state.didAttemptReload) {
        return null;
      }

      return (
        <div className="min-h-[500px] flex items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-100 shadow-sm p-8 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              {this.state.error?.message ||
                'An unexpected application error occurred. Please try reloading the page.'}
            </p>
            <button
              onClick={() => {
                sessionStorage.removeItem(CHUNK_RELOAD_KEY);
                window.location.reload();
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    // Clear the reload flag on successful render
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    return this.props.children;
  }
}
