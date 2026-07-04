// Bento template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface BnStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowBn: string;
  whyHeadingBn: string;
  packagesHeadingBn: string;
  packagesSubBn: string;
  areasEyebrowBn: string;
  areasHeadingBn: string;
  reviewsHeadingBn: string;
  galleryHeadingBn: string;
  faqHeadingBn: string;
  bookHeadingBn: string;
  bookBodyBn: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  locationsCovered: string; // {n}
  starsAria: string; // {n}
  publishNote: string;
  mainNavAria: string;
  goToTopAria: string;
  openMenu: string;
  closeMenu: string;
}

const en: BnStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowBn: 'Why learners choose us',
  whyHeadingBn: 'Everything feels calmer here.',
  packagesHeadingBn: 'Pick a plan that fits.',
  packagesSubBn: 'Transparent pricing, no hidden fees, change your mind any time.',
  areasEyebrowBn: 'Areas covered',
  areasHeadingBn: 'We come to you.',
  reviewsHeadingBn: 'Loved by learners.',
  galleryHeadingBn: 'From the driving seat.',
  faqHeadingBn: 'Common questions.',
  bookHeadingBn: 'Ready when you are.',
  bookBodyBn: "Pick a time that works for you and we'll take it from there.",
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner',
  locationsCovered: '{n} locations covered',
  starsAria: '{n} out of 5 stars',
  publishNote: 'Available once your site is published',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
};

const he: BnStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowBn: 'למה תלמידים בוחרים בנו',
  whyHeadingBn: 'כאן הכול מרגיש רגוע יותר.',
  packagesHeadingBn: 'בוחרים מסלול שמתאים לכם.',
  packagesSubBn: 'מחירים שקופים, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  areasEyebrowBn: 'אזורי שירות',
  areasHeadingBn: 'אנחנו מגיעים אליך.',
  reviewsHeadingBn: 'תלמידים מתאהבים.',
  galleryHeadingBn: 'מהמושב של הנהג.',
  faqHeadingBn: 'שאלות נפוצות.',
  bookHeadingBn: 'מוכנים כשאתם מוכנים.',
  bookBodyBn: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  feature0Title: 'שיעורים רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  locationsCovered: 'מכסים {n} אזורים',
  starsAria: '{n} מתוך 5 כוכבים',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  openMenu: 'פתיחת תפריט',
  closeMenu: 'סגירת תפריט',
};

const ar: BnStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowBn: 'لماذا يختارنا المتعلّمون',
  whyHeadingBn: 'كل شيء يبدو أهدأ هنا.',
  packagesHeadingBn: 'اختر الباقة التي تناسبك.',
  packagesSubBn: 'أسعار شفافة، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  areasEyebrowBn: 'مناطق الخدمة',
  areasHeadingBn: 'نأتي إليك.',
  reviewsHeadingBn: 'محبوب من المتعلّمين.',
  galleryHeadingBn: 'من مقعد السائق.',
  faqHeadingBn: 'أسئلة شائعة.',
  bookHeadingBn: 'جاهزون متى كنت جاهزاً.',
  bookBodyBn: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  feature0Title: 'دروس هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  locationsCovered: 'نغطي {n} مناطق',
  starsAria: '{n} من 5 نجوم',
  publishNote: 'متاح بعد نشر موقعك',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
};

const BN: Record<Locale, BnStrings> = { en, he, ar };
export const bnStrings = (locale?: Locale): BnStrings => BN[locale ?? 'en'] ?? BN.en;
