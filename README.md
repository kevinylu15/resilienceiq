# ResilienceIQ

An AI-powered career resilience scorer that estimates how resistant a job is to AI displacement on a 0–850 scale across five weighted factors: automation risk, human judgment, industry adoption, sociotechnical barriers, and adaptability.

**Stack:** Django 4.2 + Django REST Framework · Next.js 14 + TypeScript · Tailwind CSS · Google Gemini API

---

## Prerequisites

- Python 3.10+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/kevinylu15/resilienceiq.git
cd resilienceiq
```

### 2. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and set:
#   GEMINI_API_KEY=your_key_here
#   DJANGO_SECRET_KEY=any-long-random-string

# Run migrations and create cache table
python manage.py migrate
python manage.py createcachetable

# Start the backend server
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with a Google account
3. Click **Create API key**
4. Copy the key into `backend/.env` as `GEMINI_API_KEY=...`

The free tier is sufficient for development use.

---

## Running Tests

```bash
cd backend
source venv/bin/activate
pytest scoring/test_scoring_engine.py scoring/test_views.py -v
```

97 tests covering the scoring engine, DB logging, percentile endpoint, caching, and rate limiting.

---

## Features

- **Score calculator** — enter job title, industry, experience, and education to get a 0–850 resilience score
- **Five-factor breakdown** — see exactly what drives your score with labeled progress bars
- **Peer percentile** — see how your score compares to others in the database
- **What-If modeler** — adjust education and experience sliders to see score changes in real time
- **Role comparison** — compare two jobs side by side with a radar chart and factor table
- **Methodology page** — full explanation of scoring logic, data sources, and limitations
- **Dark mode** — persisted via localStorage with system preference detection
- **Gemini AI recommendations** — personalized career advice cached for 7 days per score bucket

---

## Project Structure

```
resilienceiq/
├── backend/
│   ├── resilienceiq/       # Django project settings & URLs
│   ├── scoring/            # Scoring engine, models, views, tests
│   ├── requirements.txt
│   └── .env.example        # Copy to .env and add your API key
└── frontend/
    ├── app/                # Next.js pages (score, compare, methodology)
    ├── components/         # Nav, ScoreGauge, RadarChart, WhatIfModeler, etc.
    └── lib/                # API client, scoring helpers
```
