import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { PublicListing } from '../types';
import { colors, fonts, radii, shadow } from '../theme';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.ivoryDark,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.ivoryDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: colors.muted,
    fontSize: 12,
    fontFamily: fonts.body,
  },
  body: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontFamily: fonts.bodySemiBold,
    color: colors.black,
  },
  price: {
    fontSize: 13,
    color: colors.gold,
    fontFamily: fonts.bodyBold,
    marginTop: 4,
  },
});

export default function ListingCard({ listing }: { listing: PublicListing }) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: '/buyer/[listingId]',
          params: { listingId: listing.id, listing: JSON.stringify(listing) },
        })
      }
      activeOpacity={0.7}
    >
      {listing.photo_url ? (
        <Image source={{ uri: listing.photo_url }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No photo</Text>
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {listing.name}
        </Text>
        <Text style={styles.price}>
          ₹{listing.price_per_unit} / {listing.unit}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
