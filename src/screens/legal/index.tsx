import { StyleSheet } from 'react-native';

import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { LegalDocument } from '@/screens/legal/content';

export function LegalPage({ document }: { document: LegalDocument }) {
  return (
    <Screen>
      {document.draft && (
        <ThemedView type="backgroundSelected" style={styles.banner}>
          <ThemedText type="smallBold">DRAFT — not yet reviewed. Not legal advice.</ThemedText>
        </ThemedView>
      )}
      <ThemedText type="subtitle">{document.title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Last updated {document.updated}
      </ThemedText>
      {document.sections.map((section) => (
        <ThemedView key={section.heading} style={styles.section}>
          <ThemedText type="smallBold">{section.heading}</ThemedText>
          {section.paragraphs.map((paragraph) => (
            <ThemedText key={paragraph}>{paragraph}</ThemedText>
          ))}
        </ThemedView>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  banner: { padding: Spacing.three, borderRadius: Spacing.two },
  section: { gap: Spacing.two },
});
