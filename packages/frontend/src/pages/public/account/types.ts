import type { ReactNode } from 'react';
import type { BookLocale } from '../../../lib/bookingStrings';
import type { Dir } from '../../../lib/templateTheme';
import type { ChatMessage, StudentHistoryLesson, StudentLesson } from '../../../lib/api';

export interface AccountStudent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}
export interface AccountStats {
  upcoming: number;
  completed: number;
  total: number;
}
/** Honest progress — ONLY real facts. No invented "lessons remaining"/target.
 *  `pct` is completed-vs-booked (0..1), for a ring/gauge fill. */
export interface AccountReadiness {
  completed: number;
  upcoming: number;
  total: number;
  hoursDriven: number;
  pct: number;
}

/** Fully-resolved dashboard data handed to every skin (never null; the frame
 *  handles loading/error). Skins are pure presentational — they never touch
 *  React Query or the token store. */
export interface AccountData {
  student: AccountStudent;
  stats: AccountStats;
  readiness: AccountReadiness;
  next: StudentLesson | null;
  upcoming: StudentLesson[];
  rest: StudentLesson[];
  history: StudentHistoryLesson[];
  messages: ChatMessage[];
  unread: number;
  classDuration: number;
  schoolName: string;
  logoSrc: string | null;
  slug: string;
  locale: BookLocale;
  dir: Dir;
}

export interface AccountActions {
  bookHref: string;
  siteHref: string;
  sendMessage: (body: string) => void;
  sendPending: boolean;
  saveProfile: (phone: string) => void;
  savePending: boolean;
  markMessagesSeen: () => void;
  logout: () => void;
  refetch: () => void;
}

// ── Headless building-block props (logic only; each skin passes its own classes) ──
export interface ChatThreadClassNames {
  root?: string;
  empty?: string;
  bubbleMe?: string;
  bubbleThem?: string;
  time?: string;
  form?: string;
  input?: string;
  send?: string;
}
export interface ChatThreadProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSend: (body: string) => void;
  sending: boolean;
  onSeen: () => void;
  L: BookLocale;
  classNames?: ChatThreadClassNames;
  placeholder?: string;
  sendLabel?: string;
  sendIcon?: ReactNode;
}
export interface ProfileFormClassNames {
  root?: string;
  field?: string;
  label?: string;
  hint?: string;
  input?: string;
  save?: string;
}
export interface ProfileFormProps {
  student: AccountStudent;
  onSave: (phone: string) => void;
  saving: boolean;
  L: BookLocale;
  classNames?: ProfileFormClassNames;
}

/** Logic-only helpers so skins never re-implement plumbing but still render
 *  their own native markup. `ChatThread`/`ProfileForm` are STABLE module-level
 *  components (their internal draft/scroll state survives data refetches). */
export interface AccountPrimitives {
  slotRange: (start: string, dur: number) => string;
  formatDate: (iso: string) => string;
  formatMsgTime: (iso: string) => string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  ChatThread: (props: ChatThreadProps) => ReactNode;
  ProfileForm: (props: ProfileFormProps) => ReactNode;
}

export interface AccountSkinProps {
  data: AccountData;
  actions: AccountActions;
  L: BookLocale;
  dir: Dir;
  ui: AccountPrimitives;
}
