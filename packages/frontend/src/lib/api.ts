import axios, { AxiosError } from 'axios';
import type {
  AccountState,
  AvailabilityResponse,
  CheckEnrollment,
  DailyCode,
  DailyReport,
  DrivingSettings,
  PublicSettings,
  Review,
  ScheduleDay,
  Student,
  StudentsResponse,
  SubscriptionInfo,
  User,
  Website,
} from './types';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({ baseURL, withCredentials: true });

/** Origin that serves published teacher sites (backend). */
export const SITE_BASE =
  import.meta.env.VITE_SITE_BASE || (import.meta.env.DEV ? 'http://localhost:4000' : '');
export const siteUrl = (slug: string) => `${SITE_BASE}/site/${slug}`;

const TOKEN_KEY = 'mumotor_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    if (error.response?.status === 401 && tokenStore.get()) {
      // token invalid/expired — clear it (guards against loops)
      const url = error.config?.url ?? '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        tokenStore.clear();
        // Tell the auth context to drop the in-memory user so ProtectedRoute
        // redirects to /login immediately, instead of rendering a broken session
        // until a hard reload (M31).
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('mm-unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Bare instance for PUBLIC (unauthenticated) endpoints: no teacher Bearer header,
// no cookies, and crucially no 401-logout interceptor — so a signed-in teacher
// exercising a public student flow that 401s never gets logged out of the app.
export const publicApi = axios.create({ baseURL, withCredentials: false });

// ---------------------------------------------------------------------------
// Student portal — a SEPARATE axios instance so the teacher's Bearer token
// (attached by `api`'s interceptor) never leaks onto student endpoints, and the
// student's own session token is attached instead. Scoped per website slug.
// ---------------------------------------------------------------------------
let activeStudentToken: string | null = null;
const studentKey = (slug: string) => `mumotor_student_token:${slug}`;
const studentInfoKey = (slug: string) => `mumotor_student_info:${slug}`;

export const studentTokenStore = {
  get: (slug: string) => localStorage.getItem(studentKey(slug)),
  /** Persist the session token (+ optional email/name) and make it active.
   *  Storing the email/name lets the booking page skip the email step instantly,
   *  without waiting on a network call. */
  set: (slug: string, t: string, info?: { email?: string; name?: string }) => {
    localStorage.setItem(studentKey(slug), t);
    if (info && (info.email || info.name)) {
      try { localStorage.setItem(studentInfoKey(slug), JSON.stringify({ email: info.email ?? '', name: info.name ?? '' })); } catch { /* ignore */ }
    }
    activeStudentToken = t;
  },
  /** The stored student email/name for this site (or null). */
  info: (slug: string): { email: string; name: string } | null => {
    try { const raw = localStorage.getItem(studentInfoKey(slug)); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  clear: (slug: string) => {
    localStorage.removeItem(studentKey(slug));
    localStorage.removeItem(studentInfoKey(slug));
    activeStudentToken = null;
  },
  /** Load a stored token for this site and make it active; returns it (or null). */
  activate: (slug: string) => {
    activeStudentToken = localStorage.getItem(studentKey(slug));
    return activeStudentToken;
  },
};

// No cookies (withCredentials:false) so the teacher session cookie is never sent.
export const studentApi = axios.create({ baseURL, withCredentials: false });
studentApi.interceptors.request.use((config) => {
  if (activeStudentToken) config.headers.Authorization = `Bearer ${activeStudentToken}`;
  return config;
});

export interface StudentSummary {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  classCount: number;
  /** Real lesson counts (from /student/me). */
  stats?: { upcoming: number; completed: number; total: number };
}
export interface ChatMessage {
  id: string;
  sender: 'STUDENT' | 'TEACHER';
  body: string;
  createdAt: string;
}
export interface StudentLesson {
  id: string;
  date: string;
  time: string;
  duration: number;
  cancellable: boolean;
}
export interface StudentHistoryLesson {
  id: string;
  date: string;
  time: string;
  duration: number;
  status: 'COMPLETED' | 'CANCELLED';
}

export const studentPortalApi = {
  login: (websiteId: string, data: { email: string }) =>
    studentApi
      .post<{ token: string; student: StudentSummary }>(`/driving-school/${websiteId}/student/login`, data)
      .then((r) => r.data),
  me: (websiteId: string) =>
    studentApi.get<{ student: StudentSummary }>(`/driving-school/${websiteId}/student/me`).then((r) => r.data.student),
  updateProfile: (websiteId: string, data: { studentPhone?: string }) =>
    studentApi
      .patch<{ student: StudentSummary }>(`/driving-school/${websiteId}/student/profile`, data)
      .then((r) => r.data.student),
  lessons: (websiteId: string) =>
    studentApi.get<{ lessons: StudentLesson[] }>(`/driving-school/${websiteId}/student/lessons`).then((r) => r.data.lessons),
  history: (websiteId: string) =>
    studentApi
      .get<{ history: StudentHistoryLesson[]; hoursDriven: number }>(`/driving-school/${websiteId}/student/history`)
      .then((r) => r.data),
  cancelLesson: (websiteId: string, bookingId: string) =>
    studentApi
      .post<{ cancelled: boolean }>(`/driving-school/${websiteId}/student/lessons/${bookingId}/cancel`)
      .then((r) => r.data),
  messages: (websiteId: string, after?: string) =>
    studentApi
      .get<{ messages: ChatMessage[] }>(`/driving-school/${websiteId}/student/messages`, {
        params: after ? { after } : undefined,
      })
      .then((r) => r.data.messages),
  sendMessage: (websiteId: string, body: string) =>
    studentApi
      .post<{ message: ChatMessage }>(`/driving-school/${websiteId}/student/messages`, { body })
      .then((r) => r.data.message),
};

/** Extract a friendly error message from an axios error. */
export function apiError(err: unknown): { message: string; code?: string; status?: number } {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; code?: string } | undefined;
    return { message: data?.error || err.message, code: data?.code, status: err.response?.status };
  }
  return { message: err instanceof Error ? err.message : 'Something went wrong' };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    api.post<{ token: string; user: User }>('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<{ token: string; user: User }>('/auth/login', data).then((r) => r.data),
  /** Sign in with Google: exchange the Google ID token (credential) for our JWT. */
  google: (credential: string) =>
    api.post<{ token: string; user: User }>('/auth/google', { credential }).then((r) => r.data),
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  /** Full account state (trial/quota/locked) for the paywall gate. */
  account: () => api.get<{ user: User; account: AccountState }>('/auth/me').then((r) => r.data.account),
  updateMe: (data: { name?: string; phone?: string; preferredLanguage?: 'HE' | 'AR' | 'EN' }) =>
    api.patch<{ user: User }>('/auth/me', data).then((r) => r.data.user),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    // The server bumps tokenVersion (revoking old sessions) and returns a fresh
    // token for THIS session — store it so the current login keeps working.
    api.post<{ success: boolean; token?: string }>('/auth/change-password', data).then((r) => {
      if (r.data.token) tokenStore.set(r.data.token);
      return r.data;
    }),
  forgotPassword: (email: string) =>
    api.post<{ sent: boolean }>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ success: boolean }>('/auth/reset-password', { token, newPassword }).then((r) => r.data),
  verifyEmail: (token: string) =>
    api.post<{ verified: boolean }>('/auth/verify-email', { token }).then((r) => r.data),
  resendVerification: () =>
    api.post<{ sent: boolean }>('/auth/resend-verification').then((r) => r.data),
};

// Reviews
export interface PublicReview {
  studentName: string;
  rating: number;
  comment: string;
  reply: string | null;
  createdAt: string;
}
export const reviewsApi = {
  list: (websiteId: string) => api.get<{ reviews: Review[] }>('/reviews', { params: { websiteId } }).then((r) => r.data.reviews),
  // Public student surfaces → the public axios instance (no teacher Bearer + no
  // 401-force-logout interceptor, which would log a teacher out of their own app if
  // they browsed their public site and one of these 401'd).
  create: (data: { websiteId: string; studentName: string; rating: number; comment: string }) =>
    publicApi.post<{ review: { id: string; status: string } }>('/reviews', data).then((r) => r.data.review),
  publicList: (websiteId: string) =>
    publicApi.get<{ reviews: PublicReview[] }>(`/reviews/public/${websiteId}`).then((r) => r.data.reviews),
  update: (id: string, data: { status?: 'PENDING' | 'APPROVED' | 'REJECTED'; reply?: string }) =>
    api.patch<{ review: Review }>(`/reviews/${id}`, data).then((r) => r.data.review),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/reviews/${id}`).then((r) => r.data),
};

// Wizard draft (server-side copy of the builder wizard for logged-in users)
export const wizardDraftApi = {
  get: () =>
    api
      .get<{ draft: { config: Record<string, unknown>; updatedAt: string } | null }>('/wizard-draft')
      .then((r) => r.data.draft),
  put: (config: Record<string, unknown>) =>
    api.put<{ saved: boolean; updatedAt: string }>('/wizard-draft', { config }).then((r) => r.data),
  remove: () => api.delete<{ deleted: boolean }>('/wizard-draft').then((r) => r.data),
};

// Notifications
export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
}
export const notificationsApi = {
  list: () => api.get<{ notifications: Notification[]; unread: number }>('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};

// Media
export interface MediaItem {
  id: string;
  url: string;
  type: string;
  createdAt?: string;
}
export const mediaApi = {
  upload: (websiteId: string, data: { dataUrl: string; type?: 'CAR_PHOTO' | 'GALLERY' | 'AVATAR' | 'LOGO' | 'OTHER' }) =>
    api.post<{ media: MediaItem }>(`/websites/${websiteId}/media`, data).then((r) => r.data.media),
  list: (websiteId: string) => api.get<{ media: MediaItem[] }>(`/websites/${websiteId}/media`).then((r) => r.data.media),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/media/${id}`).then((r) => r.data),
};

