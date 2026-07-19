import { Link } from 'react-router-dom';
import { ArrowRight, CalendarClock, Clock, Gauge, LogOut, Send, Timer } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/mumotor/mumotor.css';
import './mumotor.css';

/** mumotor — the brand's Apple-minimal look. Pure white, one calm blue accent,
 *  soft aurora, generous whitespace. The signature readiness device is a clean
 *  SVG progress ring. This is the clean reference skin. */
export default function MumotorAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const initial = (student.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="amm">
      <div className="amm-bg" aria-hidden="true">
        <span className="amm-orb amm-orb-1" />
        <span className="amm-orb amm-orb-2" />
      </div>

      <header className="amm-head">
        <Link to={actions.siteHref} className="amm-brand" aria-label={data.schoolName}>
          {data.logoSrc
            ? <img src={data.logoSrc} alt="" className="amm-logo" />
            : <span className="amm-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="amm-school">{data.schoolName}</span>
        </Link>
        <div className="amm-head-end">
          <span className="amm-who"><span className="amm-avatar" aria-hidden="true">{initial}</span><span className="amm-name">{student.name}</span></span>
          <button className="amm-signout" onClick={actions.logout}><LogOut size={15} /> <span>{t('signOut')}</span></button>
        </div>
      </header>

      <div className="amm-wrap">
        {/* NEXT LESSON */}
        <section className="amm-next">
          <p className="mm-eyebrow amm-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
          {next ? (
            <>
              <h1 className="amm-next-date">{ui.formatDate(next.date)}</h1>
              <p className="amm-next-time"><Clock size={16} /> {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
              <p className="amm-next-note">{t('arriveEarly')}</p>
            </>
          ) : (
            <p className="amm-next-empty">{t('noUpcoming')}</p>
          )}
          <Link to={actions.bookHref} className="mm-btn mm-btn-primary amm-book">
            {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
          </Link>
        </section>

        {/* READINESS — clean SVG progress ring */}
        <section className="amm-progress">
          <div className="amm-ring-wrap">
            <ProgressRing pct={readiness.pct} />
            <div className="amm-ring-center">
              <span className="amm-ring-num">{readiness.completed}</span>
              <span className="amm-ring-lbl">{t('lessonsCompleted')}</span>
            </div>
          </div>
          <ul className="amm-facts">
            <li><Gauge size={16} /><b>{readiness.hoursDriven}</b><span>{t('hoursDriven')}</span></li>
            <li><CalendarClock size={16} /><b>{readiness.upcoming}</b><span>{t('statUpcoming')}</span></li>
            <li><Timer size={16} /><b>{readiness.total}</b><span>{t('statTotal')}</span></li>
          </ul>
        </section>

        <div className="amm-grid">
          {/* UPCOMING */}
          <section className="amm-panel">
            <h2 className="amm-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="amm-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="amm-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="amm-row">
                    <span className="amm-row-date">{ui.formatDate(b.date)}</span>
                    <span className="amm-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="amm-panel">
            <h2 className="amm-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="amm-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="amm-timeline">
                {history.map((h) => (
                  <li key={h.id} className={`amm-tl ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="amm-tl-dot" aria-hidden="true" />
                    <span className="amm-tl-date">{ui.formatDate(h.date)}</span>
                    <span className="amm-tl-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className="amm-tl-status">{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="amm-grid">
          {/* CHAT */}
          <section className="amm-panel">
            <h2 className="amm-h2">{t('chatHeading')} {unread > 0 && <span className="amm-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'amm-chat', empty: 'amm-muted', bubbleMe: 'amm-bubble amm-bubble-me', bubbleThem: 'amm-bubble amm-bubble-them', time: 'amm-bubble-time', form: 'amm-chat-form', input: 'amm-input', send: 'amm-chat-send' }}
            />
          </section>

          {/* PROFILE */}
          <section className="amm-panel">
            <h2 className="amm-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'amm-profile', field: 'amm-field', label: 'amm-field-lbl', hint: 'amm-field-hint', input: 'amm-input', save: 'mm-btn mm-btn-primary amm-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return (
    <svg className="amm-ring" viewBox="0 0 110 110" aria-hidden="true">
      <circle cx="55" cy="55" r={r} className="amm-ring-bg" />
      <circle cx="55" cy="55" r={r} className="amm-ring-fg" strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 55 55)" />
    </svg>
  );
}
