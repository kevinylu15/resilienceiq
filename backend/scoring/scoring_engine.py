"""
ResilienceIQ Scoring Engine
============================
Calculates an AI displacement resilience score (0–850) for a given job profile.

Score components (max values sum to 850):
  task_automation_score     0–200   Higher = tasks are hard to automate
  human_judgment_score      0–150   Higher = job demands uniquely human judgment
  industry_resilience_score 0–150   Higher = AI adoption in this sector is slow
  sociotechnical_score      0–150   Higher = strong regulatory/physical/social barriers
  skill_adaptability_score  0–200   Higher = education + experience enable quick pivoting
"""

import os
import json
import hashlib
import difflib
import logging
from typing import Optional

from dotenv import load_dotenv
from django.core.cache import cache

load_dotenv()
logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Job profile database ───────────────────────────────────────────────────
# Each entry: (automation_risk, judgment_demand, industry_adoption, social_barriers)
# All values on a 0–10 scale; higher means MORE of that attribute.
# automation_risk:    10 = trivially automatable (data entry)
# judgment_demand:    10 = demands maximum human judgment (surgery, therapy)
# industry_adoption:  10 = AI being deployed very fast (finance, tech)
# social_barriers:    10 = strong legal/physical/social protection (medicine, law)

JOB_PROFILES: dict[str, dict[str, float]] = {
    # ── Very high automation risk ──────────────────────────────────────────
    "data entry clerk":              {"ar": 9.5, "jd": 1.0, "ia": 8.5, "sb": 1.5},
    "telemarketer":                  {"ar": 9.0, "jd": 2.0, "ia": 8.0, "sb": 1.5},
    "bookkeeper":                    {"ar": 8.5, "jd": 3.0, "ia": 7.5, "sb": 2.5},
    "cashier":                       {"ar": 8.5, "jd": 2.0, "ia": 7.5, "sb": 2.0},
    "bank teller":                   {"ar": 8.5, "jd": 2.5, "ia": 8.0, "sb": 3.0},
    "insurance underwriter":         {"ar": 8.0, "jd": 4.0, "ia": 7.5, "sb": 4.0},
    "loan officer":                  {"ar": 7.5, "jd": 4.5, "ia": 7.5, "sb": 5.0},
    "tax preparer":                  {"ar": 8.5, "jd": 3.5, "ia": 7.0, "sb": 3.0},
    "assembly line worker":          {"ar": 8.0, "jd": 2.0, "ia": 7.0, "sb": 3.0},
    "factory worker":                {"ar": 8.0, "jd": 2.0, "ia": 7.0, "sb": 3.0},
    "dispatcher":                    {"ar": 7.0, "jd": 4.0, "ia": 6.5, "sb": 4.0},
    "translator":                    {"ar": 8.0, "jd": 5.0, "ia": 7.0, "sb": 3.0},
    # ── High automation risk ───────────────────────────────────────────────
    "accountant":                    {"ar": 6.5, "jd": 5.5, "ia": 6.5, "sb": 5.0},
    "financial analyst":             {"ar": 6.0, "jd": 6.0, "ia": 7.5, "sb": 5.0},
    "customer service representative": {"ar": 7.5, "jd": 4.5, "ia": 7.0, "sb": 2.5},
    "customer service":              {"ar": 7.5, "jd": 4.5, "ia": 7.0, "sb": 2.5},
    "paralegal":                     {"ar": 6.5, "jd": 5.5, "ia": 5.5, "sb": 6.5},
    "journalist":                    {"ar": 5.5, "jd": 7.5, "ia": 5.0, "sb": 3.5},
    "writer":                        {"ar": 6.0, "jd": 7.0, "ia": 4.5, "sb": 3.0},
    "procurement specialist":        {"ar": 6.5, "jd": 5.0, "ia": 6.0, "sb": 4.0},
    "radiologist":                   {"ar": 7.0, "jd": 8.0, "ia": 7.0, "sb": 9.0},
    # ── Medium automation risk ─────────────────────────────────────────────
    "software engineer":             {"ar": 4.5, "jd": 7.5, "ia": 8.5, "sb": 4.0},
    "software developer":            {"ar": 4.5, "jd": 7.5, "ia": 8.5, "sb": 4.0},
    "programmer":                    {"ar": 5.0, "jd": 7.0, "ia": 8.5, "sb": 4.0},
    "web developer":                 {"ar": 5.0, "jd": 7.0, "ia": 8.0, "sb": 3.5},
    "data analyst":                  {"ar": 5.5, "jd": 6.5, "ia": 7.5, "sb": 4.0},
    "data scientist":                {"ar": 4.0, "jd": 8.0, "ia": 7.5, "sb": 4.5},
    "marketing manager":             {"ar": 4.0, "jd": 7.5, "ia": 6.0, "sb": 4.0},
    "sales manager":                 {"ar": 3.5, "jd": 8.0, "ia": 5.5, "sb": 4.0},
    "human resources manager":       {"ar": 4.5, "jd": 7.5, "ia": 5.5, "sb": 5.5},
    "project manager":               {"ar": 4.0, "jd": 8.0, "ia": 5.5, "sb": 4.5},
    "operations manager":            {"ar": 4.5, "jd": 7.5, "ia": 5.5, "sb": 4.5},
    "graphic designer":              {"ar": 5.5, "jd": 7.5, "ia": 5.0, "sb": 3.0},
    "ux designer":                   {"ar": 4.0, "jd": 8.5, "ia": 5.0, "sb": 3.5},
    "product manager":               {"ar": 3.5, "jd": 8.5, "ia": 6.0, "sb": 4.0},
    # ── Medium-low automation risk ─────────────────────────────────────────
    "teacher":                       {"ar": 3.0, "jd": 8.5, "ia": 3.5, "sb": 7.0},
    "professor":                     {"ar": 2.5, "jd": 9.0, "ia": 3.0, "sb": 7.5},
    "doctor":                        {"ar": 3.0, "jd": 9.5, "ia": 5.5, "sb": 9.5},
    "physician":                     {"ar": 3.0, "jd": 9.5, "ia": 5.5, "sb": 9.5},
    "surgeon":                       {"ar": 2.5, "jd": 9.5, "ia": 4.5, "sb": 9.5},
    "nurse":                         {"ar": 3.5, "jd": 8.5, "ia": 5.0, "sb": 9.0},
    "dentist":                       {"ar": 3.0, "jd": 9.0, "ia": 4.5, "sb": 9.5},
    "pharmacist":                    {"ar": 4.5, "jd": 7.5, "ia": 5.5, "sb": 8.5},
    "architect":                     {"ar": 3.5, "jd": 8.5, "ia": 4.5, "sb": 7.0},
    "civil engineer":                {"ar": 3.5, "jd": 8.5, "ia": 5.0, "sb": 7.0},
    "mechanical engineer":           {"ar": 3.5, "jd": 8.5, "ia": 5.5, "sb": 6.5},
    "lawyer":                        {"ar": 4.0, "jd": 8.5, "ia": 4.5, "sb": 8.5},
    "attorney":                      {"ar": 4.0, "jd": 8.5, "ia": 4.5, "sb": 8.5},
    "judge":                         {"ar": 2.5, "jd": 9.5, "ia": 3.0, "sb": 9.5},
    "psychologist":                  {"ar": 2.0, "jd": 9.5, "ia": 3.0, "sb": 8.5},
    "social worker":                 {"ar": 2.5, "jd": 9.0, "ia": 3.0, "sb": 8.0},
    "physical therapist":            {"ar": 2.5, "jd": 8.5, "ia": 4.0, "sb": 8.5},
    "occupational therapist":        {"ar": 2.5, "jd": 8.5, "ia": 3.5, "sb": 8.5},
    # ── Low automation risk ────────────────────────────────────────────────
    "therapist":                     {"ar": 1.5, "jd": 9.5, "ia": 2.5, "sb": 8.5},
    "counselor":                     {"ar": 1.5, "jd": 9.5, "ia": 2.5, "sb": 8.5},
    "mental health counselor":       {"ar": 1.5, "jd": 9.5, "ia": 2.5, "sb": 8.5},
    "psychiatrist":                  {"ar": 2.0, "jd": 9.5, "ia": 3.5, "sb": 9.5},
    "plumber":                       {"ar": 1.5, "jd": 6.5, "ia": 2.5, "sb": 7.5},
    "electrician":                   {"ar": 1.5, "jd": 7.0, "ia": 2.5, "sb": 7.5},
    "carpenter":                     {"ar": 2.0, "jd": 6.5, "ia": 2.5, "sb": 7.0},
    "hvac technician":               {"ar": 2.0, "jd": 6.5, "ia": 2.5, "sb": 7.0},
    "police officer":                {"ar": 3.0, "jd": 7.5, "ia": 4.0, "sb": 9.5},
    "firefighter":                   {"ar": 1.5, "jd": 8.0, "ia": 3.0, "sb": 9.5},
    "paramedic":                     {"ar": 2.0, "jd": 8.5, "ia": 4.0, "sb": 9.5},
    "chef":                          {"ar": 3.0, "jd": 7.5, "ia": 3.0, "sb": 5.0},
    "artist":                        {"ar": 3.0, "jd": 9.0, "ia": 3.5, "sb": 3.5},
    "musician":                      {"ar": 2.5, "jd": 9.0, "ia": 3.0, "sb": 4.0},
    "actor":                         {"ar": 2.5, "jd": 9.0, "ia": 3.5, "sb": 4.5},
    "clergy":                        {"ar": 1.0, "jd": 9.5, "ia": 1.5, "sb": 9.5},
    "veterinarian":                  {"ar": 2.5, "jd": 9.0, "ia": 4.0, "sb": 9.0},
}

