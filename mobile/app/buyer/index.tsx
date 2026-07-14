import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

export default function BuyerFlow() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Buyer flow — Phase 3</Text>
    </View>
  );
}
