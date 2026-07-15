import React from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, type CartItem } from '../../src/lib/cartStore';
import QtyStepper from '../../src/components/QtyStepper';
import { colors, fonts, radii, spacing } from '../../src/theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.ivory,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backText: {
    fontFamily: fonts.bodySemiBold,
    color: colors.gold,
    fontSize: 16,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.black,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: colors.ivoryDark,
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.black,
  },
  price: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.gold,
    marginTop: 2,
  },
  removeText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.danger,
    marginTop: 6,
  },
  totalBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.muted,
  },
  totalValue: {
    fontFamily: fonts.heading,
    fontSize: 20,
    color: colors.black,
  },
});

export default function Cart() {
  const { items, updateQty, removeFromCart } = useCart();
  const total = items.reduce((sum, i) => sum + i.pricePerUnit * i.qty, 0);

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.card}>
      {item.photoUrl ? (
        <Image source={{ uri: item.photoUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.image} />
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.price}>₹{item.pricePerUnit} / {item.unit}</Text>
        <TouchableOpacity onPress={() => removeFromCart(item.listingId)}>
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
      <QtyStepper
        value={item.qty}
        max={item.quantityAvailable}
        onChange={(next) => updateQty(item.listingId, next)}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Your Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      {items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Your cart is empty</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.listingId}
            contentContainerStyle={styles.list}
            renderItem={renderItem}
          />
          <View style={styles.totalBar}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
