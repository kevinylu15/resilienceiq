"""
Tests for score logging and percentile endpoint.
Uses Django's test client via pytest + django settings.
"""

import os
import json
import pytest
from unittest.mock import patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "resilienceiq.settings")

import django
django.setup()

from django.test import RequestFactory
from scoring.views import ScoreCalculateView, PercentileView
from scoring.models import ScoreLog


@pytest.fixture(autouse=True)
def clean_db():
    """Clear ScoreLog before each test."""
    ScoreLog.objects.all().delete()
    yield
    ScoreLog.objects.all().delete()


def _post_score(factory, data):
    request = factory.post(
        "/api/score/",
        data=json.dumps(data),
        content_type="application/json",
    )
    view = ScoreCalculateView.as_view()
    with patch("scoring.views.ScoreRateThrottle.allow_request", return_value=True):
        return view(request)


def _get_percentile(factory, params):
    request = factory.get("/api/score/percentile/", params)
    view = PercentileView.as_view()
    return view(request)


class TestScoreLogging:
    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_score_creates_log_entry(self, _mock):
        factory = RequestFactory()
        resp = _post_score(factory, {
            "job_title": "nurse",
            "industry": "healthcare",
            "years_experience": 10,
            "education_level": "bachelors",
        })
        assert resp.status_code == 200
        assert ScoreLog.objects.count() == 1

        log = ScoreLog.objects.first()
        assert log.job_title == "nurse"
        assert log.industry == "healthcare"
        assert log.score == resp.data["score"]
        assert log.label == resp.data["label"]
        assert log.factor_automation > 0
        assert log.factor_judgment > 0

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_multiple_scores_create_multiple_logs(self, _mock):
        factory = RequestFactory()
        for title in ["nurse", "lawyer", "data entry clerk"]:
            _post_score(factory, {
                "job_title": title,
                "industry": "other",
                "years_experience": 5,
                "education_level": "bachelors",
            })
        assert ScoreLog.objects.count() == 3

    def test_invalid_request_does_not_log(self):
        factory = RequestFactory()
        resp = _post_score(factory, {"job_title": ""})
        assert resp.status_code == 400
        assert ScoreLog.objects.count() == 0


class TestPercentileEndpoint:
    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_percentile_with_no_data(self, _mock):
        factory = RequestFactory()
        resp = _get_percentile(factory, {"score": "500"})
        assert resp.status_code == 200
        assert resp.data["percentile"] is None
        assert resp.data["total_scores"] == 0

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_percentile_calculation(self, _mock):
        factory = RequestFactory()
        jobs = [
            ("data entry clerk", "retail"),
            ("cashier", "retail"),
            ("nurse", "healthcare"),
            ("surgeon", "healthcare"),
            ("therapist", "healthcare"),
        ]
        for title, ind in jobs:
            _post_score(factory, {
                "job_title": title,
                "industry": ind,
                "years_experience": 10,
                "education_level": "bachelors",
            })

        assert ScoreLog.objects.count() == 5

        highest = ScoreLog.objects.order_by("-score").first()
        resp = _get_percentile(factory, {"score": str(highest.score)})
        assert resp.status_code == 200
        assert resp.data["percentile"] > 50
        assert resp.data["total_scores"] == 5

    @patch("scoring.scoring_engine._call_gemini", return_value=None)
    def test_percentile_filtered_by_industry(self, _mock):
        factory = RequestFactory()
        _post_score(factory, {
            "job_title": "nurse", "industry": "healthcare",
            "years_experience": 10, "education_level": "bachelors",
        })
        _post_score(factory, {
            "job_title": "data entry clerk", "industry": "retail",
            "years_experience": 5, "education_level": "high_school",
        })

        resp = _get_percentile(factory, {"score": "500", "industry": "healthcare"})
        assert resp.data["total_scores"] == 1
        assert resp.data["industry"] == "healthcare"

    def test_percentile_missing_score_param(self):
        factory = RequestFactory()
        resp = _get_percentile(factory, {})
        assert resp.status_code == 400

    def test_percentile_invalid_score_param(self):
        factory = RequestFactory()
        resp = _get_percentile(factory, {"score": "abc"})
        assert resp.status_code == 400
