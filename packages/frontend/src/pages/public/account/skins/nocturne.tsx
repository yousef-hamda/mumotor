import { Link } from 'react-router-dom';
import { Send, LogOut, ArrowRight } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/nocturne/nocturne.css';
import './nocturne.css';

/** nocturne — celestial night-drive navigation. The dashboard charts the student's
 *  course: readiness is a constellation whose completed lessons light as connected
 *  gold stars over a pct arc; the next lesson is the next waypoint; upcoming and
 *  history are the plotted course log. Midnight indigo, brass-gold starlight. */
const STARS: [number, number][] = [
  [22, 120],
  [64, 72],
  [112, 102],
  [156, 44],
  [204, 86],
  [250, 40],
  [290, 96],
];
const ARC_R = 46;
const ARC_C = 2 * Math.PI * ARC_R;

export default function NocturneAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.max(0, Math.min(1, readiness.pct));
  const pctInt = Math.round(pct * 100);
  const lit = Math.max(0, Math.min(STARS.length, readiness.completed));
  const dimLine = STARS.map(([x, y]) => `${x},${y}`).join(' ');
  const litLine = STARS.slice(0, Math.max(1, lit)).map(([x, y]) => `${x},${y}`).join(' ');
  const initial = (data.schoolName || 'M').charAt(0).toUpperCase();

  return (
    <div className="anc">
      <header className="anc-head">
        <Link to={actions.siteHref} className="anc-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="anc-logo" />
          ) : (
            <span className="anc-mark">{initial}</span>
          )}
          <span className="anc-school">{data.schoolName}</span>
        </Link>
        <div className="anc-head-end">
          <span className="anc-who">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="nc-btn nc-btn-ghost nc-btn-sm" onClick={actions.logout}>
            <LogOut size={14} /> {t('signOut')}
          </button>
        </div>
      </header>

      <div className="anc-wrap">
        {/* NEXT WAYPOINT */}
        <section className="anc-next">
          <div className="anc-next-head">
            <span className="anc-star-glyph" aria-hidden="true">✦</span>
            {next ? t('yourNextLesson') : t('upcomingTitle')}
          </div>
          {next ? (
            <div className="anc-next-body">
              <div className="anc-next-time">{next.time}</div>
              <div className="anc-next-meta">
                <div className="anc-next-date">{ui.formatDate(next.date)}</div>
                <div className="anc-next-sub">
                  {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}
                </div>
                <div className="anc-next-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="nc-btn nc-btn-primary anc-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="anc-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="nc-btn nc-btn-primary anc-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — constellation + arc */}
        <section className="anc-readiness">
          <span className="nc-eyebrow anc-readiness-eyebrow">{t('readinessTitle')}</span>
          <div className="anc-readiness-body">
            <div className="anc-arc">
              <svg viewBox="0 0 110 110" className="anc-arc-svg" aria-hidden="true">
                <circle cx="55" cy="55" r={ARC_R} className="anc-arc-bg" />
                <circle
                  cx="55"
                  cy="55"
                  r={ARC_R}
                  className="anc-arc-fg"
                  strokeDasharray={ARC_C}
                  strokeDashoffset={ARC_C * (1 - pct)}
                  transform="rotate(-90 55 55)"
                />
              </svg>
              <div className="anc-arc-read">
                <span className="anc-arc-pct">{pctInt}%</span>
                <span className="anc-arc-lbl">{t('lessonsCompleted')}</span>
              </div>
            </div>

            <div className="anc-const-col">
              <svg viewBox="0 0 312 160" className="anc-const" role="img" aria-label={t('readinessTitle')}>
                <polyline className="anc-const-dim" points={dimLine} />
                {lit >= 1 && <polyline className="anc-const-lit" points={litLine} />}
                {STARS.map(([x, y], i) => (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={i < lit ? 4 : 2.5}
                      className={i < lit ? 'anc-star-on' : 'anc-star-off'}
                    />
                  </g>
                ))}
              </svg>
              <ul className="anc-figures">
                <li className="anc-figure">
                  <span className="anc-figure-num">{readiness.completed}</span>
                  <span className="anc-figure-lbl">{t('lessonsCompleted')}</span>
                </li>
                <li className="anc-figure">
                  <span className="anc-figure-num">{readiness.hoursDriven}</span>
                  <span className="anc-figure-lbl">{t('hoursDriven')}</span>
                </li>
                <li className="anc-figure">
                  <span className="anc-figure-num">{readiness.upcoming}</span>
                  <span className="anc-figure-lbl">{t('statUpcoming')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <div className="anc-grid">
          {/* Upcoming course log */}
          <section className="anc-board">
            <h2 className="anc-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="anc-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="anc-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="anc-row">
                    <span className="anc-row-star" aria-hidden="true">✦</span>
                    <span className="anc-row-time">{b.time}</span>
                    <span className="anc-row-date">{ui.formatDate(b.date)}</span>
                    <span className="anc-row-tag is-on">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History course log */}
          <section className="anc-board">
            <h2 className="anc-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="anc-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="anc-rows">
                {history.map((h) => (
                  <li key={h.id} className="anc-row">
                    <span className={`anc-row-star ${h.status === 'CANCELLED' ? 'is-dim' : ''}`} aria-hidden="true">✦</span>
                    <span className="anc-row-time">{h.time}</span>
                    <span className="anc-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`anc-row-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="anc-grid">
          {/* Chat */}
          <section className="anc-panel">
            <h2 className="anc-h2">
              {t('chatHeading')} {unread > 0 && <span className="anc-badge">{unread}</span>}
            </h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'anc-chat',
                empty: 'anc-empty',
                bubbleMe: 'anc-bubble anc-bubble-me',
                bubbleThem: 'anc-bubble anc-bubble-them',
                time: 'anc-bubble-time',
                form: 'anc-chat-form',
                input: 'anc-input',
                send: 'nc-btn nc-btn-primary anc-send',
              }}
            />
          </section>

          {/* Profile */}
          <section className="anc-panel">
            <h2 className="anc-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'anc-profile',
                field: 'anc-field',
                label: 'anc-field-lbl',
                hint: 'anc-field-hint',
                input: 'anc-input',
                save: 'nc-btn nc-btn-primary anc-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
