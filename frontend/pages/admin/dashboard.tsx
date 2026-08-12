import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import { adminGetDashboard, ApiError, type DashboardBucket, type DashboardStats } from '@/lib/api';

const POLL_MS = 15000;

function Bucket({
  title,
  description,
  bucket,
  tone,
}: {
  title: string;
  description: string;
  bucket: DashboardBucket;
  tone: 'amber' | 'blue' | 'rose';
}) {
  const toneClasses = {
    amber: 'ring-amber-200 bg-amber-50 text-amber-900',
    blue: 'ring-blue-200 bg-blue-50 text-blue-900',
    rose: 'ring-rose-200 bg-rose-50 text-rose-900',
  }[tone];

  return (
    <div className={`rounded-xl p-4 ring-1 ${toneClasses}`}>
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-2xl font-bold">{bucket.count}</span>
      </div>
      <p className="mt-1 text-xs opacity-80">{description}</p>
      {bucket.items.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs">
          {bucket.items.slice(0, 6).map((item) => (
            <li key={item.id} className="truncate">
              {item.name} — {item.talkTitle}
            </li>
          ))}
          {bucket.items.length > 6 && <li className="opacity-70">+{bucket.items.length - 6} more</li>}
        </ul>
      )}
    </div>
  );
}

function DashboardPage({ adminKey }: { adminKey: string }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const reload = useCallback(() => {
    adminGetDashboard(adminKey)
      .then((data) => {
        setStats(data);
        setLastUpdated(new Date());
        setError('');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load dashboard'));
  }, [adminKey]);

  useEffect(() => {
    reload();
    const interval = setInterval(reload, POLL_MS);
    return () => clearInterval(interval);
  }, [reload]);

  const outstanding = stats
    ? stats.acceptedUnscheduled.count + stats.unscored.count + stats.missingMaterials.count
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Onboarding dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">
              Outstanding speaker onboarding tasks, refreshed every {POLL_MS / 1000}s.
              {lastUpdated && <> Last updated {lastUpdated.toLocaleTimeString()}.</>}
            </p>
          </div>
          <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to submissions
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        {!stats && !error && <p className="mt-6 text-sm text-slate-500">Loading…</p>}

        {stats && (
          <>
            <div className="mt-6 rounded-xl bg-white p-5 ring-1 ring-slate-200">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium text-slate-500">Total outstanding tasks</span>
                <span className="text-3xl font-bold text-slate-900">{outstanding}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">across {stats.totalSubmissions} total submissions</p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Bucket
                title="Accepted, unscheduled"
                description="Accepted talks with no agenda slot yet."
                bucket={stats.acceptedUnscheduled}
                tone="amber"
              />
              <Bucket
                title="Awaiting review"
                description="Submitted / under review with no AI or evaluator score yet."
                bucket={stats.unscored}
                tone="blue"
              />
              <Bucket
                title="Missing materials"
                description="Accepted but bio or talk description is incomplete."
                bucket={stats.missingMaterials}
                tone="rose"
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <>
      <Head>
        <title>Dashboard — Sessionboard</title>
      </Head>
      <AdminLogin>{(adminKey) => <DashboardPage adminKey={adminKey} />}</AdminLogin>
    </>
  );
}
