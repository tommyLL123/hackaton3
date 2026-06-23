import type {
  DashboardSummary,
  LoginResponse,
  PaginatedTropelsResponse,
  SectorListResponse,
  SectorStoryResponse,
  Signal,
  SignalFeedResponse,
  SignalStatus,
  SignalType,
  Severity,
  Species,
  TropelSort,
  User,
  VitalState,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const TOKEN_KEY = 'tropelcare_token';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(message: string, status: number, code: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getStoredToken(): string | null {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
}

function ensureBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiClientError('Falta configurar VITE_API_BASE_URL.', 0, 'MISSING_API_BASE_URL');
  }
  return API_BASE_URL.replace(/\/$/, '');
}

async function parseError(response: Response): Promise<ApiClientError> {
  const payload = (await response.json().catch(() => null)) as unknown;
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const data = payload as { message?: unknown; error?: unknown; details?: unknown };
    return new ApiClientError(
      typeof data.message === 'string' ? data.message : 'Error de API.',
      response.status,
      typeof data.error === 'string' ? data.error : 'API_ERROR',
      data.details && typeof data.details === 'object' ? (data.details as Record<string, unknown>) : {},
    );
  }
  return new ApiClientError(`Error HTTP ${response.status}`, response.status, 'HTTP_ERROR');
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({ Accept: 'application/json' });
  const shouldSendBody = options.body !== undefined;
  if (shouldSendBody) headers.set('Content-Type', 'application/json');

  if (options.auth !== false) {
    const token = getStoredToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${ensureBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: shouldSendBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!response.ok) throw await parseError(response);
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

function buildSearch(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export interface LoginPayload {
  teamCode: string;
  email: string;
  password: string;
}

export interface TropelQuery {
  page: number;
  size: 10 | 20 | 50;
  species?: Species;
  vitalState?: VitalState;
  sectorId?: string;
  q?: string;
  sort: TropelSort;
}

export interface SignalFeedQuery {
  cursor?: string | null;
  limit: number;
  signalType?: SignalType;
  severity?: Severity;
  status?: SignalStatus;
  q?: string;
}

export const api = {
  login(payload: LoginPayload, signal?: AbortSignal): Promise<LoginResponse> {
    return request<LoginResponse>('/auth/login', { method: 'POST', body: payload, auth: false, signal });
  },
  me(signal?: AbortSignal): Promise<User> {
    return request<User>('/auth/me', { signal });
  },
  dashboard(signal?: AbortSignal): Promise<DashboardSummary> {
    return request<DashboardSummary>('/dashboard/summary', { signal });
  },
  sectors(signal?: AbortSignal): Promise<SectorListResponse> {
    return request<SectorListResponse>('/sectors', { signal });
  },
  tropels(query: TropelQuery, signal?: AbortSignal): Promise<PaginatedTropelsResponse> {
    return request<PaginatedTropelsResponse>(`/tropels${buildSearch({
      page: query.page,
      size: query.size,
      species: query.species,
      vitalState: query.vitalState,
      sectorId: query.sectorId,
      q: query.q,
      sort: query.sort,
    })}`, { signal });
  },
  signalFeed(query: SignalFeedQuery, signal?: AbortSignal): Promise<SignalFeedResponse> {
    return request<SignalFeedResponse>(`/signals/feed${buildSearch({
      cursor: query.cursor,
      limit: query.limit,
      signalType: query.signalType,
      severity: query.severity,
      status: query.status,
      q: query.q,
    })}`, { signal });
  },
  signal(id: string, signal?: AbortSignal): Promise<Signal> {
    return request<Signal>(`/signals/${encodeURIComponent(id)}`, { signal });
  },
  updateSignalStatus(id: string, status: SignalStatus, signal?: AbortSignal): Promise<Signal> {
    return request<Signal>(`/signals/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
      signal,
    });
  },
  sectorStory(id: string, signal?: AbortSignal): Promise<SectorStoryResponse> {
    return request<SectorStoryResponse>(`/sectors/${encodeURIComponent(id)}/story`, { signal });
  },
};

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrió un error inesperado.';
}
