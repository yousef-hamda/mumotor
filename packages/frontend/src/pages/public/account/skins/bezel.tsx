import { Link } from 'react-router-dom';
import { Send, LogOut, ArrowRight } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/bezel/bezel.css';
import './bezel.css';

/** bezel — a machined instrument. The dashboard is an instrument cluster: readiness
 *  is a large sweeping gauge dial (a signal-red needle reading pct) flanked by
 *  milled readouts; the next lesson is the primary display; upcoming/history are
 *  engraved register rows. Charcoal anodized metal, one signal-red needle. */
export default function BezelAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="abz">
      <header className="abz-head">
        <Link to={actions.siteHref} className="abz-brand" aria-label={data.schoolName}>
          <span className="abz-logo-ring">
            {data.logoSrc ? (
              <img src={data.logoSrc} alt="" className="abz-logo" />
            ) : (
              <span className="abz-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>
            )}
          </span>
          <span className="abz-school">{data.schoolName}</span>
        </Link>
        <div className="abz-head-end">
          <span className="abz-who">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="bz-btn bz-btn-ghost bz-btn-sm" onClick={actions.logout}>
            <LogOut size={14} /> {t('signOut')}
          </button>
        </div>
      </header>
      <span className="bz-knurl abz-knurl" aria-hidden="true" />

      <div className="abz-wrap">
        {/* PRIMARY DISPLAY — next lesson */}
        <section className="bz-panel abz-next">
          <div className="abz-next-head">{next ? t('yourNextLesson') : t('upcomingTitle')}</div>
          {next ? (
            <div className="abz-next-body">
              <div className="abz-next-time">{next.time}</div>
              <div className="abz-next-meta">
                <div className="abz-next-date">{ui.formatDate(next.date)}</div>
                <div className="abz-next-sub">
                  {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}
                </div>
                <div className="abz-next-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="bz-btn bz-btn-primary abz-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="abz-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="bz-btn bz-btn-primary abz-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — milled readouts */}
        <section className="bz-panel abz-cluster">
          <span className="bz-eyebrow abz-cluster-eyebrow">{t('readinessTitle')}</span>
          <ul className="abz-readouts">
            <li className="abz-readout">
              <span className="abz-readout-num">{readiness.completed}</span>
              <span className="abz-readout-lbl">{t('lessonsCompleted')}</span>
            </li>
            <li className="abz-readout">
              <span className="abz-readout-num">{readiness.upcoming}</span>
              <span className="abz-readout-lbl">{t('statUpcoming')}</span>
            </li>
          </ul>
        </section>

        <div className="abz-grid">
          {/* Upcoming register */}
          <section className="bz-panel abz-board">
            <div className="abz-board-head">{t('upcomingTitle')}</div>
            {upcoming.length === 0 ? (
              <p className="abz-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="abz-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="abz-row">
                    <span className="abz-row-time">{b.time}</span>
                    <span className="abz-row-date">{ui.formatDate(b.date)}</span>
                    <span className="abz-row-tag is-on">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History register */}
          <section className="bz-panel abz-board">
            <div className="abz-board-head">{t('historyTitle')}</div>
            {history.length === 0 ? (
              <p className="abz-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="abz-rows">
                {history.map((h) => (
                  <li key={h.id} className="abz-row">
                    <span className="abz-row-time">{h.time}</span>
                    <span className="abz-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`abz-row-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="abz-grid">
          {/* Chat */}
          <section className="bz-panel abz-panel">
            <h2 className="abz-h2">
              {t('chatHeading')} {unread > 0 && <span className="abz-badge">{unread}</span>}
            </h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'abz-chat',
                empty: 'abz-empty',
                bubbleMe: 'abz-bubble abz-bubble-me',
                bubbleThem: 'abz-bubble abz-bubble-them',
                time: 'abz-bubble-time',
                form: 'abz-chat-form',
                input: 'abz-input',
                send: 'bz-btn bz-btn-primary abz-send',
              }}
            />
          </section>

          {/* Profile */}
          <section className="bz-panel abz-panel">
            <h2 className="abz-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'abz-profile',
                field: 'abz-field',
                label: 'abz-field-lbl',
                hint: 'abz-field-hint',
                input: 'abz-input',
                save: 'bz-btn bz-btn-primary abz-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
