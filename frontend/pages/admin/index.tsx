import Head from 'next/head';
import { useEffect, useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import SubmissionCard from '@/components/SubmissionCard';
import StatusBreakdownChart from '@/components/StatusBreakdownChart';
import { adminListSubmissions, ApiError, type Submission, type SubmissionStatus } from '@/lib/api';

const STATUS_FILTERS: Array<SubmissionStatus | 'All'> = [
  'All',
  'Submitted',
  'Under Review',
  'Accepted',
  'Rejected',
];

function AdminDashboard({ adminKey, clearAdminKey }: { adminKey: string; clearAdminKey: () => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState<SubmissionStatus | 'All'>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminListSubmissions(adminKey, filter === 'All' ? undefined : filter)
      .then(({ submissions }) => setSubmissions(submissions))
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load submissions'))
      .finally(() => setLoading(false));
  }, [adminKey, filter]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">Admin dashboard</h1>
          <button onClick={clearAdminKey} className="text-sm text-slate-500 hover:text-slate-700">
            Sign out
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {error}
          </div>
        )}

        {!loading && !error && <div className="mt-6"><StatusBreakdownChart submissions={submissions} /></div>}

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 ring-inset ${
                filter === status
                  ? 'bg-slate-900 text-white ring-slate-900'
                  : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {loading && <p className="text-sm text-slate-500">Loading…</p>}
          {!loading && submissions.length === 0 && (
            <p className="text-sm text-slate-500">No submissions{filter !== 'All' ? ` with status "${filter}"` : ''}.</p>
          )}
          {submissions.map((submission) => (
            <SubmissionCard key={submission.id} submission={submission} />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminIndexPage() {
  return (
    <>
      <Head>
        <title>Admin — Sessionboard</title>
      </Head>
      <AdminLogin>
        {(adminKey, clearAdminKey) => <AdminDashboard adminKey={adminKey} clearAdminKey={clearAdminKey} />}
      </AdminLogin>
    </>
  );
}
