import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { TemplateData } from './types';

export interface TemplateProps {
  data?: TemplateData;
}

export interface TemplateMeta {
  slug: string;
  name: string;
  /** Short style label, e.g. "Swiss editorial". */
  style: string;
  blurb: string;
  /** 3–4 swatch colors for the gallery card. */
  swatch: string[];
  accent: string;
  bg: string;
  ink: string;
  theme: 'light' | 'dark';
  /** Display name of the headline typeface (for the card type-preview). */
  font: string;
  /** Concept-relevant photo for the gallery/design thumbnail. */
  thumb?: string;
  Component: LazyExoticComponent<ComponentType<TemplateProps>>;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    slug: 'mumotor',
    name: 'Mumotor',
    style: 'Mumotor signature',
    blurb: 'The Mumotor look — clean white, one calm accent and soft aurora. Tap the colour dots to recolour the whole site.',
    swatch: ['#FFFFFF', '#0071E3', '#1D1D1F', '#F5F5F7'],
    accent: '#0071E3',
    bg: '#FFFFFF',
    ink: '#1D1D1F',
    theme: 'light',
    font: 'Inter',
    thumb: 'https://images.unsplash.com/photo-1596649714492-a8f90ecb3776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./mumotor')),
  },
  {
    slug: 'aurora',
    name: 'Aurora',
    style: 'Liquid glass',
    blurb: 'Apple-style liquid glass — frosted panels float over a soft aurora gradient with pointer-follow light and depth parallax.',
    swatch: ['#F6F8FC', '#5B8DEF', '#8B7BF0', '#36C5C0'],
    accent: '#5B8DEF',
    bg: '#F6F8FC',
    ink: '#0B1220',
    theme: 'light',
    font: 'Sora',
    thumb: 'https://images.unsplash.com/photo-1596649714492-a8f90ecb3776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./aurora')),
  },
  {
    slug: 'obsidian',
    name: 'Obsidian',
    style: 'Smoked dark glass',
    blurb: 'Luxury after-dark — smoked glass panels, a receding 3D grid horizon and slow cinematic reveals in cool ice-steel.',
    swatch: ['#0B0D10', '#9FB6CC', '#D7E3EE', '#14181D'],
    accent: '#9FB6CC',
    bg: '#0B0D10',
    ink: '#EAEEF2',
    theme: 'dark',
    font: 'Manrope',
    thumb: 'https://images.unsplash.com/photo-1604432264352-54fdecccf881?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./obsidian')),
  },
  {
    slug: 'bento',
    name: 'Bento',
    style: 'Glass bento grid',
    blurb: 'Everything at a glance — crisp frosted tiles in a tight bento grid that tilt in 3D and assemble as you scroll.',
    swatch: ['#EEF2F8', '#4F46E5', '#2DD4BF', '#FFFFFF'],
    accent: '#4F46E5',
    bg: '#EEF2F8',
    ink: '#0B1220',
    theme: 'light',
    font: 'Figtree',
    thumb: 'https://images.unsplash.com/photo-1515086828834-023d61380316?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./bento')),
  },
  {
    slug: 'prism',
    name: 'Prism',
    style: 'Holographic glass',
    blurb: 'Iridescent dichroic glass — borders that shift hue as you scroll and a refractive hero, restrained and premium.',
    swatch: ['#101114', '#FF4D9D', '#38E1FF', '#B6FF5C'],
    accent: '#38E1FF',
    bg: '#101114',
    ink: '#F4F5F7',
    theme: 'dark',
    font: 'Bricolage Grotesque',
    thumb: 'https://images.unsplash.com/photo-1471174617910-3e9c04f58ff5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./prism')),
  },
  {
    slug: 'frosted',
    name: 'Frosted',
    style: 'Photo + frosted glass',
    blurb: 'Photography-first — full-bleed driving photos with heavy frosted-glass cards and cinematic parallax. Editorial and warm.',
    swatch: ['#0E1116', '#E8A14B', '#58C0B0', '#F4F6FA'],
    accent: '#E8A14B',
    bg: '#0E1116',
    ink: '#F4F6FA',
    theme: 'dark',
    font: 'Fraunces',
    thumb: 'https://images.unsplash.com/photo-1675798891288-07fe456fc998?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./frosted')),
  },
  {
    slug: 'grid-ink',
    name: 'Grid & Ink',
    style: 'Swiss editorial',
    blurb: 'Strict typographic grid, hairline rules and numbered sections. Confident, magazine-grade, zero clutter.',
    swatch: ['#FAFAF7', '#111111', '#E4002B', '#6B6B6B'],
    accent: '#E4002B',
    bg: '#FAFAF7',
    ink: '#111111',
    theme: 'light',
    font: 'Archivo',
    thumb: 'https://images.unsplash.com/photo-1617050318658-a9a3175e34cb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./grid-ink')),
  },
  {
    slug: 'open-road',
    name: 'Open Road',
    style: 'Retro automotive',
    blurb: 'Warm 70s road-trip energy — sunburst hero, enamel badges, grain and dashed-road dividers.',
    swatch: ['#F4E9D8', '#D2691E', '#E0A526', '#2A6F6B'],
    accent: '#D2691E',
    bg: '#F4E9D8',
    ink: '#3A2A1E',
    theme: 'light',
    font: 'Abril Fatface',
    thumb: 'https://images.unsplash.com/photo-1556028475-50d7afb5029b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./open-road')),
  },
  {
    slug: 'night-shift',
    name: 'Night Shift',
    style: 'Dark cinematic neon',
    blurb: 'A night-drive in neon — glass panels, headlight beams and a glowing call-to-action.',
    swatch: ['#0A0A0F', '#22D3EE', '#F0398B', '#0B1020'],
    accent: '#22D3EE',
    bg: '#0A0A0F',
    ink: '#EAF2FF',
    theme: 'dark',
    font: 'Space Grotesk',
    thumb: 'https://images.unsplash.com/photo-1471479917193-f00955256257?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./night-shift')),
  },
  {
    slug: 'easy-lane',
    name: 'Easy Lane',
    style: 'Soft & friendly',
    blurb: 'Reassuring and rounded — pastel blobs, springy motion and a "your journey" progress feel.',
    swatch: ['#FFFDFA', '#3B82F6', '#34D399', '#FFB088'],
    accent: '#3B82F6',
    bg: '#FFFDFA',
    ink: '#243B53',
    theme: 'light',
    font: 'Fredoka',
    thumb: 'https://images.unsplash.com/photo-1609731791145-b2eb1f95e808?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./easy-lane')),
  },
  {
    slug: 'prestige',
    name: 'Prestige Drive',
    style: 'Luxury black & gold',
    blurb: 'Editorial luxury — black, gold hairlines, oversized serif numerals and slow curtain reveals.',
    swatch: ['#0C0C0C', '#C9A24B', '#F5F1E8', '#9B9183'],
    accent: '#C9A24B',
    bg: '#0C0C0C',
    ink: '#F5F1E8',
    theme: 'dark',
    font: 'Playfair Display',
    thumb: 'https://images.unsplash.com/photo-1770316936952-8b821970ce56?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./prestige')),
  },
  {
    slug: 'full-throttle',
    name: 'Full Throttle',
    style: 'Neo-brutalist',
    blurb: 'Loud and structural — primary colours, thick borders, hard shadows and scroll-snap blocks.',
    swatch: ['#F2F0E9', '#2D52FF', '#FFE600', '#FF3B30'],
    accent: '#2D52FF',
    bg: '#F2F0E9',
    ink: '#000000',
    theme: 'light',
    font: 'Space Grotesk',
    thumb: 'https://images.unsplash.com/photo-1776231659012-79d989f6a29c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
    Component: lazy(() => import('./full-throttle')),
  },
];

export function getTemplate(slug: string | undefined): TemplateMeta | undefined {
  return TEMPLATES.find((t) => t.slug === slug);
}

export function getTemplateIndex(slug: string | undefined): number {
  return TEMPLATES.findIndex((t) => t.slug === slug);
}
