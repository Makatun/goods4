import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { Text, TextInput, TouchableOpacity, View } from '@/tw';
import { Avatar } from '@/components/avatar';
import { supabase } from '@/utils/supabase';

export function Account({ userId, email }: { userId: string; email?: string }) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userId) getProfile();
  }, [userId]);

  async function getProfile() {
    try {
      setLoading(true);

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', userId)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);

      const updates = {
        id: userId,
        username,
        website,
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

  return (
    <View className="flex-1 mt-10 p-3 bg-[#333333]">
      <View>
        <Avatar
          size={200}
          url={avatarUrl}
          onUpload={(url: string) => {
            setAvatarUrl(url);
            updateProfile({ username, website, avatar_url: url });
          }}
        />
      </View>
      <View className="py-1 self-stretch mt-5">
        <Text className="text-[16px] font-semibold text-[#86939e] mb-1.5">Email</Text>
        <TextInput
          value={email ?? ''}
          editable={false}
          selectTextOnFocus={false}
          className="border rounded p-3 text-[16px] bg-[#f2f2f2] border-[#d1d1d1] text-[#9e9e9e]"
        />
      </View>
      <View className="py-1 self-stretch">
        <Text className="text-[16px] font-semibold text-[#86939e] mb-1.5">Username</Text>
        <TextInput
          value={username || ''}
          onChangeText={(text) => setUsername(text)}
          className="border border-[#86939e] rounded p-3 text-[16px] text-white"
        />
      </View>
      <View className="py-1 self-stretch">
        <Text className="text-[16px] font-semibold text-[#86939e] mb-1.5">Website</Text>
        <TextInput
          value={website || ''}
          onChangeText={(text) => setWebsite(text)}
          className="border border-[#86939e] rounded p-3 text-[16px] text-white"
        />
      </View>

      <View className="py-1 self-stretch mt-5">
        <TouchableOpacity
          className={`bg-[#2089dc] rounded p-3 items-center ${loading ? 'opacity-50' : ''}`}
          onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
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
