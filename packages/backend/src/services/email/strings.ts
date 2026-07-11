// Trilingual (EN / HE / AR) copy for the transactional EMAILS that Mumotor
// sends on behalf of a teacher's site. The email language comes from the
// SITE's locale (`Website.locale`), NOT the recipient's browser — so this is a
// plain locale-keyed lookup (mirrors the student-facing `lib/bookingStrings.ts`
// on the frontend; reuse its wording/terms so an email matches the page it
// links to).
//
// EN wording is intentionally byte-identical to the previous hardcoded literals
// in emailService.ts, so English output is unchanged. Numbers/dates stay Latin
// digits in every locale; `{...}` placeholders interpolate verbatim.

export type EmailLocale = 'en' | 'he' | 'ar';

/** Normalize a backend Locale ('EN'|'HE'|'AR', maybe lowercase/null) to an EmailLocale. */
export function emailLocale(l?: string | null): EmailLocale {
  const v = (l ?? '').toLowerCase();
  if (v === 'he') return 'he';
  if (v === 'ar') return 'ar';
  return 'en';
}

// The EN dictionary is the source of truth for the key set — `he`/`ar` are typed
// `typeof en`, so a missing (or misspelled) key is a COMPILE error.
const en = {
  // ── layout footer ──
  footerSchool: 'Sent by {name} · powered by Mumotor',
  footerMumotor: 'Sent by Mumotor',

  // ── <title> per email ──
  titleConfirmed: 'Lesson confirmed',
  titleReminder: 'Lesson reminder',
  titleBookingOpen: 'Booking open',
  titleDailyReport: 'Daily report',
  titleBookingLink: 'Booking link',
  titleCancelled: 'Lesson cancelled',
  titleReview: 'Leave a review',
  titleWelcome: 'Welcome',

  // ── shared info-box labels ──
  labelDate: 'Date',
  labelTime: 'Time',
  labelDuration: 'Duration',
  labelInstructor: 'Instructor',
  durationMin: '{n} min',
  dateAtTime: '{date} at {time}',
  orOpenLink: 'Or open this link: {url}',

  // ── booking confirmation ──
  confHeading: 'Your lesson is confirmed',
  confBodyWithSchool: 'Hi {name}, your driving lesson with <strong>{school}</strong> is booked.',
  confBodyNoSchool: 'Hi {name}, your driving lesson is booked.',
  confArrive: "Please arrive 5 minutes early. We'll send you a reminder before your lesson.",
  subjConfirmed: 'Lesson confirmed — {date} at {time}',

  // ── booking reminder ──
  remHeading: 'Lesson reminder',
  remBodyWithSchool: 'Hi {name}, your driving lesson with <strong>{school}</strong> is coming up soon.',
  remBodyNoSchool: 'Hi {name}, your driving lesson is coming up soon.',
  remOutro: 'See you soon — drive safe getting here.',
  subjReminder: 'Reminder: lesson today at {time}',

  // ── daily booking open ──
  openHeading: 'Booking is now open',
  openBodyWithSchool:
    'Hi {name}, you can now book your driving lesson with <strong>{school}</strong> for <strong>{date}</strong>. Slots fill up quickly.',
  openBodyNoSchool:
    'Hi {name}, you can now book your driving lesson for <strong>{date}</strong>. Slots fill up quickly.',
  openBtn: 'Book a lesson',
  subjOpenSchool: 'Booking is open at {school}',
  subjOpenNoSchool: 'Booking is open for your next driving lesson',

  // ── teacher daily report ──
  headingToday: "Today's schedule",
  headingTomorrow: "Tomorrow's schedule",
  reportIntro: "Hi {name} — here's {date}.",
  tileBooked: 'Booked',
  tileFree: 'Free',
  tileTotal: 'Total',
  slotFree: 'Free',
  studentFallback: 'Student',
  noPhone: 'No phone on file',
  noLessons: 'No lessons scheduled.',
  tapNumber: "Tap a student's number to call or message them.",
  subjReport: '{heading} — {date} · {n} lesson(s)',

  // ── bulk custom email (only the greeting wrapper is localized) ──
  bulkHi: 'Hi {name},',

  // ── magic booking link ──
  magicHeading: 'Your booking link',
  magicBodyNamed:
    'Hi {name}, use the button below to book a lesson without re-entering your code. This link works once and expires in 15 minutes.',
  magicBodyAnon:
    'Hi, use the button below to book a lesson without re-entering your code. This link works once and expires in 15 minutes.',
  magicBtn: 'Open booking',
  subjMagic: 'Your one-time booking link',

  // ── booking cancelled ──
  cancHeading: 'Lesson cancelled',
  cancTeacherWithSchool:
    'Hi {name}, unfortunately your driving lesson with <strong>{school}</strong> had to be cancelled.',
  cancTeacherNoSchool: 'Hi {name}, unfortunately your driving lesson had to be cancelled.',
  cancStudent:
    'Hi {name}, {student} cancelled their lesson — the slot is open again for other students.',
  cancAStudent: 'a student',
  cancOutroTeacher: 'Sorry for the inconvenience — you can book a new time whenever suits you.',
  cancOutroStudent: 'No action needed; your availability updated automatically.',
  subjCancelled: 'Lesson cancelled — {date} at {time}',

  // ── review request ──
  revHeading: 'How was your lesson?',
  revBodyWithSchool:
    'Hi {name}, thanks for driving with <strong>{school}</strong> today. A short review helps other students choose their instructor — it takes less than a minute.',
  revBodyNoSchool:
    'Hi {name}, thanks for driving with us today. A short review helps other students choose their instructor — it takes less than a minute.',
  revBtn: 'Leave a review',
  subjReview: 'How was your lesson?',

  // ── welcome / enrollment ──
  welHeading: 'Welcome to {school}',
  welBodyWithSchool:
    "Hi {name}, you're enrolled at <strong>{school}</strong>. Each morning you'll get an email when booking opens, and you can book a lesson anytime.",
  welBodyNoSchool:
    "Hi {name}, you're enrolled. Each morning you'll get an email when booking opens, and you can book a lesson anytime.",
  welBtn: 'Book your first lesson',
  subjWelcome: "You're enrolled at {school}",
};

