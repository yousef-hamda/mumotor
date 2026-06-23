import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const LANGS = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'he', label: 'עברית', dir: 'rtl' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const;
export type Lang = (typeof LANGS)[number]['code'];

export function applyDir(lang: string) {
  const meta = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  document.documentElement.lang = meta.code;
  document.documentElement.dir = meta.dir;
}

const en = {
  common: { signIn: 'Sign in', buildSite: 'Build your site', getStarted: 'Get started', dashboard: 'Go to dashboard', overview: 'Overview', drivingTeacher: 'Driving Teacher', reviews: 'Reviews', publishing: 'Publishing', billing: 'Billing', settings: 'Settings', signOut: 'Sign out', newSite: 'New site', viewDemo: 'View a live demo', language: 'Language' },
  landing: {
    eyebrow: 'For independent driving instructors',
    heroTitle: 'Build your driving website in minutes',
    heroLead: 'Answer a few questions, pick a design, and DriveSawa generates a complete, trilingual website — then runs your bookings, student roster, and reminders from one dashboard.',
    heroNote: 'No design skills needed · Hebrew · Arabic · English',
    featuresEyebrow: 'Everything in one place',
    featuresTitle: 'Built for solo instructors',
    featuresLead: 'Not bloated school software — just the tools one teacher actually needs.',
    howEyebrow: 'How it works',
    howTitle: 'From enrollment to license',
    ctaTitle: 'Start in minutes',
    ctaText: 'Create your account, set your hours, and share your first enrollment code today.',
    ctaButton: 'Build your website',
  },
};
const he: typeof en = {
  common: { signIn: 'התחברות', buildSite: 'בנו אתר', getStarted: 'בואו נתחיל', dashboard: 'לוח הבקרה', overview: 'סקירה', drivingTeacher: 'מורה לנהיגה', reviews: 'ביקורות', publishing: 'פרסום', billing: 'חיוב', settings: 'הגדרות', signOut: 'התנתקות', newSite: 'אתר חדש', viewDemo: 'צפו בדמו', language: 'שפה' },
  landing: {
    eyebrow: 'למורי נהיגה עצמאיים',
    heroTitle: 'בנו אתר נהיגה תוך דקות',
    heroLead: 'עונים על כמה שאלות, בוחרים עיצוב, ו-DriveSawa מייצרת אתר מלא ותלת-לשוני — ואז מנהלת את ההזמנות, רשימת התלמידים והתזכורות מלוח בקרה אחד.',
    heroNote: 'ללא ידע בעיצוב · עברית · ערבית · אנגלית',
    featuresEyebrow: 'הכול במקום אחד',
    featuresTitle: 'בנוי למורה עצמאי',
    featuresLead: 'לא תוכנה מסורבלת — בדיוק הכלים שמורה אחד באמת צריך.',
    howEyebrow: 'איך זה עובד',
    howTitle: 'מהרשמה ועד רישיון',
    ctaTitle: 'מתחילים תוך דקות',
    ctaText: 'פותחים חשבון, מגדירים שעות, ומשתפים את קוד ההרשמה הראשון עוד היום.',
    ctaButton: 'בנו את האתר',
  },
};
const ar: typeof en = {
  common: { signIn: 'تسجيل الدخول', buildSite: 'أنشئ موقعك', getStarted: 'ابدأ الآن', dashboard: 'لوحة التحكم', overview: 'نظرة عامة', drivingTeacher: 'مدرّب القيادة', reviews: 'التقييمات', publishing: 'النشر', billing: 'الفوترة', settings: 'الإعدادات', signOut: 'تسجيل الخروج', newSite: 'موقع جديد', viewDemo: 'شاهد عرضاً حياً', language: 'اللغة' },
  landing: {
    eyebrow: 'لمدرّبي القيادة المستقلين',
    heroTitle: 'أنشئ موقع القيادة خلال دقائق',
    heroLead: 'أجب عن بضعة أسئلة، اختر تصميماً، وتنشئ DriveSawa موقعاً كاملاً ثلاثي اللغات — ثم تدير حجوزاتك وقائمة طلابك والتذكيرات من لوحة واحدة.',
    heroNote: 'لا حاجة لمهارات تصميم · العبرية · العربية · الإنجليزية',
    featuresEyebrow: 'كل شيء في مكان واحد',
    featuresTitle: 'مصمّم للمدرّب المستقل',
    featuresLead: 'ليس برنامجاً معقداً — فقط الأدوات التي يحتاجها المدرّب فعلاً.',
    howEyebrow: 'كيف يعمل',
    howTitle: 'من التسجيل إلى الرخصة',
    ctaTitle: 'ابدأ خلال دقائق',
    ctaText: 'أنشئ حسابك، حدّد ساعاتك، وشارك أول رمز تسجيل اليوم.',
    ctaButton: 'أنشئ موقعك',
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, he: { translation: he }, ar: { translation: ar } },
    fallbackLng: 'en',
    supportedLngs: ['en', 'he', 'ar'],
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'drivesawa_lang' },
    interpolation: { escapeValue: false },
  });

applyDir(i18n.language || 'en');
i18n.on('languageChanged', applyDir);

export default i18n;
