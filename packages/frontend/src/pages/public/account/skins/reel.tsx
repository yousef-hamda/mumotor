import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/reel/reel.css';
import './reel.css';

/** reel — a 35mm cinema cutting room. The next lesson is the "NOW SHOWING" film
 *  frame, readiness is a pair of timecode stat tiles (lessons completed + upcoming),
 *  upcoming lessons are the screening schedule and history runs down a sprocket-hole
 *  reel. Projector-warm film black, technicolor vermilion accent, aged-film gold
 *  sprockets. */
export default function ReelAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="arl">
      <span className="arl-grain" aria-hidden="true" />

      <header className="arl-head">
        <Link to={actions.siteHref} className="arl-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="arl-logo" /> : <span className="arl-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="arl-school">{data.schoolName}</span>
        </Link>
        <div className="arl-head-end">
          <span className="arl-rec"><span className="arl-rec-dot" aria-hidden="true" />{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="rl-btn rl-btn-ghost rl-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="arl-wrap">
        {/* NOW SHOWING — next lesson */}
        <section className="arl-frame">
          <div className="arl-frame-head">
            <span className="arl-nowshowing">{next ? t('yourNextLesson') : t('upcomingTitle')}</span>
            <span className="arl-tc">REC 00:00</span>
          </div>
          <span className="arl-sprocket arl-sprocket-top" aria-hidden="true" />
          {next ? (
            <div className="arl-frame-body">
              <div className="arl-frame-time">{next.time}</div>
              <div className="arl-frame-meta">
                <div className="arl-frame-date">{ui.formatDate(next.date)}</div>
                <div className="arl-frame-sub">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</div>
                <div className="arl-frame-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="rl-btn rl-btn-primary arl-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
            </div>
          ) : (
            <div className="arl-frame-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="rl-btn rl-btn-primary arl-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
            </div>
          )}
          <span className="arl-sprocket arl-sprocket-bot" aria-hidden="true" />
        </section>

        {/* Readiness — sprocket filmstrip timecode gauge */}
        <section className="arl-progress">
          <div className="arl-progress-head">
            <span className="rl-eyebrow">{t('readinessTitle')}</span>
          </div>
          <div className="arl-tiles">
            <ReelStat value={readiness.completed} label={t('lessonsCompleted')} />
            <ReelStat value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="arl-grid">
          {/* Screening schedule = upcoming */}
          <section className="arl-panel">
            <h2 className="arl-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="arl-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="arl-scenes">
                {upcoming.map((b, i) => (
                  <li key={b.id} className="arl-scene">
                    <span className="arl-scene-no">SC {String(i + 1).padStart(2, '0')}</span>
                    <span className="arl-scene-time">{b.time}</span>
                    <span className="arl-scene-date">{ui.formatDate(b.date)}</span>
                    <span className="arl-scene-tag">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History = sprocket reel */}
          <section className="arl-panel">
            <h2 className="arl-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="arl-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="arl-reel">
                {history.map((h) => (
                  <li key={h.id} className={`arl-cell ${h.status === 'CANCELLED' ? 'is-cut' : ''}`}>
                    <span className="arl-cell-perf" aria-hidden="true" />
                    <span className="arl-cell-time">{h.time}</span>
                    <span className="arl-cell-date">{ui.formatDate(h.date)}</span>
                    <span className={`arl-cell-tag ${h.status === 'CANCELLED' ? 'is-cut' : ''}`}>{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="arl-grid">
          {/* Chat */}
          <section className="arl-panel">
            <h2 className="arl-h2">{t('chatHeading')} {unread > 0 && <span className="arl-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'arl-chat', empty: 'arl-empty', bubbleMe: 'arl-bubble arl-bubble-me', bubbleThem: 'arl-bubble arl-bubble-them', time: 'arl-bubble-time', form: 'arl-chat-form', input: 'arl-input', send: 'rl-btn rl-btn-primary arl-send' }}
            />
          </section>

          {/* Profile */}
          <section className="arl-panel">
            <h2 className="arl-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'arl-profile', field: 'arl-field', label: 'arl-field-lbl', hint: 'arl-field-hint', input: 'arl-input', save: 'rl-btn rl-btn-primary arl-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function ReelStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="arl-tile">
      <span className="arl-tile-num">{value}</span>
      <span className="arl-tile-lbl">{label}</span>
    </div>
  );
}
