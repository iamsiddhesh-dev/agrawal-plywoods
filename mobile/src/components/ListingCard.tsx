import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import type { PublicListing } from '../types';

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 12,
  },
  body: {
    padding: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  price: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '700',
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
