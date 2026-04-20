import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.throttling import AnonRateThrottle

from .models import ScoreLog
from .serializers import ScoreRequestSerializer
from .scoring_engine import calculate_score

logger = logging.getLogger(__name__)


class ScoreRateThrottle(AnonRateThrottle):
    rate = "6/min"
    scope = "score"


class ScoreCalculateView(APIView):
    """
    POST /api/score/
    Body: { job_title, industry, years_experience, education_level }
    Returns: full score result including factors and recommendations.
    """

    throttle_classes = [ScoreRateThrottle]

    def post(self, request):
        serializer = ScoreRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = serializer.validated_data
        try:
            result = calculate_score(
                job_title=data["job_title"],
                industry=data["industry"],
                years_experience=data["years_experience"],
                education_level=data["education_level"],
            )
        except Exception as exc:
            logger.exception("Scoring failed for job_title=%s", data.get("job_title"))
            return Response(
                {"errors": {"non_field_errors": ["Scoring failed. Please try again."]}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        factors_by_key = {f["name"]: f["score"] for f in result["factors"]}

        try:
            ScoreLog.objects.create(
                job_title=data["job_title"],
                matched_title=result.get("matched_title", ""),
                industry=data["industry"],
                education_level=data["education_level"],
                years_experience=data["years_experience"],
                score=result["score"],
                label=result["label"],
                factor_automation=factors_by_key.get("Task Automation Resistance", 0),
                factor_judgment=factors_by_key.get("Human Judgment Demand", 0),
                factor_industry=factors_by_key.get("Industry AI Adoption Speed", 0),
                factor_sociotechnical=factors_by_key.get("Sociotechnical Barriers", 0),
                factor_adaptability=factors_by_key.get("Skill Adaptability", 0),
                used_ai_profile=result.get("used_ai_profile", False),
            )
        except Exception as exc:
            logger.warning("Score logging failed (non-fatal): %s", exc)

        return Response(result, status=status.HTTP_200_OK)


class PercentileView(APIView):
    """
    GET /api/score/percentile/?score=612&industry=healthcare
    Returns the percentile rank of the given score among all logged scores,
    optionally filtered by industry.
    """

    def get(self, request):
        try:
            score = int(request.query_params.get("score", ""))
        except (ValueError, TypeError):
            return Response(
                {"error": "score query parameter is required and must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        industry = request.query_params.get("industry", "").strip()

        qs = ScoreLog.objects.all()
        if industry:
            qs = qs.filter(industry=industry)

        total = qs.count()
        if total == 0:
            return Response({
                "percentile": None,
                "total_scores": 0,
                "message": "Not enough data yet to calculate a percentile.",
            })

        below = qs.filter(score__lt=score).count()
        percentile = round((below / total) * 100, 1)

        return Response({
            "percentile": percentile,
            "total_scores": total,
            "industry": industry or "all",
        })
