import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Eye, EyeOff, Plus, Sparkles, Trash2, Upload, Wand2, X } from 'lucide-react';
import { apiError, drivingSchoolApi, websiteApi, wizardDraftApi, type PublishResult } from '../../lib/api';
import { track } from '../../lib/analytics';
import { useAuth } from '../../lib/auth';
import { Logo, LogoMark } from '../../components/Logo';
import { Button, Field, Input, NumberInput, Select, Textarea } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import { TEMPLATES, getTemplate, type TemplateMeta } from '../../templates/registry';
import { wizardToTemplateData } from '../../templates/fromWizard';
import { TemplateRender } from '../../templates/TemplateRender';
import { TemplateConcept, MumotorAccentDots } from '../../templates/TemplateConcept';
import CustomizeMode from '../../components/customize/CustomizeMode';
import {
  EXPERIENCE_LEVELS,
  SOCIAL_PLATFORMS,
  TRANSMISSIONS,
  WEEKDAYS,
  buildBusinessHours,
  clearWizard,
  defaultWizardConfig,
  loadWizard,
  sampleWizardConfig,
  saveWizard,
  toBusinessConfig,
  wizardSavedAt,
  type PlanInput,
  type SocialPlatform,
  type WizardConfig,
} from '../../lib/wizard';
import type { Customization } from '../../templates/customize/overrides';
import { cn, titleCase } from '../../lib/utils';

type Step = 'welcome' | 'business' | 'setup' | 'browse' | 'design' | 'customize' | 'account' | 'done';
const MAIN: Step[] = ['business', 'setup', 'browse', 'design'];
const STEP_LABELS = ['Business', 'Setup', 'Templates', 'Design'];

