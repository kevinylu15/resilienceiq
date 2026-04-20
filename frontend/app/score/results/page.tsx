"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Nav from "@/components/Nav";
import ScoreGauge from "@/components/ScoreGauge";
import FactorBar from "@/components/FactorBar";
import WhatIfModeler from "@/components/WhatIfModeler";
import type { ScoreResult, ScoreInput, PercentileResult } from "@/lib/api";
import { fetchPercentile } from "@/lib/api";
import { downloadScoreCard } from "@/lib/scoreCard";
import ResultsSkeleton from "@/components/ResultsSkeleton";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [input, setInput] = useState<ScoreInput | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [percentile, setPercentile] = useState<PercentileResult | null>(null);

  useEffect(() => {
    const rawResult = sessionStorage.getItem("riq_result");
    const rawInput = sessionStorage.getItem("riq_input");

    if (!rawResult) {
      router.push("/score");
      return;
    }
    try {
      const parsed = JSON.parse(rawResult) as ScoreResult;
      setResult(parsed);
      if (rawInput) {
        const parsedInput = JSON.parse(rawInput) as ScoreInput;
        setInput(parsedInput);
        fetchPercentile(parsed.score, parsedInput.industry)
          .then(setPercentile)
          .catch(() => {});
      } else {
        fetchPercentile(parsed.score)
          .then(setPercentile)
          .catch(() => {});
      }
    } catch {
      router.push("/score");
    }
  }, [router]);

  function handleShare() {
    if (!result) return;
    const text = `My ResilienceIQ score is ${result.score}/850 — "${result.label}". Find out how AI-proof your career is: ${window.location.origin}`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => window.prompt("Copy this text:", text));
  }

  async function handleDownloadCard() {
    if (!result || !input) return;
    setDownloading(true);
    try {
      await downloadScoreCard(result, input.job_title, input.industry);
    } finally {
      setDownloading(false);
    }
  }

  if (!result) {
    return <ResultsSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Nav />

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* ── Gauge section ──────────────────────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Your ResilienceIQ Score
          </p>
          {result.matched_title && (
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              Scored as:{" "}
              <span className="font-medium capitalize text-gray-700 dark:text-gray-300">
                {result.matched_title}
              </span>
              {result.used_ai_profile && (
                <span className="ml-2 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-primary dark:bg-indigo-950">
                  AI-assessed
                </span>
              )}
            </p>
          )}

          <ScoreGauge score={result.score} label={result.label} />

          <p className="mx-auto mt-6 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            {scoreExplanation(result.score)}
          </p>

          {percentile && percentile.percentile !== null && percentile.total_scores >= 5 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 dark:border-indigo-900 dark:bg-indigo-950">
              <span className="text-2xl font-extrabold text-primary">
                {Math.round(percentile.percentile)}%
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                You scored higher than {Math.round(percentile.percentile)}% of{" "}
                {percentile.industry !== "all"
                  ? `${percentile.industry} workers`
                  : "all users"}{" "}
                <span className="text-gray-400 dark:text-gray-500">
                  ({percentile.total_scores.toLocaleString()} scores)
                </span>
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {copied ? "✓ Copied!" : "🔗 Copy score text"}
            </button>

            <button
              onClick={handleDownloadCard}
              disabled={downloading || !input}
              title={!input ? "Input data unavailable — recalculate to enable" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                "⬇ Download score card"
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-400 dark:text-gray-600">
            Score card downloads as a 1200×630 PNG — ready to post on LinkedIn
          </p>
        </div>

        {/* ── Factor breakdown ───────────────────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Score Breakdown</h2>
          <div className="space-y-6">
            {result.factors.map((f, i) => (
              <FactorBar
                key={f.name}
                name={f.name}
                score={f.score}
                maxScore={f.max_score}
                description={f.description}
                delay={i * 120}
              />
            ))}
          </div>
        </div>

        {/* ── What-if modeler ────────────────────────────────────────────── */}
        {input && (
          <div className="mb-8">
            <WhatIfModeler
              currentScore={result.score}
              currentFactors={result.factors}
              originalEducation={input.education_level}
              originalYears={input.years_experience}
            />
          </div>
        )}

        {/* ── Recommendations ────────────────────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Action Plan</h2>
            {result.used_ai_recommendations && (
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-primary dark:bg-indigo-950">
                AI-personalized
              </span>
            )}
          </div>

          <div className="space-y-5">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {rec.description}
                </p>
                {rec.resource_url && (
                  <a
                    href={rec.resource_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-primary dark:border-gray-600 dark:bg-gray-700"
                  >
                    {rec.resource_label || "View Resource"} ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recalculate */}
        <div className="text-center">
          <Link
            href="/score"
            className="text-sm font-semibold text-primary hover:underline"
          >
            ← Recalculate with different inputs
          </Link>
        </div>
      </div>
    </div>
  );
}

function scoreExplanation(score: number): string {
  if (score < 200)
    return "Your role has significant exposure to AI displacement in the near term. The action plan below shows the highest-leverage moves you can make right now.";
  if (score < 350)
    return "Your role has meaningful AI exposure. Targeted upskilling can materially improve your position over the next 12–18 months.";
  if (score < 500)
    return "Your career has moderate resilience. You have a foundation to build on — the right moves now will compound over time.";
  if (score < 650)
    return "You're well-positioned relative to most workers. Staying proactive and continuing to develop adjacent skills will keep you there.";
  return "Your career has strong structural protection from AI displacement. Focus on deepening your expertise and helping others navigate the transition.";
}
