// Ledger template — the premium-fintech voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live
// here. Overridden base keys get an `Le` suffix so the interface stays explicit.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface LeStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowLe: string;
  whyHeadingLe: string;
  packagesHeadingLe: string;
  packagesSubLe: string;
  areasEyebrowLe: string;
  areasHeadingLe: string;
  reviewsHeadingLe: string;
  galleryHeadingLe: string;
  faqHeadingLe: string;
  bookHeadingLe: string;
  bookBodyLe: string;
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
  // Fintech "statement card" chrome (decorative labels — the figures are real data).
  balanceLabel: string;
  statusLabel: string;
  statementLabel: string;
  verifiedLabel: string;
}

const en: LeStrings = {
  ...T.en,
  navPackages: 'Pricing',
  bookNow: 'Book a lesson',
  bookThisPlan: 'Get started',
  whyEyebrowLe: 'Why learn here',
  whyHeadingLe: 'Clarity you can count on.',
  packagesHeadingLe: 'Transparent, itemised pricing.',
  packagesSubLe: 'Every plan reads like a clear statement — pick one and you know exactly what you get.',
  areasEyebrowLe: 'Coverage',
  areasHeadingLe: 'Where we cover.',
  reviewsHeadingLe: 'Trusted by learners.',
  galleryHeadingLe: 'On the road.',
  faqHeadingLe: 'Questions, answered.',
  bookHeadingLe: 'Open your first lesson.',
  bookBodyLe: 'Pick a time and start with a clear plan — no paperwork, no pressure.',
  heroCaption: 'A clear record of real results.',
  feature0Title: 'Clear, upfront pricing',
  feature0Body: 'Every lesson is itemised. No hidden fees and no surprises — you always know exactly what you pay.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you, every single lesson.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — no extra cost, no detours.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
  balanceLabel: 'Track record',
  statusLabel: 'Active',
  statementLabel: 'Trend',
  verifiedLabel: 'Verified',
};

const he: LeStrings = {
  ...T.he,
  navPackages: 'מחירים',
  bookNow: 'הזמנת שיעור',
  bookThisPlan: 'בואו נתחיל',
  whyEyebrowLe: 'למה ללמוד כאן',
  whyHeadingLe: 'בהירות שאפשר לסמוך עליה.',
  packagesHeadingLe: 'תמחור שקוף ומפורט.',
  packagesSubLe: 'כל מסלול נקרא כמו דוח ברור — בוחרים אחד ויודעים בדיוק מה מקבלים.',
  areasEyebrowLe: 'אזורי כיסוי',
  areasHeadingLe: 'האזורים שאנחנו מכסים.',
  reviewsHeadingLe: 'תלמידים סומכים עלינו.',
  galleryHeadingLe: 'על הכביש.',
  faqHeadingLe: 'שאלות, עם תשובות.',
  bookHeadingLe: 'פותחים את השיעור הראשון.',
  bookBodyLe: 'בוחרים זמן ומתחילים עם תוכנית ברורה — בלי ניירת ובלי לחץ.',
  heroCaption: 'רישום ברור של תוצאות אמיתיות.',
  feature0Title: 'תמחור ברור ומראש',
  feature0Body: 'כל שיעור מפורט. בלי עלויות נסתרות ובלי הפתעות — תמיד יודעים בדיוק כמה משלמים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם, בכל שיעור.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר ובלי עיקופים.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  balanceLabel: 'מדד ביצועים',
  statusLabel: 'פעיל',
  statementLabel: 'מגמה',
  verifiedLabel: 'מאומת',
};

const ar: LeStrings = {
  ...T.ar,
  navPackages: 'الأسعار',
  bookNow: 'احجز درساً',
  bookThisPlan: 'ابدأ الآن',
  whyEyebrowLe: 'لماذا تتعلم هنا',
  whyHeadingLe: 'وضوح يمكنك الاعتماد عليه.',
  packagesHeadingLe: 'أسعار شفافة ومفصّلة.',
  packagesSubLe: 'كل باقة تُقرأ ككشف واضح — اختر واحدة وتعرف بالضبط ما ستحصل عليه.',
  areasEyebrowLe: 'التغطية',
  areasHeadingLe: 'المناطق التي نغطيها.',
  reviewsHeadingLe: 'المتعلّمون يثقون بنا.',
  galleryHeadingLe: 'على الطريق.',
  faqHeadingLe: 'أسئلة، وإجابات.',
  bookHeadingLe: 'افتح درسك الأول.',
  bookBodyLe: 'اختر وقتاً وابدأ بخطة واضحة — بلا أوراق وبلا ضغط.',
  heroCaption: 'سجلّ واضح لنتائج حقيقية.',
  feature0Title: 'أسعار واضحة ومسبقة',
  feature0Body: 'كل درس مفصّل. بلا رسوم خفية وبلا مفاجآت — تعرف دائماً بالضبط ما تدفعه.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء، في كل درس.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية وبلا التفافات.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
  balanceLabel: 'سجل الأداء',
  statusLabel: 'نشط',
  statementLabel: 'الاتجاه',
  verifiedLabel: 'موثّق',
};

const LE: Record<Locale, LeStrings> = { en, he, ar };
export const leStrings = (locale?: Locale): LeStrings => LE[locale ?? 'en'] ?? LE.en;
