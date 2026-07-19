import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import DefaultSkin from './skins/_default';
import type { AccountSkinProps } from './types';

type Skin = ComponentType<AccountSkinProps> | LazyExoticComponent<ComponentType<AccountSkinProps>>;

/**
 * Bespoke per-template student dashboards. Keyed by the same slugs as
 * `templates/registry.tsx`. Each is code-split (lazy) so only the active
 * template's skin + CSS load. Unknown slugs fall back to the portable
 * `DefaultSkin` (which themes any template from --book-*).
 */
export const ACCOUNT_SKINS: Record<string, Skin> = {
  mumotor: lazy(() => import('./skins/mumotor')),
  meridian: lazy(() => import('./skins/meridian')),
  bezel: lazy(() => import('./skins/bezel')),
  solari: lazy(() => import('./skins/solari')),
  cadence: lazy(() => import('./skins/cadence')),
  circuit: lazy(() => import('./skins/circuit')),
  press: lazy(() => import('./skins/press')),
  reel: lazy(() => import('./skins/reel')),
  slate: lazy(() => import('./skins/slate')),
  primary: lazy(() => import('./skins/primary')),
  gallery: lazy(() => import('./skins/gallery')),
  gilt: lazy(() => import('./skins/gilt')),
  sumi: lazy(() => import('./skins/sumi')),
  atelier: lazy(() => import('./skins/atelier')),
  nocturne: lazy(() => import('./skins/nocturne')),
  deco: lazy(() => import('./skins/deco')),
  'grid-ink': lazy(() => import('./skins/grid-ink')),
  'open-road': lazy(() => import('./skins/open-road')),
};

export function getAccountSkin(slug: string): Skin {
  return ACCOUNT_SKINS[slug] ?? DefaultSkin;
}
