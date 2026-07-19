import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/deco/deco.css';
import './deco.css';

/** deco — the golden age of the automobile. Champagne ivory with emerald + gold
 *  Art-Deco geometry: the next lesson on an engraved plate framed by a sunburst
 *  fan, readiness on a brass floor-dial gauge, upcoming/history framed by gold
 *  hairlines and chevron rules. Gold is ornament only; text is ink/emerald. */
export default function DecoAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.max(0, Math.min(100, Math.round(readiness.pct * 100)));

  return (
    <div className="adc">
      <header className="adc-head">
        <Link to={actions.siteHref} className="adc-brand" aria-label={data.schoolName}>
          {data.logoSrc ? <img src={data.logoSrc} alt="" className="adc-logo" /> : <span className="adc-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="adc-school">{data.schoolName}</span>
        </Link>
        <div className="adc-head-end">
          <span className="adc-hi">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="dc-btn dc-btn-ghost dc-btn-sm adc-ghost" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>
      <span className="adc-chevron" aria-hidden="true" />

      <div className="adc-wrap">
        {/* Next lesson — engraved plate + sunburst fan */}
        <section className="adc-plate adc-next">
          <span className="adc-fan" aria-hidden="true" />
          <div className="adc-next-inner">
            <p className="dc-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
            {next ? (
              <div className="adc-next-body">
                <div>
                  <h1 className="adc-next-date">{ui.formatDate(next.date)}</h1>
                  <p className="adc-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
                  <p className="adc-next-note">{t('arriveEarly')}</p>
                </div>
                <Link to={actions.bookHref} className="dc-btn dc-btn-primary adc-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
              </div>
            ) : (
              <div className="adc-next-empty">
                <p>{t('noUpcoming')}</p>
                <Link to={actions.bookHref} className="dc-btn dc-btn-primary adc-book">{t('bookLesson')} <ArrowRight size={15} className="book-arrow" /></Link>
              </div>
            )}
          </div>
        </section>

        {/* Readiness — brass floor-dial gauge */}
        <section className="adc-plate adc-progress">
          <p className="dc-eyebrow">{t('readinessTitle')}</p>
          <div className="adc-progress-grid">
            <div className="adc-dial">
              <svg className="adc-dial-face" viewBox="0 0 200 118" aria-hidden="true">
                <path className="adc-dial-arc" d="M18 100 A82 82 0 0 1 182 100" />
                {Array.from({ length: 11 }).map((_, i) => {
                  const a = (-90 + i * 18) * (Math.PI / 180);
                  const x1 = 100 + Math.sin(a) * 82, y1 = 100 - Math.cos(a) * 82;
                  const x2 = 100 + Math.sin(a) * (i % 5 === 0 ? 68 : 74), y2 = 100 - Math.cos(a) * (i % 5 === 0 ? 68 : 74);
                  return <line key={i} className={`adc-dial-tick ${i % 5 === 0 ? 'is-major' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />;
                })}
                <line className="adc-dial-hand" x1="100" y1="100" x2="100" y2="32" transform={`rotate(${-90 + pct * 1.8} 100 100)`} />
                <circle className="adc-dial-pivot" cx="100" cy="100" r="7" />
              </svg>
              <span className="adc-dial-readout">{pct}%</span>
            </div>
            <ul className="adc-stats">
              <li><b>{readiness.completed}</b><span>{t('lessonsCompleted')}</span></li>
              <li><b>{readiness.hoursDriven}</b><span>{t('hoursDriven')}</span></li>
              <li><b>{readiness.upcoming}</b><span>{t('statUpcoming')}</span></li>
            </ul>
          </div>
        </section>

        <div className="adc-grid">
          {/* Upcoming */}
          <section className="adc-plate">
            <h2 className="adc-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="adc-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="adc-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="adc-row">
                    <span className="adc-diamond" aria-hidden="true" />
                    <span className="adc-row-date">{ui.formatDate(b.date)}</span>
                    <span className="adc-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History */}
          <section className="adc-plate">
            <h2 className="adc-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="adc-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="adc-rows">
                {history.map((h) => (
                  <li key={h.id} className={`adc-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className={`adc-diamond ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`} aria-hidden="true" />
                    <span className="adc-row-date">{ui.formatDate(h.date)}</span>
                    <span className="adc-row-status">{h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="adc-grid">
          {/* Chat */}
          <section className="adc-plate">
            <h2 className="adc-h2">{t('chatHeading')} {unread > 0 && <span className="adc-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'adc-chat', empty: 'adc-empty', bubbleMe: 'adc-bubble adc-bubble-me', bubbleThem: 'adc-bubble adc-bubble-them', time: 'adc-bubble-time', form: 'adc-chat-form', input: 'adc-input', send: 'dc-btn dc-btn-primary adc-send' }}
            />
          </section>

          {/* Profile */}
          <section className="adc-plate">
            <h2 className="adc-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'adc-profile', field: 'adc-field', label: 'adc-field-lbl', hint: 'adc-field-hint', input: 'adc-input', save: 'dc-btn dc-btn-primary adc-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
