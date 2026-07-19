// Trilingual (EN / HE / AR) copy for the STUDENT-FACING pages of published sites
// (Enroll / BookLesson / StudentAccount / LeaveReview + the TemplatedShell).
//
// The page language comes from the SITE's locale (`settings.locale`), NOT the
// visitor's browser language — so this is a plain locale-keyed lookup, NOT
// react-i18next. Numbers stay Latin digits in every locale (no Hindic digits);
// `{...}` placeholders interpolate verbatim.
//
// EN wording is intentionally identical to the previous hardcoded literals so
// English output is unchanged.

export type BookLocale = 'en' | 'he' | 'ar';

/** Normalize a backend Locale ('EN'|'HE'|'AR', maybe lowercase/null) to a BookLocale. */
export function bookLocale(settingsLocale?: string | null): BookLocale {
  const l = (settingsLocale ?? '').toLowerCase();
  if (l === 'he') return 'he';
  if (l === 'ar') return 'ar';
  return 'en';
}

export interface BookStrings {
  // Shell + shared
  loading: string;
  schoolNotFound: string;
  notFoundEnroll: string;
  notFoundBook: string;
  notFoundAccount: string;
  notFoundReview: string;
  shellHome: string;
  shellBrandFallback: string;
  poweredBy: string;
  emailLabel: string;
  phoneLabel: string;
  fullName: string;
  phName: string;
  phEmail: string;
  phPhone: string;
  enrollmentCode: string;
  phCode: string;
  bookLesson: string;
  goToAccount: string;
  continue: string;
  back: string;
  errName: string;
  errPhone: string;
  errEmail: string;
  arriveEarly: string;
  minShort: string;

  // Installable-PWA pill
  installApp: string;
  installHintIos: string;

  // Enroll
  enrolledTitle: string;
  alreadyEnrolledTitle: string;
  enrolledSub: string; // {name}
  alreadyEnrolledSub: string;
  enrollEyebrow: string;
  enrollTitle: string; // {name}
  enrollHelper: string;
  errCodeShort: string;
  enroll: string;
  alreadyEnrolledQ: string;

  // BookLesson
  welcomeBack: string;
  linkExpired: string;
  enrollmentPaused: string;
  bookTitle: string;
  bookHelper: string;
  windowOpenDaily: string; // {wStart} {wEnd}
  phEmailYou: string;
  notEnrolledYet: string;
  enrollHere: string;
  quickEnrollTitle: string;
  quickEnrollHelper: string;
  errCodeInstructor: string;
  chooseTime: string;
  tomorrowDate: string; // {date}
  eachLessonArrive: string; // {duration}
  bookingClosed: string; // {wStart} (kept literal, wrapped in <strong> at render)
  checkingAvailability: string;
  noClassesTomorrow: string; // {day}
  allBooked: string;
  youreBooking: string;
  changeTime: string;
  confirmBooking: string;
  lessonBooked: string;
  seeYou: string; // {date} {time} (kept literal, wrapped in <strong> at render)
  reminderLine: string;
  bookAnother: string;
  backToHome: string;
  myAccountLessons: string;

  // StudentAccount
  studentAccount: string;
  signInTo: string; // {name}
  signInHelper: string;
  signIn: string;
  newStudent: string;
  enrollWithCode: string;
  loadingAccount: string;
  accountLoadError: string;
  retry: string;
  welcomeBackEyebrow: string;
  signOut: string;
  tabLessons: string;
  tabChat: string;
  tabProfile: string;
  loadingLessons: string;
  yourNextLesson: string;
  contactToCancel: string;
  noUpcoming: string;
  statCompleted: string;
  statUpcoming: string;
  statTotal: string;
  laterLessons: string;
  upcomingTitle: string;
  progressTitle: string;
  readinessTitle: string;
  hoursDriven: string;
  lessonsCompleted: string;
  lessonsBooked: string;
  historyTitle: string;
  historyEmpty: string;
  lessonCompleted: string;
  lessonCancelled: string;
  eachLessonMin: string; // {duration}
  chatHeading: string;
  chatHelper: string;
  loadingMessages: string;
  chatEmpty: string;
  phMessage: string;
  send: string;
  yourDetails: string;
  nameLabel: string;
  phoneHint: string;
  profileUpdated: string;
  saveChanges: string;

