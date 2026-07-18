// Gallery template — the museum-exhibition voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live
// here. EN output is self-contained; HE/AR are real translations. Overridden
// base keys carry a `Ga` suffix so the shared defaults stay available.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface GaStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  // Section eyebrows / headings — museum voice (override the base defaults).
  whyEyebrowGa: string;
  whyHeadingGa: string;
  packagesEyebrowGa: string;
  packagesHeadingGa: string;
  packagesSubGa: string;
  aboutEyebrowGa: string;
  areasEyebrowGa: string;
  areasHeadingGa: string;
  reviewsEyebrowGa: string;
  reviewsHeadingGa: string;
  galleryEyebrowGa: string;
  galleryHeadingGa: string;
  faqEyebrowGa: string;
  faqHeadingGa: string;
  bookHeadingGa: string;
  bookBodyGa: string;
  contactHeadingGa: string;
  hoursLabelGa: string;
  // "Patrons' choice" plate on the featured package.
  patronsChoice: string;
  // Museum wall-label vocabulary (real text beside each framed work).
  plateWord: string;       // "Plate" — builds "Plate II" etc.
  mediumLabel: string;     // small-caps "Medium" key
  plateMedium: string;     // value: "Dual-control lesson"
  yearLabel: string;       // small-caps "Year" key
  onView: string;          // value: "On view now"
  heroWorkTitle: string;
  aboutWorkTitle: string;
  heroCaption: string;
  // Why (the collection) — driving-real, museum-framed.
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

const en: GaStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Acquire this plan',
  whyEyebrowGa: 'The collection',
  whyHeadingGa: 'Lessons composed with a curator’s care.',
  packagesEyebrowGa: 'Acquisitions',
  packagesHeadingGa: 'Choose your acquisition.',
  packagesSubGa: 'Each plan plainly labelled — honest figures, nothing hidden behind the frame.',
  aboutEyebrowGa: 'The curator',
  areasEyebrowGa: 'The floor plan',
  areasHeadingGa: 'The districts on view.',
  reviewsEyebrowGa: 'Provenance',
  reviewsHeadingGa: 'In the words of our visitors.',
  galleryEyebrowGa: 'The exhibition',
  galleryHeadingGa: 'Selected works from the road.',
  faqEyebrowGa: 'Catalogue notes',
  faqHeadingGa: 'Notes for the visitor.',
  bookHeadingGa: 'A private view, just for you.',
  bookBodyGa: 'Choose a time and step in — we’ll walk the rest of the route with you.',
  contactHeadingGa: 'Visit & enquiries',
  hoursLabelGa: 'Gallery hours',
  patronsChoice: 'Patrons’ choice',
  plateWord: 'Plate',
  mediumLabel: 'Medium',
  plateMedium: 'Dual-control lesson',
  yearLabel: 'Year',
  onView: 'On view now',
  heroWorkTitle: 'The First Lesson',
  aboutWorkTitle: 'Portrait of the Instructor',
  heroCaption: 'Plate I · On location',
  feature0Title: 'Composed to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson framed around where you actually are.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Collected from home, work or college — at no extra charge.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: GaStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לרכישת המסלול',
  whyEyebrowGa: 'האוסף',
  whyHeadingGa: 'שיעורים שנרקחים בקפידה של אוצֵר.',
  packagesEyebrowGa: 'רכישות',
  packagesHeadingGa: 'בחרו את הרכישה שלכם.',
  packagesSubGa: 'כל מסלול מתויג בבירור — מספרים הוגנים, שום דבר לא מוסתר מאחורי המסגרת.',
  aboutEyebrowGa: 'האוצֵר',
  areasEyebrowGa: 'תוכנית האולם',
  areasHeadingGa: 'האזורים המוצגים.',
  reviewsEyebrowGa: 'עדויות',
  reviewsHeadingGa: 'במילים של המבקרים שלנו.',
  galleryEyebrowGa: 'התערוכה',
  galleryHeadingGa: 'עבודות נבחרות מהכביש.',
  faqEyebrowGa: 'הערות קטלוג',
  faqHeadingGa: 'הערות למבקר.',
  bookHeadingGa: 'תצוגה פרטית, רק בשבילכם.',
  bookBodyGa: 'בוחרים זמן ונכנסים — את שאר המסלול נעבור יחד אתכם.',
  contactHeadingGa: 'ביקור ופניות',
  hoursLabelGa: 'שעות הגלריה',
  patronsChoice: 'בחירת האספנים',
  plateWord: 'לוח',
  mediumLabel: 'טכניקה',
  plateMedium: 'שיעור בדוושות כפולות',
  yearLabel: 'שנה',
  onView: 'מוצג עכשיו',
  heroWorkTitle: 'השיעור הראשון',
  aboutWorkTitle: 'דיוקן המורה',
  heroCaption: 'לוח I · בשטח',
  feature0Title: 'מותאם לקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור ממוסגר סביב הנקודה שבה אתם באמת נמצאים.',
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

const ar: GaStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'اقتنِ هذه الباقة',
  whyEyebrowGa: 'المجموعة',
  whyHeadingGa: 'دروس مُنسّقة بعناية أمين المعرض.',
  packagesEyebrowGa: 'المقتنيات',
  packagesHeadingGa: 'اختر مقتناك.',
  packagesSubGa: 'كل باقة موسومة بوضوح — أرقام صادقة، لا شيء مخفي خلف الإطار.',
  aboutEyebrowGa: 'أمين المعرض',
  areasEyebrowGa: 'مخطط القاعة',
  areasHeadingGa: 'المناطق المعروضة.',
  reviewsEyebrowGa: 'شهادات',
  reviewsHeadingGa: 'بكلمات زوّارنا.',
  galleryEyebrowGa: 'المعرض',
  galleryHeadingGa: 'أعمال مختارة من الطريق.',
  faqEyebrowGa: 'ملاحظات الكتالوج',
  faqHeadingGa: 'ملاحظات للزائر.',
  bookHeadingGa: 'عرض خاص، لك وحدك.',
  bookBodyGa: 'اختر وقتاً وادخل — وسنسير بقية الطريق معك.',
  contactHeadingGa: 'الزيارة والاستفسارات',
  hoursLabelGa: 'ساعات المعرض',
  patronsChoice: 'اختيار الرعاة',
  plateWord: 'لوحة',
  mediumLabel: 'الخامة',
  plateMedium: 'درس مزدوج التحكّم',
  yearLabel: 'السنة',
  onView: 'معروض الآن',
  heroWorkTitle: 'الدرس الأول',
  aboutWorkTitle: 'صورة المدرّب',
  heroCaption: 'اللوحة I · في الموقع',
  feature0Title: 'مُصمّم على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس مُؤطّر حول حيث أنت فعلاً.',
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

const GA: Record<Locale, GaStrings> = { en, he, ar };
export const gaStrings = (locale?: Locale): GaStrings => GA[locale ?? 'en'] ?? GA.en;
