import type { Submission, SubmissionStatus } from '@/lib/api';

const STATUS_ORDER: SubmissionStatus[] = ['Submitted', 'Under Review', 'Accepted', 'Rejected'];

// Status palette: fixed semantic colors (state, not arbitrary category identity).
// Never color-alone — every bar carries a text label alongside the fill.
const BAR_COLOR: Record<SubmissionStatus, string> = {
  Submitted: 'bg-slate-400',
  'Under Review': 'bg-blue-500',
  Accepted: 'bg-green-500',
  Rejected: 'bg-red-500',
};

export default function StatusBreakdownChart({ submissions }: { submissions: Submission[] }) {
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: submissions.filter((s) => s.status === status).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Submissions by status</h2>
        <span className="text-xs text-slate-400">{submissions.length} total</span>
      </div>
      <div className="space-y-2.5">
        {counts.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-3" title={`${status}: ${count}`}>
            <span className="w-28 shrink-0 text-xs font-medium text-slate-600">{status}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${BAR_COLOR[status]}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="w-6 shrink-0 text-right text-xs font-semibold text-slate-700">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
