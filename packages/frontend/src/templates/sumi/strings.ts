// Sumi template — the sumi-e (ink-wash) voice on top of the shared trilingual
// vocabulary. Only keys where this template's copy differs (or is unique) live
// here. EN output is byte-stable; HE/AR are real translations.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface SuStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  bookThisPlan: string;
  whyEyebrowSu: string;
  whyHeadingSu: string;
  packagesHeadingSu: string;
  packagesSubSu: string;
  areasEyebrowSu: string;
  areasHeadingSu: string;
  reviewsHeadingSu: string;
  galleryHeadingSu: string;
  faqHeadingSu: string;
  bookHeadingSu: string;
  bookBodySu: string;
  // Brush-craft labels (decorative, but real text).
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

const en: SuStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book now',
  bookThisPlan: 'Begin here',
  whyEyebrowSu: 'The practice',
  whyHeadingSu: 'A calm hand, one line at a time.',
  packagesHeadingSu: 'Simple strokes, honest ink.',
  packagesSubSu: 'Clear prices — nothing hidden between the lines.',
  areasEyebrowSu: 'Coverage',
  areasHeadingSu: 'The ground we cover.',
  reviewsHeadingSu: 'In the words of learners.',
  galleryHeadingSu: 'Impressions from the road.',
  faqHeadingSu: 'Quiet questions, clear answers.',
  bookHeadingSu: 'Begin with a single stroke.',
  bookBodySu: 'Choose a time, and we’ll draw the rest of the way together.',
  heroCaption: 'Ink on washi · a lesson, unhurried',
  sealMotto: 'Brushed by hand',
  feature0Title: 'Drawn to your pace',
  feature0Body: 'One-to-one, never doubled-up. Every lesson begins from where you actually are.',
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

const he: SuStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה',
  bookThisPlan: 'מתחילים כאן',
  whyEyebrowSu: 'הדרך',
  whyHeadingSu: 'יד רגועה, קו אחד בכל פעם.',
  packagesHeadingSu: 'קווים פשוטים, דיו כן.',
  packagesSubSu: 'מחירים ברורים — שום דבר לא מוסתר בין השורות.',
  areasEyebrowSu: 'אזורי כיסוי',
  areasHeadingSu: 'השטח שאנחנו מכסים.',
  reviewsHeadingSu: 'במילים של התלמידים.',
  galleryHeadingSu: 'רשמים מהכביש.',
  faqHeadingSu: 'שאלות שקטות, תשובות ברורות.',
  bookHeadingSu: 'מתחילים במשיכת מכחול אחת.',
  bookBodySu: 'בוחרים זמן, ואת שאר הדרך נשרטט יחד.',
  heroCaption: 'דיו על נייר וואשי · שיעור, בלי למהר',
  sealMotto: 'משוך ביד',
  feature0Title: 'משורטט בקצב שלכם',
  feature0Body: 'אחד על אחד, אף פעם לא בזוגות. כל שיעור מתחיל מהנקודה שבה אתם באמת נמצאים.',
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

const ar: SuStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  bookThisPlan: 'ابدأ هنا',
  whyEyebrowSu: 'الطريق',
  whyHeadingSu: 'يدٌ هادئة، خطٌّ في كل مرة.',
  packagesHeadingSu: 'خطوط بسيطة، حبرٌ صادق.',
  packagesSubSu: 'أسعار واضحة — لا شيء مخفيّ بين السطور.',
  areasEyebrowSu: 'التغطية',
  areasHeadingSu: 'الأرض التي نغطيها.',
  reviewsHeadingSu: 'بكلمات المتعلّمين.',
  galleryHeadingSu: 'انطباعات من الطريق.',
  faqHeadingSu: 'أسئلة هادئة، إجابات واضحة.',
  bookHeadingSu: 'ابدأ بمسحة مِحبرة واحدة.',
  bookBodySu: 'اختر وقتاً وسنرسم بقية الطريق معاً.',
  heroCaption: 'حبر على ورق واشي · درسٌ بلا عجلة',
  sealMotto: 'مرسومٌ باليد',
  feature0Title: 'مرسومٌ على وتيرتك',
  feature0Body: 'فردي دائماً، بلا دروس مزدوجة. كل درس يبدأ من حيث أنت فعلاً.',
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

const SU: Record<Locale, SuStrings> = { en, he, ar };
export const suStrings = (locale?: Locale): SuStrings => SU[locale ?? 'en'] ?? SU.en;
