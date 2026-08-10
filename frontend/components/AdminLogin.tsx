import { FormEvent, ReactNode, useEffect, useState } from 'react';

const STORAGE_KEY = 'sessionboard_admin_key';

export function useAdminKey() {
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAdminKey(sessionStorage.getItem(STORAGE_KEY));
    setHydrated(true);
  }, []);

  function saveAdminKey(key: string) {
    sessionStorage.setItem(STORAGE_KEY, key);
    setAdminKey(key);
  }

  function clearAdminKey() {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey(null);
  }

  return { adminKey, hydrated, saveAdminKey, clearAdminKey };
}

interface AdminLoginProps {
  children: (adminKey: string, clearAdminKey: () => void) => ReactNode;
}

export default function AdminLogin({ children }: AdminLoginProps) {
  const { adminKey, hydrated, saveAdminKey, clearAdminKey } = useAdminKey();
  const [input, setInput] = useState('');

  if (!hydrated) return null;

  if (!adminKey) {
    function handleSubmit(event: FormEvent) {
      event.preventDefault();
      if (input.trim()) saveAdminKey(input.trim());
    }

    return (
      <div className="mx-auto mt-24 max-w-sm rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold text-slate-900">Admin access</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the admin key (demo-grade — not per-admin auth) to continue.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Admin key"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  return <>{children(adminKey, clearAdminKey)}</>;
}
