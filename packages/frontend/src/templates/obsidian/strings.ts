// Obsidian template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface ObStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowOb: string;
  whyHeadingOb: string;
  packagesHeadingOb: string;
  packagesSubOb: string;
  areasEyebrowOb: string;
  areasHeadingOb: string;
  reviewsHeadingOb: string;
  galleryHeadingOb: string;
  faqHeadingOb: string;
  bookHeadingOb: string;
  bookBodyOb: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  heroImageAlt: string;
  aboutImageAlt: string;
}

const en: ObStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowOb: 'Why learners choose us',
  whyHeadingOb: 'Everything feels calmer here.',
  packagesHeadingOb: 'Pick a plan that fits.',
  packagesSubOb: 'Transparent pricing, no hidden fees, change your mind any time.',
  areasEyebrowOb: 'Areas covered',
  areasHeadingOb: 'We come to you.',
  reviewsHeadingOb: 'Loved by learners.',
  galleryHeadingOb: 'From the driving seat.',
  faqHeadingOb: 'Common questions.',
  bookHeadingOb: 'Ready when you are.',
  bookBodyOb: "Pick a time that works for you and we'll take it from there.",
  feature0Title: 'Calm, one-to-one lessons',
  feature0Body: 'Never doubled-up. Patient, steady guidance paced exactly to you.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
};

const he: ObStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowOb: 'למה תלמידים בוחרים בנו',
  whyHeadingOb: 'כאן הכול מרגיש רגוע יותר.',
  packagesHeadingOb: 'בוחרים מסלול שמתאים לך.',
  packagesSubOb: 'מחירים שקופים, בלי עלויות נסתרות, אפשר להתחרט בכל רגע.',
  areasEyebrowOb: 'אזורי שירות',
  areasHeadingOb: 'אנחנו מגיעים אליך.',
  reviewsHeadingOb: 'תלמידים מתאהבים.',
  galleryHeadingOb: 'מהמושב של הנהג.',
  faqHeadingOb: 'שאלות נפוצות.',
  bookHeadingOb: 'מוכנים כשאתם מוכנים.',
  bookBodyOb: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  feature0Title: 'שיעורי נהיגה רגועים, אחד על אחד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
};

const ar: ObStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowOb: 'لماذا يختارنا المتعلّمون',
  whyHeadingOb: 'كل شيء يبدو أهدأ هنا.',
  packagesHeadingOb: 'اختر باقة تناسبك.',
  packagesSubOb: 'أسعار شفافة، بلا رسوم خفية، ويمكنك تغيير رأيك في أي وقت.',
  areasEyebrowOb: 'مناطق الخدمة',
  areasHeadingOb: 'نأتي إليك.',
  reviewsHeadingOb: 'محبوب من المتعلّمين.',
  galleryHeadingOb: 'من مقعد السائق.',
  faqHeadingOb: 'أسئلة شائعة.',
  bookHeadingOb: 'جاهزون متى كنت جاهزاً.',
  bookBodyOb: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  feature0Title: 'دروس قيادة هادئة، فردية',
  feature0Body: 'فردي دائماً. توجيه صبور وثابت بوتيرتك تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب قيادة مع متعلّم',
};

const OB: Record<Locale, ObStrings> = { en, he, ar };
export const obStrings = (locale?: Locale): ObStrings => OB[locale ?? 'en'] ?? OB.en;
