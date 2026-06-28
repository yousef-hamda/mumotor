import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Redo2, RotateCcw, Undo2, Save, X, Upload, Search, Plus, Trash2, Type as TypeIcon, Image as ImageIcon, Paintbrush, Smile } from 'lucide-react';
import type { TemplateData } from '../../templates/types';
import { TemplateRender } from '../../templates/TemplateRender';
import {
  applyOverrides,
  colorSlotsFor,
  getPath,
  setPath,
  type Customization,
  type EditType,
} from '../../templates/customize/overrides';
import { DynamicIcon, ICON_LIBRARY } from '../../templates/DynamicIcon';
import { mediaApi } from '../../lib/api';
import { useHistory } from './useHistory';
import { PhotoPicker } from './PhotoPicker';

const LIST_ROOTS = ['packages', 'faqs', 'areas', 'stats'];
type Rect = { top: number; left: number; width: number; height: number };
interface Selection { path: string; type: EditType }
interface PopoverState { kind: 'text' | 'background' | 'image' | 'icon'; path: string; rect: Rect }

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) as T; }
function isListPath(path: string) { return LIST_ROOTS.includes(path.split('.')[0]) && path.includes('.'); }
function toHex(v?: string): string {
  if (v && /^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (v && /^#[0-9a-fA-F]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return '#111111';
}

export default function CustomizeMode({
  baseData,
  templateSlug,
  value,
  onSave,
  onDone,
  websiteId,
}: {
  baseData: TemplateData;
  templateSlug: string;
  value?: Customization;
  onSave: (c: Customization) => void;
  onDone: () => void;
  websiteId?: string;
}) {
  const hist = useHistory(value ?? {});
  const data = useMemo(() => applyOverrides(baseData, hist.current), [baseData, hist.current]);
  const [sel, setSel] = useState<Selection | null>(null);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [hover, setHover] = useState<{ path: string; rect: Rect } | null>(null);
  const [hoverEdit, setHoverEdit] = useState<Rect | null>(null);
  const [themePanel, setThemePanel] = useState(false);
  const [picker, setPicker] = useState<{ path: string; query: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const editingRef = useRef<HTMLElement | null>(null);
  const savedRef = useRef<string>(JSON.stringify(value ?? {}));
  const dirty = JSON.stringify(hist.current) !== savedRef.current;

  // ── override writers ───────────────────────────────────────────────────────
  const pushFields = useCallback((patch: Record<string, unknown>) => {
    hist.set({ ...hist.current, fields: { ...(hist.current.fields ?? {}), ...patch } });
  }, [hist]);

  const commitField = useCallback((path: string, raw: string) => {
    if (isListPath(path)) {
      const root = path.split('.')[0];
      const src = getPath(data, root);
      const arr: unknown[] = Array.isArray(src) ? clone(src) : [];
      const last = path.split('.').pop()!;
      const v: unknown = last === 'price' || last === 'value' ? Number(raw.replace(/[^\d.]/g, '')) || 0 : raw;
      setPath({ [root]: arr } as Record<string, unknown>, path, v);
      pushFields({ [root]: arr });
    } else {
      pushFields({ [path]: raw });
    }
  }, [data, pushFields]);

  const setStyle = useCallback((path: string, patch: { color?: string; background?: string }) => {
    hist.set({ ...hist.current, styles: { ...(hist.current.styles ?? {}), [path]: { ...(hist.current.styles?.[path] ?? {}), ...patch } } });
  }, [hist]);
  const setColor = useCallback((path: string, color: string) => setStyle(path, { color }), [setStyle]);
  const setFill = useCallback((path: string, background: string) => setStyle(path, { background }), [setStyle]);
  const clearStyleKey = useCallback((path: string, key: 'color' | 'background') => {
    const cur = { ...(hist.current.styles?.[path] ?? {}) };
    delete cur[key];
    const styles = { ...(hist.current.styles ?? {}) };
    if (Object.keys(cur).length) styles[path] = cur; else delete styles[path];
    hist.set({ ...hist.current, styles });
  }, [hist]);
  const setThemeVar = useCallback((cssVar: string, v: string) => {
    hist.set({ ...hist.current, theme: { ...(hist.current.theme ?? {}), [cssVar]: v } });
  }, [hist]);
  const clearThemeVar = useCallback((cssVar: string) => {
    const theme = { ...(hist.current.theme ?? {}) };
    delete theme[cssVar];
    hist.set({ ...hist.current, theme });
  }, [hist]);

  const listOp = useCallback((itemPath: string, op: 'add' | 'remove') => {
    const [root, idxStr] = itemPath.split('.');
    const index = Number(idxStr);
    const src = getPath(data, root);
    const arr: unknown[] = Array.isArray(src) ? clone(src) : [];
    if (op === 'add') {
      const copy = clone(arr[index] ?? {}) as Record<string, unknown>;
      if (copy && typeof copy === 'object' && 'id' in copy) copy.id = `item-${Date.now()}-${index}`;
      arr.splice(index + 1, 0, copy);
    } else arr.splice(index, 1);
    pushFields({ [root]: arr });
    setHover(null);
  }, [data, pushFields]);

  // Compute the customization that results from committing one field edit — SYNC
  // (so Save/Done can include an in-progress edit without waiting for setState).
  const computeCommit = useCallback((base: Customization, path: string, raw: string): Customization => {
    if (isListPath(path)) {
      const root = path.split('.')[0];
      const src = getPath(applyOverrides(baseData, base), root);
      const arr: unknown[] = Array.isArray(src) ? clone(src) : [];
      const last = path.split('.').pop()!;
      const v: unknown = last === 'price' || last === 'value' ? Number(raw.replace(/[^\d.]/g, '')) || 0 : raw;
      setPath({ [root]: arr } as Record<string, unknown>, path, v);
      return { ...base, fields: { ...(base.fields ?? {}), [root]: arr } };
    }
    return { ...base, fields: { ...(base.fields ?? {}), [path]: raw } };
  }, [baseData]);

  // Pull the in-progress contentEditable edit (and clear it), or null.
  const takeEditing = (): { path: string; text: string } | null => {
    const el = editingRef.current;
    if (!el) return null;
    const path = el.dataset.edit!;
    const text = el.innerText.replace(/\n+$/, '').trim();
    el.contentEditable = 'false';
    editingRef.current = null;
    return { path, text };
  };

  const commitEditing = useCallback(() => {
    const e = takeEditing();
    if (e) hist.set(computeCommit(hist.current, e.path, e.text));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hist, computeCommit]);

  // ── click to select / edit ─────────────────────────────────────────────────
  const onCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const el = target.closest('[data-edit]') as HTMLElement | null;
    // In Customize mode NOTHING should navigate or trigger its own action —
    // links/buttons must be selectable, not "act as buttons". Block them all.
    if (!el) {
      if (target.closest('a,button,[role="button"]')) { e.preventDefault(); e.stopPropagation(); }
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (editingRef.current && editingRef.current !== el) commitEditing();
    const path = el.dataset.edit!;
    const type = (el.dataset.editType as EditType) || 'text';
    const rect = el.getBoundingClientRect();
    setSel({ path, type });
    if (type === 'text') {
      el.contentEditable = 'true';
      editingRef.current = el;
      el.focus();
      setPopover({ kind: 'text', path, rect });
    } else if (type === 'background') {
      setPopover({ kind: 'background', path, rect });
    } else if (type === 'image') {
      setPopover({ kind: 'image', path, rect });
    } else if (type === 'icon') {
      setPopover({ kind: 'icon', path, rect });
    }
  }, [commitEditing]);

  // hover → outline any editable element + show list add/remove controls
  const onCanvasMove = useCallback((e: React.MouseEvent) => {
    const editable = (e.target as HTMLElement).closest('[data-edit]') as HTMLElement | null;
    setHoverEdit((h) => {
      if (!editable) return h ? null : h;
      const r = editable.getBoundingClientRect();
      const next = { top: r.top, left: r.left, width: r.width, height: r.height };
      return h && h.top === next.top && h.left === next.left && h.width === next.width ? h : next;
    });
    const el = (e.target as HTMLElement).closest('[data-edit-item]') as HTMLElement | null;
    if (!el) { setHover((h) => (h ? null : h)); return; }
    const path = el.dataset.editItem!;
    const r = el.getBoundingClientRect();
    setHover((h) => (h && h.path === path ? h : { path, rect: { top: r.top, left: r.left, width: r.width, height: r.height } }));
  }, []);

  // ── keep selection outline + popover anchored on scroll/resize/rerender ─────
  const reanchor = useCallback(() => {
    if (!sel) return;
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-edit="${sel.path.replace(/"/g, '\\"')}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPopover((p) => (p ? { ...p, rect: { top: r.top, left: r.left, width: r.width, height: r.height } } : p));
  }, [sel]);
  useLayoutEffect(reanchor, [reanchor, data]);
  useEffect(() => {
    const host = scrollRef.current;
    const onScroll = () => { reanchor(); setHover(null); setHoverEdit(null); };
    window.addEventListener('resize', reanchor);
    host?.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('resize', reanchor); host?.removeEventListener('scroll', onScroll); };
  }, [reanchor]);
  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { commitEditing(); setPopover(null); setSel(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [commitEditing]);

  const handleUpload = useCallback(async (path: string, file: File) => {
    if (!/^image\//.test(file.type) || file.size > 5_000_000) return;
    const dataUrl = await new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file); });
    let url = dataUrl;
    if (websiteId) { try { url = (await mediaApi.upload(websiteId, { dataUrl, type: 'GALLERY' })).url; } catch { /* fall back to data URL */ } }
    commitField(path, url);
  }, [websiteId, commitField]);

  const doSave = () => {
    const e = takeEditing();
    const c = e ? computeCommit(hist.current, e.path, e.text) : hist.current;
    if (e) hist.set(c);
    onSave(c);
    savedRef.current = JSON.stringify(c);
  };
  const doDone = () => {
    const e = takeEditing();
    const c = e ? computeCommit(hist.current, e.path, e.text) : hist.current;
    if (e) hist.set(c);
    if (JSON.stringify(c) !== savedRef.current && !window.confirm('Discard unsaved changes?')) return;
    onDone();
  };
  const closePopover = () => { commitEditing(); setPopover(null); setSel(null); };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sand-100">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between bg-sand-900 px-4 text-white">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-purple-500" />
          </span>
          Editing Mode <span className="ml-1 hidden text-xs text-white/40 sm:inline">— click any part of your site to edit it</span>
        </span>
        <div className="flex items-center gap-1">
          <TBtn title={hist.undoCount ? `Undo (${hist.undoCount})` : 'Undo'} disabled={!hist.canUndo} onClick={() => { commitEditing(); hist.undo(); }}><Undo2 className="h-4 w-4" /></TBtn>
          <TBtn title={hist.redoCount ? `Redo (${hist.redoCount})` : 'Redo'} disabled={!hist.canRedo} onClick={() => { commitEditing(); hist.redo(); }}><Redo2 className="h-4 w-4" /></TBtn>
          <span className="mx-1.5 h-5 w-px bg-white/20" />
          <TBtn title="Reset all changes" onClick={() => { commitEditing(); hist.reset(); }} className="hover:text-orange-400"><RotateCcw className="h-4 w-4" /></TBtn>
          <span className="mx-1.5 h-5 w-px bg-white/20" />
          <button
            onClick={() => { commitEditing(); setPopover(null); setSel(null); setThemePanel((v) => !v); }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${themePanel ? 'bg-white/15 text-white' : 'text-white/90 hover:bg-white/10'}`}
            title="Background & site colours"
          >
            <Paintbrush className="h-4 w-4" /> Colours
          </button>
          <span className="mx-1.5 h-5 w-px bg-white/20" />
          <button onClick={doSave} className="inline-flex items-center gap-1.5 rounded-full bg-purple-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500">
            <Save className="h-3.5 w-3.5" /> Save{dirty ? '' : 'd'}
          </button>
          <button onClick={doDone} className="ml-1 rounded-full border border-white/20 px-4 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10">Done</button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto overflow-x-hidden">
        <div onClickCapture={onCanvasClick} onMouseMove={onCanvasMove} className="cz-canvas">
          <TemplateRender slug={templateSlug} data={data} />
        </div>
      </div>

      {/* Hover affordance — outline any editable element so it's discoverable */}
      {hoverEdit && (!popover || Math.abs(hoverEdit.top - popover.rect.top) > 1 || Math.abs(hoverEdit.left - popover.rect.left) > 1) && (
        <div className="pointer-events-none fixed z-[140] rounded-[3px] outline-dashed outline-2 outline-purple-400/70" style={{ top: hoverEdit.top - 2, left: hoverEdit.left - 2, width: hoverEdit.width + 4, height: hoverEdit.height + 4 }} />
      )}

      {/* Selection outline */}
      {popover && <div className="pointer-events-none fixed z-[150] rounded-[3px] ring-2 ring-purple-500" style={{ top: popover.rect.top - 2, left: popover.rect.left - 2, width: popover.rect.width + 4, height: popover.rect.height + 4 }} />}

      {/* Hover list controls */}
      {hover && (
        <div className="fixed z-[160] flex gap-1" style={{ top: hover.rect.top + 4, left: hover.rect.left + hover.rect.width - 56 }}>
          <button title="Add item" onClick={() => listOp(hover.path, 'add')} className="grid h-7 w-7 place-items-center rounded-md bg-purple-600 text-white shadow hover:bg-purple-500"><Plus className="h-4 w-4" /></button>
          <button title="Remove item" onClick={() => listOp(hover.path, 'remove')} className="grid h-7 w-7 place-items-center rounded-md bg-white text-ember-600 shadow ring-1 ring-sand-200 hover:bg-ember-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      )}

      {/* Popover */}
      {popover && (
        <Popover rect={popover.rect} onClose={closePopover}>
          {popover.kind === 'text' && (
            <div className="w-48 space-y-2">
              <p className="text-[11px] text-sand-400">Type to edit the text. Colours:</p>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-sand-600"><TypeIcon className="h-3.5 w-3.5 text-purple-500" /> Text</span>
                <span className="flex items-center gap-1">
                  <input type="color" value={toHex(hist.current.styles?.[popover.path]?.color)} onChange={(e) => setColor(popover.path, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-sand-200" />
                  {hist.current.styles?.[popover.path]?.color && <button onClick={() => clearStyleKey(popover.path, 'color')} className="text-xs text-sand-400 hover:text-sand-700">reset</button>}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-medium text-sand-600"><Paintbrush className="h-3.5 w-3.5 text-purple-500" /> Fill</span>
                <span className="flex items-center gap-1">
                  <input type="color" value={toHex(hist.current.styles?.[popover.path]?.background ?? '#ffffff')} onChange={(e) => setFill(popover.path, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-sand-200" />
                  {hist.current.styles?.[popover.path]?.background && <button onClick={() => clearStyleKey(popover.path, 'background')} className="text-xs text-sand-400 hover:text-sand-700">reset</button>}
                </span>
              </div>
            </div>
          )}
          {popover.kind === 'background' && (
            <div className="w-52">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-sand-600"><Paintbrush className="h-3.5 w-3.5 text-purple-500" /> Colours</p>
              <div className="space-y-1.5">
                {colorSlotsFor(templateSlug).map((s) => (
                  <label key={s.key} className="flex items-center justify-between gap-2 text-xs text-sand-700">
                    {s.label}
                    <input type="color" value={toHex(hist.current.theme?.[s.cssVar] ?? s.default)} onChange={(e) => setThemeVar(s.cssVar, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-sand-200" />
                  </label>
                ))}
              </div>
            </div>
          )}
          {popover.kind === 'image' && (
            <div className="w-56">
              <p className="mb-2 flex items-center gap-1 text-xs font-medium text-sand-600"><ImageIcon className="h-3.5 w-3.5 text-purple-500" /> Photo</p>
              <div className="flex gap-2">
                <label className="flex-1 cursor-pointer rounded-lg border border-sand-200 px-2 py-1.5 text-center text-xs font-medium text-sand-700 hover:border-sand-300">
                  <Upload className="me-1 inline h-3 w-3" /> Upload
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleUpload(popover.path, f); setPopover(null); } }} />
                </label>
                <button onClick={() => { setPicker({ path: popover.path, query: queryFor(popover.path, data) }); setPopover(null); }} className="flex-1 rounded-lg bg-purple-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-purple-500"><Search className="me-1 inline h-3 w-3" /> Find</button>
              </div>
              <input value={typeof getPath(data, popover.path) === 'string' ? (getPath(data, popover.path) as string) : ''} onChange={(e) => commitField(popover.path, e.target.value)} placeholder="…or paste an image URL" className="input mt-2 text-xs" />
            </div>
          )}
          {popover.kind === 'icon' && (
            <IconPicker
              current={typeof getPath(data, popover.path) === 'string' ? (getPath(data, popover.path) as string) : undefined}
              onPick={(name) => { commitField(popover.path, name); setPopover(null); setSel(null); }}
            />
          )}
        </Popover>
      )}

      {/* Theme / background colours panel (toolbar "Colours") */}
      {themePanel && (
        <div className="fixed right-3 top-16 z-[170] w-60 rounded-xl border border-sand-200 bg-white p-3 shadow-elevated">
          <div className="mb-2 flex items-center justify-between">
            <p className="flex items-center gap-1 text-xs font-semibold text-sand-700"><Paintbrush className="h-3.5 w-3.5 text-purple-500" /> Background &amp; colours</p>
            <button onClick={() => setThemePanel(false)} aria-label="Close" className="grid h-5 w-5 place-items-center rounded-full text-sand-400 hover:bg-sand-100 hover:text-sand-700"><X className="h-3 w-3" /></button>
          </div>
          <div className="space-y-1.5">
            {colorSlotsFor(templateSlug).map((s) => (
              <label key={s.key} className="flex items-center justify-between gap-2 text-xs text-sand-700">
                {s.label}
                <span className="flex items-center gap-1">
                  <input type="color" value={toHex(hist.current.theme?.[s.cssVar] ?? s.default)} onChange={(e) => setThemeVar(s.cssVar, e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-sand-200" />
                  {hist.current.theme?.[s.cssVar] && <button onClick={() => clearThemeVar(s.cssVar)} className="text-[10px] text-sand-400 hover:text-sand-700">reset</button>}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-sand-400">Tip: you can also click any empty background area of the site.</p>
        </div>
      )}

      <PhotoPicker open={!!picker} initialQuery={picker?.query} onPick={(url) => picker && commitField(picker.path, url)} onClose={() => setPicker(null)} />
    </div>
  );
}

/** Icon library picker — searchable grid over the full lucide set. */
function IconPicker({ current, onPick }: { current?: string; onPick: (name: string) => void }) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const groups = ICON_LIBRARY
    .map((g) => ({ group: g.group, icons: query ? g.icons.filter((n) => n.toLowerCase().includes(query)) : g.icons }))
    .filter((g) => g.icons.length);
  return (
    <div className="w-64">
      <p className="mb-2 flex items-center gap-1 text-xs font-medium text-sand-600"><Smile className="h-3.5 w-3.5 text-purple-500" /> Choose an icon</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons…" className="input mb-2 text-xs" autoFocus />
      <div className="max-h-56 overflow-y-auto pr-1">
        {groups.length === 0 && <p className="px-1 py-3 text-center text-xs text-sand-400">No icons match "{q}".</p>}
        {groups.map((g) => (
          <div key={g.group} className="mb-2">
            <p className="mb-1 px-0.5 text-[10px] font-semibold uppercase tracking-wide text-sand-400">{g.group}</p>
            <div className="grid grid-cols-6 gap-1">
              {g.icons.map((name) => (
                <button
                  key={name}
                  title={name}
                  onClick={() => onPick(name)}
                  className={`grid aspect-square place-items-center rounded-md border text-sand-700 transition-colors hover:border-purple-400 hover:bg-purple-50 ${current === name ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-sand-200'}`}
                >
                  <DynamicIcon name={name} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TBtn({ children, title, onClick, disabled, className }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; className?: string }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-transparent ${className ?? ''}`}>
      {children}
    </button>
  );
}

/** Small floating popover anchored above/below the selected element. */
function Popover({ rect, onClose, children }: { rect: Rect; onClose: () => void; children: React.ReactNode }) {
  const below = rect.top < 130;
  const top = below ? rect.top + rect.height + 8 : rect.top - 8;
  const left = Math.min(Math.max(rect.left, 8), window.innerWidth - 280);
  return (
    <div className="fixed z-[170]" style={{ top, left, transform: below ? undefined : 'translateY(-100%)' }}>
      <div className="relative rounded-xl border border-sand-200 bg-white p-3 shadow-elevated">
        <button onClick={onClose} aria-label="Close" className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center rounded-full bg-sand-900 text-white"><X className="h-3 w-3" /></button>
        {children}
      </div>
    </div>
  );
}

function queryFor(path: string, data: TemplateData): string {
  if (path.includes('logo')) return `${data.business.name} logo`;
  if (path.includes('instructor')) return 'driving instructor portrait';
  if (path.includes('about')) return 'driving lesson instructor car';
  return 'driving lesson car road';
}
