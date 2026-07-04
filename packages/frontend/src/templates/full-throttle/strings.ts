// Full Throttle template — loud, punchy voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface FtStrings extends TemplateStrings {
  navPackages: string;
  bookNow: string;
  backToTop: string;
  openMenu: string;
  closeMenu: string;
  heroTag: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  packagesHeadingFt: string;
  packagesSubFt: string;
  minSuffix: string;
  lessonSingular: string;
  lessonsPlural: string;
  selectedLabel: string;
  bookThisPackage: string;
  areasHeadingFt: string;
  areasSubFt: string;
  reviewsHeadingFt: string;
  starsAria: string; // {n}
  galleryHeadingFt: string;
  gallerySubFt: string;
  faqHeadingFt: string;
  bookHeadingFt: string;
  bookBodyFt: string;
  emailUs: string;
  hoursLabelFt: string;
  footerRights: string;
}

const en: FtStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookNow: 'Book Now',
  backToTop: 'Back to top',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  heroTag: '96% Pass Rate',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Lesson in progress',
  packagesHeadingFt: 'Lesson Packages',
  packagesSubFt: 'Transparent pricing. No hidden fees. Change your mind any time.',
  minSuffix: '-min',
  lessonSingular: ' lesson',
  lessonsPlural: ' lessons',
  selectedLabel: 'Selected ✓',
  bookThisPackage: 'Book This Package',
  areasHeadingFt: 'Areas Covered',
  areasSubFt: 'Pick-up and drop-off across all these areas — at no extra cost.',
  reviewsHeadingFt: 'What Learners Say',
  starsAria: '{n} out of 5 stars',
  galleryHeadingFt: 'In The Driving Seat',
  gallerySubFt: 'A look at lessons, test passes, and the road ahead.',
  faqHeadingFt: 'Frequently Asked',
  bookHeadingFt: 'Ready to Hit the Road?',
  bookBodyFt: 'No account needed — tap below and lock in your first lesson.',
  emailUs: 'Email us',
  hoursLabelFt: 'Opening Hours',
  footerRights: 'All rights reserved.',
};

const he: FtStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookNow: 'להזמנה עכשיו',
  backToTop: 'חזרה למעלה',
  openMenu: 'פתיחת תפריט',
  closeMenu: 'סגירת תפריט',
  heroTag: '96% מעברים בטסט',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'שיעור בעיצומו',
  packagesHeadingFt: 'חבילות שיעורי נהיגה',
  packagesSubFt: 'מחירים שקופים. בלי עלויות נסתרות. אפשר להתחרט בכל רגע.',
  minSuffix: ' דק׳',
  lessonSingular: ' שיעור',
  lessonsPlural: ' שיעורים',
  selectedLabel: 'נבחר ✓',
  bookThisPackage: 'להזמנת החבילה',
  areasHeadingFt: 'אזורי שירות',
  areasSubFt: 'איסוף והורדה בכל האזורים האלה — בלי תוספת מחיר.',
  reviewsHeadingFt: 'מה התלמידים אומרים',
  starsAria: '{n} מתוך 5 כוכבים',
  galleryHeadingFt: 'מאחורי ההגה',
  gallerySubFt: 'הצצה לשיעורים, לטסטים שעברו ולדרך שלפנינו.',
  faqHeadingFt: 'שאלות נפוצות',
  bookHeadingFt: 'מוכנים לצאת לדרך?',
  bookBodyFt: 'בלי חשבון ובלי סיבוכים — לוחצים למטה וסוגרים שיעור נהיגה ראשון.',
  emailUs: 'שלחו לנו מייל',
  hoursLabelFt: 'שעות פעילות',
  footerRights: 'כל הזכויות שמורות.',
};

const ar: FtStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookNow: 'احجز الآن',
  backToTop: 'العودة للأعلى',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
  heroTag: 'نسبة نجاح 96% في اختبار القيادة',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'درس جارٍ',
  packagesHeadingFt: 'باقات دروس القيادة',
  packagesSubFt: 'أسعار شفافة. بلا رسوم خفية. غيّر رأيك في أي وقت.',
  minSuffix: ' د',
  lessonSingular: ' درس',
  lessonsPlural: ' دروس',
  selectedLabel: 'تم الاختيار ✓',
  bookThisPackage: 'احجز هذه الباقة',
  areasHeadingFt: 'المناطق المشمولة',
  areasSubFt: 'اصطحاب وتوصيل في كل هذه المناطق — بلا تكلفة إضافية.',
  reviewsHeadingFt: 'ماذا يقول المتعلّمون',
  starsAria: '{n} من 5 نجوم',
  galleryHeadingFt: 'خلف المقود',
  gallerySubFt: 'لمحة عن الدروس والنجاح في الاختبار والطريق أمامك.',
  faqHeadingFt: 'أسئلة شائعة',
  bookHeadingFt: 'جاهز للانطلاق؟',
  bookBodyFt: 'لا حاجة لحساب — اضغط بالأسفل واحجز درس القيادة الأول فوراً.',
  emailUs: 'راسلنا',
  hoursLabelFt: 'ساعات العمل',
  footerRights: 'جميع الحقوق محفوظة.',
};

const FT: Record<Locale, FtStrings> = { en, he, ar };
export const ftStrings = (locale?: Locale): FtStrings => FT[locale ?? 'en'] ?? FT.en;
