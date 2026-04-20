import Link from "next/link";
import Nav from "@/components/Nav";

const FACTORS = [
  {
    name: "Task Automation Resistance",
    max: 200,
    weight: "23.5%",
    description:
      "Measures how difficult it is for current or near-term AI systems to perform the core tasks of this role. Roles involving unstructured physical work, novel problem-solving, or highly variable environments score higher.",
    scoring:
      "Raw profile value (0–10 automation risk) is inverted and scaled: score = (1 − ar/10) × 200. A data entry clerk (ar = 9.5) scores 10; a therapist (ar = 1.5) scores 170.",
  },
  {
    name: "Human Judgment Demand",
    max: 150,
    weight: "17.6%",
    description:
      "Captures the degree to which the role depends on creativity, emotional intelligence, ethical reasoning, empathy, and complex interpersonal judgment — capabilities where AI lags furthest behind humans.",
    scoring:
      "Directly scaled from the judgment demand rating: score = (jd/10) × 150. A surgeon (jd = 9.5) scores 143; a cashier (jd = 2.0) scores 30.",
  },
  {
    name: "Industry AI Adoption Speed",
    max: 150,
    weight: "17.6%",
    description:
      "Reflects how aggressively AI is being deployed in the worker's sector. Industries with heavy investment in AI automation (finance, tech) reduce a worker's resilience; slower-adopting sectors (construction, government) provide a buffer.",
    scoring:
      "Inverted scale: score = (1 − ia/10) × 150. A software engineer in tech (ia = 8.5) scores 23; a teacher in education (ia = 3.5) scores 98.",
  },
  {
    name: "Sociotechnical Barriers",
    max: 150,
    weight: "17.6%",
    description:
      "Accounts for non-technical protections: licensing requirements, regulatory barriers, mandatory physical presence, liability concerns, and social trust norms that slow or prevent AI substitution regardless of technical capability.",
    scoring:
      "Directly scaled: score = (sb/10) × 150. A doctor (sb = 9.5) scores 143; a telemarketer (sb = 1.5) scores 23.",
  },
  {
    name: "Skill Adaptability",
    max: 200,
    weight: "23.5%",
    description:
      "The only factor driven entirely by the user's personal attributes rather than their role. Higher education provides more transferable analytical frameworks; moderate experience builds domain expertise; very long careers receive a slight penalty reflecting potential skill staleness.",
    scoring:
      "Education (0–160 pts) + Experience (0–40 pts), capped at 200. Education: high school = 20, bachelor's = 110, PhD = 160. Experience: 0–2 yrs = 10, 6–10 yrs = 32, 11–20 yrs = 40, 20+ yrs decays toward 30.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav />

      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Scoring Methodology
          </h1>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            How ResilienceIQ calculates your 0–850 AI career resilience score.
          </p>
        </div>

        {/* Overview */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Overview</h2>
          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Your ResilienceIQ score is a weighted composite of five independent factors,
            each measuring a distinct dimension of AI displacement risk. The five maximum
            values sum to exactly <strong className="text-gray-900 dark:text-white">850</strong> — the
            highest possible score. A higher score means greater career resilience.
          </p>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            Four factors are determined by your <strong className="text-gray-900 dark:text-white">job profile</strong>{" "}
            (job title + industry). The fifth — Skill Adaptability — is calculated from your
            personal education level and years of experience.
          </p>
        </section>

        {/* Score bands */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Score Bands</h2>
          <div className="space-y-3">
            {[
              { range: "0 – 199", label: "At Risk", color: "#EF4444", desc: "Significant near-term exposure to AI displacement." },
              { range: "200 – 349", label: "Vulnerable", color: "#F97316", desc: "Meaningful exposure; targeted upskilling can help." },
              { range: "350 – 499", label: "Developing", color: "#F59E0B", desc: "Moderate resilience with room to strengthen." },
              { range: "500 – 649", label: "Resilient", color: "#10B981", desc: "Well-positioned; proactive moves will maintain this." },
              { range: "650 – 850", label: "Future-Proof", color: "#059669", desc: "Strong structural protection from AI displacement." },
            ].map((band) => (
              <div key={band.label} className="flex items-center gap-4 rounded-lg border border-gray-100 p-4 dark:border-gray-700">
                <span
                  className="inline-block w-20 shrink-0 rounded-full px-3 py-1 text-center text-xs font-bold text-white"
                  style={{ backgroundColor: band.color }}
                >
                  {band.label}
                </span>
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{band.range}</span>
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">— {band.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Factor details */}
        <section className="mb-10">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">The Five Factors</h2>
          <div className="space-y-6">
            {FACTORS.map((f, i) => (
              <div
                key={f.name}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    <span className="mr-2 text-primary">{i + 1}.</span>
                    {f.name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="rounded-full bg-gray-100 px-3 py-0.5 font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      Max {f.max}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500">{f.weight}</span>
                  </div>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {f.description}
                </p>
                <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    <strong className="text-gray-700 dark:text-gray-300">Scoring:</strong> {f.scoring}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Data sources */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Data Sources</h2>
          <div className="space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Job Profiles (65+ occupations)</h3>
              <p>
                Each occupation has four expert-curated scores (0–10) for automation risk, judgment demand,
                industry adoption speed, and sociotechnical barriers. These are informed by labor economics
                research, AI capability assessments, and occupational classification data.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Unknown Job Titles</h3>
              <p>
                When a title doesn't match any of the 65+ profiles (fuzzy matching with 80% similarity threshold),
                the system asks Google Gemini (gemini-2.0-flash) to estimate the four factor scores. Results are
                cached for 7 days. If AI assessment fails, industry-level defaults are used.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Recommendations</h3>
              <p>
                Three personalized upskilling recommendations are generated by Gemini based on your specific
                factor breakdown. If Gemini is unavailable, static tier-based recommendations with vetted
                free resource links are provided.
              </p>
            </div>
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">Limitations</h2>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Scores reflect estimated structural risk, not individual performance or specific employer context.</li>
            <li>AI capabilities are advancing rapidly; scores may shift as new models and tools emerge.</li>
            <li>Job profiles are curated, not exhaustive — niche roles may fall back to industry-level or AI estimates.</li>
            <li>The model does not account for geographic, organizational, or economic factors that influence job security.</li>
            <li>This tool is educational and should not be the sole basis for career decisions.</li>
          </ul>
        </section>

        <div className="text-center">
          <Link
            href="/score"
            className="inline-block rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-md hover:bg-primary-dark transition-colors"
          >
            Calculate My Score →
          </Link>
        </div>
      </div>
    </div>
  );
}
