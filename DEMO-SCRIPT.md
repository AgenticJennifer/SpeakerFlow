# Demo Video — Shot List

Record at 1920×1080, browser at 100% zoom, one take per scene is fine.
Total target: ~4:00 — this grew from the original 3:00 cut once agenda scheduling,
the onboarding dashboard, calendar invites, and reminders shipped. Trim scenes 7–8
if you need to hit a hard 3:00.

Before recording: backend + frontend running, admin key in your clipboard,
demo data **cleared** (we seed it on camera — it's the hook).

| # | Time | Scene | Say roughly |
|---|------|-------|-------------|
| 1 | 0:00–0:15 | Landing page (`/`) | "This is an open-source Sessionboard alternative: speaker submissions, a self-service portal, admin review, a conflict-checked agenda, a real-time onboarding dashboard, and AI-assisted evaluation — built on Next.js, Express, and Airtable." |
| 2 | 0:15–0:35 | Admin dashboard → click **✨ Load demo data** | "Judges don't want to type test data — one click seeds a realistic event: eight talks across every status, AI assists already run, and a deliberate double-booked room so the conflict detection has something to catch immediately." |
| 3 | 0:35–1:00 | Click into the accepted "Tracing Requests" talk | "Each submission gets an AI reviewer card: a 1–10 score, a two-sentence summary, a suggested track, and the rationale — assist-only, the human decides." |
| 4 | 1:00–1:15 | Click **Mark Under Review**, then **Mark Accepted** | "Status changes are optimistic — instant UI, synced to Airtable in the background, with a live sync indicator." Mention the status-change email fires automatically. |
| 5 | 1:15–1:50 | Open **Agenda** (`/admin/agenda`) | "Accepted talks land here. These two are double-booked in Room A — same day, overlapping time — flagged with a glowing red conflict ring." Click **⚡ Auto-resolve**: "One click finds the next open slot in that room and moves it — optimistically, the chip updates instantly." |
| 6 | 1:50–2:20 | Open **Dashboard** (`/admin/dashboard`) | "This tracks outstanding onboarding tasks in real time — polls every 15 seconds. Accepted-but-unscheduled talks, submissions still awaiting review, and accepted speakers missing a bio or abstract." Click **Remind** on one: "One click sends a reminder email — no manual chasing." |
| 7 | 2:20–2:45 | `/submit` — fill the form quickly, submit | "Speakers submit here — no account needed." On the success screen: "They get a private tokenized link, also sent by email." |
| 8 | 2:45–3:10 | Open the self-service link, edit the title, save | "The same link lets them edit until a decision is made…" Then show an accepted demo talk's link: "…after a decision, the submission locks — and once it's accepted and scheduled, the speaker automatically gets a calendar invite for their own slot." |
| 9 | 3:10–3:30 | Back to admin list | "The review dashboard also flags likely duplicate submissions" — point at the *possible duplicate* badge if two similar titles exist. |
| 10 | 3:30–4:00 | README on screen (feature checklist), then dashboard wide shot | "Everything in the brief's core loop, plus agenda, reminders, and calendar invites — all on Airtable with rate-limit retries built in. One click clears the demo data. It's all open source." Click **Clear demo data** as the closer. |

Tips
- Scene 2's seed call takes ~8–12 s (eight Airtable creates): keep talking over it.
- Don't run a live "Get AI assist" call on camera — the demo data ships with AI
  fields pre-baked specifically so you never depend on a live OpenAI call (or its
  billing) during recording. If you want to show a live run anyway, verify
  `OPENAI_API_KEY` has credit on the account you're recording against first —
  the Codex CLI fallback only works when the machine you're recording on has a
  local, logged-in `codex` session; it does not exist as a safety net on the
  deployed site.
- Keep the admin key off-screen: sign in before recording or blur that moment.
