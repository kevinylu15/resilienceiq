/**
 * Client-side replication of the Python scoring engine's skill_adaptability
 * component. Used by the What-if Modeler so it can project score changes
 * without making an API call.
 *
 * Keep in sync with backend/scoring/scoring_engine.py → _adaptability_score()
 */

export const EDUCATION_LABELS: Record<string, string> = {
  high_school:   "High School / GED",
  some_college:  "Some College",
  associates:    "Associate's Degree",
  bachelors:     "Bachelor's Degree",
  masters:       "Master's Degree",
  phd:           "PhD",
  professional:  "Professional Degree (MD, JD…)",
};

const EDU_PTS: Record<string, number> = {
  high_school:   20,
  some_college:  45,
  associates:    70,
  bachelors:    110,
  masters:      150,
  phd:          160,
  professional: 160,
};

function experiencePts(years: number): number {
  if (years <= 2)  return 10;
  if (years <= 5)  return 20;
  if (years <= 10) return 32;
  if (years <= 20) return 40;
  return Math.max(30, 40 - Math.floor((years - 20) / 3));
}

export function adaptabilityScore(education: string, yearsExperience: number): number {
  const edu = EDU_PTS[education] ?? 50;
  const exp = experiencePts(yearsExperience);
  return Math.min(edu + exp, 200);
}

/**
 * Project a new total score given changed inputs.
 * Only skill_adaptability is recalculated client-side.
 * The other four components are read from the existing result's factor list.
 */
export function projectScore(
  currentScore: number,
  currentFactors: { name: string; score: number }[],
  originalEducation: string,
  originalYears: number,
  newEducation: string,
  newYears: number,
): number {
  const currentAdaptability =
    currentFactors.find((f) => f.name === "Skill Adaptability")?.score ?? 0;
  const baseScore = currentScore - currentAdaptability;
  const newAdaptability = adaptabilityScore(newEducation, newYears);
  return Math.min(850, Math.max(0, baseScore + newAdaptability));
}

export function scoreLabel(score: number): string {
  if (score < 200) return "At Risk";
  if (score < 350) return "Vulnerable";
  if (score < 500) return "Developing";
  if (score < 650) return "Resilient";
  return "Future-Proof";
}

export function scoreColor(score: number): string {
  if (score < 200) return "#EF4444";
  if (score < 350) return "#F97316";
  if (score < 500) return "#F59E0B";
  if (score < 650) return "#10B981";
  return "#059669";
}
