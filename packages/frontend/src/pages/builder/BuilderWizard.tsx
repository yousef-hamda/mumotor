import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Sparkles, Sun } from 'lucide-react';
import { aiApi, apiError, drivingSchoolApi, websiteApi, type PresetSummary, type PublishResult } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Logo, LogoMark } from '../../components/Logo';
import { Button, Field, Input, Select, Textarea } from '../../components/ui';
import { FadeUp, Stagger, Tilt, Magnetic } from '../../components/motion';
import {
  WEEKDAYS,
  buildBusinessHours,
  clearWizard,
  defaultWizardConfig,
  loadWizard,
  saveWizard,
  toBusinessConfig,
  type WizardConfig,
} from '../../lib/wizard';
import { titleCase } from '../../lib/utils';

type Step = 'welcome' | 'about' | 'lessons' | 'contact' | 'design' | 'generating' | 'preview' | 'account' | 'done';
const MAIN: Step[] = ['about', 'lessons', 'contact', 'design', 'preview'];

export default function BuilderWizard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('welcome');
  const [config, setConfig] = useState<WizardConfig>(loadWizard());
  const [html, setHtml] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState<PublishResult | null>(null);

  useEffect(() => saveWizard(config), [config]);
  const set = <K extends keyof WizardConfig>(k: K, v: WizardConfig[K]) => setConfig((c) => ({ ...c, [k]: v }));

  const progress = Math.max(0, MAIN.indexOf(step === 'generating' ? 'design' : step === 'account' ? 'preview' : step));
  const pct = step === 'welcome' ? 0 : step === 'done' ? 100 : ((progress + 1) / MAIN.length) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-sand-200/60 bg-sand-50/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="text-sm text-sand-500">
            {user ? (
              <span className="font-medium text-sand-700">{user.name}</span>
            ) : (
              <Link to="/login" className="font-semibold text-sand-700 transition-colors hover:text-sand-950 hover:underline">
                Sign in
              </Link>
            )}
          </div>
        </div>
        {/* Warm progress bar */}
        <div className="h-0.5 w-full bg-sand-200/60">
          <div
            className="h-full bg-sunrise transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-12">
        {step === 'welcome' && <Welcome onStart={() => setStep('about')} />}
        {step === 'about' && (
          <StepShell title="Tell us about you" subtitle="This becomes your site's headline and about section." onBack={() => setStep('welcome')} onNext={() => (config.businessName.trim() ? setStep('lessons') : toast.error('Please enter your business name'))}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Business / school name"><Input value={config.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="David's Driving School" /></Field>
              <Field label="Your name (instructor)"><Input value={config.teacherName} onChange={(e) => set('teacherName', e.target.value)} placeholder="David Cohen" /></Field>
            </div>
            <Field label="Tagline"><Input value={config.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Your road to confidence" /></Field>
            <Field label="Short bio (optional)"><Textarea rows={3} value={config.bio} onChange={(e) => set('bio', e.target.value)} placeholder="A few sentences about your teaching style and experience." /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Years of experience"><Input value={config.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} placeholder="10+" /></Field>
              <Field label="First-attempt pass rate (%)"><Input type="number" min={0} max={100} value={config.passRate} onChange={(e) => set('passRate', Number(e.target.value))} /></Field>
            </div>
          </StepShell>
        )}
        {step === 'lessons' && (
          <StepShell title="Lessons & availability" subtitle="Set your pricing, lesson length, and working hours." onBack={() => setStep('about')} onNext={() => setStep('contact')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price per lesson (₪)"><Input type="number" min={0} value={config.pricePerClass} onChange={(e) => set('pricePerClass', Number(e.target.value))} /></Field>
              <Field label="Lesson duration (min)">
                <Select value={config.classDuration} onChange={(e) => set('classDuration', Number(e.target.value))}>
                  {[30, 45, 60, 90, 120].map((d) => <option key={d} value={d}>{d} min</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Working days">
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => {
                  const on = config.workingDays.includes(d);
                  return (
                    <button key={d} type="button"
                      onClick={() => set('workingDays', on ? config.workingDays.filter((x) => x !== d) : [...config.workingDays, d])}
                      className={
                        on
                          ? 'rounded-full border border-sand-900 bg-sand-950 px-4 py-1.5 text-sm font-semibold text-white shadow-[0_4px_12px_-4px_rgba(34,28,21,0.45)] transition-all duration-200 hover:-translate-y-0.5'
                          : 'rounded-full border border-sand-200 bg-white px-4 py-1.5 text-sm font-medium text-sand-500 transition-all duration-200 hover:border-sand-300 hover:bg-sand-50 hover:text-sand-800 hover:-translate-y-0.5'
                      }
                    >
                      {titleCase(d).slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Shift start"><Input type="time" value={config.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} /></Field>
              <Field label="Shift end"><Input type="time" value={config.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} /></Field>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-sand-700 select-none">
              <input
                type="checkbox"
                checked={config.hasBreak}
                onChange={(e) => set('hasBreak', e.target.checked)}
                className="h-4 w-4 rounded border-sand-300 text-sun-500 focus:ring-sun-400"
              />
              Add a daily break
            </label>
            {config.hasBreak && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Break start"><Input type="time" value={config.breakStart} onChange={(e) => set('breakStart', e.target.value)} /></Field>
                <Field label="Break end"><Input type="time" value={config.breakEnd} onChange={(e) => set('breakEnd', e.target.value)} /></Field>
              </div>
            )}
          </StepShell>
        )}
        {step === 'contact' && (
          <StepShell title="Contact & language" subtitle="How students reach you, and your site's language." onBack={() => setStep('lessons')} onNext={() => setStep('design')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={config.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+972 50 123 4567" /></Field>
              <Field label="Email"><Input type="email" value={config.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" /></Field>
            </div>
            <Field label="Area / city"><Input value={config.address} onChange={(e) => set('address', e.target.value)} placeholder="Netanya, Israel" /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instagram (optional)"><Input value={config.instagram} onChange={(e) => set('instagram', e.target.value)} placeholder="https://instagram.com/…" /></Field>
              <Field label="Facebook (optional)"><Input value={config.facebook} onChange={(e) => set('facebook', e.target.value)} placeholder="https://facebook.com/…" /></Field>
            </div>
            <Field label="Site language">
              <Select value={config.locale} onChange={(e) => set('locale', e.target.value as WizardConfig['locale'])}>
                <option value="EN">English</option>
                <option value="HE">עברית (Hebrew)</option>
                <option value="AR">العربية (Arabic)</option>
              </Select>
            </Field>
          </StepShell>
        )}
        {step === 'design' && <DesignStep config={config} onPick={(id) => set('presetId', id)} onBack={() => setStep('contact')} onNext={() => setStep('generating')} />}
        {step === 'generating' && <GeneratingStep config={config} onDone={(h) => { setHtml(h); setStep('preview'); }} onError={() => setStep('design')} />}
        {step === 'preview' && (
          <PreviewStep
            html={html}
            onBack={() => setStep('design')}
            onPublish={() => (user ? doPublish() : setStep('account'))}
            publishing={publishing}
          />
        )}
        {step === 'account' && <AccountStep onAuthed={doPublish} onBack={() => setStep('preview')} publishing={publishing} />}
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
        selectedPreset: config.presetId,
        locale: config.locale,
        configuration: toBusinessConfig(config),
      });
      // sync booking-engine settings (hours, duration, breaks)
      await drivingSchoolApi.updateSettings(website.id, {
        classDuration: config.classDuration,
        advanceBookingDays: 14,
        bookingCutoffHour: 18,
        dailyCodeEnabled: true,
        breakTimes: config.hasBreak ? [{ start: config.breakStart, end: config.breakEnd }] : [],
        workingHours: buildBusinessHours(config),
        teacherName: config.teacherName || config.businessName,
        pricePerClass: config.pricePerClass,
        passRate: config.passRate,
      } as never);
      const res = await websiteApi.publish(website.id);
      clearWizard();
      setResult(res);
      setStep('done');
    } catch (e) {
      toast.error(apiError(e).message);
      setStep('preview');
    } finally {
      setPublishing(false);
    }
  }
}

function StepShell({ title, subtitle, children, onBack, onNext }: { title: string; subtitle: string; children: React.ReactNode; onBack: () => void; onNext: () => void }) {
  return (
    <FadeUp className="mx-auto w-full max-w-xl">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-semibold tracking-tightest text-sand-950">{title}</h1>
      <p className="mt-2 text-sand-500">{subtitle}</p>
      <div className="mt-8 space-y-4">{children}</div>
      <div className="mt-9 flex justify-end">
        <Magnetic>
          <Button variant="sun" onClick={onNext} className="px-7 shine">
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </Magnetic>
      </div>
    </FadeUp>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <FadeUp className="mx-auto max-w-xl py-12 text-center">
      {/* Ambient glow behind logo */}
      <div className="relative mb-8 flex justify-center">
        <div className="pointer-events-none absolute inset-0 -z-10 mx-auto h-32 w-32 rounded-full sun-glow blur-2xl opacity-70" />
        <LogoMark size="lg" />
      </div>
      <span className="section-eyebrow justify-center">Mumotor builder</span>
      <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tightest text-sand-950 sm:text-5xl">
        Let's build your <span className="text-clay-accent">driving website</span>
      </h1>
      <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-sand-600">
        Answer a few quick questions, pick a design, and we'll generate a complete, bookable website for you — in minutes.
      </p>
      <div className="mt-10 flex flex-col items-center gap-3">
        <Magnetic>
          <Button variant="sun" onClick={onStart} className="px-8 py-3.5 text-base shine">
            Start building <ArrowRight className="h-4 w-4" />
          </Button>
        </Magnetic>
        <p className="text-sm text-sand-400">No design skills needed · Free to start</p>
      </div>

      {/* Three-step mini preview */}
      <Stagger className="mt-12 grid grid-cols-3 gap-3 text-center" gap={0.07}>
        {[
          { n: '01', label: 'Describe yourself' },
          { n: '02', label: 'Pick a design' },
          { n: '03', label: 'Publish & go live' },
        ].map((s) => (
          <Stagger.Item key={s.n}>
            <div className="rounded-2xl border border-sand-200/80 bg-white p-4 shadow-card">
              <span className="font-display text-2xl font-semibold tracking-tightest text-sand-300">{s.n}</span>
              <p className="mt-1 text-xs font-medium text-sand-600">{s.label}</p>
            </div>
          </Stagger.Item>
        ))}
      </Stagger>
    </FadeUp>
  );
}

function DesignStep({ config, onPick, onBack, onNext }: { config: WizardConfig; onPick: (id: string) => void; onBack: () => void; onNext: () => void }) {
  const { data: presets, isLoading } = useQuery({ queryKey: ['presets'], queryFn: aiApi.quickTemplates });
  return (
    <FadeUp className="w-full">
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="font-display text-3xl font-semibold tracking-tightest text-sand-950">Choose a design</h1>
      <p className="mt-2 text-sand-500">Pick a template — you can fine-tune colors and content later.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-48 rounded-3xl" />
        ))}
        {presets?.map((p: PresetSummary) => {
          const sel = config.presetId === p.id;
          return (
            <Tilt key={p.id} max={6} glare>
              <button
                onClick={() => onPick(p.id)}
                className={
                  sel
                    ? 'group w-full overflow-hidden rounded-3xl border-2 border-transparent bg-white p-4 text-start shadow-elevated ring-sunrise transition-all duration-300'
                    : 'group w-full overflow-hidden rounded-3xl border border-sand-200 bg-white p-4 text-start shadow-card transition-all duration-300 hover:border-sand-300 hover:shadow-elevated hover:-translate-y-1'
                }
              >
                {/* Color swatch */}
                <div className="mb-3 flex h-20 overflow-hidden rounded-2xl">
                  <div className="flex-1 transition-transform duration-300 group-hover:scale-105" style={{ background: p.colors.primary }} />
                  <div className="w-1/4 transition-transform duration-300 group-hover:scale-105" style={{ background: p.colors.accent }} />
                  <div className="w-1/4 transition-transform duration-300 group-hover:scale-105" style={{ background: p.colors.surface }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold tracking-tight text-sand-900">{p.label}</span>
                  {sel && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sand-950 text-white shadow-[0_2px_8px_-2px_rgba(34,28,21,0.5)]">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-sand-500">{p.description}</p>
                <p className="mt-2 text-[11px] uppercase tracking-widest text-sand-400">{p.fonts?.heading}</p>
              </button>
            </Tilt>
          );
        })}
      </div>

      <div className="mt-9 flex justify-end">
        <Magnetic>
          <Button variant="sun" onClick={onNext} className="px-7 shine">
            <Sparkles className="h-4 w-4" /> Generate my site
          </Button>
        </Magnetic>
      </div>
    </FadeUp>
  );
}

function GeneratingStep({ config, onDone, onError }: { config: WizardConfig; onDone: (html: string) => void; onError: () => void }) {
  const [phase, setPhase] = useState(0);
  const phases = ['Designing your layout…', 'Adding your details…', 'Placing photography…', 'Polishing the finish…'];
  useEffect(() => {
    const t = setInterval(() => setPhase((p) => (p + 1) % phases.length), 900);
    let cancelled = false;
    (async () => {
      try {
        const res = await aiApi.generateWebsite({ name: config.businessName, presetId: config.presetId, businessConfig: toBusinessConfig(config) });
        // small delay so the animation is felt
        setTimeout(() => { if (!cancelled) onDone(res.html); }, 1400);
      } catch (e) {
        toast.error(apiError(e).message);
        if (!cancelled) onError();
      }
    })();
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
      {/* Pulsing glow behind logo */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="pointer-events-none absolute h-40 w-40 rounded-full sun-glow animate-sun-pulse blur-2xl" />
        <div className="relative animate-pulse">
          <LogoMark size="lg" />
        </div>
      </div>
      <h2 className="font-display text-2xl font-semibold tracking-tight text-sand-950">Building your website</h2>
      <p className="mt-2 h-6 text-sand-500 transition-all duration-300">{phases[phase]}</p>
      {/* Warm shimmer progress bar */}
      <div className="relative mt-7 h-1.5 w-64 overflow-hidden rounded-full bg-sand-200">
        <div className="absolute inset-y-0 start-0 w-1/2 animate-[shimmer_1.6s_ease-in-out_infinite] rounded-full bg-sunrise" />
      </div>
      <p className="mt-5 text-xs text-sand-400">This usually takes 10–20 seconds</p>
    </div>
  );
}

function PreviewStep({ html, onBack, onPublish, publishing }: { html: string; onBack: () => void; onPublish: () => void; publishing: boolean }) {
  return (
    <FadeUp className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800"
        >
          <ArrowLeft className="h-4 w-4" /> Change design
        </button>
        <Magnetic>
          <Button variant="sun" onClick={onPublish} loading={publishing} className="px-7 shine">
            Publish my site <ArrowRight className="h-4 w-4" />
          </Button>
        </Magnetic>
      </div>
      {/* Browser chrome mockup */}
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-elevated">
        <div className="flex items-center gap-1.5 border-b border-sand-100 bg-sand-50/80 px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-ember-400" />
          <span className="h-3 w-3 rounded-full bg-sun-300" />
          <span className="h-3 w-3 rounded-full bg-sand-300" />
          <span className="ms-3 truncate rounded-full bg-white px-3 py-0.5 text-xs text-sand-400 ring-1 ring-sand-200">Preview</span>
        </div>
        <iframe title="Site preview" srcDoc={html} className="h-[70vh] w-full" sandbox="allow-scripts allow-same-origin allow-popups" />
      </div>
    </FadeUp>
  );
}

function AccountStep({ onAuthed, onBack, publishing }: { onAuthed: () => void; onBack: () => void; publishing: boolean }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 transition-colors hover:text-sand-800"
      >
        <ArrowLeft className="h-4 w-4" /> Back to preview
      </button>
      <h1 className="font-display text-3xl font-semibold tracking-tightest text-sand-950">
        {mode === 'register' ? 'Create your account' : 'Sign in'}
      </h1>
      <p className="mt-2 text-sand-500">One account to publish and manage your site.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        {mode === 'register' && (
          <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        )}
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}>
          <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </Field>
        <Magnetic className="w-full">
          <Button type="submit" variant="sun" loading={busy || publishing} className="w-full shine">
            {mode === 'register' ? 'Create account & publish' : 'Sign in & publish'}
          </Button>
        </Magnetic>
      </form>
      <p className="mt-6 text-center text-sm text-sand-500">
        {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
        <button
          onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
          className="font-semibold text-sun-700 transition-colors hover:text-sun-600 hover:underline"
        >
          {mode === 'register' ? 'Sign in' : 'Create one'}
        </button>
      </p>
    </FadeUp>
  );
}

function DoneStep({ result, onDashboard }: { result: PublishResult; onDashboard: () => void }) {
  const liveUrl = `${window.location.origin}${result.path}`;
  return (
    <FadeUp className="mx-auto max-w-lg py-12 text-center">
      {/* Success icon */}
      <div className="relative mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-sand-200 bg-white shadow-elevated">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-sun-50 opacity-60" />
        <Check className="relative h-9 w-9 text-sun-500" strokeWidth={2} />
      </div>
      <h1 className="font-display text-3xl font-semibold tracking-tightest text-sand-950">Your site is live</h1>
      <p className="mt-3 text-sand-600">
        Congratulations — your driving website is published and ready to take bookings.
      </p>
      {/* URL display */}
      <div className="mt-7 flex items-center justify-between gap-2 rounded-2xl border border-sand-200 bg-sand-50 p-4 shadow-card">
        <code className="truncate text-sm font-medium text-sand-700">{result.subdomain}</code>
        <a
          href={liveUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary shrink-0 text-sm"
        >
          Visit <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Magnetic>
          <Button variant="sun" onClick={onDashboard} className="px-7 shine">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Button>
        </Magnetic>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary">
          View live site
        </a>
      </div>
    </FadeUp>
  );
}
