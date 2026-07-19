import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Text, TouchableOpacity, View } from '@/tw';
import { Image } from '@/tw/image';
import { supabase } from '@/utils/supabase';

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

export function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60);

      if (error) {
        throw error;
      }

      setAvatarUrl(data.signedUrl);
    } catch (error) {
      console.log('Error downloading image: ', (error as Error).message);
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: true,
        quality: 1,
        exif: false,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log('User cancelled image picker.');
        return;
      }

      const image = result.assets[0];

      if (!image.uri) {
        throw new Error('No image uri!');
      }

      const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer());

      const fileExt = image.uri?.split('.').pop()?.toLowerCase() ?? 'jpeg';
      const path = `${Date.now()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arraybuffer, {
          contentType: image.mimeType ?? 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      onUpload(data.path);
    } catch (error) {
      if (error) {
        Alert.alert((error as Error).message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <View className="items-center justify-center mt-5">
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          className="rounded-[5px] overflow-hidden max-w-full mb-5 object-cover"
          style={avatarSize}
        />
      ) : (
        <View
          className="rounded-[5px] overflow-hidden max-w-full mb-5 bg-[#333] border border-solid border-[rgb(200,200,200)]"
          style={avatarSize}
        />
      )}
      <View>
        <TouchableOpacity
          className={`bg-[#2089dc] rounded p-3 items-center ${uploading ? 'opacity-50' : ''}`}
          onPress={uploadAvatar}
          disabled={uploading}>
          <Text className="text-white text-[16px] font-semibold">
            {uploading ? 'Uploading ...' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
