// Meridian template — the survey-sheet voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface MrStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowMr: string;
  whyHeadingMr: string;
  packagesHeadingMr: string;
  packagesSubMr: string;
  areasEyebrowMr: string;
  areasHeadingMr: string;
  reviewsHeadingMr: string;
  galleryHeadingMr: string;
  faqHeadingMr: string;
  bookHeadingMr: string;
  bookBodyMr: string;
  heroCaption: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Margin coordinate ticks — decorative cartographic annotation of the section order.
  tickHero: string;
  tickStats: string;
  tickWhy: string;
  tickPackages: string;
  tickAbout: string;
  tickAreas: string;
  tickReviews: string;
  tickGallery: string;
  tickFaq: string;
  tickBook: string;
  tickContact: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: MrStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Plot this route',
  whyEyebrowMr: 'Legend',
  whyHeadingMr: 'Every route, plotted in advance.',
  packagesHeadingMr: 'Plot your route.',
  packagesSubMr: 'Clear distances, honest prices. Nothing hidden in the margins.',
  areasEyebrowMr: 'Coverage',
  areasHeadingMr: 'The ground we cover.',
  reviewsHeadingMr: 'Surveyed by learners.',
  galleryHeadingMr: 'Field notes.',
  faqHeadingMr: 'Notes in the margin.',
  bookHeadingMr: 'Set your bearing.',
  bookBodyMr: 'Choose a time and we’ll chart the rest of the route with you.',
  heroCaption: 'Plate 01 · Lesson route, surveyed on the ground',
  feature0Title: 'Plotted to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson mapped from where you actually are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  tickHero: 'Hero',
  tickStats: 'Stats',
  tickWhy: 'Legend',
  tickPackages: 'Packages',
  tickAbout: 'About',
  tickAreas: 'Coverage',
  tickReviews: 'Reviews',
  tickGallery: 'Plates',
  tickFaq: 'Notes',
  tickBook: 'Booking',
  tickContact: 'Contact',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: MrStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לסימון המסלול',
  whyEyebrowMr: 'מקרא',
  whyHeadingMr: 'כל מסלול, מסומן מראש.',
  packagesHeadingMr: 'מסמנים את המסלול שלכם.',
  packagesSubMr: 'מרחקים ברורים, מחירים הוגנים. שום דבר לא מוסתר בשוליים.',
  areasEyebrowMr: 'אזורי כיסוי',
  areasHeadingMr: 'השטח שאנחנו מכסים.',
  reviewsHeadingMr: 'נבדק על ידי תלמידים.',
  galleryHeadingMr: 'רשימות מהשטח.',
  faqHeadingMr: 'הערות בשוליים.',
  bookHeadingMr: 'קובעים כיוון.',
  bookBodyMr: 'בוחרים זמן, ואת שאר המסלול נסמן יחד אתכם.',
  heroCaption: 'לוח 01 · מסלול שיעור, נמדד בשטח',
  feature0Title: 'מסלול בקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מסומן מהנקודה שבה אתם באמת נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  tickHero: 'פתיחה',
  tickStats: 'נתונים',
  tickWhy: 'מקרא',
  tickPackages: 'חבילות',
  tickAbout: 'אודות',
  tickAreas: 'כיסוי',
  tickReviews: 'ביקורות',
  tickGallery: 'לוחות',
  tickFaq: 'הערות',
  tickBook: 'הזמנה',
  tickContact: 'קשר',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: MrStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'ارسم هذا المسار',
  whyEyebrowMr: 'المفتاح',
  whyHeadingMr: 'كل مسار مرسوم مسبقاً.',
  packagesHeadingMr: 'ارسم مسارك.',
  packagesSubMr: 'مسافات واضحة وأسعار صادقة. لا شيء مخفي في الهوامش.',
  areasEyebrowMr: 'التغطية',
  areasHeadingMr: 'الأرض التي نغطيها.',
  reviewsHeadingMr: 'بشهادة المتعلّمين.',
  galleryHeadingMr: 'ملاحظات ميدانية.',
  faqHeadingMr: 'ملاحظات على الهامش.',
  bookHeadingMr: 'حدّد وجهتك.',
  bookBodyMr: 'اختر وقتاً وسنرسم بقية المسار معك.',
  heroCaption: 'اللوحة 01 · مسار الدرس، مُقاس على الأرض',
  feature0Title: 'مسار على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس مرسوم من حيث أنت فعلاً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  tickHero: 'البداية',
  tickStats: 'أرقام',
  tickWhy: 'المفتاح',
  tickPackages: 'الباقات',
  tickAbout: 'من نحن',
  tickAreas: 'التغطية',
  tickReviews: 'التقييمات',
  tickGallery: 'اللوحات',
  tickFaq: 'ملاحظات',
  tickBook: 'الحجز',
  tickContact: 'تواصل',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const MR: Record<Locale, MrStrings> = { en, he, ar };
export const mrStrings = (locale?: Locale): MrStrings => MR[locale ?? 'en'] ?? MR.en;
