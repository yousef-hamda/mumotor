import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/grid-ink/grid-ink.css';
import './grid-ink.css';

/** grid-ink — Swiss / International editorial. Strict numbered grid, hairline
 *  rules, one red accent. The readiness section reports two indexed figures —
 *  lessons completed and lessons upcoming — as labelled Swiss stat cells. */
export default function GridInkAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="agi">
      <header className="agi-head">
        <Link to={actions.siteHref} className="agi-brand" aria-label={data.schoolName}>
          {data.logoSrc
            ? <img src={data.logoSrc} alt="" className="agi-logo" />
            : <span className="agi-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="agi-school">{data.schoolName}</span>
        </Link>
        <div className="agi-head-end">
          <span className="agi-who">{t('welcomeBack')} / <b>{student.name}</b></span>
          <button className="gi-btn-ghost agi-signout" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="agi-wrap">
        {/* NEXT LESSON */}
        <section className="agi-next">
          <div className="agi-next-copy">
            <p className="agi-label"><span className="agi-n">00</span>{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
            {next ? (
              <>
                <h1 className="agi-next-date">{ui.formatDate(next.date)}</h1>
                <p className="agi-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                <p className="agi-next-note">{t('arriveEarly')}</p>
              </>
            ) : (
              <h1 className="agi-next-date agi-next-empty">{t('noUpcoming')}</h1>
            )}
          </div>
          <Link to={actions.bookHref} className="gi-btn-primary gi-btn-lg agi-book">
            {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
          </Link>
        </section>

        {/* READINESS — indexed Swiss stat cells */}
        <section className="agi-progress">
          <p className="agi-label"><span className="agi-n">01</span>{t('readinessTitle')}</p>
          <div className="agi-stats">
            <IndexStat n="a" value={readiness.completed} label={t('lessonsCompleted')} />
            <IndexStat n="b" value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="agi-grid">
          {/* UPCOMING */}
          <section className="agi-panel">
            <h2 className="agi-label"><span className="agi-n">02</span>{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="agi-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="agi-rows">
                {upcoming.map((b, i) => (
                  <li key={b.id} className="agi-row">
                    <span className="agi-row-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="agi-row-date">{ui.formatDate(b.date)}</span>
                    <span className="agi-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="agi-panel">
            <h2 className="agi-label"><span className="agi-n">03</span>{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="agi-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="agi-rows">
                {history.map((h, i) => (
                  <li key={h.id} className={`agi-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="agi-row-n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="agi-row-date">{ui.formatDate(h.date)}</span>
                    <span className="agi-row-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className={`agi-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="agi-grid">
          {/* CHAT */}
          <section className="agi-panel">
            <h2 className="agi-label"><span className="agi-n">04</span>{t('chatHeading')} {unread > 0 && <span className="agi-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'agi-chat', empty: 'agi-muted', bubbleMe: 'agi-bubble agi-bubble-me', bubbleThem: 'agi-bubble agi-bubble-them', time: 'agi-bubble-time', form: 'agi-chat-form', input: 'agi-input', send: 'gi-btn-primary agi-send' }}
            />
          </section>

          {/* PROFILE */}
          <section className="agi-panel">
            <h2 className="agi-label"><span className="agi-n">05</span>{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'agi-profile', field: 'agi-field', label: 'agi-field-lbl', hint: 'agi-field-hint', input: 'agi-input', save: 'gi-btn-primary agi-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function IndexStat({ n, value, label }: { n: string; value: number; label: string }) {
  return (
    <div className="agi-stat">
      <span className="agi-stat-n">{n}</span>
      <span className="agi-stat-num">{value}</span>
      <span className="agi-stat-lbl">{label}</span>
    </div>
  );
}
