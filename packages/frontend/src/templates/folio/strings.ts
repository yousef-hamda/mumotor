// Folio template — the glossy-magazine voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique to the
// magazine metaphor: masthead / issue dateline / running heads) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface FoStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  // Overridden base keys carry a `Fo` suffix so the template voice never mutates T.
  whyEyebrowFo: string;
  whyHeadingFo: string;
  packagesHeadingFo: string;
  packagesSubFo: string;
  areasEyebrowFo: string;
  areasHeadingFo: string;
  reviewsHeadingFo: string;
  galleryHeadingFo: string;
  faqHeadingFo: string;
  bookHeadingFo: string;
  bookBodyFo: string;
  // Magazine furniture
  mastheadKicker: string;   // running-head kicker, e.g. "The Driving Feature"
  issueLabel: string;       // decorative dateline, e.g. "Issue 01 · Driving"
  heroCaption: string;      // small credit line under the masthead
  subscribeLabel: string;   // the Book section's magazine "Subscribe" kicker
  aboutPull: string;        // pull-quote in the About spread
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: FoStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowFo: 'The Feature',
  whyHeadingFo: 'A driving school, shot like a cover story.',
  packagesHeadingFo: 'Choose your edition.',
  packagesSubFo: 'Clear, honest pricing — nothing buried in the fine print.',
  areasEyebrowFo: 'Coverage',
  areasHeadingFo: 'Where we drive.',
  reviewsHeadingFo: 'In their words.',
  galleryHeadingFo: 'The portfolio.',
  faqHeadingFo: 'The fine print.',
  bookHeadingFo: 'Book your first lesson.',
  bookBodyFo: 'Pick a time and we’ll take it from there — on the calendar in under a minute.',
  mastheadKicker: 'The Driving Feature',
  issueLabel: 'Issue 01 · Driving',
  heroCaption: 'Photographed on location · Real lessons, real roads',
  subscribeLabel: 'Subscribe',
  aboutPull: 'The calmest hour of my week turned out to be the one behind the wheel.',
  feature0Title: 'One-to-one, always',
  feature0Body: 'Never doubled-up. Every lesson is yours alone, paced to exactly where you are.',
  feature1Title: 'Dual-control & insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying — fully insured.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Collected from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: FoStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowFo: 'הכתבה',
  whyHeadingFo: 'בית ספר לנהיגה, מצולם ככתבת שער.',
  packagesHeadingFo: 'בוחרים מהדורה.',
  packagesSubFo: 'מחיר ברור והוגן — שום דבר לא מוסתר באותיות הקטנות.',
  areasEyebrowFo: 'כיסוי',
  areasHeadingFo: 'איפה אנחנו נוהגים.',
  reviewsHeadingFo: 'במילים שלהם.',
  galleryHeadingFo: 'התיק האישי.',
  faqHeadingFo: 'האותיות הקטנות.',
  bookHeadingFo: 'מזמינים שיעור ראשון.',
  bookBodyFo: 'בוחרים זמן וממשיכים מכאן — ביומן בפחות מדקה.',
  mastheadKicker: 'כתבת הנהיגה',
  issueLabel: 'גיליון 01 · נהיגה',
  heroCaption: 'צולם בשטח · שיעורים אמיתיים, כבישים אמיתיים',
  subscribeLabel: 'הרשמה',
  aboutPull: 'השעה הרגועה ביותר בשבוע שלי התבררה כזו שמאחורי ההגה.',
  feature0Title: 'אחד על אחד, תמיד',
  feature0Body: 'אף פעם לא בזוגות. כל שיעור שלכם בלבד, בקצב שבו אתם באמת נמצאים.',
  feature1Title: 'דוושות כפולות וביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם — מבוטח במלואו.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: FoStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowFo: 'الموضوع',
  whyHeadingFo: 'مدرسة قيادة، مصوّرة كقصة غلاف.',
  packagesHeadingFo: 'اختر إصدارك.',
  packagesSubFo: 'أسعار واضحة وصادقة — لا شيء مخبّأ في التفاصيل الدقيقة.',
  areasEyebrowFo: 'التغطية',
  areasHeadingFo: 'أين نقود.',
  reviewsHeadingFo: 'بكلماتهم.',
  galleryHeadingFo: 'ملف الأعمال.',
  faqHeadingFo: 'التفاصيل الدقيقة.',
  bookHeadingFo: 'احجز درسك الأول.',
  bookBodyFo: 'اختر وقتاً وسنكمل من هناك — على التقويم في أقل من دقيقة.',
  mastheadKicker: 'موضوع القيادة',
  issueLabel: 'العدد 01 · القيادة',
  heroCaption: 'صوّر في الموقع · دروس حقيقية وطرقات حقيقية',
  subscribeLabel: 'اشترك',
  aboutPull: 'أهدأ ساعة في أسبوعي تبيّن أنها تلك التي خلف المقود.',
  feature0Title: 'فردي دائماً',
  feature0Body: 'بلا دروس مزدوجة أبداً. كل درس لك وحدك، بوتيرة تناسب مكانك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء — مؤمّنة بالكامل.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const FO: Record<Locale, FoStrings> = { en, he, ar };
export const foStrings = (locale?: Locale): FoStrings => FO[locale ?? 'en'] ?? FO.en;
