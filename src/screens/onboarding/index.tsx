import { Checkbox } from 'expo-checkbox';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { profileErrorMessage, useCompleteOnboarding, useMyProfile } from '@/data/profile';
import { signOut } from '@/data/session';

/** Account setup required before using the app: username, 16+ and the current Terms of Use (`ACC-1`). */
export function OnboardingScreen() {
  const profile = useMyProfile();
  const complete = useCompleteOnboarding();
  const [username, setUsername] = useState(profile.data?.username ?? '');
  const [isAdult, setIsAdult] = useState(!!profile.data?.ageConfirmedAt);
  const [acceptsTerms, setAcceptsTerms] = useState(false);
  // A returning user who only needs to accept updated Terms keeps their username.
  const termsOnly = !!profile.data?.username && !!profile.data.ageConfirmedAt;

  return (
    <Screen>
      <ThemedText type="subtitle">{termsOnly ? 'Updated Terms of Use' : 'Set up your account'}</ThemedText>

      {!termsOnly && (
        <>
          <TextField
            label="Username"
            value={username}
            onChangeText={(text) => setUsername(text.toLowerCase())}
            placeholder="e.g. wine.lover"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={30}
            error={complete.error ? profileErrorMessage(complete.error) : undefined}
          />
          <Agreement checked={isAdult} onChange={setIsAdult}>
            <ThemedText>I am 16 or older</ThemedText>
          </Agreement>
        </>
      )}

      <Agreement checked={acceptsTerms} onChange={setAcceptsTerms}>
        <ThemedText>
          I accept the{' '}
          <Link href="/terms">
            <ThemedText type="linkPrimary">Terms of Use</ThemedText>
          </Link>
          , which allow no objectionable content or abusive behaviour
        </ThemedText>
      </Agreement>

      <Button
        title="Continue"
        onPress={() => complete.mutate({ username: termsOnly ? profile.data!.username! : username })}
        disabled={!acceptsTerms || !isAdult || username.trim().length < 3}
        loading={complete.isPending}
      />
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

function Agreement({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onChange(!checked)}
      style={styles.agreement}>
      <Checkbox value={checked} onValueChange={onChange} color={checked ? '#208AEF' : undefined} />
      <View style={styles.agreementText}>{children}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  agreement: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  agreementText: { flex: 1 },
});
