// Open Road template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface OrStrings extends TemplateStrings {
  navPackages: string;
  bookCtaNav: string;
  backToTop: string;
  mainNavAria: string;
  openMenu: string;
  closeMenu: string;
  heroImageAlt: string;
  packagesHeadingOr: string;
  packagesSubOr: string;
  minLessonOne: string;
  minLessonMany: string;
  selectedLabel: string;
  packageCtaOr: string;
  aboutImageAlt: string;
  areasHeadingOr: string;
  areasSubOr: string;
  starsAria: string; // {n}
  reviewsHeadingOr: string;
  galleryHeadingOr: string;
  gallerySubOr: string;
  faqHeadingOr: string;
  bookHeadingOr: string;
  bookBodyOr: string;
  bookUnpublishedTitle: string;
  emailUs: string;
  hoursHeadingOr: string;
  allRightsReserved: string;
}

const en: OrStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookCtaNav: 'Book a Lesson',
  backToTop: 'Back to top',
  mainNavAria: 'Main navigation',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  heroImageAlt: 'Driving lesson',
  packagesHeadingOr: 'Lesson Packages',
  packagesSubOr: 'Transparent pricing. No hidden fees. Change your mind any time.',
  minLessonOne: '-min lesson',
  minLessonMany: '-min lessons',
  selectedLabel: 'Selected ✓',
  packageCtaOr: 'Book This Package',
  aboutImageAlt: 'Lesson in progress',
  areasHeadingOr: 'Areas Covered',
  areasSubOr: 'Pick-up and drop-off across all these areas — at no extra cost.',
  starsAria: '{n} out of 5 stars',
  reviewsHeadingOr: 'What Learners Say',
  galleryHeadingOr: 'On the Road',
  gallerySubOr: 'Snapshots from lessons, test days, and big wins.',
  faqHeadingOr: 'Frequently Asked Questions',
  bookHeadingOr: 'Ready to Hit the Road?',
  bookBodyOr: "Book your first lesson and let's get you driving — confidently and at your own pace.",
  bookUnpublishedTitle: 'Available once your site is published',
  emailUs: 'Email us',
  hoursHeadingOr: 'Opening Hours',
  allRightsReserved: 'All rights reserved.',
};

const he: OrStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookCtaNav: 'הזמנת שיעור',
  backToTop: 'חזרה למעלה',
  mainNavAria: 'ניווט ראשי',
  openMenu: 'פתיחת תפריט',
  closeMenu: 'סגירת תפריט',
  heroImageAlt: 'שיעור נהיגה',
  packagesHeadingOr: 'חבילות שיעורים',
  packagesSubOr: 'מחירים שקופים. בלי עלויות נסתרות. אפשר להתחרט בכל רגע.',
  minLessonOne: ' דק׳ לשיעור',
  minLessonMany: ' דק׳ לשיעור',
  selectedLabel: 'נבחר ✓',
  packageCtaOr: 'להזמנת החבילה',
  aboutImageAlt: 'שיעור נהיגה בעיצומו',
  areasHeadingOr: 'אזורי שירות',
  areasSubOr: 'איסוף והחזרה בכל האזורים האלה — בלי תוספת מחיר.',
  starsAria: '{n} מתוך 5 כוכבים',
  reviewsHeadingOr: 'מה התלמידים אומרים',
  galleryHeadingOr: 'על הכביש',
  gallerySubOr: 'רגעים משיעורים, ימי טסט והצלחות גדולות.',
  faqHeadingOr: 'שאלות נפוצות',
  bookHeadingOr: 'מוכנים לצאת לדרך?',
  bookBodyOr: 'מזמינים שיעור ראשון ומתחילים לנהוג — בביטחון ובקצב שלכם.',
  bookUnpublishedTitle: 'זמין לאחר פרסום האתר',
  emailUs: 'שלחו לנו מייל',
  hoursHeadingOr: 'שעות פעילות',
  allRightsReserved: 'כל הזכויות שמורות.',
};

const ar: OrStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookCtaNav: 'احجز درساً',
  backToTop: 'العودة للأعلى',
  mainNavAria: 'التنقل الرئيسي',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
  heroImageAlt: 'درس قيادة',
  packagesHeadingOr: 'باقات الدروس',
  packagesSubOr: 'أسعار شفافة. بلا رسوم خفية. ويمكنك تغيير رأيك في أي وقت.',
  minLessonOne: ' دقيقة للدرس',
  minLessonMany: ' دقيقة للدرس',
  selectedLabel: 'تم الاختيار ✓',
  packageCtaOr: 'احجز هذه الباقة',
  aboutImageAlt: 'درس قيادة جارٍ',
  areasHeadingOr: 'المناطق التي نغطيها',
  areasSubOr: 'اصطحاب وتوصيل في كل هذه المناطق — بلا تكلفة إضافية.',
  starsAria: '{n} من 5 نجوم',
  reviewsHeadingOr: 'ماذا يقول المتعلّمون',
  galleryHeadingOr: 'على الطريق',
  gallerySubOr: 'لقطات من الدروس وأيام اختبار القيادة والنجاحات الكبيرة.',
  faqHeadingOr: 'الأسئلة الشائعة',
  bookHeadingOr: 'جاهز للانطلاق على الطريق؟',
  bookBodyOr: 'احجز درسك الأول ولننطلق بالقيادة — بثقة وبوتيرتك الخاصة.',
  bookUnpublishedTitle: 'متاح بعد نشر موقعك',
  emailUs: 'راسلنا',
  hoursHeadingOr: 'ساعات العمل',
  allRightsReserved: 'جميع الحقوق محفوظة.',
};

const OR: Record<Locale, OrStrings> = { en, he, ar };
export const orStrings = (locale?: Locale): OrStrings => OR[locale ?? 'en'] ?? OR.en;
