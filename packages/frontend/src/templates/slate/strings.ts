// Slate template — the chalkboard-classroom voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface StStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowSt: string;
  whyHeadingSt: string;
  packagesHeadingSt: string;
  packagesSubSt: string;
  areasEyebrowSt: string;
  areasHeadingSt: string;
  reviewsHeadingSt: string;
  galleryHeadingSt: string;
  faqHeadingSt: string;
  bookHeadingSt: string;
  bookBodySt: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Chalkboard device labels (decorative / caption flavour).
  heroCaption: string;
  lessonNote: string; // Caveat chalk annotation by the hero roundabout diagram
  routesNote: string; // Caveat chalk annotation on the areas map
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: StStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book a lesson',
  bookThisPlan: 'Chalk it in',
  whyEyebrowSt: 'Today’s lesson',
  whyHeadingSt: 'Everything written up, nothing hidden.',
  packagesHeadingSt: 'Pick your lesson plan.',
  packagesSubSt: 'Clear prices on the board — no small print, no surprises.',
  areasEyebrowSt: 'On the map',
  areasHeadingSt: 'The routes we know by heart.',
  reviewsHeadingSt: 'Top of the class.',
  galleryHeadingSt: 'From the driving seat.',
  faqHeadingSt: 'Chalk talk.',
  bookHeadingSt: 'Put your name on the board.',
  bookBodySt: 'Pick a time and we’ll pencil in your first lesson — the rest we teach as we go.',
  feature0Title: 'Taught at your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson starts from exactly where you are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost.',
  heroCaption: 'A real lesson, out on the road',
  lessonNote: 'let’s take the roundabout',
  routesNote: 'our routes',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: StStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'הזמנת שיעור',
  bookThisPlan: 'רושמים על הלוח',
  whyEyebrowSt: 'שיעור היום',
  whyHeadingSt: 'הכול כתוב על הלוח, שום דבר לא מוסתר.',
  packagesHeadingSt: 'בוחרים מסלול לימוד.',
  packagesSubSt: 'המחירים על הלוח — בלי אותיות קטנות ובלי הפתעות.',
  areasEyebrowSt: 'על המפה',
  areasHeadingSt: 'המסלולים שאנחנו מכירים בעל פה.',
  reviewsHeadingSt: 'בראש הכיתה.',
  galleryHeadingSt: 'מהמושב של הנהג.',
  faqHeadingSt: 'שיחת לוח.',
  bookHeadingSt: 'כותבים את השם על הלוח.',
  bookBodySt: 'בוחרים זמן ואנחנו נסמן את השיעור הראשון — את השאר נלמד תוך כדי.',
  feature0Title: 'בקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מתחיל בדיוק מהמקום שבו אתם.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroCaption: 'שיעור אמיתי, על הכביש',
  lessonNote: 'בואו ניקח את הכיכר',
  routesNote: 'המסלולים שלנו',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: StStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز درساً',
  bookThisPlan: 'اكتبها على اللوح',
  whyEyebrowSt: 'درس اليوم',
  whyHeadingSt: 'كل شيء مكتوب على اللوح، لا شيء مخفي.',
  packagesHeadingSt: 'اختر خطة دروسك.',
  packagesSubSt: 'الأسعار على اللوح — بلا حروف صغيرة ولا مفاجآت.',
  areasEyebrowSt: 'على الخريطة',
  areasHeadingSt: 'المسارات التي نعرفها عن ظهر قلب.',
  reviewsHeadingSt: 'في صدارة الصف.',
  galleryHeadingSt: 'من مقعد السائق.',
  faqHeadingSt: 'حديث اللوح.',
  bookHeadingSt: 'اكتب اسمك على اللوح.',
  bookBodySt: 'اختر وقتاً وسنسجّل درسك الأول — والباقي نعلّمه أثناء الطريق.',
  feature0Title: 'على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس يبدأ من حيث أنت تماماً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  heroCaption: 'درس حقيقي، على الطريق',
  lessonNote: 'لنأخذ الدوّار',
  routesNote: 'مساراتنا',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const ST: Record<Locale, StStrings> = { en, he, ar };
export const stStrings = (locale?: Locale): StStrings => ST[locale ?? 'en'] ?? ST.en;
