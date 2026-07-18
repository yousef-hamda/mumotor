// Bezel template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
// Voice: precision instruments — measured, exact, engineered. Never opulent.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface BzStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowBz: string;
  whyHeadingBz: string;
  packagesHeadingBz: string;
  packagesSubBz: string;
  areasEyebrowBz: string;
  areasHeadingBz: string;
  reviewsHeadingBz: string;
  galleryHeadingBz: string;
  faqHeadingBz: string;
  bookHeadingBz: string;
  bookBodyBz: string;
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

const en: BzStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Book this plan',
  whyEyebrowBz: 'Built to spec',
  whyHeadingBz: 'Every lesson, measured.',
  packagesHeadingBz: 'Read the numbers.',
  packagesSubBz: 'Exact prices, no hidden fees, nothing rounded up.',
  areasEyebrowBz: 'Coverage',
  areasHeadingBz: 'Where we operate.',
  reviewsHeadingBz: 'Verified by learners.',
  galleryHeadingBz: 'From the driver’s seat.',
  faqHeadingBz: 'Specifications.',
  bookHeadingBz: 'Set your first lesson.',
  bookBodyBz: 'Pick a time that fits your week. We handle the rest.',
  feature0Title: 'Calibrated to you',
  feature0Body: 'One-to-one, never doubled-up. Patient, steady guidance at exactly your pace.',
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

const he: BzStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'להזמנת המסלול',
  whyEyebrowBz: 'בנוי לפי מפרט',
  whyHeadingBz: 'כל שיעור נמדד.',
  packagesHeadingBz: 'המספרים לפניכם.',
  packagesSubBz: 'מחירים מדויקים, בלי עלויות נסתרות, בלי עיגולים כלפי מעלה.',
  areasEyebrowBz: 'אזורי שירות',
  areasHeadingBz: 'איפה אנחנו פועלים.',
  reviewsHeadingBz: 'מאומת על ידי תלמידים.',
  galleryHeadingBz: 'מהמושב של הנהג.',
  faqHeadingBz: 'מפרט טכני.',
  bookHeadingBz: 'קובעים את השיעור הראשון.',
  bookBodyBz: 'בוחרים זמן שמתאים לשבוע שלכם. את השאר נעשה אנחנו.',
  feature0Title: 'מכוילים אליך',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. הדרכה סבלנית ויציבה בקצב שלך בדיוק.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומך.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: BzStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowBz: 'مصنوع وفق المواصفات',
  whyHeadingBz: 'كل درس مقاس بدقّة.',
  packagesHeadingBz: 'اقرأ الأرقام.',
  packagesSubBz: 'أسعار دقيقة، بلا رسوم خفية، وبلا تقريب للأعلى.',
  areasEyebrowBz: 'مناطق الخدمة',
  areasHeadingBz: 'أين نعمل.',
  reviewsHeadingBz: 'موثّق من المتعلّمين.',
  galleryHeadingBz: 'من مقعد السائق.',
  faqHeadingBz: 'المواصفات.',
  bookHeadingBz: 'حدّد درسك الأول.',
  bookBodyBz: 'اختر وقتاً يناسب أسبوعك، ونحن نتكفّل بالباقي.',
  feature0Title: 'مضبوط عليك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. توجيه صبور وثابت بوتيرتك تماماً.',
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

const BZ: Record<Locale, BzStrings> = { en, he, ar };
export const bzStrings = (locale?: Locale): BzStrings => BZ[locale ?? 'en'] ?? BZ.en;
