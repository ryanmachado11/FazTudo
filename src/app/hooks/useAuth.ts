import { useEffect, useState } from 'react';
import { getCurrentUser, getSession, isLoggedIn, saveSession, clearSession } from '../lib/session';
import { apiGet } from '../lib/api';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!isLoggedIn()) {
        setLoading(false);
        return;
      }

      try {
        const session = getSession();
        if (!session) {
          setUser(null);
          return;
        }
        const profile = await apiGet<{ id: string; name: string; email: string; role: string }>('/api/auth/me');
        const merged = { ...session.user, ...profile } as AuthUser;
        saveSession({
          accessToken: session.accessToken,
          user: merged,
        });
        setUser(merged);
      } catch {
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  return { user, loading };
}
