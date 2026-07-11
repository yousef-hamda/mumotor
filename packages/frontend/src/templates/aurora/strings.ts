// Aurora template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface AuStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  whyEyebrowAu: string;
  whyHeadingAu: string;
  packagesHeadingAu: string;
  packagesSubAu: string;
  bookThisPlan: string;
  areasEyebrowAu: string;
  areasHeadingAu: string;
  reviewsHeadingAu: string;
  galleryHeadingAu: string;
  faqHeadingAu: string;
  bookHeadingAu: string;
  bookBodyAu: string;
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

const en: AuStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  whyEyebrowAu: 'Why learners choose us',
  whyHeadingAu: 'Everything feels calmer here.',
  packagesHeadingAu: 'Pick a plan that fits.',
  packagesSubAu: 'Transparent pricing, no hidden fees, change your mind any time.',
  bookThisPlan: 'Book this plan',
  areasEyebrowAu: 'Areas covered',
  areasHeadingAu: 'We come to you.',
  reviewsHeadingAu: 'Loved by learners.',
  galleryHeadingAu: 'From the driving seat.',
  faqHeadingAu: 'Common questions.',
  bookHeadingAu: 'Ready when you are.',
  bookBodyAu: 'Pick a time that works for you and we’ll take it from there.',
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: AuStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  whyEyebrowAu: 'למה תלמידים בוחרים בנו',
  whyHeadingAu: 'כאן הכול מרגיש רגוע יותר.',
  packagesHeadingAu: 'בוחרים מסלול שמתאים לכם.',
  packagesSubAu: 'מחירים שקופים, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  bookThisPlan: 'להזמנת המסלול',
  areasEyebrowAu: 'אזורי שירות',
  areasHeadingAu: 'אנחנו מגיעים אליך.',
  reviewsHeadingAu: 'תלמידים מתאהבים.',
  galleryHeadingAu: 'מהמושב של הנהג.',
  faqHeadingAu: 'שאלות נפוצות.',
  bookHeadingAu: 'מוכנים כשאתם מוכנים.',
  bookBodyAu: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  feature0Title: 'שיעורים רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: AuStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  whyEyebrowAu: 'لماذا يختارنا المتعلّمون',
  whyHeadingAu: 'كل شيء يبدو أهدأ هنا.',
  packagesHeadingAu: 'اختر الباقة التي تناسبك.',
  packagesSubAu: 'أسعار شفافة، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  bookThisPlan: 'احجز هذه الباقة',
  areasEyebrowAu: 'مناطق الخدمة',
  areasHeadingAu: 'نأتي إليك.',
  reviewsHeadingAu: 'محبوب من المتعلّمين.',
  galleryHeadingAu: 'من مقعد السائق.',
  faqHeadingAu: 'أسئلة شائعة.',
  bookHeadingAu: 'جاهزون متى كنت جاهزاً.',
  bookBodyAu: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  feature0Title: 'دروس هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const AU: Record<Locale, AuStrings> = { en, he, ar };
export const auStrings = (locale?: Locale): AuStrings => AU[locale ?? 'en'] ?? AU.en;
