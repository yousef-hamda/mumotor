# AWS SES production access — reply for case 178421425200085

**Account:** 818986457821 · **Region:** eu-north-1 (Europe, Stockholm) · **Domain:** mumotor.com

## How to send it

The case has gone quiet (AWS chased on 23 and 26 July), so it may show as resolved.

1. Open <https://console.aws.amazon.com/support/home#/case/?displayId=178421425200085>
2. If it is closed, click **Reopen case**. If reopening isn't offered, open a new
   *Service limit increase → SES Sending Limits* case and paste the same text, adding
   "This follows case 178421425200085."
3. Paste everything under the line below. Do not attach anything — AWS reviewers read the
   case text.

Everything in this reply is true as of 30 July 2026 and verifiable at the URLs given.

---

Hello,

Thank you for the follow-up on case 178421425200085, and apologies for the delay in
responding. We used the time to close a real gap in our sending practices — specifically
around unsubscribe handling — rather than reply before it was in place. Details below.

**What Mumotor is**

Mumotor (https://mumotor.com) is a website builder and booking platform for independent
driving instructors in Israel. Each instructor gets their own site and manages their own
students. Email is a core part of the service: students book driving lessons and need to be
told when their lesson is.

**Who receives our email, and how they got on the list**

We do not have a marketing list, and we never import, buy, rent or scrape addresses. There
are exactly two ways an address enters our system:

1. A student enrols with a specific instructor by entering a one-time enrolment code that
   the instructor gave them, and types in their own email address.
2. The instructor adds a student they already teach, using the student's own address.

Every recipient therefore has a direct, existing relationship with the instructor whose
name is on the email. There is no way to receive mail from us without one.

**What we send**

Transactional, tied to a specific booking the recipient made:

- Booking confirmation — sent when a student books a lesson.
- Lesson reminder — sent about two hours before their lesson.
- Cancellation notice — sent if the lesson is cancelled.
- Login link and welcome message — sent when the student signs in or first enrols.
- Password reset and email verification — for instructor accounts.

Non-transactional, and all opt-out-able:

- A "booking is open" notice telling a student they can book their next lesson.
- Occasional announcements an instructor sends their own students (for example, a change in
  hours over a holiday).
- A review request after a completed lesson.

**Volume**

Small and directly proportional to real activity. Today it is a handful of instructors and
their students — on the order of tens of emails per day. Every send is triggered either by a
booking or by an instructor's own students being notified; there is no bulk campaign
capability in the product. We expect steady growth rather than any spike, and would rather
request a modest limit and grow into it than ask for headroom we do not need.

**How we handle unsubscribe requests**

This is what we spent the delay building, and it is live in production now:

- Every non-transactional email carries the `List-Unsubscribe` and
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers, so mailbox providers can
  offer one-click unsubscribe (RFC 8058). Our endpoint acts immediately on the POST, with no
  confirmation step and no login, and is idempotent under provider retries.
- The same emails carry a visible unsubscribe link in the footer, in the recipient's own
  language (we support Hebrew, Arabic and English).
- The unsubscribe link never expires. It is a signed token rather than a session, so a link
  in a months-old email still works.
- Once someone opts out, we stop sending them every non-transactional email — the booking
  notice, instructor announcements and review requests all check it before sending.
- Transactional mail about a lesson the recipient personally booked continues, which we
  believe is both correct and expected. We do not put an unsubscribe link on those, since it
  would invite someone to opt out of being told when their own lesson is.
- Opt-out is scoped to one instructor. A student learning with two instructors who
  unsubscribes from one remains subscribed to the other, because those are two separate
  relationships.

You can see the live endpoint at `https://mumotor.com/unsubscribe/<token>`; an invalid token
returns a plain "this link is not valid" page rather than an error.

**How we handle bounces and complaints**

- Our domain is verified in eu-north-1 with DKIM signing and a custom MAIL FROM subdomain
  (`mail.mumotor.com`) already configured and passing.
- We currently send through a transactional provider that performs bounce suppression, and
  we have never had a complaint or a blocklisting.
- On approval, we will subscribe to SES bounce and complaint notifications via SNS and write
  both into the same per-recipient suppression the unsubscribe flow already uses, so a hard
  bounce or a complaint permanently stops sending to that address across the platform. The
  suppression check already sits in front of every send, so this is a matter of adding
  another writer to it. We will also enable SES account-level suppression.
- Addresses are never re-added: our lists are not imported, so a suppressed recipient can
  only return by deliberately enrolling again.

**Sample content**

A booking confirmation reads, in full:

> **Your lesson is confirmed**
> Hi Noa, your driving lesson with **David's Driving School** is booked.
> Date: 2026-08-02 · Time: 10:00 · Duration: 60 min · Instructor: David Cohen
> Please arrive 5 minutes early. We'll send you a reminder before your lesson.

A "booking is open" notice reads:

> **Booking is open**
> Hi Noa, booking is now open at **David's Driving School** for 2026-08-03.
> [Book your lesson]
> *Unsubscribe from these emails*

Every message is plainly identified with the instructor's business name, contains no
promotional content beyond the instructor's own service, and is sent from our verified
domain.

**What we are asking for**

Production access in eu-north-1, at whatever sending limit you consider appropriate for our
current volume. We are happy to start conservatively.

Thank you for your time.

---

## After they approve

1. Turn it on: `railway variables --service mumotor --set SES_ENABLED=true`
   (the credentials and `SES_REGION` are already set; `SES_ENABLED` is currently absent,
   which is why the code correctly keeps using Resend.)
2. Send one real test to an outside address and confirm DKIM passes.
3. Wire the SNS bounce/complaint webhook, as promised above. Leaving that undone after
   saying it in a support case is the fastest way to lose the access again.

**Do not set `SES_ENABLED=true` before approval.** In the sandbox, SES only delivers to
verified addresses — student confirmations and reminders would silently fail.
