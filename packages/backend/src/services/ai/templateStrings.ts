// Trilingual content for generated driving-teacher sites (EN / HE / AR).
// {school} and {teacher} are interpolated by the builder.

export type SiteLocale = 'en' | 'he' | 'ar';

export interface SiteStrings {
  nav: { about: string; lessons: string; reviews: string; faq: string; contact: string; enroll: string; book: string };
  hero: { role: string; lead: string; getStarted: string; book: string };
  stats: { passRate: string; students: string; years: string; rating: string };
  how: { eyebrow: string; title: string; steps: { h: string; p: string }[] };
  about: { eyebrow: string; title: string; bio: string; checklist: string[] };
  services: { eyebrow: string; title: string; minutes: string };
  gallery: { eyebrow: string; title: string };
  reviews: { eyebrow: string; title: string; defaults: { name: string; comment: string }[] };
  faq: { eyebrow: string; title: string; defaults: { q: string; a: string }[] };
  contact: { eyebrow: string; title: string; lead: string; enrollNow: string; phone: string; email: string; area: string; booking: string; online7: string; lessonsLabel: string; minEach: string };
  cta: { title: string; text: string; enrollNow: string };
  footer: { builtWith: string };
  servicesDefault: { name: string; description: string; price: number; duration: number }[];
}

