"""
Tests for ResilienceIQ scoring engine.
Covers: fuzzy matching, adaptability scoring, component math,
score labels, fallback recommendations, Gemini integration (mocked),
and full calculate_score integration.
"""

import os
import json
import pytest
from unittest.mock import patch, MagicMock

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "resilienceiq.settings")
import django
django.setup()

from django.core.cache import cache as django_cache

from scoring.scoring_engine import (
    JOB_PROFILES,
    INDUSTRY_DEFAULTS,
    COMPONENT_META,
    _find_job_profile,
    _adaptability_score,
    _profile_to_components,
    _score_label,
    _fallback_recommendations,
    _assess_unknown_job,
    _get_gemini_recommendations,
    calculate_score,
)


@pytest.fixture(autouse=True)
def clear_cache():
    """Flush the Django cache before each test so cached Gemini results don't leak."""
    django_cache.clear()
    yield
    django_cache.clear()


# ── _find_job_profile ────────────────────────────────────────────────────────

class TestFindJobProfile:
    def test_exact_match(self):
        profile, title = _find_job_profile("nurse")
        assert profile is not None
        assert title == "nurse"
        assert profile == JOB_PROFILES["nurse"]

    def test_exact_match_case_insensitive(self):
        profile, title = _find_job_profile("Nurse")
        assert title == "nurse"

    def test_exact_match_with_whitespace(self):
        profile, title = _find_job_profile("  nurse  ")
        assert title == "nurse"

    def test_fuzzy_match_close_title(self):
        profile, title = _find_job_profile("software engineers")
        assert profile is not None
        assert title == "software engineer"

    def test_no_match_unknown_title(self):
        profile, title = _find_job_profile("quantum entanglement specialist")
        assert profile is None
        assert title is None

    def test_barista_does_not_match_artist(self):
        """Cutoff 0.80 should prevent barista→artist false positive."""
        profile, title = _find_job_profile("barista")
        assert profile is None
        assert title is None

    def test_every_profile_matches_itself(self):
        """Every key in JOB_PROFILES should exact-match."""
        for key in JOB_PROFILES:
            profile, title = _find_job_profile(key)
            assert profile is not None, f"{key} did not match itself"
            assert title == key

    def test_multi_word_exact(self):
        profile, title = _find_job_profile("data entry clerk")
        assert title == "data entry clerk"

    def test_multi_word_fuzzy(self):
        profile, title = _find_job_profile("mechanical engineers")
        assert profile is not None
        assert title == "mechanical engineer"


# ── _adaptability_score ──────────────────────────────────────────────────────

class TestAdaptabilityScore:
    @pytest.mark.parametrize("edu,expected_edu_pts", [
        ("high_school", 20),
        ("some_college", 45),
        ("associates", 70),
        ("bachelors", 110),
        ("masters", 150),
        ("phd", 160),
        ("professional", 160),
    ])
    def test_education_levels_at_10_years(self, edu, expected_edu_pts):
        """At 10 years experience (32 exp pts), score = edu + 32."""
        score = _adaptability_score(edu, 10)
        assert score == expected_edu_pts + 32

    def test_unknown_education_defaults_to_50(self):
        score = _adaptability_score("unknown_degree", 10)
        assert score == 50 + 32

    @pytest.mark.parametrize("years,expected_exp_pts", [
        (0, 10),
        (1, 10),
        (2, 10),
        (3, 20),
        (5, 20),
        (6, 32),
        (10, 32),
        (11, 40),
        (20, 40),
    ])
    def test_experience_brackets(self, years, expected_exp_pts):
        """Test each experience bracket with bachelors (110 edu pts)."""
        score = _adaptability_score("bachelors", years)
        assert score == 110 + expected_exp_pts

    def test_very_long_career_decay(self):
        """20+ years: exp_pts = max(30, 40 - (years-20)//3)."""
        # 23 years → 40 - (3//3) = 39
        assert _adaptability_score("bachelors", 23) == 110 + 39
        # 26 years → 40 - (6//3) = 38
        assert _adaptability_score("bachelors", 26) == 110 + 38
        # 50 years → 40 - (30//3) = 30 → clamped at 30
        assert _adaptability_score("bachelors", 50) == 110 + 30

    def test_very_long_career_floor_at_30(self):
        """Decay never goes below 30 exp pts."""
        score = _adaptability_score("bachelors", 100)
        assert score == 110 + 30

    def test_max_score_is_200(self):
        """phd (160) + 20 years (40) = 200, should not exceed."""
        assert _adaptability_score("phd", 20) == 200

    def test_never_exceeds_200(self):
        assert _adaptability_score("professional", 15) <= 200

    def test_minimum_score(self):
        """high_school (20) + 0 years (10) = 30."""
        assert _adaptability_score("high_school", 0) == 30

    def test_negative_years_treated_as_low(self):
        """Negative years fall into the <=2 bracket (10 pts)."""
        score = _adaptability_score("bachelors", -5)
        assert score == 110 + 10


