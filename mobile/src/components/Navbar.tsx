import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart } from '../lib/cartStore';
import { colors, fonts, spacing } from '../theme';

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.ivory,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.gold,
    backgroundColor: colors.ivory,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    width: 30,
    height: 30,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.black,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.ivoryDark,
  },
  icon: {
    fontSize: 17,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontFamily: fonts.bodyBold,
  },
  backBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: colors.black,
    fontFamily: fonts.bodyBold,
  },
});

export default function Navbar({
  role,
  showBack,
}: {
  role: 'buyer' | 'seller';
  showBack?: boolean;
}) {
  const { items } = useCart();
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.bar}>
        <View style={styles.left}>
          {showBack ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
          ) : null}
          <Image source={require('../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Broker</Text>
        </View>

        <View style={styles.right}>
          {showBack ? (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/buyer/cart')}>
              <Text style={styles.icon}>🛒</Text>
              {cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ) : role === 'buyer' ? (
            <>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/buyer/search')}>
                <Text style={styles.icon}>🔍</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/buyer/cart')}>
                <Text style={styles.icon}>🛒</Text>
                {cartCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{cartCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/buyer/profile')}>
                <Text style={styles.icon}>👤</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/seller/profile')}>
              <Text style={styles.icon}>👤</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
