import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, shadow, spacing } from '../src/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ivory,
    padding: spacing.xl,
  },
  welcome: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 30,
    marginTop: spacing.sm,
    marginBottom: spacing.xxl,
    color: colors.black,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 18,
    marginVertical: spacing.sm,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadow,
  },
  buyerButton: {
    backgroundColor: colors.gold,
  },
  sellerButton: {
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  buttonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.white,
  },
});

export default function RolePicker() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcome}>Welcome</Text>
      <Text style={styles.title}>Who are you?</Text>

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
