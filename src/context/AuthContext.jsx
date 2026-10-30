import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking, null = signed out, object = signed in
  const [session, setSession] = useState(undefined);
  // Remembers which user the profile belongs to, so we never show a stale one.
  const [profileState, setProfileState] = useState({ userId: null, data: null });

  // 1) Track the Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 2) Load the matching row from `profiles` (includes `role`)
  const userId = session?.user?.id ?? null;
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error('Could not load profile:', error);
        setProfileState({ userId, data: error ? null : data });
      });
    return () => { cancelled = true; };
  }, [userId]);

  const profile = profileState.userId === userId ? profileState.data : null;
  const loading = session === undefined || (!!userId && profileState.userId !== userId);

  const logOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session: session ?? null, profile, loading, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
