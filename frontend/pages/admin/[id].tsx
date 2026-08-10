import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import StatusBadge from '@/components/StatusBadge';
import ScoreAssist from '@/components/ScoreAssist';
import {
  adminGetSubmission,
  adminUpdateStatus,
  adminUpdateEvaluation,
  ApiError,
  type Submission,
  type SubmissionStatus,
} from '@/lib/api';

const STATUS_ACTIONS: SubmissionStatus[] = ['Under Review', 'Accepted', 'Rejected'];

function AdminDetail({ adminKey, id }: { adminKey: string; id: string }) {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [evaluatorScore, setEvaluatorScore] = useState('');
  const [evaluatorNotes, setEvaluatorNotes] = useState('');
  const [savingEvaluation, setSavingEvaluation] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminGetSubmission(adminKey, id)
      .then(({ submission }) => {
        setSubmission(submission);
        setEvaluatorScore(submission.evaluatorScore != null ? String(submission.evaluatorScore) : '');
        setEvaluatorNotes(submission.evaluatorNotes || '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load submission'))
      .finally(() => setLoading(false));
  }, [adminKey, id]);

  async function changeStatus(status: SubmissionStatus) {
    if (!submission) return;
    // Optimistic update: reflect the new status immediately, sync in the
    // background, and roll back if the API rejects it.
    const previous = submission;
    setSubmission({ ...submission, status });
    setSyncState('syncing');
    setError('');
    try {
      const { submission: updated } = await adminUpdateStatus(adminKey, id, status);
      setSubmission(updated);
      setSyncState('saved');
      setTimeout(() => setSyncState('idle'), 2000);
    } catch (err) {
      setSubmission(previous);
      setSyncState('idle');
      setError(err instanceof ApiError ? err.message : 'Failed to update status');
    }
  }

  async function saveEvaluation() {
    setSavingEvaluation(true);
    setError('');
    try {
      const { submission: updated } = await adminUpdateEvaluation(adminKey, id, {
        evaluatorScore: evaluatorScore ? Number(evaluatorScore) : undefined,
        evaluatorNotes,
      });
      setSubmission(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  }

  if (loading) return <p className="p-8 text-sm text-slate-500">Loading…</p>;
  if (!submission) {
    return (
      <div className="p-8 text-sm text-red-600">{error || 'Submission not found'}</div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back to all submissions
        </Link>

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">{submission.talkTitle}</h1>
            <StatusBadge status={submission.status} />
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {submission.name} · {submission.email}
          </p>

          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <p className="font-medium text-slate-900">Bio</p>
              <p className="mt-0.5 whitespace-pre-wrap">{submission.bio || '—'}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Talk description</p>
              <p className="mt-0.5 whitespace-pre-wrap">{submission.talkDescription || '—'}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {STATUS_ACTIONS.map((status) => (
              <button
                key={status}
                onClick={() => changeStatus(status)}
                disabled={submission.status === status}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Mark {status}
              </button>
            ))}
            {syncState !== 'idle' && (
              <span
                className={`text-xs ${syncState === 'syncing' ? 'text-slate-400' : 'text-green-600'}`}
                aria-live="polite"
              >
                {syncState === 'syncing' ? 'Syncing…' : 'Saved ✓'}
              </span>
            )}
          </div>
        </div>

        <ScoreAssist adminKey={adminKey} submission={submission} onScored={setSubmission} />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">Evaluator score &amp; notes</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-[100px_1fr]">
            <input
              type="number"
              min={1}
              max={10}
              placeholder="Score"
              value={evaluatorScore}
              onChange={(e) => setEvaluatorScore(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <textarea
              rows={3}
              placeholder="Notes"
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            onClick={saveEvaluation}
            disabled={savingEvaluation}
            className="mt-3 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {savingEvaluation ? 'Saving…' : 'Save evaluation'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function AdminSubmissionPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : null;

  return (
    <>
      <Head>
        <title>Submission detail — Sessionboard</title>
      </Head>
      <AdminLogin>{(adminKey) => (id ? <AdminDetail adminKey={adminKey} id={id} /> : null)}</AdminLogin>
    </>
  );
}
