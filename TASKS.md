# ResilienceIQ — Tasks

## Completed

- [x] Pytest coverage — 97 tests (scoring engine, views, percentile)
- [x] Score logging to DB (anonymized `ScoreLog` model)
- [x] Peer percentile endpoint + frontend badge
- [x] Gemini response caching (DB-backed, 7-day TTL, 50-point score bucketing)
- [x] Rate limiting — `ScoreRateThrottle` at 6 req/min on `POST /api/score/`
- [x] Dark mode — class strategy, localStorage persistence, `prefers-color-scheme` detection, toggle in Nav
- [x] Methodology page — `/methodology` with 5-factor breakdown, score bands, data sources, limitations
- [x] Loading skeleton states — shimmer layout matching results page structure
- [x] Role comparison tool — `/compare` with side-by-side forms, SVG radar chart, factor-by-factor table

---

## 1. Data & scoring model depth

- [ ] **O*NET API integration** — map job titles to SOC codes via O*NET Web Services, pull real task lists and skills data to replace hand-curated `JOB_PROFILES`. Fall back to current profiles + Gemini for unmatched titles.
- [ ] **BLS employment projections** — pull 10-year growth/decline data per occupation to weight the industry adoption factor with real labor statistics.
- [ ] **Confidence indicator** — show a "data quality" badge on results: "High" when matched to a curated profile, "Moderate" for fuzzy match, "Estimated" for Gemini/fallback. Helps users understand reliability.
- [ ] **Expand to 200+ occupations** — fill gaps in trades, healthcare specialties, creative roles, and emerging tech jobs (ML engineer, prompt engineer, AI ethicist, robotics technician, etc.).
- [ ] **Job title autocomplete** — as the user types in the score form, show a dropdown of the 65+ known profiles that match. Reduces typos, improves match rate, and signals which titles have high-confidence data.
- [ ] **Score versioning** — track which version of the scoring model produced each `ScoreLog` entry. When the model changes (new profiles, weight adjustments), old scores can be compared fairly.

## 2. Interactive features

- [ ] **Career transition pathways** — after scoring, show 3–5 related roles that score higher and are reachable from the user's current skills. Powered by O*NET skill overlap data or Gemini.
- [ ] **Skills gap analyzer** — let users check off skills they already have (from a curated list per role), recalculate the score with those skills factored in, show which missing skills would have the most impact.
- [ ] **Timeline simulator** — extend the What-If modeler with a time axis: "If you start a master's program today, here's your projected score at 6/12/24 months." Animated line chart showing the trajectory.
- [ ] **Industry trends dashboard** — `/trends` page showing aggregate score distributions by industry over time (from `ScoreLog` data). Bar charts, sparklines, "fastest-declining" and "most resilient" industries. Requires a charting library (Recharts or Chart.js).
- [ ] **Explore all roles** — `/explore` page with a searchable/filterable table of all 65+ (later 200+) occupations, their scores at default education/experience, and sort by any factor. Lets users browse without calculating.
- [ ] **Export comparison as PDF** — on the `/compare` page, add a "Download comparison" button that generates a PDF with both role summaries, the radar chart, and the factor table. Uses html2canvas + jsPDF or server-side rendering.

## 3. AI & personalization

- [ ] **Streaming recommendations** — switch Gemini call to streaming mode so recommendations appear progressively on the results page instead of a loading spinner. Requires SSE or WebSocket from backend to frontend.
- [ ] **AI career coach chat** — after viewing results, users can open a slide-out chat panel to ask follow-up questions about their score ("Why is my automation resistance low?", "What certifications help most?"). Gemini with full context of their score and factors.
- [ ] **Personalized learning roadmap** — Gemini generates a structured 90-day plan with weekly milestones, specific courses/certifications, and checkpoints. Rendered as an interactive timeline component. Downloadable as PDF.
- [ ] **Smart job title normalization** — before fuzzy matching, use Gemini to canonicalize titles ("Sr. SWE II" → "software engineer", "RN BSN" → "nurse") to improve match rates. Cache normalized mappings.
- [ ] **Score explanation in plain English** — generate a 2–3 sentence natural language summary specific to the user: "Your score is held back primarily by high automation risk in your sector (finance). Your strongest protection comes from strong regulatory barriers. Earning a master's degree would add ~40 points."
- [ ] **Second-opinion scoring** — for unknown jobs, run two independent Gemini passes and average the results to reduce single-call variance. Display the spread as a confidence range (e.g., "580 ± 25").

## 4. UX & visual polish

- [ ] **Animated landing page** — add scroll-triggered animations (fade-in sections, counter animations for "65+ occupations", "5 factors", "850 max score"). Use Framer Motion or Intersection Observer + CSS `@keyframes`.
- [ ] **Page transitions** — smooth animated transitions between `/score` → `/score/results` using Next.js layout animations or the View Transitions API. Makes the flow feel like a single-page app.
- [ ] **Mobile optimization pass** — audit all pages at 375px. Fix: gauge sizing on small screens, Nav hamburger menu for mobile (currently Compare/Methodology links are `hidden sm:block`), recommendation cards overflow, sticky bottom CTA on mobile.
- [ ] **Micro-interactions** — hover effects on factor bars (expand to show full description tooltip), copy button confetti animation, subtle pulse on the percentile badge when it loads in, button press feedback.
- [ ] **Accessibility audit** — keyboard navigation on all interactive elements, ARIA labels on SVG gauge and radar chart, visible focus rings, color contrast AA compliance on all factor bar colors, screen reader text for percentile and comparison deltas.
- [ ] **Custom 404 page** — branded error page with a "Back to home" link and a suggestion to calculate their score.
- [ ] **Toast notifications** — replace the `window.prompt` fallback for clipboard copy with a proper toast notification system. Show toasts for: copy success, download complete, rate limit hit, network errors.

