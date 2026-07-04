import axios, { AxiosError } from 'axios';
import type {
  AvailabilityResponse,
  CheckEnrollment,
  DailyCode,
  DailyReport,
  DrivingSettings,
  PublicSettings,
  Review,
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
      }
    }
    return Promise.reject(error);
  }
);

// ---------------------------------------------------------------------------
// Student portal — a SEPARATE axios instance so the teacher's Bearer token
// (attached by `api`'s interceptor) never leaks onto student endpoints, and the
// student's own session token is attached instead. Scoped per website slug.
// ---------------------------------------------------------------------------
let activeStudentToken: string | null = null;
const studentKey = (slug: string) => `mumotor_student_token:${slug}`;

export const studentTokenStore = {
  get: (slug: string) => localStorage.getItem(studentKey(slug)),
  /** Persist + make active for subsequent studentApi calls. */
  set: (slug: string, t: string) => {
    localStorage.setItem(studentKey(slug), t);
    activeStudentToken = t;
  },
  clear: (slug: string) => {
    localStorage.removeItem(studentKey(slug));
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

export const studentPortalApi = {
  login: (websiteId: string, data: { email: string; enrollmentCode: string }) =>
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
  me: () => api.get<{ user: User }>('/auth/me').then((r) => r.data.user),
  updateMe: (data: { name?: string; phone?: string; preferredLanguage?: 'HE' | 'AR' | 'EN' }) =>
    api.patch<{ user: User }>('/auth/me', data).then((r) => r.data.user),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ success: boolean }>('/auth/change-password', data).then((r) => r.data),
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
  create: (data: { websiteId: string; studentName: string; rating: number; comment: string }) =>
    api.post<{ review: { id: string; status: string } }>('/reviews', data).then((r) => r.data.review),
  publicList: (websiteId: string) =>
    api.get<{ reviews: PublicReview[] }>(`/reviews/public/${websiteId}`).then((r) => r.data.reviews),
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
  getDailyReport: (websiteId: string) =>
    api.get<DailyReport>(`/driving-school/${websiteId}/daily-report`).then((r) => r.data),
  cancelBooking: (websiteId: string, bookingId: string) =>
    api.post<{ cancelled: boolean }>(`/driving-school/${websiteId}/bookings/${bookingId}/cancel`).then((r) => r.data),
  getDailyCode: (websiteId: string) =>
    api.get<DailyCode>(`/driving-school/${websiteId}/daily-code`).then((r) => r.data),
  sendBulkEmail: (websiteId: string, data: { subject: string; body: string; targetGroup: 'all' | 'active' | 'inactive' }) =>
    api
      .post<{ id: string; recipients: number; sentCount: number; failedCount: number; status: string }>(
        `/driving-school/${websiteId}/bulk-email`,
        data
      )
      .then((r) => r.data),

  // --- Public ---
  getPublicSettings: (slug: string) =>
    api.get<PublicSettings>(`/driving-school/${slug}/public-settings`).then((r) => r.data),
  checkEnrollment: (websiteId: string, email: string) =>
    api.get<CheckEnrollment>(`/driving-school/${websiteId}/check-enrollment`, { params: { email } }).then((r) => r.data),
  enroll: (data: { websiteId: string; enrollmentCode: string; studentName: string; studentEmail: string; studentPhone: string }) =>
    api
      .post<{ enrollment: { id: string; studentName: string; studentEmail: string; status: string } }>(
        '/driving-school/enroll',
        data
      )
      .then((r) => r.data),
  validateMagicLink: (token: string) =>
    api
      .post<{ email: string; websiteId: string; websiteSlug: string; studentName: string; studentPhone: string | null; status: string }>(
        '/driving-school/validate-magic-link',
        { token }
      )
      .then((r) => r.data),
  getPublicAvailability: (websiteId: string, date: string, email: string) =>
    api
      .get<AvailabilityResponse>(`/driving-school/${websiteId}/public-availability`, { params: { date, email } })
      .then((r) => r.data),
  bookLesson: (websiteId: string, data: { studentEmail?: string; date: string; time: string; token?: string }) =>
    api
      .post<{ booking: { id: string; date: string; time: string; duration: number; status: string } }>(
        `/driving-school/${websiteId}/book-lesson`,
        data
      )
      .then((r) => r.data),
  validateDailyCode: (websiteId: string, data: { code: string; date: string }) =>
    api.post<{ valid: boolean }>(`/driving-school/${websiteId}/daily-code/validate`, data).then((r) => r.data),
  selfDeactivate: (data: { email: string; websiteId: string; enrollmentCode: string }) =>
    api.post<{ status: string; message: string }>('/driving-school/self-deactivate', data).then((r) => r.data),
  myBookings: (websiteId: string, data: { email: string; enrollmentCode: string }) =>
    api
      .post<{ bookings: { id: string; date: string; time: string; duration: number; cancellable: boolean }[] }>(
        `/driving-school/${websiteId}/my-bookings`,
        data
      )
      .then((r) => r.data.bookings),
  cancelMyBooking: (websiteId: string, bookingId: string, data: { email: string; enrollmentCode: string }) =>
    api
      .post<{ cancelled: boolean }>(`/driving-school/${websiteId}/bookings/${bookingId}/cancel-by-student`, data)
      .then((r) => r.data),
  requestMagicLink: (websiteId: string, email: string) =>
    api.post<{ sent: boolean }>(`/driving-school/${websiteId}/request-magic-link`, { email }).then((r) => r.data),

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
