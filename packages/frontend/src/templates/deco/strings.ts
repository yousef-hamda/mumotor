// Deco template — the golden-age-of-motoring voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here. EN output is byte-stable in spirit with the other
// templates' pattern; HE/AR are real, hand-written translations (each locale
// spreads its OWN T.<locale>, never T.en into he/ar).
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface DecoStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowDc: string;
  whyHeadingDc: string;
  packagesHeadingDc: string;
  packagesSubDc: string;
  areasEyebrowDc: string;
  areasHeadingDc: string;
  reviewsHeadingDc: string;
  galleryHeadingDc: string;
  faqHeadingDc: string;
  bookHeadingDc: string;
  bookBodyDc: string;
  // Ornament / print-craft flavour copy (decorative, but real text).
  heroCaption: string;
  heroMotto: string;
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
  // The elevator floor-dial (signature) — localized "floor" names, one per
  // canonical SECTION_IDS entry, plus the "Floor {n}" readout template.
  dialHero: string;
  dialStats: string;
  dialPackages: string;
  dialAbout: string;
  dialAreas: string;
  dialReviews: string;
  dialFaq: string;
  dialBook: string;
  dialContact: string;
  dialFloorLabel: string;
}

const en: DecoStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Reserve this passage',
  whyEyebrowDc: 'The motoring life',
  whyHeadingDc: 'Arrive in style. Drive with confidence.',
  packagesHeadingDc: 'Reserve your passage.',
  packagesSubDc: 'Fares set plainly — no hidden surcharges, just first-class instruction.',
  areasEyebrowDc: 'Touring routes',
  areasHeadingDc: 'Where the marque travels.',
  reviewsHeadingDc: 'Praise from the road.',
  galleryHeadingDc: 'Scenes from the boulevard.',
  faqHeadingDc: 'Questions, answered with poise.',
  bookHeadingDc: 'Board your first lesson.',
  bookBodyDc: 'Choose a time, and step into the golden age of the open road.',
  heroCaption: 'A first-class education behind the wheel',
  heroMotto: 'Arrive in style, since the golden age of the road',
  feature0Title: 'Paced like a private chauffeur',
  feature0Body: 'One-to-one instruction, never doubled-up — every lesson tailored to your tempo.',
  feature1Title: 'Dual-control, fully insured',
  feature1Body: 'A meticulously kept car that carries the worry, so you don’t have to.',
  feature2Title: 'Door-to-door collection',
  feature2Body: 'Collected from home, work or college — exactly like a private car service.',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Instructor with a learner driver',
  mainNavAria: 'Main navigation',
  goToTopAria: 'Go to top',
  publishNote: 'Available once your site is published',
  menuOpenAria: 'Open menu',
  menuCloseAria: 'Close menu',
  dialHero: 'Arrival',
  dialStats: 'The Record',
  dialPackages: 'The Boutique',
  dialAbout: 'The Salon',
  dialAreas: 'Touring Routes',
  dialReviews: 'Praise',
  dialFaq: 'Enquiries',
  dialBook: 'Departures',
  dialContact: 'The Concierge',
  dialFloorLabel: 'Floor {n}',
};

