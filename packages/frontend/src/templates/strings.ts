// Trilingual (EN / HE / AR) template copy. Templates stay pure functions of
// TemplateData — this is a plain lookup keyed by data.locale, NOT react-i18next.
// HE/AR translations are adapted from the human-written dictionary in
// backend/src/services/ai/templateStrings.ts (the two files serve different
// pipelines and are deliberately independent).
//
// Contract with Customize mode: templates keep `data.copy?.<key> ?? s.<key>`
// so a user's Customize edit (stored in data.copy) always wins over these
// locale defaults, and `data-edit` attributes are untouched.
import type { Locale, Faq, Review } from './types';

export interface TemplateStrings {
  // Navigation
  navAbout: string;
  navLessons: string;
  navPricing: string;
  navPlans: string;
  navReviews: string;
  navFaq: string;
  navContact: string;
  navAreas: string;
  navAccount: string;
  navGallery: string;
  navHours: string;

  // Buttons / labels
  bookCta: string;
  enrollCta: string;
  packageCta: string;
  packageCtaPopular: string;
  learnMore: string;
  callCta: string;

  // Badges & micro copy
  badgePopular: string;
  closedLabel: string;
  hoursLabel: string;
  enrollLabel: string;
  minutesShort: string;
  lessonDurationSuffix: string;

  // Hero (data-layer defaults)
  heroEyebrow: string;
  heroEyebrowIn: string; // {area}
  heroSub: string; // {teacher}
  heroSubIn: string; // {teacher} {area}

  // Sections — eyebrows / headings / subs
  aboutEyebrow: string;
  whyEyebrow: string;
  whyHeading: string;
  packagesEyebrow: string;
  packagesHeading: string;
  packagesSub: string;
  reviewsEyebrow: string;
  reviewsHeading: string;
  reviewsSub: string;
  galleryEyebrow: string;
  galleryHeading: string;
  gallerySub: string;
  faqEyebrow: string;
  faqHeading: string;
  areasEyebrow: string;
  areasHeading: string;
  areasSub: string;
  contactEyebrow: string;
  contactHeading: string;
  hoursHeading: string;
  bookEyebrow: string;
  bookHeading: string;
  bookBody: string;
  footerCredit: string;

  // Stats labels (data layer)
  statYears: string;
  statPerLesson: string;
  statMinutes: string;
  statDays: string;

  // Areas notes (data layer)
  areaHomeBase: string;
  areaTestRoutes: string;
  areaEveningWeekend: string;
  areaPickup: string;

  // Plan defaults (data layer)
  planSingleName: string;
  planPerLessonUnit: string;
  planPickup: string;
  planNoCommitment: string;
  transmissionBoth: string;
  transmissionManual: string;
  transmissionAutomatic: string;

  // Experience label — {n} interpolated
  experienceYears: string;
  taglineDefault: string;
  instructorRole: string;
}

