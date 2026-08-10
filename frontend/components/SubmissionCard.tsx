import Link from 'next/link';
import type { Submission } from '@/lib/api';
import StatusBadge from './StatusBadge';

export default function SubmissionCard({
  submission,
  possibleDuplicate = false,
}: {
  submission: Submission;
  possibleDuplicate?: boolean;
}) {
  return (
    <Link
      href={`/admin/${submission.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-slate-900">{submission.talkTitle}</p>
          {possibleDuplicate && (
            <span
              title="Another submission has a very similar title"
              className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-inset ring-amber-200"
            >
              possible duplicate
            </span>
          )}
        </div>
        {submission.aiSummary ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{submission.aiSummary}</p>
        ) : null}
        <p className="truncate text-sm text-slate-500">
          {submission.name} · {submission.email}
        </p>
      </div>
      <div className="ml-4 flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-3">
          {submission.aiSuggestedScore != null && (
            <span className="text-xs text-slate-400">AI: {submission.aiSuggestedScore}/10</span>
          )}
          <StatusBadge status={submission.status} />
        </div>
        {submission.aiSuggestedTrack && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
            {submission.aiSuggestedTrack}
          </span>
        )}
      </div>
    </Link>
  );
}
