export type SessionData = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
  };
};

const SESSION_KEY = 'faztudo_session';

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.sessionStorage;
}

export function saveSession(data: SessionData) {
  storage()?.setItem(SESSION_KEY, JSON.stringify(data));
  // Remove sessions created by older builds, where credentials persisted after
  // the browser was closed.
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function clearSession() {
  storage()?.removeItem(SESSION_KEY);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function getSession(): SessionData | null {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
  const json = storage()?.getItem(SESSION_KEY);
  if (!json) return null;

  try {
    return JSON.parse(json) as SessionData;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export function getCurrentUser() {
  return getSession()?.user ?? null;
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}
