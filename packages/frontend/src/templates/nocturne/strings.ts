// Nocturne template — the celestial night-drive voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique — the compass/constellation chrome) live here. EN output mirrors the
// shared dictionary's tone; HE/AR are real, meaning-first translations (not
// literal word-for-word), so the "guided by starlight" metaphor still reads
// naturally in each language.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface NocStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowNc: string;
  whyHeadingNc: string;
  packagesHeadingNc: string;
  packagesSubNc: string;
  areasEyebrowNc: string;
  areasHeadingNc: string;
  reviewsHeadingNc: string;
  galleryHeadingNc: string;
  faqHeadingNc: string;
  bookHeadingNc: string;
  bookBodyNc: string;
  // Ornament / instrument-panel labels (decorative, but real, translated text).
  heroCaption: string;
  compassMotto: string;
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
  menuOpenAria: string;
  menuCloseAria: string;
  // Margin "star chart" marks — decorative cartographic annotation of the
  // section order (the celestial-navigation equivalent of a folio number).
  markHero: string;
  markStats: string;
  markWhy: string;
  markPackages: string;
  markAbout: string;
  markAreas: string;
  markReviews: string;
  markGallery: string;
  markFaq: string;
  markBook: string;
  markContact: string;
}

const en: NocStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Chart this course',
  whyEyebrowNc: 'Bearings',
  whyHeadingNc: 'Every lesson, plotted like a course.',
  packagesHeadingNc: 'Choose your course.',
  packagesSubNc: 'Honest fares, charted clearly — nothing hidden in the dark.',
  areasEyebrowNc: 'Territory',
  areasHeadingNc: 'Every road we know by starlight.',
  reviewsHeadingNc: 'Words from fellow travelers.',
  galleryHeadingNc: 'Frames from the night drive.',
  faqHeadingNc: 'Questions before you set off.',
  bookHeadingNc: 'Chart your first lesson.',
  bookBodyNc: 'Pick a time, and we’ll guide the rest — like navigating by the stars.',
  heroCaption: 'Course plotted · tonight’s lesson, guided by starlight',
  compassMotto: 'Guided by starlight, lesson after lesson.',
  feature0Title: 'Paced to your own constellation',
  feature0Body: 'One-to-one, never doubled up. Every lesson charted from exactly where you are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A calm, modern dual-control car that quietly holds the course for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Collected from home, work or college — no detour, no extra cost.',
  heroImageAlt: 'Driving lesson at dusk',
  aboutImageAlt: 'Instructor guiding a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
  menuOpenAria: 'Open menu',
  menuCloseAria: 'Close menu',
  markHero: 'Departure',
  markStats: 'Readings',
  markWhy: 'Compass',
  markPackages: 'Courses',
  markAbout: 'The navigator',
  markAreas: 'Territory',
  markReviews: 'Logbook',
  markGallery: 'Snapshots',
  markFaq: 'Notes',
  markBook: 'Set course',
  markContact: 'Reach us',
};

const he: NocStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לבחירת המסלול',
  whyEyebrowNc: 'כיוונים',
  whyHeadingNc: 'כל שיעור, מתוכנן כמו מסלול טיסה.',
  packagesHeadingNc: 'בחרו את המסלול שלכם.',
  packagesSubNc: 'מחירים הוגנים, מסומנים בבירור — שום דבר לא נסתר בחושך.',
  areasEyebrowNc: 'השטח',
  areasHeadingNc: 'כל כביש שאנחנו מכירים לאור הכוכבים.',
  reviewsHeadingNc: 'מילים ממי שכבר יצאו לדרך.',
  galleryHeadingNc: 'רגעים מנסיעת הלילה.',
  faqHeadingNc: 'שאלות לפני שיוצאים לדרך.',
  bookHeadingNc: 'תכננו את השיעור הראשון שלכם.',
  bookBodyNc: 'בוחרים זמן, ואנחנו נדריך אתכם בשאר הדרך — כמו ניווט לפי הכוכבים.',
  heroCaption: 'המסלול סומן · שיעור הערב, מודרך באור הכוכבים',
  compassMotto: 'מודרכים באור הכוכבים, שיעור אחרי שיעור.',
  feature0Title: 'בקצב שמתאים בדיוק לכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מתוכנן בדיוק מהנקודה שבה אתם נמצאים.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות ששומר על הכיוון הנכון בשקט, במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי סטייה מהמסלול ובלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בדמדומים',
  aboutImageAlt: 'מורה נהיגה מדריך תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  menuOpenAria: 'פתיחת התפריט',
  menuCloseAria: 'סגירת התפריט',
  markHero: 'יציאה לדרך',
  markStats: 'נתוני ניווט',
  markWhy: 'מצפן',
  markPackages: 'מסלולים',
  markAbout: 'הנווט',
  markAreas: 'השטח',
  markReviews: 'יומן מסע',
  markGallery: 'תמונות',
  markFaq: 'הערות',
  markBook: 'קביעת מסלול',
  markContact: 'יצירת קשר',
};

const ar: NocStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'ارسم هذا المسار',
  whyEyebrowNc: 'الاتجاهات',
  whyHeadingNc: 'كل درس، مخطَّط كمسار محدَّد.',
  packagesHeadingNc: 'اختر مسارك.',
  packagesSubNc: 'أسعار صادقة، مرسومة بوضوح — لا شيء مخفي في الظلام.',
  areasEyebrowNc: 'المنطقة',
  areasHeadingNc: 'كل طريق نعرفه على ضوء النجوم.',
  reviewsHeadingNc: 'كلمات من رفاق الطريق.',
  galleryHeadingNc: 'لقطات من رحلة الليل.',
  faqHeadingNc: 'أسئلة قبل الانطلاق.',
  bookHeadingNc: 'ارسم مسار درسك الأول.',
  bookBodyNc: 'اختر وقتاً، وسنرشدك في البقية — كما لو كنا نهتدي بالنجوم.',
  heroCaption: 'المسار مرسوم · درس الليلة، مهتدٍ بضوء النجوم',
  compassMotto: 'مهتدون بضوء النجوم، درساً بعد درس.',
  feature0Title: 'بوتيرة تناسب مسارك الخاص',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس مرسوم من حيث أنت فعلاً.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة تدريب حديثة مزدوجة التحكّم تحافظ على المسار بهدوء نيابة عنك.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا انحراف عن المسار وبلا تكلفة إضافية.',
  heroImageAlt: 'درس قيادة عند الغسق',
  aboutImageAlt: 'مدرّب يرشد متعلّم القيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
  menuOpenAria: 'فتح القائمة',
  menuCloseAria: 'إغلاق القائمة',
  markHero: 'الانطلاق',
  markStats: 'قراءات',
  markWhy: 'البوصلة',
  markPackages: 'المسارات',
  markAbout: 'الملّاح',
  markAreas: 'المنطقة',
  markReviews: 'سجلّ الرحلة',
  markGallery: 'لقطات',
  markFaq: 'ملاحظات',
  markBook: 'تحديد المسار',
  markContact: 'تواصل معنا',
};

const NOC: Record<Locale, NocStrings> = { en, he, ar };
export const nocStrings = (locale?: Locale): NocStrings => NOC[locale ?? 'en'] ?? NOC.en;
