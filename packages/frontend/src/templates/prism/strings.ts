// Prism template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface PrStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowPr: string;
  whyHeadingPr: string;
  packagesHeadingPr: string;
  packagesSubPr: string;
  areasEyebrowPr: string;
  areasHeadingPr: string;
  reviewsHeadingPr: string;
  galleryHeadingPr: string;
  faqHeadingPr: string;
  bookHeadingPr: string;
  bookBodyPr: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  heroImageAlt: string;
  aboutImageAlt: string;
}

const en: PrStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowPr: 'Why learners choose us',
  whyHeadingPr: 'Everything feels calmer here.',
  packagesHeadingPr: 'Pick a plan that fits.',
  packagesSubPr: 'Transparent pricing, no hidden fees, change your mind any time.',
  areasEyebrowPr: 'Areas covered',
  areasHeadingPr: 'We come to you.',
  reviewsHeadingPr: 'Loved by learners.',
  galleryHeadingPr: 'From the driving seat.',
  faqHeadingPr: 'Common questions.',
  bookHeadingPr: 'Ready when you are.',
  bookBodyPr: "Pick a time that works for you and we'll take it from there.",
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
};

const he: PrStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowPr: 'למה תלמידים בוחרים בנו',
  whyHeadingPr: 'כאן הכול מרגיש רגוע יותר.',
  packagesHeadingPr: 'בוחרים מסלול שמתאים לכם.',
  packagesSubPr: 'תמחור שקוף, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  areasEyebrowPr: 'אזורי שירות',
  areasHeadingPr: 'אנחנו מגיעים אליך.',
  reviewsHeadingPr: 'תלמידים מתאהבים.',
  galleryHeadingPr: 'מהמושב של הנהג.',
  faqHeadingPr: 'שאלות נפוצות.',
  bookHeadingPr: 'מוכנים כשאתם מוכנים.',
  bookBodyPr: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  feature0Title: 'שיעורים רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
};

const ar: PrStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowPr: 'لماذا يختارنا المتعلّمون',
  whyHeadingPr: 'كل شيء يبدو أهدأ هنا.',
  packagesHeadingPr: 'اختر الباقة التي تناسبك.',
  packagesSubPr: 'تسعير شفاف، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  areasEyebrowPr: 'مناطق الخدمة',
  areasHeadingPr: 'نأتي إليك.',
  reviewsHeadingPr: 'محبوب من المتعلّمين.',
  galleryHeadingPr: 'من مقعد السائق.',
  faqHeadingPr: 'أسئلة شائعة.',
  bookHeadingPr: 'جاهزون متى كنت جاهزاً.',
  bookBodyPr: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  feature0Title: 'دروس هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب قيادة مع متعلّم',
};

const PR: Record<Locale, PrStrings> = { en, he, ar };
export const prStrings = (locale?: Locale): PrStrings => PR[locale ?? 'en'] ?? PR.en;
