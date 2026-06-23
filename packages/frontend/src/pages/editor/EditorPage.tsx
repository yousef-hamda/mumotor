import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, Check, ExternalLink, Monitor, Smartphone, Tablet, Loader2 } from 'lucide-react';
import { aiApi, apiError, siteUrl, websiteApi, type PresetSummary } from '../../lib/api';
import { Button, CenteredSpinner, Field, Input, Modal, Select, Textarea } from '../../components/ui';
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
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-100">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <Link to="/dashboard"><Logo size="xs" /></Link>
          <span className="hidden text-sm font-medium text-zinc-700 sm:block">{name}</span>
          <span className="flex items-center gap-1 text-xs text-zinc-400">
            {status === 'saving' && <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>}
            {status === 'saved' && <><Check className="h-3 w-3 text-emerald-500" /> Saved</>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 md:flex">
            {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setViewport(v)} title={v}
                className={viewport === v ? 'rounded-md bg-white p-1.5 text-zinc-900 shadow-sm' : 'rounded-md p-1.5 text-zinc-400 hover:text-zinc-700'}>
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
          {website.status === 'PUBLISHED' && (
            <a href={siteUrl(website.slug)} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
              View live <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <Button onClick={() => publish.mutate()} loading={publish.isPending} className="text-sm">Publish</Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Preview */}
        <div className="relative flex flex-1 items-start justify-center overflow-auto bg-zinc-100 p-6">
          {rendering && (
            <div className="absolute right-8 top-8 z-10 flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-zinc-500 shadow-card">
              <Loader2 className="h-3 w-3 animate-spin" /> Updating preview
            </div>
          )}
          <div className="mx-auto overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-elevated transition-all" style={{ width: widths[viewport], maxWidth: '100%' }}>
            <iframe title="Preview" srcDoc={html} className="h-[calc(100vh-9rem)] w-full" sandbox="allow-scripts allow-same-origin allow-popups" />
          </div>
        </div>

        {/* Controls */}
        <aside className="w-80 shrink-0 overflow-y-auto border-l border-zinc-200 bg-white p-5">
          <Section title="Design">
            <div className="grid grid-cols-3 gap-2">
              {presets?.map((p: PresetSummary) => (
                <button key={p.id} onClick={() => setPresetId(p.id)} title={p.label}
                  className={presetId === p.id ? 'overflow-hidden rounded-lg ring-2 ring-zinc-900' : 'overflow-hidden rounded-lg ring-1 ring-zinc-200 hover:ring-zinc-400'}>
                  <span className="flex h-9">
                    <span className="flex-1" style={{ background: p.colors.primary }} />
                    <span className="w-1/3" style={{ background: p.colors.accent }} />
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <ColorField label="Primary" value={primary} onChange={(v) => setColor('primary', v)} />
              <ColorField label="Accent" value={accent} onChange={(v) => setColor('accent', v)} />
            </div>
          </Section>

          <Section title="Content">
            <Field label="Site name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Tagline"><Input value={str('tagline')} onChange={(e) => setField('tagline', e.target.value)} /></Field>
            <Field label="Instructor name"><Input value={str('teacherName')} onChange={(e) => setField('teacherName', e.target.value)} /></Field>
            <Field label="Bio"><Textarea rows={3} value={str('bio')} onChange={(e) => setField('bio', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price/lesson"><Input type="number" value={numv('pricePerClass', 50)} onChange={(e) => setField('pricePerClass', Number(e.target.value))} /></Field>
              <Field label="Duration">
                <Select value={numv('classDuration', 45)} onChange={(e) => setField('classDuration', Number(e.target.value))}>
                  {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d}m</option>)}
                </Select>
              </Field>
              <Field label="Pass rate %"><Input type="number" value={numv('passRate', 95)} onChange={(e) => setField('passRate', Number(e.target.value))} /></Field>
              <Field label="Experience"><Input value={str('experienceYears', '10+')} onChange={(e) => setField('experienceYears', e.target.value)} /></Field>
            </div>
          </Section>

          <Section title="Contact">
            <Field label="Phone"><Input value={contactStr(draft, 'phone')} onChange={(e) => setContact(setDraft, 'phone', e.target.value)} /></Field>
            <Field label="Email"><Input value={contactStr(draft, 'email')} onChange={(e) => setContact(setDraft, 'email', e.target.value)} /></Field>
            <Field label="Area"><Input value={contactStr(draft, 'address')} onChange={(e) => setContact(setDraft, 'address', e.target.value)} /></Field>
          </Section>
        </aside>
      </div>

      <Modal
        open={publishOpen}
        onClose={() => { setPublishOpen(false); navigate('/dashboard'); }}
        title="Your site is published"
        footer={<Button onClick={() => { setPublishOpen(false); navigate('/dashboard'); }}>Done</Button>}
      >
        <p className="text-sm text-zinc-600">Your changes are live. Share your site:</p>
        <a href={publishUrl} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 hover:border-zinc-300">
          <code className="truncate text-sm text-zinc-700">{website.slug}.drivesawa.com</code>
          <ExternalLink className="h-4 w-4 shrink-0 text-zinc-400" />
        </a>
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 border-b border-zinc-100 pb-6 last:border-0">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-zinc-300 p-1">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0" />
        <span className="font-mono text-xs text-zinc-500">{value}</span>
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
