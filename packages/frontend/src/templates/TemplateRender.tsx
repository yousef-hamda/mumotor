import { Suspense } from 'react';
import { getTemplate, TEMPLATES } from './registry';
import { stylesToCss } from './customize/overrides';
import type { TemplateData } from './types';

/**
 * Renders a template by slug, populated with the given site data.
 * Used both for the builder live preview and the published public site.
 */
export function TemplateRender({ slug, data }: { slug: string | undefined; data: TemplateData }) {
  const meta = getTemplate(slug) ?? TEMPLATES[0];
  const Component = meta.Component;
  const css = stylesToCss(data.styles);
  return (
    <Suspense fallback={<RenderFallback />}>
      {css && <style dangerouslySetInnerHTML={{ __html: css }} />}
      <Component data={data} />
    </Suspense>
  );
}

function RenderFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-white">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black/70" />
    </div>
  );
}
