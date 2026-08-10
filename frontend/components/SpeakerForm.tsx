import { FormEvent, useState } from 'react';
import type { SpeakerFormValues } from '@/lib/api';

interface SpeakerFormProps {
  mode: 'create' | 'edit';
  initialValues?: SpeakerFormValues;
  disabled?: boolean;
  disabledReason?: string;
  submitting?: boolean;
  onSubmit: (values: SpeakerFormValues) => void;
}

const EMPTY_VALUES: SpeakerFormValues = {
  name: '',
  email: '',
  bio: '',
  talkTitle: '',
  talkDescription: '',
};

export default function SpeakerForm({
  mode,
  initialValues,
  disabled = false,
  disabledReason,
  submitting = false,
  onSubmit,
}: SpeakerFormProps) {
  const [values, setValues] = useState<SpeakerFormValues>(initialValues || EMPTY_VALUES);

  function update<K extends keyof SpeakerFormValues>(key: K, value: SpeakerFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {disabled && disabledReason && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          {disabledReason}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Name</label>
          <input
            type="text"
            required
            disabled={disabled}
            value={values.name}
            onChange={(e) => update('name', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            disabled={disabled}
            value={values.email}
            onChange={(e) => update('email', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Bio</label>
        <textarea
          rows={3}
          disabled={disabled}
          value={values.bio}
          onChange={(e) => update('bio', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Talk title</label>
        <input
          type="text"
          required
          disabled={disabled}
          value={values.talkTitle}
          onChange={(e) => update('talkTitle', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Talk description</label>
        <textarea
          rows={5}
          disabled={disabled}
          value={values.talkDescription}
          onChange={(e) => update('talkDescription', e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-500"
        />
      </div>

      {!disabled && (
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Submit talk' : 'Save changes'}
        </button>
      )}
    </form>
  );
}
