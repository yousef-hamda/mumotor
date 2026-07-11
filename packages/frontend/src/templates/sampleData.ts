import type { TemplateData } from './types';

/**
 * Real Unsplash photography (driving lessons, cars, roads, instructors) so the
 * templates look like real sites — never the generic AI-art look.
 * URLs are the direct CDN links returned by the Unsplash MCP.
 */
export const IMG = {
  womanDriving: 'https://images.unsplash.com/photo-1527593167147-e9c94a5883e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  lessonTwoUp: 'https://images.unsplash.com/photo-1537211790624-e6f568af4b13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  manWomanCar: 'https://images.unsplash.com/photo-1667020854803-0305af085242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  daytimeDrive: 'https://images.unsplash.com/photo-1596649714492-a8f90ecb3776?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  audiRoad: 'https://images.unsplash.com/photo-1523821393989-a61a1f006c8b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  roadTrees: 'https://images.unsplash.com/photo-1486673748761-a8d18475c757?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  yellowLines: 'https://images.unsplash.com/photo-1593571560705-aeb8f2e978f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  wideRoad: 'https://images.unsplash.com/photo-1592191169553-647a75802834?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  forestRoad: 'https://images.unsplash.com/photo-1567135290908-a157adfbbccf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  handWheel: 'https://images.unsplash.com/photo-1615563164538-89e1da13fcc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  winterTrip: 'https://images.unsplash.com/photo-1550517636-ad7bac40dc28?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  forestDrive: 'https://images.unsplash.com/photo-1524114051012-0a2aa8dae4e1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
  instructor: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200',
  reviewerWoman: 'https://images.unsplash.com/photo-1653511386010-a283d6c6dcc4?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200',
  reviewerMan: 'https://images.unsplash.com/photo-1639747279286-c07eecb47a0b?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200',
  reviewerMan2: 'https://images.unsplash.com/photo-1769636929354-59165ba73c7e?crop=faces&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=200&h=200',
} as const;

