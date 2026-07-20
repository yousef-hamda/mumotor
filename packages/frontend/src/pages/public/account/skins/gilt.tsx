import { Link } from 'react-router-dom';
import { Send, LogOut, ArrowRight } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/gilt/gilt.css';
import './gilt.css';

/** gilt — a foil-stamped invitation from a prestige marque. The dashboard reads
 *  like a private members' folio: a wax-seal header, the next lesson engraved on a
 *  gold-keyline plate, readiness shown as a champagne-gold foil progress bar with
 *  serif foil figures, and upcoming/history as ruled ledger entries. */
export default function GiltAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const initial = (data.schoolName || 'M').charAt(0).toUpperCase();

  return (
    <div className="agt">
      <header className="agt-head">
        <Link to={actions.siteHref} className="agt-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="agt-logo" />
          ) : (
            <span className="gt-seal agt-seal" aria-hidden="true">
              <span className="gt-seal-initial">{initial}</span>
            </span>
          )}
          <span className="agt-school">{data.schoolName}</span>
        </Link>
        <div className="agt-head-end">
          <span className="agt-who">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="gt-btn gt-btn-ghost gt-btn-sm" onClick={actions.logout}>
            <LogOut size={14} /> {t('signOut')}
          </button>
        </div>
      </header>

      <div className="agt-wrap">
        {/* NEXT — engraved plate */}
        <section className="agt-next">
          <div className="agt-next-head">
            <span className="gt-eyebrow agt-next-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</span>
            <span className="gt-rule agt-next-rule" aria-hidden="true" />
          </div>
          {next ? (
            <div className="agt-next-body">
              <div className="agt-next-time gt-foil">{next.time}</div>
              <div className="agt-next-meta">
                <div className="agt-next-date">{ui.formatDate(next.date)}</div>
                <div className="agt-next-sub">
                  {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}
                </div>
                <div className="agt-next-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="gt-btn gt-btn-primary agt-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="agt-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="gt-btn gt-btn-primary agt-cta">
                {t('bookLesson')} <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — foil figures */}
        <section className="agt-readiness">
          <div className="agt-readiness-head">
            <span className="gt-eyebrow agt-readiness-eyebrow">{t('readinessTitle')}</span>
            <span className="gt-rule agt-readiness-rule" aria-hidden="true" />
          </div>
          <ul className="agt-figures">
            <li className="agt-figure">
              <span className="agt-figure-num gt-foil">{readiness.completed}</span>
              <span className="agt-figure-lbl">{t('lessonsCompleted')}</span>
            </li>
            <li className="agt-figure">
              <span className="agt-figure-num gt-foil">{readiness.upcoming}</span>
              <span className="agt-figure-lbl">{t('statUpcoming')}</span>
            </li>
          </ul>
        </section>

        <div className="agt-grid">
          {/* Upcoming ledger */}
          <section className="agt-board">
            <h2 className="agt-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="agt-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="agt-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="agt-row">
                    <span className="agt-row-marker" aria-hidden="true" />
                    <span className="agt-row-time">{b.time}</span>
                    <span className="agt-row-date">{ui.formatDate(b.date)}</span>
                    <span className="agt-row-tag is-on">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History ledger */}
          <section className="agt-board">
            <h2 className="agt-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="agt-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="agt-rows">
                {history.map((h) => (
                  <li key={h.id} className="agt-row">
                    <span className="agt-row-marker" aria-hidden="true" />
                    <span className="agt-row-time">{h.time}</span>
                    <span className="agt-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`agt-row-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="agt-grid">
          {/* Chat */}
          <section className="agt-panel">
            <h2 className="agt-h2">
              {t('chatHeading')} {unread > 0 && <span className="agt-badge">{unread}</span>}
            </h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'agt-chat',
                empty: 'agt-empty',
                bubbleMe: 'agt-bubble agt-bubble-me',
                bubbleThem: 'agt-bubble agt-bubble-them',
                time: 'agt-bubble-time',
                form: 'agt-chat-form',
                input: 'agt-input',
                send: 'gt-btn gt-btn-primary agt-send',
              }}
            />
          </section>

          {/* Profile */}
          <section className="agt-panel">
            <h2 className="agt-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'agt-profile',
                field: 'agt-field',
                label: 'agt-field-lbl',
                hint: 'agt-field-hint',
                input: 'agt-input',
                save: 'gt-btn gt-btn-primary agt-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
