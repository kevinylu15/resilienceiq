from django.db import models


class ScoreLog(models.Model):
    """Anonymized record of every score calculation — used for peer percentiles."""

    job_title = models.CharField(max_length=200)
    matched_title = models.CharField(max_length=200)
    industry = models.CharField(max_length=50)
    education_level = models.CharField(max_length=30)
    years_experience = models.PositiveSmallIntegerField()

    score = models.PositiveSmallIntegerField()
    label = models.CharField(max_length=30)

    factor_automation = models.PositiveSmallIntegerField()
    factor_judgment = models.PositiveSmallIntegerField()
    factor_industry = models.PositiveSmallIntegerField()
    factor_sociotechnical = models.PositiveSmallIntegerField()
    factor_adaptability = models.PositiveSmallIntegerField()

    used_ai_profile = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["industry", "score"]),
            models.Index(fields=["matched_title", "score"]),
        ]

    def __str__(self):
        return f"{self.job_title} — {self.score}/850 ({self.label})"
