import Link from "next/link";
import Nav from "@/components/Nav";

const FACTORS = [
  {
    icon: "⚙️",
    title: "Task Automation Resistance",
    desc: "How hard it is to automate your core daily tasks.",
  },
  {
    icon: "🧠",
    title: "Human Judgment Demand",
    desc: "How much your role depends on creativity, empathy, and complex reasoning.",
  },
  {
    icon: "📉",
    title: "Industry AI Adoption Speed",
    desc: "How quickly AI is being deployed in your sector.",
  },
  {
    icon: "🛡️",
    title: "Sociotechnical Barriers",
    desc: "Regulatory, licensing, and social trust protections on your role.",
  },
  {
    icon: "🎓",
    title: "Skill Adaptability",
    desc: "Your capacity to pivot based on education level and career experience.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav />

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mb-4 inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary dark:bg-indigo-950">
          Free · No signup required
        </div>
        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
          Is your career{" "}
          <span className="text-primary">AI-proof?</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
          ResilienceIQ gives you a personalized 0–850 score — like a credit
          score for your career — showing exactly how resilient you are to AI
          displacement and what to do about it.
        </p>
        <Link
          href="/score"
          className="inline-block rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-md hover:bg-primary-dark transition-colors"
        >
          Calculate My Score →
        </Link>
        <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">Takes about 60 seconds</p>
      </section>

      {/* Score preview */}
      <section className="border-y border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Example result
          </p>
          <div className="mx-auto flex max-w-xs flex-col items-center">
            <svg
              viewBox="0 0 320 180"
              width="100%"
              style={{ maxWidth: 300, overflow: "visible" }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="preview-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#EF4444" />
                  <stop offset="40%" stopColor="#F59E0B" />
                  <stop offset="80%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
              <path
                d="M 20,180 A 140,140 0 0 1 300,180"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={18}
                strokeLinecap="round"
                className="dark:[stroke:#374151]"
              />
              <path
                d="M 20,180 A 140,140 0 0 1 250.0,72.8"
                fill="none"
                stroke="url(#preview-grad)"
                strokeWidth={18}
                strokeLinecap="round"
              />
              <text x="160" y="130" textAnchor="middle" fontSize="56" fontWeight="800" className="fill-gray-900 dark:fill-white" fontFamily="Inter, sans-serif">614</text>
              <text x="160" y="155" textAnchor="middle" fontSize="13" className="fill-gray-400 dark:fill-gray-500" fontFamily="Inter, sans-serif">out of 850</text>
            </svg>
            <span className="mt-1 rounded-full bg-emerald-500 px-4 py-1 text-sm font-semibold text-white">
              Resilient
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
          How it works
        </h2>
        <div className="grid gap-8 sm:grid-cols-3">
          {[
            {
              step: "01",
              title: "Enter your info",
              desc: "Job title, industry, years of experience, and education level. That's it — no account required.",
            },
            {
              step: "02",
              title: "We calculate your score",
              desc: "Our model analyzes 5 weighted dimensions of AI displacement risk using labor data and AI research.",
            },
            {
              step: "03",
              title: "Get your action plan",
              desc: "See exactly what's driving your score and get 3 specific upskilling steps with free resource links.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 text-4xl font-extrabold text-gray-100 dark:text-gray-800">{step}</div>
              <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* What we measure */}
      <section className="border-t border-gray-200 bg-white py-20 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 dark:text-white">
            What we measure
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FACTORS.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-gray-200 p-5 dark:border-gray-700"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{title}</p>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          Ready to find out where you stand?
        </h2>
        <p className="mb-8 text-gray-500 dark:text-gray-400">Free, instant, and no account needed.</p>
        <Link
          href="/score"
          className="inline-block rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-md hover:bg-primary-dark transition-colors"
        >
          Calculate My Score →
        </Link>
      </section>

      <footer className="border-t border-gray-200 py-8 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-600">
        © {new Date().getFullYear()} ResilienceIQ · Built to help workers navigate the AI era
      </footer>
    </div>
  );
}
