import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
});

export default function SellerFlow() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Seller flow — Phase 4</Text>
    </SafeAreaView>
  );
}
