// Gilt template — the foil-stamped invitation voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here; everything else is inherited from T via `...T[locale]`.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface GtStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  // Overridden base keys carry a `Gt` suffix so the literal defaults are distinct.
  whyEyebrowGt: string;
  whyHeadingGt: string;
  packagesHeadingGt: string;
  packagesSubGt: string;
  areasEyebrowGt: string;
  areasHeadingGt: string;
  reviewsHeadingGt: string;
  galleryHeadingGt: string;
  faqHeadingGt: string;
  bookHeadingGt: string;
  bookBodyGt: string;
  // Unique to Gilt
  heroCaption: string;
  sealMotto: string;
  signatureLabel: string;
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

const en: GtStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Reserve',
  bookThisPlan: 'Reserve this plan',
  whyEyebrowGt: 'The hallmark',
  whyHeadingGt: 'Instruction, finely made.',
  packagesHeadingGt: 'Choose your invitation.',
  packagesSubGt: 'Considered plans, honestly priced — nothing hidden in the fine print.',
  areasEyebrowGt: 'Coverage',
  areasHeadingGt: 'Where we drive.',
  reviewsHeadingGt: 'In good company.',
  galleryHeadingGt: 'From the road.',
  faqHeadingGt: 'Finer details.',
  bookHeadingGt: 'You’re invited to drive.',
  bookBodyGt: 'Choose a time and we’ll take care of the rest — start to finish.',
  heroCaption: 'A driving lesson, in progress',
  sealMotto: 'Every lesson, finely made',
  signatureLabel: 'Signature',
  feature0Title: 'Paced to you',
  feature0Body: 'One-to-one, never doubled up — every lesson shaped around exactly where you are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Collected from home, work or college — at no extra cost.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: GtStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'הזמנת המסלול הזה',
  whyEyebrowGt: 'חותם האיכות',
  whyHeadingGt: 'הדרכה, בעבודת יד.',
  packagesHeadingGt: 'בוחרים את ההזמנה שלכם.',
  packagesSubGt: 'מסלולים מדודים במחיר הוגן — שום דבר לא מוסתר באותיות הקטנות.',
  areasEyebrowGt: 'אזורי כיסוי',
  areasHeadingGt: 'איפה אנחנו נוהגים.',
  reviewsHeadingGt: 'בחברה טובה.',
  galleryHeadingGt: 'מהכביש.',
  faqHeadingGt: 'הפרטים הקטנים.',
  bookHeadingGt: 'אתם מוזמנים לנהוג.',
  bookBodyGt: 'בוחרים זמן ואנחנו דואגים לכל השאר — מההתחלה ועד הסוף.',
  heroCaption: 'שיעור נהיגה בעיצומו',
  sealMotto: 'כל שיעור, בעבודת יד',
  signatureLabel: 'החתימה',
  feature0Title: 'בקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות — כל שיעור מותאם בדיוק לאן שאתם נמצאים.',
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

const ar: GtStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowGt: 'خاتم الجودة',
  whyHeadingGt: 'تدريب مصنوع بإتقان.',
  packagesHeadingGt: 'اختر دعوتك.',
  packagesSubGt: 'باقات مدروسة بأسعار صادقة — لا شيء مخفي في التفاصيل الدقيقة.',
  areasEyebrowGt: 'التغطية',
  areasHeadingGt: 'أين نقود.',
  reviewsHeadingGt: 'في صحبة كريمة.',
  galleryHeadingGt: 'من الطريق.',
  faqHeadingGt: 'التفاصيل الدقيقة.',
  bookHeadingGt: 'أنت مدعوّ للقيادة.',
  bookBodyGt: 'اختر وقتاً وسنتولّى الباقي — من البداية إلى النهاية.',
  heroCaption: 'درس قيادة جارٍ',
  sealMotto: 'كل درس مصنوع بإتقان',
  signatureLabel: 'التوقيع',
  feature0Title: 'على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة — كل درس مصمّم حول حيث أنت تماماً.',
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

const GT: Record<Locale, GtStrings> = { en, he, ar };
export const gtStrings = (locale?: Locale): GtStrings => GT[locale ?? 'en'] ?? GT.en;
