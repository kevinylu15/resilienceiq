"use client";

import { useState, FormEvent } from "react";
import Nav from "@/components/Nav";
import RadarChart from "@/components/RadarChart";
import { calculateScore, type ScoreResult, type ScoreInput } from "@/lib/api";

const INDUSTRIES = [
  { value: "technology",     label: "Technology" },
  { value: "finance",        label: "Finance & Banking" },
  { value: "healthcare",     label: "Healthcare" },
  { value: "education",      label: "Education" },
  { value: "manufacturing",  label: "Manufacturing" },
  { value: "retail",         label: "Retail & E-commerce" },
  { value: "legal",          label: "Legal" },
  { value: "government",     label: "Government" },
  { value: "arts",           label: "Arts & Entertainment" },
  { value: "construction",   label: "Construction & Trades" },
  { value: "transportation", label: "Transportation & Logistics" },
  { value: "other",          label: "Other" },
];

const EDUCATION = [
  { value: "high_school",   label: "High School" },
  { value: "some_college",  label: "Some College" },
  { value: "associates",    label: "Associate's" },
  { value: "bachelors",     label: "Bachelor's" },
  { value: "masters",       label: "Master's" },
  { value: "phd",           label: "PhD" },
  { value: "professional",  label: "Professional (MD, JD)" },
];

const inputClass =
  "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors bg-white " +
  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";

const labelClass = "mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400";

function scoreColor(score: number): string {
  if (score < 200) return "#EF4444";
  if (score < 350) return "#F97316";
  if (score < 500) return "#F59E0B";
  if (score < 650) return "#10B981";
  return "#059669";
}

function defaultInput(): ScoreInput {
  return { job_title: "", industry: "technology", years_experience: 5, education_level: "bachelors" };
}