# ── _profile_to_components ───────────────────────────────────────────────────

class TestProfileToComponents:
    def test_known_profile_nurse(self):
        profile = JOB_PROFILES["nurse"]
        adapt = 150
        c = _profile_to_components(profile, adapt)
        # ar=3.5 → (1-0.35)*200 = 130
        assert c["task_automation"] == 130
        # jd=8.5 → 0.85*150 = 127.5 → 128
        assert c["human_judgment"] == 128
        # ia=5.0 → (1-0.5)*150 = 75
        assert c["industry_resilience"] == 75
        # sb=9.0 → 0.9*150 = 135
        assert c["sociotechnical"] == 135
        assert c["skill_adaptability"] == 150

    def test_max_values(self):
        """ar=0, jd=10, ia=0, sb=10 → all maxed out."""
        profile = {"ar": 0, "jd": 10, "ia": 0, "sb": 10}
        c = _profile_to_components(profile, 200)
        assert c["task_automation"] == 200
        assert c["human_judgment"] == 150
        assert c["industry_resilience"] == 150
        assert c["sociotechnical"] == 150
        assert c["skill_adaptability"] == 200
        assert sum(c.values()) == 850

    def test_min_values(self):
        """ar=10, jd=0, ia=10, sb=0 → all zeroed out."""
        profile = {"ar": 10, "jd": 0, "ia": 10, "sb": 0}
        c = _profile_to_components(profile, 0)
        assert c["task_automation"] == 0
        assert c["human_judgment"] == 0
        assert c["industry_resilience"] == 0
        assert c["sociotechnical"] == 0
        assert c["skill_adaptability"] == 0
        assert sum(c.values()) == 0

    def test_all_profiles_produce_valid_components(self):
        """Every profile in JOB_PROFILES yields components within max bounds."""
        for key, profile in JOB_PROFILES.items():
            c = _profile_to_components(profile, 100)
            assert 0 <= c["task_automation"] <= 200, f"{key} task_automation OOB"
            assert 0 <= c["human_judgment"] <= 150, f"{key} human_judgment OOB"
            assert 0 <= c["industry_resilience"] <= 150, f"{key} industry_resilience OOB"
            assert 0 <= c["sociotechnical"] <= 150, f"{key} sociotechnical OOB"


# ── _score_label ─────────────────────────────────────────────────────────────

class TestScoreLabel:
    @pytest.mark.parametrize("score,label", [
        (0, "At Risk"),
        (199, "At Risk"),
        (200, "Vulnerable"),
        (349, "Vulnerable"),
        (350, "Developing"),
        (499, "Developing"),
        (500, "Resilient"),
        (649, "Resilient"),
        (650, "Future-Proof"),
        (850, "Future-Proof"),
    ])
    def test_label_boundaries(self, score, label):
        assert _score_label(score) == label


# ── _fallback_recommendations ────────────────────────────────────────────────

class TestFallbackRecommendations:
    @pytest.mark.parametrize("score", [0, 100, 349])
    def test_low_tier(self, score):
        recs = _fallback_recommendations(score)
        assert len(recs) == 3
        for r in recs:
            assert "title" in r
            assert "description" in r
            assert "resource_url" in r
            assert "resource_label" in r
            assert r["resource_url"].startswith("https://")

    @pytest.mark.parametrize("score", [350, 400, 549])
    def test_mid_tier(self, score):
        recs = _fallback_recommendations(score)
        assert len(recs) == 3
        assert recs[0]["title"] != _fallback_recommendations(100)[0]["title"]

    @pytest.mark.parametrize("score", [550, 700, 850])
    def test_high_tier(self, score):
        recs = _fallback_recommendations(score)
        assert len(recs) == 3
        assert recs[0]["title"] != _fallback_recommendations(100)[0]["title"]
        assert recs[0]["title"] != _fallback_recommendations(400)[0]["title"]

    def test_all_urls_are_valid_strings(self):
        for tier_score in [100, 400, 600]:
            for r in _fallback_recommendations(tier_score):
                assert isinstance(r["resource_url"], str)
                assert len(r["resource_url"]) > 10


# ── _assess_unknown_job (Gemini mocked) ──────────────────────────────────────

