import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/slate/slate.css';
import './slate.css';

/** slate — the chalkboard classroom. Everything is written in chalk on a
 *  slate-green board: the next lesson chalked large in serif, readiness as a
 *  chalk-drawn progress bar, upcoming/history as chalk-ledger rows, all resting
 *  on a warm wooden chalk-ledge. Handwriting (Caveat) for the annotations. */
export default function SlateAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="ast">
      <header className="ast-head">
        <Link to={actions.siteHref} className="ast-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="ast-logo" /> : <span className="ast-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="ast-school">{data.schoolName}</span>
        </Link>
        <div className="ast-head-end">
          <span className="ast-hi ast-script">{t('welcomeBack')} · {student.name}</span>
          <button className="st-btn st-btn-ghost st-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>
      <div className="ast-ledge" aria-hidden="true">
        <span className="ast-ledge-wood" />
        <span className="ast-chalk ast-chalk-a" /><span className="ast-chalk ast-chalk-b" /><span className="ast-chalk ast-chalk-c" />
        <span className="ast-ledge-eraser" />
      </div>

      <div className="ast-wrap">
        {/* Next lesson — chalked large */}
        <section className="ast-panel ast-next">
          <p className="ast-eyebrow ast-script">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
          {next ? (
            <div className="ast-next-body">
              <div>
                <h1 className="ast-next-date">{ui.formatDate(next.date)}</h1>
                <svg className="ast-underline" viewBox="0 0 320 14" preserveAspectRatio="none" aria-hidden="true"><path className="ast-uline" d="M4 9 Q80 3 160 8 T316 6" /></svg>
                <p className="ast-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                <p className="ast-next-note">{t('arriveEarly')}</p>
              </div>
              <Link to={actions.bookHref} className="st-btn st-btn-primary ast-book">{t('bookLesson')} <ArrowRight size={16} className="book-arrow" /></Link>
            </div>
          ) : (
            <div className="ast-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="st-btn st-btn-primary ast-book">{t('bookLesson')} <ArrowRight size={16} className="book-arrow" /></Link>
            </div>
          )}
        </section>

        {/* Readiness — chalk-drawn progress bar */}
        <section className="ast-panel ast-progress">
          <p className="ast-eyebrow ast-script">{t('readinessTitle')}</p>
          <div className="ast-tiles">
            <ChalkStat value={readiness.completed} label={t('lessonsCompleted')} />
            <ChalkStat value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="ast-grid">
          {/* Upcoming */}
          <section className="ast-panel">
            <h2 className="ast-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="ast-empty ast-script">{t('noUpcoming')}</p>
            ) : (
              <ul className="ast-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="ast-row">
                    <span className="ast-bullet" aria-hidden="true" />
                    <span className="ast-row-date">{ui.formatDate(b.date)}</span>
                    <span className="ast-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History */}
          <section className="ast-panel">
            <h2 className="ast-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="ast-empty ast-script">{t('historyEmpty')}</p>
            ) : (
              <ul className="ast-rows">
                {history.map((h) => (
                  <li key={h.id} className={`ast-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className={`ast-tick ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`} aria-hidden="true" />
                    <span className="ast-row-date">{ui.formatDate(h.date)}</span>
                    <span className="ast-row-status">{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="ast-grid">
          {/* Chat */}
          <section className="ast-panel">
            <h2 className="ast-h2">{t('chatHeading')} {unread > 0 && <span className="ast-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'ast-chat', empty: 'ast-empty ast-script', bubbleMe: 'ast-bubble ast-bubble-me', bubbleThem: 'ast-bubble ast-bubble-them', time: 'ast-bubble-time', form: 'ast-chat-form', input: 'ast-input', send: 'st-btn st-btn-primary ast-send' }}
            />
          </section>

          {/* Profile */}
          <section className="ast-panel">
            <h2 className="ast-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'ast-profile', field: 'ast-field', label: 'ast-field-lbl', hint: 'ast-field-hint', input: 'ast-input', save: 'st-btn st-btn-primary ast-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function ChalkStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="ast-tile">
      <span className="ast-tile-num">{value}</span>
      <span className="ast-tile-lbl ast-script">{label}</span>
    </div>
  );
}
