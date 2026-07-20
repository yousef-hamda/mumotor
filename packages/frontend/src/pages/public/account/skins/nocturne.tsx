import { Link } from 'react-router-dom';
import { Send, LogOut, ArrowRight } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/nocturne/nocturne.css';
import './nocturne.css';

/** nocturne — celestial night-drive navigation. The dashboard charts the student's
 *  course: readiness is a pair of starlit figures; the next lesson is the next
 *  waypoint; upcoming and history are the plotted course log. Midnight indigo,
 *  brass-gold starlight. */
export default function NocturneAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
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

        {/* READINESS — starlit figures */}
        <section className="anc-readiness">
          <span className="nc-eyebrow anc-readiness-eyebrow">{t('readinessTitle')}</span>
          <ul className="anc-figures">
            <li className="anc-figure">
              <span className="anc-figure-num">{readiness.completed}</span>
              <span className="anc-figure-lbl">{t('lessonsCompleted')}</span>
            </li>
            <li className="anc-figure">
              <span className="anc-figure-num">{readiness.upcoming}</span>
              <span className="anc-figure-lbl">{t('statUpcoming')}</span>
            </li>
          </ul>
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