export function fmt(s: string, vars: Record<string, string>): string {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

const en: SiteStrings = {
  nav: { about: 'About', lessons: 'Lessons', reviews: 'Reviews', faq: 'FAQ', contact: 'Contact', enroll: 'Enroll', book: 'Book a lesson' },
  hero: { role: 'Driving Instructor', lead: 'Learn to drive with {school}. Enroll with your code, then book lessons online whenever it suits you.', getStarted: 'Get started', book: 'Book a lesson' },
  stats: { passRate: 'First-attempt pass rate', students: 'Students taught', years: 'Years of experience', rating: 'Average rating' },
  how: { eyebrow: 'How it works', title: 'From enrollment to license', steps: [
    { h: 'Get your code', p: 'Your instructor hands you an enrollment code.' },
    { h: 'Register', p: 'Sign up in seconds with your name, email and the code.' },
    { h: 'Book lessons', p: 'Pick open slots that fit your schedule.' },
    { h: 'Get your license!', p: 'Practice, improve, and pass with confidence.' },
  ] },
  about: { eyebrow: 'About', title: 'Meet {teacher}', bio: '{teacher} has spent years helping new drivers become safe, confident, and licensed. Every lesson is patient, structured, and tailored to you — in a modern dual-control car.', checklist: ['Modern dual-control vehicle', 'Flexible, online lesson scheduling', 'Patient, professional instruction', 'Test-route preparation'] },
  services: { eyebrow: 'Lessons', title: 'Lesson types', minutes: 'minutes' },
  gallery: { eyebrow: 'Gallery', title: 'On the road' },
  reviews: { eyebrow: 'Reviews', title: 'What students say', defaults: [
    { name: 'Anna K.', comment: 'Passed first time! Calm, patient and incredibly clear. I never felt rushed.' },
    { name: 'Sam B.', comment: 'Booking lessons online made everything so easy. Highly recommend.' },
    { name: 'Omar J.', comment: 'Went from nervous to confident in a few weeks. The best decision I made.' },
  ] },
  faq: { eyebrow: 'FAQ', title: 'Common questions', defaults: [
    { q: 'How many lessons will I need?', a: 'Most students take between 10 and 20 lessons, depending on prior experience and how quickly they build confidence.' },
    { q: 'What vehicle will I drive?', a: 'A modern, fully insured dual-control car, so your instructor can assist safely at any moment.' },
    { q: 'How do I book a lesson?', a: 'Get an enrollment code from your instructor, register on this site, then pick any open slot.' },
    { q: 'What is your cancellation policy?', a: 'Cancellations are free up to 24 hours before a lesson. Later cancellations are charged at 50%.' },
    { q: 'Do you teach automatic and manual?', a: 'Yes — both. Let your instructor know your preference when you enroll.' },
  ] },
  contact: { eyebrow: 'Contact', title: 'Ready to start?', lead: 'Enroll with the code from {teacher} and book your first lesson today. Questions? Reach out anytime.', enrollNow: 'Enroll now', phone: 'Phone', email: 'Email', area: 'Area', booking: 'Booking', online7: 'Online, 7 days a week', lessonsLabel: 'Lessons', minEach: '{n} min each' },
  cta: { title: 'Begin your road to freedom', text: 'Get behind the wheel with confidence — enroll now and book your first lesson.', enrollNow: 'Enroll now' },
  footer: { builtWith: 'Built with Mumotor' },
  servicesDefault: [
    { name: 'Driving Lesson', description: 'A standard one-on-one lesson tailored to your level.', price: 50, duration: 45 },
    { name: 'First Lesson', description: 'A gentle introduction for brand-new drivers.', price: 40, duration: 45 },
    { name: 'Test Preparation', description: 'Mock test on real routes to get you exam-ready.', price: 55, duration: 60 },
    { name: 'Highway Lesson', description: 'Build confidence at speed on the open road.', price: 55, duration: 60 },
  ],
};

const he: SiteStrings = {
  nav: { about: 'אודות', lessons: 'שיעורים', reviews: 'ביקורות', faq: 'שאלות נפוצות', contact: 'צור קשר', enroll: 'הרשמה', book: 'הזמנת שיעור' },
  hero: { role: 'מורה לנהיגה', lead: 'למדו לנהוג עם {school}. נרשמים עם הקוד שלכם ומזמינים שיעורים אונליין מתי שנוח לכם.', getStarted: 'בואו נתחיל', book: 'הזמנת שיעור' },
  stats: { passRate: 'אחוז מעבר בניסיון ראשון', students: 'תלמידים', years: 'שנות ניסיון', rating: 'דירוג ממוצע' },
  how: { eyebrow: 'איך זה עובד', title: 'מהרשמה ועד רישיון', steps: [
    { h: 'קבלו קוד', p: 'המורה נותן לכם קוד הרשמה.' },
    { h: 'הרשמה', p: 'נרשמים תוך שניות עם שם, אימייל והקוד.' },
    { h: 'הזמינו שיעורים', p: 'בוחרים זמנים פנויים שמתאימים לכם.' },
    { h: 'מקבלים רישיון!', p: 'מתרגלים, משתפרים, ועוברים בביטחון.' },
  ] },
  about: { eyebrow: 'אודות', title: 'הכירו את {teacher}', bio: '{teacher} עוזר/ת כבר שנים לנהגים חדשים להפוך לבטוחים, מיומנים ובעלי רישיון. כל שיעור סבלני, מסודר ומותאם אישית — ברכב לימוד מודרני עם דוושות כפולות.', checklist: ['רכב לימוד מודרני עם דוושות כפולות', 'תיאום שיעורים גמיש ואונליין', 'הוראה סבלנית ומקצועית', 'הכנה למסלולי הטסט'] },
  services: { eyebrow: 'שיעורים', title: 'סוגי שיעורים', minutes: 'דקות' },
  gallery: { eyebrow: 'גלריה', title: 'על הכביש' },
  reviews: { eyebrow: 'ביקורות', title: 'מה התלמידים אומרים', defaults: [
    { name: 'אנה ק.', comment: 'עברתי בפעם הראשונה! רגוע, סבלני וברור להפליא. אף פעם לא הרגשתי בלחץ.' },
    { name: 'סם ב.', comment: 'הזמנת שיעורים אונליין הפכה הכול לפשוט. ממליץ בחום.' },
    { name: 'עומר ג׳.', comment: 'תוך כמה שבועות עברתי מלחוץ לבטוח. ההחלטה הכי טובה שעשיתי.' },
  ] },
  faq: { eyebrow: 'שאלות נפוצות', title: 'שאלות נפוצות', defaults: [
    { q: 'כמה שיעורים אצטרך?', a: 'רוב התלמידים לוקחים בין 10 ל-20 שיעורים, תלוי בניסיון קודם ובקצב ההתקדמות.' },
    { q: 'באיזה רכב אנהג?', a: 'רכב מודרני ומבוטח עם דוושות כפולות, כך שהמורה יכול לסייע בבטחה בכל רגע.' },
    { q: 'איך מזמינים שיעור?', a: 'מקבלים קוד הרשמה מהמורה, נרשמים באתר ובוחרים זמן פנוי.' },
    { q: 'מהי מדיניות הביטולים?', a: 'ביטול חינם עד 24 שעות לפני השיעור. ביטול מאוחר יותר מחויב ב-50%.' },
    { q: 'מלמדים אוטומט וגם ידני?', a: 'כן — שניהם. עדכנו את המורה על ההעדפה שלכם בהרשמה.' },
  ] },
  contact: { eyebrow: 'צור קשר', title: 'מוכנים להתחיל?', lead: 'נרשמים עם הקוד מ{teacher} ומזמינים את השיעור הראשון עוד היום. שאלות? אנחנו כאן.', enrollNow: 'להרשמה', phone: 'טלפון', email: 'אימייל', area: 'אזור', booking: 'הזמנות', online7: 'אונליין, 7 ימים בשבוע', lessonsLabel: 'שיעורים', minEach: '{n} דקות לשיעור' },
  cta: { title: 'הדרך לחופש מתחילה כאן', text: 'שבו מאחורי ההגה בביטחון — הירשמו והזמינו את השיעור הראשון.', enrollNow: 'להרשמה' },
  footer: { builtWith: 'נבנה עם Mumotor' },
  servicesDefault: [
    { name: 'שיעור נהיגה', description: 'שיעור פרטני סטנדרטי המותאם לרמה שלכם.', price: 50, duration: 45 },
    { name: 'שיעור ראשון', description: 'מבוא עדין לנהגים מתחילים לגמרי.', price: 40, duration: 45 },
    { name: 'הכנה לטסט', description: 'טסט דמה במסלולים אמיתיים כדי להגיע מוכנים.', price: 55, duration: 60 },
    { name: 'שיעור בכביש מהיר', description: 'בונים ביטחון במהירות על הכביש הפתוח.', price: 55, duration: 60 },
  ],
};

const ar: SiteStrings = {
  nav: { about: 'من نحن', lessons: 'الدروس', reviews: 'التقييمات', faq: 'الأسئلة الشائعة', contact: 'تواصل', enroll: 'التسجيل', book: 'احجز درساً' },
  hero: { role: 'مدرّب قيادة', lead: 'تعلّم القيادة مع {school}. سجّل برمزك ثم احجز الدروس عبر الإنترنت متى يناسبك.', getStarted: 'ابدأ الآن', book: 'احجز درساً' },
  stats: { passRate: 'نسبة النجاح من المحاولة الأولى', students: 'طالب تدرّب', years: 'سنوات الخبرة', rating: 'متوسط التقييم' },
  how: { eyebrow: 'كيف يعمل', title: 'من التسجيل إلى الرخصة', steps: [
    { h: 'احصل على رمزك', p: 'يمنحك المدرّب رمز تسجيل.' },
    { h: 'سجّل', p: 'سجّل خلال ثوانٍ باسمك وبريدك والرمز.' },
    { h: 'احجز الدروس', p: 'اختر المواعيد المتاحة التي تناسبك.' },
    { h: 'احصل على رخصتك!', p: 'تدرّب وتحسّن واجتز الاختبار بثقة.' },
  ] },
  about: { eyebrow: 'من نحن', title: 'تعرّف على {teacher}', bio: 'يساعد {teacher} منذ سنوات السائقين الجدد ليصبحوا آمنين وواثقين وحاصلين على الرخصة. كل درس صبور ومنظّم ومصمّم لك — في سيارة حديثة مزدوجة التحكّم.', checklist: ['سيارة حديثة مزدوجة التحكّم', 'حجز دروس مرن عبر الإنترنت', 'تعليم صبور واحترافي', 'تحضير لمسارات الاختبار'] },
  services: { eyebrow: 'الدروس', title: 'أنواع الدروس', minutes: 'دقيقة' },
  gallery: { eyebrow: 'معرض الصور', title: 'على الطريق' },
  reviews: { eyebrow: 'التقييمات', title: 'ماذا يقول الطلاب', defaults: [
    { name: 'آنا ك.', comment: 'نجحت من أول مرة! هادئ وصبور وواضح جداً. لم أشعر بأي ضغط.' },
    { name: 'سام ب.', comment: 'حجز الدروس عبر الإنترنت جعل كل شيء سهلاً. أنصح به بشدة.' },
    { name: 'عمر ج.', comment: 'انتقلت من التوتر إلى الثقة خلال أسابيع. أفضل قرار اتخذته.' },
  ] },
  faq: { eyebrow: 'الأسئلة الشائعة', title: 'أسئلة شائعة', defaults: [
    { q: 'كم درساً سأحتاج؟', a: 'يأخذ معظم الطلاب بين 10 و20 درساً حسب الخبرة السابقة وسرعة اكتساب الثقة.' },
    { q: 'ما السيارة التي سأقودها؟', a: 'سيارة حديثة ومؤمّنة بالكامل ومزدوجة التحكّم ليتمكّن المدرّب من المساعدة بأمان.' },
    { q: 'كيف أحجز درساً؟', a: 'احصل على رمز التسجيل من المدرّب، سجّل في الموقع، ثم اختر موعداً متاحاً.' },
    { q: 'ما سياسة الإلغاء؟', a: 'الإلغاء مجاني حتى 24 ساعة قبل الدرس. الإلغاء المتأخر يُحتسب بنسبة 50%.' },
    { q: 'هل تعلّمون الأوتوماتيك واليدوي؟', a: 'نعم — كلاهما. أخبر المدرّب بتفضيلك عند التسجيل.' },
  ] },
  contact: { eyebrow: 'تواصل', title: 'جاهز للبدء؟', lead: 'سجّل بالرمز من {teacher} واحجز درسك الأول اليوم. أسئلة؟ تواصل معنا في أي وقت.', enrollNow: 'سجّل الآن', phone: 'الهاتف', email: 'البريد', area: 'المنطقة', booking: 'الحجز', online7: 'عبر الإنترنت، 7 أيام في الأسبوع', lessonsLabel: 'الدروس', minEach: '{n} دقيقة لكل درس' },
  cta: { title: 'ابدأ طريقك نحو الحرية', text: 'اجلس خلف المقود بثقة — سجّل الآن واحجز درسك الأول.', enrollNow: 'سجّل الآن' },
  footer: { builtWith: 'صُنع بواسطة Mumotor' },
  servicesDefault: [
    { name: 'درس قيادة', description: 'درس فردي قياسي مصمّم حسب مستواك.', price: 50, duration: 45 },
    { name: 'الدرس الأول', description: 'مقدمة لطيفة للسائقين الجدد تماماً.', price: 40, duration: 45 },
    { name: 'التحضير للاختبار', description: 'اختبار تجريبي على مسارات حقيقية لتكون جاهزاً.', price: 55, duration: 60 },
    { name: 'درس الطريق السريع', description: 'اكتسب الثقة بالسرعة على الطريق المفتوح.', price: 55, duration: 60 },
  ],
};

export const SITE_STRINGS: Record<SiteLocale, SiteStrings> = { en, he, ar };
export const getSiteStrings = (l?: string): SiteStrings => SITE_STRINGS[(l as SiteLocale) in SITE_STRINGS ? (l as SiteLocale) : 'en'];
