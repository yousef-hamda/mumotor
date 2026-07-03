import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, ExternalLink, Monitor, Smartphone, Tablet, Loader2 } from 'lucide-react';
import { aiApi, apiError, mediaApi, siteUrl, websiteApi, type PresetSummary } from '../../lib/api';
import { Button, CenteredSpinner, Field, Input, Modal, NumberInput, Select, Textarea } from '../../components/ui';
import { Logo } from '../../components/Logo';

type Draft = Record<string, unknown> & { colors?: { primary?: string; accent?: string } };
type Viewport = 'desktop' | 'tablet' | 'mobile';
const widths: Record<Viewport, string> = { desktop: '100%', tablet: '820px', mobile: '390px' };

export default function EditorPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: website, isLoading } = useQuery({ queryKey: ['website', id], queryFn: () => websiteApi.get(id) });
  const { data: presets } = useQuery({ queryKey: ['presets'], queryFn: aiApi.quickTemplates });

  const [name, setName] = useState('');
  const [presetId, setPresetId] = useState('clear-horizon');
  const [draft, setDraft] = useState<Draft>({});
  const [html, setHtml] = useState('');
  const [viewport, setViewport] = useState<Viewport>('desktop');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rendering, setRendering] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishUrl, setPublishUrl] = useState('');
  const initialized = useRef(false);

  useEffect(() => {
    if (website && !initialized.current) {
      initialized.current = true;
      setName(website.name);
      setPresetId(website.selectedPreset || 'clear-horizon');
      setDraft({ ...(website.configuration as Draft) });
    }
  }, [website]);

  const currentPreset = useMemo(() => presets?.find((p) => p.id === presetId), [presets, presetId]);
  const setField = (k: string, v: unknown) => setDraft((d) => ({ ...d, [k]: v }));
  const setColor = (k: 'primary' | 'accent', v: string) => setDraft((d) => ({ ...d, colors: { ...(d.colors || {}), [k]: v } }));
  const [uploading, setUploading] = useState(false);

  const readFile = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const dataUrl = await readFile(f);
      const m = await mediaApi.upload(id, { dataUrl, type: 'CAR_PHOTO' });
      setDraft((d) => ({ ...d, carPhoto: { url: m.url } }));
      toast.success('Cover photo updated');
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setUploading(false);
    }
  }

  async function uploadGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of files) {
        const dataUrl = await readFile(f);
        const m = await mediaApi.upload(id, { dataUrl, type: 'GALLERY' });
        urls.push(m.url);
      }
      setDraft((d) => ({ ...d, galleryPhotos: [...(((d.galleryPhotos as string[]) || [])), ...urls] }));
      toast.success(`${urls.length} photo(s) added`);
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setUploading(false);
    }
  }

  // Debounced live preview
  const draftKey = JSON.stringify({ name, presetId, draft });
  useEffect(() => {
    if (!initialized.current) return;
    setRendering(true);
    const t = setTimeout(async () => {
      try {
        const res = await aiApi.generateWebsite({ name, presetId, businessConfig: draft });
        setHtml(res.html);
      } catch {
        /* ignore transient */
      } finally {
        setRendering(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced autosave
  useEffect(() => {
    if (!initialized.current) return;
    setStatus('saving');
    const t = setTimeout(async () => {
      try {
        await websiteApi.update(id, { name, selectedPreset: presetId, configuration: draft });
        setStatus('saved');
      } catch {
        setStatus('idle');
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [draftKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const publish = useMutation({
    mutationFn: () => websiteApi.publish(id),
    onSuccess: (res) => {
      setPublishUrl(siteUrl(res.slug));
      setPublishOpen(true);
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  if (isLoading || !website) return <CenteredSpinner label="Loading editor…" />;

  const str = (k: string, fallback = '') => (draft[k] != null ? String(draft[k]) : fallback);
  const numv = (k: string, fallback = 0) => (draft[k] != null ? Number(draft[k]) : fallback);
  const primary = draft.colors?.primary || currentPreset?.colors.primary || '#1e3a8a';
  const accent = draft.colors?.accent || currentPreset?.colors.accent || '#2563eb';

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sand-100">
      {/* Top bar */}
      <header className="glass z-20 flex items-center justify-between gap-4 border-b border-white/50 px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/dashboard" aria-label="Mumotor dashboard"><Logo size="xs" /></Link>
          <span className="hidden text-sm font-semibold text-sand-800 sm:block">{name}</span>
          {/* Save status indicator */}
          <span className="flex items-center gap-1.5 text-xs text-sand-500">
            {status === 'saving' && (
              <><Loader2 className="h-3 w-3 animate-spin text-sand-500" /> <span>Saving…</span></>
            )}
            {status === 'saved' && (
              <><Check className="h-3 w-3 text-sand-900" /> <span className="text-sand-600">Saved</span></>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Viewport switcher */}
          <div className="hidden items-center gap-0.5 rounded-lg border border-sand-200 bg-white p-0.5 md:flex">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([v, Icon]) => (
              <button
                key={v}
                onClick={() => setViewport(v)}
                title={v}
                aria-label={`${v} preview`}
                aria-pressed={viewport === v}
                className={
                  viewport === v
                    ? 'rounded-md bg-sand-900 p-1.5 text-white transition-colors duration-200'
                    : 'rounded-md p-1.5 text-sand-400 transition-colors duration-200 hover:text-sand-700'
                }
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          {website.status === 'PUBLISHED' && (
            <a
              href={siteUrl(website.slug)}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary text-sm"
            >
              View live <ExternalLink className="h-4 w-4" />
            </a>
          )}

          <Button
            variant="primary"
            onClick={() => publish.mutate()}
            loading={publish.isPending}
            className="text-sm"
          >
            Publish
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Preview canvas */}
        <div className="relative flex flex-1 items-start justify-center overflow-auto bg-sand-100 p-6">
          {rendering && (
            <div className="absolute end-6 top-6 z-10 flex items-center gap-2 rounded-lg border border-sand-200 bg-white px-3 py-1.5 text-xs text-sand-500 shadow-card">
              <Loader2 className="h-3 w-3 animate-spin text-sand-500" /> Updating preview
            </div>
          )}

          <div
            className="relative mx-auto overflow-hidden rounded-xl border border-sand-200 bg-white shadow-card transition-all duration-300"
            style={{ width: widths[viewport], maxWidth: '100%' }}
          >
            <iframe
              title="Preview"
              srcDoc={html}
              className="h-[calc(100vh-9rem)] w-full"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>

        {/* Controls sidebar */}
        <aside className="w-80 shrink-0 overflow-y-auto border-s border-sand-200 bg-white p-5">
          <EditorSection title="Design">
            {/* Preset swatches */}
            <div className="grid grid-cols-3 gap-2">
              {presets?.map((p: PresetSummary) => (
                <button
                  key={p.id}
                  onClick={() => setPresetId(p.id)}
                  title={p.label}
                  aria-label={p.label}
                  aria-pressed={presetId === p.id}
                  className={
                    presetId === p.id
                      ? 'overflow-hidden rounded-lg ring-2 ring-sand-900 ring-offset-1 transition-all duration-200'
                      : 'overflow-hidden rounded-lg ring-1 ring-sand-200 transition-all duration-200 hover:ring-sand-400'
                  }
                >
                  <span className="flex h-10">
                    <span className="flex-1" style={{ background: p.colors.primary }} />
                    <span className="w-1/3" style={{ background: p.colors.accent }} />
                  </span>
                </button>
              ))}
            </div>
            {/* Color overrides */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ColorField label="Primary" value={primary} onChange={(v) => setColor('primary', v)} />
              <ColorField label="Accent" value={accent} onChange={(v) => setColor('accent', v)} />
            </div>
          </EditorSection>

          <EditorSection title="Photos">
            <Field label="Cover photo" hint="Overrides the hero & about images">
              {(draft.carPhoto as { url?: string })?.url && (
                <img
                  src={(draft.carPhoto as { url: string }).url}
                  alt=""
                  className="mb-2 h-24 w-full rounded-2xl object-cover ring-1 ring-sand-200"
                />
              )}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={uploadCover}
                className="block w-full text-sm text-sand-500 file:me-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-sand-700 file:transition-colors file:hover:bg-sand-200"
              />
              {(draft.carPhoto as { url?: string })?.url && (
                <button
                  type="button"
                  onClick={() => setDraft((d) => { const n = { ...d }; delete (n as Record<string, unknown>).carPhoto; return n; })}
                  className="mt-2 text-xs font-semibold text-ember-600 transition-colors hover:text-ember-700"
                >
                  Remove cover
                </button>
              )}
            </Field>
            <Field label="Gallery">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={uploadGallery}
                className="block w-full text-sm text-sand-500 file:me-3 file:rounded-lg file:border-0 file:bg-sand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-sand-700 file:transition-colors file:hover:bg-sand-200"
              />
              {(((draft.galleryPhotos as string[]) || []).length > 0) && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {((draft.galleryPhotos as string[]) || []).map((u, i) => (
                    <img key={i} src={u} alt="" className="h-14 w-full rounded-xl object-cover ring-1 ring-sand-200" />
                  ))}
                </div>
              )}
            </Field>
            {uploading && (
              <p className="flex items-center gap-1.5 text-xs text-sand-500">
                <Loader2 className="h-3 w-3 animate-spin text-sand-500" /> Uploading…
              </p>
            )}
          </EditorSection>

          <EditorSection title="Content">
            <Field label="Site name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Tagline"><Input value={str('tagline')} onChange={(e) => setField('tagline', e.target.value)} /></Field>
            <Field label="Instructor name"><Input value={str('teacherName')} onChange={(e) => setField('teacherName', e.target.value)} /></Field>
            <Field label="Bio"><Textarea rows={3} value={str('bio')} onChange={(e) => setField('bio', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price/lesson"><NumberInput min={0} value={numv('pricePerClass', 50)} onValueChange={(n) => setField('pricePerClass', n)} /></Field>
              <Field label="Duration">
                <Select value={numv('classDuration', 45)} onChange={(e) => setField('classDuration', Number(e.target.value))}>
                  {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d}m</option>)}
                </Select>
              </Field>
              <Field label="Pass rate %"><NumberInput min={0} max={100} value={numv('passRate', 95)} onValueChange={(n) => setField('passRate', n)} /></Field>
              <Field label="Experience"><Input value={str('experienceYears', '10+')} onChange={(e) => setField('experienceYears', e.target.value)} /></Field>
            </div>
          </EditorSection>

          <EditorSection title="Contact">
            <Field label="Phone"><Input value={contactStr(draft, 'phone')} onChange={(e) => setContact(setDraft, 'phone', e.target.value)} /></Field>
            <Field label="Email"><Input value={contactStr(draft, 'email')} onChange={(e) => setContact(setDraft, 'email', e.target.value)} /></Field>
            <Field label="Area"><Input value={contactStr(draft, 'address')} onChange={(e) => setContact(setDraft, 'address', e.target.value)} /></Field>
          </EditorSection>
        </aside>
      </div>

      {/* Publish success modal */}
      <Modal
        open={publishOpen}
        onClose={() => { setPublishOpen(false); navigate('/dashboard'); }}
        title="Your site is published"
        footer={
          <Button variant="primary" onClick={() => { setPublishOpen(false); navigate('/dashboard'); }}>
            Done
          </Button>
        }
      >
        <p className="text-sm text-sand-600">Your changes are live. Share your site:</p>
        <a
          href={publishUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center justify-between gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-3 shadow-card transition-all hover:border-sand-300 hover:shadow-elevated"
        >
          <code className="truncate text-sm font-medium text-sand-700">{website.slug}.mumotor.com</code>
          <ExternalLink className="h-4 w-4 shrink-0 text-sand-400" />
        </a>
      </Modal>
    </div>
  );
}

function EditorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 border-b border-sand-100 pb-6 last:border-0">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-sand-400">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-2xl border border-sand-200 bg-white p-1.5 shadow-[inset_0_1px_2px_rgba(58,38,16,0.04)] transition focus-within:border-sun-400 focus-within:ring-4 focus-within:ring-sun-400/15">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-sand-500">{value}</span>
      </div>
    </div>
  );
}

function contactStr(draft: Draft, k: string): string {
  const c = (draft.contact as Record<string, string>) || {};
  return c[k] || '';
}
function setContact(setDraft: React.Dispatch<React.SetStateAction<Draft>>, k: string, v: string) {
  setDraft((d) => ({ ...d, contact: { ...((d.contact as Record<string, string>) || {}), [k]: v } }));
}
