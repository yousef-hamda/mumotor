import { useEffect } from 'react';

interface SeoOptions {
  title?: string;
  description?: string;
  /**
   * Absolute URL of the sharing preview image (og:image / twitter:image).
   *
   * Without this, index.html's hardcoded Mumotor stock photo stays on the page, so a
   * teacher's site previewed as a Mumotor advert even in crawlers that DO run JavaScript
   * (A-03). Server-side rendering handles the crawlers that don't — this covers the rest
   * and keeps the tab/share state correct during in-app navigation.
   */
  image?: string;
  /** Canonical/sharing URL. Defaults to the current origin + path. */
  url?: string;
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
export function useSeo({ title, description, image, url, jsonLd }: SeoOptions) {
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

    // Sharing image + URL. index.html ships Mumotor's own og:image/og:url, so a page that
    // represents someone else MUST overwrite them or every share is branded as Mumotor.
    const resolvedUrl = url ?? `${window.location.origin}${window.location.pathname}`;
    for (const [selector, attr, name, content] of [
      ['meta[property="og:image"]', 'property', 'og:image', image],
      ['meta[name="twitter:image"]', 'name', 'twitter:image', image],
      ['meta[property="og:url"]', 'property', 'og:url', resolvedUrl],
      ['meta[name="twitter:title"]', 'name', 'twitter:title', title],
      ['meta[name="twitter:description"]', 'name', 'twitter:description', description],
    ] as const) {
      if (!content) continue;
      undos.push(
        upsertMeta(
          selector,
          () => {
            const m = document.createElement('meta');
            m.setAttribute(attr, name);
            return m;
          },
          content
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
    canonical.href = resolvedUrl;
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
  }, [title, description, image, url, jsonLdText]);
}
