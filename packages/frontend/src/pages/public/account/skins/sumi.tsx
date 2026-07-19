import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/sumi/sumi.css';
import './sumi.css';

/** sumi — a sumi-e (ink-wash) dashboard. The readiness panel is a brushed ENSO
 *  ring that draws itself to the completed percentage, with a vermilion HANKO
 *  seal stamping the student's initial. Lessons are calm ink-hairline rows.
 *  Warm washi paper, soft sumi ink, one vermilion accent. Scoped to .asu- and
 *  the template's --su-* vars. */
export default function SumiAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.max(0, Math.min(1, readiness.pct));
  const drawn = useDrawn();
  const initial = (student.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="asu">
      <header className="asu-head">
        <Link to={actions.siteHref} className="asu-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="asu-logo" />
          ) : (
            <span className="asu-hanko asu-hanko-sm" aria-hidden="true"><span className="asu-hanko-face">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span></span>
          )}
          <span className="asu-school">{data.schoolName}</span>
        </Link>
        <div className="asu-head-end">
          <span className="asu-welcome">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="su-btn su-btn-ghost su-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="asu-wrap">
        {/* NEXT LESSON */}
        <section className="asu-next">
          <p className="su-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
          {next ? (
            <div className="asu-next-body">
              <div className="asu-next-main">
                <div className="asu-next-date">{ui.formatDate(next.date)}</div>
                <div className="asu-next-time">{ui.slotRange(next.time, next.duration)}</div>
                <div className="asu-next-note">{next.duration} {t('minShort')} · {t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="su-btn su-btn-primary asu-next-cta">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          ) : (
            <div className="asu-next-empty">
              <p className="asu-muted">{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="su-btn su-btn-primary">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — the self-drawing enso + hanko (signature) */}
        <section className="asu-progress">
          <div className="asu-enso-wrap">
            <EnsoRing pct={pct} drawn={drawn} />
            <div className="asu-enso-center">
              <span className="asu-enso-num">{readiness.completed}</span>
              <span className="asu-enso-lbl">{t('lessonsCompleted')}</span>
            </div>
          </div>
          <div className="asu-readiness-copy">
            <p className="su-eyebrow">{t('readinessTitle')}</p>
            <div className="asu-facts">
              <div className="asu-fact">
                <span className="asu-hanko asu-hanko-seal" aria-hidden="true"><span className="asu-hanko-face">{initial}</span></span>
                <span className="asu-fact-body"><b>{Math.round(pct * 100)}%</b><span>{t('lessonsCompleted')}</span></span>
              </div>
              <div className="asu-fact"><span className="asu-fact-body"><b>{readiness.hoursDriven}</b><span>{t('hoursDriven')}</span></span></div>
              <div className="asu-fact"><span className="asu-fact-body"><b>{readiness.upcoming}</b><span>{t('statUpcoming')}</span></span></div>
              <div className="asu-fact"><span className="asu-fact-body"><b>{readiness.total}</b><span>{t('statTotal')}</span></span></div>
            </div>
          </div>
        </section>

        <div className="asu-grid">
          {/* UPCOMING */}
          <section className="asu-panel">
            <h2 className="asu-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="asu-muted asu-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="asu-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="asu-row">
                    <span className="asu-row-dot" aria-hidden="true" />
                    <span className="asu-row-date">{ui.formatDate(b.date)}</span>
                    <span className="asu-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="asu-panel">
            <h2 className="asu-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="asu-muted asu-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="asu-rows">
                {history.map((h) => (
                  <li key={h.id} className={`asu-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="asu-row-dot" aria-hidden="true" />
                    <span className="asu-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`asu-row-status ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="asu-grid">
          {/* CHAT */}
          <section className="asu-panel">
            <h2 className="asu-h2">{t('chatHeading')} {unread > 0 && <span className="asu-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'asu-chat', empty: 'asu-muted',
                bubbleMe: 'asu-bubble asu-bubble-me', bubbleThem: 'asu-bubble asu-bubble-them',
                time: 'asu-bubble-time', form: 'asu-chat-form', input: 'asu-input', send: 'su-btn su-btn-primary asu-send',
              }}
            />
          </section>

          {/* PROFILE */}
          <section className="asu-panel">
            <h2 className="asu-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'asu-profile', field: 'asu-field', label: 'asu-field-lbl', hint: 'asu-field-hint',
                input: 'asu-input', save: 'su-btn su-btn-primary asu-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/** A brushed enso that draws to `pct` (0..1). Uses pathLength="1" so the dash
 *  maths is unit-normalized; the arc reveals via stroke-dashoffset on mount. */
function EnsoRing({ pct, drawn }: { pct: number; drawn: boolean }) {
  const offset = drawn ? 1 - pct : 1;
  return (
    <svg className="asu-enso" viewBox="0 0 120 120" width="150" height="150" aria-hidden="true">
      <circle className="asu-enso-track" cx="60" cy="60" r="52" pathLength={1} />
      <circle
        className="asu-enso-arc"
        cx="60" cy="60" r="52"
        pathLength={1}
        style={{ strokeDashoffset: offset }}
        transform="rotate(-90 60 60)"
      />
    </svg>
  );
}

function useDrawn(): boolean {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return drawn;
}
