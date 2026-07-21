import React from 'react';

/**
 * App-wide error boundary. Catches render/lazy-chunk errors so a deploy (stale
 * hashed chunk) or a template throw never blanks the whole SPA.
 * A chunk-load failure triggers ONE automatic reload (guarded so it can't loop);
 * anything else shows a minimal recover card.
 */
const CHUNK_ERROR_RE = /Loading chunk|ChunkLoadError|dynamically imported module|Importing a module script failed/i;
const RELOAD_KEY = 'mm_chunk_reloaded_at';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (CHUNK_ERROR_RE.test(String(error?.message ?? error))) {
      const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
      if (Date.now() - last > 30_000) {
        sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
        window.location.reload();
      }
    }
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return <>{this.props.fallback}</>;
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white px-6">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold tracking-tight text-sand-900">Something went wrong</p>
          <p className="mt-2 text-sm text-sand-500">The page hit an unexpected error. Reloading usually fixes it.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary mt-6 inline-flex"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
