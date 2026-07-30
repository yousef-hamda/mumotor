/**
 * Captures the WIRE FORMAT of one bulk and one transactional email, in a FRESH process.
 *
 * Must be a child process: the email transport is chosen at module load from the parsed
 * config, so setting RESEND_API_KEY in-process has no effect and the send silently falls
 * through to the console transport — which captures nothing and passes vacuously.
 *
 * Spawned by unsubscribe.check.ts. Prints one JSON line for the parent to assert on.
 */
const wire: Array<Record<string, unknown>> = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: unknown, init: { body?: string }) => {
  if (String(url).includes('resend.com')) {
    wire.push(JSON.parse(init.body ?? '{}'));
    return new Response(JSON.stringify({ id: 'test' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }
  return realFetch(url as string, init as RequestInit);
}) as typeof fetch;

const { sendDailyBookingOpen, sendBookingConfirmation } = await import('../src/services/email/emailService.js');
const brand = { schoolName: 'Unsub Test School', locale: 'en' as const };

await sendDailyBookingOpen('s@example.com', {
  studentName: 'A',
  bookingUrl: 'https://example.com/book',
  forDate: '2026-08-01',
  brand,
  unsubscribeUrl: 'https://mumotor.com/unsubscribe/TESTTOKEN',
});
await sendBookingConfirmation('s@example.com', {
  studentName: 'A',
  date: '2026-08-02',
  time: '10:00',
  brand,
});

const [bulk, transactional] = wire as Array<{ headers?: Record<string, string>; html?: string }>;
console.log(
  `WIRE=${JSON.stringify({
    captured: wire.length,
    bulkListUnsub: bulk?.headers?.['List-Unsubscribe'] ?? null,
    bulkListUnsubPost: bulk?.headers?.['List-Unsubscribe-Post'] ?? null,
    bulkHasFooterLink: /unsubscribe\/TESTTOKEN/.test(bulk?.html ?? ''),
    transHasHeader: Boolean(transactional?.headers?.['List-Unsubscribe']),
    transHasLink: /unsubscribe/i.test(transactional?.html ?? ''),
  })}`
);
process.exit(0);
