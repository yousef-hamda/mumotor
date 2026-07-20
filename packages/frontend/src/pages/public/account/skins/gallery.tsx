import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/gallery/gallery.css';
import './gallery.css';

/** gallery — the museum exhibition. The student's progress is hung as fine-art:
 *  the next lesson is the featured work on a museum wall-label, readiness is an
 *  exhibition placard with an ochre progress rule, upcoming/history are framed
 *  wall-labels. Warm gallery wall, museum ochre accent, a soft spotlight. */
export default function GalleryAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.max(0, Math.min(100, Math.round(readiness.pct * 100)));

  return (
    <div className="aga">
      <span className="aga-light" aria-hidden="true" />

      <header className="aga-head">
        <Link to={actions.siteHref} className="aga-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="aga-logo" /> : <span className="aga-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="aga-school">{data.schoolName}</span>
        </Link>
        <div className="aga-head-end">
          <span className="aga-hi">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="ga-btn ga-btn-ghost ga-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="aga-wrap">
        {/* Featured work = next lesson */}
        <section className="aga-featured">
          <span className="aga-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</span>
          {next ? (
            <div className="aga-featured-body">
              <div className="aga-plate aga-plate-lg">
                <h1 className="aga-featured-date">{ui.formatDate(next.date)}</h1>
                <div className="aga-plate-rows">
                  <div className="aga-plate-row"><span className="aga-plate-k" aria-hidden="true" /><span className="aga-plate-v">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</span></div>
                  <div className="aga-plate-row"><span className="aga-plate-k" aria-hidden="true" /><span className="aga-plate-note">{t('arriveEarly')}</span></div>
                </div>
              </div>
              <Link to={actions.bookHref} className="ga-btn ga-btn-primary aga-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
            </div>
          ) : (
            <div className="aga-featured-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="ga-btn ga-btn-primary aga-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
            </div>
          )}
        </section>

        {/* Readiness — exhibition placard + progress rule */}
        <section className="aga-panel aga-progress">
          <span className="aga-eyebrow">{t('readinessTitle')}</span>
          <div className="aga-stats">
            <GaStat value={readiness.completed} label={t('lessonsCompleted')} />
            <GaStat value={readiness.hoursDriven} label={t('hoursDriven')} />
            <GaStat value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
          <div className="aga-rule" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span className="aga-rule-fill" style={{ inlineSize: `${pct}%` }} />
          </div>
          <span className="aga-rule-cap">{pct}%</span>
        </section>

        <div className="aga-grid">
          {/* Upcoming — framed wall-labels */}
          <section className="aga-panel">
            <h2 className="aga-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="aga-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="aga-labels">
                {upcoming.map((b) => (
                  <li key={b.id} className="aga-label">
                    <span className="aga-label-date">{ui.formatDate(b.date)}</span>
                    <span className="aga-label-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History — framed wall-labels */}
          <section className="aga-panel">
            <h2 className="aga-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="aga-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="aga-labels">
                {history.map((h) => (
                  <li key={h.id} className={`aga-label ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="aga-label-date">{ui.formatDate(h.date)}</span>
                    <span className="aga-label-status">{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="aga-grid">
          {/* Chat */}
          <section className="aga-panel">
            <h2 className="aga-h2">{t('chatHeading')} {unread > 0 && <span className="aga-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'aga-chat', empty: 'aga-empty', bubbleMe: 'aga-bubble aga-bubble-me', bubbleThem: 'aga-bubble aga-bubble-them', time: 'aga-bubble-time', form: 'aga-chat-form', input: 'aga-input', send: 'ga-btn ga-btn-primary aga-send' }}
            />
          </section>

          {/* Profile */}
          <section className="aga-panel">
            <h2 className="aga-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'aga-profile', field: 'aga-field', label: 'aga-field-lbl', hint: 'aga-field-hint', input: 'aga-input', save: 'ga-btn ga-btn-primary aga-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function GaStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="aga-stat">
      <span className="aga-stat-num">{value}</span>
      <span className="aga-stat-lbl">{label}</span>
    </div>
  );
}
