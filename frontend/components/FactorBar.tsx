"use client";

import { useEffect, useState } from "react";

interface Props {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  delay?: number; // stagger animation delay in ms
}

function barColor(pct: number): string {
  if (pct < 0.30) return "#EF4444";
  if (pct < 0.50) return "#F97316";
  if (pct < 0.65) return "#F59E0B";
  if (pct < 0.80) return "#10B981";
  return "#059669";
}

export default function FactorBar({ name, score, maxScore, description, delay = 0 }: Props) {
  const [width, setWidth] = useState(0);

  const pct = score / maxScore;
  const color = barColor(pct);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct * 100), delay + 100);
    return () => clearTimeout(timer);
  }, [pct, delay]);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{name}</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {score}
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">/{maxScore}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-2.5 rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
}
