// Primary template — the Bauhaus-poster voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface PmStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowPm: string;
  whyHeadingPm: string;
  packagesHeadingPm: string;
  packagesSubPm: string;
  areasEyebrowPm: string;
  areasHeadingPm: string;
  reviewsHeadingPm: string;
  galleryHeadingPm: string;
  faqHeadingPm: string;
  bookHeadingPm: string;
  bookBodyPm: string;
  heroCaption: string;
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

const en: PmStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Get started',
  whyEyebrowPm: 'The building blocks',
  whyHeadingPm: 'Everything in its right place.',
  packagesHeadingPm: 'Pick your shape.',
  packagesSubPm: 'Clear, honest pricing — nothing hidden, nothing extra.',
  areasEyebrowPm: 'Coverage',
  areasHeadingPm: 'Where we cover.',
  reviewsHeadingPm: 'Learners on the record.',
  galleryHeadingPm: 'On the road.',
  faqHeadingPm: 'Questions, answered.',
  bookHeadingPm: 'Ready when you are.',
  bookBodyPm: 'Pick a time that works for you and we’ll take it from there.',
  heroCaption: 'Real lessons · one learner at a time',
  feature0Title: 'One-to-one, always',
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

const he: PmStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'בואו נתחיל',
  whyEyebrowPm: 'אבני הבניין',
  whyHeadingPm: 'הכול במקום הנכון.',
  packagesHeadingPm: 'בוחרים את הצורה שלכם.',
  packagesSubPm: 'מחיר ברור והוגן — בלי הפתעות, בלי תוספות.',
  areasEyebrowPm: 'אזורי כיסוי',
  areasHeadingPm: 'איפה אנחנו מכסים.',
  reviewsHeadingPm: 'תלמידים מספרים.',
  galleryHeadingPm: 'על הכביש.',
  faqHeadingPm: 'שאלות, עם תשובות.',
  bookHeadingPm: 'מוכנים כשאתם מוכנים.',
  bookBodyPm: 'בוחרים זמן שמתאים לכם ואנחנו נדאג לכל השאר.',
  heroCaption: 'שיעורים אמיתיים · תלמיד אחד בכל פעם',
  feature0Title: 'אחד על אחד, תמיד',
  feature0Body: 'אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלכם בדיוק.',
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

const ar: PmStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'ابدأ الآن',
  whyEyebrowPm: 'اللبنات الأساسية',
  whyHeadingPm: 'كل شيء في مكانه الصحيح.',
  packagesHeadingPm: 'اختر شكلك.',
  packagesSubPm: 'أسعار واضحة وصادقة — لا شيء مخفي ولا إضافات.',
  areasEyebrowPm: 'التغطية',
  areasHeadingPm: 'أين نغطي.',
  reviewsHeadingPm: 'شهادات المتعلّمين.',
  galleryHeadingPm: 'على الطريق.',
  faqHeadingPm: 'أسئلة، وإجاباتها.',
  bookHeadingPm: 'جاهزون متى كنت جاهزاً.',
  bookBodyPm: 'اختر وقتاً يناسبك ونحن نتكفّل بالباقي.',
  heroCaption: 'دروس حقيقية · متعلّم واحد في كل مرة',
  feature0Title: 'فردي دائماً',
  feature0Body: 'بلا دروس مزدوجة. توجيه صبور وثابت بوتيرتك تماماً.',
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

const PM: Record<Locale, PmStrings> = { en, he, ar };
export const pmStrings = (locale?: Locale): PmStrings => PM[locale ?? 'en'] ?? PM.en;
