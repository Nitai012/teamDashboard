import {
  type AssessmentDto,
  type AssessmentInput,
  type ImportResultDto,
  type MemberDto,
  type MemberInput,
  type MemberSkillInput,
  type MemberUpdateInput,
  type SettingsDto,
  type SkillDto,
} from '@team-radar/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers:
        body === undefined
          ? { Accept: 'application/json' }
          : { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'Network error');
  }

  if (!response.ok) throw new ApiError(response.status, response.statusText);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const enc = encodeURIComponent;

export const api = {
  session: () => request<{ authenticated: true }>('GET', '/auth/session'),
  login: (password: string) => request<void>('POST', '/auth/login', { password }),
  logout: () => request<void>('POST', '/auth/logout'),

  members: {
    list: () => request<MemberDto[]>('GET', '/members'),
    create: (input: MemberInput) => request<MemberDto>('POST', '/members', input),
    update: (id: string, input: MemberUpdateInput) =>
      request<MemberDto>('PATCH', `/members/${enc(id)}`, input),
    remove: (id: string) => request<void>('DELETE', `/members/${enc(id)}`),
    removeExamples: () => request<{ removed: number }>('DELETE', '/members/examples'),
    setSkill: (id: string, skillId: string, input: MemberSkillInput) =>
      request<MemberDto>('PUT', `/members/${enc(id)}/skills/${enc(skillId)}`, input),
  },

  skills: {
    list: () => request<SkillDto[]>('GET', '/skills'),
    create: (name: string) => request<SkillDto>('POST', '/skills', { name }),
    rename: (id: string, name: string) =>
      request<SkillDto>('PATCH', `/skills/${enc(id)}`, { name }),
    remove: (id: string) => request<void>('DELETE', `/skills/${enc(id)}`),
  },

  assessments: {
    list: () => request<AssessmentDto[]>('GET', '/assessments'),
    save: (memberId: string, date: string, input: AssessmentInput) =>
      request<AssessmentDto>('PUT', `/members/${enc(memberId)}/assessments/${enc(date)}`, input),
    remove: (id: string) => request<void>('DELETE', `/assessments/${enc(id)}`),
  },

  settings: {
    get: () => request<SettingsDto>('GET', '/settings'),
    update: (axes: string[]) => request<SettingsDto>('PUT', '/settings', { axes }),
  },

  backup: {
    import: (data: unknown) => request<ImportResultDto>('POST', '/backup/import', data),
  },
};

export const BACKUP_JSON_URL = '/api/backup';
export const BACKUP_CSV_URL = '/api/backup/csv';

/** A short Hebrew explanation of a failed request, for toasts and forms. */
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return 'משהו השתבש. נסה שוב';
  switch (error.status) {
    case 0:
      return 'אין חיבור לשרת. בדוק את החיבור ונסה שוב';
    case 400:
      return 'חלק מהפרטים לא תקינים';
    case 401:
      return 'צריך להתחבר מחדש';
    case 404:
      return 'הרשומה כבר לא קיימת';
    case 409:
      return 'כבר קיים פריט בשם הזה';
    case 413:
      return 'הקובץ גדול מדי';
    case 429:
      return 'יותר מדי ניסיונות. נסה שוב בעוד דקה';
    default:
      return 'השרת לא הצליח לשמור. נסה שוב בעוד רגע';
  }
}
