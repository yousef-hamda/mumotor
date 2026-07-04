// Night Shift template — its own voice on top of the shared trilingual vocabulary.
// Only keys where this template's copy differs (or is unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface NsStrings extends TemplateStrings {
  navPackages: string;
  packagesHeadingNs: string;
  packagesSubNs: string;
  packageCtaNs: string;
  areasHeadingNs: string;
  areasSubNs: string;
  reviewsHeadingNs: string;
  reviewsSubNs: string;
  galleryHeadingNs: string;
  gallerySubNs: string;
  faqHeadingNs: string;
  bookHeadingNs: string;
  bookBodyNs: string;
  contactHeadingNs: string;
  hoursLabelNs: string;
  closedLabelNs: string;
  footerCreditNs: string;
  aboutImageAlt: string;
  publishTooltip: string;
  ariaStars: string; // {n}
  ariaSiteNav: string;
  ariaBackToTop: string; // {name}
  ariaPageSections: string;
  ariaOpenMenu: string;
  ariaCloseMenu: string;
  ariaFeatures: string;
}

const en: NsStrings = {
  ...T.en,
  navPackages: 'Packages',
  packagesHeadingNs: 'Packages & Pricing',
  packagesSubNs: 'Flat prices, no hidden extras. Pick the plan that fits your schedule.',
  packageCtaNs: 'Select package',
  areasHeadingNs: 'Areas We Cover',
  areasSubNs: 'Door-to-door pickup — no extra charge, anywhere below.',
  reviewsHeadingNs: 'What Learners Say',
  reviewsSubNs: 'Real stories from real drivers who passed their test.',
  galleryHeadingNs: 'From the Road',
  gallerySubNs: 'A look at lessons, learners and passes.',
  faqHeadingNs: 'Frequently Asked',
  bookHeadingNs: 'Book Your Lesson',
  bookBodyNs: 'Ready to hit the road? Reserve your spot and start driving.',
  contactHeadingNs: 'Get in Touch',
  hoursLabelNs: 'Opening Hours',
  closedLabelNs: '— Closed —',
  footerCreditNs: 'All rights reserved.',
  aboutImageAlt: 'Driving lesson in progress',
  publishTooltip: 'Available once your site is published',
  ariaStars: '{n} out of 5 stars',
  ariaSiteNav: 'Site navigation',
  ariaBackToTop: '{name} — back to top',
  ariaPageSections: 'Page sections',
  ariaOpenMenu: 'Open menu',
  ariaCloseMenu: 'Close menu',
  ariaFeatures: 'Features included',
};

const he: NsStrings = {
  ...T.he,
  navPackages: 'חבילות',
  packagesHeadingNs: 'חבילות ומחירים',
  packagesSubNs: 'מחירים קבועים, בלי תוספות נסתרות. בוחרים את המסלול שמתאים ללוח הזמנים שלכם.',
  packageCtaNs: 'בחירת חבילה',
  areasHeadingNs: 'האזורים שאנחנו מכסים',
  areasSubNs: 'איסוף עד הבית — בלי תוספת מחיר, בכל אזור ברשימה.',
  reviewsHeadingNs: 'מה התלמידים אומרים',
  reviewsSubNs: 'סיפורים אמיתיים מנהגים אמיתיים שעברו את הטסט.',
  galleryHeadingNs: 'מהכביש',
  gallerySubNs: 'הצצה לשיעורי נהיגה, לתלמידים ולהצלחות בטסט.',
  faqHeadingNs: 'שאלות נפוצות',
  bookHeadingNs: 'הזמינו שיעור נהיגה',
  bookBodyNs: 'מוכנים לצאת לכביש? שריינו מקום והתחילו לנהוג.',
  contactHeadingNs: 'דברו איתנו',
  hoursLabelNs: 'שעות פעילות',
  closedLabelNs: '— סגור —',
  footerCreditNs: 'כל הזכויות שמורות.',
  aboutImageAlt: 'שיעור נהיגה בעיצומו',
  publishTooltip: 'זמין לאחר פרסום האתר',
  ariaStars: '{n} מתוך 5 כוכבים',
  ariaSiteNav: 'ניווט באתר',
  ariaBackToTop: '{name} — חזרה למעלה',
  ariaPageSections: 'חלקי העמוד',
  ariaOpenMenu: 'פתיחת תפריט',
  ariaCloseMenu: 'סגירת תפריט',
  ariaFeatures: 'מה כלול',
};

const ar: NsStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  packagesHeadingNs: 'الباقات والأسعار',
  packagesSubNs: 'أسعار ثابتة، بلا إضافات خفية. اختر الباقة التي تناسب جدولك.',
  packageCtaNs: 'اختيار الباقة',
  areasHeadingNs: 'المناطق التي نغطيها',
  areasSubNs: 'اصطحاب من الباب إلى الباب — بلا تكلفة إضافية، في أي منطقة أدناه.',
  reviewsHeadingNs: 'ماذا يقول المتعلّمون',
  reviewsSubNs: 'قصص حقيقية من سائقين حقيقيين اجتازوا اختبار القيادة.',
  galleryHeadingNs: 'من الطريق',
  gallerySubNs: 'لمحة عن دروس القيادة والمتعلّمين والنجاحات.',
  faqHeadingNs: 'الأسئلة الشائعة',
  bookHeadingNs: 'احجز درس القيادة',
  bookBodyNs: 'جاهز للانطلاق على الطريق؟ احجز مكانك وابدأ القيادة.',
  contactHeadingNs: 'تواصل معنا',
  hoursLabelNs: 'ساعات العمل',
  closedLabelNs: '— مغلق —',
  footerCreditNs: 'جميع الحقوق محفوظة.',
  aboutImageAlt: 'درس قيادة جارٍ',
  publishTooltip: 'متاح بعد نشر موقعك',
  ariaStars: '{n} من 5 نجوم',
  ariaSiteNav: 'التنقل في الموقع',
  ariaBackToTop: '{name} — العودة إلى الأعلى',
  ariaPageSections: 'أقسام الصفحة',
  ariaOpenMenu: 'فتح القائمة',
  ariaCloseMenu: 'إغلاق القائمة',
  ariaFeatures: 'الميزات المشمولة',
};

const NS: Record<Locale, NsStrings> = { en, he, ar };
export const nsStrings = (locale?: Locale): NsStrings => NS[locale ?? 'en'] ?? NS.en;
