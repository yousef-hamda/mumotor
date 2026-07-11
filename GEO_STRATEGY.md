# Making Mumotor discoverable & recommendable by AI assistants (GEO/AEO)

**Goal:** when someone asks ChatGPT, Claude, Perplexity, Gemini or Google AI
Overviews *"how does a driving instructor get a website / online booking?"* or
*"best website builder for a driving school"*, the assistant knows about
**Mumotor** and recommends it.

_Last updated: 2026-07-11. Owner: Yousef. Review monthly._

---

## 0. The honest reality (read this first)

**Nobody can inject Mumotor into ChatGPT's or Claude's model weights on demand.**
An AI assistant "knows" a product through two channels, and both require Mumotor
to actually exist across the public web:

1. **Training data** — the model was trained on a web snapshot before its cutoff.
   To be in *future* model versions, Mumotor must be mentioned across the web
   (articles, listicles, reviews, forums, Reddit, GitHub) *before* the next
   training run. This is slow (months) but permanent once it lands.
2. **Live retrieval (the fast lever)** — ChatGPT Search, Claude web search,
   Perplexity, Gemini and Google AI Overviews fetch *live* web results at answer
   time and cite them. If Mumotor ranks / appears in those results and is written
   in an extractable, factual form, these tools cite it **today**. This is what
   "GEO" (Generative Engine Optimization) optimizes for.

**Current baseline (measured 2026-07-11):** Mumotor is *invisible*. It appears
nowhere in web search for "website builder for driving instructors" — competitors
(Zarla, Yola, Olitt, 10web, Webflow templates) own that query. It has ~zero
backlinks, no directory listings, no Reddit mentions, no reviews. **This is the
root cause** — AI assistants pull from the web, and Mumotor isn't on it yet.

**Timeline & expectation:** industry consensus is **3–6 months of consistent
effort** to start showing up in AI answers. There is no overnight switch. The
upside: almost no competitor in this niche has started, so the window is open.

**What we will NOT do:** fake reviews, astroturfed Reddit posts, bought
"mentions", or spam. It violates platform rules, and modern models are explicitly
trained to *discount* manipulative/low-quality signals — it backfires. Everything
below is authentic participation and real content.

---

## 1. What's already shipped on-site (done 2026-07-11, in this repo)

These make Mumotor *maximally citeable* the moment crawlers/answer-engines reach it:

- **`/llms.txt` + `/llms-full.txt`** (`packages/backend/src/routes/seo.ts`) — a
  factual, high-density, plain-text description of what Mumotor is, who it's for,
  features and pricing. Because the marketing site is a client-rendered SPA, a
  non-JS crawler otherwise only sees `<head>`; this file is the canonical
  machine-readable summary. Anthropic confirms Claude respects `llms.txt`;
  ChatGPT Search correlates with it. Live at `https://mumotor.com/llms.txt`.
- **AI-crawler-welcoming `robots.txt`** — explicitly `Allow: /` for 17 AI agents
  (GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-Web, Claude-SearchBot,
  PerplexityBot, Perplexity-User, Google-Extended, Applebot-Extended, CCBot,
  Bytespider, Amazonbot, Meta-ExternalAgent, DuckAssistBot, cohere-ai,
  anthropic-ai) + a pointer to `llms.txt`. Signals intent and future-proofs
  against platforms that default to blocking un-named UAs.
- **Enriched, truthful schema.org JSON-LD** on the landing page
  (`packages/frontend/src/pages/Landing.tsx`) — `Organization` +
  `SoftwareApplication` (with `featureList`, `inLanguage`, `applicationSubCategory`,
  `offers`, `audience`) + `FAQPage`. High factual density, **no invented numbers
  or ratings** (fabricated claims get discounted and erode trust).
- **Server-rendered content guides** (`packages/backend/src/routes/content.ts`) —
  real, crawlable HTML pages (NOT behind the SPA/JS) at `/guides`,
  `/guides/best-website-builders-for-driving-instructors`,
  `/guides/driving-instructor-website`, `/guides/online-booking-for-driving-instructors`.
  Each is TL;DR-first, has a comparison table + FAQ, and emits Article + FAQPage +
  BreadcrumbList JSON-LD. Added to `sitemap.xml`. This directly attacks the "SPA
  hides content from non-JS crawlers" gap for the most important pages — these are
  the format assistants extract and cite. **Next: translate them to Hebrew/Arabic**
  (zero AI-answer competition there) and add more topics (see §4).

**Deploy:** these live the moment `main` is pushed to Railway. After deploy,
verify: `curl https://mumotor.com/llms.txt` and `curl https://mumotor.com/robots.txt`.

