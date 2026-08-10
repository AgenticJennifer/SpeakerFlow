const SYSTEM_PROMPT = `You are an assistant helping conference evaluators screen speaker submissions.
Score the submission from 1-10 based on: clarity of the talk description, relevance to a general
tech conference audience, signal of speaker expertise from the bio, and overall audience value.
This is an assist for a human evaluator, not a final decision.
Also write a neutral two-sentence summary of the talk for the review card, and suggest the single
best-fitting track from: "AI & ML", "Infrastructure & Observability", "Security",
"Web & Frontend", "Leadership & Process", "General".
Respond with strict JSON only:
{"score": <integer 1-10>, "rationale": "<2-3 sentence explanation>", "summary": "<2 sentence summary>", "suggestedTrack": "<track name>"}`;

const { scoreSubmissionViaCodex } = require('./codexScoring');

async function scoreSubmission({ bio, talkTitle, talkDescription }) {
  try {
    return await scoreViaOpenAI({ bio, talkTitle, talkDescription });
  } catch (openaiError) {
    // No key / no credits / API down — fall back to the locally-authenticated
    // Codex CLI so the assist still works. Surface the original error if the
    // fallback also fails.
    try {
      const result = await scoreSubmissionViaCodex({ bio, talkTitle, talkDescription });
      return { summary: '', suggestedTrack: '', ...result, provider: 'codex-cli' };
    } catch {
      throw openaiError;
    }
  }
}

async function scoreViaOpenAI({ bio, talkTitle, talkDescription }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error('OpenAI is not configured. Set OPENAI_API_KEY.');
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Speaker bio: ${bio || '(none provided)'}\n\nTalk title: ${talkTitle || '(none provided)'}\n\nTalk description: ${talkDescription || '(none provided)'}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(`OpenAI API error (${response.status}): ${text}`);
    error.statusCode = 502;
    throw error;
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(raw);
    const score = Number.isInteger(parsed.score) ? parsed.score : null;
    return {
      score,
      rationale: parsed.rationale || raw,
      summary: parsed.summary || '',
      suggestedTrack: parsed.suggestedTrack || '',
    };
  } catch {
    return { score: null, rationale: raw, summary: '', suggestedTrack: '' };
  }
}

module.exports = { scoreSubmission };