export function fmt(s: string, vars: Record<string, string | number>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

const en: TemplateStrings = {
  navAbout: 'About',
  navLessons: 'Lessons',
  navPricing: 'Pricing',
  navPlans: 'Plans',
  navReviews: 'Reviews',
  navFaq: 'FAQ',
  navContact: 'Contact',
  navAreas: 'Areas',
  navAccount: 'My account',
  navGallery: 'Gallery',
  navHours: 'Hours',

  bookCta: 'Book a lesson',
  enrollCta: 'Enroll now',
  packageCta: 'Choose plan',
  packageCtaPopular: 'Get started',
  learnMore: 'Learn more',
  callCta: 'Call us',

  badgePopular: 'Most popular',
  closedLabel: 'Closed',
  hoursLabel: 'Opening hours',
  enrollLabel: 'Enroll',
  minutesShort: 'min',
  lessonDurationSuffix: '-minute lessons',

  heroEyebrow: 'Driving lessons',
  heroEyebrowIn: 'Driving lessons in {area}',
  heroSub: 'One-to-one lessons with {teacher}. Book your first lesson in under a minute.',
  heroSubIn: 'One-to-one lessons with {teacher} across {area}. Book your first lesson in under a minute.',

  aboutEyebrow: 'About',
  whyEyebrow: 'Why learn here',
  whyHeading: 'Built around how you actually learn.',
  packagesEyebrow: 'Pricing',
  packagesHeading: 'Simple, fair pricing.',
  packagesSub: 'Pick a single lesson or save with a package — no hidden fees.',
  reviewsEyebrow: 'Reviews',
  reviewsHeading: 'What students say',
  reviewsSub: 'Real words from real passes.',
  galleryEyebrow: 'Gallery',
  galleryHeading: 'On the road',
  gallerySub: 'Moments from real lessons.',
  faqEyebrow: 'FAQ',
  faqHeading: 'Common questions',
  areasEyebrow: 'Coverage',
  areasHeading: 'Areas we cover',
  areasSub: 'Door-to-door pickup across the area.',
  contactEyebrow: 'Contact',
  contactHeading: 'Get in touch',
  hoursHeading: 'Opening hours',
  bookEyebrow: 'Booking',
  bookHeading: 'Ready to start driving?',
  bookBody: 'Enroll with the code from your instructor and book your first lesson today.',
  footerCredit: 'Built with Mumotor',

  statYears: 'Years of experience',
  statPerLesson: 'Per lesson',
  statMinutes: 'Minutes a lesson',
  statDays: 'Days a week',

  areaHomeBase: 'Home base',
  areaTestRoutes: 'Test-centre routes',
  areaEveningWeekend: 'Evening & weekend slots',
  areaPickup: 'Pickup on request',

  planSingleName: 'Single lesson',
  planPerLessonUnit: '/ lesson',
  planPickup: 'Door-to-door pickup',
  planNoCommitment: 'No commitment',
  transmissionBoth: 'Manual or automatic',
  transmissionManual: 'Manual transmission',
  transmissionAutomatic: 'Automatic transmission',

  experienceYears: '{n}+ years',
  taglineDefault: 'Pass first time, drive for life.',
  instructorRole: 'Driving instructor',
};

const he: TemplateStrings = {
  navAbout: 'אודות',
  navLessons: 'שיעורים',
  navPricing: 'מחירים',
  navPlans: 'מסלולים',
  navReviews: 'ביקורות',
  navFaq: 'שאלות נפוצות',
  navContact: 'צור קשר',
  navAreas: 'אזורים',
  navAccount: 'האזור שלי',
  navGallery: 'גלריה',
  navHours: 'שעות פעילות',

  bookCta: 'הזמנת שיעור',
  enrollCta: 'להרשמה',
  packageCta: 'בחירת מסלול',
  packageCtaPopular: 'בואו נתחיל',
  learnMore: 'למידע נוסף',
  callCta: 'התקשרו אלינו',

  badgePopular: 'הכי פופולרי',
  closedLabel: 'סגור',
  hoursLabel: 'שעות פעילות',
  enrollLabel: 'הרשמה',
  minutesShort: 'דק׳',
  lessonDurationSuffix: ' דקות לשיעור',

  heroEyebrow: 'שיעורי נהיגה',
  heroEyebrowIn: 'שיעורי נהיגה ב{area}',
  heroSub: 'שיעורים אישיים עם {teacher}. מזמינים שיעור ראשון בפחות מדקה.',
  heroSubIn: 'שיעורים אישיים עם {teacher} באזור {area}. מזמינים שיעור ראשון בפחות מדקה.',

  aboutEyebrow: 'אודות',
  whyEyebrow: 'למה ללמוד כאן',
  whyHeading: 'בנוי סביב איך שבאמת לומדים.',
  packagesEyebrow: 'מחירים',
  packagesHeading: 'מחיר פשוט והוגן.',
  packagesSub: 'שיעור בודד או חיסכון עם חבילה — בלי עלויות נסתרות.',
  reviewsEyebrow: 'ביקורות',
  reviewsHeading: 'מה התלמידים אומרים',
  reviewsSub: 'מילים אמיתיות ממי שכבר עברו.',
  galleryEyebrow: 'גלריה',
  galleryHeading: 'על הכביש',
  gallerySub: 'רגעים משיעורים אמיתיים.',
  faqEyebrow: 'שאלות נפוצות',
  faqHeading: 'שאלות נפוצות',
  areasEyebrow: 'אזורי שירות',
  areasHeading: 'האזורים שלנו',
  areasSub: 'איסוף עד הבית בכל האזור.',
  contactEyebrow: 'צור קשר',
  contactHeading: 'דברו איתנו',
  hoursHeading: 'שעות פעילות',
  bookEyebrow: 'הזמנה',
  bookHeading: 'מוכנים להתחיל לנהוג?',
  bookBody: 'נרשמים עם הקוד מהמורה ומזמינים את השיעור הראשון עוד היום.',
  footerCredit: 'נבנה עם Mumotor',

  statYears: 'שנות ניסיון',
  statPerLesson: 'לשיעור',
  statMinutes: 'דקות לשיעור',
  statDays: 'ימים בשבוע',

  areaHomeBase: 'אזור הבית',
  areaTestRoutes: 'מסלולי טסט',
  areaEveningWeekend: 'ערבים וסופי שבוע',
  areaPickup: 'איסוף לפי בקשה',

  planSingleName: 'שיעור בודד',
  planPerLessonUnit: '/ שיעור',
  planPickup: 'איסוף עד הבית',
  planNoCommitment: 'ללא התחייבות',
  transmissionBoth: 'ידני או אוטומט',
  transmissionManual: 'רכב ידני',
  transmissionAutomatic: 'רכב אוטומטי',

  experienceYears: '{n}+ שנים',
  taglineDefault: 'עוברים טסט בפעם הראשונה, נוהגים לכל החיים.',
  instructorRole: 'מורה לנהיגה',
};

const ar: TemplateStrings = {
  navAbout: 'من نحن',
  navLessons: 'الدروس',
  navPricing: 'الأسعار',
  navPlans: 'الباقات',
  navReviews: 'التقييمات',
  navFaq: 'الأسئلة الشائعة',
  navContact: 'تواصل',
  navAreas: 'المناطق',
  navAccount: 'حسابي',
  navGallery: 'معرض الصور',
  navHours: 'ساعات العمل',

  bookCta: 'احجز درساً',
  enrollCta: 'سجّل الآن',
  packageCta: 'اختر الباقة',
  packageCtaPopular: 'ابدأ الآن',
  learnMore: 'اعرف المزيد',
  callCta: 'اتصل بنا',

  badgePopular: 'الأكثر طلباً',
  closedLabel: 'مغلق',
  hoursLabel: 'ساعات العمل',
  enrollLabel: 'التسجيل',
  minutesShort: 'د',
  lessonDurationSuffix: ' دقيقة للدرس',

  heroEyebrow: 'دروس قيادة',
  heroEyebrowIn: 'دروس قيادة في {area}',
  heroSub: 'دروس فردية مع {teacher}. احجز درسك الأول في أقل من دقيقة.',
  heroSubIn: 'دروس فردية مع {teacher} في {area}. احجز درسك الأول في أقل من دقيقة.',

  aboutEyebrow: 'من نحن',
  whyEyebrow: 'لماذا تتعلم هنا',
  whyHeading: 'مصمّم حول طريقة تعلّمك الفعلية.',
  packagesEyebrow: 'الأسعار',
  packagesHeading: 'أسعار بسيطة وعادلة.',
  packagesSub: 'درس واحد أو وفّر مع باقة — بلا رسوم خفية.',
  reviewsEyebrow: 'التقييمات',
  reviewsHeading: 'ماذا يقول الطلاب',
  reviewsSub: 'كلمات حقيقية من ناجحين حقيقيين.',
  galleryEyebrow: 'معرض الصور',
  galleryHeading: 'على الطريق',
  gallerySub: 'لحظات من دروس حقيقية.',
  faqEyebrow: 'الأسئلة الشائعة',
  faqHeading: 'أسئلة شائعة',
  areasEyebrow: 'مناطق الخدمة',
  areasHeading: 'المناطق التي نغطيها',
  areasSub: 'اصطحاب من الباب إلى الباب في كل المنطقة.',
  contactEyebrow: 'تواصل',
  contactHeading: 'تواصل معنا',
  hoursHeading: 'ساعات العمل',
  bookEyebrow: 'الحجز',
  bookHeading: 'جاهز لتبدأ القيادة؟',
  bookBody: 'سجّل بالرمز من مدرّبك واحجز درسك الأول اليوم.',
  footerCredit: 'صُنع بواسطة Mumotor',

  statYears: 'سنوات الخبرة',
  statPerLesson: 'للدرس',
  statMinutes: 'دقيقة للدرس',
  statDays: 'أيام في الأسبوع',

  areaHomeBase: 'المنطقة الرئيسية',
  areaTestRoutes: 'مسارات الاختبار',
  areaEveningWeekend: 'مساءً وعطلات نهاية الأسبوع',
  areaPickup: 'اصطحاب عند الطلب',

  planSingleName: 'درس واحد',
  planPerLessonUnit: '/ درس',
  planPickup: 'اصطحاب من الباب إلى الباب',
  planNoCommitment: 'بدون التزام',
  transmissionBoth: 'يدوي أو أوتوماتيك',
  transmissionManual: 'ناقل يدوي',
  transmissionAutomatic: 'ناقل أوتوماتيكي',

  experienceYears: '{n}+ سنوات',
  taglineDefault: 'انجح من أول مرة، وقُد مدى الحياة.',
  instructorRole: 'مدرّب قيادة',
};

export const T: Record<Locale, TemplateStrings> = { en, he, ar };

/** Locale-safe lookup — unknown/missing locale falls back to English. */
export function strings(locale?: Locale): TemplateStrings {
  return T[locale ?? 'en'] ?? T.en;
}

// ── Data-layer defaults (used by fromWizard, not by templates directly) ─────

/** The wizard's honest FAQ defaults, localized. {price}/{duration}/{where} interpolated. */
export function defaultFaqs(locale: Locale, vars: { price: number; duration: number; area: string; transmission: 'manual' | 'automatic' | 'both' }): Faq[] {
  const L = FAQ_STRINGS[locale] ?? FAQ_STRINGS.en;
  const where = vars.area ? fmt(L.whereArea, { area: vars.area }) : L.whereLocal;
  return [
    {
      q: vars.transmission === 'both' ? L.transBothQ : L.transQ,
      a: vars.transmission === 'manual' ? L.transManualA : vars.transmission === 'automatic' ? L.transAutoA : L.transBothA,
    },
    { q: L.priceQ, a: fmt(L.priceA, { price: vars.price || 0, duration: vars.duration || 45 }) },
    { q: L.areasQ, a: fmt(L.areasA, { where }) },
    { q: L.startQ, a: L.startA },
    { q: L.rescheduleQ, a: L.rescheduleA },
  ];
}

interface FaqStrings {
  transQ: string;
  transBothQ: string;
  transManualA: string;
  transAutoA: string;
  transBothA: string;
  priceQ: string;
  priceA: string;
  areasQ: string;
  areasA: string;
  whereArea: string;
  whereLocal: string;
  startQ: string;
  startA: string;
  rescheduleQ: string;
  rescheduleA: string;
}

const FAQ_STRINGS: Record<Locale, FaqStrings> = {
  en: {
    transQ: 'Do you teach manual or automatic?',
    transBothQ: 'Do you teach manual and automatic?',
    transManualA: 'Manual lessons — you’ll master full clutch control in a dual-control manual car.',
    transAutoA: 'Automatic lessons — relaxed, no-clutch learning in a dual-control automatic car.',
    transBothA: 'Both — tell us which you prefer when you book and we’ll match you to the right dual-control car.',
    priceQ: 'How much is a lesson?',
    priceA: 'Lessons are ₪{price} for {duration} minutes, with multi-lesson plans that work out cheaper per hour.',
    areasQ: 'Which areas do you cover?',
    areasA: 'We cover {where}, with door-to-door pickup from home, work or college.',
    whereArea: '{area} and the surrounding area',
    whereLocal: 'the local area',
    startQ: 'How quickly can I start?',
    startA: 'Most new learners are on the road within a few days of booking — we confirm your first slot by text.',
    rescheduleQ: 'What if I need to reschedule?',
    rescheduleA: 'You can reschedule free up to 24 hours before your lesson.',
  },
  he: {
    transQ: 'מלמדים ידני או אוטומט?',
    transBothQ: 'מלמדים גם ידני וגם אוטומט?',
    transManualA: 'שיעורים ברכב ידני — תשלטו בקלאץ׳ ברכב לימוד ידני עם דוושות כפולות.',
    transAutoA: 'שיעורים ברכב אוטומטי — למידה רגועה, בלי קלאץ׳, ברכב לימוד עם דוושות כפולות.',
    transBothA: 'שניהם — ספרו לנו מה אתם מעדיפים בהזמנה ונתאים לכם את רכב הלימוד הנכון.',
    priceQ: 'כמה עולה שיעור?',
    priceA: 'שיעור עולה ₪{price} ל-{duration} דקות, עם חבילות שיעורים שמוזילות את המחיר לשעה.',
    areasQ: 'אילו אזורים אתם מכסים?',
    areasA: 'אנחנו מכסים את {where}, כולל איסוף עד הבית, העבודה או הלימודים.',
    whereArea: '{area} והסביבה',
    whereLocal: 'האזור הקרוב',
    startQ: 'כמה מהר אפשר להתחיל?',
    startA: 'רוב התלמידים החדשים על הכביש תוך כמה ימים מההזמנה — נאשר את השיעור הראשון בהודעה.',
    rescheduleQ: 'מה אם צריך לשנות מועד?',
    rescheduleA: 'אפשר לשנות מועד בחינם עד 24 שעות לפני השיעור.',
  },
  ar: {
    transQ: 'هل تعلّمون اليدوي أم الأوتوماتيك؟',
    transBothQ: 'هل تعلّمون اليدوي والأوتوماتيك؟',
    transManualA: 'دروس يدوي — ستتقن التحكّم الكامل بالقابض في سيارة يدوية مزدوجة التحكّم.',
    transAutoA: 'دروس أوتوماتيك — تعلّم مريح بلا قابض في سيارة أوتوماتيكية مزدوجة التحكّم.',
    transBothA: 'كلاهما — أخبرنا بتفضيلك عند الحجز وسنوفّر لك سيارة التدريب المناسبة.',
    priceQ: 'كم يكلّف الدرس؟',
    priceA: 'الدرس ₪{price} لمدة {duration} دقيقة، مع باقات دروس أوفر بالساعة.',
    areasQ: 'ما المناطق التي تغطونها؟',
    areasA: 'نغطي {where}، مع اصطحاب من المنزل أو العمل أو الجامعة.',
    whereArea: '{area} والمنطقة المحيطة',
    whereLocal: 'المنطقة المحلية',
    startQ: 'متى يمكنني البدء؟',
    startA: 'معظم المتعلّمين الجدد على الطريق خلال أيام من الحجز — نؤكد موعدك الأول برسالة.',
    rescheduleQ: 'ماذا لو احتجت لتغيير الموعد؟',
    rescheduleA: 'يمكنك تغيير الموعد مجاناً حتى 24 ساعة قبل الدرس.',
  },
};

/** Demo testimonials for previews only (real sites use approved reviews). */
export function defaultReviews(locale: Locale): Review[] {
  const L = REVIEW_DEFAULTS[locale] ?? REVIEW_DEFAULTS.en;
  return L.map((r, i) => ({ id: `d${i}`, name: r.name, rating: 5, text: r.comment }));
}

const REVIEW_DEFAULTS: Record<Locale, { name: string; comment: string }[]> = {
  en: [
    { name: 'Anna K.', comment: 'Passed first time! Calm, patient and incredibly clear. I never felt rushed.' },
    { name: 'Sam B.', comment: 'Booking lessons online made everything so easy. Highly recommend.' },
    { name: 'Omar J.', comment: 'Went from nervous to confident in a few weeks. The best decision I made.' },
  ],
  he: [
    { name: 'אנה ק.', comment: 'עברתי בפעם הראשונה! רגוע, סבלני וברור להפליא. אף פעם לא הרגשתי בלחץ.' },
    { name: 'סם ב.', comment: 'הזמנת שיעורים אונליין הפכה הכול לפשוט. ממליץ בחום.' },
    { name: 'עומר ג׳.', comment: 'תוך כמה שבועות עברתי מלחוץ לבטוח. ההחלטה הכי טובה שעשיתי.' },
  ],
  ar: [
    { name: 'آنا ك.', comment: 'نجحت من أول مرة! هادئ وصبور وواضح جداً. لم أشعر بأي ضغط.' },
    { name: 'سام ب.', comment: 'حجز الدروس عبر الإنترنت جعل كل شيء سهلاً. أنصح به بشدة.' },
    { name: 'عمر ج.', comment: 'انتقلت من التوتر إلى الثقة خلال أسابيع. أفضل قرار اتخذته.' },
  ],
};

// ── Sample-content defaults that leak into real sites (localized) ───────────
// buildTemplateData falls back to these when the owner left a field empty.
// The `en` values intentionally mirror sampleData so English output is unchanged.
export interface DataDefaults {
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  aboutHeading: string;
  aboutBody: [string, string];
  aboutChecklist: string[];
  credentials: string[];
}

const DATA_DEFAULTS: Record<Locale, DataDefaults> = {
  en: {
    heroCtaPrimary: 'Book a first lesson',
    heroCtaSecondary: 'See packages',
    aboutHeading: 'Calm, patient, and on your side',
    aboutBody: [
      'No shouting, no clipboard energy. Just clear, steady guidance from someone who genuinely wants you to pass.',
      'Lessons are tailored to you — nervous beginner or test-ready, {trans}. We go at your pace and celebrate the small wins.',
    ],
    aboutChecklist: [
      'One-to-one, never doubled-up',
      'Pickup from home, work or college',
      'Dual-control, fully insured car',
      'Honest feedback after every lesson',
    ],
    credentials: ['Certified driving instructor', 'Patient & professional', 'Manual & Automatic', 'Fully insured dual-control car'],
  },
  he: {
    heroCtaPrimary: 'הזמנת שיעור ראשון',
    heroCtaSecondary: 'לחבילות',
    aboutHeading: 'רגוע, סבלני, ולצידך',
    aboutBody: [
      'בלי צעקות ובלי לחץ. רק הדרכה ברורה ויציבה ממי שבאמת רוצה שתעברו.',
      'השיעורים מותאמים אליך — מתחיל לחוץ או מוכן לטסט, {trans}. מתקדמים בקצב שלך וחוגגים כל הצלחה קטנה.',
    ],
    aboutChecklist: [
      'אחד על אחד, אף פעם לא בזוגות',
      'איסוף מהבית, מהעבודה או מהלימודים',
      'רכב מבוטח עם דוושות כפולות',
      'משוב כן אחרי כל שיעור',
    ],
    credentials: ['מורה נהיגה מוסמך', 'ותק ומקצועיות', 'ידני ואוטומט', 'רכב לימוד מבוטח עם דוושות כפולות'],
  },
  ar: {
    heroCtaPrimary: 'احجز درسك الأول',
    heroCtaSecondary: 'شاهد الباقات',
    aboutHeading: 'هادئ وصبور وإلى جانبك',
    aboutBody: [
      'بلا صراخ وبلا توتر. فقط توجيه واضح وثابت من مدرّب يريد لك النجاح بصدق.',
      'الدروس مصمّمة لك — مبتدئ متوتر أو جاهز للاختبار، {trans}. نتقدّم بوتيرتك ونحتفل بكل إنجاز صغير.',
    ],
    aboutChecklist: [
      'فردي دائماً، لا دروس مزدوجة',
      'اصطحاب من المنزل أو العمل أو الجامعة',
      'سيارة مؤمّنة مزدوجة التحكّم',
      'ملاحظات صادقة بعد كل درس',
    ],
    credentials: ['مدرّب قيادة معتمد', 'خبرة واحتراف', 'يدوي وأوتوماتيك', 'سيارة تدريب مؤمّنة مزدوجة التحكّم'],
  },
};

type Trans = 'manual' | 'automatic' | 'both';

/** Localized transmission clauses so the About copy + credential chip reflect the
 *  teacher's actual transmission choice (the `both` values byte-match the old literals). */
const TRANS_CLAUSE: Record<Locale, Record<Trans, { about: string; credential: string }>> = {
  en: {
    both: { about: 'manual or automatic', credential: 'Manual & Automatic' },
    manual: { about: 'manual', credential: 'Manual transmission' },
    automatic: { about: 'automatic', credential: 'Automatic transmission' },
  },
  he: {
    both: { about: 'ידני או אוטומט', credential: 'ידני ואוטומט' },
    manual: { about: 'ידני', credential: 'רכב ידני' },
    automatic: { about: 'אוטומט', credential: 'רכב אוטומטי' },
  },
  ar: {
    both: { about: 'يدوي أو أوتوماتيك', credential: 'يدوي وأوتوماتيك' },
    manual: { about: 'يدوي', credential: 'ناقل يدوي' },
    automatic: { about: 'أوتوماتيك', credential: 'ناقل أوتوماتيكي' },
  },
};

// Localized weekday names for the hours/footer table (EN byte-matches the old
// title-cased keys so English output is unchanged; digits/times stay as-is).
const WEEKDAY_NAMES: Record<Locale, Record<string, string>> = {
  en: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' },
  he: { monday: 'שני', tuesday: 'שלישי', wednesday: 'רביעי', thursday: 'חמישי', friday: 'שישי', saturday: 'שבת', sunday: 'ראשון' },
  ar: { monday: 'الإثنين', tuesday: 'الثلاثاء', wednesday: 'الأربعاء', thursday: 'الخميس', friday: 'الجمعة', saturday: 'السبت', sunday: 'الأحد' },
};
export function weekdayName(locale: Locale | undefined, dayKey: string): string {
  const map = WEEKDAY_NAMES[locale ?? 'en'] ?? WEEKDAY_NAMES.en;
  return map[dayKey.toLowerCase()] ?? (dayKey.charAt(0).toUpperCase() + dayKey.slice(1));
}

export function dataDefaults(locale?: Locale, transmission: Trans = 'both'): DataDefaults {
  const base = DATA_DEFAULTS[locale ?? 'en'] ?? DATA_DEFAULTS.en;
  const tc = (TRANS_CLAUSE[locale ?? 'en'] ?? TRANS_CLAUSE.en)[transmission];
  return {
    ...base,
    aboutBody: [base.aboutBody[0], fmt(base.aboutBody[1], { trans: tc.about })],
    // credentials[2] is the transmission chip — reflect the actual choice.
    credentials: base.credentials.map((c, i) => (i === 2 ? tc.credential : c)),
  };
}
