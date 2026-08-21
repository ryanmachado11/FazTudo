import { getAccessToken } from './session';

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
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };

  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique se a API está rodando e tente novamente.',
      0,
      null,
    );
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

    const message = payload?.error || response.statusText;
    throw new ApiError(message, response.status, payload);
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
