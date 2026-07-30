/**
 * DynamicIcon — render a lucide icon by name, so template icons can be swapped in
 * Customize mode.
 *
 * WHY THE IMPORTS BELOW ARE EXPLICIT (C-01). This module used to do
 * `import * as Lucide from 'lucide-react'`, which pulls all ~1,540 icons into whatever
 * chunk imports it. Every template imports DynamicIcon, so the whole library landed in
 * the shared chunk that EVERY visitor downloads — a student booking a driving lesson was
 * fetching the icons for `sailboat`, `biohazard` and `dessert`. It bought nothing: the
 * picker in Customize only ever renders ICON_LIBRARY, the curated set below, so the other
 * ~1,400 icons supported no feature at all.
 *
 * The static set is therefore exactly: every curated picker icon, plus every name any
 * template or strings file uses as a default. Tree-shaking keeps only these.
 *
 * ADDING AN ICON: add the name to ICON_LIBRARY *and* to the import list. A name that is
 * missing from the import falls back to the lazy loader below rather than breaking, but
 * that costs a network round-trip — keep the two lists in step. `npm test` guards this.
 */
import {
  Activity, AlarmClock, ArrowRight, ArrowUpRight, AtSign, Award, BadgeCheck, BadgePercent,
  Banknote, BarChart3, Bell, Bike, Book, BookOpen, Brain, Bus, Calendar, CalendarCheck,
  CalendarClock, CalendarDays, Car, CarFront, CarTaxiFront, Caravan, Check, CheckCheck,
  ChevronRight, Circle, CircleCheck, CircleCheckBig, CircleDollarSign, CircleDot,
  CircleGauge, Clapperboard, ClipboardCheck, ClipboardList, Clock, Clock3, Cog, Coins,
  Compass, Construction, CreditCard, Crown, Diamond, Eye, Feather, FileCheck, Filter, Flag,
  FlagTriangleRight, Fuel, Gauge, Gem, Gift, Globe, Goal, GraduationCap, Hand, Handshake,
  Headphones, Heart, HeartHandshake, HelpCircle, Hexagon, Home, Hourglass, Inbox, Infinity,
  Key, Layers, LifeBuoy, Lightbulb, Link, Lock, Mail, MailOpen, Map, MapPin, MapPinned,
  Medal, MessageCircle, MessageSquare, MessagesSquare, Milestone, Minus, Navigation,
  NotebookPen, ParkingCircle, ParkingMeter, PartyPopper, PencilRuler, Percent, Phone,
  PhoneCall, PiggyBank, Plus, Repeat, Rocket, Route, Ruler, Search, Send, Settings, Share2,
  Shield, ShieldCheck, Signpost, Sliders, Smartphone, Smile, Sparkles, Square, Star, Tag,
  Tags, Target, ThumbsUp, Timer, TrafficCone, TrendingUp, Triangle, TriangleAlert, Trophy,
  Truck, User, UserCheck, UserPlus, Users, Verified, Wallet, Wrench, Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

// lucide icons are forwardRef components, so use the library's own type rather than a
// plain function signature — a hand-rolled `(props) => JSX.Element` does not match and
// only type-checked before because the whole barrel was cast in one go.
type IconComponent = LucideIcon;

/** The statically-bundled icons: the curated picker set + every template default. */
const REGISTRY: Record<string, IconComponent | undefined> = {
  Activity, AlarmClock, ArrowRight, ArrowUpRight, AtSign, Award, BadgeCheck,
  BadgePercent, Banknote, BarChart3, Bell, Bike, Book, BookOpen, Brain, Bus, Calendar,
  CalendarCheck, CalendarClock, CalendarDays, Car, CarFront, CarTaxiFront, Caravan,
  Check, CheckCheck, ChevronRight, Circle, CircleCheck, CircleCheckBig,
  CircleDollarSign, CircleDot, CircleGauge, Clapperboard, ClipboardCheck,
  ClipboardList, Clock, Clock3, Cog, Coins, Compass, Construction, CreditCard, Crown,
  Diamond, Eye, Feather, FileCheck, Filter, Flag, FlagTriangleRight, Fuel, Gauge, Gem,
  Gift, Globe, Goal, GraduationCap, Hand, Handshake, Headphones, Heart, HeartHandshake,
  HelpCircle, Hexagon, Home, Hourglass, Inbox, Infinity, Key, Layers, LifeBuoy,
  Lightbulb, Link, Lock, Mail, MailOpen, Map, MapPin, MapPinned, Medal, MessageCircle,
  MessageSquare, MessagesSquare, Milestone, Minus, Navigation, NotebookPen,
  ParkingCircle, ParkingMeter, PartyPopper, PencilRuler, Percent, Phone, PhoneCall,
  PiggyBank, Plus, Repeat, Rocket, Route, Ruler, Search, Send, Settings, Share2,
  Shield, ShieldCheck, Signpost, Sliders, Smartphone, Smile, Sparkles, Square, Star,
  Tag, Tags, Target, ThumbsUp, Timer, TrafficCone, TrendingUp, Triangle, TriangleAlert,
  Trophy, Truck, User, UserCheck, UserPlus, Users, Verified, Wallet, Wrench, Zap
};

/**
 * Lazy escape hatch for a name outside the static set.
 *
 * Reachable when a site's stored `customization.icons` names an icon that is no longer in
 * ICON_LIBRARY — e.g. a curated entry was removed after a teacher had already chosen it.
 * Rather than silently degrading that site to a fallback glyph forever, fetch the full
 * library once, on demand, in its own chunk. Nothing on a normal page load triggers this.
 */
let lateRegistry: Record<string, IconComponent | undefined> | null = null;
let latePromise: Promise<void> | null = null;
const lateSubscribers = new Set<() => void>();

function loadFullLibrary(): void {
  if (latePromise) return;
  latePromise = import('lucide-react').then((mod) => {
    lateRegistry = mod as unknown as Record<string, IconComponent | undefined>;
    lateSubscribers.forEach((notify) => notify());
  });
}

/** True if this exact PascalCase name resolves to an icon we can render right now. */
export function iconExists(name?: string): boolean {
  if (!name) return false;
  return typeof (REGISTRY[name] ?? lateRegistry?.[name]) === 'function';
}

export function DynamicIcon({
  name,
  fallback = 'Circle',
  ...props
}: { name?: string; fallback?: string } & LucideProps) {
  const known = (name && REGISTRY[name]) || undefined;
  // Only subscribe/rerender for the rare unknown-name case, so the common path stays a
  // plain synchronous render with no extra state.
  const [, bump] = useState(0);
  const needsLate = Boolean(name) && !known;
  useEffect(() => {
    if (!needsLate) return;
    const notify = () => bump((n) => n + 1);
    lateSubscribers.add(notify);
    loadFullLibrary();
    return () => {
      lateSubscribers.delete(notify);
    };
  }, [needsLate, name]);

  const Cmp = known || (name ? lateRegistry?.[name] : undefined) || REGISTRY[fallback] || REGISTRY.Circle!;
  return <Cmp {...props} />;
}

export interface IconGroup {
  group: string;
  icons: string[];
}

/**
 * Curated, categorized icons for the picker grid. Every name is a real lucide
 * export. Driving-school-relevant categories come first.
 */
export const ICON_LIBRARY: IconGroup[] = [
  {
    group: 'Driving & road',
    icons: [
      'Car', 'CarFront', 'CarTaxiFront', 'Truck', 'Bus', 'Bike', 'Caravan',
      'Fuel', 'Gauge', 'Milestone', 'TrafficCone', 'Signpost', 'Route',
      'Navigation', 'Map', 'MapPin', 'MapPinned', 'Compass', 'CircleGauge',
      'ParkingMeter', 'ParkingCircle', 'Construction', 'TriangleAlert',
    ],
  },
  {
    group: 'Trust & achievement',
    icons: [
      'Star', 'Award', 'Trophy', 'Medal', 'BadgeCheck', 'ShieldCheck', 'Shield',
      'Check', 'CheckCheck', 'CircleCheck', 'CircleCheckBig', 'ThumbsUp',
      'Heart', 'HeartHandshake', 'Sparkles', 'Crown', 'Gem', 'Verified',
    ],
  },
  {
    group: 'Learning',
    icons: [
      'GraduationCap', 'BookOpen', 'Book', 'NotebookPen', 'Lightbulb', 'Brain',
      'Target', 'Goal', 'Flag', 'FlagTriangleRight', 'TrendingUp', 'BarChart3',
      'ClipboardCheck', 'ClipboardList', 'FileCheck', 'PencilRuler',
    ],
  },
  {
    group: 'People & support',
    icons: [
      'User', 'Users', 'UserCheck', 'UserPlus', 'Handshake', 'Smile',
      'MessageCircle', 'MessageSquare', 'Headphones', 'LifeBuoy', 'HelpCircle',
      'Hand', 'PartyPopper',
    ],
  },
  {
    group: 'Time & booking',
    icons: [
      'Clock', 'Clock3', 'Calendar', 'CalendarCheck', 'CalendarClock',
      'CalendarDays', 'Timer', 'Hourglass', 'AlarmClock', 'Bell', 'Zap',
      'Rocket', 'Repeat',
    ],
  },
  {
    group: 'Contact',
    icons: [
      'Phone', 'PhoneCall', 'Mail', 'MailOpen', 'Send', 'AtSign', 'Globe',
      'Link', 'Share2', 'Smartphone', 'MessagesSquare', 'Inbox',
    ],
  },
  {
    group: 'Money & value',
    icons: [
      'Wallet', 'CreditCard', 'PiggyBank', 'BadgePercent', 'Tag', 'Tags',
      'Gift', 'CircleDollarSign', 'Banknote', 'Percent', 'Coins',
    ],
  },
  {
    group: 'General',
    icons: [
      'Home', 'Settings', 'Sliders', 'Lock', 'Key', 'Eye', 'Search', 'Filter',
      'Plus', 'Minus', 'ArrowRight', 'ArrowUpRight', 'ChevronRight', 'Circle',
      'CircleDot', 'Square', 'Triangle', 'Hexagon', 'Diamond', 'Layers',
      'Wrench', 'Cog', 'Activity', 'Infinity',
    ],
  },
];

/** Flat list of all curated names (for quick membership checks). */
export const CURATED_ICON_NAMES: string[] = ICON_LIBRARY.flatMap((g) => g.icons);
