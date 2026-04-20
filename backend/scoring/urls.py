from django.urls import path
from .views import ScoreCalculateView, PercentileView

urlpatterns = [
    path("score/", ScoreCalculateView.as_view(), name="score-calculate"),
    path("score/percentile/", PercentileView.as_view(), name="score-percentile"),
]