// Admin
export interface AdminEventStats {
  last7: Record<string, number>;
  last30: Record<string, number>;
  funnel: { wizardStarted7d: number; published7d: number };
}
export interface AdminStats {
  users: number;
  websites: number;
  published: number;
  enrollments: number;
  bookings: number;
  reviews: number;
  events?: AdminEventStats;
}
export interface AdminUser { id: string; email: string; name: string; role: string; createdAt: string; _count: { websites: number } }
export interface AdminWebsite { id: string; name: string; slug: string; status: string; createdAt: string; user: { email: string }; _count: { enrollments: number; bookings: number } }
export const adminApi = {
  stats: () => api.get<{ stats: AdminStats }>('/admin/stats').then((r) => r.data.stats),
  users: () => api.get<{ users: AdminUser[] }>('/admin/users').then((r) => r.data.users),
  websites: () => api.get<{ websites: AdminWebsite[] }>('/admin/websites').then((r) => r.data.websites),
};

// Subscriptions / billing
export const subscriptionApi = {
  get: () => api.get<SubscriptionInfo>('/subscriptions').then((r) => r.data),
  checkout: (plan: 'FREE' | 'PRO' | 'STUDIO') =>
    api
      .post<{ success?: boolean; mode?: string; plan?: string; note?: string; url?: string }>('/subscriptions/checkout', { plan })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Websites
// ---------------------------------------------------------------------------
export interface PublishResult {
  status: string;
  slug: string;
  path: string;
  url: string;
  subdomain: string;
  version: number;
}

export const websiteApi = {
  list: () => api.get<{ websites: Website[] }>('/websites').then((r) => r.data.websites),
  get: (id: string) => api.get<{ website: Website }>(`/websites/${id}`).then((r) => r.data.website),
  create: (data: {
    name: string;
    slug?: string;
    tagline?: string;
    selectedPreset?: string;
    locale?: 'HE' | 'AR' | 'EN';
    configuration?: Record<string, unknown>;
  }) => api.post<{ website: Website }>('/websites', data).then((r) => r.data.website),
  update: (
    id: string,
    data: Partial<{ name: string; tagline: string; selectedPreset: string; locale: 'HE' | 'AR' | 'EN'; configuration: Record<string, unknown> }>
  ) => api.patch<{ website: Website }>(`/websites/${id}`, data).then((r) => r.data.website),
  publish: (id: string) => api.post<PublishResult>(`/websites/${id}/publish`).then((r) => r.data),
  unpublish: (id: string) => api.post<{ status: string }>(`/websites/${id}/unpublish`).then((r) => r.data),
  remove: (id: string, confirm: string) =>
    api.delete<{ deleted: boolean }>(`/websites/${id}`, { data: { confirm } }).then((r) => r.data),
};

export interface StockPhoto {
  id: string;
  alt: string;
  thumb: string;
  small: string;
  regular: string;
  author: string;
  authorUrl: string;
  downloadLocation: string | null;
}

export const photosApi = {
  search: (q: string, opts?: { page?: number; per_page?: number; orientation?: 'landscape' | 'portrait' | 'squarish' }) =>
    api
      .get<{ results: StockPhoto[]; total: number }>('/photos/search', { params: { q, ...opts } })
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Driving school
// ---------------------------------------------------------------------------
export const drivingSchoolApi = {
  // --- Teacher ---
  getSettings: (websiteId: string) =>
    api.get<DrivingSettings>(`/driving-school/${websiteId}/settings`).then((r) => r.data),
  updateSettings: (websiteId: string, data: Partial<DrivingSettings>) =>
    api.put<DrivingSettings>(`/driving-school/${websiteId}/settings`, data).then((r) => r.data),
  listStudents: (websiteId: string, params: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get<StudentsResponse>(`/driving-school/${websiteId}/students`, { params }).then((r) => r.data),
  addStudent: (
    websiteId: string,
    data: { studentName: string; studentEmail: string; studentPhone?: string; notes?: string }
  ) =>
    api.post<{ enrollment: Student }>(`/driving-school/${websiteId}/students`, data).then((r) => r.data),
  finishStudent: (websiteId: string, enrollmentId: string) =>
    api.patch<{ enrollment: Student }>(`/driving-school/${websiteId}/students/${enrollmentId}/finish`).then((r) => r.data),
  toggleStudentStatus: (websiteId: string, enrollmentId: string) =>
    api.patch<{ enrollment: Student }>(`/driving-school/${websiteId}/students/${enrollmentId}/toggle-status`).then((r) => r.data),
  removeStudent: (websiteId: string, enrollmentId: string) =>
    api.delete<{ deleted: boolean }>(`/driving-school/${websiteId}/students/${enrollmentId}`).then((r) => r.data),
  getDailyReport: (websiteId: string, day?: ScheduleDay) =>
    api
      .get<DailyReport>(`/driving-school/${websiteId}/daily-report`, { params: day ? { day } : undefined })
      .then((r) => r.data),
  cancelBooking: (websiteId: string, bookingId: string) =>
    api.post<{ cancelled: boolean }>(`/driving-school/${websiteId}/bookings/${bookingId}/cancel`).then((r) => r.data),
  assignStudentToSlot: (
    websiteId: string,
    data: { enrollmentId: string; day: ScheduleDay; time: string }
  ) =>
    api
      .post<{ booking: { id: string; date: string; time: string; duration: number; status: string } }>(
        `/driving-school/${websiteId}/schedule/assign`,
        data
      )
      .then((r) => r.data),
  emailMeSchedule: (websiteId: string, data: { day: ScheduleDay }) =>
    api
      .post<{ sent: boolean }>(`/driving-school/${websiteId}/schedule/email-me`, data)
      .then((r) => r.data),
  getDailyCode: (websiteId: string) =>
    api.get<DailyCode>(`/driving-school/${websiteId}/daily-code`).then((r) => r.data),
  sendBulkEmail: (
    websiteId: string,
    data: { subject: string; body: string; targetGroup?: 'all' | 'active' | 'inactive'; enrollmentIds?: string[] }
  ) =>
    api
      .post<{ id: string; recipients: number; sentCount: number; failedCount: number; status: string }>(
        `/driving-school/${websiteId}/bulk-email`,
        data
      )
      .then((r) => r.data),

  // --- Public --- (bare publicApi: no teacher token, no 401-logout)
  getPublicSettings: (slug: string) =>
    publicApi.get<PublicSettings>(`/driving-school/${slug}/public-settings`).then((r) => r.data),
  checkEnrollment: (websiteId: string, email: string) =>
    publicApi.get<CheckEnrollment>(`/driving-school/${websiteId}/check-enrollment`, { params: { email } }).then((r) => r.data),
  enroll: (data: { websiteId: string; enrollmentCode: string; studentName: string; studentEmail: string; studentPhone: string }) =>
    publicApi
      .post<{ enrollment: { id: string; studentName: string; studentEmail: string; status: string } }>(
        '/driving-school/enroll',
        data
      )
      .then((r) => r.data),
  validateMagicLink: (token: string) =>
    publicApi
      .post<{ email: string; websiteId: string; websiteSlug: string; studentName: string; studentPhone: string | null; status: string }>(
        '/driving-school/validate-magic-link',
        { token }
      )
      .then((r) => r.data),
  getPublicAvailability: (websiteId: string, date: string, email: string) =>
    publicApi
      .get<AvailabilityResponse>(`/driving-school/${websiteId}/public-availability`, { params: { date, email } })
      .then((r) => r.data),
  bookLesson: (websiteId: string, data: { studentEmail?: string; date: string; time: string; token?: string }) =>
    publicApi
      .post<{ booking: { id: string; date: string; time: string; duration: number; status: string } }>(
        `/driving-school/${websiteId}/book-lesson`,
        data
      )
      .then((r) => r.data),
  validateDailyCode: (websiteId: string, data: { code: string; date: string }) =>
    publicApi.post<{ valid: boolean }>(`/driving-school/${websiteId}/daily-code/validate`, data).then((r) => r.data),
  requestMagicLink: (websiteId: string, email: string) =>
    publicApi.post<{ sent: boolean }>(`/driving-school/${websiteId}/request-magic-link`, { email }).then((r) => r.data),

  // --- Teacher chat inbox ---
  listConversations: (websiteId: string) =>
    api
      .get<{ conversations: Conversation[] }>(`/driving-school/${websiteId}/conversations`)
      .then((r) => r.data.conversations),
  listMessages: (websiteId: string, enrollmentId: string) =>
    api
      .get<{ student: { id: string; name: string; email: string; status: string }; messages: ChatMessage[] }>(
        `/driving-school/${websiteId}/students/${enrollmentId}/messages`
      )
      .then((r) => r.data),
  sendMessage: (websiteId: string, enrollmentId: string, body: string) =>
    api
      .post<{ message: ChatMessage }>(`/driving-school/${websiteId}/students/${enrollmentId}/messages`, { body })
      .then((r) => r.data.message),
};

export interface Conversation {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  status: string;
  lastMessage: string;
  lastSender: 'STUDENT' | 'TEACHER';
  lastAt: string;
  unread: number;
}
