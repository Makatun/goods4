import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

/** Scrollable page body: safe-area aware, centred and capped at MaxContentWidth for wide web screens. */
export function Screen({ children, withTabBar = false }: PropsWithChildren<{ withTabBar?: boolean }>) {
  const insets = useSafeAreaInsets();
  return (
    <ThemedView style={styles.fill}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four + (withTabBar ? BottomTabInset : 0),
          },
        ]}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { paddingHorizontal: Spacing.three, alignItems: 'center' },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
});
