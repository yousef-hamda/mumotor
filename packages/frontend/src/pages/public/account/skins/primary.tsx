import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/primary/primary.css';
import './primary.css';

/** primary — a Bauhaus / De Stijl poster dashboard. Hard-edged colour fields,
 *  the ONE blue accent for actions, red + yellow as geometric fills. The
 *  readiness section reports two figures — lessons completed and lessons
 *  upcoming — as geometric primary-colour stat cells. */
export default function PrimaryAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="apm">
      <header className="apm-head">
        <Link to={actions.siteHref} className="apm-brand" aria-label={data.schoolName}>
          {data.logoSrc
            ? <img src={data.logoSrc} alt="" className="apm-logo" />
            : <span className="apm-mark pm-fill-blue">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="apm-school">{data.schoolName}</span>
        </Link>
        <div className="apm-head-end">
          <span className="apm-who"><span className="apm-who-lbl">{t('welcomeBack')}</span><b>{student.name}</b></span>
          <button className="pm-btn pm-btn-ghost pm-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="apm-wrap">
        {/* NEXT LESSON — a full blue poster block */}
        <section className={`apm-next ${next ? 'pm-fill-blue' : ''}`}>
          <div className="apm-next-inner">
            <p className="apm-eyebrow apm-eyebrow-on">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
            {next ? (
              <>
                <h1 className="apm-next-date">{ui.formatDate(next.date)}</h1>
                <p className="apm-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                <p className="apm-next-note">{t('arriveEarly')}</p>
                <Link to={actions.bookHref} className="pm-btn pm-btn-onblue apm-book">
                  {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
                </Link>
              </>
            ) : (
              <div className="apm-next-empty">
                <p className="apm-next-empty-txt">{t('noUpcoming')}</p>
                <Link to={actions.bookHref} className="pm-btn pm-btn-primary apm-book">
                  {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
                </Link>
              </div>
            )}
          </div>
          <div className="apm-next-deco" aria-hidden="true">
            <span className="apm-deco-sq pm-fill-yellow" />
            <span className="apm-deco-ci pm-fill-red" />
          </div>
        </section>

        {/* READINESS — geometric primary-colour stat cells */}
        <section className="apm-panel apm-progress">
          <p className="pm-eyebrow apm-eyebrow">{t('readinessTitle')}</p>
          <div className="apm-stats">
            <StatCell shape="sq" fill="pm-fill-blue" value={readiness.completed} label={t('lessonsCompleted')} />
            <StatCell shape="ci" fill="pm-fill-red" value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="apm-grid">
          {/* UPCOMING */}
          <section className="apm-panel">
            <h2 className="apm-h2"><span className="pm-marker pm-marker-sq pm-fill-blue" />{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="apm-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="apm-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="apm-row">
                    <span className="apm-row-date">{ui.formatDate(b.date)}</span>
                    <span className="apm-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="apm-panel">
            <h2 className="apm-h2"><span className="pm-marker pm-marker-ci pm-fill-red" />{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="apm-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="apm-rows">
                {history.map((h) => (
                  <li key={h.id} className={`apm-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="apm-row-date">{ui.formatDate(h.date)}</span>
                    <span className="apm-row-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className={`apm-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="apm-grid">
          {/* CHAT */}
          <section className="apm-panel">
            <h2 className="apm-h2"><span className="pm-marker pm-marker-tr pm-fill-yellow" />{t('chatHeading')} {unread > 0 && <span className="apm-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'apm-chat', empty: 'apm-muted', bubbleMe: 'apm-bubble apm-bubble-me', bubbleThem: 'apm-bubble apm-bubble-them', time: 'apm-bubble-time', form: 'apm-chat-form', input: 'apm-input', send: 'pm-btn pm-btn-primary apm-send' }}
            />
          </section>

          {/* PROFILE */}
          <section className="apm-panel">
            <h2 className="apm-h2"><span className="pm-marker pm-marker-sq pm-fill-ink" />{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'apm-profile', field: 'apm-field', label: 'apm-field-lbl', hint: 'apm-field-hint', input: 'apm-input', save: 'pm-btn pm-btn-primary apm-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCell({ shape, fill, value, label }: { shape: 'sq' | 'ci'; fill: string; value: number; label: string }) {
  return (
    <div className="apm-stat">
      <span className={`apm-stat-shape apm-stat-${shape} ${fill}`} aria-hidden="true" />
      <span className="apm-stat-num">{value}</span>
      <span className="apm-stat-lbl">{label}</span>
    </div>
  );
}
