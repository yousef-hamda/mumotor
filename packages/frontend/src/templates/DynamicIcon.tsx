/**
 * DynamicIcon — render any lucide-react icon by name, so template icons can be
 * swapped from the full icon library in Customize mode.
 *
 * `import * as Lucide` exposes the entire lucide set (1000+ icons) by PascalCase
 * name, so the picker can offer "a lot" of icons and any of them resolves here.
 * `ICON_LIBRARY` is the curated, categorized subset shown in the picker grid
 * (users can also search the full set by name).
 */
import * as Lucide from 'lucide-react';
import type { LucideProps } from 'lucide-react';

type IconComponent = (props: LucideProps) => JSX.Element;

const REGISTRY = Lucide as unknown as Record<string, IconComponent | undefined>;

/** True if a lucide icon by this exact PascalCase name exists. */
export function iconExists(name?: string): boolean {
  if (!name) return false;
  const C = REGISTRY[name];
  return typeof C === 'function';
}

export function DynamicIcon({
  name,
  fallback = 'Circle',
  ...props
}: { name?: string; fallback?: string } & LucideProps) {
  const Cmp =
    (name && REGISTRY[name]) ||
    REGISTRY[fallback] ||
    REGISTRY.Circle!;
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
