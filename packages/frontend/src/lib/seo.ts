import { useEffect } from 'react';

interface SeoOptions {
  title?: string;
  description?: string;
  /** schema.org structured data injected as an application/ld+json script. */
  jsonLd?: Record<string, unknown>;
}

function upsertMeta(selector: string, create: () => HTMLMetaElement, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  const prev = el.getAttribute('content');
  el.setAttribute('content', content);
  return () => {
    if (prev !== null) el!.setAttribute('content', prev);
  };
}

/**
 * Per-page SEO for the SPA: document title, meta description, og tags,
 * canonical URL and optional JSON-LD. Google renders JS, so this is what
 * search engines see for each route. Restores the previous values on unmount.
 */
export function useSeo({ title, description, jsonLd }: SeoOptions) {
  const jsonLdText = jsonLd ? JSON.stringify(jsonLd) : undefined;

  useEffect(() => {
    const undos: Array<() => void> = [];

    if (title) {
      const prevTitle = document.title;
      document.title = title;
      undos.push(() => {
        document.title = prevTitle;
      });
      undos.push(
        upsertMeta(
          'meta[property="og:title"]',
          () => {
            const m = document.createElement('meta');
            m.setAttribute('property', 'og:title');
            return m;
          },
          title
        )
      );
    }

    if (description) {
      undos.push(
        upsertMeta(
          'meta[name="description"]',
          () => {
            const m = document.createElement('meta');
            m.setAttribute('name', 'description');
            return m;
          },
          description
        ),
        upsertMeta(
          'meta[property="og:description"]',
          () => {
            const m = document.createElement('meta');
            m.setAttribute('property', 'og:description');
            return m;
          },
          description
        )
      );
    }

    // Self-referencing canonical for the current route (query strings stripped).
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.getAttribute('href');
    canonical.href = window.location.origin + window.location.pathname;
    undos.push(() => {
      if (created) canonical!.remove();
      else if (prevHref !== null) canonical!.setAttribute('href', prevHref);
    });

    let script: HTMLScriptElement | undefined;
    if (jsonLdText) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = jsonLdText;
      document.head.appendChild(script);
      undos.push(() => script!.remove());
    }

    return () => {
      undos.forEach((u) => u());
    };
  }, [title, description, jsonLdText]);
}
