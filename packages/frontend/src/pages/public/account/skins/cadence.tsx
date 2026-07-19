import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/cadence/cadence.css';
import './cadence.css';

/** cadence — kinetic editorial typography. Type IS the design: oversized
 *  variable-weight numerals, mono labels, an ultramarine accent used big. The
 *  signature readiness device is a giant kinetic numeral + a ruled progress. */
export default function CadenceAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.round(Math.max(0, Math.min(1, readiness.pct)) * 100);

  return (
    <div className="acd">
      <header className="acd-head">
        <Link to={actions.siteHref} className="acd-brand" aria-label={data.schoolName}>
          {data.logoSrc
            ? <img src={data.logoSrc} alt="" className="acd-logo" />
            : <span className="acd-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>}
          <span className="acd-school">{data.schoolName}</span>
        </Link>
        <div className="acd-head-end">
          <span className="acd-who">{t('welcomeBack')} — <b>{student.name}</b></span>
          <button className="cd-btn cd-btn-ghost cd-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="acd-wrap">
        {/* NEXT LESSON — kinetic hero */}
        <section className="acd-next">
          <p className="acd-eyebrow">{next ? t('yourNextLesson') : t('upcomingTitle')}</p>
          {next ? (
            <>
              <h1 className="acd-next-date">{ui.formatDate(next.date)}</h1>
              <p className="acd-next-time">{ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}</p>
              <p className="acd-next-note">{t('arriveEarly')}</p>
              <Link to={actions.bookHref} className="cd-btn cd-btn-primary cd-btn-lg acd-book">
                {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
              </Link>
            </>
          ) : (
            <>
              <h1 className="acd-next-date">{t('noUpcoming')}</h1>
              <Link to={actions.bookHref} className="cd-btn cd-btn-primary cd-btn-lg acd-book">
                {t('bookLesson')} <ArrowRight size={16} className="book-arrow" />
              </Link>
            </>
          )}
        </section>

        {/* READINESS — giant kinetic numerals + ruled progress */}
        <section className="acd-progress">
          <p className="acd-eyebrow">{t('readinessTitle')}</p>
          <div className="acd-nums">
            <KineticStat value={readiness.completed} label={t('lessonsCompleted')} />
            <span className="acd-num-div" aria-hidden="true" />
            <KineticStat value={readiness.hoursDriven} label={t('hoursDriven')} />
            <span className="acd-num-div" aria-hidden="true" />
            <KineticStat value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
          <div className="acd-rule" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('readinessTitle')}>
            <div className="acd-rule-track">
              <span className="acd-rule-fill" style={{ inlineSize: `${pct}%` }} />
            </div>
            <span className="acd-rule-pct">{pct}<span className="acd-rule-pct-sign">%</span></span>
          </div>
        </section>

        <div className="acd-grid">
          {/* UPCOMING */}
          <section className="acd-panel">
            <h2 className="acd-h2"><span className="acd-h2-n">01</span>{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="acd-muted">{t('noUpcoming')}</p>
            ) : (
              <ul className="acd-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="acd-row">
                    <span className="acd-row-date">{ui.formatDate(b.date)}</span>
                    <span className="acd-row-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY */}
          <section className="acd-panel">
            <h2 className="acd-h2"><span className="acd-h2-n">02</span>{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="acd-muted">{t('historyEmpty')}</p>
            ) : (
              <ul className="acd-rows">
                {history.map((h) => (
                  <li key={h.id} className={`acd-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="acd-row-date">{ui.formatDate(h.date)}</span>
                    <span className="acd-row-time">{ui.slotRange(h.time, h.duration)}</span>
                    <span className={`acd-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="acd-grid">
          {/* CHAT */}
          <section className="acd-panel">
            <h2 className="acd-h2"><span className="acd-h2-n">03</span>{t('chatHeading')} {unread > 0 && <span className="acd-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages} onSend={actions.sendMessage} sending={actions.sendPending} onSeen={actions.markMessagesSeen}
              L={data.locale} sendIcon={<Send size={16} />}
              classNames={{ root: 'acd-chat', empty: 'acd-muted', bubbleMe: 'acd-bubble acd-bubble-me', bubbleThem: 'acd-bubble acd-bubble-them', time: 'acd-bubble-time', form: 'acd-chat-form', input: 'acd-input', send: 'cd-btn cd-btn-primary acd-send' }}
            />
          </section>

          {/* PROFILE */}
          <section className="acd-panel">
            <h2 className="acd-h2"><span className="acd-h2-n">04</span>{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student} onSave={actions.saveProfile} saving={actions.savePending} L={data.locale}
              classNames={{ root: 'acd-profile', field: 'acd-field', label: 'acd-field-lbl', hint: 'acd-field-hint', input: 'acd-input', save: 'cd-btn cd-btn-primary acd-save' }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function KineticStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="acd-num">
      <span className="acd-num-val">{value}</span>
      <span className="acd-num-lbl">{label}</span>
    </div>
  );
}