const he: typeof en = {
  footerSchool: 'נשלח על ידי {name} · מופעל על ידי Mumotor',
  footerMumotor: 'נשלח על ידי Mumotor',

  titleConfirmed: 'השיעור אושר',
  titleReminder: 'תזכורת לשיעור',
  titleBookingOpen: 'ההזמנה פתוחה',
  titleDailyReport: 'דוח יומי',
  titleBookingLink: 'קישור להזמנה',
  titleCancelled: 'השיעור בוטל',
  titleReview: 'השארת ביקורת',
  titleWelcome: 'ברוכים הבאים',

  labelDate: 'תאריך',
  labelTime: 'שעה',
  labelDuration: 'משך',
  labelInstructor: 'מורה',
  durationMin: '{n} דקות',
  dateAtTime: '{date} בשעה {time}',
  orOpenLink: 'או פתחו קישור זה: {url}',

  confHeading: 'השיעור שלך אושר',
  confBodyWithSchool: 'שלום {name}, שיעור הנהיגה שלך עם <strong>{school}</strong> הוזמן.',
  confBodyNoSchool: 'שלום {name}, שיעור הנהיגה שלך הוזמן.',
  confArrive: 'נא להגיע 5 דקות לפני. נשלח לך תזכורת לפני השיעור.',
  subjConfirmed: 'השיעור אושר — {date} בשעה {time}',

  remHeading: 'תזכורת לשיעור',
  remBodyWithSchool: 'שלום {name}, שיעור הנהיגה שלך עם <strong>{school}</strong> מתקרב.',
  remBodyNoSchool: 'שלום {name}, שיעור הנהיגה שלך מתקרב.',
  remOutro: 'נתראה בקרוב — נסיעה בטוחה עד אלינו.',
  subjReminder: 'תזכורת: שיעור היום בשעה {time}',

  openHeading: 'ההזמנה פתוחה כעת',
  openBodyWithSchool:
    'שלום {name}, אפשר כעת להזמין את שיעור הנהיגה שלך עם <strong>{school}</strong> ל־<strong>{date}</strong>. המקומות מתמלאים במהירות.',
  openBodyNoSchool:
    'שלום {name}, אפשר כעת להזמין את שיעור הנהיגה שלך ל־<strong>{date}</strong>. המקומות מתמלאים במהירות.',
  openBtn: 'הזמנת שיעור',
  subjOpenSchool: 'ההזמנה פתוחה ב{school}',
  subjOpenNoSchool: 'ההזמנה פתוחה לשיעור הנהיגה הבא שלך',

  headingToday: 'לוח הזמנים של היום',
  headingTomorrow: 'לוח הזמנים של מחר',
  reportIntro: 'שלום {name} — הנה {date}.',
  tileBooked: 'תפוסים',
  tileFree: 'פנויים',
  tileTotal: 'סה״כ',
  slotFree: 'פנוי',
  studentFallback: 'תלמיד',
  noPhone: 'אין טלפון רשום',
  noLessons: 'אין שיעורים מתוזמנים.',
  tapNumber: 'הקישו על מספר של תלמיד כדי להתקשר או לשלוח הודעה.',
  subjReport: '{heading} — {date} · {n} שיעורים',

  bulkHi: 'שלום {name},',

  magicHeading: 'קישור ההזמנה שלך',
  magicBodyNamed:
    'שלום {name}, השתמשו בכפתור למטה כדי להזמין שיעור בלי להזין שוב את הקוד. הקישור פועל פעם אחת ופג בתוך 15 דקות.',
  magicBodyAnon:
    'שלום, השתמשו בכפתור למטה כדי להזמין שיעור בלי להזין שוב את הקוד. הקישור פועל פעם אחת ופג בתוך 15 דקות.',
  magicBtn: 'פתיחת ההזמנה',
  subjMagic: 'קישור הזמנה חד־פעמי',

  cancHeading: 'השיעור בוטל',
  cancTeacherWithSchool: 'שלום {name}, לצערנו שיעור הנהיגה שלך עם <strong>{school}</strong> בוטל.',
  cancTeacherNoSchool: 'שלום {name}, לצערנו שיעור הנהיגה שלך בוטל.',
  cancStudent: 'שלום {name}, {student} ביטל/ה את השיעור — המקום פנוי שוב לתלמידים אחרים.',
  cancAStudent: 'תלמיד',
  cancOutroTeacher: 'מצטערים על אי הנוחות — אפשר להזמין מועד חדש מתי שנוח לך.',
  cancOutroStudent: 'לא נדרשת פעולה; הזמינות שלך עודכנה אוטומטית.',
  subjCancelled: 'השיעור בוטל — {date} בשעה {time}',

  revHeading: 'איך היה השיעור?',
  revBodyWithSchool:
    'שלום {name}, תודה שנהגת עם <strong>{school}</strong> היום. ביקורת קצרה עוזרת לתלמידים אחרים לבחור מורה — זה לוקח פחות מדקה.',
  revBodyNoSchool:
    'שלום {name}, תודה שנהגת איתנו היום. ביקורת קצרה עוזרת לתלמידים אחרים לבחור מורה — זה לוקח פחות מדקה.',
  revBtn: 'השארת ביקורת',
  subjReview: 'איך היה השיעור?',

  welHeading: 'ברוכים הבאים ל{school}',
  welBodyWithSchool:
    'שלום {name}, נרשמת ל<strong>{school}</strong>. כל בוקר תקבל/י אימייל כשההזמנה נפתחת, ואפשר להזמין שיעור בכל עת.',
  welBodyNoSchool:
    'שלום {name}, נרשמת. כל בוקר תקבל/י אימייל כשההזמנה נפתחת, ואפשר להזמין שיעור בכל עת.',
  welBtn: 'הזמנת השיעור הראשון',
  subjWelcome: 'נרשמת ל{school}',
};