# Fallback when job title is unknown AND Gemini is unavailable.
INDUSTRY_DEFAULTS: dict[str, dict[str, float]] = {
    "technology":    {"ar": 5.0, "jd": 7.0, "ia": 8.0, "sb": 4.0},
    "finance":       {"ar": 6.0, "jd": 6.0, "ia": 7.5, "sb": 5.0},
    "healthcare":    {"ar": 3.5, "jd": 8.5, "ia": 5.0, "sb": 9.0},
    "education":     {"ar": 3.0, "jd": 8.5, "ia": 3.5, "sb": 7.0},
    "manufacturing": {"ar": 7.0, "jd": 4.0, "ia": 6.5, "sb": 4.5},
    "retail":        {"ar": 7.0, "jd": 4.5, "ia": 7.0, "sb": 3.5},
    "legal":         {"ar": 4.5, "jd": 8.5, "ia": 4.0, "sb": 8.5},
    "government":    {"ar": 4.0, "jd": 7.5, "ia": 3.5, "sb": 8.0},
    "arts":          {"ar": 4.0, "jd": 8.5, "ia": 3.5, "sb": 4.0},
    "construction":  {"ar": 3.0, "jd": 7.0, "ia": 3.0, "sb": 7.5},
    "transportation":{"ar": 6.5, "jd": 5.0, "ia": 6.0, "sb": 5.5},
    "other":         {"ar": 5.0, "jd": 6.5, "ia": 5.0, "sb": 5.5},
}

