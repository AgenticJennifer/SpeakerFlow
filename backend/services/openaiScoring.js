const SYSTEM_PROMPT = `You are an assistant helping conference evaluators screen speaker submissions.
Score the submission from 1-10 based on: clarity of the talk description, relevance to a general
tech conference audience, signal of speaker expertise from the bio, and overall audience value.
This is an assist for a human evaluator, not a final decision.
Respond with strict JSON only: {"score": <integer 1-10>, "rationale": "<2-3 sentence explanation>"}`;

async function scoreSubmission({ bio, talkTitle, talkDescription }) {
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
    return { score, rationale: parsed.rationale || raw };
  } catch {
    return { score: null, rationale: raw };
  }
}

module.exports = { scoreSubmission };