/** Minutes from time `a` ("HH:MM") to time `b`; negative if b is earlier. */
function minutesAfter(a: string, b: string): number {
  const toMin = (t: string) => { const [h, m] = (t || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
  return toMin(b) - toMin(a);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function BuilderWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [config, setConfig] = useState<WizardConfig>(loadWizard());
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);
  const [searchParams] = useSearchParams();

  // Carry a design chosen from the /templates gallery (?template=<slug>) into the wizard.
  useEffect(() => {
    const choice = searchParams.get('template');
    if (choice) setConfig((c) => (c.templateChoice === choice ? c : { ...c, templateChoice: choice }));
  }, [searchParams]);

  useEffect(() => saveWizard(config), [config]);

  // ── Server-side draft (logged-in users only) ───────────────────────────────
  // localStorage remains the primary store; the server copy survives browser
  // changes. On mount, offer to restore a newer server draft; afterwards keep
  // the server copy updated with a debounced autosave.
  const draftReady = useRef(false); // don't autosave until the restore check resolved
  // Captured before the first render's saveWizard effect stamps a fresh timestamp.
  const localSavedAt = useRef(wizardSavedAt());
  const [restorePrompt, setRestorePrompt] = useState<WizardConfig | null>(null);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    wizardDraftApi
      .get()
      .then((draft) => {
        if (!alive) return;
        if (draft && new Date(draft.updatedAt).getTime() > localSavedAt.current) {
          setRestorePrompt({ ...defaultWizardConfig, ...(draft.config as Partial<WizardConfig>) });
        }
      })
      .catch(() => { /* drafts are best-effort */ })
      .finally(() => { if (alive) draftReady.current = true; });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || !draftReady.current || restorePrompt) return;
    const t = setTimeout(() => {
      wizardDraftApi.put(config as unknown as Record<string, unknown>).catch(() => { /* best-effort */ });
    }, 2000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, user?.id, restorePrompt]);
  const set = <K extends keyof WizardConfig>(k: K, v: WizardConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const current = Math.max(0, MAIN.indexOf((step === 'account' ? 'design' : step) as Step));
  const showStepper = step !== 'welcome' && step !== 'done' && step !== 'customize';
  const wide = step === 'design' || step === 'browse';

  // Customize is a full-screen mode of its own.
  if (step === 'customize') {
    return (
      <CustomizeMode
        baseData={wizardToTemplateData({ ...config, customization: undefined })}
        templateSlug={config.templateChoice || TEMPLATES[0].slug}
        value={config.customization}
        onSave={(c: Customization) => { set('customization', c); toast.success('Changes saved'); }}
        onDone={() => setStep('design')}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="glass sticky top-0 z-30 border-b border-white/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/" aria-label="Mumotor home"><Logo size="sm" /></Link>
          <div className="text-sm text-sand-600">
            {user ? (
              <span className="font-medium text-sand-700">{user.name}</span>
            ) : (
              <Link to="/login" className="font-semibold text-sand-700 transition-colors hover:text-sand-900 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
        {showStepper && (
          <div className="border-t border-white/40">
            <Stepper current={current} />
          </div>
        )}
      </header>

      <main className={cn('mx-auto flex w-full flex-1 flex-col py-10', wide ? 'max-w-[1320px] px-4' : 'max-w-3xl px-5')}>
        {restorePrompt && (
          <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-sand-200 bg-white px-4 py-3 text-sm text-sand-700 shadow-sm">
            <span>We found a saved setup from another session. Continue where you left off?</span>
            <div className="ms-auto flex gap-2">
              <button
                onClick={() => { setConfig(restorePrompt); setRestorePrompt(null); toast.success('Draft restored'); }}
                className="btn-primary !py-1.5 text-xs"
              >
                Restore draft
              </button>
              <button onClick={() => setRestorePrompt(null)} className="btn-secondary !py-1.5 text-xs">
                Start fresh
              </button>
            </div>
          </div>
        )}
        {step === 'welcome' && <Welcome onStart={() => { track('wizard_started'); setStep('business'); }} />}
        {step === 'business' && (
          <BusinessStep
            config={config}
            set={set}
            onAuto={() => { setConfig((c) => sampleWizardConfig(c)); toast.success('Sample details filled in — edit anything you like'); }}
            onBack={() => setStep('welcome')}
            onNext={() => {
              if (!config.businessName.trim()) return toast.error('Please enter your business name');
              track('wizard_step_completed', { step: 'business' });
              setStep('setup');
            }}
          />
        )}
        {step === 'setup' && (
          <SetupStep
            config={config}
            set={set}
            onBack={() => setStep('business')}
            onNext={() => { track('wizard_step_completed', { step: 'setup' }); setStep('browse'); }}
          />
        )}
        {step === 'browse' && (
          <BrowseStep
            config={config}
            onPick={(id, accent) => {
              track('template_chosen', { slug: id });
              setConfig((c) => {
                const next: WizardConfig = { ...c, templateChoice: id };
                // Mumotor's on-card colour dots set the site's main accent (kept restrained).
                if (accent) {
                  next.customization = { ...c.customization, theme: { ...(c.customization?.theme ?? {}), '--mm-accent': accent } };
                }
                return next;
              });
              setStep('design');
            }}
            onBack={() => setStep('setup')}
          />
        )}
        {step === 'design' && (
          <DesignPreviewStep
            config={config}
            onPick={(id) => set('templateChoice', id)}
            onBack={() => setStep('browse')}
            onCustomize={() => setStep('customize')}
            onPublish={() => (user ? doPublish() : setStep('account'))}
            publishing={publishing}
          />
        )}
        {step === 'account' && <AccountStep onAuthed={doPublish} onBack={() => setStep('design')} publishing={publishing} />}
        {step === 'done' && result && <DoneStep result={result} onDashboard={() => navigate('/dashboard')} />}
      </main>
    </div>
  );

  async function doPublish() {
    setPublishing(true);
    try {
      const website = await websiteApi.create({
        name: config.businessName.trim() || 'My Driving School',
        tagline: config.tagline,
        selectedPreset: config.templateChoice || TEMPLATES[0].slug,
        locale: config.locale,
        configuration: toBusinessConfig(config),
      });
      await drivingSchoolApi.updateSettings(website.id, {
        classDuration: config.classDuration,
        advanceBookingDays: 1,
        bookingCutoffHour: Number((config.reportTime || '18:00').split(':')[0]) || 18,
        dailyCodeEnabled: true,
        restMinutes: config.restEnabled ? config.restMinutes : 0,
        breakTimes: config.breakTimes,
        workingHours: buildBusinessHours(config),
        teacherName: config.teacherName || config.businessName,
        pricePerClass: config.pricePerClass,
      } as never);
      const res = await websiteApi.publish(website.id);
      clearWizard();
      void wizardDraftApi.remove().catch(() => { /* best-effort */ });
      setResult(res);
      setStep('done');
    } catch (e) {
      toast.error(apiError(e).message);
      setStep('design');
    } finally {
      setPublishing(false);
    }
  }
}

// ── Shared chrome ────────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <nav aria-label="Progress" className="mx-auto max-w-3xl px-5 py-3">
      <ol className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const state = i < current ? 'complete' : i === current ? 'current' : 'upcoming';
          return (
            <li key={label} className={cn('flex items-center', i < STEP_LABELS.length - 1 && 'flex-1')}>
              <div className="flex items-center gap-2">
                <span
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                    state === 'complete' && 'border-sun-600 bg-white text-sun-600',
                    state === 'current' && 'border-sand-900 bg-white text-sand-900',
                    state === 'upcoming' && 'border-sand-300 bg-white text-sand-400'
                  )}
                >
                  {state === 'complete' ? <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> : i + 1}
                </span>
                <span className={cn('hidden text-xs font-medium sm:block', state === 'current' ? 'text-sand-900' : state === 'complete' ? 'text-sand-700' : 'text-sand-400')}>
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && <span className={cn('mx-2 h-px flex-1', i < current ? 'bg-sand-400' : 'bg-sand-200')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800">
      <ArrowLeft className="h-4 w-4" /> Back
    </button>
  );
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 sm:p-7">
      <h3 className="text-lg font-semibold tracking-tight text-sand-900">{title}</h3>
      {hint && <p className="mt-1 text-sm text-sand-500">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

// ── Image uploads (data URLs — used directly in the templates) ───────────────

function ImageDrop({ value, onChange, label, hint, max = 2, className }: { value?: string; onChange: (v: string) => void; label: string; hint?: string; max?: number; className?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const take = async (f?: File) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { toast.error('Please choose an image'); return; }
    if (f.size > max * 1_000_000) { toast.error(`Image must be under ${max} MB`); return; }
    onChange(await readFileAsDataUrl(f));
  };
  return (
    <div className={className}>
      <p className="label mb-1.5">{label}</p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files?.[0]); }}
        className={cn('flex items-center gap-4 rounded-2xl border border-dashed p-4 transition-colors', drag ? 'border-sun-500 bg-sun-50' : 'border-sand-300 bg-sand-50')}
      >
        {value ? (
          <img src={value} alt="" className="h-16 w-16 rounded-xl object-cover ring-1 ring-sand-200" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-xl bg-white text-sand-400 ring-1 ring-sand-200"><Upload className="h-5 w-5" /></div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-sand-600">{hint || 'Drag & drop, or'} <button onClick={() => ref.current?.click()} className="font-semibold text-sun-600 hover:underline">browse</button></p>
          {value && <button onClick={() => onChange('')} className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-sand-400 hover:text-ember-600"><Trash2 className="h-3 w-3" /> Remove</button>}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => take(e.target.files?.[0])} />
      </div>
    </div>
  );
}

function GalleryUpload({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const next: string[] = [];
    for (const f of Array.from(files)) {
      if (!/^image\//.test(f.type) || f.size > 5_000_000) continue;
      next.push(await readFileAsDataUrl(f));
    }
    onChange([...value, ...next]);
  };
  return (
    <div>
      <p className="label mb-1.5">Gallery photos (optional)</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((u, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-sand-200">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <button onClick={() => ref.current?.click()} className="grid aspect-square place-items-center rounded-xl border border-dashed border-sand-300 bg-sand-50 text-sand-400 transition-colors hover:border-sun-400 hover:text-sun-600">
          <Plus className="h-5 w-5" />
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
    </div>
  );
}

const TimeInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => <Input type="time" step={300} {...props} />;

function PlansEditor({ plans, onChange }: { plans: PlanInput[]; onChange: (v: PlanInput[]) => void }) {
  const upd = (i: number, patch: Partial<PlanInput>) => onChange(plans.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  const add = () => onChange([...plans, { id: `plan-${Date.now()}`, name: 'New plan', price: 0, unit: 'package', features: [] }]);
  return (
    <div className="space-y-3">
      {plans.map((p, i) => (
        <div key={p.id} className="rounded-xl border border-sand-200 p-3">
          <div className="flex items-center gap-2">
            <Input value={p.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="Plan name (e.g. Single lesson)" />
            {plans.length > 1 && (
              <button onClick={() => onChange(plans.filter((_, j) => j !== i))} aria-label="Remove plan" className="shrink-0 text-sand-400 transition-colors hover:text-ember-600"><Trash2 className="h-4 w-4" /></button>
            )}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <NumberInput min={0} value={p.price} onValueChange={(n) => upd(i, { price: n })} placeholder="Price (₪)" />
            <Input value={p.unit} onChange={(e) => upd(i, { unit: e.target.value })} placeholder="/ lesson · 10 lessons · package" />
          </div>
          <Textarea rows={2} className="mt-2" value={(p.features ?? []).join('\n')} onChange={(e) => upd(i, { features: e.target.value.split('\n') })} placeholder="What's included — one per line" />
          <label className="mt-2 flex items-center gap-1.5 text-xs text-sand-600"><input type="checkbox" checked={!!p.popular} onChange={(e) => upd(i, { popular: e.target.checked })} /> Mark as most popular</label>
        </div>
      ))}
      <button onClick={add} className="inline-flex items-center gap-1 text-sm font-medium text-sun-600 hover:underline"><Plus className="h-4 w-4" /> Add plan</button>
    </div>
  );
}

// ── Welcome ──────────────────────────────────────────────────────────────────

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <FadeUp className="mx-auto max-w-xl py-12 text-center">
      <div className="mb-8 flex justify-center"><LogoMark size="lg" /></div>
      <span className="section-eyebrow justify-center">Mumotor builder</span>
      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-sand-900 sm:text-5xl">Let's build your driving website</h1>
      <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-sand-600">Tell us about your school, pick a design, customise it, and publish a complete bookable website in minutes.</p>
      <div className="mt-10 flex flex-col items-center gap-3">
        <Button variant="primary" onClick={onStart} className="px-8 py-3.5 text-base">Start building <ArrowRight className="h-4 w-4" /></Button>
        <p className="text-sm text-sand-500">No design skills needed · Free to start</p>
      </div>
    </FadeUp>
  );
}

// ── Step 2: Business Info (Part 1) ───────────────────────────────────────────

function BusinessStep({ config, set, onAuto, onBack, onNext }: { config: WizardConfig; set: <K extends keyof WizardConfig>(k: K, v: WizardConfig[K]) => void; onAuto: () => void; onBack: () => void; onNext: () => void }) {
  return (
    <FadeUp className="mx-auto w-full max-w-2xl">
      <BackLink onClick={onBack} />
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Tell us about you</h1>
          <p className="mt-2 text-sand-600">This builds the top of your site — name, story, contact and logo.</p>
        </div>
        <Button variant="secondary" onClick={onAuto} className="shrink-0"><Wand2 className="h-4 w-4" /> Auto-fill sample</Button>
      </div>

      <div className="space-y-5">
        <SectionCard title="Business">
          <Field label="Business name" hint="Required">
            <Input value={config.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Northgate Driving School" />
          </Field>
          <Field label="Business description" hint="Required — what makes you special, your teaching style, pass rate">
            <Textarea rows={4} value={config.businessDescription} onChange={(e) => set('businessDescription', e.target.value)} placeholder="Calm, patient one-to-one lessons with a 96% first-time pass rate…" />
          </Field>
          <Field label="Tagline / slogan">
            <Input value={config.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Your road to confidence" />
          </Field>
        </SectionCard>

        <SectionCard title="Contact">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone"><Input value={config.phone} onChange={(e) => set('phone', e.target.value)} placeholder="054-321-0987" inputMode="tel" /></Field>
            <Field label="Email"><Input type="email" value={config.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Address"><Input value={config.address} onChange={(e) => set('address', e.target.value)} placeholder="22 Jabotinsky Street" /></Field>
            <Field label="City"><Input value={config.city} onChange={(e) => set('city', e.target.value)} placeholder="Netanya" /></Field>
          </div>
          <Field label="Site language">
            <Select value={config.locale} onChange={(e) => set('locale', e.target.value as WizardConfig['locale'])}>
              <option value="EN">English</option>
              <option value="HE">עברית (Hebrew)</option>
              <option value="AR">العربية (Arabic)</option>
            </Select>
          </Field>
        </SectionCard>

        <SectionCard title="Logo" hint="Optional — PNG/JPG/SVG, max 2 MB. We'll use a monogram of your name if you skip it.">
          <ImageDrop value={config.logoSrc} onChange={(v) => set('logoSrc', v)} label="Your logo" max={2} />
        </SectionCard>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="primary" onClick={onNext} className="px-7">Continue <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </FadeUp>
  );
}

// ── Step 3: Driving Setup (Part 2) ───────────────────────────────────────────

function SetupStep({ config, set, onBack, onNext }: { config: WizardConfig; set: <K extends keyof WizardConfig>(k: K, v: WizardConfig[K]) => void; onBack: () => void; onNext: () => void }) {
  const addBreak = () => set('breakTimes', [...config.breakTimes, { start: '12:00', end: '13:00' }]);
  const setBreak = (i: number, key: 'start' | 'end', v: string) => set('breakTimes', config.breakTimes.map((b, j) => (j === i ? { ...b, [key]: v } : b)));
  const toggleSocial = (p: SocialPlatform) => {
    const next = { ...config.socialLinks };
    if (p in next) delete next[p]; else next[p] = '';
    set('socialLinks', next);
  };
  return (
    <FadeUp className="mx-auto w-full max-w-2xl">
      <BackLink onClick={onBack} />
      <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Set up your lessons</h1>
      <p className="mt-2 text-sand-600">Your schedule, pricing and booking rules — this powers your booking system too.</p>

      <div className="mt-6 space-y-5">
        {/* A — Schedule */}
        <SectionCard title="Schedule & availability">
          <Field label="Working days">
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => {
                const on = config.workingDays.includes(d);
                return (
                  <button key={d} type="button" aria-pressed={on}
                    onClick={() => set('workingDays', on ? config.workingDays.filter((x) => x !== d) : [...config.workingDays, d])}
                    className={on ? 'rounded-lg border border-sand-900 bg-sand-900 px-4 py-1.5 text-sm font-semibold text-white' : 'rounded-lg border border-sand-200 bg-white px-4 py-1.5 text-sm font-medium text-sand-600 hover:border-sand-300 hover:bg-sand-50'}>
                    {titleCase(d).slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Shift start"><TimeInput value={config.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} /></Field>
            <Field label="Shift end"><TimeInput value={config.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} /></Field>
          </div>
          <Toggle label="Customise hours per day" checked={config.customHoursPerDay} onChange={(v) => set('customHoursPerDay', v)} />
          {config.customHoursPerDay && (
            <div className="space-y-2 rounded-xl border border-sand-200 p-3">
              {WEEKDAYS.map((d) => {
                const ph = config.perDayHours[d];
                return (
                  <div key={d} className="flex items-center gap-3">
                    <span className="w-10 text-sm font-medium text-sand-700">{titleCase(d).slice(0, 3)}</span>
                    <label className="flex items-center gap-1.5 text-xs text-sand-500">
                      <input type="checkbox" checked={!ph.closed} onChange={(e) => set('perDayHours', { ...config.perDayHours, [d]: { ...ph, closed: !e.target.checked } })} /> Open
                    </label>
                    {!ph.closed && (
                      <>
                        <TimeInput value={ph.open} onChange={(e) => set('perDayHours', { ...config.perDayHours, [d]: { ...ph, open: e.target.value } })} className="!py-1.5" />
                        <span className="text-sand-400">–</span>
                        <TimeInput value={ph.close} onChange={(e) => set('perDayHours', { ...config.perDayHours, [d]: { ...ph, close: e.target.value } })} className="!py-1.5" />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <Field label="Break times">
            <div className="space-y-2">
              {config.breakTimes.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TimeInput value={b.start} onChange={(e) => setBreak(i, 'start', e.target.value)} />
                  <span className="text-sand-400">–</span>
                  <TimeInput value={b.end} onChange={(e) => setBreak(i, 'end', e.target.value)} />
                  <button onClick={() => set('breakTimes', config.breakTimes.filter((_, j) => j !== i))} aria-label="Remove break" className="text-sand-400 hover:text-ember-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={addBreak} className="inline-flex items-center gap-1 text-sm font-medium text-sun-600 hover:underline"><Plus className="h-4 w-4" /> Add a break</button>
            </div>
          </Field>
          <Toggle label="Rest between lessons" checked={config.restEnabled} onChange={(v) => set('restEnabled', v)} />
          {config.restEnabled && (
            <Field label="Rest minutes (5–30)"><NumberInput min={5} max={30} step={5} value={config.restMinutes} onValueChange={(n) => set('restMinutes', n)} /></Field>
          )}
        </SectionCard>

        {/* B — Lessons & pricing */}
        <SectionCard title="Lessons & pricing">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Class duration">
              <Select value={config.classDuration} onChange={(e) => set('classDuration', Number(e.target.value))}>
                {[20, 30, 40, 45, 60, 75, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
              </Select>
            </Field>
            <Field label="Price per class (₪)"><NumberInput min={0} value={config.pricePerClass} onValueChange={(n) => set('pricePerClass', n)} /></Field>
          </div>
          <Field label="Transmission" hint="What you teach — your site copy and FAQ adapt to this.">
            <div className="flex gap-2">
              {TRANSMISSIONS.map((t) => {
                const on = config.transmission === t.value;
                return (
                  <button key={t.value} type="button" aria-pressed={on} onClick={() => set('transmission', t.value)}
                    className={cn('flex-1 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors', on ? 'border-sand-900 bg-sand-900 text-white' : 'border-sand-200 bg-white text-sand-600 hover:border-sand-300')}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Plans / packages" hint="Your single lesson is here — add more plans (e.g. a 10-lesson block) with the + button. You set the name, price and what's included.">
            <PlansEditor plans={config.plans} onChange={(v) => set('plans', v)} />
          </Field>
        </SectionCard>

        {/* C — Teacher profile */}
        <SectionCard title="Teacher profile">
          <Field label="Full name"><Input value={config.teacherName} onChange={(e) => set('teacherName', e.target.value)} placeholder="David Cohen" /></Field>
          <Field label="Experience">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {EXPERIENCE_LEVELS.map((lvl) => {
                const on = config.experienceLevel === lvl.value;
                return (
                  <button key={lvl.value} type="button" aria-pressed={on} onClick={() => set('experienceLevel', lvl.value)}
                    className={cn('rounded-xl border px-3 py-3 text-sm font-semibold transition-colors', on ? 'border-sand-900 bg-sand-900 text-white' : 'border-sand-200 bg-white text-sand-600 hover:border-sand-300')}>
                    {lvl.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <ImageDrop value={config.instructorPhoto} onChange={(v) => set('instructorPhoto', v)} label="Your photo" hint="A photo of you (shown on the site) — drag & drop, or" max={5} />
            <ImageDrop value={config.carPhoto} onChange={(v) => set('carPhoto', v)} label="Car photo" hint="A photo of your car — drag & drop, or" max={5} />
          </div>
        </SectionCard>

        {/* D — Booking rules */}
        <SectionCard title="Booking rules" hint="When students can book tomorrow's lessons, and when you finalise the schedule.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Booking window start"><TimeInput value={config.bookingWindowStart} onChange={(e) => set('bookingWindowStart', e.target.value)} /></Field>
            <Field label="Booking window end"><TimeInput value={config.bookingWindowEnd} onChange={(e) => set('bookingWindowEnd', e.target.value)} /></Field>
          </div>
          <Field label="Report time" hint="When you finalise tomorrow's schedule — must be at least 30 min after the booking window ends">
            <TimeInput value={config.reportTime} onChange={(e) => set('reportTime', e.target.value)} />
            {minutesAfter(config.bookingWindowEnd, config.reportTime) < 30 && (
              <p className="mt-1.5 text-xs font-medium text-ember-600">Report time should be at least 30 minutes after the booking window ends ({config.bookingWindowEnd}).</p>
            )}
          </Field>
        </SectionCard>

        {/* E — Extras */}
        <SectionCard title="Social media & gallery" hint="Optional — add the platforms you use and a few photos.">
          <div>
            <p className="label mb-1.5">Social media</p>
            <div className="flex flex-wrap gap-2">
              {SOCIAL_PLATFORMS.map((p) => {
                const on = p in config.socialLinks;
                return (
                  <button key={p} type="button" aria-pressed={on} onClick={() => toggleSocial(p)}
                    className={cn('rounded-full border px-3 py-1.5 text-sm font-medium transition-colors', on ? 'border-sun-500 bg-sun-50 text-sun-700' : 'border-sand-200 bg-white text-sand-600 hover:border-sand-300')}>
                    {p}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-2">
              {SOCIAL_PLATFORMS.filter((p) => p in config.socialLinks).map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-sm font-medium text-sand-600">{p}</span>
                  <Input value={config.socialLinks[p] || ''} onChange={(e) => set('socialLinks', { ...config.socialLinks, [p]: e.target.value })} placeholder={`https://…`} />
                </div>
              ))}
            </div>
          </div>
          <GalleryUpload value={config.gallery} onChange={(v) => set('gallery', v)} />
        </SectionCard>
      </div>

      <div className="mt-8 flex justify-end">
        <Button variant="primary" onClick={onNext} className="px-7">Choose a design <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </FadeUp>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-sand-700 select-none">
      {label}
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-sun-500' : 'bg-sand-300')}>
        <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked ? 'translate-x-[22px]' : 'translate-x-0.5')} />
      </button>
    </label>
  );
}

// ── Step 4: Browse templates (gallery) — pick one → Design step ──────────────

function BrowseStep({ config, onPick, onBack }: { config: WizardConfig; onPick: (id: string, accent?: string) => void; onBack: () => void }) {
  const selected = config.templateChoice;
  return (
    <FadeUp className="w-full">
      <BackLink onClick={onBack} />
      <div className="mx-auto max-w-2xl text-center">
        <p className="section-eyebrow">Choose your look</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-sand-900 sm:text-5xl">Pick a design to start from</h1>
        <p className="mt-4 text-lg text-sand-600">{TEMPLATES.length} genuinely different styles — your details are already inside each one. Click any to preview it live, then switch or customize anytime.</p>
      </div>

      <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" gap={0.04}>
        {TEMPLATES.map((t) => (
          <Stagger.Item key={t.slug}>
            <BrowseCard t={t} sel={selected === t.slug} onPick={onPick} initialAccent={(config.customization?.theme?.['--mm-accent'] as string) || t.accent} />
          </Stagger.Item>
        ))}
      </Stagger>
    </FadeUp>
  );
}

function BrowseCard({ t, sel, onPick, initialAccent }: { t: TemplateMeta; sel: boolean; onPick: (id: string, accent?: string) => void; initialAccent: string }) {
  const isMumotor = t.slug === 'mumotor';
  const [accent, setAccent] = useState(initialAccent);
  const pick = () => onPick(t.slug, isMumotor ? accent : undefined);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}
      aria-pressed={sel}
      className={cn(
        'group block w-full cursor-pointer overflow-hidden rounded-3xl border bg-white text-start shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-sand-900/30',
        sel ? 'border-sand-900 ring-2 ring-sand-900/15' : 'border-sand-200'
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden" style={{ background: t.bg }}>
        <TemplateConcept meta={t} accent={isMumotor ? accent : undefined} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        {!isMumotor && <span className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white shadow" style={{ background: t.accent }}>{t.style}</span>}
        <span className="absolute bottom-3 left-4 text-lg font-semibold tracking-tight text-white drop-shadow">{t.name}</span>
        {isMumotor && <MumotorAccentDots value={accent} onPick={setAccent} />}
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-sand-600">{t.blurb}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sun-600">
          Preview live <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </div>
  );
}

// ── Step 5: Design + live preview (pick = instant live) ──────────────────────

function DesignPreviewStep({ config, onPick, onBack, onCustomize, onPublish, publishing }: { config: WizardConfig; onPick: (id: string) => void; onBack: () => void; onCustomize: () => void; onPublish: () => void; publishing: boolean }) {
  const data = useMemo(() => wizardToTemplateData(config), [config]);
  const selected = config.templateChoice || TEMPLATES[0].slug;
  const meta = getTemplate(selected) ?? TEMPLATES[0];
  return (
    <FadeUp className="w-full">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onCustomize}><Sparkles className="h-4 w-4" /> Customize</Button>
          <Button variant="primary" onClick={onPublish} loading={publishing} className="px-7">Publish my site <ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-sand-900">Pick a design — it previews live</h1>
        <span className="hidden text-sm text-sand-500 sm:block"><span className="font-medium" style={{ color: meta.accent }}>{meta.name}</span> · {meta.style}</span>
      </div>

      {/* Live concept selector — clicking swaps the live preview instantly */}
      <div className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {TEMPLATES.map((t) => {
          const sel = selected === t.slug;
          return (
            <button key={t.slug} onClick={() => onPick(t.slug)} aria-pressed={sel} title={`${t.name} · ${t.style}`}
              className={cn('group relative w-[150px] shrink-0 overflow-hidden rounded-xl border bg-white text-start transition-all duration-200', sel ? 'border-sand-900 ring-2 ring-sand-900/15' : 'border-sand-200 hover:border-sand-300')}>
              <div className="relative aspect-[16/10] overflow-hidden" style={{ background: t.bg }}>
                <TemplateConcept meta={t} />
                {sel && <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-sand-900 text-white shadow"><Check className="h-3 w-3" strokeWidth={2.5} /></span>}
              </div>
              <span className="block truncate px-3 py-2 text-[13px] font-semibold tracking-tight text-sand-900">{t.name}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-sand-200 bg-white shadow-card">
        <div className="flex items-center gap-1.5 border-b border-sand-200 bg-sand-50 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-sand-300" /><span className="h-3 w-3 rounded-full bg-sand-300" /><span className="h-3 w-3 rounded-full bg-sand-300" />
          <span className="ms-3 truncate rounded-md bg-white px-3 py-0.5 text-xs text-sand-500 ring-1 ring-sand-200">{data.business.name} · live preview</span>
        </div>
        <div className="relative h-[78vh] overflow-y-auto overflow-x-hidden">
          <TemplateRender slug={selected} data={data} />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-sand-500">Click any design above to preview it live — every button works. Use <strong>Customize</strong> to change colours, text, icons and photos.</p>
    </FadeUp>
  );
}

// ── Account + Done ───────────────────────────────────────────────────────────

function AccountStep({ onAuthed, onBack, publishing }: { onAuthed: () => void; onBack: () => void; publishing: boolean }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'register') await register({ name: form.name, email: form.email, password: form.password });
      else await login(form.email, form.password);
      onAuthed();
    } catch (err) {
      toast.error(apiError(err).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <FadeUp className="mx-auto w-full max-w-md">
      <BackLink onClick={onBack} />
      <div className="card p-6 sm:p-8">
        <h1 className="text-3xl font-semibold tracking-tight text-sand-900">{mode === 'register' ? 'Create your account' : 'Sign in'}</h1>
        <p className="mt-2 text-sand-600">One account to publish and manage your site.</p>
        <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
          {mode === 'register' && <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoComplete="name" /></Field>}
          <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required autoComplete="email" /></Field>
          <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} className="pe-11" />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 end-0 flex items-center pe-3 text-sand-400 transition-colors hover:text-sand-700">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </Field>
          <Button type="submit" variant="primary" loading={busy || publishing} className="w-full">{mode === 'register' ? 'Create account & publish' : 'Sign in & publish'}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-sand-600">
          {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
          <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="font-medium text-sun-600 transition-colors hover:text-sun-700 hover:underline">{mode === 'register' ? 'Sign in' : 'Create one'}</button>
        </p>
      </div>
    </FadeUp>
  );
}

function DoneStep({ result, onDashboard }: { result: PublishResult; onDashboard: () => void }) {
  // In production each teacher gets their own subdomain ({slug}.mumotor.com, served
  // by wildcard DNS); elsewhere (dev) fall back to the working /p/:slug path.
  const onMumotor = window.location.hostname.endsWith('mumotor.com');
  const liveUrl = onMumotor ? `https://${result.slug}.mumotor.com` : `${window.location.origin}/p/${result.slug}`;
  return (
    <FadeUp className="mx-auto max-w-lg py-12 text-center">
      <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-sand-900"><Check className="h-8 w-8 text-white" strokeWidth={1.75} /></div>
      <h1 className="text-3xl font-semibold tracking-tight text-sand-900">Your site is live</h1>
      <p className="mt-3 text-sand-600">Your driving website is published and ready to take bookings.</p>
      <div className="mt-7 flex items-center justify-between gap-2 rounded-xl border border-sand-200 bg-sand-50 p-4">
        <code className="truncate text-sm font-medium text-sand-700">{liveUrl.replace(/^https?:\/\//, '')}</code>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary shrink-0 text-sm">Visit <ExternalLink className="h-4 w-4" /></a>
      </div>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Button variant="primary" onClick={onDashboard} className="px-7">Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary">View live site</a>
      </div>
    </FadeUp>
  );
}
