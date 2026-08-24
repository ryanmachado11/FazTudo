import { clearSession, getAccessToken } from './session';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export type ApiFieldErrors = Record<string, string[]>;

export type ApiErrorPayload = {
  error?: string;
  issues?: {
    fieldErrors?: ApiFieldErrors;
    formErrors?: string[];
  };
};

export class ApiError extends Error {
  status: number;
  payload: ApiErrorPayload | null;

  constructor(message: string, status: number, payload: ApiErrorPayload | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

function getAuthHeaders(): Record<string, string> {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!path.startsWith('/')) {
    throw new ApiError('Caminho de API inválido.', 0, null);
  }

  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch (error) {
    throw new ApiError(
      error instanceof DOMException && error.name === 'AbortError'
        ? 'A solicitação demorou demais. Tente novamente.'
        : 'Não foi possível conectar ao servidor. Verifique se a API está rodando e tente novamente.',
      0,
      null,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    if (!payload && response.status >= 500) {
      throw new ApiError(
        'Não foi possível conectar ao servidor. Verifique se a API está rodando e tente novamente.',
        response.status,
        null,
      );
    }

    if (response.status === 401) {
      clearSession();
    }

    const message = payload?.error || response.statusText || 'Falha na solicitação.';
    throw new ApiError(message, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function apiPut<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
