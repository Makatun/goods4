import { useEffect, useState } from 'react';

import { View } from '@/tw';
import { Account } from '@/screens/account';
import { Auth } from '@/screens/auth';
import { supabase } from '@/utils/supabase';

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getClaims().then(({ data }) => {
      const claims = data?.claims;
      if (claims) {
        setUserId(claims.sub);
        setEmail(claims.email);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async () => {
      const { data } = await supabase.auth.getClaims();
      const claims = data?.claims;
      if (claims) {
        setUserId(claims.sub);
        setEmail(claims.email);
      } else {
        setUserId(null);
        setEmail(undefined);
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return (
    <View className="flex-1">{userId ? <Account key={userId} userId={userId} email={email} /> : <Auth />}</View>
  );
}
