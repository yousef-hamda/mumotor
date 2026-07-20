import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/open-road/open-road.css';
import './open-road.css';

/** open-road — retro 70s road-trip. Cream paper, enamel route badges, dashed-road
 *  dividers, Abril Fatface display. The readiness section shows two enamel route
 *  badges — lessons completed and lessons upcoming. */
export default function OpenRoadAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="aor">
      <header className="aor-head">
        <Link to={actions.siteHref} className="aor-brand" aria-label={data.schoolName}>
          {data.logoSrc
            ? <img src={data.logoSrc} alt="" className="aor-logo" />
            : <span className="aor-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="aor-school">{data.schoolName}</span>
        </Link>
        <div className="aor-head-end">
          <span className="aor-who">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="or-btn or-btn-ghost aor-signout" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="aor-wrap">
        {/* NEXT LESSON */}
        <section className="aor-next">
          <div className="aor-next-copy">
            <span className="or-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</span>
            {next ? (
              <>
                <h1 className="aor-next-date">{ui.formatDate(next.date)}</h1>
                <p className="aor-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                <p className="aor-next-note">{t('arriveEarly')}</p>
                <Link to={actions.bookHref} className="or-btn or-btn-primary or-btn-lg aor-book">
                  {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
                </Link>
              </>
            ) : (
              <>
                <h1 className="aor-next-date aor-next-empty">{t('noUpcoming')}</h1>
                <Link to={actions.bookHref} className="or-btn or-btn-primary or-btn-lg aor-book">
                  {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
                </Link>
              </>
            )}
          </div>
        </section>

        <div className="aor-road" aria-hidden="true" />

        {/* READINESS — enamel route badges */}
        <section className="aor-progress">
          <span className="or-eyebrow">{t('readinessTitle')}</span>
          <div className="aor-badges">
            <EnamelBadge value={readiness.completed} label={t('lessonsCompleted')} />
            <EnamelBadge value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="aor-road" aria-hidden="true" />

        <div className="aor-grid">
          {/* UPCOMING */}
          <section className="aor-panel">
            <h2 className="aor-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="aor-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="aor-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="aor-row">
                    <span className="aor-row-date">{ui.formatDate(b.date)}</span>
                    <span className="aor-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="aor-panel">
            <h2 className="aor-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="aor-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="aor-rows">
                {history.map((h) => (
                  <li key={h.id} className={`aor-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="aor-row-date">{ui.formatDate(h.date)}</span>
                    <span className="aor-row-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className={`aor-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="aor-grid">
          {/* CHAT */}
          <section className="aor-panel">
            <h2 className="aor-h2">{t('chatHeading')} {unread > 0 && <span className="aor-badge-pill">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'aor-chat', empty: 'aor-muted', bubbleMe: 'aor-bubble aor-bubble-me', bubbleThem: 'aor-bubble aor-bubble-them', time: 'aor-bubble-time', form: 'aor-chat-form', input: 'aor-input', send: 'or-btn or-btn-primary aor-send' }}
            />
          </section>

          {/* PROFILE */}
          <section className="aor-panel">
            <h2 className="aor-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'aor-profile', field: 'aor-field', label: 'aor-field-lbl', hint: 'aor-field-hint', input: 'aor-input', save: 'or-btn or-btn-primary aor-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function EnamelBadge({ value, label }: { value: number; label: string }) {
  return (
    <div className="or-badge aor-enamel">
      <span className="or-badge-number aor-enamel-num">{value}</span>
      <span className="or-badge-label aor-enamel-lbl">{label}</span>
    </div>
  );
}
