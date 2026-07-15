import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, radii } from '../theme';

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  preview: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: radii.sm,
    backgroundColor: colors.ivoryDark,
  },
  pickButton: {
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radii.sm,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  pickButtonText: {
    color: colors.gold,
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
});

export default function PhotoPicker({
  onPhotoSelected,
  disabled,
}: {
  onPhotoSelected: (base64: string, previewUri: string) => void;
  disabled?: boolean;
}) {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const handlePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to add a photo.');
      return;
    }

    setPicking(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.6,
        base64: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) return;

      setPreviewUri(asset.uri);
      onPhotoSelected(asset.base64, asset.uri);
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={styles.container}>
      {previewUri ? <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" /> : null}
      <TouchableOpacity
        style={[styles.pickButton, { marginTop: previewUri ? 10 : 0 }]}
        onPress={handlePick}
        disabled={disabled || picking}
      >
        {picking ? (
          <ActivityIndicator color={colors.gold} />
        ) : (
          <Text style={styles.pickButtonText}>{previewUri ? 'Change Photo' : 'Add Photo'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