const ar: typeof en = {
  footerSchool: 'أُرسل بواسطة {name} · مشغّل بواسطة Mumotor',
  footerMumotor: 'أُرسل بواسطة Mumotor',

  titleConfirmed: 'تم تأكيد الدرس',
  titleReminder: 'تذكير بالدرس',
  titleBookingOpen: 'الحجز مفتوح',
  titleDailyReport: 'التقرير اليومي',
  titleBookingLink: 'رابط الحجز',
  titleCancelled: 'تم إلغاء الدرس',
  titleReview: 'اترك تقييماً',
  titleWelcome: 'مرحباً',

  labelDate: 'التاريخ',
  labelTime: 'الوقت',
  labelDuration: 'المدة',
  labelInstructor: 'المدرّب',
  durationMin: '{n} دقيقة',
  dateAtTime: '{date} في {time}',
  orOpenLink: 'أو افتح هذا الرابط: {url}',

  confHeading: 'تم تأكيد درسك',
  confBodyWithSchool: 'مرحباً {name}، تم حجز درس القيادة الخاص بك مع <strong>{school}</strong>.',
  confBodyNoSchool: 'مرحباً {name}، تم حجز درس القيادة الخاص بك.',
  confArrive: 'الرجاء الحضور قبل 5 دقائق. سنرسل لك تذكيراً قبل درسك.',
  subjConfirmed: 'تم تأكيد الدرس — {date} في {time}',

  remHeading: 'تذكير بالدرس',
  remBodyWithSchool: 'مرحباً {name}، يقترب موعد درس القيادة الخاص بك مع <strong>{school}</strong>.',
  remBodyNoSchool: 'مرحباً {name}، يقترب موعد درس القيادة الخاص بك.',
  remOutro: 'نراك قريباً — قد بأمان في طريقك إلينا.',
  subjReminder: 'تذكير: درس اليوم في {time}',

  openHeading: 'الحجز مفتوح الآن',
  openBodyWithSchool:
    'مرحباً {name}، يمكنك الآن حجز درس القيادة الخاص بك مع <strong>{school}</strong> ليوم <strong>{date}</strong>. تمتلئ المواعيد بسرعة.',
  openBodyNoSchool:
    'مرحباً {name}، يمكنك الآن حجز درس القيادة الخاص بك ليوم <strong>{date}</strong>. تمتلئ المواعيد بسرعة.',
  openBtn: 'احجز درساً',
  subjOpenSchool: 'الحجز مفتوح في {school}',
  subjOpenNoSchool: 'الحجز مفتوح لدرس القيادة التالي',

  headingToday: 'جدول اليوم',
  headingTomorrow: 'جدول الغد',
  reportIntro: 'مرحباً {name} — إليك {date}.',
  tileBooked: 'محجوزة',
  tileFree: 'متاحة',
  tileTotal: 'الإجمالي',
  slotFree: 'متاح',
  studentFallback: 'طالب',
  noPhone: 'لا يوجد هاتف مسجّل',
  noLessons: 'لا دروس مجدولة.',
  tapNumber: 'اضغط على رقم الطالب للاتصال به أو مراسلته.',
  subjReport: '{heading} — {date} · {n} دروس',

  bulkHi: 'مرحباً {name}،',

  magicHeading: 'رابط الحجز الخاص بك',
  magicBodyNamed:
    'مرحباً {name}، استخدم الزر أدناه لحجز درس دون إعادة إدخال رمزك. يعمل هذا الرابط مرة واحدة وتنتهي صلاحيته خلال 15 دقيقة.',
  magicBodyAnon:
    'مرحباً، استخدم الزر أدناه لحجز درس دون إعادة إدخال رمزك. يعمل هذا الرابط مرة واحدة وتنتهي صلاحيته خلال 15 دقيقة.',
  magicBtn: 'فتح الحجز',
  subjMagic: 'رابط حجز لمرة واحدة',

  cancHeading: 'تم إلغاء الدرس',
  cancTeacherWithSchool:
    'مرحباً {name}، للأسف تم إلغاء درس القيادة الخاص بك مع <strong>{school}</strong>.',
  cancTeacherNoSchool: 'مرحباً {name}، للأسف تم إلغاء درس القيادة الخاص بك.',
  cancStudent: 'مرحباً {name}، ألغى {student} درسه — أصبح الموعد متاحاً مجدداً لطلاب آخرين.',
  cancAStudent: 'أحد الطلاب',
  cancOutroTeacher: 'نأسف للإزعاج — يمكنك حجز موعد جديد متى ما ناسبك.',
  cancOutroStudent: 'لا حاجة لأي إجراء؛ تم تحديث توفّرك تلقائياً.',
  subjCancelled: 'تم إلغاء الدرس — {date} في {time}',

  revHeading: 'كيف كان درسك؟',
  revBodyWithSchool:
    'مرحباً {name}، شكراً لقيادتك مع <strong>{school}</strong> اليوم. تقييم قصير يساعد الطلاب الآخرين على اختيار مدرّبهم — يستغرق أقل من دقيقة.',
  revBodyNoSchool:
    'مرحباً {name}، شكراً لقيادتك معنا اليوم. تقييم قصير يساعد الطلاب الآخرين على اختيار مدرّبهم — يستغرق أقل من دقيقة.',
  revBtn: 'اترك تقييماً',
  subjReview: 'كيف كان درسك؟',

  welHeading: 'مرحباً بك في {school}',
  welBodyWithSchool:
    'مرحباً {name}، تم تسجيلك في <strong>{school}</strong>. كل صباح ستصلك رسالة عند فتح الحجز، ويمكنك حجز درس في أي وقت.',
  welBodyNoSchool:
    'مرحباً {name}، تم تسجيلك. كل صباح ستصلك رسالة عند فتح الحجز، ويمكنك حجز درس في أي وقت.',
  welBtn: 'احجز درسك الأول',
  subjWelcome: 'تم تسجيلك في {school}',
};

const DICTS: Record<EmailLocale, typeof en> = { en, he, ar };

/** Interpolate `{var}` placeholders (same pattern as bookingStrings' `fmt`). */
function fmt(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

/** Localized email string with `{var}` interpolation. Unknown locale → English. */
export function emailT(
  locale: EmailLocale,
  key: keyof typeof en,
  vars?: Record<string, string | number>
): string {
  const dict = DICTS[locale] ?? en;
  return fmt(dict[key] ?? en[key], vars);
}
