import { useEffect, useState } from 'react';
import { Alert, Switch } from 'react-native';

import { Text, TextInput, TouchableOpacity, View } from '@/tw';
import { Avatar } from '@/components/avatar';
import {
  seedColorSchemeFromProfile,
  setColorSchemeOverride,
  setColorSchemeSyncUserId,
} from '@/hooks/color-scheme-store';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/utils/supabase';

export function Account({ userId, email }: { userId: string; email?: string }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const scheme = useColorScheme();

  useEffect(() => {
    if (userId) getProfile();
    setColorSchemeSyncUserId(userId);
    return () => setColorSchemeSyncUserId(null);
  }, [userId]);

  async function getProfile() {
    try {
      setLoading(true);

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, avatar_url, dark_mode`)
        .eq('id', userId)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setAvatarUrl(data.avatar_url);
        seedColorSchemeFromProfile(data.dark_mode);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({ username, avatar_url }: { username: string; avatar_url: string }) {
    try {
      setLoading(true);

      const updates = {
        id: userId,
        username,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      Alert.alert((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function updateDarkMode(darkMode: boolean) {
    setColorSchemeOverride(darkMode ? 'dark' : 'light');
  }

  return (
    <View className="flex-1 mt-10 p-3 bg-background">
      <View>
        <Avatar
          size={200}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url);
            updateProfile({ username, avatar_url: url });
          }}
        />
      </View>
      <View className="py-1 self-stretch mt-5">
        <Text className="text-[16px] font-semibold text-text-secondary mb-1.5">Email</Text>
        <TextInput
          value={email ?? ''}
          editable={false}
          selectTextOnFocus={false}
          className="border rounded p-3 text-[16px] bg-background-element border-background-selected text-text-secondary"
        />
      </View>
      <View className="py-1 self-stretch">
        <Text className="text-[16px] font-semibold text-text-secondary mb-1.5">Username</Text>
        <TextInput
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          className="border border-background-selected rounded p-3 text-[16px] text-text"
        />
      </View>

      <View className="flex-row items-center justify-between py-1 self-stretch mt-5">
        <Text className="text-[16px] font-semibold text-text-secondary">Dark mode</Text>
        <Switch value={scheme === 'dark'} onValueChange={updateDarkMode} />
      </View>

      <View className="py-1 self-stretch mt-5">
        <TouchableOpacity
          className={`bg-[#2089dc] rounded p-3 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={() => updateProfile({ username, avatar_url: avatarUrl })}
          disabled={loading}>
          <Text className="text-white text-[16px] font-semibold">
            {loading ? 'Loading ...' : 'Update'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="py-1 self-stretch">
        <TouchableOpacity className="bg-[#2089dc] rounded p-3 items-center" onPress={() => supabase.auth.signOut()}>
          <Text className="text-white text-[16px] font-semibold">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
