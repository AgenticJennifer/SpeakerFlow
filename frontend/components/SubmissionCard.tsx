import Link from 'next/link';
import type { Submission } from '@/lib/api';
import StatusBadge from './StatusBadge';

export default function SubmissionCard({ submission }: { submission: Submission }) {
  return (
    <Link
      href={`/admin/${submission.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{submission.talkTitle}</p>
        <p className="truncate text-sm text-slate-500">
          {submission.name} · {submission.email}
        </p>
      </div>
      <div className="ml-4 flex shrink-0 items-center gap-3">
        {submission.aiSuggestedScore != null && (
          <span className="text-xs text-slate-400">AI: {submission.aiSuggestedScore}/10</span>
        )}
        <StatusBadge status={submission.status} />
      </div>
    </Link>
  );
}
