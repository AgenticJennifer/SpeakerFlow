# Case-Study Journal — Sessionboard Clone

Milestone entries only (decisions with alternatives, breakthroughs, dead ends, scope
cuts, outside events). Ambient session history lives in claude-mem; this file captures
what that misses. Generated case study at ship time via the `/case-study` skill.

## 2026-08-10 — Security fix pass: formula injection + edit-token leak

What: `filterByFormula` interpolation escaped + UUID-gated; `editToken` made opt-in
so admin endpoints stop exposing every speaker's capability token.
Why it matters: admin read access no longer grants write-as-any-speaker; injection
strings now 404 instead of reaching Airtable. Verified by a 9-check live pass.
Evidence: commit 27b5ec1; injection probes (`' OR 1=1 '`, url-encoded variants) → 404.

## 2026-08-10 — OpenAI credits exhausted → Codex CLI fallback

What: Scoring endpoint 502'd (OpenAI 429 `credit_balance_exhausted`). Instead of
blocking on billing, added a fallback provider that shells out to the locally-
authenticated `codex exec` (user's ChatGPT plan). Alternative considered: heuristic
local scorer — rejected as fake-AI for an AI-judged hackathon.
Why it matters: headline demo feature no longer depends on API billing. Gotcha found:
`codex exec` blocks forever unless stdin is ignored (cost 15 minutes of confusion).
Evidence: commit ad5bc26; measured latency 17s/65s/74s across runs → demo guidance
is "pre-run scores, don't go cold on camera."

## 2026-08-10 — E2E walkthrough caught a regression my own security fix caused

What: Headless-Chrome walkthrough (built because the user's Chrome had an extension
conflict blocking automation input) revealed status-change emails linking to
`/my-submission/undefined` — the email builder needed the very token the security fix
stripped. Fixed by returning the token internally and stripping it at the controller.
Why it matters: the fix-causes-bug-fix arc is the strongest argument for E2E over
endpoint tests; no curl test would have caught an email body.
Evidence: commits f01c856 (fix) after e2e run; final walkthrough 9/9.

## 2026-08-10 — Polish sprint: reviewed a 6-item list, built 4, declined 2

What: Judge demo mode (seed/clear), AI reviewer cards (summary + suggested track +
duplicate flagging), optimistic status UI (51ms measured), README/demo-script. Declined
the agenda conflict engine and Embed Studio — both are features cut from scope, not
polish; also declined a fake "Cloudflare edge metrics" badge as dishonest to judges.
Why it matters: the review-before-build step turned an AI-generated wishlist (aimed at
a different plan) into shippable scope. Verified 10/10 headless checks.
Evidence: commit e6225cf; two new Airtable fields (AI Summary, AI Suggested Track).

## 2026-08-10 — Outside event: Airtable PAT silently lost its base grant

What: Minutes after tests passed, every backend Airtable call began returning 403
NOT_AUTHORIZED while `whoami` still returned 200 — the README's own documented gotcha,
striking live. Data confirmed intact via separately-authenticated MCP.
Why it matters: the app is dead until the user re-adds the base under the token's
Access settings; suspected trigger is the day's burst of automated writes. Lesson:
token-grant failure modes deserve a smoke check before any demo.
Evidence: direct REST probe (whoami 200, record GET 403) at ~13:00 PDT.