class TestAssessUnknownJob:
    @patch("scoring.scoring_engine._call_gemini")
    def test_valid_gemini_response(self, mock_gemini):
        mock_gemini.return_value = json.dumps({"ar": 5.0, "jd": 7.0, "ia": 4.0, "sb": 6.0})
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result is not None
        assert result["ar"] == 5.0
        assert result["jd"] == 7.0

    @patch("scoring.scoring_engine._call_gemini")
    def test_gemini_returns_none(self, mock_gemini):
        mock_gemini.return_value = None
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result is None

    @patch("scoring.scoring_engine._call_gemini")
    def test_gemini_returns_garbage(self, mock_gemini):
        mock_gemini.return_value = "I'm not sure what you mean"
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result is None

    @patch("scoring.scoring_engine._call_gemini")
    def test_gemini_returns_markdown_fenced_json(self, mock_gemini):
        mock_gemini.return_value = '```json\n{"ar": 3.0, "jd": 8.0, "ia": 2.0, "sb": 7.0}\n```'
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result is not None
        assert result["ar"] == 3.0

    @patch("scoring.scoring_engine._call_gemini")
    def test_gemini_values_clamped_to_0_10(self, mock_gemini):
        mock_gemini.return_value = json.dumps({"ar": -5.0, "jd": 15.0, "ia": 4.0, "sb": 6.0})
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result["ar"] == 0.0
        assert result["jd"] == 10.0

    @patch("scoring.scoring_engine._call_gemini")
    def test_gemini_missing_key(self, mock_gemini):
        mock_gemini.return_value = json.dumps({"ar": 5.0, "jd": 7.0, "ia": 4.0})
        result = _assess_unknown_job("drone pilot", "transportation")
        assert result is None


# ── _get_gemini_recommendations (mocked) ─────────────────────────────────────

class TestGetGeminiRecommendations:
    SAMPLE_FACTORS = [
        {"name": "Task Automation Resistance", "score": 100, "max_score": 200},
        {"name": "Human Judgment Demand", "score": 80, "max_score": 150},
        {"name": "Industry AI Adoption Speed", "score": 60, "max_score": 150},
        {"name": "Sociotechnical Barriers", "score": 90, "max_score": 150},
        {"name": "Skill Adaptability", "score": 120, "max_score": 200},
    ]

    @patch("scoring.scoring_engine._call_gemini")
    def test_valid_response(self, mock_gemini):
        recs = [
            {"title": "Learn X", "description": "Because Y", "resource_url": "https://example.com", "resource_label": "Example"},
            {"title": "Build Z", "description": "Because W", "resource_url": "https://example.com/2", "resource_label": "Example 2"},
            {"title": "Practice A", "description": "Because B", "resource_url": "https://example.com/3", "resource_label": "Example 3"},
        ]
        mock_gemini.return_value = json.dumps(recs)
        result = _get_gemini_recommendations("nurse", "healthcare", 500, self.SAMPLE_FACTORS)
        assert result is not None
        assert len(result) == 3
        assert result[0]["title"] == "Learn X"

    @patch("scoring.scoring_engine._call_gemini")
    def test_returns_none_on_failure(self, mock_gemini):
        mock_gemini.return_value = None
        result = _get_gemini_recommendations("nurse", "healthcare", 500, self.SAMPLE_FACTORS)
        assert result is None

    @patch("scoring.scoring_engine._call_gemini")
    def test_rejects_wrong_count(self, mock_gemini):
        mock_gemini.return_value = json.dumps([{"title": "X", "description": "Y"}])
        result = _get_gemini_recommendations("nurse", "healthcare", 500, self.SAMPLE_FACTORS)
        assert result is None

    @patch("scoring.scoring_engine._call_gemini")
    def test_rejects_non_list(self, mock_gemini):
        mock_gemini.return_value = json.dumps({"title": "X"})
        result = _get_gemini_recommendations("nurse", "healthcare", 500, self.SAMPLE_FACTORS)
        assert result is None


# ── calculate_score (integration, Gemini mocked off) ─────────────────────────

