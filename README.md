# Sessionboard Clone (Hackathon MVP)

Open-source clone of Sessionboard: speaker submission, self-service portal, admin review dashboard,
status-change email notifications, and OpenAI-assisted evaluator scoring.

Deadline: 2026-08-12 22:00 PST. Scope was deliberately narrowed for the timeline — see "Out of scope" below.

## Stack

- **Frontend**: Next.js (pages router) + Tailwind CSS — `frontend/`
- **Backend**: Node.js + Express — `backend/`
- **Database**: Airtable (`SPEAKER_SUBMISSIONS` table)
- **AI**: OpenAI (`gpt-4o-mini`) for evaluator scoring assist
- **Email**: Resend if `RESEND_API_KEY` is set, otherwise a console-log fallback (zero setup, fine for a demo)

## Setup

```bash
cd backend && npm install
cd ../frontend && npm install
```

Copy env files and fill in real values:

```bash
cp backend/.env.example backend/.env      # then fill in AIRTABLE_API_KEY, OPENAI_API_KEY, ADMIN_API_KEY
cp frontend/.env.example frontend/.env.local
```

Required Airtable setup: a base with a `SPEAKER_SUBMISSIONS` table containing these fields —
`Name`, `Email`, `Bio`, `Talk Title`, `Talk Description`, `Status` (single select: Submitted /
Under Review / Accepted / Rejected), `Edit Token`, `AI Suggested Score`, `AI Rationale`,
`Evaluator Score`, `Evaluator Notes`. (A base named "Sessionboard Clone" with this schema was
created via the Airtable MCP during development — point `AIRTABLE_BASE_ID` at it, or create your own.)

Get an Airtable Personal Access Token at https://airtable.com/create/tokens with
`data.records:read` and `data.records:write` scopes on that base.

Run both apps (default ports: backend `3001`, frontend `3000` — matches the known port-conflict
pitfall from the project brief):

```bash
cd backend && npm run dev
cd frontend && npm run dev
```

## API

Public:
- `POST /api/speakers` — submit a talk
- `GET /api/speakers/by_token/:token` / `PATCH /api/speakers/by_token/:token` — self-service view/edit

Admin (requires `x-admin-key` header matching `ADMIN_API_KEY` — a demo-grade shared secret, not
per-admin auth):
- `GET /api/admin/submissions?status=...`
- `GET /api/admin/submissions/:id`
- `PATCH /api/admin/submissions/:id/status`
- `PATCH /api/admin/submissions/:id/evaluation`
- `POST /api/admin/submissions/:id/score` — OpenAI-assisted scoring

## Deployment (for the demo)

- Frontend → Vercel (root directory `frontend/`, env var `NEXT_PUBLIC_API_BASE_URL`)
- Backend → Render or Fly.io (root directory `backend/`, build `npm install`, start `npm start`)
- CORS is left permissive (`cors()`, no origin restriction) to avoid a last-minute CORS bug during
  the hackathon — tighten this post-hackathon.

## Out of scope (future work)

Agenda builder with conflict detection, real-time dashboards beyond the admin list/filter view,
Accelevents integration, and Cloudflare Workers hosting (the original brief's stated target — this
build deploys to Vercel/Render instead for reliability within the deadline).