  // LeaveReview
  rating: string;
  star1: string;
  starN: string; // {n}
  thankYou: string;
  reviewSentSub: string; // {name}
  backToSite: string;
  studentReview: string;
  reviewTitle: string; // {name}
  reviewHelper: string;
  errComment: string;
  yourName: string;
  yourReview: string;
  phReview: string;
  sendReview: string;
}

const en: BookStrings = {
  loading: 'Loading…',
  schoolNotFound: 'School not found',
  notFoundEnroll: 'This enrollment link may be incorrect or no longer active.',
  notFoundBook: 'This booking link may be incorrect or no longer active.',
  notFoundAccount: 'This link may be incorrect or no longer active.',
  notFoundReview: 'This review link may be incorrect or no longer active.',
  shellHome: 'Home',
  shellBrandFallback: 'Driving School',
  poweredBy: 'Powered by',
  emailLabel: 'Email',
  phoneLabel: 'Phone',
  fullName: 'Full name',
  phName: 'Jane Doe',
  phEmail: 'jane@example.com',
  phPhone: '+972 50 123 4567',
  enrollmentCode: 'Enrollment code',
  phCode: 'e.g. DRIVE2026',
  bookLesson: 'Book a lesson',
  goToAccount: 'Go to my account',
  continue: 'Continue',
  back: 'Back',
  errName: 'Please enter your name',
  errPhone: 'Please enter a valid phone number',
  errEmail: 'Please enter a valid email',
  arriveEarly: 'Please arrive 5 minutes early.',
  minShort: 'min',
  installApp: 'Install app',
  installHintIos: 'Tap the Share button, then “Add to Home Screen”.',

  enrolledTitle: "You're enrolled",
  alreadyEnrolledTitle: "You're already enrolled",
  enrolledSub: 'Welcome to {name}. You can book a lesson online whenever it suits you.',
  alreadyEnrolledSub: 'This email is already registered. You can go straight to booking your next lesson.',
  enrollEyebrow: 'Student enrollment',
  enrollTitle: 'Enroll at {name}',
  enrollHelper: 'Enter your details and the code your instructor gave you to get started.',
  errCodeShort: 'Enrollment code looks too short',
  enroll: 'Enroll',
  alreadyEnrolledQ: 'Already enrolled?',

  welcomeBack: 'Welcome back!',
  linkExpired: 'That booking link has expired. Please enter your email.',
  enrollmentPaused: 'Your enrollment is paused. Please contact your instructor.',
  bookTitle: 'Book your next lesson',
  bookHelper: 'Lessons are booked for the next day. Enter the email you enrolled with to start.',
  windowOpenDaily: 'Booking is open daily {wStart}–{wEnd} (Israel time).',
  phEmailYou: 'you@example.com',
  notEnrolledYet: 'Not enrolled yet?',
  enrollHere: 'Enroll here',
  quickEnrollTitle: 'Quick enrollment',
  quickEnrollHelper: "We don't recognize this email yet. Enter your name and code to continue.",
  errCodeInstructor: 'Enter the code from your instructor',
  chooseTime: 'Choose a time',
  tomorrowDate: 'Tomorrow · {date}',
  eachLessonArrive: 'Each lesson is {duration} minutes · please arrive 5 minutes early.',
  bookingClosed:
    "Booking is closed right now. It opens daily at {wStart} (Israel time). Please come back then to book tomorrow's lesson.",
  checkingAvailability: 'Checking availability…',
  noClassesTomorrow: 'No classes tomorrow — the school is closed on {day}. Please check back on a working day.',
  allBooked: 'No available times for tomorrow — every slot is booked. Please try again later.',
  youreBooking: "You're booking a lesson for",
  changeTime: 'Change time',
  confirmBooking: 'Confirm booking',
  lessonBooked: 'Lesson booked',
  seeYou: 'See you {date} at {time}.',
  reminderLine: "We'll send you a reminder before your lesson.",
  bookAnother: 'Book another lesson',
  backToHome: 'Back to home',
  myAccountLessons: 'My account & lessons',

  studentAccount: 'Student account',
  signInTo: 'Sign in to {name}',
  signInHelper: 'Enter the email you enrolled with — no code needed.',
  signIn: 'Sign in',
  newStudent: 'New student?',
  enrollWithCode: 'Enroll with your code',
  loadingAccount: 'Loading your account…',
  accountLoadError: "We couldn't load your account. Please try again.",
  retry: 'Try again',
  welcomeBackEyebrow: 'Welcome back',
  signOut: 'Sign out',
  tabLessons: 'Lessons',
  tabChat: 'Chat',
  tabProfile: 'Profile',
  loadingLessons: 'Loading your lessons…',
  yourNextLesson: 'Your next lesson',
  contactToCancel: 'To change or cancel a lesson, contact your instructor.',
  noUpcoming: 'You have no upcoming lessons. Book your next one below.',
  statCompleted: 'Completed',
  statUpcoming: 'Upcoming',
  statTotal: 'Total lessons',
  laterLessons: 'Later lessons',
  upcomingTitle: 'Upcoming lessons',
  progressTitle: 'Your progress',
  readinessTitle: 'Readiness',
  hoursDriven: 'Hours driven',
  lessonsCompleted: 'Lessons done',
  lessonsBooked: 'Booked',
  historyTitle: 'Lesson history',
  historyEmpty: 'Your completed lessons will appear here.',
  lessonCompleted: 'Completed',
  lessonCancelled: 'Cancelled',
  eachLessonMin: 'Each lesson is {duration} min.',
  chatHeading: 'Chat with your instructor',
  chatHelper: 'Ask a question, reschedule, or say hello. Replies appear here.',
  loadingMessages: 'Loading messages…',
  chatEmpty: 'No messages yet. Start the conversation below.',
  phMessage: 'Type a message…',
  send: 'Send',
  yourDetails: 'Your details',
  nameLabel: 'Name',
  phoneHint: 'The number your instructor uses to reach you.',
  profileUpdated: 'Profile updated',
  saveChanges: 'Save changes',

  rating: 'Rating',
  star1: '1 star',
  starN: '{n} stars',
  thankYou: 'Thank you!',
  reviewSentSub: "Your review was sent to {name} and will appear on the site once it's approved.",
  backToSite: 'Back to the site',
  studentReview: 'Student review',
  reviewTitle: 'How was your experience with {name}?',
  reviewHelper: 'Your review helps other learners choose their instructor.',
  errComment: 'Please write a few words about your experience',
  yourName: 'Your name',
  yourReview: 'Your review',
  phReview: 'What was learning to drive here like?',
  sendReview: 'Send review',
};

