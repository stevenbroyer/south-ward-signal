'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminUser {
  id: string;
  email: string;
}

export function useAdminAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check if we have a valid session by hitting the overview endpoint
    // If it returns 401, we're not authenticated
    async function checkSession() {
      try {
        const res = await fetch('/api/admin/overview');
        if (res.ok) {
          const data = await res.json();
          // Session is valid — user info is embedded in the response
          setUser(data._user ?? null);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setUser(null);
    window.location.href = '/admin/login';
  }, []);

  const setUserFromLogin = useCallback((u: AdminUser) => {
    setUser(u);
    setLoading(false);
  }, []);

  return { user, loading, signOut, setUserFromLogin };
}
