// Circuit template — the motorsport pit-wall voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here. Overridden base keys carry a `Ci` suffix.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface CiStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowCi: string;
  whyHeadingCi: string;
  packagesHeadingCi: string;
  packagesSubCi: string;
  areasEyebrowCi: string;
  areasHeadingCi: string;
  reviewsHeadingCi: string;
  galleryHeadingCi: string;
  faqHeadingCi: string;
  bookHeadingCi: string;
  bookBodyCi: string;
  feature0Title: string;
  feature0Body: string;
  feature1Title: string;
  feature1Body: string;
  feature2Title: string;
  feature2Body: string;
  // Timing-tower + broadcast labels (decorative telemetry).
  lapLabel: string;
  sector1: string;
  sector2: string;
  sector3: string;
  liveLabel: string;
  heroCaption: string;
  gridLabel: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  mainNavAria: string;
  goToTopAria: string;
  publishNote: string;
}

const en: CiStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Put me on the grid',
  whyEyebrowCi: 'Pit wall',
  whyHeadingCi: 'A race weekend, one lesson at a time.',
  packagesHeadingCi: 'Choose your strategy.',
  packagesSubCi: 'Clear laps, honest prices — no hidden pit stops.',
  areasEyebrowCi: 'Sectors',
  areasHeadingCi: 'The zones we cover.',
  reviewsHeadingCi: 'From the drivers.',
  galleryHeadingCi: 'Trackside.',
  faqHeadingCi: 'Race control.',
  bookHeadingCi: 'Lights out when you are.',
  bookBodyCi: 'Pick a time and take your place on the grid — we’ll line up the rest with you.',
  feature0Title: 'Every lesson, dialled in',
  feature0Body: 'One-to-one coaching paced to you — never doubled-up, never rushed. We fix the exact thing holding you back.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A modern dual-control car that quietly does the worrying for you while you learn the line to the test centre.',
  feature2Title: 'Door-to-door pickup',
  feature2Body: 'Picked up from home, work or college — at no extra cost. Your grid slot comes to you.',
  lapLabel: 'Live lap',
  sector1: 'S1',
  sector2: 'S2',
  sector3: 'S3',
  liveLabel: 'Live',
  heroCaption: 'Start / finish · live timing',
  gridLabel: 'Lights out',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
};

const he: CiStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'שריינו לי מקום ברשת',
  whyEyebrowCi: 'קיר הפיטים',
  whyHeadingCi: 'סוף שבוע של מרוץ, שיעור אחר שיעור.',
  packagesHeadingCi: 'בוחרים אסטרטגיה.',
  packagesSubCi: 'הקפות ברורות, מחירים הוגנים — בלי עצירות פיט נסתרות.',
  areasEyebrowCi: 'מקטעים',
  areasHeadingCi: 'האזורים שאנחנו מכסים.',
  reviewsHeadingCi: 'מפי הנהגים.',
  galleryHeadingCi: 'ליד המסלול.',
  faqHeadingCi: 'חדר בקרה.',
  bookHeadingCi: 'כבו את האורות כשתהיו מוכנים.',
  bookBodyCi: 'בוחרים זמן ותופסים מקום ברשת — את שאר ההיערכות נסדר יחד אתכם.',
  feature0Title: 'כל שיעור, מכוון בדיוק אליכם',
  feature0Body: 'ליווי אחד על אחד בקצב שלכם — אף פעם לא בזוגות, בלי לחץ. מתקנים בדיוק את מה שמעכב אתכם.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב לימוד מודרני עם דוושות כפולות שדואג בשקט במקומכם בזמן שאתם לומדים את הקו עד לטסט.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — בלי תוספת מחיר. המקום שלכם ברשת מגיע אליכם.',
  lapLabel: 'הקפה חיה',
  sector1: 'מ1',
  sector2: 'מ2',
  sector3: 'מ3',
  liveLabel: 'חי',
  heroCaption: 'זינוק / סיום · תזמון חי',
  gridLabel: 'כבו אורות',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
};

const ar: CiStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'ضعني على خط الانطلاق',
  whyEyebrowCi: 'جدار الحظيرة',
  whyHeadingCi: 'عطلة سباق، درساً تلو الآخر.',
  packagesHeadingCi: 'اختر استراتيجيتك.',
  packagesSubCi: 'لفّات واضحة وأسعار صادقة — بلا توقفات خفية.',
  areasEyebrowCi: 'القطاعات',
  areasHeadingCi: 'المناطق التي نغطيها.',
  reviewsHeadingCi: 'من السائقين.',
  galleryHeadingCi: 'بجانب المضمار.',
  faqHeadingCi: 'غرفة التحكّم.',
  bookHeadingCi: 'انطلق حين تكون جاهزاً.',
  bookBodyCi: 'اختر وقتاً وخذ مكانك على خط الانطلاق — وسنرتّب الباقي معك.',
  feature0Title: 'كل درس مضبوط تماماً عليك',
  feature0Body: 'تدريب فردي بوتيرتك — بلا دروس مزدوجة وبلا استعجال. نصلح بالضبط ما يعيقك.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة حديثة مزدوجة التحكّم تتولّى القلق عنك بهدوء بينما تتعلّم الخط حتى مركز الاختبار.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — بلا تكلفة إضافية. مكانك على خط الانطلاق يأتي إليك.',
  lapLabel: 'لفة مباشرة',
  sector1: 'ق1',
  sector2: 'ق2',
  sector3: 'ق3',
  liveLabel: 'مباشر',
  heroCaption: 'الانطلاق / النهاية · توقيت مباشر',
  gridLabel: 'إطفاء الأضواء',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
};

const CI: Record<Locale, CiStrings> = { en, he, ar };
export const ciStrings = (locale?: Locale): CiStrings => CI[locale ?? 'en'] ?? CI.en;
