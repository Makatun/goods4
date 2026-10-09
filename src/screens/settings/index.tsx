import { Link, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useMyProfile } from '@/data/profile';
import { signOut, useSession } from '@/data/session';

export function SettingsScreen() {
  const { session } = useSession();
  const profile = useMyProfile();

  return (
    <Screen withTabBar>
      <ThemedText type="subtitle">Settings</ThemedText>

      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">@{profile.data?.username}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {session?.user.email}
        </ThemedText>
      </ThemedView>

      <ThemedView type="backgroundElement" style={styles.card}>
        <SettingsLink href="/terms" label="Terms of Use" />
        <SettingsLink href="/privacy" label="Privacy Policy" />
        <SettingsLink href="/delete-account" label="Delete account" />
      </ThemedView>

      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

function SettingsLink({ href, label }: { href: Href; label: string }) {
  return (
    <View>
      <Link href={href}>
        <ThemedText type="linkPrimary">{label}</ThemedText>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.two },
});