# ── Gemini integration ─────────────────────────────────────────────────────

_gemini_model = None


def _get_gemini_model():
    """Lazy-initialize the Gemini model once."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model
    if not GEMINI_API_KEY:
        return None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
        return _gemini_model
    except Exception as exc:
        logger.warning("Gemini init failed: %s", exc)
        return None


def _call_gemini(prompt: str) -> Optional[str]:
    """Call Gemini and return raw text, or None on any failure."""
    model = _get_gemini_model()
    if model is None:
        return None
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as exc:
        logger.warning("Gemini call failed: %s", exc)
        return None


def _cache_key(*parts: str) -> str:
    """Build a safe cache key from variable-length string parts."""
    raw = ":".join(p.lower().strip() for p in parts)
    return "riq:" + hashlib.sha256(raw.encode()).hexdigest()[:32]


def _assess_unknown_job(job_title: str, industry: str) -> Optional[dict]:
    """
    Ask Gemini to rate an unknown job title on the four raw dimensions.
    Returns a dict with keys ar, jd, ia, sb (floats 0–10), or None on failure.
    Results are cached for 7 days.
    """
    key = _cache_key("profile", job_title, industry)
    cached = cache.get(key)
    if cached is not None:
        return cached

    prompt = f"""You are an expert in labor economics and AI automation risk.

