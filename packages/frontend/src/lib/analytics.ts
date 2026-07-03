import { api } from './api';

export type EventName =
  | 'wizard_started'
  | 'wizard_step_completed'
  | 'template_chosen'
  | 'site_published'
  | 'enroll_completed'
  | 'booking_created'
  | 'review_submitted';

const SID_KEY = 'mm_sid';

function sessionId(): string {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return 'anon';
  }
}

/**
 * Fire-and-forget product event. Never throws, never blocks the UI, silently
 * no-ops outside the browser (tests). Conversion events (publish/enroll/book/
 * review) are logged server-side — the client only reports wizard-funnel steps.
 */
export function track(name: EventName, props?: Record<string, string | number>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload = { name, props, sessionId: sessionId() };
    api.post('/events', payload).catch(() => undefined);
  } catch {
    /* analytics must never break the app */
  }
}
