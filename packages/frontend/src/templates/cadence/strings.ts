// Cadence template — the kinetic-editorial voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live here.
// Overridden base keys carry a `Cd` suffix; brand-new keys are unsuffixed.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface CdStrings extends TemplateStrings {
  // New keys (not in the base vocabulary)
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Decorative kinetic marquee phrases (aria-hidden) + oversized ghost watermarks.
  marquee: string[];
  ghostWhy: string;
  ghostBook: string;
  // Required per-template meta
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
  // Overridden base keys (this template's own voice)
  whyEyebrowCd: string;
  whyHeadingCd: string;
  packagesHeadingCd: string;
  packagesSubCd: string;
  areasEyebrowCd: string;
  areasHeadingCd: string;
  reviewsHeadingCd: string;
  galleryHeadingCd: string;
  faqHeadingCd: string;
  bookHeadingCd: string;
  bookBodyCd: string;
}

const en: CdStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Choose this tempo',
  feature0Title: 'Lessons with a rhythm',
  feature0Body: 'One-to-one, never doubled-up — a steady weekly cadence that builds real confidence.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  marquee: ['Confidence has a rhythm', 'Learn to drive', 'Find your cadence', 'One lesson at a time', 'Calm, steady, sure', 'Door to door'],
  ghostWhy: 'DRIVE',
  ghostBook: 'GO',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
  whyEyebrowCd: 'The method',
  whyHeadingCd: 'Confidence, kept in time.',
  packagesHeadingCd: 'Pick your tempo.',
  packagesSubCd: 'Clear prices, no fine print. Choose the pace that fits your week.',
  areasEyebrowCd: 'Coverage',
  areasHeadingCd: 'Where we drive.',
  reviewsHeadingCd: 'In their words.',
  galleryHeadingCd: 'On the road.',
  faqHeadingCd: 'Good to know.',
  bookHeadingCd: 'Let’s begin.',
  bookBodyCd: 'Pick a time that works for you and we’ll set the pace together.',
};

const he: CdStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'בחירת הקצב הזה',
  feature0Title: 'שיעורים בקצב',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות — קצב שבועי יציב שבונה ביטחון אמיתי.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  marquee: ['לביטחון יש קצב', 'ללמוד לנהוג', 'למצוא את הקצב שלך', 'שיעור אחר שיעור', 'רגוע, יציב, בטוח', 'מהבית עד היעד'],
  ghostWhy: 'נהיגה',
  ghostBook: 'קדימה',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  whyEyebrowCd: 'השיטה',
  whyHeadingCd: 'ביטחון, בקצב הנכון.',
  packagesHeadingCd: 'בוחרים את הקצב.',
  packagesSubCd: 'מחירים ברורים, בלי אותיות קטנות. בוחרים קצב שמתאים לשבוע שלכם.',
  areasEyebrowCd: 'אזורי כיסוי',
  areasHeadingCd: 'איפה אנחנו נוהגים.',
  reviewsHeadingCd: 'במילים שלהם.',
  galleryHeadingCd: 'על הכביש.',
  faqHeadingCd: 'כדאי לדעת.',
  bookHeadingCd: 'מתחילים.',
  bookBodyCd: 'בוחרים זמן שמתאים לכם ונכוון יחד את הקצב.',
};

const ar: CdStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'اختر هذا الإيقاع',
  feature0Title: 'دروس بإيقاع',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة — وتيرة أسبوعية ثابتة تبني ثقة حقيقية.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  marquee: ['للثقة إيقاع', 'تعلّم القيادة', 'اعثر على إيقاعك', 'درساً بعد درس', 'هادئ، ثابت، واثق', 'من الباب إلى الباب'],
  ghostWhy: 'قيادة',
  ghostBook: 'انطلق',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
  whyEyebrowCd: 'الأسلوب',
  whyHeadingCd: 'ثقة، على الإيقاع الصحيح.',
  packagesHeadingCd: 'اختر إيقاعك.',
  packagesSubCd: 'أسعار واضحة، بلا شروط خفية. اختر الوتيرة التي تناسب أسبوعك.',
  areasEyebrowCd: 'التغطية',
  areasHeadingCd: 'أين نقود.',
  reviewsHeadingCd: 'بكلماتهم.',
  galleryHeadingCd: 'على الطريق.',
  faqHeadingCd: 'من الجيد أن تعرف.',
  bookHeadingCd: 'لنبدأ.',
  bookBodyCd: 'اختر وقتاً يناسبك وسنضبط الإيقاع معاً.',
};

const CD: Record<Locale, CdStrings> = { en, he, ar };
export const cdStrings = (locale?: Locale): CdStrings => CD[locale ?? 'en'] ?? CD.en;
