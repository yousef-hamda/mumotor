// Easy Lane template — its own friendly, easy-going voice on top of the shared
// trilingual vocabulary. Only keys where this template's copy differs (or is
// unique) live here.
import type { Locale } from '../types';
import { T, type TemplateStrings } from '../strings';

export interface ElStrings extends TemplateStrings {
  navPackages: string;
  bookCtaEl: string;
  backToTop: string;
  mainNavAria: string;
  openMenu: string;
  closeMenu: string;
  heroImageAlt: string;
  aboutImageAlt: string;
  journeyAria: string;
  journeyHeading: string;
  journeyBody: string;
  journey0Label: string;
  journey0Sub: string;
  journey1Label: string;
  journey1Sub: string;
  journey2Label: string;
  journey2Sub: string;
  journey3Label: string;
  journey3Sub: string;
  packagesHeadingEl: string;
  packagesSubEl: string;
  packageCtaEl: string;
  selectedLabel: string;
  minLessonSuffix: string;
  minLessonsSuffix: string;
  areasHeadingEl: string;
  areasSubEl: string;
  reviewsHeadingEl: string;
  galleryHeadingEl: string;
  gallerySubEl: string;
  faqHeadingEl: string;
  bookHeadingEl: string;
  bookBodyEl: string;
  emailUs: string;
  hoursHeadingEl: string;
  footerCreditEl: string;
  publishTooltip: string;
}

const en: ElStrings = {
  ...T.en,
  navPackages: 'Packages',
  bookCtaEl: 'Book a Lesson',
  backToTop: 'Back to top',
  mainNavAria: 'Main navigation',
  openMenu: 'Open menu',
  closeMenu: 'Close menu',
  heroImageAlt: 'Driving lesson in progress',
  aboutImageAlt: 'Driving lesson in progress',
  journeyAria: 'Your learning journey',
  journeyHeading: 'Your Journey',
  journeyBody: 'Every great driver starts at the same place — and we\'ll be with you every step.',
  journey0Label: 'Book',
  journey0Sub: 'Pick your slot',
  journey1Label: 'Learn',
  journey1Sub: 'At your pace',
  journey2Label: 'Mock Test',
  journey2Sub: 'Feel ready',
  journey3Label: 'Pass!',
  journey3Sub: 'You\'ve got this',
  packagesHeadingEl: 'Lesson Packages',
  packagesSubEl: 'Transparent pricing. No hidden fees. Change your mind any time.',
  packageCtaEl: 'Book This Package',
  selectedLabel: 'Selected ✓',
  minLessonSuffix: '-min lesson',
  minLessonsSuffix: '-min lessons',
  areasHeadingEl: 'Areas Covered',
  areasSubEl: 'Pick-up and drop-off at no extra cost across all these areas.',
  reviewsHeadingEl: 'What Learners Say',
  galleryHeadingEl: 'A Look Around',
  gallerySubEl: 'Lessons, passes and happy faces — straight from the driver\'s seat.',
  faqHeadingEl: 'Questions? We\'ve got you.',
  bookHeadingEl: 'Ready to get started?',
  bookBodyEl: 'Book your first lesson today — we\'ll be in touch to confirm your slot.',
  emailUs: 'Email us',
  hoursHeadingEl: 'Opening Hours',
  footerCreditEl: 'All rights reserved.',
  publishTooltip: 'Available once your site is published',
};

