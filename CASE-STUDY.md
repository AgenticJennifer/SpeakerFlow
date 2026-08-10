# Journey Into Sessionboard Clone

*A reconstructed technical history of a one-day hackathon build, generated from three
evidence streams: the claude-mem observation timeline, git history, and
`CASE-STUDY-JOURNAL.md`. Written 2026-08-10, two days before the submission deadline
(2026-08-12 22:00 PST). Every claim cites an observation ID (#N), commit SHA, or
journal entry.*

---

## 1. Project Genesis

The record starts precisely: **2026-08-10, 12:04 AM**, when the existing scaffold was
first inventoried (#22, #23). The project did not begin from `create-next-app` that
night — a bare Express backend with one endpoint and an empty Next.js frontend already
existed on disk, unversioned. The first real work product was an audit, and it found
two landmines before any feature code was written (#25):

- **A secret-leak gap.** No root `.gitignore` existed; the root `.env` held live
  OpenAI and Airtable keys, and a `git add -A` would have committed them.
- **An env file that was never read.** `dotenv.config()` resolved relative to
  `backend/`, so the root `.env` was dead weight — the app had never actually loaded
  its own configuration.

Planning ran through an async Plan agent (#24, #26) against the hackathon brief
(“Kill My SaaS”: replace Sessionboard, $10k, deadline Aug 12 22:00 PST). The scope
decision that shaped everything after: build the submission → self-service →
admin-review → email → AI-assist loop *completely*, and cut the agenda builder,
real-time dashboards, and Accelevents integration to a roadmap section. Depth on the
lifecycle over breadth on the feature list.

## 2. The 40-Minute Skeleton

The build sprint visible in the timeline is unusually compressed. Between **12:28 AM
and 12:42 AM** (#31 → #81), the observation stream records: the Airtable base created
with the full `SPEAKER_SUBMISSIONS` schema (#35), retry-with-backoff for rate limits
(#46), a constants module as single source of truth for column names (#47), the
complete data layer (#49), a 5-handler admin controller (#52), the OpenAI scoring
service with defensive JSON parsing (#58), a passing backend integration test (#62),
the typed frontend API client (#65), the component set (#68–#71), both admin pages
(#76, #77), endpoint smoke tests (#80), and a README (#81).

That cadence — a component or subsystem every 60–90 seconds — is the signature of
agent-driven development working from a settled plan. The plan was the bottleneck;
the typing never was. One bug was caught *during* the sprint: `toSubmission()`
initially dropped the `editToken` field (#57) — ironic, because the same field would
later star in the project's best debugging story, from the opposite direction.

All of this landed as `1e09fde` (initial commit) after the `.gitignore` fix, so
history-as-presented compresses roughly seven hours of scaffold-to-MVP into one
commit. The observation timeline is the only record of the true sequence.

## 3. Key Breakthroughs

### 3a. The security pass that read its own queries (`27b5ec1`)

A morning review of `backend/models/airtable.js` found two real vulnerabilities:

1. **Formula injection.** `findRecordByToken` and `listSubmissions` interpolated
   caller-controlled strings directly into Airtable `filterByFormula` expressions. A
   crafted token could break out of the quoted literal and rewrite the query. Fix:
   escape all interpolated values, and gate tokens behind a strict UUIDv4 pattern so
   malformed input is rejected before a query is ever issued.
2. **A capability-token leak.** `toSubmission` returned `editToken` unconditionally —
   so the admin list endpoint handed out every speaker's edit-my-submission
   capability. Anyone with admin *read* could write as any speaker. Fix: the field
   became opt-in (`{ includeToken: true }`), used only by the by-token self-service
   endpoints, where the caller already holds it.

Verified live with a 9-check pass: injection probes (`' OR 1=1 '`, URL-encoded
variants) return 404, not 500; lock-after-decision still 403s (journal, 2026-08-10).

### 3b. Billing-independent AI scoring (`ad5bc26`)

Mid-morning, every `/score` call started returning 502: the OpenAI account had
exhausted its prepaid credits (429 `credit_balance_exhausted`). The considered
alternative — a heuristic local scorer — was rejected as *fake AI in an AI-judged
hackathon* (journal). Instead, scoring gained a fallback provider that shells out to
the locally-authenticated Codex CLI (`codex exec`, covered by the user's ChatGPT
plan), keeping a real model in the loop at zero marginal cost.

The gotcha that cost 15 minutes of confusion: `codex exec` reads additional input
from stdin and **blocks forever on an open pipe**. The fix is one line —
`stdio: ['ignore', 'pipe', 'ignore']` — and is now commented in
`backend/services/codexScoring.js` for the next person. Measured latency across runs:
17s / 39s / 65s / 74s, which produced the demo guidance "pre-run scores; don't go
cold on camera."

### 3c. The E2E walkthrough that caught the bug the security fix caused (`f01c856`)

This is the arc that justifies the whole verification budget. The edit-token leak fix
(3a) made `updateSubmissionStatus` stop returning `editToken` — correct for the HTTP
response, but the status-change *email builder* consumed the same return value, and
began linking speakers to `/my-submission/undefined`. No curl test would have caught
it: every endpoint returned exactly the right thing. It surfaced only in a headless
browser walkthrough that read the actual email output.

The fix threads the needle: the model returns the token internally
(`includeToken: true`), the controller destructures it out of the JSON response but
passes it to the email service. Verified both directions — the email shows a real
token URL; the admin response carries none. Final walkthrough: 9/9.

The walkthrough infrastructure itself was a forced improvisation: the user's own
Chrome rejected all automation input (an extension conflict — clicks, keys, and JS
all failed with "Cannot access a chrome-extension:// URL of different extension"), so
the E2E harness was rebuilt the same afternoon on puppeteer-core driving headless
`/usr/bin/google-chrome`.

## 4. The Polish Sprint That Said No (`e6225cf`)

The afternoon input was a 6-item polish list — which, on review, had been generated
against a *different* rebuild plan (a Next.js 15 "Forge"/Cloudflare architecture that
this project deliberately does not have). The review-before-build step split it:

**Built (4):** judge demo mode (`POST /api/admin/demo/seed` / `DELETE
/api/admin/demo`, six personas marked by an `@demo.sessionboard.local` email domain);
AI reviewer cards (two new Airtable fields — AI Summary, AI Suggested Track — through
both scoring providers); client-side near-duplicate detection (≥70% significant-word
title overlap → a conservative badge); and optimistic status changes (measured
**51ms** to UI update, background Airtable sync, rollback on failure).

**Declined (2 + 1):** the drag-and-drop agenda engine and the Embed Studio — both
cut-scope *features* wearing a polish costume — and a "Cloudflare edge metrics" badge
for an app not on Cloudflare, declined as dishonest to judges.

Verified by a 10/10 headless E2E run, including a live extended AI-assist round-trip
(score + summary + track persisted to Airtable and rendered).

## 5. Outside Events: The PAT That Quietly Died

Minutes after the 10/10 run, every backend Airtable call began returning 403
`NOT_AUTHORIZED` — while the token's `whoami` still returned 200. The token was
valid; its *base grant* was gone, likely shed after the day's burst of automated
writes (journal, ~13:00 PDT). Diagnosis leaned on having a second, independently
authenticated path to the same base (the claude.ai Airtable MCP), which confirmed the
data was intact — isolating the fault to the token in minutes rather than hours.

Resolution required a human: a newly scoped PAT, installed at 16:43 (#P286), followed
by a full re-verification — 7 records listed, a status-change round-trip with a real
token URL in the email and none in the API response, and a live codex-fallback
scoring call that wrote all four AI fields (score 8, "Infrastructure &
Observability"). The lesson entered the journal as policy: **token-grant failure
modes deserve a smoke check before any demo.**

## 6. Technical Debt, Knowingly Held

- **Demo-grade admin auth**: a single shared `x-admin-key` header, documented as
  such. Real per-admin auth was never in scope.
- **README/port drift**: the README said backend `:3001`; the running `.env` says
  `PORT=5000`. Cost real debugging minutes twice before being documented.
- **No deployment yet**: local-only as of this writing, with a Render blueprint
  prepared (`a593658`) but unused. The brief requires a deployed site for
  submission, so this is the largest open item.
- **Multi-round evaluator review**: the brief's feature #4 struck its own
  "AI-assisted review across multiple rounds" clause; single-round assist-only
  scoring was built deliberately.

## 7. Memory and Continuity

The work spanned multiple sessions, two context compactions, and one model handoff
(the security commit `27b5ec1` is signed by Opus 5; the rest of the day by Fable 5).
Continuity rested on three artifacts: claude-mem's ambient observation timeline (the
morning sprint is reconstructable to the minute from it), persistent memory files
(the worktree-merge workflow and the PAT gotcha were written down the day they were
learned, and both were needed again within hours), and `CASE-STUDY-JOURNAL.md` for
decisions-with-alternatives that neither git nor ambient observation records.

One meta-note for honesty: claude-mem's capture of the *afternoon* background session
is thin (a handful of prompts, no dense observation stream like the morning's), so
sections 3–5 are sourced primarily from git messages and the journal rather than
observation IDs. The gap is part of the record.

## 8. Timeline Statistics

| Metric | Value |
|---|---|
| Active build window | 2026-08-10, ~12:04 AM – ~5:00 PM PDT |
| Commits on `main` | 7 (`1e09fde` → `ba1db76`) |
| Dense observation window | #22–#81, 12:04–12:42 AM |
| Verification passes | 9-point security pass; 9/9 lifecycle walkthrough; 10/10 polish E2E |
| Security fixes | 2 (formula injection, capability-token leak) |
| Regressions caused → caught → fixed | 1 (`f01c856`, caught by E2E) |
| AI scoring latency (codex fallback) | 17–74s measured |
| Optimistic UI latency | 51ms measured |
| External outages survived | 2 (OpenAI credits, Airtable PAT base grant) |

## 9. Lessons That Transfer

1. **Endpoint tests validate contracts; walkthroughs validate consequences.** The
   `/undefined` email bug was invisible to every API test because every API response
   was correct. The bug lived in a *consumer* of the changed return value.
2. **Security fixes are refactors and deserve a refactor's blast-radius check.**
   Removing a field from a return value is an API change even when it's the right
   API change; grep for every consumer before shipping.
3. **A second, independently-authenticated path to your datastore is a
   diagnostic instrument.** Separate OAuth vs. PAT auth turned "is the base gone or
   is the token broken?" from speculation into a two-minute test.
4. **Review the wishlist before building it.** Two of six "polish" items were
   scope-cut features in disguise, and one was a lie. The half-hour spent triaging
   bought back the day the other three would have burned.
5. **Keep a real model in the fallback path.** When billing kills your AI feature,
   the honest fallback is another authenticated model you already own — not a
   heuristic pretending to be one.

---

*Generated by the `/case-study` skill from claude-mem observations (#22–#98, #P230–#P289),
git history (`1e09fde`…`ba1db76`), and `CASE-STUDY-JOURNAL.md` (five entries,
2026-08-10).*
