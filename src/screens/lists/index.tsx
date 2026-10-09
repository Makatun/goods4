import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';

// Lists, search and joining arrive in milestone 2 (docs/design.md).
export function ListsScreen() {
  return (
    <Screen withTabBar>
      <ThemedText type="subtitle">Lists</ThemedText>
      <ThemedText themeColor="textSecondary">You haven&apos;t joined any Lists yet.</ThemedText>
    </Screen>
  );
}
