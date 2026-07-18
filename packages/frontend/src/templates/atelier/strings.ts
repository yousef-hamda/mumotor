// Atelier template — the bespoke tailor's-studio voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here. EN output mirrors the shared defaults in spirit; HE/AR
// are real, independently-written translations (never copied from T.en).
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface AtStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowAt: string;
  whyHeadingAt: string;
  packagesHeadingAt: string;
  packagesSubAt: string;
  areasEyebrowAt: string;
  areasHeadingAt: string;
  reviewsHeadingAt: string;
  galleryHeadingAt: string;
  faqHeadingAt: string;
  bookHeadingAt: string;
  bookBodyAt: string;
  // Tailor-craft ornament / motif labels (decorative, but real localized text).
  heroCaption: string;
  tailorMotto: string;
  badgePopularAt: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Measuring-tape rail ticks — decorative cartographic-style annotation of the
  // section order (mirrors the mantle/legend tick pattern used elsewhere).
  tickHero: string;
  tickStats: string;
  tickWhy: string;
  tickPackages: string;
  tickAbout: string;
  tickAreas: string;
  tickReviews: string;
  tickGallery: string;
  tickFaq: string;
  tickBook: string;
  tickContact: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
  menuOpenAria: string;
  menuCloseAria: string;
}

const en: AtStrings = {
  ...T.en,
  navPackages: 'Swatches',
  bookNow: 'Book a fitting',
  bookThisPlan: 'Choose this cut',
  whyEyebrowAt: 'The atelier',
  whyHeadingAt: 'Cut to fit, never off the rack.',
  packagesHeadingAt: 'Choose your cloth.',
  packagesSubAt: 'Every plan cut to measure — honest prices, nothing let out in the fine print.',
  areasEyebrowAt: 'Reach',
  areasHeadingAt: 'Fittings, delivered to your door.',
  reviewsHeadingAt: 'Notes from the fitting room.',
  galleryHeadingAt: 'Inside the workroom.',
  faqHeadingAt: 'Alterations & notes.',
  bookHeadingAt: 'Book your first fitting.',
  bookBodyAt: 'Choose a time, and we will chalk out the rest together.',
  heroCaption: 'Fitting 01 · Measured, chalked, cut to you',
  tailorMotto: 'Measured. Fitted. Made to order.',
  badgePopularAt: 'The house cut',
  feature0Title: 'Cut to your pace',
  feature0Body: 'One-to-one, never doubled up — every lesson tailored from exactly where you stand.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly takes in the worry for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Collected from home, work or college — at no extra charge.',
  tickHero: 'Opening',
  tickStats: 'Measurements',
  tickWhy: 'Philosophy',
  tickPackages: 'Swatches',
  tickAbout: 'The Tailor',
  tickAreas: 'Reach',
  tickReviews: 'Fittings',
  tickGallery: 'Workroom',
  tickFaq: 'Alterations',
  tickBook: 'Book a Fitting',
  tickContact: 'Visit',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
  menuOpenAria: 'Open menu',
  menuCloseAria: 'Close menu',
};

const he: AtStrings = {
  ...T.he,
  navPackages: 'דוגמאות בד',
  bookNow: 'קביעת מדידה',
  bookThisPlan: 'בוחרים את הגזרה הזו',
  whyEyebrowAt: 'הסדנה',
  whyHeadingAt: 'תפור למידה שלך, לא מהמדף.',
  packagesHeadingAt: 'בוחרים את הבד שלכם.',
  packagesSubAt: 'כל מסלול נתפר בדיוק עליכם — מחיר הוגן, בלי כלום מוסתר בתפר.',
  areasEyebrowAt: 'טווח השירות',
  areasHeadingAt: 'מדידות, עד הבית שלכם.',
  reviewsHeadingAt: 'רשמים מחדר המדידות.',
  galleryHeadingAt: 'הצצה לסדנה.',
  faqHeadingAt: 'תיקונים ותשובות.',
  bookHeadingAt: 'קובעים את המדידה הראשונה.',
  bookBodyAt: 'בוחרים זמן, ואת השאר נסמן יחד בגיר.',
  heroCaption: 'מדידה 01 · נמדד, מסומן בגיר, נתפר בדיוק אליכם',
  tailorMotto: 'נמדד. מותאם. נתפר לפי הזמנה.',
  badgePopularAt: 'הגזרה של הבית',
  feature0Title: 'בקצב המדויק שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות — כל שיעור נתפר בדיוק מהנקודה שבה אתם נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  tickHero: 'פתיחה',
  tickStats: 'מידות',
  tickWhy: 'פילוסופיה',
  tickPackages: 'דוגמאות בד',
  tickAbout: 'התופר',
  tickAreas: 'טווח',
  tickReviews: 'מדידות',
  tickGallery: 'הסדנה',
  tickFaq: 'תיקונים',
  tickBook: 'קביעת מדידה',
  tickContact: 'ביקור',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  menuOpenAria: 'פתיחת התפריט',
  menuCloseAria: 'סגירת התפריט',
};

const ar: AtStrings = {
  ...T.ar,
  navPackages: 'عينات القماش',
  bookNow: 'حجز قياس',
  bookThisPlan: 'اختر هذه القصّة',
  whyEyebrowAt: 'المشغل',
  whyHeadingAt: 'مفصّل على مقاسك، لا جاهز من الرف.',
  packagesHeadingAt: 'اختر قماشك.',
  packagesSubAt: 'كل باقة مفصّلة على مقاسك تمامًا — أسعار صادقة، لا شيء مخفي في الحاشية.',
  areasEyebrowAt: 'نطاق الخدمة',
  areasHeadingAt: 'قياسات، تُوصَل إلى بابك.',
  reviewsHeadingAt: 'انطباعات من غرفة القياس.',
  galleryHeadingAt: 'لمحة من المشغل.',
  faqHeadingAt: 'تعديلات وإجابات.',
  bookHeadingAt: 'احجز قياسك الأول.',
  bookBodyAt: 'اختر وقتًا، وسنرسم البقية معًا بالطبشور.',
  heroCaption: 'قياس 01 · يُقاس، يُعلَّم بالطبشور، يُفصَّل عليك',
  tailorMotto: 'يُقاس. يُفصَّل. يُصنع حسب الطلب.',
  badgePopularAt: 'قصّة البيت',
  feature0Title: 'على وتيرتك بالضبط',
  feature0Body: 'فردي دائمًا، بلا دروس مزدوجة — كل درس مفصّل من حيث أنت فعلاً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية.',
  tickHero: 'البداية',
  tickStats: 'المقاسات',
  tickWhy: 'الفلسفة',
  tickPackages: 'عينات القماش',
  tickAbout: 'الخيّاط',
  tickAreas: 'النطاق',
  tickReviews: 'القياسات',
  tickGallery: 'المشغل',
  tickFaq: 'تعديلات',
  tickBook: 'حجز قياس',
  tickContact: 'زيارة',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
  menuOpenAria: 'فتح القائمة',
  menuCloseAria: 'إغلاق القائمة',
};

const AT: Record<Locale, AtStrings> = { en, he, ar };
export const atStrings = (locale?: Locale): AtStrings => AT[locale ?? 'en'] ?? AT.en;