const he: DecoStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'לשמירת מקום זה',
  whyEyebrowDc: 'עידן הזהב של הכביש',
  whyHeadingDc: 'להגיע באלגנטיות. לנהוג בביטחון.',
  packagesHeadingDc: 'שריינו את המסלול שלכם.',
  packagesSubDc: 'מחירים גלויים — בלי תוספות נסתרות, רק הדרכה מהמעלה הראשונה.',
  areasEyebrowDc: 'מסלולי סיור',
  areasHeadingDc: 'האזורים שאליהם אנו מגיעים.',
  reviewsHeadingDc: 'שבחים מהכביש.',
  galleryHeadingDc: 'תמונות מהשדרה.',
  faqHeadingDc: 'שאלות, במענה אלגנטי.',
  bookHeadingDc: 'עלו לשיעור הראשון שלכם.',
  bookBodyDc: 'בחרו זמן, וצאו אל עידן הזהב של הכביש הפתוח.',
  heroCaption: 'הכשרה מהמעלה הראשונה מאחורי ההגה',
  heroMotto: 'מגיעים באלגנטיות, מאז עידן הזהב של הכביש',
  feature0Title: 'בקצב של נהג פרטי',
  feature0Body: 'הדרכה אישית, אף פעם לא בזוגות — כל שיעור מותאם לקצב שלכם.',
  feature1Title: 'דוושות כפולות, ביטוח מלא',
  feature1Body: 'רכב מטופח לפרטים הקטנים שנושא בדאגה במקומכם.',
  feature2Title: 'איסוף עד הבית',
  feature2Body: 'איסוף מהבית, מהעבודה או מהלימודים — ממש כמו שירות נהג פרטי.',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'מורה נהיגה עם תלמיד',
  mainNavAria: 'ניווט ראשי',
  goToTopAria: 'חזרה לראש הדף',
  publishNote: 'יהיה זמין לאחר פרסום האתר',
  menuOpenAria: 'פתיחת התפריט',
  menuCloseAria: 'סגירת התפריט',
  dialHero: 'הגעה',
  dialStats: 'הישגים',
  dialPackages: 'הבוטיק',
  dialAbout: 'הסלון',
  dialAreas: 'מסלולי סיור',
  dialReviews: 'שבחים',
  dialFaq: 'בירורים',
  dialBook: 'יציאות',
  dialContact: 'הקונסיירז’',
  dialFloorLabel: 'קומה {n}',
};

const ar: DecoStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'احجز هذا المسار',
  whyEyebrowDc: 'العصر الذهبي للطريق',
  whyHeadingDc: 'وصول بأناقة. قيادة بثقة.',
  packagesHeadingDc: 'احجز مكانك.',
  packagesSubDc: 'أسعار واضحة — بلا رسوم خفية، فقط تدريب من الطراز الأول.',
  areasEyebrowDc: 'مسارات الجولات',
  areasHeadingDc: 'المناطق التي نصل إليها.',
  reviewsHeadingDc: 'إشادات من الطريق.',
  galleryHeadingDc: 'مشاهد من الجادة.',
  faqHeadingDc: 'أسئلة، بإجابات أنيقة.',
  bookHeadingDc: 'اصعد إلى درسك الأول.',
  bookBodyDc: 'اختر وقتاً، وادخل إلى العصر الذهبي للطريق المفتوح.',
  heroCaption: 'تدريب من الطراز الأول خلف المقود',
  heroMotto: 'وصول بأناقة، منذ العصر الذهبي للطريق',
  feature0Title: 'بوتيرة سائق خاص',
  feature0Body: 'تدريب فردي، بلا دروس مزدوجة — كل درس مصمّم على إيقاعك.',
  feature1Title: 'تحكّم مزدوج وتأمين كامل',
  feature1Body: 'سيارة معتنى بها بدقة تتحمّل القلق نيابة عنك.',
  feature2Title: 'اصطحاب من الباب إلى الباب',
  feature2Body: 'نصطحبك من المنزل أو العمل أو الجامعة — تماماً كخدمة سيارة خاصة.',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'مدرّب مع متعلّم قيادة',
  mainNavAria: 'التنقل الرئيسي',
  goToTopAria: 'العودة إلى الأعلى',
  publishNote: 'متاح بعد نشر موقعك',
  menuOpenAria: 'فتح القائمة',
  menuCloseAria: 'إغلاق القائمة',
  dialHero: 'الوصول',
  dialStats: 'الإنجازات',
  dialPackages: 'البوتيك',
  dialAbout: 'الصالون',
  dialAreas: 'مسارات الجولات',
  dialReviews: 'الإشادات',
  dialFaq: 'الاستفسارات',
  dialBook: 'المغادرة',
  dialContact: 'الكونسيرج',
  dialFloorLabel: 'الطابق {n}',
};

const DECO: Record<Locale, DecoStrings> = { en, he, ar };
export const decoStrings = (locale?: Locale): DecoStrings => DECO[locale ?? 'en'] ?? DECO.en;
