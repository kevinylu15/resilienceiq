"use client";

import { useState } from "react";
import {
  projectScore,
  adaptabilityScore,
  scoreLabel,
  scoreColor,
  EDUCATION_LABELS,
} from "@/lib/scoring";

interface Factor {
  name: string;
  score: number;
  max_score: number;
}

interface Props {
  currentScore: number;
  currentFactors: Factor[];
  originalEducation: string;
  originalYears: number;
}

const EDUCATION_ORDER = [
  "high_school",
  "some_college",
  "associates",
  "bachelors",
  "masters",
  "phd",
  "professional",
];

export default function WhatIfModeler({
  currentScore,
  currentFactors,
  originalEducation,
  originalYears,
}: Props) {
  const [education, setEducation] = useState(originalEducation);
  const [years, setYears] = useState(originalYears);

  const projectedScore = projectScore(
    currentScore,
    currentFactors,
    originalEducation,
    originalYears,
    education,
    years,
  );

  const delta = projectedScore - currentScore;
  const color = scoreColor(projectedScore);
  const label = scoreLabel(projectedScore);

  const currentAdaptability =
    currentFactors.find((f) => f.name === "Skill Adaptability")?.score ?? 0;
  const newAdaptability = adaptabilityScore(education, years);
  const adaptabilityDelta = newAdaptability - currentAdaptability;

  const changed = education !== originalEducation || years !== originalYears;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">What-If Modeler</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Adjust your inputs to see how your score would change — no re-calculation needed.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Education selector */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Education level
          </label>
          <div className="space-y-2">
            {EDUCATION_ORDER.map((key) => {
              const isActive = education === key;
              const projectedIfSelected = projectScore(
                currentScore,
                currentFactors,
                originalEducation,
                originalYears,
                key,
                years,
              );
              const d = projectedIfSelected - currentScore;
              return (
                <button
                  key={key}
                  onClick={() => setEducation(key)}
                  className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all ${
                    isActive
                      ? "border-primary bg-indigo-50 font-semibold text-primary dark:bg-indigo-950"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
                  }`}
                >
                  <span>{EDUCATION_LABELS[key]}</span>
                  {!isActive && d !== 0 && (
                    <span
                      className={`text-xs font-medium ${d > 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {d > 0 ? "+" : ""}
                      {d}
                    </span>
                  )}
                  {isActive && (
                    <span className="text-xs text-primary">current</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="flex flex-col gap-6">
          {/* Experience slider */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Years of experience:{" "}
              <span className="font-bold text-primary">{years}</span>
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
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

          {/* Result panel */}
          <div
            className="flex-1 rounded-xl p-5 transition-all"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}40` }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              {changed ? "Projected score" : "Your current score"}
            </p>

            <div className="flex items-baseline gap-3">
              <span
                className="text-5xl font-extrabold tabular-nums"
                style={{ color }}
              >
                {projectedScore}
              </span>
              {changed && delta !== 0 && (
                <span
                  className="text-lg font-bold"
                  style={{ color: delta > 0 ? "#059669" : "#EF4444" }}
                >
                  {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} pts
                </span>
              )}
            </div>

            <span
              className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {label}
            </span>

            {changed && adaptabilityDelta !== 0 && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Skill Adaptability:{" "}
                <span className="font-semibold">
                  {currentAdaptability} → {newAdaptability}
                </span>{" "}
                <span
                  className="font-bold"
                  style={{ color: adaptabilityDelta > 0 ? "#059669" : "#EF4444" }}
                >
                  ({adaptabilityDelta > 0 ? "+" : ""}
                  {adaptabilityDelta})
                </span>
              </p>
            )}

            {!changed && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Try changing your education level or experience above.
              </p>
            )}

            {changed && delta === 0 && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                No change — your inputs produce the same score.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
