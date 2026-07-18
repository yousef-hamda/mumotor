// Solari template — the split-flap departure-board voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here. Overridden base keys carry an `Sl` suffix; new keys don't.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface SlStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowSl: string;
  whyHeadingSl: string;
  packagesHeadingSl: string;
  packagesSubSl: string;
  areasEyebrowSl: string;
  areasHeadingSl: string;
  reviewsHeadingSl: string;
  galleryHeadingSl: string;
  faqHeadingSl: string;
  bookHeadingSl: string;
  bookBodySl: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Board furniture — the departure-board vocabulary.
  boardStatus: string; // "ON TIME"
  departuresLabel: string; // "DEPARTURES"
  destinationsLabel: string; // "destinations" (caption count)
  bookingOpen: string; // per-row status
  boardTimeCol: string;
  boardDestCol: string;
  boardStatusCol: string;
  nextDeparture: string; // book-section eyebrow
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: SlStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Board this plan',
  whyEyebrowSl: 'On the board',
  whyHeadingSl: 'Every lesson departs on time.',
  packagesHeadingSl: 'Pick your departure.',
  packagesSubSl: 'Clear fares, no surprises at the gate — just the lesson you booked.',
  areasEyebrowSl: 'Destinations',
  areasHeadingSl: 'Where we run.',
  reviewsHeadingSl: 'Passengers who arrived.',
  galleryHeadingSl: 'From the platform.',
  faqHeadingSl: 'At the information desk.',
  bookHeadingSl: 'Your seat is waiting.',
  bookBodySl: 'Pick a time and we’ll hold the next departure open for you.',
  feature0Title: 'One-to-one, always on time',
  feature0Body: 'Never doubled-up. Every lesson leaves on schedule and runs at your pace.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  boardStatus: 'ON TIME',
  departuresLabel: 'Departures',
  destinationsLabel: 'destinations',
  bookingOpen: 'Booking open',
  boardTimeCol: 'Time',
  boardDestCol: 'Destination',
  boardStatusCol: 'Status',
  nextDeparture: 'Next departure',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: SlStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לעלייה למסלול',
  whyEyebrowSl: 'על הלוח',
  whyHeadingSl: 'כל שיעור יוצא בזמן.',
  packagesHeadingSl: 'בוחרים את היציאה שלכם.',
  packagesSubSl: 'מחירים ברורים, בלי הפתעות בשער — בדיוק השיעור שהזמנתם.',
  areasEyebrowSl: 'יעדים',
  areasHeadingSl: 'לאן אנחנו יוצאים.',
  reviewsHeadingSl: 'נוסעים שהגיעו ליעד.',
  galleryHeadingSl: 'מהרציף.',
  faqHeadingSl: 'בדלפק המודיעין.',
  bookHeadingSl: 'המושב שלכם מחכה.',
  bookBodySl: 'בוחרים זמן ואנחנו נשמור לכם את היציאה הבאה.',
  feature0Title: 'אחד על אחד, תמיד בזמן',
  feature0Body: 'אף פעם לא בזוגות. כל שיעור יוצא לפי הלוח ומתקדם בקצב שלכם.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  boardStatus: 'בזמן',
  departuresLabel: 'יציאות',
  destinationsLabel: 'יעדים',
  bookingOpen: 'ההרשמה פתוחה',
  boardTimeCol: 'שעה',
  boardDestCol: 'יעד',
  boardStatusCol: 'סטטוס',
  nextDeparture: 'היציאה הבאה',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: SlStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'اصعد إلى هذه الرحلة',
  whyEyebrowSl: 'على اللوحة',
  whyHeadingSl: 'كل درس ينطلق في موعده.',
  packagesHeadingSl: 'اختر رحلتك.',
  packagesSubSl: 'أسعار واضحة، بلا مفاجآت عند البوابة — فقط الدرس الذي حجزته.',
  areasEyebrowSl: 'الوجهات',
  areasHeadingSl: 'إلى أين نسير.',
  reviewsHeadingSl: 'ركّاب وصلوا إلى وجهتهم.',
  galleryHeadingSl: 'من الرصيف.',
  faqHeadingSl: 'عند مكتب الاستعلامات.',
  bookHeadingSl: 'مقعدك في انتظارك.',
  bookBodySl: 'اختر وقتاً وسنُبقي الرحلة القادمة مفتوحة لك.',
  feature0Title: 'فردي دائماً، وفي الموعد',
  feature0Body: 'بلا دروس مزدوجة. كل درس ينطلق حسب اللوحة ويسير بوتيرتك.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  boardStatus: 'في الموعد',
  departuresLabel: 'الرحلات',
  destinationsLabel: 'وجهات',
  bookingOpen: 'الحجز متاح',
  boardTimeCol: 'الوقت',
  boardDestCol: 'الوجهة',
  boardStatusCol: 'الحالة',
  nextDeparture: 'الرحلة القادمة',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const SL: Record<Locale, SlStrings> = { en, he, ar };
export const slStrings = (locale?: Locale): SlStrings => SL[locale ?? 'en'] ?? SL.en;
