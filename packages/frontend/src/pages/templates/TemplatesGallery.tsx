import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TEMPLATES, type TemplateMeta } from '../../templates/registry';
import { TemplateConcept } from '../../templates/TemplateConcept';
import { FadeUp, Stagger } from '../../components/motion';

const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'][TEMPLATES.length] ?? `${TEMPLATES.length}`;

export default function TemplatesGallery() {
  return (
    <div className="min-h-dvh bg-white text-sand-900">
      {/* Sticky nav */}
      <header className="glass sticky top-0 z-40 border-b border-sand-200/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-sand-700 hover:text-sand-900">
            <ArrowLeft className="h-4 w-4" />
            Mumotor
          </Link>
          <span className="text-sm font-semibold tracking-tight">Templates</span>
          <Link to="/builder" className="btn btn-primary !py-2 text-sm">
            Start building
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-16 sm:pt-24">
        <FadeUp>
          <p className="section-eyebrow">Choose your look</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {COUNT_WORD} ways to show up online.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-sand-600">
            {COUNT_WORD} genuinely different designs for your driving-school site — each fully scrollable and
            interactive. Click any one to open it live and switch between them.
          </p>
        </FadeUp>
      </section>

      {/* Grid */}
      <Stagger className="mx-auto grid max-w-7xl gap-6 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t) => (
          <Stagger.Item key={t.slug}>
            <TemplateCard t={t} />
          </Stagger.Item>
        ))}
      </Stagger>
    </div>
  );
}

function TemplateCard({ t }: { t: TemplateMeta }) {
  return (
    <Link
      to={`/templates/${t.slug}`}
      className="group block overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      <TemplatePreviewThumb t={t} />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="pill border-sand-200 text-sand-600">{t.style}</span>
          <span className="ml-auto inline-flex gap-1">
            {t.swatch.map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
            ))}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{t.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-sand-600">{t.blurb}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sun-600">
          Preview live
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

/** Bespoke ANIMATED concept preview per template (expresses its real look). */
function TemplatePreviewThumb({ t }: { t: TemplateMeta }) {
  return (
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: t.bg }}>
      <TemplateConcept meta={t} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <span className="text-xl font-semibold tracking-tight text-white drop-shadow">{t.name}</span>
        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: t.accent }}>{t.style}</span>
      </div>
    </div>
  );
}
