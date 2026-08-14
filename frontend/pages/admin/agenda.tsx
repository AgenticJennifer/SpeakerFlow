import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminLogin from '@/components/AdminLogin';
import {
  adminGetAgenda,
  adminListSubmissions,
  adminUpdateSchedule,
  ApiError,
  type AgendaSession,
  type Submission,
} from '@/lib/api';

interface ScheduleDraft {
  sessionDay: string;
  sessionRoom: string;
  sessionStart: string;
  sessionEnd: string;
}

function emptyDraft(s: Submission): ScheduleDraft {
  return {
    sessionDay: s.sessionDay,
    sessionRoom: s.sessionRoom,
    sessionStart: s.sessionStart,
    sessionEnd: s.sessionEnd,
  };
}

// Client-side mirror of the backend's conflict rule (same day + room +
// overlapping [start, end) time range), so an optimistic move can predict
// conflicts instantly instead of waiting on the API round-trip.
function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return aStart < bEnd && bStart < aEnd;
}

function timeToMin(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minToTime(min: number) {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const DAY_START_MIN = 8 * 60;
const DAY_END_MIN = 18 * 60;

// Earliest open gap, in the target's own day + room, that fits its duration
// — scanning the other already-scheduled sessions in that room/day.
function findNextOpenSlot(target: AgendaSession, others: AgendaSession[]): ScheduleDraft | null {
  const duration = timeToMin(target.sessionEnd) - timeToMin(target.sessionStart);
  if (duration <= 0) return null;

  const sameRoomDay = others
    .filter((s) => s.id !== target.id && s.sessionDay === target.sessionDay && s.sessionRoom === target.sessionRoom)
    .map((s) => [timeToMin(s.sessionStart), timeToMin(s.sessionEnd)] as const)
    .sort((a, b) => a[0] - b[0]);

  let cursor = DAY_START_MIN;
  for (const [busyStart, busyEnd] of sameRoomDay) {
    if (busyStart - cursor >= duration) {
      return {
        sessionDay: target.sessionDay,
        sessionRoom: target.sessionRoom,
        sessionStart: minToTime(cursor),
        sessionEnd: minToTime(cursor + duration),
      };
    }
    cursor = Math.max(cursor, busyEnd);
  }
  if (DAY_END_MIN - cursor >= duration) {
    return {
      sessionDay: target.sessionDay,
      sessionRoom: target.sessionRoom,
      sessionStart: minToTime(cursor),
      sessionEnd: minToTime(cursor + duration),
    };
  }
  return null;
}

function ScheduleForm({
  submission,
  onSave,
}: {
  submission: Submission;
  onSave: (draft: ScheduleDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ScheduleDraft>(emptyDraft(submission));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await onSave(draft);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:items-end">
      <label className="text-xs text-slate-500">
        Day
        <input
          type="date"
          value={draft.sessionDay}
          onChange={(e) => setDraft({ ...draft, sessionDay: e.target.value })}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-xs text-slate-500">
        Room
        <input
          type="text"
          value={draft.sessionRoom}
          onChange={(e) => setDraft({ ...draft, sessionRoom: e.target.value })}
          placeholder="Room A"
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-xs text-slate-500">
        Start
        <input
          type="time"
          value={draft.sessionStart}
          onChange={(e) => setDraft({ ...draft, sessionStart: e.target.value })}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <label className="text-xs text-slate-500">
        End
        <input
          type="time"
          value={draft.sessionEnd}
          onChange={(e) => setDraft({ ...draft, sessionEnd: e.target.value })}
          className="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </label>
      <button
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {error && <p className="col-span-full text-xs text-red-600">{error}</p>}
    </div>
  );
}

function AgendaPage({ adminKey }: { adminKey: string }) {
  const [accepted, setAccepted] = useState<Submission[]>([]);
  const [sessions, setSessions] = useState<AgendaSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'saved'>('idle');
  const [resolving, setResolving] = useState<string | null>(null);

  const reload = useCallback(() => {
    setLoading(true);
    setError('');
    return Promise.all([adminListSubmissions(adminKey, 'Accepted'), adminGetAgenda(adminKey)])
      .then(([{ submissions }, { sessions }]) => {
        setAccepted(submissions);
        setSessions(sessions);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load agenda'))
      .finally(() => setLoading(false));
  }, [adminKey]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Applies a schedule change optimistically — the chip moves and conflicts
  // recompute on the client immediately, the API call confirms in the
  // background, and a failed save rolls the UI back to its prior snapshot.
  // Shared by manual Save (ScheduleForm) and the Auto-Resolve button.
  const applySchedule = useCallback(
    async (submissionId: string, draft: ScheduleDraft) => {
      const prevSessions = sessions;
      const submission = accepted.find((s) => s.id === submissionId) || sessions.find((s) => s.id === submissionId);
      if (!submission) return;

      const optimisticSelf: AgendaSession = { ...submission, ...draft, conflictsWith: [] } as AgendaSession;
      const rest = sessions.filter((s) => s.id !== submissionId);
      const recomputed = [...rest, optimisticSelf].map((s) => ({
        ...s,
        conflictsWith: [...rest, optimisticSelf]
          .filter((o) => o.id !== s.id && o.sessionDay === s.sessionDay && o.sessionRoom === s.sessionRoom && overlaps(s.sessionStart, s.sessionEnd, o.sessionStart, o.sessionEnd))
          .map((o) => o.id),
      }));

      setSessions(recomputed);
      setSyncState('syncing');
      try {
        await adminUpdateSchedule(adminKey, submissionId, draft);
        setSyncState('saved');
        setTimeout(() => setSyncState('idle'), 2000);
        await reload();
      } catch (err) {
        setSessions(prevSessions);
        setSyncState('idle');
        throw err;
      }
    },
    [accepted, sessions, adminKey, reload]
  );

  async function handleAutoResolve(target: AgendaSession) {
    const slot = findNextOpenSlot(target, sessions);
    if (!slot) {
      setError(`No open slot found for "${target.talkTitle}" in ${target.sessionRoom} on ${target.sessionDay} between 08:00–18:00. Try a different room.`);
      return;
    }
    setResolving(target.id);
    setError('');
    try {
      await applySchedule(target.id, slot);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to auto-resolve conflict');
    } finally {
      setResolving(null);
    }
  }

  const conflictIds = useMemo(() => new Set(sessions.filter((s) => s.conflictsWith.length > 0).map((s) => s.id)), [sessions]);
  const scheduledIds = useMemo(() => new Set(sessions.map((s) => s.id)), [sessions]);
  const unscheduled = accepted.filter((s) => !scheduledIds.has(s.id));

  const byDay = useMemo(() => {
    const groups = new Map<string, Map<string, AgendaSession[]>>();
    for (const s of sessions) {
      if (!groups.has(s.sessionDay)) groups.set(s.sessionDay, new Map());
      const byRoom = groups.get(s.sessionDay)!;
      if (!byRoom.has(s.sessionRoom)) byRoom.set(s.sessionRoom, []);
      byRoom.get(s.sessionRoom)!.push(s);
    }
    for (const byRoom of groups.values()) {
      for (const list of byRoom.values()) list.sort((a, b) => a.sessionStart.localeCompare(b.sessionStart));
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sessions]);

  const sortedFlat = useMemo(
    () =>
      [...sessions].sort(
        (a, b) => a.sessionDay.localeCompare(b.sessionDay) || a.sessionStart.localeCompare(b.sessionStart)
      ),
    [sessions]
  );

  function SessionChip({ s }: { s: AgendaSession }) {
    const conflicted = conflictIds.has(s.id);
    return (
      <div
        className={`rounded-lg px-3 py-2 text-sm ring-1 transition-shadow ${
          conflicted
            ? 'bg-red-50 text-red-800 ring-2 ring-red-400 shadow-[0_0_0_4px_rgba(248,113,113,0.25)]'
            : 'bg-white text-slate-800 ring-slate-200'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">
            {s.sessionStart}–{s.sessionEnd}
          </span>
          {conflicted && <span className="text-xs font-semibold text-red-700">⚠ CONFLICT</span>}
        </div>
        <div className="mt-0.5 text-slate-600">{s.talkTitle}</div>
        <div className="text-xs text-slate-400">{s.name}</div>
        {conflicted && (
          <button
            onClick={() => handleAutoResolve(s)}
            disabled={resolving === s.id}
            className="mt-2 w-full rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {resolving === s.id ? 'Resolving…' : '⚡ Auto-resolve'}
          </button>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Agenda &amp; schedule</h1>
            <p className="mt-1 text-sm text-slate-500">
              Accepted talks only. Overlapping day + room + time is flagged automatically.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {syncState !== 'idle' && (
              <span className={`text-xs ${syncState === 'syncing' ? 'text-slate-400' : 'text-green-600'}`} aria-live="polite">
                {syncState === 'syncing' ? 'Syncing…' : 'Saved ✓'}
              </span>
            )}
            <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-700">
              ← Back to submissions
            </Link>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
        )}

        {conflictIds.size > 0 && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {conflictIds.size} session{conflictIds.size === 1 ? '' : 's'} have a scheduling conflict — same day, room, and overlapping time. Use ⚡ Auto-resolve on a conflicted session to move it to the next open slot.
          </div>
        )}

        {unscheduled.length > 0 && (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <h2 className="text-sm font-semibold text-amber-900">Needs scheduling ({unscheduled.length})</h2>
            <div className="mt-3 space-y-4">
              {unscheduled.map((s) => (
                <div key={s.id} className="rounded-lg bg-white p-3 ring-1 ring-amber-100">
                  <div className="text-sm font-medium text-slate-800">{s.talkTitle}</div>
                  <div className="text-xs text-slate-400">{s.name}</div>
                  <div className="mt-2">
                    <ScheduleForm submission={s} onSave={(draft) => applySchedule(s.id, draft)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Scheduled ({sessions.length})</h2>
          <div className="flex gap-1 rounded-full bg-white p-1 ring-1 ring-slate-200">
            {(['grid', 'list'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                  view === v ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

        {!loading && sessions.length === 0 && (
          <p className="mt-4 text-sm text-slate-500">No sessions scheduled yet.</p>
        )}

        {!loading && view === 'grid' && (
          <div className="mt-4 space-y-6">
            {byDay.map(([day, byRoom]) => (
              <div key={day} className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <h3 className="text-sm font-semibold text-slate-900">{day}</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...byRoom.entries()].map(([room, list]) => (
                    <div key={room}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{room}</div>
                      <div className="mt-2 space-y-2">
                        {list.map((s) => (
                          <SessionChip key={s.id} s={s} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && view === 'list' && (
          <div className="mt-4 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Day</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Room</th>
                  <th className="px-4 py-2">Talk</th>
                  <th className="px-4 py-2">Speaker</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedFlat.map((s) => (
                  <tr key={s.id} className={conflictIds.has(s.id) ? 'bg-red-50 shadow-[inset_2px_0_0_0_rgb(248,113,113)]' : ''}>
                    <td className="px-4 py-2">{s.sessionDay}</td>
                    <td className="px-4 py-2">
                      {s.sessionStart}–{s.sessionEnd}
                    </td>
                    <td className="px-4 py-2">{s.sessionRoom}</td>
                    <td className="px-4 py-2">{s.talkTitle}</td>
                    <td className="px-4 py-2">{s.name}</td>
                    <td className="px-4 py-2">
                      {conflictIds.has(s.id) && (
                        <button
                          onClick={() => handleAutoResolve(s)}
                          disabled={resolving === s.id}
                          className="rounded-md bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {resolving === s.id ? 'Resolving…' : '⚡ Auto-resolve'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-slate-700">Reschedule</h2>
            <div className="mt-3 space-y-4">
              {sortedFlat.map((s) => (
                <div key={s.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                  <div className="text-sm font-medium text-slate-800">{s.talkTitle}</div>
                  <div className="text-xs text-slate-400">{s.name}</div>
                  <div className="mt-2">
                    <ScheduleForm submission={s} onSave={(draft) => applySchedule(s.id, draft)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function AdminAgendaPage() {
  return (
    <>
      <Head>
        <title>Agenda — Sessionboard</title>
      </Head>
      <AdminLogin>{(adminKey) => <AgendaPage adminKey={adminKey} />}</AdminLogin>
    </>
  );
}
