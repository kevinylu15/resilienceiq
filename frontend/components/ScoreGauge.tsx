"use client";

import { useEffect, useState } from "react";

interface Props {
  score: number; // 0–850
  label: string;
}

const CX = 160;
const CY = 180;
const R = 140;
const MAX_SCORE = 850;

function scoreColor(score: number): string {
  if (score < 200) return "#EF4444";
  if (score < 350) return "#F97316";
  if (score < 500) return "#F59E0B";
  if (score < 650) return "#10B981";
  return "#059669";
}

function arcEndpoint(score: number): { x: number; y: number; largeArc: 0 | 1 } {
  const pct = Math.min(score / MAX_SCORE, 0.9999);
  const angleDeg = (1 - pct) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  return {
    x: CX + R * Math.cos(angleRad),
    y: CY - R * Math.sin(angleRad),
    largeArc: 0,
  };
}

export default function ScoreGauge({ score, label }: Props) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frameId: number;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [score]);

  const color = scoreColor(score);
  const { x: ex, y: ey } = arcEndpoint(displayed);

  const bgArc = `M 20,180 A 140,140 0 0 1 300,180`;

  const scoreArc =
    displayed <= 0
      ? null
      : `M 20,180 A 140,140 0 0 1 ${ex.toFixed(2)},${ey.toFixed(2)}`;

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 320 180"
        width="100%"
        style={{ maxWidth: 360, overflow: "visible" }}
        aria-label={`ResilienceIQ score: ${score} out of ${MAX_SCORE}`}
      >
        <path
          d={bgArc}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={18}
          strokeLinecap="round"
          className="dark:[stroke:#374151]"
        />

        {scoreArc && (
          <path
            d={scoreArc}
            fill="none"
            stroke={color}
            strokeWidth={18}
            strokeLinecap="round"
          />
        )}

        <text
          x={CX}
          y={130}
          textAnchor="middle"
          fontSize={56}
          fontWeight={800}
          className="fill-gray-900 dark:fill-white"
          fontFamily="Inter, sans-serif"
        >
          {displayed}
        </text>

        <text
          x={CX}
          y={155}
          textAnchor="middle"
          fontSize={13}
          className="fill-gray-400 dark:fill-gray-500"
          fontFamily="Inter, sans-serif"
        >
          out of {MAX_SCORE}
        </text>
      </svg>

      <span
        className="mt-1 rounded-full px-4 py-1 text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>

      <div className="mt-2 flex w-full max-w-[360px] justify-between px-3 text-xs text-gray-400 dark:text-gray-600">
        <span>0</span>
        <span>At Risk</span>
        <span>Resilient</span>
        <span>850</span>
      </div>
    </div>
  );
}
