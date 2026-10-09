import { useMutation, useQuery } from '@tanstack/react-query';

import { queryClient } from '@/data/query-client';
import { useSession } from '@/data/session';
import type { Tables } from '@/utils/database.types';
import { supabase } from '@/utils/supabase';

// Bump when the app-level Terms of Use change; every User must re-accept (`ACC-1`).
export const APP_TERMS_VERSION = 1;

export type Profile = {
  id: string;
  username: string | null;
  ageConfirmedAt: string | null;
  appTermsAcceptedVersion: number | null;
  suspended: boolean;
  suspensionReason: string | null;
};

function toProfile(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    username: row.username,
    ageConfirmedAt: row.age_confirmed_at,
    appTermsAcceptedVersion: row.app_terms_accepted_version,
    suspended: row.suspended,
    suspensionReason: row.suspension_reason,
  };
}

/** A User may use the app only after choosing a username, confirming 16+ and accepting the current Terms (`ACC-1`). */
export function isOnboarded(profile: Profile | undefined) {
  return (
    !!profile?.username &&
    !!profile.ageConfirmedAt &&
    (profile.appTermsAcceptedVersion ?? 0) >= APP_TERMS_VERSION
  );
}

const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export function useMyProfile() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileKey(userId),
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId!).single();
      if (error) throw error;
      return toProfile(data);
    },
  });
}

export function useCompleteOnboarding() {
  const { session } = useSession();
  const userId = session?.user.id;
  return useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          username: username.trim().toLowerCase(),
          age_confirmed_at: new Date().toISOString(),
          app_terms_accepted_version: APP_TERMS_VERSION,
        })
        .eq('id', userId!)
        .select('*')
        .single();
      if (error) throw error;
      return toProfile(data);
    },
    onSuccess: (profile) => queryClient.setQueryData(profileKey(userId), profile),
  });
}

/** Turns database constraint errors into messages a person can act on. */
export function profileErrorMessage(error: unknown) {
  const e = error as { code?: string; message?: string };
  if (e.code === '23505') return 'That username is taken.';
  if (e.code === '23514') return 'Usernames are 3–30 characters: lowercase letters, digits, "_" or ".".';
  return e.message ?? 'Something went wrong.';
}
