import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
});

export default function ListingDetail() {
  const { listingId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Listing detail — Phase 3</Text>
      <Text style={{ marginTop: 8, color: '#666' }}>ID: {listingId}</Text>
    </View>
  );
}
