// Mumotor template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface MmStrings extends TemplateStrings {
  navPackages: string;
  whyEyebrowMm: string;
  whyHeadingMm: string;
  packagesSubMm: string;
  areasEyebrowMm: string;
  areasHeadingMm: string;
  reviewsHeadingMm: string;
  galleryHeadingMm: string;
  bookHeadingMm: string;
  bookBodyMm: string;
  bookNow: string;
  bookThisPlan: string;
  heroFloatTitle: string;
  heroFloatSub: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  scheduleTitle: string;
  scheduleLive: string;
  scheduleTagLesson: string; // {n}
  scheduleTagTest: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: MmStrings = {
  ...T.en,
  navPackages: 'Packages',
  whyEyebrowMm: 'Why learners choose us',
  whyHeadingMm: 'Everything feels calmer here.',
  packagesSubMm: 'Transparent prices, no hidden fees, change your mind any time.',
  areasEyebrowMm: 'Areas covered',
  areasHeadingMm: 'We come to you.',
  reviewsHeadingMm: 'Loved by learners.',
  galleryHeadingMm: 'From the driving seat.',
  bookHeadingMm: 'Ready when you are.',
  bookBodyMm: 'Pick a time that works for you and we’ll take it from there.',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  heroFloatTitle: 'New booking confirmed',
  heroFloatSub: 'Lesson booked · just now',
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  scheduleTitle: 'Today’s schedule',
  scheduleLive: 'Live',
  scheduleTagLesson: 'Lesson {n}',
  scheduleTagTest: 'Test prep',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: MmStrings = {
  ...T.he,
  navPackages: 'חבילות',
  whyEyebrowMm: 'למה תלמידים בוחרים בנו',
  whyHeadingMm: 'כאן הכול מרגיש רגוע יותר.',
  packagesSubMm: 'מחירים שקופים, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  areasEyebrowMm: 'אזורי שירות',
  areasHeadingMm: 'אנחנו מגיעים אליך.',
  reviewsHeadingMm: 'תלמידים מתאהבים.',
  galleryHeadingMm: 'מהמושב של הנהג.',
  bookHeadingMm: 'מוכנים כשאתם מוכנים.',
  bookBodyMm: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  heroFloatTitle: 'הזמנה חדשה אושרה',
  heroFloatSub: 'שיעור הוזמן · ממש עכשיו',
  feature0Title: 'שיעורים רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  scheduleTitle: 'לוח הזמנים של היום',
  scheduleLive: 'חי',
  scheduleTagLesson: 'שיעור {n}',
  scheduleTagTest: 'הכנה לטסט',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: MmStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  whyEyebrowMm: 'لماذا يختارنا المتعلّمون',
  whyHeadingMm: 'كل شيء يبدو أهدأ هنا.',
  packagesSubMm: 'أسعار شفافة، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  areasEyebrowMm: 'مناطق الخدمة',
  areasHeadingMm: 'نأتي إليك.',
  reviewsHeadingMm: 'محبوب من المتعلّمين.',
  galleryHeadingMm: 'من مقعد السائق.',
  bookHeadingMm: 'جاهزون متى كنت جاهزاً.',
  bookBodyMm: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  heroFloatTitle: 'تم تأكيد حجز جديد',
  heroFloatSub: 'تم حجز درس · الآن',
  feature0Title: 'دروس هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  scheduleTitle: 'جدول اليوم',
  scheduleLive: 'مباشر',
  scheduleTagLesson: 'الدرس {n}',
  scheduleTagTest: 'تحضير للاختبار',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const MM: Record<Locale, MmStrings> = { en, he, ar };
export const mmStrings = (locale?: Locale): MmStrings => MM[locale ?? 'en'] ?? MM.en;
