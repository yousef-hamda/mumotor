import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/press/press.css';
import './press.css';

/** press — a letterpress-printed prospectus dashboard. Type debossed into warm
 *  cotton paper, bottle-green ink + copper ornaments. The readiness panel is a
 *  printed GAUGE (a debossed rule with copper tick figures) beside a copper WAX
 *  SEAL; lessons are ruled prospectus rows with dotted copper leaders. Scoped to
 *  .aps- and the template's --ps-* vars. */
export default function PressAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const initial = (student.name || 'S').charAt(0).toUpperCase();

  return (
    <div className="aps">
      <header className="aps-head">
        <Link to={actions.siteHref} className="aps-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="aps-logo" />
          ) : (
            <span className="aps-seal aps-seal-sm" aria-hidden="true"><span className="aps-seal-initial">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span></span>
          )}
          <span className="aps-school">{data.schoolName}</span>
        </Link>
        <div className="aps-head-end">
          <span className="aps-welcome">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="ps-btn ps-btn-ghost ps-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="aps-wrap">
        {/* NEXT LESSON */}
        <section className="aps-next">
          <span className="aps-folio">{next ? t('yourNextLesson') : t('upcomingTitle')}</span>
          {next ? (
            <div className="aps-next-body">
              <div className="aps-next-main">
                <div className="aps-next-date">{ui.formatDate(next.date)}</div>
                <div className="aps-next-time">{ui.slotRange(next.time, next.duration)}</div>
                <div className="aps-next-note">{next.duration} {t('minShort')} · {t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="ps-btn ps-btn-primary aps-next-cta">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          ) : (
            <div className="aps-next-empty">
              <p className="aps-muted">{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="ps-btn ps-btn-primary">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — printed gauge + wax seal (signature) */}
        <section className="aps-panel aps-progress">
          <div className="aps-progress-seal">
            <span className="aps-seal aps-seal-lg" aria-hidden="true"><span className="aps-seal-initial">{initial}</span></span>
          </div>
          <div className="aps-progress-body">
            <span className="aps-folio">{t('readinessTitle')}</span>
            <div className="aps-figures">
              <Figure value={readiness.completed} label={t('lessonsCompleted')} />
              <Figure value={readiness.upcoming} label={t('statUpcoming')} />
            </div>
          </div>
        </section>

        <div className="aps-grid">
          {/* UPCOMING */}
          <section className="aps-panel">
            <h2 className="aps-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="aps-muted aps-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="aps-index">
                {upcoming.map((b) => (
                  <li key={b.id} className="aps-index-row">
                    <span className="aps-index-date">{ui.formatDate(b.date)}</span>
                    <span className="aps-leader" aria-hidden="true" />
                    <span className="aps-index-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="aps-panel">
            <h2 className="aps-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="aps-muted aps-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="aps-index">
                {history.map((h) => (
                  <li key={h.id} className={`aps-index-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="aps-index-date">{ui.formatDate(h.date)}</span>
                    <span className="aps-leader" aria-hidden="true" />
                    <span className={`aps-stamp ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="aps-grid">
          {/* CHAT */}
          <section className="aps-panel">
            <h2 className="aps-h2">{t('chatHeading')} {unread > 0 && <span className="aps-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'aps-chat', empty: 'aps-muted',
                bubbleMe: 'aps-bubble aps-bubble-me', bubbleThem: 'aps-bubble aps-bubble-them',
                time: 'aps-bubble-time', form: 'aps-chat-form', input: 'aps-input', send: 'ps-btn ps-btn-primary aps-send',
              }}
            />
          </section>

          {/* PROFILE */}
          <section className="aps-panel">
            <h2 className="aps-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'aps-profile', field: 'aps-field', label: 'aps-field-lbl', hint: 'aps-field-hint',
                input: 'aps-input', save: 'ps-btn ps-btn-primary aps-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="aps-figure">
      <span className="aps-figure-num">{value}</span>
      <span className="aps-figure-lbl">{label}</span>
    </div>
  );
}

