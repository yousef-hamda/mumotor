// Grid & Ink template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface GiStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  packagesHeadingGi: string;
  areasEyebrowGi: string;
  areasHeadingGi: string;
  reviewsHeadingGi: string;
  galleryHeadingGi: string;
  faqHeadingGi: string;
  bookHeadingGi: string;
  bookBodyGi: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  bookUnpublishedTitle: string;
  ariaGoTop: string;
  ariaMainNav: string;
  ariaOpenMenu: string;
  ariaCloseMenu: string;
  ariaCredentials: string;
  ariaBenefits: string;
  ariaServiceAreas: string;
  ariaPkgFeatures: string; // {name}
}

const en: GiStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  packagesHeadingGi: 'Pick your lesson plan.',
  areasEyebrowGi: 'Areas covered',
  areasHeadingGi: 'We come to you.',
  reviewsHeadingGi: 'What learners say.',
  galleryHeadingGi: 'From the driving seat.',
  faqHeadingGi: 'Common questions.',
  bookEyebrow: 'Book a lesson',
  bookHeadingGi: 'Reserve your slot.',
  bookBodyGi: "Ready to get on the road? Pick a time that works for you and we'll take it from there.",
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with learner driver in car',
  bookUnpublishedTitle: 'Available once your site is published',
  ariaGoTop: 'Go to top',
  ariaMainNav: 'Main navigation',
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  ariaCredentials: 'Credentials',
  ariaBenefits: 'Key benefits',
  ariaServiceAreas: 'Service areas',
  ariaPkgFeatures: '{name} features',
};

const he: GiStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  packagesHeadingGi: 'בוחרים את מסלול השיעורים.',
  areasEyebrowGi: 'אזורי שירות',
  areasHeadingGi: 'אנחנו מגיעים אליך.',
  reviewsHeadingGi: 'מה התלמידים אומרים.',
  galleryHeadingGi: 'מהמושב של הנהג.',
  faqHeadingGi: 'שאלות נפוצות.',
  bookEyebrow: 'הזמנת שיעור',
  bookHeadingGi: 'שריינו לכם מקום.',
  bookBodyGi: 'מוכנים לעלות על הכביש? בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד ברכב',
  bookUnpublishedTitle: 'זמין לאחר פרסום האתר',
  ariaGoTop: 'לראש העמוד',
  ariaMainNav: 'ניווט ראשי',
  ariaOpenMenu: 'פתיחת תפריט',
  ariaCloseMenu: 'סגירת תפריט',
  ariaCredentials: 'הסמכות',
  ariaBenefits: 'יתרונות עיקריים',
  ariaServiceAreas: 'אזורי שירות',
  ariaPkgFeatures: 'מה כלול ב{name}',
};

const ar: GiStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  packagesHeadingGi: 'اختر باقة دروسك.',
  areasEyebrowGi: 'مناطق الخدمة',
  areasHeadingGi: 'نأتي إليك.',
  reviewsHeadingGi: 'ماذا يقول المتعلّمون.',
  galleryHeadingGi: 'من مقعد السائق.',
  faqHeadingGi: 'أسئلة شائعة.',
  bookEyebrow: 'حجز درس',
  bookHeadingGi: 'احجز مكانك.',
  bookBodyGi: 'جاهز للانطلاق على الطريق؟ اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب قيادة مع متعلّم في السيارة',
  bookUnpublishedTitle: 'متاح بعد نشر موقعك',
  ariaGoTop: 'إلى الأعلى',
  ariaMainNav: 'التنقل الرئيسي',
  ariaOpenMenu: 'فتح القائمة',
  ariaCloseMenu: 'إغلاق القائمة',
  ariaCredentials: 'الاعتمادات',
  ariaBenefits: 'مزايا رئيسية',
  ariaServiceAreas: 'مناطق الخدمة',
  ariaPkgFeatures: 'مزايا {name}',
};

const GI: Record<Locale, GiStrings> = { en, he, ar };
export const giStrings = (locale?: Locale): GiStrings => GI[locale ?? 'en'] ?? GI.en;
