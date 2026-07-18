// Transit template — the metro-wayfinding voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live
// here. Overridden base keys carry a `Tr` suffix so the template reads
// `data.copy?.<baseKey> ?? s.<baseKey>Tr` and Customize edits always win.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface TrStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowTr: string;
  whyHeadingTr: string;
  packagesHeadingTr: string;
  packagesSubTr: string;
  areasEyebrowTr: string;
  areasHeadingTr: string;
  reviewsHeadingTr: string;
  galleryHeadingTr: string;
  faqHeadingTr: string;
  bookHeadingTr: string;
  bookBodyTr: string;
  heroCaption: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Wayfinding / transit-system vocabulary (decorative signage furniture).
  lineName: string;        // e.g. "The Licence Line"
  stopLabel: string;       // the word "Stop"
  serviceLabel: string;    // "This service" / "You are here"
  boardLabel: string;      // "Now boarding" strip on the nav
  heroRouteFrom: string;   // hero route chip start — "You are here"
  heroRouteTo: string;     // hero route chip end — "Full licence"
  stopStart: string;       // first stop node label
  stopDestination: string; // final stop node label ("Licence")
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: TrStrings = {
  ...T.en,
  navPackages: 'Fares',
  bookNow: 'Board now',
  bookThisPlan: 'Buy this ticket',
  whyEyebrowTr: 'On this service',
  whyHeadingTr: 'Every stop, clearly mapped.',
  packagesHeadingTr: 'Choose your fare.',
  packagesSubTr: 'Single tickets or a travelcard — every price on the board, nothing hidden.',
  areasEyebrowTr: 'Stops served',
  areasHeadingTr: 'The stops on the line.',
  reviewsHeadingTr: 'Word from the platform.',
  galleryHeadingTr: 'Along the route.',
  faqHeadingTr: 'Passenger information.',
  bookHeadingTr: 'Board the licence line.',
  bookBodyTr: 'Pick a departure time and we’ll take you all the way to your test.',
  heroCaption: 'Line 01 · Beginner → Full licence, every stop mapped',
  feature0Title: 'Mapped to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson plotted from the stop you’re actually at.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly handles the worry so you can drive.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Boarded from home, work or college — no extra fare.',
  lineName: 'The Licence Line',
  stopLabel: 'Stop',
  serviceLabel: 'This service',
  boardLabel: 'Now boarding',
  heroRouteFrom: 'You are here',
  heroRouteTo: 'Full licence',
  stopStart: 'Start',
  stopDestination: 'Licence',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: TrStrings = {
  ...T.he,
  navPackages: 'כרטיסים',
  bookNow: 'לעלייה',
  bookThisPlan: 'רכישת כרטיס',
  whyEyebrowTr: 'על הקו הזה',
  whyHeadingTr: 'כל תחנה, ממופה בבירור.',
  packagesHeadingTr: 'בחרו כרטיס.',
  packagesSubTr: 'כרטיס בודד או מנוי — כל מחיר על הלוח, בלי הפתעות.',
  areasEyebrowTr: 'תחנות בקו',
  areasHeadingTr: 'התחנות על הקו.',
  reviewsHeadingTr: 'מהרציף.',
  galleryHeadingTr: 'לאורך המסלול.',
  faqHeadingTr: 'מידע לנוסע.',
  bookHeadingTr: 'עולים על קו הרישיון.',
  bookBodyTr: 'בוחרים שעת יציאה ואנחנו לוקחים אתכם עד הטסט.',
  heroCaption: 'קו 01 · ממתחיל ועד רישיון, כל תחנה ממופה',
  feature0Title: 'ממופה לקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מתוכנן מהתחנה שבה אתם באמת נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'עלייה מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  lineName: 'קו הרישיון',
  stopLabel: 'תחנה',
  serviceLabel: 'השירות הזה',
  boardLabel: 'עכשיו בעלייה',
  heroRouteFrom: 'אתם כאן',
  heroRouteTo: 'רישיון מלא',
  stopStart: 'התחלה',
  stopDestination: 'רישיון',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: TrStrings = {
  ...T.ar,
  navPackages: 'التذاكر',
  bookNow: 'اصعد الآن',
  bookThisPlan: 'اشترِ هذه التذكرة',
  whyEyebrowTr: 'على هذا الخط',
  whyHeadingTr: 'كل محطة، مرسومة بوضوح.',
  packagesHeadingTr: 'اختر تذكرتك.',
  packagesSubTr: 'تذكرة واحدة أو اشتراك — كل سعر على اللوحة، لا شيء مخفي.',
  areasEyebrowTr: 'المحطات المخدومة',
  areasHeadingTr: 'محطات الخط.',
  reviewsHeadingTr: 'من على الرصيف.',
  galleryHeadingTr: 'على طول المسار.',
  faqHeadingTr: 'معلومات الركاب.',
  bookHeadingTr: 'اركب خط الرخصة.',
  bookBodyTr: 'اختر وقت الانطلاق وسنأخذك حتى الاختبار.',
  heroCaption: 'الخط 01 · من مبتدئ إلى رخصة كاملة، كل محطة مرسومة',
  feature0Title: 'مرسوم على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس مخطّط من المحطة التي أنت عندها فعلاً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء لتقود.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نقلّك من المنزل أو العمل أو الجامعة — بلا أجرة إضافية.',
  lineName: 'خط الرخصة',
  stopLabel: 'محطة',
  serviceLabel: 'هذه الخدمة',
  boardLabel: 'الصعود الآن',
  heroRouteFrom: 'أنت هنا',
  heroRouteTo: 'رخصة كاملة',
  stopStart: 'البداية',
  stopDestination: 'الرخصة',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const TR: Record<Locale, TrStrings> = { en, he, ar };
export const trStrings = (locale?: Locale): TrStrings => TR[locale ?? 'en'] ?? TR.en;
