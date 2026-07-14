import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    marginVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerButton: {
    backgroundColor: '#4CAF50',
  },
  sellerButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default function RolePicker() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Welcome</Text>

      <TouchableOpacity
        style={[styles.button, styles.buyerButton]}
        onPress={() => router.push('/buyer')}
      >
        <Text style={styles.buttonText}>I'm a Buyer</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.sellerButton]}
        onPress={() => router.push('/seller')}
      >
        <Text style={styles.buttonText}>I'm a Seller</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
