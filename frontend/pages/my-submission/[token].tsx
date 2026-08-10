import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import SpeakerForm from '@/components/SpeakerForm';
import StatusBadge from '@/components/StatusBadge';
import {
  getSubmissionByToken,
  updateSubmissionByToken,
  ApiError,
  type Submission,
  type SpeakerFormValues,
} from '@/lib/api';

const LOCKED_STATUSES = ['Accepted', 'Rejected'];

export default function MySubmissionPage() {
  const router = useRouter();
  const token = typeof router.query.token === 'string' ? router.query.token : null;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getSubmissionByToken(token)
      .then(({ submission }) => setSubmission(submission))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load submission'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(values: SpeakerFormValues) {
    if (!token) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const { submission: updated } = await updateSubmissionByToken(token, values);
      setSubmission(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  const locked = submission ? LOCKED_STATUSES.includes(submission.status) : false;

  return (
    <>
      <Head>
        <title>My submission — Sessionboard</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {loading && <p className="text-slate-500">Loading…</p>}

          {!loading && error && !submission && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          {submission && (
            <>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-slate-900">Your submission</h1>
                <StatusBadge status={submission.status} />
              </div>

              {saved && (
                <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 ring-1 ring-green-200">
                  Changes saved.
                </div>
              )}
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}

              <div className="mt-6">
                <SpeakerForm
                  mode="edit"
                  initialValues={submission}
                  disabled={locked}
                  disabledReason={
                    locked
                      ? `This submission has been ${submission.status.toLowerCase()} and can no longer be edited.`
                      : undefined
                  }
                  submitting={saving}
                  onSubmit={handleSubmit}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
