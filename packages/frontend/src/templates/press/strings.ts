// Press template — the letterpress-prospectus voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here. EN output is byte-stable; HE/AR are real translations.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface PsStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowPs: string;
  whyHeadingPs: string;
  packagesHeadingPs: string;
  packagesSubPs: string;
  areasEyebrowPs: string;
  areasHeadingPs: string;
  reviewsHeadingPs: string;
  galleryHeadingPs: string;
  faqHeadingPs: string;
  bookHeadingPs: string;
  bookBodyPs: string;
  // Ornament / print-craft labels (decorative, but real text).
  heroCaption: string;
  sealMotto: string;
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

const en: PsStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Reserve this plan',
  whyEyebrowPs: 'The imprint',
  whyHeadingPs: 'Set in good type, run with care.',
  packagesHeadingPs: 'The price list, plainly set.',
  packagesSubPs: 'Honest figures, pressed once — nothing hidden in the fine print.',
  areasEyebrowPs: 'Coverage',
  areasHeadingPs: 'The districts on our plate.',
  reviewsHeadingPs: 'Set in the words of learners.',
  galleryHeadingPs: 'Impressions from the road.',
  faqHeadingPs: 'Notes set in the margin.',
  bookHeadingPs: 'Reserve your first lesson.',
  bookBodyPs: 'Choose a time and we’ll set the rest of it in order for you.',
  heroCaption: 'Plate I · A driving lesson, pressed to paper',
  sealMotto: 'Bound & pressed by hand',
  feature0Title: 'Composed to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson set from where you actually are.',
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

const he: PsStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לשמירת המסלול',
  whyEyebrowPs: 'הטביעה',
  whyHeadingPs: 'מסודר באות טובה, מודפס בקפידה.',
  packagesHeadingPs: 'מחירון, מסודר בבירור.',
  packagesSubPs: 'מספרים הוגנים, מוטבעים פעם אחת — שום דבר לא מוסתר באותיות הקטנות.',
  areasEyebrowPs: 'אזורי כיסוי',
  areasHeadingPs: 'האזורים שעל הלוח שלנו.',
  reviewsHeadingPs: 'מסודר במילים של התלמידים.',
  galleryHeadingPs: 'רשמים מהכביש.',
  faqHeadingPs: 'הערות בשוליים.',
  bookHeadingPs: 'שמרו את השיעור הראשון שלכם.',
  bookBodyPs: 'בוחרים זמן, ואת כל השאר נסדר עבורכם.',
  heroCaption: 'לוח I · שיעור נהיגה, מוטבע על נייר',
  sealMotto: 'כרוך ומוטבע ביד',
  feature0Title: 'מסודר בקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מסודר מהנקודה שבה אתם באמת נמצאים.',
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

const ar: PsStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذه الباقة',
  whyEyebrowPs: 'الطبعة',
  whyHeadingPs: 'مصفوف بحروف جيدة، ومطبوع بعناية.',
  packagesHeadingPs: 'قائمة الأسعار، مصفوفة بوضوح.',
  packagesSubPs: 'أرقام صادقة، مطبوعة مرة واحدة — لا شيء مخفي في الحروف الصغيرة.',
  areasEyebrowPs: 'التغطية',
  areasHeadingPs: 'المناطق على لوحتنا.',
  reviewsHeadingPs: 'مصفوف بكلمات المتعلّمين.',
  galleryHeadingPs: 'انطباعات من الطريق.',
  faqHeadingPs: 'ملاحظات على الهامش.',
  bookHeadingPs: 'احجز درسك الأول.',
  bookBodyPs: 'اختر وقتاً وسنرتّب لك بقية التفاصيل.',
  heroCaption: 'اللوحة I · درس قيادة، مطبوع على ورق',
  sealMotto: 'مجلّد ومطبوع باليد',
  feature0Title: 'مصفوف على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس مصفوف من حيث أنت فعلاً.',
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

const PS: Record<Locale, PsStrings> = { en, he, ar };
export const psStrings = (locale?: Locale): PsStrings => PS[locale ?? 'en'] ?? PS.en;
