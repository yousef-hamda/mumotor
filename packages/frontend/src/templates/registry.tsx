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
