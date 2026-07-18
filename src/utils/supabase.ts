import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

// Expo Router renders src/app on the server for web, where `window` doesn't
// exist. AsyncStorage's web backend touches `window` unconditionally, so it
// must only be used once running in an actual browser/native runtime.
const isServer = typeof window === 'undefined'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  {
    auth: {
      storage: isServer ? undefined : AsyncStorage,
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  })