const he: BookStrings = {
  loading: 'טוען…',
  schoolNotFound: 'בית הספר לא נמצא',
  notFoundEnroll: 'ייתכן שקישור ההרשמה שגוי או שאינו פעיל יותר.',
  notFoundBook: 'ייתכן שקישור ההזמנה שגוי או שאינו פעיל יותר.',
  notFoundAccount: 'ייתכן שהקישור שגוי או שאינו פעיל יותר.',
  notFoundReview: 'ייתכן שקישור הביקורת שגוי או שאינו פעיל יותר.',
  shellHome: 'דף הבית',
  shellBrandFallback: 'בית ספר לנהיגה',
  poweredBy: 'מופעל על ידי',
  emailLabel: 'אימייל',
  phoneLabel: 'טלפון',
  fullName: 'שם מלא',
  phName: 'ישראל ישראלי',
  phEmail: 'jane@example.com',
  phPhone: '+972 50 123 4567',
  enrollmentCode: 'קוד הרשמה',
  phCode: 'לדוגמה DRIVE2026',
  bookLesson: 'הזמנת שיעור',
  goToAccount: 'לאזור האישי שלי',
  continue: 'המשך',
  back: 'חזרה',
  errName: 'נא להזין את השם שלכם',
  errPhone: 'נא להזין מספר טלפון תקין',
  errEmail: 'נא להזין אימייל תקין',
  arriveEarly: 'נא להגיע 5 דקות לפני.',
  minShort: 'דק׳',
  installApp: 'התקנת אפליקציה',
  installHintIos: 'הקישו על כפתור השיתוף ואז על ״הוספה למסך הבית״.',

  enrolledTitle: 'נרשמת בהצלחה',
  alreadyEnrolledTitle: 'כבר נרשמת',
  enrolledSub: 'ברוכים הבאים ל{name}. אפשר להזמין שיעור אונליין מתי שנוח לך.',
  alreadyEnrolledSub: 'האימייל הזה כבר רשום. אפשר לעבור ישירות להזמנת השיעור הבא.',
  enrollEyebrow: 'הרשמת תלמיד',
  enrollTitle: 'הרשמה ל{name}',
  enrollHelper: 'הזינו את הפרטים ואת הקוד שקיבלתם מהמורה כדי להתחיל.',
  errCodeShort: 'קוד ההרשמה נראה קצר מדי',
  enroll: 'הרשמה',
  alreadyEnrolledQ: 'כבר נרשמת?',

  welcomeBack: 'ברוכים השבים!',
  linkExpired: 'קישור ההזמנה פג. נא להזין את האימייל שלכם.',
  enrollmentPaused: 'ההרשמה שלכם מושהית. נא לפנות למורה.',
  bookTitle: 'הזמנת השיעור הבא',
  bookHelper: 'שיעורים מוזמנים ליום המחרת. הזינו את האימייל שאיתו נרשמתם כדי להתחיל.',
  windowOpenDaily: 'ההזמנה פתוחה מדי יום {wStart}–{wEnd} (שעון ישראל).',
  phEmailYou: 'you@example.com',
  notEnrolledYet: 'עדיין לא נרשמת?',
  enrollHere: 'להרשמה כאן',
  quickEnrollTitle: 'הרשמה מהירה',
  quickEnrollHelper: 'עדיין לא מזהים את האימייל הזה. הזינו שם וקוד כדי להמשיך.',
  errCodeInstructor: 'הזינו את הקוד שקיבלתם מהמורה',
  chooseTime: 'בחירת שעה',
  tomorrowDate: 'מחר · {date}',
  eachLessonArrive: 'כל שיעור אורך {duration} דקות · נא להגיע 5 דקות לפני.',
  bookingClosed: 'ההזמנה סגורה כרגע. היא נפתחת מדי יום ב-{wStart} (שעון ישראל). חזרו אז כדי להזמין את שיעור המחר.',
  checkingAvailability: 'בודקים זמינות…',
  noClassesTomorrow: 'אין שיעורים מחר — בית הספר סגור ביום {day}. חזרו ביום פעילות.',
  allBooked: 'אין שעות פנויות למחר — כל השיעורים תפוסים. נסו שוב מאוחר יותר.',
  youreBooking: 'אתם מזמינים שיעור ל',
  changeTime: 'שינוי שעה',
  confirmBooking: 'אישור הזמנה',
  lessonBooked: 'השיעור הוזמן',
  seeYou: 'נתראה {date} בשעה {time}.',
  reminderLine: 'נשלח לכם תזכורת לפני השיעור.',
  bookAnother: 'הזמנת שיעור נוסף',
  backToHome: 'חזרה לדף הבית',
  myAccountLessons: 'האזור האישי והשיעורים שלי',

  studentAccount: 'אזור התלמיד',
  signInTo: 'כניסה ל{name}',
  signInHelper: 'הזינו את האימייל שאיתו נרשמתם — בלי צורך בקוד.',
  signIn: 'כניסה',
  newStudent: 'תלמיד חדש?',
  enrollWithCode: 'הרשמה עם הקוד שלכם',
  loadingAccount: 'טוען את האזור שלך…',
  accountLoadError: 'לא הצלחנו לטעון את החשבון שלך. נסו שוב.',
  retry: 'נסו שוב',
  welcomeBackEyebrow: 'ברוכים השבים',
  signOut: 'התנתקות',
  tabLessons: 'שיעורים',
  tabChat: 'צ׳אט',
  tabProfile: 'פרופיל',
  loadingLessons: 'טוען את השיעורים שלך…',
  yourNextLesson: 'השיעור הבא שלך',
  contactToCancel: 'כדי לשנות או לבטל שיעור, פנו למורה שלכם.',
  noUpcoming: 'אין לך שיעורים קרובים. הזמינו את השיעור הבא למטה.',
  statCompleted: 'הושלמו',
  statUpcoming: 'קרובים',
  statTotal: 'סה״כ שיעורים',
  laterLessons: 'שיעורים נוספים',
  upcomingTitle: 'שיעורים קרובים',
  progressTitle: 'ההתקדמות שלך',
  readinessTitle: 'מוכנות',
  hoursDriven: 'שעות נהיגה',
  lessonsCompleted: 'שיעורים שהושלמו',
  lessonsBooked: 'הוזמנו',
  historyTitle: 'היסטוריית שיעורים',
  historyEmpty: 'השיעורים שהשלמת יופיעו כאן.',
  lessonCompleted: 'הושלם',
  lessonCancelled: 'בוטל',
  eachLessonMin: 'כל שיעור אורך {duration} דקות.',
  chatHeading: 'צ׳אט עם המורה שלך',
  chatHelper: 'שאלו שאלה, תאמו מחדש או פשוט תגידו שלום. התשובות יופיעו כאן.',
  loadingMessages: 'טוען הודעות…',
  chatEmpty: 'אין עדיין הודעות. התחילו את השיחה למטה.',
  phMessage: 'הקלידו הודעה…',
  send: 'שליחה',
  yourDetails: 'הפרטים שלך',
  nameLabel: 'שם',
  phoneHint: 'המספר שדרכו המורה יוצר איתך קשר.',
  profileUpdated: 'הפרופיל עודכן',
  saveChanges: 'שמירת שינויים',

  rating: 'דירוג',
  star1: 'כוכב אחד',
  starN: '{n} כוכבים',
  thankYou: 'תודה!',
  reviewSentSub: 'הביקורת שלך נשלחה ל{name} ותופיע באתר לאחר אישורה.',
  backToSite: 'חזרה לאתר',
  studentReview: 'ביקורת תלמיד',
  reviewTitle: 'איך הייתה החוויה שלך עם {name}?',
  reviewHelper: 'הביקורת שלך עוזרת ללומדים אחרים לבחור מורה.',
  errComment: 'נא לכתוב כמה מילים על החוויה שלכם',
  yourName: 'השם שלך',
  yourReview: 'הביקורת שלך',
  phReview: 'איך היה ללמוד לנהוג כאן?',
  sendReview: 'שליחת ביקורת',
};

