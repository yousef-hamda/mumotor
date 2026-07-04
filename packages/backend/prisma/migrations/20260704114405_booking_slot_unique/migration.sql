-- Prevent double-booking at the database level: at most ONE active (non-cancelled)
-- booking per (website, date, time). Partial so a CANCELLED slot is rebookable.
-- A concurrent second booking now hits a 23505 unique violation, which Prisma
-- surfaces as P2002 → the book route already maps it to a friendly 409
-- ("That slot was just taken"). The in-transaction findFirst stays as a fast pre-check.
CREATE UNIQUE INDEX IF NOT EXISTS "Booking_slot_unique"
  ON "Booking" ("websiteId", "bookingDate", "bookingTime")
  WHERE status <> 'CANCELLED';