Rate the job "{job_title}" in the "{industry}" industry on four dimensions (0–10 scale):
- automation_risk (ar): How automatable are the core tasks? (10 = trivially automatable like data entry, 0 = cannot be automated)
- judgment_demand (jd): How much does this job require uniquely human judgment/creativity/empathy? (10 = maximum like psychotherapy)
- industry_adoption (ia): How fast is AI being deployed in this industry? (10 = very fast like financial trading, 0 = negligible)
- social_barriers (sb): How strong are regulatory, licensing, physical, or social barriers protecting this role? (10 = very strong like licensed surgery)

Return ONLY valid JSON with exactly this structure (no markdown, no extra text):
{{"ar": <float>, "jd": <float>, "ia": <float>, "sb": <float>}}"""

    raw = _call_gemini(prompt)
    if raw is None:
        return None
    try:
        text = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(text)
        result = {}
        for k in ("ar", "jd", "ia", "sb"):
            if k not in data:
                return None
            result[k] = max(0.0, min(10.0, float(data[k])))
        cache.set(key, result)
        return result
    except (json.JSONDecodeError, ValueError, KeyError) as exc:
        logger.warning("Gemini profile parse failed: %s | raw=%s", exc, raw[:200])
        return None


def _get_gemini_recommendations(
    job_title: str, industry: str, score: int, factors: list[dict]
) -> Optional[list[dict]]:
    """
    Ask Gemini for 3 personalized, actionable upskilling recommendations.
    Returns a list of dicts with keys title, description, resource_url, resource_label.
    Results are cached for 7 days, bucketed by 50-point score ranges.
    """
    score_bucket = (score // 50) * 50
    key = _cache_key("recs", job_title, industry, str(score_bucket))
    cached = cache.get(key)
    if cached is not None:
        return cached

    factor_summary = "\n".join(
        f"  - {f['name']}: {f['score']}/{f['max_score']}" for f in factors
    )
    prompt = f"""You are a career resilience coach helping someone understand and improve their AI displacement risk.

The user is a "{job_title}" in the "{industry}" industry.
Their overall ResilienceIQ score is {score}/850.
Their factor breakdown:
{factor_summary}

Provide exactly 3 specific, actionable upskilling recommendations tailored to this person.
Each recommendation must:
- Address a real gap shown in the factor breakdown
- Include a specific, freely available online resource (Coursera free audit, YouTube, Khan Academy, MIT OpenCourseWare, etc.)
- Be concrete, not generic ("Learn Python on Kaggle" not "learn to code")

