import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, CheckCircle2, Clock, LogOut, MapPin, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import './_default.css';

/** Portable, clean dashboard themed entirely from the normalized `--book-*`
 *  tokens, so it renders correctly for ANY template. Serves as the safety
 *  fallback and the structural reference every bespoke skin follows. */
export default function DefaultSkin({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, rest, history, messages, unread } = data;
  const initial = (student.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="acc-d">
      <header className="acc-d-head">
        <Link to={actions.siteHref} className="acc-d-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="acc-d-logo" /> : <span className="acc-d-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="acc-d-school">{data.schoolName}</span>
        </Link>
        <div className="acc-d-head-end">
          <div className="acc-d-who">
            <span className="acc-d-avatar" aria-hidden="true">{initial}</span>
            <span className="acc-d-name">{student.name}</span>
          </div>
          <button className="acc-d-signout" onClick={actions.logout}>
            <LogOut size={15} /> <span>{t('signOut')}</span>
          </button>
        </div>
      </header>

      <div className="acc-d-wrap">
        {/* Next lesson + book */}
        <section className="acc-d-hero">
          <div className="acc-d-hero-main">
            <p className="acc-d-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
            {next ? (
              <>
                <h1 className="acc-d-hero-date">{ui.formatDate(next.date)}</h1>
                <p className="acc-d-hero-time"><Clock size={16} /> {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                <p className="acc-d-hero-note">{t('arriveEarly')}</p>
              </>
            ) : (
              <p className="acc-d-hero-empty">{t('noUpcoming')}</p>
            )}
            <Link to={actions.bookHref} className="acc-d-book">
              {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
            </Link>
          </div>
        </section>

        {/* Progress & readiness — honest facts only */}
        <section className="acc-d-progress">
          <p className="acc-d-eyebrow">{t('readinessTitle')}</p>
          <ul className="acc-d-facts">
            <li><CheckCircle2 size={16} /><b>{readiness.completed}</b><span>{t('lessonsCompleted')}</span></li>
            <li><CalendarClock size={16} /><b>{readiness.upcoming}</b><span>{t('statUpcoming')}</span></li>
          </ul>
        </section>

        <div className="acc-d-grid">
          {/* Upcoming */}
          <section className="acc-d-panel">
            <h2 className="acc-d-h2">{t('upcomingTitle')}</h2>
            {rest.length === 0 && !next ? (
              <p className="acc-d-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="acc-d-rows">
                {(next ? [next, ...rest] : rest).map((b) => (
                  <li key={b.id} className="acc-d-row">
                    <span className="acc-d-row-date"><MapPin size={14} /> {ui.formatDate(b.date)}</span>
                    <span className="acc-d-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History / timeline */}
          <section className="acc-d-panel">
            <h2 className="acc-d-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="acc-d-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="acc-d-timeline">
                {history.map((h) => (
                  <li key={h.id} className={`acc-d-tl ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="acc-d-tl-dot" aria-hidden="true" />
                    <span className="acc-d-tl-date">{ui.formatDate(h.date)}</span>
                    <span className="acc-d-tl-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className="acc-d-tl-status">{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="acc-d-grid">
          {/* Chat */}
          <section className="acc-d-panel">
            <h2 className="acc-d-h2">{t('chatHeading')} {unread > 0 && <span className="acc-d-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'acc-d-chat', empty: 'acc-d-muted',
                bubbleMe: 'acc-d-bubble acc-d-bubble-me', bubbleThem: 'acc-d-bubble acc-d-bubble-them',
                time: 'acc-d-bubble-time', form: 'acc-d-chat-form', input: 'acc-d-input', send: 'acc-d-chat-send',
              }}
            />
          </section>

          {/* Profile */}
          <section className="acc-d-panel">
            <h2 className="acc-d-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'acc-d-profile', field: 'acc-d-field', label: 'acc-d-field-lbl', hint: 'acc-d-field-hint',
                input: 'acc-d-input', save: 'acc-d-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
