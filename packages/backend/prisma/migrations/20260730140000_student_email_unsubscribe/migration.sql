-- Per-student email opt-out (A-02).
--
-- Mumotor sent bulk email — a daily "booking is open" notice to every active student of
-- every school, plus teacher broadcasts and review requests — with NO unsubscribe link and
-- no List-Unsubscribe header anywhere. That is a legal problem (Israel's Communications
-- Law and GDPR both require an opt-out on commercial messages) and a deliverability one:
-- Gmail and Yahoo require one-click unsubscribe from bulk senders and penalise a spam
-- complaint rate over 0.3%. When a sending domain's reputation drops it takes the
-- transactional mail with it — booking confirmations, reminders, password resets.
--
-- One nullable timestamp rather than a boolean: knowing WHEN someone opted out is needed to
-- answer a complaint, and null/not-null reads unambiguously.
--
-- Scope is deliberately per ENROLLMENT, not per email address: a student learning with two
-- instructors has two separate relationships and opting out of one must not silently
-- unsubscribe them from the other.
--
-- Transactional mail (booking confirmation, reminder, cancellation, magic link, welcome,
-- password reset) is NOT gated on this and keeps sending — that is both lawful and
-- expected. Only the bulk/marketing sends check it.

ALTER TABLE "ClientEnrollment" ADD COLUMN "unsubscribedAt" TIMESTAMP(3);

-- The bulk senders filter on this, so index the common "still subscribed" lookup.
CREATE INDEX "ClientEnrollment_unsubscribedAt_idx" ON "ClientEnrollment"("unsubscribedAt");
