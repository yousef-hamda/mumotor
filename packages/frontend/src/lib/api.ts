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
};

// Reviews
export const reviewsApi = {
  list: (websiteId: string) => api.get<{ reviews: Review[] }>('/reviews', { params: { websiteId } }).then((r) => r.data.reviews),
  update: (id: string, data: { status?: 'PENDING' | 'APPROVED' | 'REJECTED'; reply?: string }) =>
    api.patch<{ review: Review }>(`/reviews/${id}`, data).then((r) => r.data.review),
  remove: (id: string) => api.delete<{ deleted: boolean }>(`/reviews/${id}`).then((r) => r.data),
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
export interface AdminStats { users: number; websites: number; published: number; enrollments: number; bookings: number; reviews: number }
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

// ---------------------------------------------------------------------------
// AI / generation
// ---------------------------------------------------------------------------
export interface PresetSummary {
  id: string;
  label: string;
  description: string;
  colors: { primary: string; primaryDark: string; accent: string; bg: string; surface: string; fg: string; muted: string; border: string };
  fonts: { heading: string; body: string };
  hero: string;
  bookingLayout: string;
}

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

export const aiApi = {
  quickTemplates: () => api.get<{ presets: PresetSummary[] }>('/ai/v2/quick-templates').then((r) => r.data.presets),
  generateWebsite: (data: { name?: string; presetId?: string; businessConfig?: Record<string, unknown> }) =>
    api.post<{ html: string; metadata: Record<string, unknown>; presetId: string; slug: string }>('/ai/v2/generate-website', data).then((r) => r.data),
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
  finishStudent: (websiteId: string, enrollmentId: string) =>
    api.patch<{ enrollment: Student }>(`/driving-school/${websiteId}/students/${enrollmentId}/finish`).then((r) => r.data),
  toggleStudentStatus: (websiteId: string, enrollmentId: string) =>
    api.patch<{ enrollment: Student }>(`/driving-school/${websiteId}/students/${enrollmentId}/toggle-status`).then((r) => r.data),
  removeStudent: (websiteId: string, enrollmentId: string) =>
    api.delete<{ deleted: boolean }>(`/driving-school/${websiteId}/students/${enrollmentId}`).then((r) => r.data),
  getDailyReport: (websiteId: string) =>
    api.get<DailyReport>(`/driving-school/${websiteId}/daily-report`).then((r) => r.data),
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
  enroll: (data: { websiteId: string; enrollmentCode: string; studentName: string; studentEmail: string; studentPhone?: string }) =>
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
  requestMagicLink: (websiteId: string, email: string) =>
    api.post<{ sent: boolean }>(`/driving-school/${websiteId}/request-magic-link`, { email }).then((r) => r.data),
};