export default function ComparePage() {
  const [inputA, setInputA] = useState<ScoreInput>(defaultInput());
  const [inputB, setInputB] = useState<ScoreInput>(defaultInput());
  const [resultA, setResultA] = useState<ScoreResult | null>(null);
  const [resultB, setResultB] = useState<ScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    setter: typeof setInputA,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setter((prev) => ({
      ...prev,
      [name]: name === "years_experience" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!inputA.job_title.trim() || !inputB.job_title.trim()) {
      setError("Please enter both job titles.");
      return;
    }

    setLoading(true);
    try {
      const [a, b] = await Promise.all([
        calculateScore(inputA),
        calculateScore(inputB),
      ]);
      setResultA(a);
      setResultB(b);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const radarData =
    resultA && resultB
      ? resultA.factors.map((fA, i) => ({
          label: fA.name,
          valueA: fA.score,
          valueB: resultB.factors[i].score,
          max: fA.max_score,
        }))
      : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav />

      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Compare Two Roles
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            See how two career paths stack up against AI displacement — side by side.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-8 grid gap-6 sm:grid-cols-2">
            {/* Role A */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 font-bold text-primary">Role A</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Job title</label>
                  <input
                    name="job_title"
                    placeholder="e.g. Software Engineer"
                    value={inputA.job_title}
                    onChange={(e) => handleChange(setInputA, e)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select
                    name="industry"
                    value={inputA.industry}
                    onChange={(e) => handleChange(setInputA, e)}
                    className={inputClass}
                  >
                    {INDUSTRIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Experience: <span className="font-bold text-primary">{inputA.years_experience} yrs</span>
                  </label>
                  <input
                    name="years_experience"
                    type="range"
                    min={0}
                    max={40}
                    value={inputA.years_experience}
                    onChange={(e) => handleChange(setInputA, e)}
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className={labelClass}>Education</label>
                  <select
                    name="education_level"
                    value={inputA.education_level}
                    onChange={(e) => handleChange(setInputA, e)}
                    className={inputClass}
                  >
                    {EDUCATION.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Role B */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-4 font-bold text-amber-500">Role B</h2>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Job title</label>
                  <input
                    name="job_title"
                    placeholder="e.g. Nurse"
                    value={inputB.job_title}
                    onChange={(e) => handleChange(setInputB, e)}
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={labelClass}>Industry</label>
                  <select
                    name="industry"
                    value={inputB.industry}
                    onChange={(e) => handleChange(setInputB, e)}
                    className={inputClass}
                  >
                    {INDUSTRIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Experience: <span className="font-bold text-amber-500">{inputB.years_experience} yrs</span>
                  </label>
                  <input
                    name="years_experience"
                    type="range"
                    min={0}
                    max={40}
                    value={inputB.years_experience}
                    onChange={(e) => handleChange(setInputB, e)}
                    className="w-full accent-amber-500"
                  />
                </div>
                <div>
                  <label className={labelClass}>Education</label>
                  <select
                    name="education_level"
                    value={inputB.education_level}
                    onChange={(e) => handleChange(setInputB, e)}
                    className={inputClass}
                  >
                    {EDUCATION.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mb-10 text-center">
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-10 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Comparing…" : "Compare Roles →"}
            </button>
          </div>
        </form>

        {/* Results */}
        {resultA && resultB && radarData && (
          <div className="space-y-8">
            {/* Score summary */}
            <div className="grid gap-6 sm:grid-cols-2">
              {[
                { result: resultA, label: "Role A", input: inputA, color: "#4F46E5" },
                { result: resultB, label: "Role B", input: inputB, color: "#F59E0B" },
              ].map(({ result, label, input, color }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <p className="mb-1 text-xs font-semibold uppercase tracking-widest" style={{ color }}>
                    {label}
                  </p>
                  <p className="mb-3 text-sm capitalize text-gray-600 dark:text-gray-400">
                    {input.job_title}
                    {result.matched_title && result.matched_title !== input.job_title.toLowerCase() && (
                      <span className="ml-1 text-gray-400 dark:text-gray-500">
                        → {result.matched_title}
                      </span>
                    )}
                  </p>
                  <span
                    className="text-5xl font-extrabold tabular-nums"
                    style={{ color: scoreColor(result.score) }}
                  >
                    {result.score}
                  </span>
                  <span className="ml-1 text-sm text-gray-400 dark:text-gray-500">/850</span>
                  <div className="mt-2">
                    <span
                      className="inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                      style={{ backgroundColor: scoreColor(result.score) }}
                    >
                      {result.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Delta callout */}
            {(() => {
              const delta = resultA.score - resultB.score;
              if (delta === 0) return null;
              const higher = delta > 0 ? inputA.job_title : inputB.job_title;
              return (
                <div className="rounded-xl border border-gray-200 bg-white px-6 py-4 text-center dark:border-gray-800 dark:bg-gray-900">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{higher}</strong> scores{" "}
                    <strong className="text-primary">{Math.abs(delta)} points</strong> higher
                  </span>
                </div>
              );
            })()}

            {/* Radar chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">
                Factor Comparison
              </h2>
              <RadarChart
                data={radarData}
                labelA={inputA.job_title || "Role A"}
                labelB={inputB.job_title || "Role B"}
              />
            </div>

            {/* Factor-by-factor table */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
                Factor Breakdown
              </h2>
              <div className="space-y-4">
                {resultA.factors.map((fA, i) => {
                  const fB = resultB.factors[i];
                  const diff = fA.score - fB.score;
                  return (
                    <div key={fA.name}>
                      <div className="mb-1 flex items-baseline justify-between">
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                          {fA.name}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          max {fA.max_score}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${(fA.score / fA.max_score) * 100}%`,
                                backgroundColor: "#4F46E5",
                              }}
                            />
                          </div>
                          <div className="mt-0.5 text-xs font-semibold text-primary">
                            {fA.score}
                          </div>
                        </div>
                        <div className="w-16 text-center">
                          {diff !== 0 && (
                            <span
                              className="text-xs font-bold"
                              style={{ color: diff > 0 ? "#059669" : "#EF4444" }}
                            >
                              {diff > 0 ? "+" : ""}{diff}
                            </span>
                          )}
                          {diff === 0 && (
                            <span className="text-xs text-gray-400">=</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                            <div
                              className="h-2 rounded-full"
                              style={{
                                width: `${(fB.score / fB.max_score) * 100}%`,
                                backgroundColor: "#F59E0B",
                              }}
                            />
                          </div>
                          <div className="mt-0.5 text-right text-xs font-semibold text-amber-500">
                            {fB.score}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