const he: ElStrings = {
  ...T.he,
  navPackages: 'חבילות',
  bookCtaEl: 'הזמנת שיעור',
  backToTop: 'חזרה למעלה',
  mainNavAria: 'ניווט ראשי',
  openMenu: 'פתיחת תפריט',
  closeMenu: 'סגירת תפריט',
  heroImageAlt: 'שיעור נהיגה בעיצומו',
  aboutImageAlt: 'שיעור נהיגה בעיצומו',
  journeyAria: 'מסלול הלמידה שלך',
  journeyHeading: 'המסע שלך',
  journeyBody: 'כל נהג מצוין מתחיל בדיוק באותה נקודה — ואנחנו איתך בכל צעד בדרך.',
  journey0Label: 'מזמינים',
  journey0Sub: 'בוחרים מועד',
  journey1Label: 'לומדים',
  journey1Sub: 'בקצב שלך',
  journey2Label: 'טסט מדומה',
  journey2Sub: 'מגיעים מוכנים',
  journey3Label: 'עוברים!',
  journey3Sub: 'יש לכם את זה',
  packagesHeadingEl: 'חבילות שיעורי נהיגה',
  packagesSubEl: 'מחירים שקופים. בלי עלויות נסתרות. אפשר להתחרט בכל רגע.',
  packageCtaEl: 'להזמנת החבילה',
  selectedLabel: 'נבחר ✓',
  minLessonSuffix: ' דקות לשיעור',
  minLessonsSuffix: ' דקות לשיעור',
  areasHeadingEl: 'אזורי שירות',
  areasSubEl: 'איסוף והחזרה בלי תוספת מחיר בכל האזורים האלה.',
  reviewsHeadingEl: 'מה התלמידים אומרים',
  galleryHeadingEl: 'הצצה קטנה',
  gallerySubEl: 'שיעורי נהיגה, טסטים שעברו ופנים מחייכות — היישר ממושב הנהג.',
  faqHeadingEl: 'שאלות? אנחנו כאן בשבילך.',
  bookHeadingEl: 'מוכנים להתחיל?',
  bookBodyEl: 'מזמינים שיעור נהיגה ראשון עוד היום — ניצור קשר לאישור המועד.',
  emailUs: 'כתבו לנו',
  hoursHeadingEl: 'שעות פעילות',
  footerCreditEl: 'כל הזכויות שמורות.',
  publishTooltip: 'זמין לאחר פרסום האתר',
};

const ar: ElStrings = {
  ...T.ar,
  navPackages: 'الباقات',
  bookCtaEl: 'احجز درساً',
  backToTop: 'العودة للأعلى',
  mainNavAria: 'التنقل الرئيسي',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
  heroImageAlt: 'درس قيادة جارٍ',
  aboutImageAlt: 'درس قيادة جارٍ',
  journeyAria: 'رحلة تعلّمك',
  journeyHeading: 'رحلتك',
  journeyBody: 'كل سائق رائع يبدأ من النقطة نفسها — وسنكون معك في كل خطوة على الطريق.',
  journey0Label: 'احجز',
  journey0Sub: 'اختر موعدك',
  journey1Label: 'تعلّم',
  journey1Sub: 'بوتيرتك',
  journey2Label: 'اختبار تجريبي',
  journey2Sub: 'اشعر بالجاهزية',
  journey3Label: 'انجح!',
  journey3Sub: 'أنت قادر على ذلك',
  packagesHeadingEl: 'باقات دروس القيادة',
  packagesSubEl: 'أسعار شفافة. بلا رسوم خفية. ويمكنك تغيير رأيك في أي وقت.',
  packageCtaEl: 'احجز هذه الباقة',
  selectedLabel: 'تم الاختيار ✓',
  minLessonSuffix: ' دقيقة للدرس',
  minLessonsSuffix: ' دقيقة للدرس',
  areasHeadingEl: 'المناطق المشمولة',
  areasSubEl: 'اصطحاب وتوصيل بلا تكلفة إضافية في كل هذه المناطق.',
  reviewsHeadingEl: 'ماذا يقول المتعلّمون',
  galleryHeadingEl: 'نظرة سريعة',
  gallerySubEl: 'دروس قيادة ونجاحات ووجوه سعيدة — مباشرة من مقعد السائق.',
  faqHeadingEl: 'أسئلة؟ نحن هنا من أجلك.',
  bookHeadingEl: 'جاهز للبدء؟',
  bookBodyEl: 'احجز درس القيادة الأول اليوم — وسنتواصل معك لتأكيد الموعد.',
  emailUs: 'راسلنا',
  hoursHeadingEl: 'ساعات العمل',
  footerCreditEl: 'جميع الحقوق محفوظة.',
  publishTooltip: 'متاح بعد نشر موقعك',
};

const EL: Record<Locale, ElStrings> = { en, he, ar };
export const elStrings = (locale?: Locale): ElStrings => EL[locale ?? 'en'] ?? EL.en;
