import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../lib/utils';
import { formatDateLongIn } from '../../../lib/utils';
import { bookT, type BookLocale } from '../../../lib/bookingStrings';
import type { ChatThreadProps, ProfileFormProps } from './types';

/** "08:00" + 45 → "08:00 – 08:45". */
export function slotRange(start: string, dur: number): string {
  const [h, m] = start.split(':').map(Number);
  const t = (h || 0) * 60 + (m || 0) + dur;
  const end = `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  return `${start} – ${end}`;
}

export function formatDate(iso: string, L: BookLocale): string {
  return formatDateLongIn(iso, L);
}

/** Localized "Jul 3, 14:30" for chat bubbles — words localize, digits stay Latin. */
export function formatMsgTime(iso: string, L: BookLocale): string {
  return new Date(iso).toLocaleString(L === 'he' ? 'he' : L === 'ar' ? 'ar' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    calendar: 'gregory',
    numberingSystem: 'latn',
  });
}

/**
 * Headless two-way chat: manages the draft, auto-scroll, and seen-marking. Skins
 * pass their own class names so it looks native to each template. STABLE
 * module-level component → its draft survives the 8s message-poll refetch.
 */
export function ChatThread({ messages, loading, onSend, sending, onSeen, L, classNames, placeholder, sendLabel, sendIcon }: ChatThreadProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length) onSeen();
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    onSend(body);
    setDraft('');
  };

  return (
    <>
      <div className={classNames?.root} ref={scrollRef}>
        {loading ? (
          <p className={classNames?.empty}>{bookT(L, 'loadingMessages')}</p>
        ) : messages.length === 0 ? (
          <p className={classNames?.empty}>{bookT(L, 'chatEmpty')}</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={cn(m.sender === 'STUDENT' ? classNames?.bubbleMe : classNames?.bubbleThem)}>
              <span>{m.body}</span>
              <span className={classNames?.time}>{formatMsgTime(m.createdAt, L)}</span>
            </div>
          ))
        )}
      </div>
      <form className={classNames?.form} onSubmit={submit}>
        <input
          className={classNames?.input}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder ?? bookT(L, 'phMessage')}
          maxLength={2000}
          aria-label={bookT(L, 'chatHeading')}
        />
        <button type="submit" className={classNames?.send} disabled={sending} aria-label={sendLabel ?? bookT(L, 'send')}>
          {sendIcon ?? bookT(L, 'send')}
        </button>
      </form>
    </>
  );
}

/**
 * Headless profile form: name/email read-only, phone editable (same regex + save
 * rules as before). Skins pass class names. STABLE module-level component.
 */
export function ProfileForm({ student, onSave, saving, L, classNames }: ProfileFormProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const phoneValue = phone ?? student.phone ?? '';

  const save = () => {
    if (!/^[+\d][\d\s-]{6,18}$/.test(phoneValue.trim())) return;
    onSave(phoneValue.trim());
  };

  const field = (label: string, node: React.ReactNode, hint?: string) => (
    <label className={classNames?.field}>
      <span className={classNames?.label}>{label}</span>
      {node}
      {hint && <span className={classNames?.hint}>{hint}</span>}
    </label>
  );

  return (
    <div className={classNames?.root}>
      {field(bookT(L, 'nameLabel'), <input className={classNames?.input} value={student.name} disabled />)}
      {field(bookT(L, 'emailLabel'), <input className={classNames?.input} value={student.email} disabled />)}
      {field(
        bookT(L, 'phoneLabel'),
        <input
          className={classNames?.input}
          type="tel"
          value={phoneValue}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={bookT(L, 'phPhone')}
        />,
        bookT(L, 'phoneHint')
      )}
      <button className={classNames?.save} disabled={saving || phone === null} onClick={save}>
        {bookT(L, 'saveChanges')}
      </button>
    </div>
  );
}
