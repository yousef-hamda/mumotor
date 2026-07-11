// Frosted template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface FrStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowFr: string;
  whyHeadingFr: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  packagesHeadingFr: string;
  packagesSubFr: string;
  areasEyebrowFr: string;
  areasHeadingFr: string;
  reviewsHeadingFr: string;
  galleryHeadingFr: string;
  faqHeadingFr: string;
  bookHeadingFr: string;
  bookBodyFr: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  bookUnpublishedTitle: string;
}

const en: FrStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowFr: 'Why learners choose us',
  whyHeadingFr: 'Everything feels calmer here.',
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  packagesHeadingFr: 'Pick a plan that fits.',
  packagesSubFr: 'Transparent pricing, no hidden fees, change your mind any time.',
  areasEyebrowFr: 'Areas covered',
  areasHeadingFr: 'We come to you.',
  reviewsHeadingFr: 'Loved by learners.',
  galleryHeadingFr: 'From the driving seat.',
  faqHeadingFr: 'Common questions.',
  bookHeadingFr: 'Ready when you are.',
  bookBodyFr: "Pick a time that works for you and we'll take it from there.",
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  bookUnpublishedTitle: 'Available once your site is published',
};

const he: FrStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowFr: 'למה תלמידים בוחרים בנו',
  whyHeadingFr: 'כאן הכול מרגיש רגוע יותר.',
  feature0Title: 'שיעורים רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  packagesHeadingFr: 'בוחרים מסלול שמתאים לכם.',
  packagesSubFr: 'מחירים שקופים, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  areasEyebrowFr: 'אזורי שירות',
  areasHeadingFr: 'אנחנו מגיעים אליך.',
  reviewsHeadingFr: 'תלמידים מתאהבים.',
  galleryHeadingFr: 'מהמושב של הנהג.',
  faqHeadingFr: 'שאלות נפוצות.',
  bookHeadingFr: 'מוכנים כשאתם מוכנים.',
  bookBodyFr: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  bookUnpublishedTitle: 'זמין לאחר פרסום האתר',
};

const ar: FrStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowFr: 'لماذا يختارنا المتعلّمون',
  whyHeadingFr: 'كل شيء يبدو أهدأ هنا.',
  feature0Title: 'دروس هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  packagesHeadingFr: 'اختر الباقة التي تناسبك.',
  packagesSubFr: 'أسعار شفافة، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  areasEyebrowFr: 'مناطق الخدمة',
  areasHeadingFr: 'نأتي إليك.',
  reviewsHeadingFr: 'محبوب من المتعلّمين.',
  galleryHeadingFr: 'من مقعد السائق.',
  faqHeadingFr: 'أسئلة شائعة.',
  bookHeadingFr: 'جاهزون متى كنت جاهزاً.',
  bookBodyFr: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  bookUnpublishedTitle: 'متاح بعد نشر موقعك',
};

const FR: Record<Locale, FrStrings> = { en, he, ar };
export const frStrings = (locale?: Locale): FrStrings => FR[locale ?? 'en'] ?? FR.en;
