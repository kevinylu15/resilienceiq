from rest_framework import serializers

EDUCATION_CHOICES = [
    ("high_school",   "High School Diploma / GED"),
    ("some_college",  "Some College"),
    ("associates",    "Associate's Degree"),
    ("bachelors",     "Bachelor's Degree"),
    ("masters",       "Master's Degree"),
    ("phd",           "PhD"),
    ("professional",  "Professional Degree (MD, JD, etc.)"),
]

INDUSTRY_CHOICES = [
    ("technology",     "Technology"),
    ("finance",        "Finance & Banking"),
    ("healthcare",     "Healthcare"),
    ("education",      "Education"),
    ("manufacturing",  "Manufacturing"),
    ("retail",         "Retail & E-commerce"),
    ("legal",          "Legal"),
    ("government",     "Government"),
    ("arts",           "Arts & Entertainment"),
    ("construction",   "Construction & Trades"),
    ("transportation", "Transportation & Logistics"),
    ("other",          "Other"),
]


class ScoreRequestSerializer(serializers.Serializer):
    job_title = serializers.CharField(
        max_length=200,
        trim_whitespace=True,
        error_messages={"blank": "Please enter your job title.", "required": "Job title is required."},
    )
    industry = serializers.ChoiceField(
        choices=INDUSTRY_CHOICES,
        error_messages={"invalid_choice": "Please select a valid industry."},
    )
    years_experience = serializers.IntegerField(
        min_value=0,
        max_value=60,
        error_messages={
            "min_value": "Years of experience cannot be negative.",
            "max_value": "Please enter a value of 60 or less.",
        },
    )
    education_level = serializers.ChoiceField(
        choices=EDUCATION_CHOICES,
        error_messages={"invalid_choice": "Please select a valid education level."},
    )
