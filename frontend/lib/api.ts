const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

export type SubmissionStatus = 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected';

export interface Submission {
  id: string;
  name: string;
  email: string;
  bio: string;
  talkTitle: string;
  talkDescription: string;
  status: SubmissionStatus;
  editToken: string;
  aiSuggestedScore: number | null;
  aiRationale: string;
  aiSummary: string;
  aiSuggestedTrack: string;
  evaluatorScore: number | null;
  evaluatorNotes: string;
  createdTime: string;
}

export interface SpeakerFormValues {
  name: string;
  email: string;
  bio: string;
  talkTitle: string;
  talkDescription: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed with status ${response.status}`, response.status);
  }

  return data as T;
}

export { ApiError };

export function submitSpeaker(values: SpeakerFormValues) {
  return request<{ submission: Submission }>('/api/speakers', {
    method: 'POST',
    body: JSON.stringify(values),
  });
}

export function getSubmissionByToken(token: string) {
  return request<{ submission: Submission }>(`/api/speakers/by_token/${token}`);
}

export function updateSubmissionByToken(token: string, values: SpeakerFormValues) {
  return request<{ submission: Submission }>(`/api/speakers/by_token/${token}`, {
    method: 'PATCH',
    body: JSON.stringify(values),
  });
}

function adminHeaders(adminKey: string) {
  return { 'x-admin-key': adminKey };
}

export function adminListSubmissions(adminKey: string, status?: SubmissionStatus) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request<{ submissions: Submission[] }>(`/api/admin/submissions${query}`, {
    headers: adminHeaders(adminKey),
  });
}

export function adminGetSubmission(adminKey: string, id: string) {
  return request<{ submission: Submission }>(`/api/admin/submissions/${id}`, {
    headers: adminHeaders(adminKey),
  });
}

export function adminUpdateStatus(adminKey: string, id: string, status: SubmissionStatus) {
  return request<{ submission: Submission }>(`/api/admin/submissions/${id}/status`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify({ status }),
  });
}

export function adminUpdateEvaluation(
  adminKey: string,
  id: string,
  values: { evaluatorScore?: number; evaluatorNotes?: string }
) {
  return request<{ submission: Submission }>(`/api/admin/submissions/${id}/evaluation`, {
    method: 'PATCH',
    headers: adminHeaders(adminKey),
    body: JSON.stringify(values),
  });
}

export function adminScoreSubmission(adminKey: string, id: string) {
  return request<{ submission: Submission }>(`/api/admin/submissions/${id}/score`, {
    method: 'POST',
    headers: adminHeaders(adminKey),
  });
}

export function adminSeedDemo(adminKey: string) {
  return request<{ created: number }>('/api/admin/demo/seed', {
    method: 'POST',
    headers: adminHeaders(adminKey),
  });
}

export function adminClearDemo(adminKey: string) {
  return request<{ deleted: number }>('/api/admin/demo', {
    method: 'DELETE',
    headers: adminHeaders(adminKey),
  });
}

// Client-side near-duplicate detection for the review dashboard: flags talks
// whose titles share most of their significant words. Cheap (no API call) and
// deliberately conservative — it surfaces likely resubmissions/copies, the
// human reviewer decides.
const STOP_WORDS = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'for', 'and', 'to', 'with', 'your', 'is']);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

export function findDuplicateIds(submissions: Submission[]): Set<string> {
  const duplicates = new Set<string>();
  for (let i = 0; i < submissions.length; i++) {
    for (let j = i + 1; j < submissions.length; j++) {
      const a = titleTokens(submissions[i].talkTitle);
      const b = titleTokens(submissions[j].talkTitle);
      if (a.size === 0 || b.size === 0) continue;
      let shared = 0;
      a.forEach((t) => {
        if (b.has(t)) shared++;
      });
      const overlap = shared / Math.min(a.size, b.size);
      if (overlap >= 0.7) {
        duplicates.add(submissions[i].id);
        duplicates.add(submissions[j].id);
      }
    }
  }
  return duplicates;
}
