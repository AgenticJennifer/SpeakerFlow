import { useState } from 'react';
import { adminScoreSubmission, ApiError, type Submission } from '@/lib/api';

interface ScoreAssistProps {
  adminKey: string;
  submission: Submission;
  onScored: (submission: Submission) => void;
}

export default function ScoreAssist({ adminKey, submission, onScored }: ScoreAssistProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function runAssist() {
    setLoading(true);
    setError('');
    try {
      const { submission: updated } = await adminScoreSubmission(adminKey, submission.id);
      onScored(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to get AI assist');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-purple-900">AI suggested score (assist only)</h3>
        <button
          onClick={runAssist}
          disabled={loading}
          className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {loading ? 'Scoring…' : submission.aiSuggestedScore != null ? 'Re-run AI assist' : 'Get AI assist'}
        </button>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {submission.aiSuggestedScore != null && (
        <div className="mt-3">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-purple-900">{submission.aiSuggestedScore}/10</p>
            {submission.aiSuggestedTrack && (
              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-800 ring-1 ring-inset ring-purple-200">
                Suggested track: {submission.aiSuggestedTrack}
              </span>
            )}
          </div>
          {submission.aiSummary && (
            <p className="mt-2 rounded-md bg-white/70 p-2 text-sm italic text-purple-900">
              {submission.aiSummary}
            </p>
          )}
          <p className="mt-1 text-sm text-purple-800">{submission.aiRationale}</p>
        </div>
      )}

      {submission.aiSuggestedScore == null && !loading && (
        <p className="mt-2 text-sm text-purple-700">No AI assist run yet.</p>
      )}
    </div>
  );
}
