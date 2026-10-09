import type { Session } from '@supabase/supabase-js';
import { createContext, use, useEffect, useState, type PropsWithChildren } from 'react';

import { queryClient } from '@/data/query-client';
import { supabase } from '@/utils/supabase';

type SessionState = {
  session: Session | null;
  isLoading: boolean;
};

const SessionContext = createContext<SessionState>({ session: null, isLoading: true });

export function useSession() {
  return use(SessionContext);
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<SessionState>({ session: null, isLoading: true });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setState({ session: data.session, isLoading: false });
    });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Cached server data belongs to the previous user.
      if (event === 'SIGNED_OUT') queryClient.clear();
      setState({ session, isLoading: false });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <SessionContext value={state}>{children}</SessionContext>;
}

export async function signOut() {
  await supabase.auth.signOut();
}
