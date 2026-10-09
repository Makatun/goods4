import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, GoogleSigninButton, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { Link } from 'expo-router';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/utils/supabase';

// @react-native-google-signin/google-signin has no web implementation, and
// Expo Router server-renders this module for web too — only configure it
// when actually running on a native platform.
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
}

function showError(message: string) {
  if (Platform.OS === 'web') window.alert(message);
  else Alert.alert(message);
}

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showError(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) showError(error.message);
    setLoading(false);
  }

  // Web has no native SDKs: redirect to the provider and back; supabase-js reads the session from the URL.
  async function signInWithOAuthRedirect(provider: 'google' | 'apple') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) showError(error.message);
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identityToken.');

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });
      if (error) showError(error.message);
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      showError((error as Error).message);
    }
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response) || !response.data.idToken) return;

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });
      if (error) showError(error.message);
    } catch (error) {
      if ((error as { code?: string }).code === statusCodes.IN_PROGRESS) return;
      showError((error as Error).message);
    }
  }

  return (
    <Screen>
      <ThemedText type="subtitle">Goods</ThemedText>
      <ThemedText themeColor="textSecondary">Review anything, together.</ThemedText>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="email@address.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
      />
      <Button title="Sign in" onPress={signInWithEmail} loading={loading} />
      <Button title="Create account" variant="secondary" onPress={signUpWithEmail} disabled={loading} />

      {Platform.OS === 'ios' && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={Spacing.three}
          style={styles.appleButton}
          onPress={signInWithApple}
        />
      )}
      {Platform.OS !== 'web' && (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={signInWithGoogle}
        />
      )}
      {Platform.OS === 'web' && (
        <>
          <Button title="Continue with Google" variant="secondary" onPress={() => signInWithOAuthRedirect('google')} />
          <Button title="Continue with Apple" variant="secondary" onPress={() => signInWithOAuthRedirect('apple')} />
        </>
      )}

      <View style={styles.legal}>
        <Link href="/terms">
          <ThemedText type="linkPrimary">Terms of Use</ThemedText>
        </Link>
        <Link href="/privacy">
          <ThemedText type="linkPrimary">Privacy Policy</ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  appleButton: { height: 48 },
  legal: { flexDirection: 'row', gap: Spacing.four, justifyContent: 'center' },
});
