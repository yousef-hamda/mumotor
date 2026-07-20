import { Link } from 'react-router-dom';
import { Send, LogOut, ChevronRight, Flag } from 'lucide-react';
import type { AccountSkinProps } from '../types';
import '../../../../templates/circuit/circuit.css';
import './circuit.css';

/** circuit — motorsport pit-wall telemetry. The dashboard is a broadcast timing
 *  graphic: the next lesson is the "next stint", readiness is a telemetry stack
 *  (lap counter + green sector strip + a lap-progress line), upcoming/history are
 *  timing sheets. Carbon dark, racing red accent, one live timing-green. */
export default function CircuitAccount({ data, actions, ui }: AccountSkinProps) {
  const t = ui.t;
  const { student, readiness, next, upcoming, history, messages, unread } = data;

  return (
    <div className="aci">
      <header className="aci-head">
        <Link to={actions.siteHref} className="aci-brand" aria-label={data.schoolName}>
          {data.logoSrc ? (
            <img src={data.logoSrc} alt="" className="aci-logo" />
          ) : (
            <span className="aci-mark">{(data.schoolName || 'M').charAt(0).toUpperCase()}</span>
          )}
          <span className="aci-school">{data.schoolName}</span>
        </Link>
        <div className="aci-head-end">
          <span className="aci-driver">
            <span className="ci-livedot" aria-hidden="true" />
            {t('welcomeBack')} · <b>{student.name}</b>
          </span>
          <button className="ci-btn ci-btn-ghost ci-btn-sm" onClick={actions.logout}>
            <LogOut size={14} /> {t('signOut')}
          </button>
        </div>
      </header>

      <div className="aci-wrap">
        {/* NEXT STINT */}
        <section className="ci-panel aci-next">
          <div className="aci-next-head">
            <span className="ci-livedot" aria-hidden="true" />
            {next ? t('yourNextLesson') : t('upcomingTitle')}
          </div>
          {next ? (
            <div className="aci-next-body">
              <div className="aci-next-time">{next.time}</div>
              <div className="aci-next-meta">
                <div className="aci-next-date">{ui.formatDate(next.date)}</div>
                <div className="aci-next-sub">
                  {ui.slotRange(next.time, next.duration)} · {next.duration} {t('minShort')}
                </div>
                <div className="aci-next-note">{t('arriveEarly')}</div>
              </div>
              <Link to={actions.bookHref} className="ci-btn ci-btn-primary aci-cta">
                {t('bookLesson')} <ChevronRight size={16} className="book-arrow" />
              </Link>
            </div>
          ) : (
            <div className="aci-next-empty">
              <p>{t('noUpcoming')}</p>
              <Link to={actions.bookHref} className="ci-btn ci-btn-primary aci-cta">
                {t('bookLesson')} <ChevronRight size={16} className="book-arrow" />
              </Link>
            </div>
          )}
        </section>

        {/* READINESS — telemetry */}
        <section className="ci-panel aci-tele">
          <div className="aci-tele-head">
            <span className="ci-eyebrow">{t('readinessTitle')}</span>
          </div>
          <div className="aci-tele-grid">
            <div className="aci-lap">
              <span className="aci-lap-num">{readiness.completed}</span>
              <span className="aci-lap-label">{t('lessonsCompleted')}</span>
            </div>
            <div className="aci-lap">
              <span className="aci-lap-num">{readiness.upcoming}</span>
              <span className="aci-lap-label">{t('statUpcoming')}</span>
            </div>
          </div>
        </section>

        <div className="aci-grid">
          {/* Upcoming timing sheet */}
          <section className="ci-panel aci-board">
            <div className="aci-board-head">
              <span>{t('upcomingTitle')}</span>
              <span className="aci-board-col">{t('lessonsBooked')}</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="aci-empty">{t('noUpcoming')}</p>
            ) : (
              <ul className="aci-rows">
                {upcoming.map((b) => (
                  <li key={b.id} className="aci-row">
                    <span className="aci-row-time">{b.time}</span>
                    <span className="aci-row-date">{ui.formatDate(b.date)}</span>
                    <span className="aci-row-tag is-on">{t('lessonsBooked')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* History timing sheet */}
          <section className="ci-panel aci-board">
            <div className="aci-board-head">
              <span>{t('historyTitle')}</span>
              <Flag size={13} className="aci-board-flag" aria-hidden="true" />
            </div>
            {history.length === 0 ? (
              <p className="aci-empty">{t('historyEmpty')}</p>
            ) : (
              <ul className="aci-rows">
                {history.map((h) => (
                  <li key={h.id} className="aci-row">
                    <span className="aci-row-time">{h.time}</span>
                    <span className="aci-row-date">{ui.formatDate(h.date)}</span>
                    <span className={`aci-row-tag ${h.status === 'CANCELLED' ? 'is-off' : 'is-done'}`}>
                      {h.status === 'CANCELLED' ? t('lessonCancelled') : t('lessonCompleted')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="aci-grid">
          {/* Chat */}
          <section className="ci-panel aci-panel">
            <h2 className="aci-h2">
              {t('chatHeading')} {unread > 0 && <span className="aci-badge">{unread}</span>}
            </h2>
            <ui.ChatThread
              messages={messages}
              onSend={actions.sendMessage}
              sending={actions.sendPending}
              onSeen={actions.markMessagesSeen}
              L={data.locale}
              sendIcon={<Send size={16} />}
              classNames={{
                root: 'aci-chat',
                empty: 'aci-empty',
                bubbleMe: 'aci-bubble aci-bubble-me',
                bubbleThem: 'aci-bubble aci-bubble-them',
                time: 'aci-bubble-time',
                form: 'aci-chat-form',
                input: 'aci-input',
                send: 'ci-btn ci-btn-primary aci-send',
              }}
            />
          </section>

          {/* Profile */}
          <section className="ci-panel aci-panel">
            <h2 className="aci-h2">{t('yourDetails')}</h2>
            <ui.ProfileForm
              student={student}
              onSave={actions.saveProfile}
              saving={actions.savePending}
              L={data.locale}
              classNames={{
                root: 'aci-profile',
                field: 'aci-field',
                label: 'aci-field-lbl',
                hint: 'aci-field-hint',
                input: 'aci-input',
                save: 'ci-btn ci-btn-primary aci-save',
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
