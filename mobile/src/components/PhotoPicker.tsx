import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  preview: {
    width: '100%',
    aspectRatio: 1.2,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
  },
  pickButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  pickButtonText: {
    color: '#2196F3',
    fontWeight: '600',
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
          <ActivityIndicator color="#2196F3" />
        ) : (
          <Text style={styles.pickButtonText}>{previewUri ? 'Change Photo' : 'Add Photo'}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