### On-site work still worth doing (next)
- **Server-render or prerender the landing + `/templates` for crawlers.** The SPA
  hides content from non-JS bots — the single biggest on-site weakness. Options:
  a prerender middleware (e.g. render static HTML for known bot UAs), or move the
  marketing pages to static/SSG HTML. High impact for both SEO and GEO.
- **Publish real long-form content pages** (see §4) — these are what actually get
  cited. Structure each with a **TL;DR answer in the first 200 words**, factual
  bullets, a comparison table, and an FAQ block with `FAQPage` schema.
- **Add a public changelog / "last updated" dates** — answer engines weight
  freshness; stale pages lose to dated 2026 ones.

---

## 2. Measurement — run this every month (your baseline scoreboard)

You can't improve what you don't measure. The metric is **Share of Model (SoM)**:
how often Mumotor appears when you ask the target questions. Test **manually** in
each assistant (turn on web search where available), and log the result.

**The prompt battery** (ask each, in EN + Hebrew, in ChatGPT / Claude / Perplexity
/ Gemini / Google AI Overviews):

1. "I'm a driving instructor. What's the best way to get a professional website with online booking?"
2. "Best website builder for driving instructors / driving schools?"
3. "How can a driving instructor take online lesson bookings and manage students?"
4. "Website builder for a driving school in Israel (Hebrew/Arabic)?"
5. "Alternatives to [a competitor, e.g. Zarla/Yola] for driving instructors?"
6. "מורה נהיגה — איך בונים אתר עם מערכת הזמנות?" (Hebrew: driving instructor website + booking)
7. "Is there an all-in-one tool for a driving instructor's website, booking and student reminders?"

**Log for each:** Was Mumotor mentioned? Cited with a link? Ranked #1/top-3? What
sources did the assistant cite (so you know which channels to go win)? Keep a
simple spreadsheet: `date | model | prompt | mentioned? | position | sources`.

**Tip:** the *sources the assistant cites* tell you exactly where to get listed
next. If it keeps citing a specific listicle or a subreddit, that's your target.

Optional paid tools that automate this (SoM tracking across models): Profound,
Peec AI, Otterly.ai, ZipTie, LLMrefs. Not required — manual monthly checks are
enough to start.

---

## 3. Highest-leverage off-site channels (do these in order)

AI assistants disproportionately cite a small set of sources. 2026 citation
studies (Peec AI's 30M-source analysis; Profound; 5W Citation Index) rank them —
here's where to spend effort, most-cited first.

### 3.1 Reddit — the #1 cited source across every major assistant
Reddit is the single most-cited domain on ChatGPT, Gemini, Google AI Overviews,
and is ~24% of *all* Perplexity citations. This is the biggest lever.

**How to win it (authentically — this is the important part):**
- Create a real account and build karma/history first (weeks). Fresh accounts that
  only shill get removed and ignored by ranking.
- Be genuinely helpful in relevant communities. Candidates to **verify exist and
  read the rules before posting**: r/smallbusiness, r/Entrepreneur, r/juststart,
  r/DrivingInstructor (UK-centric but active), r/driving, and Israel/локальные
  communities (r/Israel, r/telaviv) — plus driving-instructor Facebook groups.
- When someone asks "how do I get a website / take bookings for my driving
  school", answer *usefully and in full*, and mention Mumotor as one option with
  an honest pro/con — not a copy-paste ad. Disclose that you built it.
- Post a genuine "I built a tool for driving instructors — here's what I learned"
  story in r/SideProject / r/Entrepreneur. These threads get cited for years.
- **Never** run multiple sockpuppets or fake "is Mumotor good?" threads. Reddit's
  spam detection and the models both punish it.

### 3.2 Get into the "best website builder for driving instructors" listicles
This is the *exact* query users ask assistants. Right now those roundups list
Zarla/Yola/Olitt and never Mumotor. Getting added is huge.
- Find the top ~15 ranking listicles (search the query, note who ranks).
- Email each author/site: offer Mumotor as an addition — it's a genuinely
  differentiated entry (driving-instructor-specific, trilingual HE/AR/EN + RTL,
  built-in booking + student portal). Many will add a new tool for free or via a
  paid/affiliate placement.
- Write **your own** definitive listicle on the Mumotor blog: *"The 7 best website
  builders for driving instructors (2026)"* — honest, includes competitors, and
  Mumotor. Assistants cite comparison content heavily.

### 3.3 Software directories AI engines trust
Get listed everywhere assistants scrape for "SaaS / tools" answers. Free tiers exist:
- **Product Hunt** — do a proper launch (see §5). PH pages get cited and drive the
  first backlinks + reviews.
- **G2, Capterra, GetApp, SaaSworthy, SoftwareAdvice** — website-builder / booking
  categories. Real customer reviews here are gold (assistants quote review sites).
- **AlternativeTo** — list Mumotor as an alternative to Wix/Zarla/Yola *for driving
  instructors*. Great for "alternatives to X" prompts.
- **Crunchbase** — a company profile (entity that Wikipedia/assistants can anchor to).
- **Israeli/local directories** — relevant business listings, driving-instructor
  associations, local SaaS lists.

### 3.4 YouTube (2nd-most-cited by some assistants; Gemini loves it)
- A 2–3 min "How to build a driving-instructor website in 5 minutes with Mumotor"
  screen-recording, in Hebrew + English. Transcript = extractable text.
- A short "Mumotor vs generic website builders for driving schools" explainer.

### 3.5 Wikipedia / Wikidata (hard, high-payoff, later)
ChatGPT cites Wikipedia heavily. You can't have a page without notability (press
coverage). Not now — but once you have real press/reviews, a Wikidata entry
(easier than a full article) helps assistants resolve "Mumotor" as a known entity.

