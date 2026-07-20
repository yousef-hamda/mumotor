import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/meridian/meridian.css';
import './meridian.css';

/** meridian — a topographic survey-sheet dashboard. The readiness panel logs two
 *  cartographic readings — lessons completed and lessons upcoming — as surveyed
 *  plots; lessons are cartographic atlas-plate rows annotated in mono coordinates
 *  with a legend key. Survey paper, engraved ink, one magenta route. Scoped to
 *  .amr- and the template's --mr-* vars. */
export default function MeridianAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="amr">
      <header className="amr-head">
        <Link to={actions.siteHref} className="amr-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="amr-logo" />
          ) : (
            <span className="amr-mark" aria-hidden="true">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>
          )}
          <span className="amr-school">{data.schoolName}</span>
        </Link>
        <div className="amr-head-end">
          <span className="amr-welcome">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="mr-btn mr-btn-ghost mr-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="amr-wrap">
        {/* NEXT LESSON */}
        <section className="amr-next">
          <p className="mr-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
          {next ? (
            <div className="amr-next-body">
              <div className="amr-next-main">
                <div className="amr-next-date">{ui.formatDate(next.date)}</div>
                <div className="amr-next-time">{ui.slotRange(next.time, next.duration)}</div>
                <div className="amr-next-note">{next.duration} {t('minShort')} · {t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="mr-btn mr-btn-primary amr-next-cta">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          ) : (
            <div className="amr-next-empty">
              <p className="amr-muted">{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="mr-btn mr-btn-primary">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — surveyed plots */}
        <section className="amr-panel amr-progress mr-crop">
          <div className="amr-progress-head">
            <p className="mr-eyebrow">{t('readinessTitle')}</p>
          </div>
          <div className="amr-plots">
            <Plot value={readiness.completed} label={t('lessonsCompleted')} />
            <Plot value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="amr-grid">
          {/* UPCOMING */}
          <section className="amr-panel">
            <h2 className="amr-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="amr-muted amr-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="amr-rows">
                {upcoming.map((b, i) => (
                  <li key={b.id} className="amr-row">
                    <span className="amr-row-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className="mr-key" aria-hidden="true" />
                    <span className="amr-row-date">{ui.formatDate(b.date)}</span>
                    <span className="amr-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="amr-panel">
            <h2 className="amr-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="amr-muted amr-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="amr-rows">
                {history.map((h, i) => (
                  <li key={h.id} className={`amr-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="amr-row-idx">{String(i + 1).padStart(2, '0')}</span>
                    <span className={`amr-row-key ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`} aria-hidden="true" />
                    <span className="amr-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`amr-row-status ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="amr-grid">
          {/* CHAT */}
          <section className="amr-panel">
            <h2 className="amr-h2">{t('chatHeading')} {unread > 0 && <span className="amr-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'amr-chat', empty: 'amr-muted',
                bubbleMe: 'amr-bubble amr-bubble-me', bubbleThem: 'amr-bubble amr-bubble-them',
                time: 'amr-bubble-time', form: 'amr-chat-form', input: 'amr-input', send: 'mr-btn mr-btn-primary amr-send',
              }}
            />
          </section>

          {/* PROFILE */}
          <section className="amr-panel">
            <h2 className="amr-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'amr-profile', field: 'amr-field', label: 'amr-field-lbl', hint: 'amr-field-hint',
                input: 'amr-input', save: 'mr-btn mr-btn-primary amr-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Plot({ value, label }: { value: number; label: string }) {
  return (
    <div className="amr-plot">
      <span className="amr-plot-num">{value}</span>
      <span className="amr-plot-lbl">{label}</span>
    </div>
  );
}
