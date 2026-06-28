import { useEffect, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { photosApi, apiError, type StockPhoto } from '../../lib/api';

/** Modal to search Unsplash and pick a relevant photo. */
export function PhotoPicker({ open, initialQuery, onPick, onClose }: { open: boolean; initialQuery?: string; onPick: (url: string) => void; onClose: () => void }) {
  const [q, setQ] = useState(initialQuery || 'driving lesson car');
  const [results, setResults] = useState<StockPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const { results } = await photosApi.search(query, { per_page: 24, orientation: 'landscape' });
      setResults(results);
    } catch (e) {
      setErr(apiError(e).message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) run(initialQuery || q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-sand-200 p-4">
          <form
            className="flex flex-1 items-center gap-2 rounded-full border border-sand-200 bg-sand-50 px-4 py-2"
            onSubmit={(e) => { e.preventDefault(); run(q); }}
          >
            <Search className="h-4 w-4 text-sand-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…" className="flex-1 bg-transparent text-sm outline-none" autoFocus />
          </form>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full text-sand-500 hover:bg-sand-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="min-h-[200px] flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="grid h-40 place-items-center text-sand-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : err ? (
            <p className="py-10 text-center text-sm text-sand-500">{err}</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {results.map((p) => (
                <button key={p.id} onClick={() => { onPick(p.regular); onClose(); }} className="group relative aspect-[4/3] overflow-hidden rounded-lg ring-1 ring-sand-200" title={`Photo by ${p.author}`}>
                  <img src={p.thumb} alt={p.alt} loading="lazy" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="border-t border-sand-200 px-4 py-2 text-[11px] text-sand-400">Photos via Unsplash</p>
      </div>
    </div>
  );
}
