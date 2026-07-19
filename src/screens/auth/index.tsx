import { useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, GoogleSigninButton, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';

import { Text, TextInput, TouchableOpacity, View } from '@/tw';
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

export function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signInWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        throw new Error('No identityToken.');
      }

      const { error, data } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        Alert.alert(error.message);
        return;
      }

      // Apple only provides the user's full name on the first sign-in.
      if (credential.fullName && data.user) {
        const nameParts = [
          credential.fullName.givenName,
          credential.fullName.middleName,
          credential.fullName.familyName,
        ].filter((part): part is string => !!part);
        const fullName = nameParts.join(' ');

        if (fullName) {
          await supabase.auth.updateUser({
            data: {
              full_name: fullName,
              given_name: credential.fullName.givenName,
              family_name: credential.fullName.familyName,
            },
          });
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', data.user.id);
        }
      }
    } catch (error) {
      if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
        return;
      }
      Alert.alert((error as Error).message);
    }
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response) || !response.data.idToken) {
        return;
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.data.idToken,
      });

      if (error) Alert.alert(error.message);
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code === statusCodes.IN_PROGRESS) {
        return;
      }
      Alert.alert((error as Error).message);
    }
  }

  return (
    <View className="flex-1 mt-10 p-3 bg-[#333333]">
      <View className="py-1 self-stretch mt-5">
        <Text className="text-[16px] font-semibold text-[#86939e] mb-1.5">Email</Text>
        <TextInput
          onChangeText={(text) => setEmail(text)}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          className="border border-[#86939e] rounded p-3 text-[16px] text-white"
        />
      </View>
      <View className="py-1 self-stretch">
        <Text className="text-[16px] font-semibold text-[#86939e] mb-1.5">Password</Text>
        <TextInput
          onChangeText={(text) => setPassword(text)}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          className="border border-[#86939e] rounded p-3 text-[16px] text-white"
        />
      </View>
      <View className="py-1 self-stretch mt-5">
        <TouchableOpacity
          className={`bg-[#2089dc] rounded p-3 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={signInWithEmail}
          disabled={loading}>
          <Text className="text-white text-[16px] font-semibold">Sign in</Text>
        </TouchableOpacity>
      </View>
      <View className="py-1 self-stretch">
        <TouchableOpacity
          className={`bg-[#2089dc] rounded p-3 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={signUpWithEmail}
          disabled={loading}>
          <Text className="text-white text-[16px] font-semibold">Sign up</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'ios' && (
        <View className="py-1 self-stretch mt-5">
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={4}
            style={{ height: 44 }}
            onPress={signInWithApple}
          />
        </View>
      )}

      {Platform.OS !== 'web' && (
        <View className="py-1 self-stretch">
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signInWithGoogle}
          />
        </View>
      )}
    </View>
  );
}
