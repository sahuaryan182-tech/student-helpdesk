# AI-Based Student Helpdesk Chatbot

Full-stack project: React (frontend) + FastAPI (backend) + MongoDB (database),
with an NLP-based FAQ matching engine. See PROJECT_STATUS.md for what's built.

## Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## Backend setup

```
cd backend
python -m venv venv
venv\Scripts\activate        (Windows)
source venv/bin/activate     (Mac/Linux)

python -m pip install -r requirements.txt
copy .env.example .env       (Windows: copy, Mac/Linux: cp .env.example .env)

python -m app.utils.create_admin      (create your first admin account)

uvicorn app.main:app --reload
```

Visit http://localhost:8000/api/health — should show `{"status": "ok", ...}`.
Visit http://localhost:8000/docs — interactive API tester.

## Frontend setup

Open a second terminal:
```
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 — student chat interface.
Visit http://localhost:5173/admin — admin dashboard (redirects to login first).

## Running tests

```
cd backend
python -m pip install -r requirements-dev.txt
pytest
```

Tests run against a separate database (`student_helpdesk_test`), never your
real dev data.

## Project structure

```
student-helpdesk/
├── backend/
│   ├── app/
│   │   ├── main.py            FastAPI entrypoint
│   │   ├── config.py          env var settings
│   │   ├── database.py        MongoDB connection
│   │   ├── routes/            auth, faqs, chat, admin endpoints
│   │   ├── models/             collection accessors + indexes
│   │   ├── schemas/           Pydantic request/response models
│   │   ├── services/          auth_service, nlp_matcher
│   │   ├── middleware/        JWT auth dependency
│   │   └── utils/             serializers, seed data, create_admin script
│   ├── tests/                 pytest test suite
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/              StudentChat, Login, AdminDashboard
│   │   ├── components/         ChatMessage, QuickQuestions, FAQManagement, etc.
│   │   ├── api/                axios wrappers per resource
│   │   └── utils/              auth token storage, session id
│   └── package.json
└── README.md
```
