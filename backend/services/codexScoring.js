// Fallback scoring provider that shells out to the locally-authenticated Codex
// CLI (`codex exec`). Used when the OpenAI API is unavailable (no key, no
// credits, network trouble) so the AI-assist demo never dead-ends on billing.
// Requires `codex login` to have been run on this machine.
const { spawn } = require('child_process');

const CODEX_TIMEOUT_MS = 120_000;

function buildPrompt({ bio, talkTitle, talkDescription }) {
  return [
    'You are an assistant helping conference evaluators screen speaker submissions.',
    'Score the submission from 1-10 based on: clarity of the talk description, relevance',
    'to a general tech conference audience, signal of speaker expertise from the bio, and',
    'overall audience value. This is an assist for a human evaluator, not a final decision.',
    'Respond with strict JSON only, no markdown fences:',
    '{"score": <integer 1-10>, "rationale": "<2-3 sentence explanation>"}',
    '',
    `Speaker bio: ${bio || '(none provided)'}`,
    `Talk title: ${talkTitle || '(none provided)'}`,
    `Talk description: ${talkDescription || '(none provided)'}`,
  ].join('\n');
}

function extractJson(text) {
  // Codex output may wrap the JSON in prose or fences; grab the last {...} block.
  const matches = text.match(/\{[\s\S]*?\}/g);
  if (!matches) return null;
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const parsed = JSON.parse(matches[i]);
      if ('score' in parsed) return parsed;
    } catch {
      // keep scanning earlier blocks
    }
  }
  return null;
}

function scoreSubmissionViaCodex({ bio, talkTitle, talkDescription }) {
  return new Promise((resolve, reject) => {
    // stdin MUST be ignored: `codex exec` reads additional input from stdin and
    // blocks forever if handed an open pipe that never closes.
    const child = spawn(
      'codex',
      ['exec', '--skip-git-repo-check', '-s', 'read-only', buildPrompt({ bio, talkTitle, talkDescription })],
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: CODEX_TIMEOUT_MS }
    );

    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.on('error', (err) => {
      const error = new Error(`Codex CLI scoring failed: ${err.message}`);
      error.statusCode = 502;
      reject(error);
    });
    child.on('close', (code) => {
      if (code !== 0 && !stdout) {
        const error = new Error(`Codex CLI scoring failed (exit ${code}).`);
        error.statusCode = 502;
        return reject(error);
      }
      const parsed = extractJson(stdout);
      if (!parsed) {
        // Same defensive posture as the OpenAI path: malformed output never throws.
        return resolve({ score: null, rationale: stdout.trim().slice(0, 500) });
      }
      const score = Number.isInteger(parsed.score) ? parsed.score : null;
      resolve({ score, rationale: parsed.rationale || String(parsed) });
    });
  });
}

module.exports = { scoreSubmissionViaCodex };
