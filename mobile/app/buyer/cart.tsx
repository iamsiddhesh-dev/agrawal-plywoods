import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCart, type CartItem } from '../../src/lib/cartStore';
import QtyStepper from '../../src/components/QtyStepper';
import { colors, fonts, radii, spacing, shadow } from '../../src/theme';

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
  rightCol: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  removeBox: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radii.sm,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  removeBoxText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.danger,
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
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.black,
  },
  totalValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.gold,
  },
  confirmBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,26,26,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadow,
  },
  confirmTitle: {
    fontFamily: fonts.heading,
    fontSize: 18,
    color: colors.black,
    textAlign: 'center',
  },
  confirmMessage: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    width: '100%',
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radii.sm,
    alignItems: 'center',
  },
  confirmBtnCancel: {
    backgroundColor: colors.ivoryDark,
  },
  confirmBtnCancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.black,
  },
  confirmBtnRemove: {
    backgroundColor: colors.danger,
  },
  confirmBtnRemoveText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.white,
  },
});

export default function Cart() {
  const { items, updateQty, removeFromCart } = useCart();
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const total = items.reduce((sum, i) => sum + i.pricePerUnit * i.qty, 0);
  const confirmItem = items.find((i) => i.listingId === confirmRemoveId) ?? null;

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
      </View>
      <View style={styles.rightCol}>
        <QtyStepper
          value={item.qty}
          max={item.quantityAvailable}
          onChange={(next) => updateQty(item.listingId, next)}
        />
        <TouchableOpacity
          style={styles.removeBox}
          activeOpacity={0.7}
          onPress={() => setConfirmRemoveId(item.listingId)}
        >
          <Text style={styles.removeBoxText}>Remove</Text>
        </TouchableOpacity>
      </View>
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

      <Modal
        visible={!!confirmItem}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmRemoveId(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Remove item?</Text>
            <Text style={styles.confirmMessage}>
              {confirmItem ? `Remove "${confirmItem.name}" from your cart?` : ''}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnCancel]}
                onPress={() => setConfirmRemoveId(null)}
              >
                <Text style={styles.confirmBtnCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, styles.confirmBtnRemove]}
                onPress={() => {
                  if (confirmRemoveId) removeFromCart(confirmRemoveId);
                  setConfirmRemoveId(null);
                }}
              >
                <Text style={styles.confirmBtnRemoveText}>Sure, Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