const ar: BookStrings = {
  loading: 'جارٍ التحميل…',
  schoolNotFound: 'المدرسة غير موجودة',
  notFoundEnroll: 'قد يكون رابط التسجيل غير صحيح أو لم يعد فعّالاً.',
  notFoundBook: 'قد يكون رابط الحجز غير صحيح أو لم يعد فعّالاً.',
  notFoundAccount: 'قد يكون الرابط غير صحيح أو لم يعد فعّالاً.',
  notFoundReview: 'قد يكون رابط التقييم غير صحيح أو لم يعد فعّالاً.',
  shellHome: 'الرئيسية',
  shellBrandFallback: 'مدرسة قيادة',
  poweredBy: 'مشغّل بواسطة',
  emailLabel: 'البريد الإلكتروني',
  phoneLabel: 'الهاتف',
  fullName: 'الاسم الكامل',
  phName: 'محمد أحمد',
  phEmail: 'jane@example.com',
  phPhone: '+972 50 123 4567',
  enrollmentCode: 'رمز التسجيل',
  phCode: 'مثال DRIVE2026',
  bookLesson: 'احجز درساً',
  goToAccount: 'الذهاب إلى حسابي',
  continue: 'متابعة',
  back: 'رجوع',
  errName: 'الرجاء إدخال اسمك',
  errPhone: 'الرجاء إدخال رقم هاتف صحيح',
  errEmail: 'الرجاء إدخال بريد إلكتروني صحيح',
  arriveEarly: 'الرجاء الحضور قبل 5 دقائق.',
  minShort: 'د',
  installApp: 'تثبيت التطبيق',
  installHintIos: 'اضغط زر المشاركة ثم اختر «أضف إلى الشاشة الرئيسية».',

  enrolledTitle: 'تم تسجيلك',
  alreadyEnrolledTitle: 'أنت مسجّل بالفعل',
  enrolledSub: 'مرحباً بك في {name}. يمكنك حجز درس عبر الإنترنت متى ما ناسبك.',
  alreadyEnrolledSub: 'هذا البريد مسجّل بالفعل. يمكنك الانتقال مباشرة لحجز درسك التالي.',
  enrollEyebrow: 'تسجيل الطالب',
  enrollTitle: 'التسجيل في {name}',
  enrollHelper: 'أدخل بياناتك والرمز الذي أعطاك إياه مدرّبك للبدء.',
  errCodeShort: 'رمز التسجيل يبدو قصيراً جداً',
  enroll: 'تسجيل',
  alreadyEnrolledQ: 'مسجّل بالفعل؟',

  welcomeBack: 'مرحباً بعودتك!',
  linkExpired: 'انتهت صلاحية رابط الحجز. الرجاء إدخال بريدك الإلكتروني.',
  enrollmentPaused: 'تسجيلك متوقّف مؤقتاً. الرجاء التواصل مع مدرّبك.',
  bookTitle: 'احجز درسك التالي',
  bookHelper: 'تُحجز الدروس لليوم التالي. أدخل البريد الذي سجّلت به للبدء.',
  windowOpenDaily: 'الحجز مفتوح يومياً {wStart}–{wEnd} (توقيت إسرائيل).',
  phEmailYou: 'you@example.com',
  notEnrolledYet: 'لم تسجّل بعد؟',
  enrollHere: 'سجّل من هنا',
  quickEnrollTitle: 'تسجيل سريع',
  quickEnrollHelper: 'لا نتعرّف على هذا البريد بعد. أدخل اسمك ورمزك للمتابعة.',
  errCodeInstructor: 'أدخل الرمز الذي حصلت عليه من مدرّبك',
  chooseTime: 'اختر وقتاً',
  tomorrowDate: 'غداً · {date}',
  eachLessonArrive: 'مدة كل درس {duration} دقيقة · الرجاء الحضور قبل 5 دقائق.',
  bookingClosed: 'الحجز مغلق الآن. يفتح يومياً عند {wStart} (توقيت إسرائيل). عد حينها لحجز درس الغد.',
  checkingAvailability: 'جارٍ التحقق من التوفّر…',
  noClassesTomorrow: 'لا دروس غداً — المدرسة مغلقة يوم {day}. عد في يوم عمل.',
  allBooked: 'لا أوقات متاحة غداً — كل المواعيد محجوزة. حاول مرة أخرى لاحقاً.',
  youreBooking: 'أنت تحجز درساً ليوم',
  changeTime: 'تغيير الوقت',
  confirmBooking: 'تأكيد الحجز',
  lessonBooked: 'تم حجز الدرس',
  seeYou: 'نراك {date} في {time}.',
  reminderLine: 'سنرسل لك تذكيراً قبل درسك.',
  bookAnother: 'حجز درس آخر',
  backToHome: 'العودة إلى الرئيسية',
  myAccountLessons: 'حسابي ودروسي',

  studentAccount: 'حساب الطالب',
  signInTo: 'تسجيل الدخول إلى {name}',
  signInHelper: 'أدخل البريد الذي سجّلت به — لا حاجة لرمز.',
  signIn: 'تسجيل الدخول',
  newStudent: 'طالب جديد؟',
  enrollWithCode: 'سجّل برمزك',
  loadingAccount: 'جارٍ تحميل حسابك…',
  accountLoadError: 'تعذّر تحميل حسابك. يُرجى المحاولة مرة أخرى.',
  retry: 'حاول مرة أخرى',
  welcomeBackEyebrow: 'مرحباً بعودتك',
  signOut: 'تسجيل الخروج',
  tabLessons: 'الدروس',
  tabChat: 'المحادثة',
  tabProfile: 'الملف الشخصي',
  loadingLessons: 'جارٍ تحميل دروسك…',
  yourNextLesson: 'درسك التالي',
  contactToCancel: 'لتغيير درس أو إلغائه، تواصل مع مدرّبك.',
  noUpcoming: 'ليس لديك دروس قادمة. احجز درسك التالي في الأسفل.',
  statCompleted: 'مكتملة',
  statUpcoming: 'قادمة',
  statTotal: 'إجمالي الدروس',
  laterLessons: 'دروس لاحقة',
  upcomingTitle: 'الدروس القادمة',
  progressTitle: 'تقدّمك',
  readinessTitle: 'الجاهزية',
  hoursDriven: 'ساعات القيادة',
  lessonsCompleted: 'دروس مكتملة',
  lessonsBooked: 'محجوزة',
  historyTitle: 'سجلّ الدروس',
  historyEmpty: 'ستظهر دروسك المكتملة هنا.',
  lessonCompleted: 'مكتمل',
  lessonCancelled: 'ملغى',
  eachLessonMin: 'مدة كل درس {duration} دقيقة.',
  chatHeading: 'المحادثة مع مدرّبك',
  chatHelper: 'اطرح سؤالاً، أعد الجدولة، أو ألقِ التحية. تظهر الردود هنا.',
  loadingMessages: 'جارٍ تحميل الرسائل…',
  chatEmpty: 'لا رسائل بعد. ابدأ المحادثة في الأسفل.',
  phMessage: 'اكتب رسالة…',
  send: 'إرسال',
  yourDetails: 'بياناتك',
  nameLabel: 'الاسم',
  phoneHint: 'الرقم الذي يستخدمه مدرّبك للتواصل معك.',
  profileUpdated: 'تم تحديث الملف الشخصي',
  saveChanges: 'حفظ التغييرات',

  rating: 'التقييم',
  star1: 'نجمة واحدة',
  starN: '{n} نجوم',
  thankYou: 'شكراً لك!',
  reviewSentSub: 'تم إرسال تقييمك إلى {name} وسيظهر على الموقع بعد الموافقة عليه.',
  backToSite: 'العودة إلى الموقع',
  studentReview: 'تقييم الطالب',
  reviewTitle: 'كيف كانت تجربتك مع {name}؟',
  reviewHelper: 'تقييمك يساعد المتعلّمين الآخرين على اختيار مدرّبهم.',
  errComment: 'الرجاء كتابة بضع كلمات عن تجربتك',
  yourName: 'اسمك',
  yourReview: 'تقييمك',
  phReview: 'كيف كان تعلّم القيادة هنا؟',
  sendReview: 'إرسال التقييم',
};

export const BOOKING_STRINGS: Record<BookLocale, BookStrings> = { en, he, ar };

/** Interpolate `{var}` placeholders (same pattern as templates/strings.ts `fmt`). */
function fmt(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
}

/** Localized lookup with `{var}` interpolation. Unknown locale → English. */
export function bookT(
  locale: BookLocale,
  key: keyof BookStrings,
  vars?: Record<string, string | number>
): string {
  const dict = BOOKING_STRINGS[locale] ?? BOOKING_STRINGS.en;
  return fmt(dict[key] ?? BOOKING_STRINGS.en[key], vars);
}
