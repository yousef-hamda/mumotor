// Console template — the "product OS" system voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here; everything else is spread from the shared dictionary (T).
// Overridden base keys carry a `Co` suffix so the shared defaults stay intact.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface CoStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowCo: string;
  whyHeadingCo: string;
  packagesHeadingCo: string;
  packagesSubCo: string;
  areasEyebrowCo: string;
  areasHeadingCo: string;
  reviewsHeadingCo: string;
  galleryHeadingCo: string;
  faqHeadingCo: string;
  bookHeadingCo: string;
  bookBodyCo: string;
  heroCaption: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // The command palette (⌘K) — the signature centrepiece.
  cmdkLabel: string;
  cmdkHint: string;
  cmdkAria: string;
  cmdQuery: string;
  cmdResult1: string;
  cmdResult2: string;
  cmdResult3: string;
  cmdEnter: string;
  // Live dashboard widgets.
  liveLabel: string;
  statusLabel: string;
  scheduleLabel: string;
  availLabel: string;
  gridLabel: string;
  // Alt text + a11y.
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: CoStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book a lesson',
  bookThisPlan: 'Get started',
  whyEyebrowCo: 'The system',
  whyHeadingCo: 'Your driving school, engineered like software.',
  packagesHeadingCo: 'Pick a plan.',
  packagesSubCo: 'Transparent pricing — no hidden fees, no surprises in the fine print.',
  areasEyebrowCo: 'Coverage',
  areasHeadingCo: 'Where we operate.',
  reviewsHeadingCo: 'Trusted by learners.',
  galleryHeadingCo: 'From the field.',
  faqHeadingCo: 'Questions, answered.',
  bookHeadingCo: 'Ready to get started?',
  bookBodyCo: 'Enroll with the code from your instructor and book your first lesson today.',
  heroCaption: 'Session 01 · lesson in progress',
  feature0Title: 'Tuned to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson calibrated to exactly where you are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly handles the risk for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  cmdkLabel: 'Command',
  cmdkHint: 'Search',
  cmdkAria: 'Open command menu',
  cmdQuery: 'Book a lesson',
  cmdResult1: 'Book a lesson',
  cmdResult2: 'See packages',
  cmdResult3: 'Message the instructor',
  cmdEnter: 'Enter',
  liveLabel: 'Live',
  statusLabel: 'All systems operational',
  scheduleLabel: 'Today’s schedule',
  availLabel: 'Open',
  gridLabel: 'Get started',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: CoStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'הזמנת שיעור',
  bookThisPlan: 'בואו נתחיל',
  whyEyebrowCo: 'המערכת',
  whyHeadingCo: 'בית ספר לנהיגה, בנוי כמו תוכנה.',
  packagesHeadingCo: 'בחרו מסלול.',
  packagesSubCo: 'מחירים שקופים — בלי עלויות נסתרות ובלי הפתעות באותיות הקטנות.',
  areasEyebrowCo: 'אזורי כיסוי',
  areasHeadingCo: 'איפה אנחנו פועלים.',
  reviewsHeadingCo: 'תלמידים סומכים עלינו.',
  galleryHeadingCo: 'מהשטח.',
  faqHeadingCo: 'שאלות, עם תשובות.',
  bookHeadingCo: 'מוכנים להתחיל?',
  bookBodyCo: 'נרשמים עם הקוד מהמורה ומזמינים את השיעור הראשון עוד היום.',
  heroCaption: 'מפגש 01 · שיעור בעיצומו',
  feature0Title: 'מכוון לקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מכויל בדיוק למקום שבו אתם נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב מודרני עם דוושות כפולות שמנהל את הסיכון בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  cmdkLabel: 'פקודה',
  cmdkHint: 'חיפוש',
  cmdkAria: 'פתיחת תפריט הפקודות',
  cmdQuery: 'להזמין שיעור',
  cmdResult1: 'הזמנת שיעור',
  cmdResult2: 'צפייה בחבילות',
  cmdResult3: 'הודעה למורה',
  cmdEnter: 'Enter',
  liveLabel: 'פעיל',
  statusLabel: 'כל המערכות פעילות',
  scheduleLabel: 'לוח היום',
  availLabel: 'פנוי',
  gridLabel: 'בואו נתחיל',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: CoStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز درساً',
  bookThisPlan: 'ابدأ الآن',
  whyEyebrowCo: 'النظام',
  whyHeadingCo: 'مدرسة قيادتك، مبنيّة مثل برمجية.',
  packagesHeadingCo: 'اختر باقة.',
  packagesSubCo: 'أسعار شفافة — بلا رسوم خفية ولا مفاجآت في التفاصيل الصغيرة.',
  areasEyebrowCo: 'التغطية',
  areasHeadingCo: 'أين نعمل.',
  reviewsHeadingCo: 'موثوق من المتعلّمين.',
  galleryHeadingCo: 'من الميدان.',
  faqHeadingCo: 'أسئلة، مع إجابات.',
  bookHeadingCo: 'جاهز للبدء؟',
  bookBodyCo: 'سجّل بالرمز من مدرّبك واحجز درسك الأول اليوم.',
  heroCaption: 'الجلسة 01 · درس جارٍ',
  feature0Title: 'مضبوط على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس معاير تماماً حسب مستواك.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى المخاطر عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  cmdkLabel: 'أمر',
  cmdkHint: 'بحث',
  cmdkAria: 'فتح قائمة الأوامر',
  cmdQuery: 'احجز درساً',
  cmdResult1: 'حجز درس',
  cmdResult2: 'عرض الباقات',
  cmdResult3: 'مراسلة المدرّب',
  cmdEnter: 'Enter',
  liveLabel: 'مباشر',
  statusLabel: 'كل الأنظمة تعمل',
  scheduleLabel: 'جدول اليوم',
  availLabel: 'متاح',
  gridLabel: 'ابدأ الآن',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const CO: Record<Locale, CoStrings> = { en, he, ar };
export const coStrings = (locale?: Locale): CoStrings => CO[locale ?? 'en'] ?? CO.en;
