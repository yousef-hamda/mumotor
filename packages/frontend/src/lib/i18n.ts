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
  common: { signIn: 'Sign in', buildSite: 'Build your site', getStarted: 'Get started', dashboard: 'Go to dashboard', overview: 'Overview', drivingTeacher: 'Driving Teacher', reviews: 'Reviews', messages: 'Messages', publishing: 'Publishing', billing: 'Billing', settings: 'Settings', signOut: 'Sign out', newSite: 'New site', viewDemo: 'View a live demo', language: 'Language' },
  landing: {
    eyebrow: 'For independent driving instructors',
    heroTitlePre: 'Your driving school,',
    heroTitleAccent: 'online by sunrise.',
    heroLead: 'Mumotor builds you a beautiful, trilingual website and runs the whole business behind it — enrollments, bookings and reminders — from one calm dashboard.',
    heroNote: 'No design skills needed · Hebrew · Arabic · English',
    trustLine: 'Trusted by independent instructors across the country',
    featuresEyebrow: 'Everything in one place',
    featuresTitle: 'Built for solo instructors',
    featuresLead: 'Not bloated school software — just the tools one teacher actually needs, done beautifully.',
    howEyebrow: 'How it works',
    howTitle: 'From first question to first booking',
    showcaseEyebrow: 'Designed to impress',
    showcaseTitle: 'Websites your students will actually trust',
    showcaseLead: 'Every template is hand-tuned — warm typography, real photos and smooth motion. No two instructors look the same.',
    testimonialEyebrow: 'Loved by instructors',
    testimonialQuote: 'I set everything up before my morning coffee. Students book themselves now and I just teach — Mumotor quietly runs the rest.',
    testimonialName: 'Lior A.',
    testimonialRole: 'Driving instructor, Netanya',
    faqEyebrow: 'Good to know',
    faqTitle: 'Questions, answered',
    ctaTitle: 'Be online by sunrise',
    ctaText: 'Create your account, set your hours, and share your first enrollment code today — it takes about five minutes.',
    ctaButton: 'Build your website',
  },
};
const he: typeof en = {
  common: { signIn: 'התחברות', buildSite: 'בנו אתר', getStarted: 'בואו נתחיל', dashboard: 'לוח הבקרה', overview: 'סקירה', drivingTeacher: 'מורה לנהיגה', reviews: 'ביקורות', messages: 'הודעות', publishing: 'פרסום', billing: 'חיוב', settings: 'הגדרות', signOut: 'התנתקות', newSite: 'אתר חדש', viewDemo: 'צפו בדמו', language: 'שפה' },
  landing: {
    eyebrow: 'למורי נהיגה עצמאיים',
    heroTitlePre: 'בית הספר לנהיגה שלך,',
    heroTitleAccent: 'באוויר עד הזריחה.',
    heroLead: 'מומוטור בונה לך אתר יפהפה ותלת-לשוני ומנהל מאחוריו את כל העסק — הרשמות, הזמנות ותזכורות — מלוח בקרה אחד ורגוע.',
    heroNote: 'ללא ידע בעיצוב · עברית · ערבית · אנגלית',
    trustLine: 'נבחר על ידי מורי נהיגה עצמאיים בכל הארץ',
    featuresEyebrow: 'הכול במקום אחד',
    featuresTitle: 'בנוי למורה עצמאי',
    featuresLead: 'לא תוכנה מסורבלת — בדיוק הכלים שמורה אחד באמת צריך, ובעיצוב יפה.',
    howEyebrow: 'איך זה עובד',
    howTitle: 'מהשאלה הראשונה ועד ההזמנה הראשונה',
    showcaseEyebrow: 'מעוצב כדי להרשים',
    showcaseTitle: 'אתרים שהתלמידים שלך באמת יסמכו עליהם',
    showcaseLead: 'כל תבנית מכוונת ביד — טיפוגרפיה חמה, תמונות אמיתיות ותנועה חלקה. אין שני מורים שנראים אותו דבר.',
    testimonialEyebrow: 'אהוב על מורים',
    testimonialQuote: 'הגדרתי הכול לפני הקפה של הבוקר. התלמידים מזמינים לבד ואני פשוט מלמד — מומוטור מנהל בשקט את כל השאר.',
    testimonialName: 'ליאור א׳',
    testimonialRole: 'מורה לנהיגה, נתניה',
    faqEyebrow: 'כדאי לדעת',
    faqTitle: 'שאלות, עם תשובות',
    ctaTitle: 'להיות באוויר עד הזריחה',
    ctaText: 'פותחים חשבון, מגדירים שעות, ומשתפים את קוד ההרשמה הראשון עוד היום — זה לוקח כחמש דקות.',
    ctaButton: 'בנו את האתר',
  },
};
const ar: typeof en = {
  common: { signIn: 'تسجيل الدخول', buildSite: 'أنشئ موقعك', getStarted: 'ابدأ الآن', dashboard: 'لوحة التحكم', overview: 'نظرة عامة', drivingTeacher: 'مدرّب القيادة', reviews: 'التقييمات', messages: 'الرسائل', publishing: 'النشر', billing: 'الفوترة', settings: 'الإعدادات', signOut: 'تسجيل الخروج', newSite: 'موقع جديد', viewDemo: 'شاهد عرضاً حياً', language: 'اللغة' },
  landing: {
    eyebrow: 'لمدرّبي القيادة المستقلين',
    heroTitlePre: 'مدرسة القيادة الخاصة بك،',
    heroTitleAccent: 'على الإنترنت مع الشروق.',
    heroLead: 'يبني لك Mumotor موقعاً جميلاً ثلاثي اللغات ويدير خلفه العمل كله — التسجيلات والحجوزات والتذكيرات — من لوحة تحكم واحدة هادئة.',
    heroNote: 'لا حاجة لمهارات تصميم · العبرية · العربية · الإنجليزية',
    trustLine: 'موثوق من مدرّبي القيادة المستقلين في جميع أنحاء البلاد',
    featuresEyebrow: 'كل شيء في مكان واحد',
    featuresTitle: 'مصمّم للمدرّب المستقل',
    featuresLead: 'ليس برنامجاً معقداً — فقط الأدوات التي يحتاجها المدرّب فعلاً، بتصميم جميل.',
    howEyebrow: 'كيف يعمل',
    howTitle: 'من أول سؤال إلى أول حجز',
    showcaseEyebrow: 'مصمّم لإبهار العملاء',
    showcaseTitle: 'مواقع يثق بها طلابك حقاً',
    showcaseLead: 'كل قالب مضبوط بعناية — خطوط دافئة وصور حقيقية وحركة سلسة. لا يتشابه مدرّبان.',
    testimonialEyebrow: 'محبوب من المدرّبين',
    testimonialQuote: 'أعددت كل شيء قبل قهوة الصباح. الطلاب يحجزون بأنفسهم الآن وأنا أدرّس فقط — ويدير Mumotor الباقي بهدوء.',
    testimonialName: 'ليور أ.',
    testimonialRole: 'مدرّب قيادة، نتانيا',
    faqEyebrow: 'من الجيد معرفته',
    faqTitle: 'أسئلة وإجابات',
    ctaTitle: 'كن على الإنترنت مع الشروق',
    ctaText: 'أنشئ حسابك، حدّد ساعاتك، وشارك أول رمز تسجيل اليوم — يستغرق الأمر خمس دقائق تقريباً.',
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
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'mumotor_lang' },
    interpolation: { escapeValue: false },
  });

applyDir(i18n.language || 'en');
i18n.on('languageChanged', applyDir);

export default i18n;
