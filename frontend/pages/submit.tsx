import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import SpeakerForm from '@/components/SpeakerForm';
import { submitSpeaker, ApiError, type Submission, type SpeakerFormValues } from '@/lib/api';

export default function SubmitPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState<Submission | null>(null);

  async function handleSubmit(values: SpeakerFormValues) {
    setSubmitting(true);
    setError('');
    try {
      const { submission: created } = await submitSpeaker(values);
      setSubmission(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Head>
        <title>Submit a talk — Sessionboard</title>
      </Head>
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          {submission ? (
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Submission received</h1>
              <p className="mt-2 text-slate-600">
                Thanks, {submission.name}! We&apos;ll email you at {submission.email} with status updates.
                You can view or edit your submission any time at the link below:
              </p>
              <Link
                href={`/my-submission/${submission.editToken}`}
                className="mt-4 inline-block rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                View my submission
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-slate-900">Submit a talk</h1>
              <p className="mt-1 text-sm text-slate-500">
                Tell us about your talk. You&apos;ll get a link to view or edit it afterward.
              </p>
              {error && (
                <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              )}
              <div className="mt-6">
                <SpeakerForm mode="create" submitting={submitting} onSubmit={handleSubmit} />
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
