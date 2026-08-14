# SpeakerFlow

Open-source clone of Sessionboard: speaker submission, self-service portal, admin review dashboard,
drag-free conflict-checked agenda scheduling, calendar invites and reminder emails, a real-time
onboarding dashboard, and AI-assisted evaluator scoring.

Built for the "Kill My SaaS" hackathon; scope was deliberately narrowed for the timeline — see
"Out of scope" below for what's intentionally still cut.

## Judge quickstart (under a minute)

1. Open the admin dashboard (`/admin`) and sign in with the admin key from the deployment notes.
2. Click **✨ Load demo data** — this seeds eight realistic submissions covering every status
   (Submitted / Under Review / Accepted / Rejected), pre-run AI assists with summaries and
   suggested tracks, evaluator notes, and **an intentional double-booked room conflict** so the
   agenda's conflict detection and Auto-resolve are visible immediately.
3. Click into any submission to see the AI reviewer card (score, two-sentence summary, suggested
   track, rationale), one-click status changes with optimistic UI, and evaluator scoring.
4. Open **Agenda** (`/admin/agenda`) — the two double-booked demo talks are flagged with a glowing
   red conflict ring; click **⚡ Auto-resolve** to move one to the next open slot in one click.
5. Open **Dashboard** (`/admin/dashboard`) — outstanding onboarding tasks (accepted-but-unscheduled,
   awaiting review, missing materials), refreshed every 15s, each with a one-click **Remind** button
   that emails the speaker.
6. Submit your own talk at `/submit` — the success screen gives you the speaker's self-service
   link, and the confirmation email (console or Resend) contains the same link.
7. Done exploring? **Clear demo data** removes exactly the seeded records and nothing else.

## Feature checklist

| Brief requirement | Where |
|---|---|
| Speaker submission form | `/submit` |
| Self-service portal (view/edit via tokenized link, no login) | `/my-submission/[token]` |
| Admin review dashboard with status filters | `/admin` |
| Status workflow (Submitted → Under Review → Accepted/Rejected) | admin detail page, optimistic UI |
| Automated speaker communications — status emails, reminders, calendar invites | Resend/console; `/admin/dashboard` Remind buttons; ICS invites on accept+schedule |
| AI-assisted evaluation (assist-only, never auto-decides) | score + summary + suggested track + rationale |
| Duplicate submission detection | near-duplicate title flagging on the review dashboard |
| Agenda builder with automatic conflict detection | `/admin/agenda` — grid/list views, glowing conflict flags, one-click Auto-resolve |
| Real-time onboarding dashboard | `/admin/dashboard` — 15s poll, 3 outstanding-task buckets |
| Judge demo mode | one-click seed/clear of realistic demo data, including a deliberate conflict |
| Airtable as datastore | all persistence, with retry/backoff for rate limits |

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
`AI Summary`, `AI Suggested Track`, `Evaluator Score`, `Evaluator Notes`, `Session Day`,
`Session Room`, `Session Start`, `Session End` (the last four are plain single-line text —
`YYYY-MM-DD` / room name / `HH:MM` — kept as text rather than Airtable's Date type to avoid
timezone handling in the conflict-detection logic). (A base named "Sessionboard Clone" with this
schema was created via the Airtable MCP during development — point `AIRTABLE_BASE_ID` at it, or
create your own.)

Get an Airtable Personal Access Token at https://airtable.com/create/tokens with
`data.records:read` and `data.records:write` scopes on that base.

> **Gotcha (hit this live during development):** creating a token does not automatically grant it
> access to any base — under **Access**, you must explicitly add the specific base(s) it can touch.
> A token with the right scopes but no base added will authenticate fine (`/v0/meta/whoami` returns
> 200) yet still 403 with `NOT_AUTHORIZED` on every actual record call. If you hit that, go back to
> the token's edit page and add the base under Access, or add the token's account as a collaborator
> on the base directly.

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
- `POST /api/admin/submissions/:id/score` — AI-assisted scoring (score, 2-sentence summary,
  suggested track, rationale). Uses the OpenAI API when `OPENAI_API_KEY` has credit; in local dev
  only, it also falls back to the locally-authenticated Codex CLI (`codex login`) — that fallback
  requires a CLI binary and an interactive login session, so it does **not** work on a deployed
  server; production scoring depends on `OPENAI_API_KEY` having credit.
- `GET /api/admin/agenda` — accepted + fully-scheduled sessions, each with a `conflictsWith` list
- `PATCH /api/admin/submissions/:id/schedule` — set/clear a session's day/room/start/end; sends a
  calendar invite email if the submission is already Accepted
- `GET /api/admin/dashboard` — outstanding-task buckets (accepted-unscheduled, unscored, missing materials)
- `POST /api/admin/submissions/:id/remind` — send a reminder email (`reason`: `missingMaterials` | `unscheduled`)
- `POST /api/admin/demo/seed` — seed judge demo data (8 realistic submissions, including a deliberate room conflict)
- `DELETE /api/admin/demo` — remove exactly the demo records (matched by demo email domain)

## Deployment (for the demo)

- Frontend → Vercel (root directory `frontend/`, env var `NEXT_PUBLIC_API_BASE_URL`)
- Backend → Render or Fly.io (root directory `backend/`, build `npm install`, start `npm start`).
  A `render.yaml` Blueprint is included at the repo root — on Render, "New +" → "Blueprint",
  point it at this repo, and it provisions the web service with the right build/start commands
  and env var slots (Airtable/OpenAI/Resend/admin keys still need to be filled in by hand, since
  secrets aren't stored in the blueprint).
- CORS is left permissive (`cors()`, no origin restriction) to avoid a last-minute CORS bug during
  the hackathon — tighten this post-hackathon.

## Out of scope (future work)

Accelevents integration, embeddable/wiki resource pages, an embeddable public speaker gallery, and
Cloudflare Workers hosting (the original brief's stated target — this build deploys to Vercel/Render
instead for reliability within the timeline). These were explicitly cut from the brief's own scope,
not omissions.
