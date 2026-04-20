"use client";

interface DataPoint {
  label: string;
  valueA: number;
  valueB: number;
  max: number;
}

interface Props {
  data: DataPoint[];
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const RADIUS = 120;

function polarToCart(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

export default function RadarChart({
  data,
  labelA,
  labelB,
  colorA = "#4F46E5",
  colorB = "#F59E0B",
}: Props) {
  const n = data.length;
  const angleStep = 360 / n;

  const rings = [0.25, 0.5, 0.75, 1.0];

  function polygon(getValue: (d: DataPoint) => number): string {
    return data
      .map((d, i) => {
        const pct = getValue(d) / d.max;
        const [x, y] = polarToCart(i * angleStep, pct * RADIUS);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="flex flex-col items-center">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" style={{ maxWidth: SIZE }}>
        {/* Grid rings */}
        {rings.map((r) => (
          <polygon
            key={r}
            points={Array.from({ length: n }, (_, i) => {
              const [x, y] = polarToCart(i * angleStep, r * RADIUS);
              return `${x},${y}`;
            }).join(" ")}
            fill="none"
            className="stroke-gray-200 dark:stroke-gray-700"
            strokeWidth={0.5}
          />
        ))}

        {/* Axis lines */}
        {data.map((_, i) => {
          const [x, y] = polarToCart(i * angleStep, RADIUS);
          return (
            <line
              key={i}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Role A polygon */}
        <polygon
          points={polygon((d) => d.valueA)}
          fill={`${colorA}20`}
          stroke={colorA}
          strokeWidth={2}
        />

        {/* Role B polygon */}
        <polygon
          points={polygon((d) => d.valueB)}
          fill={`${colorB}20`}
          stroke={colorB}
          strokeWidth={2}
        />

        {/* Labels */}
        {data.map((d, i) => {
          const [x, y] = polarToCart(i * angleStep, RADIUS + 18);
          const short = d.label
            .replace("Task Automation Resistance", "Automation")
            .replace("Human Judgment Demand", "Judgment")
            .replace("Industry AI Adoption Speed", "Industry")
            .replace("Sociotechnical Barriers", "Barriers")
            .replace("Skill Adaptability", "Adaptability");
          return (
            <text
              key={d.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={10}
              className="fill-gray-500 dark:fill-gray-400"
              fontFamily="Inter, sans-serif"
            >
              {short}
            </text>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: colorA }} />
          <span className="font-medium text-gray-700 dark:text-gray-300">{labelA}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: colorB }} />
          <span className="font-medium text-gray-700 dark:text-gray-300">{labelB}</span>
        </div>
      </div>
    </div>
  );
}