class TestCalculateScore:
    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_known_job_returns_valid_structure(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert "score" in result
        assert "label" in result
        assert "factors" in result
        assert "recommendations" in result
        assert "matched_title" in result
        assert "used_ai_profile" in result
        assert "used_ai_recommendations" in result

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_score_in_range_0_850(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert 0 <= result["score"] <= 850

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_five_factors_returned(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert len(result["factors"]) == 5

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_factor_scores_within_max(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        for f in result["factors"]:
            assert 0 <= f["score"] <= f["max_score"], f"{f['name']} out of bounds"

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_three_recommendations(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert len(result["recommendations"]) == 3

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_known_title_not_ai_profile(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert result["used_ai_profile"] is False
        assert result["matched_title"] == "nurse"

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_unknown_title_falls_back_to_industry(self, _mock):
        result = calculate_score("quantum entanglement specialist", "technology", 5, "phd")
        assert result["matched_title"] == "quantum entanglement specialist (estimated)"
        assert result["used_ai_profile"] is False

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_fallback_recommendations_when_gemini_down(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert result["used_ai_recommendations"] is False
        assert len(result["recommendations"]) == 3

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_score_sum_equals_components(self, _mock):
        """Total score must equal the sum of all factor scores."""
        result = calculate_score("data scientist", "technology", 8, "masters")
        factor_sum = sum(f["score"] for f in result["factors"])
        assert result["score"] == factor_sum

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_higher_education_yields_higher_score(self, _mock):
        """Same job, same experience — higher education should produce a higher score."""
        low = calculate_score("nurse", "healthcare", 10, "high_school")
        high = calculate_score("nurse", "healthcare", 10, "phd")
        assert high["score"] > low["score"]

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_label_matches_score(self, _mock):
        result = calculate_score("nurse", "healthcare", 10, "bachelors")
        assert result["label"] == _score_label(result["score"])

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_all_profiles_produce_valid_scores(self, _mock):
        """Sweep all 65+ profiles and verify score stays in [0, 850]."""
        for title in JOB_PROFILES:
            result = calculate_score(title, "other", 10, "bachelors")
            assert 0 <= result["score"] <= 850, f"{title} score {result['score']} out of range"
            assert len(result["factors"]) == 5
            assert len(result["recommendations"]) == 3

    @patch("scoring.scoring_engine._call_gemini")
    def test_ai_profile_used_when_gemini_succeeds(self, mock_gemini):
        """When Gemini returns a valid profile for unknown job, used_ai_profile=True."""
        ai_profile = json.dumps({"ar": 4.0, "jd": 7.0, "ia": 3.0, "sb": 6.0})
        mock_gemini.side_effect = [
            ai_profile,  # _assess_unknown_job call
            None,         # _get_gemini_recommendations call → fallback
        ]
        result = calculate_score("drone pilot", "transportation", 5, "bachelors")
        assert result["used_ai_profile"] is True
        assert result["matched_title"] == "drone pilot"

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_unknown_industry_falls_back_to_other(self, _mock):
        result = calculate_score("mystery job xyz", "nonexistent_industry", 5, "bachelors")
        assert "(estimated)" in result["matched_title"]
        assert 0 <= result["score"] <= 850


# ── Monotonicity / sanity checks ─────────────────────────────────────────────

class TestMonotonicity:
    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_data_entry_scores_lower_than_surgeon(self, _mock):
        """High-risk role should score lower than low-risk role at same edu/exp."""
        clerk = calculate_score("data entry clerk", "other", 10, "bachelors")
        surgeon = calculate_score("surgeon", "healthcare", 10, "bachelors")
        assert clerk["score"] < surgeon["score"]

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_telemarketer_is_at_risk_or_vulnerable(self, _mock):
        result = calculate_score("telemarketer", "retail", 2, "high_school")
        assert result["label"] in ("At Risk", "Vulnerable")

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_therapist_is_resilient_or_future_proof(self, _mock):
        result = calculate_score("therapist", "healthcare", 15, "masters")
        assert result["label"] in ("Resilient", "Future-Proof")


# ── COMPONENT_META consistency ───────────────────────────────────────────────

class TestComponentMeta:
    def test_max_scores_sum_to_850(self):
        total = sum(m["max"] for m in COMPONENT_META.values())
        assert total == 850

    def test_five_components(self):
        assert len(COMPONENT_META) == 5

    def test_all_components_have_required_keys(self):
        for key, meta in COMPONENT_META.items():
            assert "name" in meta
            assert "max" in meta
            assert "description" in meta
            assert isinstance(meta["max"], int)
            assert meta["max"] > 0


# ── INDUSTRY_DEFAULTS ────────────────────────────────────────────────────────

class TestIndustryDefaults:
    def test_other_exists(self):
        assert "other" in INDUSTRY_DEFAULTS

    def test_all_defaults_have_four_keys(self):
        for ind, profile in INDUSTRY_DEFAULTS.items():
            assert set(profile.keys()) == {"ar", "jd", "ia", "sb"}, f"{ind} missing keys"

    def test_all_values_in_range(self):
        for ind, profile in INDUSTRY_DEFAULTS.items():
            for k, v in profile.items():
                assert 0 <= v <= 10, f"{ind}.{k} = {v} out of [0,10]"