## 5. Social & sharing

- [ ] **Dynamic OG images** — server-side score card generation (Next.js API route using `@vercel/og` or canvas) so sharing a link to `/score/results?id=xxx` shows the user's actual score as the preview image on LinkedIn/Twitter.
- [ ] **Twitter/LinkedIn share buttons** — one-click sharing with pre-filled text and the OG image. Include UTM tracking parameters.
- [ ] **Public score profiles** — optional shareable URL (`/profile/abc123`) with a read-only view of the user's score, breakdown, and label. No account required — generate a unique hash per calculation and store it in `ScoreLog`.
- [ ] **Leaderboard** — `/leaderboard` page showing opt-in anonymous high scores by industry. Gamifies the experience and drives repeat visits.
- [ ] **Live score counter** — on the landing page, show a real-time count of total scores calculated (from `ScoreLog.objects.count()`). Poll via API or use WebSocket for live updates. Social proof.
- [ ] **Embeddable widget** — `<iframe>` or JS snippet that other sites (career blogs, bootcamps) can embed to let their readers calculate scores inline. Requires a minimal standalone scoring UI.

## 6. Engineering & infrastructure

- [ ] **Dockerize** — `Dockerfile` for backend + frontend, `docker-compose.yml` with Postgres, Redis (for production cache), and Nginx reverse proxy. Include health checks.
- [ ] **CI/CD pipeline** — GitHub Actions workflow: lint (ruff + eslint), type-check (mypy + tsc), run all pytest tests, build frontend, deploy on merge to main.
- [ ] **Error tracking** — Sentry integration for both Django and Next.js. Capture Gemini failures, scoring edge cases, and frontend JS errors with context.
- [ ] **Swap to PostgreSQL** — uncomment and test the Postgres config in `settings.py`, run migration, verify percentile queries use DB indexes efficiently. Add `psycopg2-binary` to requirements.
- [ ] **Redis caching layer** — replace the DB-backed cache with Redis for sub-millisecond cache reads. Configure as the Django cache backend and optionally use for rate limiting state.
- [ ] **API versioning** — prefix all endpoints under `/api/v1/` to allow future breaking changes without disrupting existing clients or the frontend.
- [ ] **E2E tests** — Playwright test suite covering: full score flow (form → results), percentile display, What-If modeler, score card download, share copy, compare tool, methodology page, dark mode toggle, and error states.
- [ ] **OpenAPI / Swagger docs** — auto-generate API documentation from DRF serializers using `drf-spectacular`. Serve at `/api/docs/`. Makes the API self-documenting for portfolio reviewers.
- [ ] **Structured logging** — replace `logging.warning` calls with structured JSON logging (e.g., `python-json-logger`). Include request IDs, Gemini latency, cache hit/miss, and score computation time for observability.

## 7. Advanced features

- [ ] **User accounts & score history** — add `django.contrib.auth`, registration/login (email-based, no social), and a `/dashboard` page showing all past scores as a timeline with sparkline. Track how your score changes as you upskill over months.
- [ ] **Team dashboard** — `/team` route where a manager can paste a CSV of job titles (or enter them one-by-one) and get an aggregate risk heatmap for their team. Show distribution chart, highest/lowest risk roles, average score. Export as CSV.
- [ ] **Email report** — on the results page, optional "Email me this report" input. Sends a styled HTML email (Django `send_mail` + HTML template) with score, breakdown, radar chart (as inline image), and recommendations. No account required.
- [ ] **PDF report generation** — server-side PDF generation (WeasyPrint or ReportLab) with the full score card, factor breakdown, recommendations, and methodology summary. More professional than the PNG score card.
- [ ] **Webhook / API integration** — `POST /api/v1/webhooks/` endpoint that external tools (Zapier, Make, Slack bots) can call to calculate scores programmatically. Returns JSON. Documented in OpenAPI.
- [ ] **Admin analytics dashboard** — Django admin or custom `/admin/analytics` page showing: score distributions by industry (histogram), most-searched titles, Gemini cache hit rate, daily active calculations, average response time, error rates.
- [ ] **Multi-language support (i18n)** — Next.js internationalization for the frontend (start with English + Spanish). Django `gettext` for backend error messages and recommendation prompts. Language switcher in Nav.
- [ ] **PWA support** — add a service worker, web app manifest, and install prompt so users can add ResilienceIQ to their home screen on mobile. Enable offline access to their most recent score via cached results.

## 8. Growth & content

- [ ] **Blog / content engine** — auto-generated pages like "How AI-Proof is a [Role]?" for the top 50 occupations. Pre-computed scores, factor breakdowns, and Gemini-generated analysis. SEO magnet driving organic traffic.
- [ ] **Newsletter signup** — collect emails from users who score below 400, send a monthly "AI jobs digest" with industry news and new course recommendations. Use Django + Celery for scheduled sends.
- [ ] **Partner with course platforms** — affiliate links in recommendations (Coursera, Udemy, LinkedIn Learning). Track click-through rates per recommendation.
- [ ] **Testimonials / case studies** — allow users to optionally submit a short testimonial about how their score prompted them to upskill. Display on the landing page as social proof.
- [ ] **Comparison content pages** — auto-generated "Software Engineer vs. Data Scientist" comparison pages using the compare tool's logic. Pre-render for SEO, link from the blog.
