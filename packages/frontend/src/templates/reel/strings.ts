// Reel template — the 35mm cinema voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live
// here. Overridden base keys carry an `Rl` suffix so they never clash with T.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface RlStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowRl: string;
  whyHeadingRl: string;
  packagesHeadingRl: string;
  packagesSubRl: string;
  areasEyebrowRl: string;
  areasHeadingRl: string;
  reviewsHeadingRl: string;
  galleryHeadingRl: string;
  faqHeadingRl: string;
  bookHeadingRl: string;
  bookBodyRl: string;
  // Cinema device labels
  heroCaption: string;
  nowShowing: string;
  runtimeLabel: string;
  reelLabel: string;
  frameLabel: string;
  premiere: string;
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

const en: RlStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this screening',
  whyEyebrowRl: 'The programme',
  whyHeadingRl: 'Shot the way you actually learn.',
  packagesHeadingRl: 'Choose your screening.',
  packagesSubRl: 'Clear runtimes, honest prices — nothing hidden in the credits.',
  areasEyebrowRl: 'On location',
  areasHeadingRl: 'Scenes we shoot.',
  reviewsHeadingRl: 'The reviews are in.',
  galleryHeadingRl: 'Selected frames.',
  faqHeadingRl: 'Behind the scenes.',
  bookHeadingRl: 'Book your seat.',
  bookBodyRl: 'Pick a time and we’ll roll camera on your first lesson.',
  heroCaption: 'Reel 01 · 35mm · Driving lessons',
  nowShowing: 'Now showing',
  runtimeLabel: 'Runtime',
  reelLabel: 'Reel',
  frameLabel: 'Frame',
  premiere: 'Premiere',
  feature0Title: 'One take, all you',
  feature0Body: 'One-to-one, never doubled-up. Every scene paced to exactly where you are.',
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

const he: RlStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת ההקרנה',
  whyEyebrowRl: 'התוכנייה',
  whyHeadingRl: 'מצולם בדיוק כמו שלומדים.',
  packagesHeadingRl: 'בוחרים הקרנה.',
  packagesSubRl: 'זמנים ברורים, מחירים הוגנים — כלום לא מוסתר בקרדיטים.',
  areasEyebrowRl: 'בצילומי חוץ',
  areasHeadingRl: 'הסצנות שאנחנו מצלמים.',
  reviewsHeadingRl: 'הביקורות הגיעו.',
  galleryHeadingRl: 'פריימים נבחרים.',
  faqHeadingRl: 'מאחורי הקלעים.',
  bookHeadingRl: 'שומרים לכם מקום.',
  bookBodyRl: 'בוחרים זמן, ואנחנו מתחילים לצלם את השיעור הראשון.',
  heroCaption: 'סליל 01 · 35 מ״מ · שיעורי נהיגה',
  nowShowing: 'מוצג כעת',
  runtimeLabel: 'משך',
  reelLabel: 'סליל',
  frameLabel: 'פריים',
  premiere: 'בכורה',
  feature0Title: 'טייק אחד, רק אתם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל סצנה בקצב שבו אתם באמת נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: RlStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الجلسة',
  whyEyebrowRl: 'البرنامج',
  whyHeadingRl: 'مصوّر تماماً كما تتعلّم.',
  packagesHeadingRl: 'اختر جلستك.',
  packagesSubRl: 'أوقات واضحة وأسعار صادقة — لا شيء مخفي في الكادر.',
  areasEyebrowRl: 'مواقع التصوير',
  areasHeadingRl: 'المَشاهد التي نصوّرها.',
  reviewsHeadingRl: 'وصلت التقييمات.',
  galleryHeadingRl: 'لقطات مختارة.',
  faqHeadingRl: 'خلف الكواليس.',
  bookHeadingRl: 'احجز مقعدك.',
  bookBodyRl: 'اختر وقتاً وسنبدأ تصوير درسك الأول.',
  heroCaption: 'بكرة 01 · 35مم · دروس قيادة',
  nowShowing: 'يُعرض الآن',
  runtimeLabel: 'المدة',
  reelLabel: 'بكرة',
  frameLabel: 'لقطة',
  premiere: 'العرض الأول',
  feature0Title: 'لقطة واحدة، أنت البطل',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل مشهد بوتيرتك تماماً.',
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

const RL: Record<Locale, RlStrings> = { en, he, ar };
export const rlStrings = (locale?: Locale): RlStrings => RL[locale ?? 'en'] ?? RL.en;