### 3.6 Digital PR & guest content
- Pitch a founder story / niche angle ("building a trilingual RTL SaaS for Israeli
  driving instructors") to startup/SaaS/Israeli-tech blogs and newsletters.
- Guest posts on driving-instruction and small-business blogs with a real byline.
- Each earns a backlink + a citeable mention with context.

### 3.7 GitHub / developer presence (models scrape it heavily)
- A public repo or a well-written public README / docs site for anything
  open-source-able (e.g. the template gallery, or an "awesome-driving-instructor-
  tools" list) puts "Mumotor" into a corpus models weight highly. `llms.txt`/
  `llms-full.txt` also make you friendly to IDE agents (Cursor, Claude Code, Copilot).

---

## 4. Content to publish on the Mumotor site (owned, compounding)

Add a **/blog** or **/guides** section. Each page: TL;DR answer first, specific
facts/numbers, comparison table, `FAQPage` schema, a "last updated 2026" date.
Priority topics (each targets a real assistant prompt):

1. "How to build a website for your driving school (2026 step-by-step)"
2. "Best website builders for driving instructors, compared (2026)" — incl. competitors
3. "How driving instructors can take online lesson bookings"
4. "Website + booking for driving instructors in Israel (Hebrew/Arabic/English)"
5. "How much does a driving-instructor website cost?" (answers the pricing prompt)
6. "Mumotor vs Wix / Zarla / Yola for driving schools"
7. A public FAQ page (expand the landing FAQ) with question-shaped headings.

Publish in all three languages (HE/AR/EN) — you already have the i18n
infrastructure, and Hebrew/Arabic driving-instructor queries have *zero*
competition in AI answers right now.

---

## 5. Product Hunt launch checklist (first concrete win, ~1 week prep)
- Set up a maker account; warm up by engaging for a couple weeks first.
- Assets: clear tagline, 3–5 gallery images, a 30–60s demo video, first comment
  telling the story ("driving-instructor-specific, trilingual, built-in booking").
- Line up 10–20 people to genuinely try it and comment on launch day.
- Launch Tue–Thu, 12:01am PT. Respond to every comment.
- Afterward: the PH page is a permanent, citeable backlink + review source.

---

## 6. 90-day plan (concrete)

**Weeks 1–2**
- [x] Ship on-site GEO (llms.txt, robots, schema) — done, deploy it.
- [ ] Run the §2 prompt battery → record the baseline scoreboard.
- [ ] Create/warm accounts: Reddit, Product Hunt, G2/Capterra, Crunchbase, AlternativeTo.
- [ ] Write the first 2 blog guides (step-by-step + comparison), publish in EN + HE.

**Weeks 3–6**
- [ ] Product Hunt launch.
- [ ] Submit to all §3.3 directories; seed first real reviews from actual users.
- [ ] Publish the remaining blog guides; record 1 YouTube demo (EN + HE).
- [ ] Begin authentic Reddit/community participation (helpful answers, honest mentions).

**Weeks 7–12**
- [ ] Outreach to 15 listicle authors to add Mumotor.
- [ ] 2–3 guest posts / PR mentions; pursue an Israeli-tech blog feature.
- [ ] Re-run the prompt battery → compare Share-of-Model vs baseline; double down
      on whichever channel the assistants started citing.

**Ongoing**
- Refresh cornerstone pages quarterly (freshness signal).
- Keep answering real questions where your buyers are.
- Re-measure monthly; let the *cited sources* tell you where to go next.

---

## 7. TL;DR
On-site is done and makes us citeable. The needle actually moves off-site, and it
takes months of **authentic** presence: get onto **Reddit**, into the
**"best builder for driving instructors" listicles**, onto **Product Hunt +
software directories**, and publish **honest comparison/how-to content** — in
Hebrew and Arabic too, where there's currently zero competition. Measure
Share-of-Model monthly and follow the citations.