/** Realistic demo driving-school content shared by every template. */
export const sampleData: TemplateData = {
  business: {
    name: 'Northgate Driving School',
    tagline: 'Pass first time, drive for life.',
    logoText: 'Northgate',
  },
  instructor: {
    name: 'David Mercer',
    title: 'Certified driving instructor · 14 years',
    bio: 'I started Northgate because learning to drive should feel calm, not scary. Every lesson is one-to-one, fully insured and paced exactly to you — whether it is your very first time behind the wheel or a confidence refresher before your test.',
    photo: IMG.instructor,
    credentials: ['Certified driving instructor', 'Patient & professional', 'Manual & Automatic', 'Fully insured dual-control car'],
  },
  hero: {
    eyebrow: 'Driving lessons in Northgate',
    headline: 'Learn to drive with someone who actually keeps you calm.',
    sub: 'One-to-one lessons, a 96% first-time pass rate, and a dual-control car that does the worrying for you. Book your first lesson in under a minute.',
    image: IMG.womanDriving,
    ctaPrimary: 'Book a first lesson',
    ctaSecondary: 'See packages',
  },
  stats: [
    { label: 'First-time pass rate', value: 96, suffix: '%' },
    { label: 'Drivers taught', value: 1200, suffix: '+' },
    { label: 'Years on the road', value: 14 },
    { label: 'Average rating', value: 4.9 },
  ],
  packages: [
    {
      id: 'single',
      name: 'Pay-as-you-go',
      price: 45,
      unit: '/ lesson',
      duration: 60,
      features: ['Single 60-min lesson', 'Manual or automatic', 'Door-to-door pickup', 'No commitment'],
    },
    {
      id: 'test-ready',
      name: 'Test Ready',
      price: 420,
      unit: '10 lessons',
      lessons: 10,
      duration: 60,
      popular: true,
      badge: 'Most popular',
      features: ['10 × 60-min lessons', 'Mock test included', 'Theory support app', 'Save ₪30 vs single lessons', 'Flexible rescheduling'],
    },
    {
      id: 'intensive',
      name: 'Intensive + Test',
      price: 890,
      unit: '20 lessons',
      lessons: 20,
      duration: 60,
      features: ['20 × 60-min lessons', 'Practical test fee paid', 'Pass Plus session', 'Priority weekend slots', 'Use of car for your test'],
    },
  ],
  about: {
    heading: 'Calm, patient, and on your side',
    body: [
      'No shouting, no clipboard energy. Just clear, steady guidance from someone who has helped over 1,200 people earn their licence.',
      'Lessons are tailored to you — nervous beginner or test-ready, manual or automatic. We go at your pace and celebrate the small wins.',
    ],
    image: IMG.lessonTwoUp,
    checklist: [
      'One-to-one, never doubled-up',
      'Pickup from home, work or college',
      'Dual-control, fully insured car',
      'Honest feedback after every lesson',
    ],
  },
  areas: [
    { name: 'Northgate', note: 'Home base' },
    { name: 'Riverside' },
    { name: 'Elmwood' },
    { name: 'Castle Hill' },
    { name: 'Greenfields' },
    { name: 'Old Town' },
    { name: 'Harbour End' },
    { name: 'Kingsway' },
  ],
  reviews: [
    {
      id: 'r1',
      name: 'Sophie T.',
      rating: 5,
      meta: 'Passed first time · Manual',
      text: 'I was terrified of driving and David made it genuinely fun. Passed first time with two minors. Cannot recommend enough.',
      avatar: IMG.reviewerWoman,
    },
    {
      id: 'r2',
      name: 'Marcus L.',
      rating: 5,
      meta: 'Intensive course · Automatic',
      text: 'Did the intensive course around work shifts. Super flexible, calm under pressure, and the mock test was spot on.',
      avatar: IMG.reviewerMan,
    },
    {
      id: 'r3',
      name: 'Jordan A.',
      rating: 5,
      meta: 'Test Ready · 10 lessons',
      text: 'Switched from another school after months of going nowhere. Three weeks with Northgate and I was test-ready. Night and day.',
      avatar: IMG.reviewerMan2,
    },
  ],
  faqs: [
    { q: 'Do you teach manual and automatic?', a: 'Both. We run a manual dual-control car and an automatic — just tell us which you want when you book and we will match you to the right car.' },
    { q: 'How quickly can I get my first lesson?', a: 'Most new learners are on the road within 3–4 days. Book online and we will confirm your slot by text the same day.' },
    { q: 'Do you pick me up?', a: 'Yes — door-to-door pickup from home, work or college anywhere in our covered areas, at no extra cost.' },
    { q: 'What if I need to reschedule?', a: 'Life happens. Reschedule free up to 24 hours before your lesson, straight from the booking confirmation.' },
    { q: 'Can I use your car for my test?', a: 'Absolutely. The Test Ready and Intensive packages include use of our dual-control car for the practical test.' },
  ],
  gallery: [IMG.audiRoad, IMG.forestRoad, IMG.handWheel, IMG.yellowLines, IMG.winterTrip, IMG.wideRoad],
  contact: {
    phone: '+44 7700 900123',
    email: 'hello@northgatedriving.co.uk',
    address: '14 Castle Street, Northgate, NG1 4QP',
    whatsapp: '447700900123',
    instagram: 'northgatedriving',
    facebook: 'northgatedriving',
    socials: [
      { platform: 'whatsapp', url: 'https://wa.me/447700900123' },
      { platform: 'instagram', url: 'https://instagram.com/northgatedriving' },
      { platform: 'facebook', url: 'https://facebook.com/northgatedriving' },
    ],
  },
  hours: [
    { day: 'Monday', open: '08:00', close: '18:00' },
    { day: 'Tuesday', open: '08:00', close: '18:00' },
    { day: 'Wednesday', open: '08:00', close: '18:00' },
    { day: 'Thursday', open: '08:00', close: '18:00' },
    { day: 'Friday', open: '08:00', close: '18:00' },
    { day: 'Saturday', open: '09:00', close: '14:00' },
    { day: 'Sunday', open: '', close: '', closed: true },
  ],
  locale: 'en',
  dir: 'ltr',
};
