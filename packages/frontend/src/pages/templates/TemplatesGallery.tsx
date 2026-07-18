import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { TEMPLATES, type TemplateMeta } from '../../templates/registry';
import { TemplateConcept, MumotorAccentDots } from '../../templates/TemplateConcept';
import { FadeUp, Stagger } from '../../components/motion';
import { useSeo } from '../../lib/seo';

const COUNT_WORD = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen'][TEMPLATES.length] ?? `${TEMPLATES.length}`;

export default function TemplatesGallery() {
  const { t } = useTranslation();
  useSeo({
    title: 'Website templates for driving instructors — Mumotor',
    description: `${COUNT_WORD} professionally designed website templates for driving schools and instructors. Pick one, customize it live, and publish in minutes.`,
  });
  return (
    <div className="min-h-dvh bg-white text-sand-900">
      {/* Sticky nav */}
      <header className="glass sticky top-0 z-40 border-b border-sand-200/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-sand-700 hover:text-sand-900">
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            Mumotor
          </Link>
          <span className="hidden text-sm font-semibold tracking-tight sm:block">{t('templates.gallery.templates')}</span>
          <Link to="/builder" className="btn btn-primary !py-2 text-sm">
            {t('templates.gallery.startBuilding')}
          </Link>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-16 sm:pt-24">
        <FadeUp>
          <p className="section-eyebrow">{t('templates.gallery.eyebrow')}</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-6xl">
            {t('templates.gallery.title', { count: TEMPLATES.length })}
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-sand-600">
            {t('templates.gallery.lead', { count: TEMPLATES.length })}
          </p>
        </FadeUp>
      </section>

      {/* Grid */}
      <Stagger className="mx-auto grid max-w-7xl gap-6 px-5 pb-24 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <Stagger.Item key={tpl.slug}>
            <TemplateCard tpl={tpl} />
          </Stagger.Item>
        ))}
      </Stagger>
    </div>
  );
}

function TemplateCard({ tpl }: { tpl: TemplateMeta }) {
  const { t } = useTranslation();
  const isMumotor = tpl.slug === 'mumotor';
  const [accent, setAccent] = useState(tpl.accent);
  const to = isMumotor && accent.toLowerCase() !== tpl.accent.toLowerCase()
    ? `/templates/${tpl.slug}?accent=${encodeURIComponent(accent)}`
    : `/templates/${tpl.slug}`;
  return (
    <Link
      to={to}
      className="group block overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated"
    >
      <TemplatePreviewThumb tpl={tpl} accent={accent} onPickAccent={isMumotor ? setAccent : undefined} />
      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className="pill border-sand-200 text-sand-600">{t(`templates.designs.${tpl.slug}.style`, tpl.style)}</span>
          <span className="ml-auto inline-flex gap-1">
            {tpl.swatch.map((c) => (
              <span key={c} className="h-3.5 w-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
            ))}
          </span>
        </div>
        <h3 className="mt-3 text-xl font-semibold tracking-tight">{tpl.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-sand-600">{t(`templates.designs.${tpl.slug}.blurb`, tpl.blurb)}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-sun-600">
          {t('templates.gallery.previewLive')}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" />
        </span>
      </div>
    </Link>
  );
}

/** Bespoke ANIMATED concept preview per template (expresses its real look). */
function TemplatePreviewThumb({ tpl, accent, onPickAccent }: { tpl: TemplateMeta; accent: string; onPickAccent?: (hex: string) => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative aspect-[16/10] overflow-hidden" style={{ background: tpl.bg }}>
      <TemplateConcept meta={tpl} accent={accent} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
        <span className="text-xl font-semibold tracking-tight text-white drop-shadow">{tpl.name}</span>
        {!onPickAccent && <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white" style={{ background: tpl.accent }}>{t(`templates.designs.${tpl.slug}.style`, tpl.style)}</span>}
      </div>
      {onPickAccent && <MumotorAccentDots value={accent} onPick={onPickAccent} />}
    </div>
  );
}
