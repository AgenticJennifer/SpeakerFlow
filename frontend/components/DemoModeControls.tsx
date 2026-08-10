import { useState } from 'react';
import { adminClearDemo, adminSeedDemo, ApiError } from '@/lib/api';

interface DemoModeControlsProps {
  adminKey: string;
  hasDemoData: boolean;
  onChanged: () => void;
}

// One-click judge demo mode: seed a realistic set of submissions (mixed
// statuses, AI assists, evaluator notes) or wipe exactly those records.
export default function DemoModeControls({ adminKey, hasDemoData, onChanged }: DemoModeControlsProps) {
  const [busy, setBusy] = useState<'seed' | 'clear' | null>(null);
  const [error, setError] = useState('');

  async function run(action: 'seed' | 'clear') {
    setBusy(action);
    setError('');
    try {
      if (action === 'seed') await adminSeedDemo(adminKey);
      else await adminClearDemo(adminKey);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Demo data action failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {hasDemoData ? (
        <button
          onClick={() => run('clear')}
          disabled={busy !== null}
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
        >
          {busy === 'clear' ? 'Clearing…' : 'Clear demo data'}
        </button>
      ) : (
        <button
          onClick={() => run('seed')}
          disabled={busy !== null}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {busy === 'seed' ? 'Loading demo…' : '✨ Load demo data'}
        </button>
      )}
    </div>
  );
}
