// Prestige Drive template — its own upscale editorial voice on top of the
// shared trilingual vocabulary. Only keys where this template's copy differs
// (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface PgStrings extends TemplateStrings {
  navPackages: string;
  openMenu: string;
  closeMenu: string;
  packagesEyebrowPg: string;
  packagesHeadingPg: string;
  packageCtaPg: string;
  aboutEyebrowPg: string;
  aboutImageAlt: string;
  areasHeadingPg: string;
  areasSubPg: string;
  reviewsEyebrowPg: string;
  reviewsHeadingPg: string;
  galleryHeadingPg: string;
  faqEyebrowPg: string;
  faqHeadingPg: string;
  bookEyebrowPg: string;
  bookHeadingPg: string;
  bookBodyPg: string;
  footerCreditPg: string;
  publishTooltip: string;
}

const en: PgStrings = {
  ...T.en,
  navPackages: 'Packages',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  packagesEyebrowPg: 'Packages & Pricing',
  packagesHeadingPg: 'Invest in your independence.',
  packageCtaPg: 'Select package',
  aboutEyebrowPg: 'About the instructor',
  aboutImageAlt: 'Driving lesson in progress',
  areasHeadingPg: 'Areas we serve.',
  areasSubPg: 'Door-to-door pickup at no extra charge.',
  reviewsEyebrowPg: 'Testimonials',
  reviewsHeadingPg: 'What our drivers say.',
  galleryHeadingPg: 'Moments on the road.',
  faqEyebrowPg: 'Questions',
  faqHeadingPg: 'Frequently asked.',
  bookEyebrowPg: 'Reservations',
  bookHeadingPg: 'Book your lesson.',
  bookBodyPg: 'Reserve your spot and start driving.',
  footerCreditPg: 'All rights reserved.',
  publishTooltip: 'Available once your site is published',
};

const he: PgStrings = {
  ...T.he,
  navPackages: 'חבילות',
  openMenu: 'פתיחת תפריט',
  closeMenu: 'סגירת תפריט',
  packagesEyebrowPg: 'חבילות ומחירים',
  packagesHeadingPg: 'השקעה בעצמאות שלך.',
  packageCtaPg: 'בחירת חבילה',
  aboutEyebrowPg: 'על מורה הנהיגה',
  aboutImageAlt: 'שיעור נהיגה בעיצומו',
  areasHeadingPg: 'האזורים שבהם אנחנו פועלים.',
  areasSubPg: 'איסוף עד הבית ללא תוספת תשלום.',
  reviewsEyebrowPg: 'המלצות',
  reviewsHeadingPg: 'מה הנהגים שלנו מספרים.',
  galleryHeadingPg: 'רגעים על הכביש.',
  faqEyebrowPg: 'שאלות',
  faqHeadingPg: 'שאלות נפוצות.',
  bookEyebrowPg: 'הזמנת מקום',
  bookHeadingPg: 'הזמינו את השיעור שלכם.',
  bookBodyPg: 'שריינו את מקומכם והתחילו לנהוג.',
  footerCreditPg: 'כל הזכויות שמורות.',
  publishTooltip: 'זמין לאחר פרסום האתר',
};

const ar: PgStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
  packagesEyebrowPg: 'الباقات والأسعار',
  packagesHeadingPg: 'استثمر في استقلاليتك.',
  packageCtaPg: 'اختر الباقة',
  aboutEyebrowPg: 'عن مدرّب القيادة',
  aboutImageAlt: 'درس قيادة جارٍ',
  areasHeadingPg: 'المناطق التي نخدمها.',
  areasSubPg: 'اصطحاب من الباب إلى الباب دون أي رسوم إضافية.',
  reviewsEyebrowPg: 'شهادات طلابنا',
  reviewsHeadingPg: 'ماذا يقول سائقونا.',
  galleryHeadingPg: 'لحظات على الطريق.',
  faqEyebrowPg: 'أسئلة',
  faqHeadingPg: 'الأسئلة المتكررة.',
  bookEyebrowPg: 'الحجوزات',
  bookHeadingPg: 'احجز درسك.',
  bookBodyPg: 'احجز مكانك وابدأ القيادة.',
  footerCreditPg: 'جميع الحقوق محفوظة.',
  publishTooltip: 'متاح بعد نشر موقعك',
};

const PG: Record<Locale, PgStrings> = { en, he, ar };
export const pgStrings = (locale?: Locale): PgStrings => PG[locale ?? 'en'] ?? PG.en;
