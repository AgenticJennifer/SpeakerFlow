import type { SubmissionStatus } from '@/lib/api';

const STYLES: Record<SubmissionStatus, string> = {
  Submitted: 'bg-slate-100 text-slate-700 ring-slate-300',
  'Under Review': 'bg-blue-50 text-blue-700 ring-blue-300',
  Accepted: 'bg-green-50 text-green-700 ring-green-300',
  Rejected: 'bg-red-50 text-red-700 ring-red-300',
};

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {status}
    </span>
  );
}
