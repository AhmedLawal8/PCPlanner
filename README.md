# Rigify

An intelligent PC builder that generates personalized, fully compatible builds based on your budget and use case. Every component includes AI-selected Budget, Best Value, Recommended, and Performance alternatives, giving you complete flexibility to customize your system. Save your builds, revisit them anytime, and access YouTube content tailored to your exact PC configuration.

## Features

- **AI build generation** - LLM picks real parts from the database based on your budget and use case
- **4-tier options per category** - Budget / Best Value / Recommend / Performance for every component
- **Compatibility checks** - socket mismatches and PSU warnings caught automatically
- **Save & load builds** - multiple builds per account, rename and swap parts anytime
- **Related YouTube guides** - fetched per saved build so the content is actually relevant

## Stack

| Layer | Tech |
|---|---|
| Frontend | React, TypeScript, Vite, Mantine UI |
| Backend | Flask, SQLAlchemy, SQLite |
| AI | Gemini API |
| Videos | YouTube Data API v3 |

---

## Setup

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd PCPlanner
cp .envexample .env
```

Fill in your keys in `.env`:

```
SECRET_KEY=any-long-random-string      # used to sign Flask sessions
GEMINI_API_KEY=your-gemini-key
YOUTUBE_API_KEY=your-youtube-key
```

`SECRET_KEY` can be anything, just make it long and random. It's only used to keep sessions secure.

---

### 2. Backend

```bash
cd backend

# install dependencies
pip install -r ../requirements.txt

# populate the database (grabs part data + enriches with API calls - takes a few minutes)
python filltables.py

# start the Flask server
python app.py
```

The API will be running at `http://localhost:5000` or `http://127.0.0.1:5000`.

---

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the link Vite gives you and you're good.

---

## How it works

1. Sign up and hit **Build Your PC**
2. Enter a budget and pick your use case (gaming, workstation, streaming, office)
3. The backend calls Gemini, which selects parts from the DB and returns up to 4 options per category
4. Browse the results, switch tiers, click **Details** to see full specs
5. Save the build - it gets stored to your account
6. On a saved build page you'll also get YouTube videos pulled for your specific CPU + GPU combo

---

## Project structure

```
PCPlanner/
├── backend/
│   ├── api/
│   │   ├── auth.py          # register / login / logout
│   │   ├── builds.py        # generate, save, list, patch, delete
│   │   ├── components.py    # lazy component detail fetch
│   │   └── guides.py        # YouTube guide fetching
│   ├── models/
│   │   ├── db.py
│   │   └── tables.py
│   ├── raw_data/            # seed JSON per component category
│   ├── filltables.py        # DB seeder
│   ├── generate_build.py    # Gemini build generation logic
│   ├── gemini_client.py
│   ├── youtube_client.py
│   └── app.py
└── frontend/
    └── src/
        ├── components/      # pages + UI components
        ├── constants/       # parts, guides, quiz options
        ├── contexts/        # AuthContext
        └── services/        # apiFetch wrapper
```
