import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Sparkles } from 'lucide-react';
import { aiApi, apiError, drivingSchoolApi, websiteApi, type PresetSummary, type PublishResult } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Logo, LogoMark } from '../../components/Logo';
import { Button, Field, Input, Select, Textarea } from '../../components/ui';
import { Reveal } from '../../components/motion';
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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <Link to="/"><Logo size="sm" /></Link>
          <div className="text-sm text-zinc-500">
            {user ? user.name : <Link to="/login" className="font-medium text-zinc-700 hover:underline">Sign in</Link>}
          </div>
        </div>
        <div className="h-1 w-full bg-zinc-100">
          <div className="h-full bg-zinc-900 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-10">
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
                    <button key={d} type="button" onClick={() => set('workingDays', on ? config.workingDays.filter((x) => x !== d) : [...config.workingDays, d])}
                      className={on ? 'rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white' : 'rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:border-zinc-400'}>
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
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" checked={config.hasBreak} onChange={(e) => set('hasBreak', e.target.checked)} className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500" />
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
    <Reveal className="mx-auto w-full max-w-xl">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-zinc-500">{subtitle}</p>
      <div className="mt-7 space-y-4">{children}</div>
      <div className="mt-8 flex justify-end"><Button onClick={onNext} className="px-6">Continue <ArrowRight className="h-4 w-4" /></Button></div>
    </Reveal>
  );
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <Reveal className="mx-auto max-w-xl py-10 text-center">
      <div className="mb-6 flex justify-center"><LogoMark size="lg" /></div>
      <span className="section-eyebrow">DriveSawa builder</span>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Let's build your driving website</h1>
      <p className="mx-auto mt-4 max-w-md text-lg text-zinc-600">Answer a few quick questions, pick a design, and we'll generate a complete, bookable website for you — in minutes.</p>
      <Button onClick={onStart} className="mt-8 px-7 py-3 text-base">Start building <ArrowRight className="h-4 w-4" /></Button>
      <p className="mt-4 text-sm text-zinc-400">No design skills needed · Free to start</p>
    </Reveal>
  );
}

function DesignStep({ config, onPick, onBack, onNext }: { config: WizardConfig; onPick: (id: string) => void; onBack: () => void; onNext: () => void }) {
  const { data: presets, isLoading } = useQuery({ queryKey: ['presets'], queryFn: aiApi.quickTemplates });
  return (
    <Reveal className="w-full">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"><ArrowLeft className="h-4 w-4" /> Back</button>
      <h1 className="text-3xl font-bold tracking-tight">Choose a design</h1>
      <p className="mt-2 text-zinc-500">Pick a template — you can fine-tune colors and content later.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-44 rounded-xl" />)}
        {presets?.map((p: PresetSummary) => {
          const sel = config.presetId === p.id;
          return (
            <button key={p.id} onClick={() => onPick(p.id)}
              className={sel ? 'group rounded-xl border-2 border-zinc-900 bg-white p-4 text-left shadow-elevated' : 'group rounded-xl border border-zinc-200 bg-white p-4 text-left transition hover:border-zinc-400 hover:shadow-card'}>
              <div className="mb-3 flex h-20 overflow-hidden rounded-lg">
                <div className="flex-1" style={{ background: p.colors.primary }} />
                <div className="w-1/4" style={{ background: p.colors.accent }} />
                <div className="w-1/4" style={{ background: p.colors.surface }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-900">{p.label}</span>
                {sel && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white"><Check className="h-3 w-3" /></span>}
              </div>
              <p className="mt-1 text-xs text-zinc-500">{p.description}</p>
              <p className="mt-2 text-[11px] uppercase tracking-wide text-zinc-400">{p.fonts.heading}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex justify-end"><Button onClick={onNext} className="px-6"><Sparkles className="h-4 w-4" /> Generate my site</Button></div>
    </Reveal>
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
    <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <div className="animate-pulse"><LogoMark size="lg" /></div>
      <h2 className="mt-6 text-2xl font-bold tracking-tight">Building your website</h2>
      <p className="mt-2 h-6 text-zinc-500 transition-all">{phases[phase]}</p>
      <div className="mt-6 h-1.5 w-64 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full w-1/3 animate-[shimmer_1.2s_infinite] rounded-full bg-zinc-900" style={{ animation: 'none' }} />
      </div>
    </div>
  );
}

function PreviewStep({ html, onBack, onPublish, publishing }: { html: string; onBack: () => void; onPublish: () => void; publishing: boolean }) {
  return (
    <Reveal className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"><ArrowLeft className="h-4 w-4" /> Change design</button>
        <Button onClick={onPublish} loading={publishing} className="px-6">Publish my site <ArrowRight className="h-4 w-4" /></Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-elevated">
        <div className="flex items-center gap-1.5 border-b border-zinc-200 bg-zinc-50 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" /><span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="ml-3 text-xs text-zinc-400">Preview</span>
        </div>
        <iframe title="Site preview" srcDoc={html} className="h-[70vh] w-full" sandbox="allow-scripts allow-same-origin allow-popups" />
      </div>
    </Reveal>
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
    <Reveal className="mx-auto w-full max-w-md">
      <button onClick={onBack} className="mb-5 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-800"><ArrowLeft className="h-4 w-4" /> Back to preview</button>
      <h1 className="text-3xl font-bold tracking-tight">{mode === 'register' ? 'Create your account' : 'Sign in'}</h1>
      <p className="mt-2 text-zinc-500">One account to publish and manage your site.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        {mode === 'register' && <Field label="Full name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>}
        <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Password" hint={mode === 'register' ? 'At least 8 characters' : undefined}><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        <Button type="submit" loading={busy || publishing} className="w-full">{mode === 'register' ? 'Create account & publish' : 'Sign in & publish'}</Button>
      </form>
      <p className="mt-5 text-center text-sm text-zinc-500">
        {mode === 'register' ? 'Already have an account?' : 'New here?'}{' '}
        <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="font-semibold text-brand-700 hover:underline">{mode === 'register' ? 'Sign in' : 'Create one'}</button>
      </p>
    </Reveal>
  );
}

function DoneStep({ result, onDashboard }: { result: PublishResult; onDashboard: () => void }) {
  const liveUrl = `${window.location.origin}${result.path}`;
  return (
    <Reveal className="mx-auto max-w-lg py-10 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><Check className="h-8 w-8" strokeWidth={2.5} /></div>
      <h1 className="text-3xl font-bold tracking-tight">Your site is live</h1>
      <p className="mt-3 text-zinc-600">Congratulations — your driving website is published and ready to take bookings.</p>
      <div className="mt-6 flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
        <code className="truncate text-sm text-zinc-700">{result.subdomain}</code>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary shrink-0 text-sm">Visit <ExternalLink className="h-4 w-4" /></a>
      </div>
      <div className="mt-7 flex justify-center gap-3">
        <Button onClick={onDashboard}>Go to dashboard <ArrowRight className="h-4 w-4" /></Button>
        <a href={liveUrl} target="_blank" rel="noreferrer" className="btn-secondary">View live site</a>
      </div>
    </Reveal>
  );
}
