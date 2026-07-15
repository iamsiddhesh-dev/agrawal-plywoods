import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radii, spacing, shadow } from '../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  body: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    margin: spacing.lg,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
    fontSize: 15,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    ...shadow,
  },
  avatarText: {
    fontFamily: fonts.heading,
    fontSize: 36,
    color: colors.white,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: 22,
    color: colors.black,
    marginTop: spacing.lg,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
    fontSize: 14,
  },
  value: {
    fontFamily: fonts.bodySemiBold,
    color: colors.black,
    fontSize: 14,
  },
});

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ Back</Text>
      </TouchableOpacity>
      <View style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>G</Text>
        </View>
        <Text style={styles.name}>Guest User</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>+91 98765 43210</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>guest@example.com</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>Not set</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
