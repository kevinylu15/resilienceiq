const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export interface ScoreInput {
  job_title: string;
  industry: string;
  years_experience: number;
  education_level: string;
}

export interface Factor {
  name: string;
  score: number;
  max_score: number;
  description: string;
}

export interface Recommendation {
  title: string;
  description: string;
  resource_url: string;
  resource_label: string;
}

export interface ScoreResult {
  score: number;
  label: string;
  matched_title: string;
  used_ai_profile: boolean;
  used_ai_recommendations: boolean;
  factors: Factor[];
  recommendations: Recommendation[];
}

export interface ApiError {
  errors: Record<string, string[]>;
}

export interface PercentileResult {
  percentile: number | null;
  total_scores: number;
  industry?: string;
  message?: string;
}

export async function fetchPercentile(
  score: number,
  industry?: string,
): Promise<PercentileResult> {
  const params = new URLSearchParams({ score: String(score) });
  if (industry) params.set("industry", industry);
  const response = await fetch(`${API_BASE}/api/score/percentile/?${params}`);
  if (!response.ok) throw new Error(`Percentile request failed (${response.status})`);
  return response.json() as Promise<PercentileResult>;
}

export async function calculateScore(input: ScoreInput): Promise<ScoreResult> {
  const response = await fetch(`${API_BASE}/api/score/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiError;
    // Flatten all field errors into a single readable message
    const messages = Object.values(body.errors ?? {})
      .flat()
      .join(" ");
    throw new Error(messages || `Request failed (${response.status})`);
  }

  return response.json() as Promise<ScoreResult>;
}
