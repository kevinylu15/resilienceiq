"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Nav from "@/components/Nav";
import { calculateScore, type ScoreInput } from "@/lib/api";

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
  { value: "high_school",   label: "High School Diploma / GED" },
  { value: "some_college",  label: "Some College" },
  { value: "associates",    label: "Associate's Degree" },
  { value: "bachelors",     label: "Bachelor's Degree" },
  { value: "masters",       label: "Master's Degree" },
  { value: "phd",           label: "PhD" },
  { value: "professional",  label: "Professional Degree (MD, JD, etc.)" },
];

const inputClass =
  "block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors bg-white " +
  "dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500";

const labelClass = "mb-1.5 block text-sm font-semibold text-gray-700 dark:text-gray-300";

export default function ScorePage() {
  const router = useRouter();

  const [form, setForm] = useState<ScoreInput>({
    job_title: "",
    industry: "",
    years_experience: 0,
    education_level: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "years_experience" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.job_title.trim()) {
      setError("Please enter your job title.");
      return;
    }
    if (!form.industry) {
      setError("Please select your industry.");
      return;
    }
    if (!form.education_level) {
      setError("Please select your education level.");
      return;
    }

    setLoading(true);
    try {
      const result = await calculateScore(form);
      sessionStorage.setItem("riq_result", JSON.stringify(result));
      sessionStorage.setItem("riq_input", JSON.stringify(form));
      router.push("/score/results");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav />

      <div className="mx-auto max-w-xl px-6 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Calculate Your Score
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Answer four quick questions to see your AI resilience score.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          {/* Job title */}
          <div>
            <label htmlFor="job_title" className={labelClass}>
              What is your current job title?
            </label>
            <input
              id="job_title"
              name="job_title"
              type="text"
              placeholder="e.g. Software Engineer, Nurse, Accountant"
              value={form.job_title}
              onChange={handleChange}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className={labelClass}>
              Which industry do you work in?
            </label>
            <select
              id="industry"
              name="industry"
              value={form.industry}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                Select your industry
              </option>
              {INDUSTRIES.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Years of experience */}
          <div>
            <label htmlFor="years_experience" className={labelClass}>
              Years of work experience:{" "}
              <span className="font-bold text-primary">{form.years_experience}</span>
            </label>
            <input
              id="years_experience"
              name="years_experience"
              type="range"
              min={0}
              max={40}
              value={form.years_experience}
              onChange={handleChange}
              className="w-full accent-primary"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>0</span>
              <span>10</span>
              <span>20</span>
              <span>30</span>
              <span>40+</span>
            </div>
          </div>

          {/* Education */}
          <div>
            <label htmlFor="education_level" className={labelClass}>
              Highest level of education completed
            </label>
            <select
              id="education_level"
              name="education_level"
              value={form.education_level}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="" disabled>
                Select your education level
              </option>
              {EDUCATION.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Calculating…
              </span>
            ) : (
              "Calculate My Score →"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
          Your data is not stored or shared. Scores are calculated in real time.
        </p>
      </div>
    </div>
  );
}
