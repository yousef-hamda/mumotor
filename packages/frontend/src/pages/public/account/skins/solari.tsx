import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/solari/solari.css';
import './solari.css';

/** solari — a split-flap DEPARTURES board. Upcoming lessons are departure rows,
 *  history is the arrivals board, stats are flap tiles, the next lesson is the
 *  "NEXT DEPARTURE" panel. Warm-black board, brass frame, amber accent. */
export default function SolariAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.round(readiness.pct * 100);

  return (
    <div className="asl">
      <div className="asl-frame" aria-hidden="true" />
      <header className="asl-head">
        <Link to={actions.siteHref} className="asl-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="asl-logo" /> : <span className="asl-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="asl-school">{data.schoolName}</span>
        </Link>
        <div className="asl-head-end">
          <span className="asl-passenger">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="sl-btn sl-btn-ghost sl-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="asl-wrap">
        {/* NEXT DEPARTURE */}
        <section className="asl-next">
          <div className="asl-next-head"><span className="asl-livedot" />{next ? t('yourNextLesson') : t('upcomingTitle')}</div>
          {next ? (
            <div className="asl-next-body">
              <div className="asl-next-time">{next.time}</div>
              <div className="asl-next-meta">
                <div className="asl-next-date">{ui.formatDate(next.date)}</div>
                <div className="asl-next-sub">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</div>
                <div className="asl-next-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="sl-btn sl-btn-primary asl-depart">{t('bookLesson')}</Link>
            </div>
          ) : (
            <div className="asl-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="sl-btn sl-btn-primary asl-depart">{t('bookLesson')}</Link>
            </div>
          )}
        </section>

        {/* Readiness — flap tiles + amber bar */}
        <section className="asl-progress">
          <div className="asl-progress-head"><span className="sl-eyebrow">{t('readinessTitle')}</span></div>
          <div className="asl-tiles">
            <FlapStat value={readiness.completed} label={t('lessonsCompleted')} />
            <FlapStat value={readiness.hoursDriven} label={t('hoursDriven')} />
            <FlapStat value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
          <div className="asl-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <span className="asl-bar-fill" style={{ inlineSize: `${pct}%` }} />
          </div>
        </section>

        <div className="asl-grid">
          {/* Departures = upcoming */}
          <section className="asl-board">
            <div className="asl-board-head"><span>{t('upcomingTitle')}</span><span className="asl-col-status">{t('statUpcoming')}</span></div>
            {upcoming.length === 0 ? (
              <p className="asl-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="asl-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="asl-row">
                    <span className="asl-row-time">{b.time}</span>
                    <span className="asl-row-dest">{ui.formatDate(b.date)}</span>
                    <span className="asl-row-status is-on">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Arrivals = history */}
          <section className="asl-board">
            <div className="asl-board-head"><span>{t('historyTitle')}</span><span className="asl-col-status">{t('lessonCompleted')}</span></div>
            {history.length === 0 ? (
              <p className="asl-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="asl-rows">
                {history.map((h) => (
                  <li key={h.id} className="asl-row">
                    <span className="asl-row-time">{h.time}</span>
                    <span className="asl-row-dest">{ui.formatDate(h.date)}</span>
                    <span className={`asl-row-status ${h.status === 'CANCELLED' ? 'is-off' : 'is-arr'}`}>{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="asl-grid">
          {/* Chat */}
          <section className="sl-panel asl-panel">
            <h2 className="asl-h2">{t('chatHeading')} {unread > 0 && <span className="asl-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'asl-chat', empty: 'asl-empty', bubbleMe: 'asl-bubble asl-bubble-me', bubbleThem: 'asl-bubble asl-bubble-them', time: 'asl-bubble-time', form: 'asl-chat-form', input: 'asl-input', send: 'sl-btn sl-btn-primary asl-send' }}
            />
          </section>

          {/* Profile */}
          <section className="sl-panel asl-panel">
            <h2 className="asl-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'asl-profile', field: 'asl-field', label: 'asl-field-lbl', hint: 'asl-field-hint', input: 'asl-input', save: 'sl-btn sl-btn-primary asl-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function FlapStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="asl-tile">
      <span className="asl-tile-num">{value}</span>
      <span className="asl-tile-lbl">{label}</span>
    </div>
  );
}
