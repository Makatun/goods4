import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useColorSchemeOverride } from './color-scheme-store';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const override = useColorSchemeOverride();
  const system = useRNColorScheme();

  if (!hasHydrated) {
    return 'light';
  }

  return override ?? system;
}
