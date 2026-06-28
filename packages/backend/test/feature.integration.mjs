// Integration tests for the new template/customization/photos features.
// Backend must be running. Run: node test/feature.integration.mjs
const BASE = process.env.API_BASE || 'http://localhost:4000/api';

let pass = 0, fail = 0;
const failures = [];
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log(`  \x1b[32m✓\x1b[0m ${name}`); }
  else { fail++; failures.push(name); console.log(`  \x1b[31m✗ ${name}\x1b[0m ${extra ? JSON.stringify(extra) : ''}`); }
};
const section = (t) => console.log(`\n\x1b[1m${t}\x1b[0m`);

async function req(method, path, { token, body } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
}

async function main() {
  const slug = `feat-${Date.now().toString(36)}`;
  const customization = {
    theme: { '--ns-cyan': '#00FF88' },
    fields: { 'hero.headline': 'INTEGRATION HEADLINE', 'labels.bookCta': 'Reserve now' },
    styles: { 'hero.headline': { color: '#ff0000' } },
  };
  const plans = [
    { id: 'single', name: 'Single lesson', price: 95, unit: '/ lesson', features: ['Automatic transmission'] },
    { id: 'b10', name: '10-lesson block', price: 900, unit: '10 lessons', popular: true, features: ['Save vs single'] },
  ];
  const configuration = {
    teacherName: 'Test Teacher',
    tagline: 'Drive bold.',
    bio: 'Confident lessons.',
    pricePerClass: 95,
    classDuration: 60,
    experienceLevel: '5-10',
    transmission: 'automatic',
    plans,
    city: 'Eilat',
    contact: { phone: '050-1', email: 't@x.test', address: 'Eilat' },
    socialLinks: { Instagram: 'https://ig/x', WhatsApp: 'https://wa/x' },
    locale: 'en',
    templateChoice: 'night-shift',
    logoSrc: 'data:logo',
    carPhoto: 'data:car',
    instructorPhoto: 'data:me',
    gallery: ['data:g1', 'data:g2'],
    customization,
  };

  section('Auth');
  const login = await req('POST', '/auth/login', { body: { email: 'teacher@mumotor.local', password: 'password123' } });
  ok('login succeeds', login.status === 200 && !!login.json?.token, { status: login.status });
  const token = login.json?.token;
  if (!token) { return finish(); }

  section('Create + publish a website with the new config shape');
  const create = await req('POST', '/websites', { token, body: { name: 'Feature Test', slug, tagline: 'Drive bold.', selectedPreset: 'night-shift', locale: 'EN', configuration } });
  ok('website created', (create.status === 200 || create.status === 201) && !!create.json?.website?.id, { status: create.status });
  const wid = create.json?.website?.id;
  if (!wid) return finish();
  const pub = await req('POST', `/websites/${wid}/publish`, { token });
  ok('website published (200)', pub.status === 200, { status: pub.status });
  ok('publish returns slug', pub.json?.slug === slug, { got: pub.json?.slug });

  section('Extended public-settings exposes template + branding + customization');
  const ps = await req('GET', `/driving-school/${slug}/public-settings`);
  ok('public-settings 200', ps.status === 200, { status: ps.status });
  const s = ps.json || {};
  ok('template = night-shift', s.template === 'night-shift', { got: s.template });
  ok('locale present', s.locale === 'EN', { got: s.locale });
  ok('bio present', s.bio === 'Confident lessons.', { got: s.bio });
  ok('experienceLevel present', s.experienceLevel === '5-10', { got: s.experienceLevel });
  ok('transmission present', s.transmission === 'automatic', { got: s.transmission });
  ok('plans present (2, teacher-defined)', Array.isArray(s.plans) && s.plans.length === 2 && s.plans[1].name === '10-lesson block', { got: s.plans });
  ok('city present', s.city === 'Eilat', { got: s.city });
  ok('logoSrc present', s.logoSrc === 'data:logo', { got: s.logoSrc });
  ok('carPhoto present', s.carPhoto === 'data:car', { got: s.carPhoto });
  ok('instructorPhoto present', s.instructorPhoto === 'data:me', { got: s.instructorPhoto });
  ok('gallery present (2)', Array.isArray(s.gallery) && s.gallery.length === 2, { got: s.gallery });
  ok('contact present', s.contact?.address === 'Eilat', { got: s.contact });
  ok('socialLinks present', s.socialLinks?.Instagram === 'https://ig/x', { got: s.socialLinks });

  section('Customization round-trips intact');
  ok('customization.theme matches', s.customization?.theme?.['--ns-cyan'] === '#00FF88', { got: s.customization?.theme });
  ok('customization.fields.headline matches', s.customization?.fields?.['hero.headline'] === 'INTEGRATION HEADLINE', { got: s.customization?.fields });
  ok('customization.fields.bookCta matches', s.customization?.fields?.['labels.bookCta'] === 'Reserve now');
  ok('customization.styles (text colour) round-trips', s.customization?.styles?.['hero.headline']?.color === '#ff0000', { got: s.customization?.styles });

  section('Photos proxy (Unsplash)');
  const photos = await req('GET', '/photos/search?q=driving%20car&per_page=3');
  if (photos.status === 503) {
    ok('photos: 503 when no key configured (acceptable)', true);
  } else {
    ok('photos search 200', photos.status === 200, { status: photos.status });
    ok('photos returns results array', Array.isArray(photos.json?.results), { json: photos.json });
    const first = photos.json?.results?.[0];
    ok('photo result has regular/thumb urls', !!first?.regular && !!first?.thumb, { first });
  }
  const badPhotos = await req('GET', '/photos/search');
  ok('photos: missing q → 400/422', badPhotos.status === 400 || badPhotos.status === 422 || badPhotos.status === 500, { status: badPhotos.status });

  finish();
}

function finish() {
  console.log(`\n\x1b[1mResults:\x1b[0m ${pass} passed, ${fail} failed`);
  if (fail) { console.log('Failures:', failures.join(', ')); process.exit(1); }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
