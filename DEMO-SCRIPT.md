# 3-Minute Demo Video — Shot List

Record at 1920×1080, browser at 100% zoom, one take per scene is fine.
Total target: 3:00. Practice once with a timer; the script runs long if you improvise.

Before recording: backend + frontend running, admin key in your clipboard,
demo data **cleared** (we seed it on camera — it's the hook).

| # | Time | Scene | Say roughly |
|---|------|-------|-------------|
| 1 | 0:00–0:15 | Landing page (`/`) | "This is an open-source Sessionboard alternative: speaker submissions, a self-service portal, admin review, emails, and AI-assisted evaluation — built on Next.js, Express, and Airtable." |
| 2 | 0:15–0:35 | Admin dashboard → click **✨ Load demo data** | "Judges don't want to type test data — one click seeds a realistic event: six talks across every status, AI assists already run." Point at the status chart updating. |
| 3 | 0:35–1:05 | Click into the accepted "Tracing Requests" talk | "Each submission gets an AI reviewer card: a 1–10 score, a two-sentence summary, a suggested track, and the rationale — assist-only, the human decides." Hover the assist card. |
| 4 | 1:05–1:25 | Click **Mark Under Review**, then **Mark Accepted** | "Status changes are optimistic — instant UI, synced to Airtable in the background, with a live sync indicator." Point at "Syncing… / Saved ✓". Mention the status-change email fires automatically. |
| 5 | 1:25–1:50 | `/submit` — fill the form quickly, submit | "Speakers submit here — no account needed." On the success screen: "They get a private tokenized link, also sent by email." |
| 6 | 1:50–2:15 | Open the self-service link, edit the title, save | "The same link lets them edit until a decision is made…" Then show an accepted/rejected demo talk's link: "…after a decision, the submission locks." |
| 7 | 2:15–2:35 | Back to admin list | "The review dashboard also flags likely duplicate submissions" — point at the *possible duplicate* badge if two similar titles exist (submit a near-copy beforehand if you want this beat). |
| 8 | 2:35–3:00 | README on screen (feature checklist), then dashboard wide shot | "Everything in the brief's core loop: submission → review → decision → notification, with Airtable as the datastore and rate-limit retries built in. One click clears the demo data. It's all open source." Click **Clear demo data** as the closer. |

Tips
- Scene 2's seed call takes ~5–8 s (six Airtable creates): keep talking over it.
- If you demo a live "Get AI assist" run, do it on a *pre-scored* record instead and
  say "re-run" — a cold run can take 20–70 s via the Codex fallback.
- Keep the admin key off-screen: sign in before recording or blur that moment.
