import { Switch } from 'react-native';

import { View } from '@/tw';
import { ThemedText } from './themed-text';
import { setColorSchemeOverride } from '@/hooks/color-scheme-store';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function ThemeSwitch() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View className="flex-row items-center justify-between">
      <ThemedText type="small">Dark mode</ThemedText>
      <Switch value={isDark} onValueChange={(value) => setColorSchemeOverride(value ? 'dark' : 'light')} />
    </View>
  );
}
