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
const SESSION_EVENT = 'faztudo:session';

export function subscribeSession(listener: () => void) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (event: StorageEvent) => {
    if (event.key === SESSION_KEY || event.key === null) listener();
  };
  window.addEventListener(SESSION_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SESSION_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}

function notifySession() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SESSION_EVENT));
}

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
  notifySession();
}

export function clearSession() {
  storage()?.removeItem(SESSION_KEY);
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
  notifySession();
}

export function getSession(): SessionData | null {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY);
  }
  const json = storage()?.getItem(SESSION_KEY);
  if (!json) return null;

  try {
    const data = JSON.parse(json);
    if (typeof data?.accessToken !== 'string' || !data.accessToken.trim()
      || typeof data.user?.id !== 'string' || !data.user.id
      || typeof data.user?.name !== 'string'
      || typeof data.user?.email !== 'string'
      || !['CLIENT', 'PROVIDER', 'ADMIN'].includes(data.user?.role)) {
      return null;
    }
    return data as SessionData;
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
