import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Send } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/atelier/atelier.css';
import './atelier.css';

/** atelier — the bespoke tailor's studio dashboard. A course cut to fit: the
 *  readiness panel is a MEASURING-TAPE rail with a thread-red marker sliding to
 *  the fitted percentage; lessons are ruled order-book rows with dotted thread
 *  leaders; panels are dashed-thread swatch cards. Ivory paper, charcoal ink,
 *  one thread-red accent. Scoped to .aat- and the template's --at-* vars. */
export default function AtelierAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;
  const pct = Math.max(0, Math.min(100, Math.round(readiness.pct * 100)));
  const drawn = useDrawn();

  return (
    <div className="aat">
      <header className="aat-head">
        <Link to={actions.siteHref} className="aat-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="aat-logo" />
          ) : (
            <span className="aat-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>
          )}
          <span className="aat-school">{data.schoolName}</span>
        </Link>
        <div className="aat-head-end">
          <span className="aat-welcome">{t('welcomeBack')} · <b>{student.name}</b></span>
          <button className="at-btn at-btn-ghost at-btn-sm" onClick={actions.logout}>{t('signOut')}</button>
        </div>
      </header>

      <div className="aat-wrap">
        {/* NEXT LESSON — the fitting appointment */}
        <section className="aat-next">
          <span className="aat-next-tape" aria-hidden="true" />
          <p className="at-eyebrow">
            <svg className="at-chalk" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8 L14 8 M8 2 L8 14" /></svg>
            {next ? t('yourNextLesson') : t('upcomingTitle')}
          </p>
          {next ? (
            <div className="aat-next-body">
              <div className="aat-next-main">
                <div className="aat-next-date">{ui.formatDate(next.date)}</div>
                <div className="aat-next-time">{ui.slotRange(next.time, next.duration)}</div>
                <div className="aat-next-note">{next.duration} {t('minShort')} · {t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="at-btn at-btn-primary aat-next-cta">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          ) : (
            <div className="aat-next-empty">
              <p className="aat-muted">{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="at-btn at-btn-primary">
                {t('bookLesson')} <ArrowRight size={15} className="book-arrow" />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — the measuring-tape rail (signature) */}
        <section className="aat-panel aat-progress">
          <p className="at-eyebrow">{t('readinessTitle')}</p>
          <div
            className="aat-tape"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('readinessTitle')}
          >
            <div className="aat-tape-strip">
              <span className="aat-tape-fill" style={{ inlineSize: drawn ? `${pct}%` : '0%' }} />
              <span className="aat-tape-marker" style={{ insetInlineStart: `${pct}%` }}>
                <span className="aat-tape-flag">{pct}%</span>
              </span>
            </div>
            <div className="aat-tape-scale" aria-hidden="true">
              {[0, 25, 50, 75, 100].map((n) => (
                <span key={n} className="aat-tape-num">{n}</span>
              ))}
            </div>
          </div>
          <div className="aat-measures">
            <Measure value={readiness.completed} label={t('lessonsCompleted')} />
            <Measure value={readiness.hoursDriven} label={t('hoursDriven')} />
            <Measure value={readiness.upcoming} label={t('statUpcoming')} />
          </div>
        </section>

        <div className="aat-grid">
          {/* UPCOMING — order book */}
          <section className="aat-panel">
            <h2 className="aat-h2">{t('upcomingTitle')}</h2>
            {upcoming.length === 0 ? (
              <p className="aat-muted aat-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="aat-ledger">
                {upcoming.map((b) => (
                  <li key={b.id} className="aat-ledger-row">
                    <span className="aat-ledger-date">{ui.formatDate(b.date)}</span>
                    <span className="aat-leader" aria-hidden="true" />
                    <span className="aat-ledger-time">{ui.slotRange(b.time, b.duration)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* HISTORY — completed alterations */}
          <section className="aat-panel">
            <h2 className="aat-h2">{t('historyTitle')}</h2>
            {history.length === 0 ? (
              <p className="aat-muted aat-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="aat-ledger">
                {history.map((h) => (
                  <li key={h.id} className={`aat-ledger-row ${h.status === 'CANCELLED' ? 'is-cancelled' : ''}`}>
                    <span className="aat-ledger-date">{ui.formatDate(h.date)}</span>
                    <span className="aat-leader" aria-hidden="true" />
                    <span className={`aat-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="aat-grid">
          {/* CHAT */}
          <section className="aat-panel">
            <h2 className="aat-h2">{t('chatHeading')} {unread > 0 && <span className="aat-badge">{unread}</span>}</h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'aat-chat', empty: 'aat-muted',
                bubbleMe: 'aat-bubble aat-bubble-me', bubbleThem: 'aat-bubble aat-bubble-them',
                time: 'aat-bubble-time', form: 'aat-chat-form', input: 'aat-input', send: 'at-btn at-btn-primary aat-send',
              }}
            />
          </section>

          {/* PROFILE */}
          <section className="aat-panel">
            <h2 className="aat-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'aat-profile', field: 'aat-field', label: 'aat-field-lbl', hint: 'aat-field-hint',
                input: 'aat-input', save: 'at-btn at-btn-primary aat-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Measure({ value, label }: { value: number; label: string }) {
  return (
    <div className="aat-measure">
      <span className="aat-measure-num">{value}</span>
      <span className="aat-measure-lbl">{label}</span>
    </div>
  );
}

/** Toggles true one frame after mount so CSS transitions animate in (snaps
 *  instantly under reduced-motion, where the transitions are disabled). */
function useDrawn(): boolean {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return drawn;
}