Return ONLY valid JSON (no markdown, no extra text):
[
  {{
    "title": "Short action title (5-8 words)",
    "description": "2-3 sentence explanation of why this matters for this specific person and how it reduces AI risk.",
    "resource_url": "https://...",
    "resource_label": "Platform name — course title"
  }},
  {{ ... }},
  {{ ... }}
]"""

    raw = _call_gemini(prompt)
    if raw is None:
        return None
    try:
        text = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(text)
        if not isinstance(data, list) or len(data) != 3:
            return None
        validated = []
        for item in data:
            validated.append({
                "title": str(item.get("title", "")),
                "description": str(item.get("description", "")),
                "resource_url": str(item.get("resource_url", "")),
                "resource_label": str(item.get("resource_label", "")),
            })
        cache.set(key, validated)
        return validated
    except (json.JSONDecodeError, ValueError, AttributeError) as exc:
        logger.warning("Gemini recommendations parse failed: %s | raw=%s", exc, raw[:200])
        return None


# ── Fallback recommendations ───────────────────────────────────────────────

def _fallback_recommendations(score: int) -> list[dict]:
    """Static recommendations bucketed by score range."""
    if score < 350:
        return [
            {
                "title": "Master AI Tools in Your Field",
                "description": (
                    "Workers who collaborate with AI tools consistently outperform those who compete "
                    "with them. Identify the two or three AI tools most used in your role and become "
                    "the team expert. This shifts you from 'replaceable by AI' to 'enhanced by AI'."
                ),
                "resource_url": "https://grow.google/certificates/",
                "resource_label": "Google Career Certificates — Free",
            },
            {
                "title": "Build Human-Centered Communication Skills",
                "description": (
                    "Tasks requiring nuanced human judgment, persuasion, and trust-building are among "
                    "the last to be automated. Courses in negotiation, facilitation, and stakeholder "
                    "management add a layer of protection no LLM can easily replicate."
                ),
                "resource_url": "https://www.coursera.org/learn/negotiation",
                "resource_label": "Coursera — Successful Negotiation (Free Audit)",
            },
            {
                "title": "Transition Into an AI-Adjacent Specialty",
                "description": (
                    "Your domain knowledge is an asset — the goal is to attach it to a role that "
                    "manages or evaluates AI outputs rather than competing with them. Explore "
                    "AI product management, AI auditing, or AI training data roles."
                ),
                "resource_url": "https://www.deeplearning.ai/courses/ai-for-everyone/",
                "resource_label": "DeepLearning.AI — AI for Everyone (Free)",
            },
        ]
    if score < 550:
        return [
            {
                "title": "Learn Prompt Engineering",
                "description": (
                    "Prompt engineering is the fastest-growing adjacent skill across all industries. "
                    "Knowing how to direct AI models effectively makes you a force-multiplier on your "
                    "team and signals adaptability to employers."
                ),
                "resource_url": "https://www.coursera.org/learn/prompt-engineering",
                "resource_label": "Coursera — Prompt Engineering for ChatGPT (Free Audit)",
            },
            {
                "title": "Develop Cross-Functional Strategy Skills",
                "description": (
                    "Roles that require synthesizing information across departments and making "
                    "judgment calls under uncertainty are highly resilient. An MBA-style strategy "
                    "course sharpens this without needing a degree."
                ),
                "resource_url": "https://ocw.mit.edu/courses/15-390-new-enterprises-spring-2013/",
                "resource_label": "MIT OpenCourseWare — Strategy (Free)",
            },
            {
                "title": "Build a Public Portfolio of Your Work",
                "description": (
                    "AI can generate generic output; it cannot replicate your specific judgment and "
                    "track record. A public portfolio (GitHub, LinkedIn articles, case studies) "
                    "makes your expertise legible and harder to commoditize."
                ),
                "resource_url": "https://www.linkedin.com/learning/",
                "resource_label": "LinkedIn Learning — Building Your Portfolio",
            },
        ]
    # score >= 550 (resilient)
    return [
        {
            "title": "Stay Ahead: Follow AI Progress in Your Field",
            "description": (
                "Your score is strong, but AI capabilities evolve quickly. Spending 30 minutes "
                "per week reading field-specific AI news ensures you catch disruptions early and "
                "can adapt before they affect your role."
            ),
            "resource_url": "https://www.technologyreview.com/",
            "resource_label": "MIT Technology Review — Free Articles",
        },
        {
            "title": "Mentor Others on AI Integration",
            "description": (
                "The most resilient workers become the people who help organizations adopt AI safely. "
                "Volunteering as an internal AI champion or mentor raises your profile and locks in "
                "your value through organizational relationships."
            ),
            "resource_url": "https://www.coursera.org/learn/ai-for-good",
            "resource_label": "Coursera — AI For Good (Free Audit)",
        },
        {
            "title": "Develop Adjacent Technical Literacy",
            "description": (
                "Even in a protected role, understanding how AI tools work makes you a better "
                "evaluator of AI-generated output. A basic Python or data literacy course sharpens "
                "your critical eye without requiring you to become an engineer."
            ),
            "resource_url": "https://www.kaggle.com/learn/python",
            "resource_label": "Kaggle — Python (Free)",
        },
    ]


# ── Core calculations ──────────────────────────────────────────────────────

def _find_job_profile(job_title: str) -> tuple[Optional[dict], Optional[str]]:
    """Return the best-matching profile from JOB_PROFILES, or None."""
    normalized = job_title.lower().strip()
    if normalized in JOB_PROFILES:
        return JOB_PROFILES[normalized], normalized

    matches = difflib.get_close_matches(normalized, JOB_PROFILES.keys(), n=1, cutoff=0.80)
    if matches:
        return JOB_PROFILES[matches[0]], matches[0]

    return None, None


def _adaptability_score(education: str, years_experience: int) -> int:
    """
    Skill adaptability component (0–200).
    Education contributes up to 160 pts; experience up to 40 pts.
    Very long careers get a slight penalty reflecting possible skill staleness.
    """
    edu_pts = {
        "high_school":   20,
        "some_college":  45,
        "associates":    70,
        "bachelors":    110,
        "masters":      150,
        "phd":          160,
        "professional": 160,
    }.get(education, 50)

    if years_experience <= 2:
        exp_pts = 10
    elif years_experience <= 5:
        exp_pts = 20
    elif years_experience <= 10:
        exp_pts = 32
    elif years_experience <= 20:
        exp_pts = 40
    else:
        # 20+ years: slight decay; deep expertise but potential for skill staleness
        exp_pts = max(30, 40 - (years_experience - 20) // 3)

    return min(edu_pts + exp_pts, 200)


def _profile_to_components(profile: dict, adaptability: int) -> dict:
    """Convert raw profile values into named component scores."""
    ar, jd, ia, sb = profile["ar"], profile["jd"], profile["ia"], profile["sb"]
    return {
        "task_automation":     round((1 - ar / 10) * 200),
        "human_judgment":      round((jd / 10) * 150),
        "industry_resilience": round((1 - ia / 10) * 150),
        "sociotechnical":      round((sb / 10) * 150),
        "skill_adaptability":  adaptability,
    }


def _score_label(score: int) -> str:
    if score < 200:
        return "At Risk"
    if score < 350:
        return "Vulnerable"
    if score < 500:
        return "Developing"
    if score < 650:
        return "Resilient"
    return "Future-Proof"


COMPONENT_META = {
    "task_automation": {
        "name": "Task Automation Resistance",
        "max": 200,
        "description": "How hard it is for AI to automate your core daily tasks.",
    },
    "human_judgment": {
        "name": "Human Judgment Demand",
        "max": 150,
        "description": "The degree to which your role requires creativity, empathy, and complex reasoning.",
    },
    "industry_resilience": {
        "name": "Industry AI Adoption Speed",
        "max": 150,
        "description": "How quickly AI is being deployed in your sector (inverted — slower = safer).",
    },
    "sociotechnical": {
        "name": "Sociotechnical Barriers",
        "max": 150,
        "description": "Regulatory, licensing, physical presence, and social trust requirements.",
    },
    "skill_adaptability": {
        "name": "Skill Adaptability",
        "max": 200,
        "description": "Your capacity to pivot quickly based on education level and career experience.",
    },
}


# ── Public API ─────────────────────────────────────────────────────────────

def calculate_score(
    job_title: str,
    industry: str,
    years_experience: int,
    education_level: str,
) -> dict:
    """
    Main entry point.  Returns a fully populated score result dict.

    Example return value:
    {
        "score": 612,
        "label": "Resilient",
        "matched_title": "nurse",
        "used_ai_profile": False,
        "used_ai_recommendations": True,
        "factors": [
            {"name": "Task Automation Resistance", "score": 130, "max_score": 200, "description": "..."},
            ...
        ],
        "recommendations": [
            {"title": "...", "description": "...", "resource_url": "...", "resource_label": "..."},
            ...
        ],
    }
    """
    # 1. Determine job profile
    profile, matched_title = _find_job_profile(job_title)
    used_ai_profile = False

    if profile is None:
        # Try Gemini for unknown title
        ai_profile = _assess_unknown_job(job_title, industry)
        if ai_profile is not None:
            profile = ai_profile
            matched_title = job_title
            used_ai_profile = True
        else:
            # Final fallback: industry defaults
            profile = INDUSTRY_DEFAULTS.get(industry, INDUSTRY_DEFAULTS["other"])
            matched_title = f"{job_title} (estimated)"

    # 2. Calculate adaptability sub-score
    adaptability = _adaptability_score(education_level, years_experience)

    # 3. Calculate all component scores
    components = _profile_to_components(profile, adaptability)

    # 4. Total score
    total = sum(components.values())
    total = max(0, min(850, total))  # clamp to [0, 850]

    # 5. Build factor list for the frontend
    factors = [
        {
            "name": COMPONENT_META[key]["name"],
            "score": components[key],
            "max_score": COMPONENT_META[key]["max"],
            "description": COMPONENT_META[key]["description"],
        }
        for key in COMPONENT_META
    ]

    # 6. Get recommendations (Gemini → fallback)
    recs = _get_gemini_recommendations(job_title, industry, total, factors)
    used_ai_recommendations = recs is not None
    if recs is None:
        recs = _fallback_recommendations(total)

    return {
        "score": total,
        "label": _score_label(total),
        "matched_title": matched_title,
        "used_ai_profile": used_ai_profile,
        "used_ai_recommendations": used_ai_recommendations,
        "factors": factors,
        "recommendations": recs,
    }
