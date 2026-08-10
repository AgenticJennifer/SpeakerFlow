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
