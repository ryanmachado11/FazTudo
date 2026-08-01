type SessionData = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const SESSION_KEY = 'faztudo_session';

export function saveSession(data: SessionData) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): SessionData | null {
  const json = localStorage.getItem(SESSION_KEY);
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

export function getRefreshToken(): string | null {
  return getSession()?.refreshToken ?? null;
}

export function getCurrentUser() {
  return getSession()?.user ?? null;
}

export function isLoggedIn() {
  return Boolean(getAccessToken());
}
